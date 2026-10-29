import hashlib
import io
import json
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch
from xml.sax.saxutils import escape
import original_records as repo
import importaciones_backend as backend


def workbook(contract='32-2026', budget='100', administrator='Test administrator', extra='original text'):
    fields=json.loads(Path('DICCIONARIO_COLUMNAS_ALIA.json').read_text(encoding='utf8'))['fields']
    values={'process':'PROC-TEST','project':'PROJECT','contract':contract,'contract_alt':contract,
            'process_name':'Test process','contract_administrator':administrator,
            'budget':budget,'committed':'80','accrued':'30','advance':'5'}
    def letter(n):
        result=''
        while n:
            n,r=divmod(n-1,26);result=chr(65+r)+result
        return result
    columns=[(letter(i),d['id'],d['label'],values.get(k,'')) for i,(k,d) in enumerate(fields.items(),1)]
    columns.append((letter(len(columns)+1),601,'Arbitrary source column',extra))
    def row(num,index):
        cells=''.join(f'<c r="{col}{num}" t="inlineStr"><is><t>{escape(str(v[index]))}</t></is></c>' for v in columns for col in [v[0]])
        return f'<row r="{num}">{cells}</row>'
    xml='<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+row(11,2)+row(12,1)+row(13,3)+'</sheetData></worksheet>'
    stream=io.BytesIO()
    with zipfile.ZipFile(stream,'w') as z:
        z.writestr(zipfile.ZipInfo('xl/workbook.xml',(2000,1,1,0,0,0)),'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheets><sheet name="MATRIZ CONSOLIDADA"/></sheets></workbook>')
        z.writestr(zipfile.ZipInfo('xl/worksheets/sheet1.xml',(2000,1,1,0,0,0)),xml)
    return stream.getvalue()

class OriginalsTest(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
    def tearDown(self):self.tmp.cleanup()
    def seed(self,year=2026,month=10,content=None):
        content=content or workbook();batch=repo.seal(self.root,content,'test.xlsx',year,month)
        repo.register_cut(self.root,batch,year,month,'test.xlsx')
        return batch
    def test_all_columns_and_exact_source(self):
        data=workbook();b=self.seed(content=data);out=repo.detail(self.root,'32-2026')
        self.assertEqual(out['records'][0]['raw_columns']['601'],'original text')
        self.assertEqual(len(out['records'][0]['raw_columns']),len(out['column_catalog']))
        self.assertEqual((self.root/'originals'/b['sha256']/'source.xlsx').read_bytes(),data)
        self.assertEqual(out['records'][0]['contract_administrator'],'Test administrator')
        self.assertEqual({c['mapped_field']:c['id'] for c in out['column_catalog'] if c['mapped_field']}['accrued'],500)
    def test_chronological_across_years_not_import_order(self):
        self.seed(2027,1);self.seed(2026,12,workbook(budget='200'))
        out=repo.detail(self.root,'32-2026');self.assertEqual((out['year'],out['month']),(2027,1));self.assertEqual(out['records'][0]['budget'],100)
    def test_identical_workbook_in_two_periods_has_cut_provenance(self):
        data=workbook();self.seed(2026,10,data);self.seed(2027,1,data)
        out=repo.detail(self.root)
        self.assertEqual(out['records'][0]['reportDate'],'2027-01-01')
        self.assertEqual(len(list((self.root/'originals').iterdir())),1)

    def test_no_fallback_to_older_contract(self):
        self.seed(2026,9);self.seed(2026,10,workbook(contract='OTHER'))
        self.assertEqual(repo.detail(self.root,'32-2026')['records'],[])
    def test_absent_metadata_not_invented(self):
        self.seed(content=workbook(administrator=''))
        self.assertEqual(repo.detail(self.root,'32-2026')['records'][0]['contract_administrator'],'')
    def test_duplicate_keeps_original_revision(self):
        b=self.seed();p=self.root/'original-cuts'/f"2026-10-{b['sha256']}-{repo.VERSION}.json";before=p.read_bytes()
        self.seed();self.assertEqual(p.read_bytes(),before)
        self.seed(content=workbook(budget='200'));self.assertEqual(len(list((self.root/'original-cuts').glob('*.json'))),2)
    def legacy(self,data):
        b=repo.seal(self.root,data,'test.xlsx',2026,10)
        rows=[backend.to_explorer(r) for r in b['records']]
        for r in rows:r.pop('raw_columns');r.pop('original_cells');r.pop('process_name');r.pop('contract_administrator')
        snap={'year':2026,'month':10,'date':'2026-10-01','sha256':b['sha256'],'records':rows,'file':'test.xlsx'}
        repo.atomic(self.root/'monthly/10.json',snap)
        repo.atomic(self.root/'manifest.json',{'months':{'10':{'sha256':b['sha256'],'file':'test.xlsx'}}})
        return snap
    def test_repair_exact_sha_and_legacy_unchanged(self):
        data=workbook();self.legacy(data);source=self.root/'sources';source.mkdir();(source/'test.xlsx').write_bytes(data)
        paths=[self.root/'monthly/10.json',self.root/'manifest.json'];before=[p.read_bytes() for p in paths]
        self.assertEqual(repo.repair(self.root,[source])['cuts'][0]['status'],'REBUILD_AVAILABLE')
        self.assertEqual(repo.repair(self.root,[source],True)['cuts'][0]['status'],'REBUILT')
        self.assertEqual([p.read_bytes() for p in paths],before)
        self.assertEqual(repo.detail(self.root)['coverage']['complete'],True)
    def test_wrong_source_and_unreconciled_import_not_published(self):
        data=workbook();snap=self.legacy(data);source=self.root/'sources';source.mkdir();(source/'test.xlsx').write_bytes(workbook(budget='999'))
        self.assertEqual(repo.repair(self.root,[source],True)['cuts'][0]['status'],'EXACT_SOURCE_REQUIRED')
        (source/'test.xlsx').write_bytes(data);snap['records'][0]['budget']=999;repo.atomic(self.root/'monthly/10.json',snap)
        with self.assertRaisesRegex(ValueError,'Financial reconciliation'):repo.repair(self.root,[source],True)
        with self.assertRaisesRegex(ValueError,'Original incompleto'):repo.detail(self.root)
    def test_manifest_failure_restores_previous_bytes(self):
        with patch.multiple(backend,DATA_ROOT=self.root,STAGING=self.root/'monthly',MANIFEST=self.root/'manifest.json'):
            backend.stage(workbook(),'10. test.xlsx','10')
            before=(self.root/'monthly/10.json').read_bytes()
            manifest=(self.root/'manifest.json').read_bytes()
            original=backend.write_json_atomic
            def fail_manifest(path,data):
                if path==self.root/'manifest.json':raise OSError('simulated disk failure')
                return original(path,data)
            with patch.object(backend,'write_json_atomic',side_effect=fail_manifest):
                with self.assertRaises(OSError):backend.stage(workbook(budget='200'),'10. test.xlsx','10')
            self.assertEqual((self.root/'monthly/10.json').read_bytes(),before)
            self.assertEqual((self.root/'manifest.json').read_bytes(),manifest)
            self.assertEqual(repo.detail(self.root)['records'][0]['budget'],100)

    def test_stage_idempotence_and_failed_validation(self):
        with patch.multiple(backend,DATA_ROOT=self.root,STAGING=self.root/'monthly',MANIFEST=self.root/'manifest.json'):
            first=backend.stage(workbook(),'10. test.xlsx','10')
            self.assertTrue(first['complete']);self.assertTrue(backend.stage(workbook(),'10. test.xlsx','10')['duplicate'])
            before=(self.root/'monthly/10.json').read_bytes()
            with self.assertRaises(Exception):backend.stage(b'PK broken','10. test.xlsx','10')
            self.assertEqual((self.root/'monthly/10.json').read_bytes(),before)

if __name__=='__main__':unittest.main()

"""Optional private-data verification. Prints only counts and equality results."""
import argparse
import hashlib
import json
from collections import Counter
from decimal import Decimal
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from original_records import read, load_cut, detail
from importador_matriz import rows_xlsx


def verify(root,sources):
    checks=[]
    manifest=read(root/'manifest.json',{})
    for key,meta in sorted(manifest['months'].items(),key=lambda x:int(x[0])):
        snapshot=read(root/'monthly'/f'{int(key):02d}.json')
        year=int(snapshot['year'])
        batch=load_cut(root,{'year':year,'month':int(key),'sha256':meta['sha256']})
        path=sources/Path(meta['file']).name
        assert hashlib.sha256(path.read_bytes()).hexdigest()==meta['sha256']
        original_rows={}
        for number,row in rows_xlsx(path):
            if number==12:
                ids={str(int(float(v))):col for col,v in row.items() if v and str(v).replace('.','',1).isdigit()}
            if number>=13:original_rows[number]=row
        fields={c['mapped_field']:str(c['id']) for c in batch['column_catalog'] if c.get('mapped_field')}
        for record in batch['records']:
            raw=original_rows[record['source_row']]
            assert record['raw_columns']=={i:raw.get(col,'') for i,col in ids.items()}
            for field in ('budget','committed','accrued'):
                assert Decimal(str(record[field])).quantize(Decimal('.01'))==Decimal(raw.get(ids[fields[field]],'0') or '0').quantize(Decimal('.01'))
        for c in ('32-2026','25-2026'):
            if int(key)!=10:continue
            result=detail(root,c)
            assert result['records'] and all(r['process_name'] and r['contract_administrator'] for r in result['records'])
        checks.append({'year':year,'month':int(key),'rows':len(batch['records']),'columns':len(ids),'all_raw_values_equal':True,'financial_columns_equal_at_cents':True,'source_hash_equal':True})
    latest=detail(root)
    grouped=Counter(r['contract'] for r in latest['records'] if r['contract'])
    multi=next(c for c,n in grouped.items() if n>1)
    result=detail(root,multi)
    assert len(result['records'])==grouped[multi]
    return {'status':'PASS','cuts':checks,'rows':sum(c['rows'] for c in checks),'multirow_contract_selection':True,'contracts_32_and_25_metadata':True}

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--source-dir',type=Path,required=True);ap.add_argument('--data-root',type=Path,default=Path.home()/'.alia_local_data');args=ap.parse_args()
    print(json.dumps(verify(args.data_root,args.source_dir)))

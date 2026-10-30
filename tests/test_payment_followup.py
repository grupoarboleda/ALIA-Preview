import copy
import unittest
from unittest.mock import patch
from decimal import Decimal
import payment_followup as p


def catalog():
    cols=[]
    for start in (508,523,538):
        cols.extend({'id':start+i,'label':name} for i,name in enumerate(p.MONTHS))
    for i in range(25):
        cols.extend({'id':237+i*8+off,'label':label} for off,label in ((0,'NÚMERO DE TRÁMITE'),(6,'FECHA DE TRANSFERENCIA DEL PAGO'),(7,'TOTAL PAGADO FACTURA')))
    return cols

def row(number=13,contract='C-1',process='PROC-1',planned='100',september='0',october='100',procedure='T-1',amount='100',date='2026-10-15'):
    raw={str(i):'0' for i in list(range(508,520))+list(range(523,535))+list(range(538,550))}
    raw.update({'531':planned,'516':planned,'546':september,'547':october})
    if procedure or amount or date:raw.update({'237':procedure,'243':date,'244':amount})
    return {'source_row':number,'contract_key':contract,'process_key':process,'process_name':'Synthetic process','contract_administrator':'Synthetic administrator','raw_columns':raw}

def batch(rows):return {'column_catalog':catalog(),'records':rows}

class FollowupTests(unittest.TestCase):
    def setUp(self):
        self.cuts=[{'year':2026,'month':9,'file':'September.xlsx','sha256':'sep'},{'year':2026,'month':10,'file':'October.xlsx','sha256':'oct'}]
        self.data={'sep':batch([row()]),'oct':batch([row(planned='0')])}
        self.a=patch.object(p,'existing_cuts',side_effect=lambda root:self.cuts);self.a.start()
        self.b=patch.object(p,'load_cut',side_effect=lambda root,cut:copy.deepcopy(self.data[cut['sha256']]));self.b.start()
    def tearDown(self):self.b.stop();self.a.stop()
    def run_analysis(self,**kw):return p.analyze(None,2026,9,**kw)
    def test_preserves_september_plan_and_follows_october_execution(self):
        report=self.run_analysis();r=report['rows'][0]
        self.assertEqual(report['plan_source']['sha256'],'sep');self.assertEqual(report['observed_source']['sha256'],'oct')
        self.assertEqual((r['planned'],r['execution_in_month'],r['execution_later']),(100,0,100))
        self.assertEqual(r['status'],'later');self.assertEqual(r['later_months'],[10]);self.assertEqual(r['payments'][0]['procedure'],'T-1')
        self.assertEqual(r['transferred_since_month'],100)
    def test_revision_can_be_selected_explicitly(self):
        r=self.run_analysis(plan_token=p.token(self.cuts[1]));self.assertEqual(r['rows'],[])
    def test_multiple_assignments_sum_programs_but_repeat_procedure_is_flagged(self):
        self.data['sep']['records'].append(row(number=14,planned='50'))
        self.data['oct']['records'].append(row(number=14,planned='0',october='50'))
        r=self.run_analysis()['rows'][0]
        self.assertEqual(r['planned'],150);self.assertEqual(r['execution_later'],150)
        self.assertEqual(r['transferred_since_month'],0);self.assertEqual(r['review_events'],2)
        self.assertTrue(all(e['ambiguous'] for e in r['payments']))
    def test_different_tramites_can_be_summed(self):
        self.data['sep']['records'].append(row(number=14,planned='50'))
        self.data['oct']['records'].append(row(number=14,planned='0',october='50',procedure='T-2',amount='50'))
        self.assertEqual(self.run_analysis()['rows'][0]['transferred_since_month'],150)
    def test_missing_dates_not_assumed_paid(self):
        self.data['oct']['records'][0]['raw_columns']['243']=''
        r=self.run_analysis()['rows'][0];self.assertEqual(r['transferred_since_month'],0);self.assertEqual(r['review_events'],1)
        self.assertIsNone(r['payments'][0]['month'])
    def test_missing_month_not_zero_and_later_execution_still_visible(self):
        self.data['oct']['records'][0]['raw_columns']['546']=''
        r=self.run_analysis()['rows'][0];self.assertIsNone(r['execution_in_month']);self.assertEqual(r['status'],'later')
    def test_future_months_are_unobserved(self):
        self.data['oct']['records'][0]['raw_columns']['548']='999'
        report=self.run_analysis();self.assertIsNone(report['rows'][0]['monthly'][10]['executed']);self.assertIsNone(report['chart'][10]['executed'])
    def test_no_contract_in_observation_keeps_scheduled_row(self):
        self.data['oct']['records']=[]
        r=self.run_analysis()['rows'][0];self.assertEqual(r['status'],'missing');self.assertIsNone(r['execution_later'])
    def test_advance_separate_unless_explicit(self):
        self.data['oct']['records'][0]['raw_columns'].update({'233':'ADV-1','234':'20','235':'2026-10-01'})
        self.assertEqual(self.run_analysis()['rows'][0]['transferred_since_month'],100)
        self.assertEqual(self.run_analysis(include_advance=True)['rows'][0]['transferred_since_month'],120)
    def test_initial_line_and_adjusted_line_are_different(self):
        self.data['sep']['records'][0]['raw_columns']['516']='120'
        self.assertEqual(self.run_analysis(basis='initial')['rows'][0]['planned'],120)
    def test_schema_and_unknown_cut_refused(self):
        with self.assertRaises(ValueError):self.run_analysis(plan_token='../data')
        self.data['oct']['column_catalog'][0]['label']='Wrong month'
        with self.assertRaisesRegex(ValueError,'catálogo'):self.run_analysis()
    def test_unused_zero_placeholders_not_fabricated_payments(self):
        self.data['oct']['records'][0]['raw_columns'].update({'245':'0','251':'0','252':'0'})
        self.assertEqual(len(self.run_analysis()['rows'][0]['payments']),1)
    def test_actual_case_label_preserved(self):
        for c in self.data['oct']['column_catalog']:
            if c['id']==261:c['label']='NÚMERO DE CASO'
        self.data['oct']['records'][0]['raw_columns'].update({'261':'CASE-1','267':'2026-10-20','268':'25'})
        r=self.run_analysis()['rows'][0]
        self.assertEqual(r['payments'][1]['procedure_label'],'NÚMERO DE CASO')
        self.assertEqual(r['payments'][1]['procedure_field'],r['payments'][0]['procedure_field'])
        self.assertEqual(r['transferred_since_month'],125)
    def test_case_and_procedure_identifiers_are_same_deduplication_key(self):
        for c in self.data['oct']['column_catalog']:
            if c['id']==261:c['label']='NÚMERO DE CASO'
        self.data['oct']['records'][0]['raw_columns'].update({'261':'T-1','267':'2026-10-15','268':'100'})
        r=self.run_analysis()['rows'][0]
        self.assertEqual(r['transferred_since_month'],0)
        self.assertTrue(all(e['ambiguous'] for e in r['payments']))
    def test_transfer_after_observed_cut_is_not_counted(self):
        self.data['oct']['records'][0]['raw_columns']['243']='2026-11-15'
        r=self.run_analysis()['rows'][0]
        self.assertEqual(r['transferred_since_month'],0)
        self.assertIsNone(r['monthly'][10]['transferred'])
    def test_future_scheduled_cohort_has_no_observed_cash_total(self):
        self.data['oct']['records'][0]['raw_columns']['533']='100'
        result=p.analyze(None,2026,11)
        self.assertEqual(result['rows'][0]['status'],'future')
        self.assertIsNone(result['rows'][0]['transferred_since_month'])
    def test_sources_not_mutated(self):
        before=copy.deepcopy(self.data);self.run_analysis();self.assertEqual(before,self.data)

if __name__=='__main__':unittest.main()

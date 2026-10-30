import copy
import unittest
from decimal import Decimal
from unittest.mock import patch
from payment_range import match_amount,evaluate_range
from test_payment_followup import catalog,row,batch


def invoice(key,amount,number=None):
    return {'key':key,'cents':int(Decimal(str(amount))*100),'procedure':number or key,'amount':amount,'source_row':13,'payment_number':1,'number_column':237,'amount_column':238}

def full_batch(rows):
    b=batch(rows)
    b['column_catalog'].append({'id':482,'label':'ESTADO DEL PROCESO'})
    for i in range(25):b['column_catalog'].append({'id':238+i*8,'label':'VALOR FACTURADO SIN IVA (USD)'})
    return b

class InvoiceMatchingTests(unittest.TestCase):
    def test_exact_single_invoice_cent_precision(self):
        r=match_amount(Decimal('123456.78'),[invoice('1',123456.78,'SYNTH-CASE-01')])
        self.assertEqual(r['status'],'unique');self.assertEqual(r['procedures'],['SYNTH-CASE-01'])
    def test_sum_of_multiple_invoices(self):
        r=match_amount(Decimal('100'),[invoice('1',30),invoice('2',25),invoice('3',45)])
        self.assertEqual(r['status'],'unique');self.assertEqual(len(r['matches'][0]),3)
    def test_multiple_combinations_not_arbitrarily_selected(self):
        r=match_amount(Decimal('100'),[invoice('1',100),invoice('2',40),invoice('3',60)])
        self.assertEqual(r['status'],'ambiguous');self.assertEqual(len(r['matches']),2)
    def test_no_match_and_zero_are_distinct(self):
        self.assertEqual(match_amount(Decimal('101'),[invoice('1',100)])['status'],'unmatched')
        self.assertEqual(match_amount(Decimal('0'),[invoice('1',0)])['status'],'zero')
        self.assertEqual(match_amount(None,[])['status'],'missing')
    def test_negative_adjustments_require_review(self):
        self.assertEqual(match_amount(Decimal('10'),[invoice('1',20),invoice('2',-10)])['status'],'adjustment_review')
    def test_solver_bound_is_not_reported_as_no_match(self):
        self.assertEqual(match_amount(Decimal('50'),[invoice(str(i),1) for i in range(40)],max_states=32)['status'],'limit')

class MonthlyRangeTests(unittest.TestCase):
    def setUp(self):
        self.cut={'year':2026,'month':10,'sha256':'oct','file':'October.xlsx'}
        a=row(contract='SYNTH-C1',planned='100',september='100',october='0',procedure='SYNTH-CASE-01',amount='999')
        a['raw_columns'].update({'238':'100','482':'EN EJECUCIÓN','530':'30','545':'25','532':'50'})
        # Paid but not scheduled in September must still contribute to the chart.
        b=row(number=14,contract='SYNTH-C2',planned='0',september='20',october='0',procedure='OTHER',amount='1')
        b['raw_columns'].update({'238':'20','482':'FINALIZADO'})
        self.data=full_batch([a,b])
        self.a=patch('payment_range.choices',return_value=[self.cut]);self.a.start()
        self.b=patch('payment_range.load_cut',side_effect=lambda root,cut:copy.deepcopy(self.data));self.b.start()
    def tearDown(self):self.b.stop();self.a.stop()
    def test_range_table_and_two_series_with_all_execution(self):
        r=evaluate_range(None,2026,8,10)
        self.assertEqual(r['months'],[8,9,10]);self.assertEqual(r['series_labels'],['Programado','Devengado'])
        self.assertEqual(r['chart'][1]['planned'],100);self.assertEqual(r['chart'][1]['executed'],120)
        self.assertEqual(len(r['rows']),2)
    def test_invoice_uses_without_vat_not_net_transferred(self):
        r=evaluate_range(None,2026,9,9)['rows'][0]
        self.assertEqual(r['monthly'][0]['match']['procedures'],['SYNTH-CASE-01'])
        self.assertEqual(r['process_status'],['EN EJECUCIÓN'])
        self.assertEqual(r['monthly'][0]['execution_column'],546)
    def test_no_single_invoice_reuse_in_two_months(self):
        self.data['records'][0]['raw_columns']['547']='100'
        r=evaluate_range(None,2026,9,10)['rows'][0]
        self.assertTrue(all(m['match']['status']=='ambiguous_month' for m in r['monthly']))
    def test_future_month_not_assumed_zero(self):
        self.data['records'][0]['raw_columns']['533']='100'
        r=evaluate_range(None,2026,11,11)
        self.assertIsNone(r['rows'][0]['monthly'][0]['executed'])
    def test_bad_range_and_wrong_column_semantics_rejected(self):
        with self.assertRaises(ValueError):evaluate_range(None,2026,10,8)
        with self.assertRaises(ValueError):evaluate_range(None,2026,0,12)
        with self.assertRaises(ValueError):evaluate_range(None,2026,1,12,cut_token='../source')
        self.data['column_catalog'][-1]['label']='NETO TRANSFERIDO'
        with self.assertRaises(ValueError):evaluate_range(None,2026,8,10)
    def test_matching_is_independent_of_visible_range(self):
        a=evaluate_range(None,2026,9,9)['rows'][0]['monthly'][0]['match']
        b=evaluate_range(None,2026,8,10)['rows'][0]['monthly'][1]['match']
        self.assertEqual(a,b)

if __name__=='__main__':unittest.main()

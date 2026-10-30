import copy
import unittest
from decimal import Decimal
from unittest.mock import patch
from payment_range import match_amount,evaluate_range
from test_payment_followup import catalog,row,batch


def invoice(number,amount,procedure=None,source_row=13):
    return {'key':str(source_row)+':'+str(number),'cents':int(Decimal(str(amount))*100) if amount is not None else None,
            'procedure':procedure if procedure is not None else 'TEST-'+str(number),'amount':amount,'source_row':source_row,
            'payment_number':int(number),'number_column':237+8*(int(number)-1),'amount_column':238+8*(int(number)-1)}

def full_batch(rows):
    b=batch(rows)
    b['column_catalog'].append({'id':482,'label':'ESTADO DEL PROCESO'})
    for i in range(25):b['column_catalog'].append({'id':238+i*8,'label':'VALOR FACTURADO SIN IVA (USD)'})
    return b

class InvoiceMatchingTests(unittest.TestCase):
    def test_single_latest_invoice_cent_precision(self):
        r=match_amount(Decimal('123456.78'),[invoice(1,123456.78,'TEST-CASE')])
        self.assertEqual(r['status'],'unique');self.assertEqual(r['procedures'],['TEST-CASE'])
    def test_latest_two_are_chosen_in_descending_order(self):
        r=match_amount(Decimal('100'),[invoice(3,100),invoice(4,40),invoice(5,60)])
        self.assertEqual(r['status'],'unique');self.assertEqual(r['consumed_payment_numbers'],[5,4])
        self.assertEqual(r['procedures'],['TEST-5','TEST-4'])
    def test_last_three_consecutive_payments(self):
        r=match_amount(Decimal('100'),[invoice(1,900),invoice(2,45),invoice(3,25),invoice(4,30)])
        self.assertEqual(r['consumed_payment_numbers'],[4,3,2])
    def test_cannot_combine_third_and_first_skipping_second(self):
        r=match_amount(Decimal('100'),[invoice(1,40),invoice(2,10),invoice(3,60)])
        self.assertEqual(r['status'],'review');self.assertEqual(r['procedures'],[])
    def test_cannot_skip_newer_payment_to_find_an_old_exact_one(self):
        r=match_amount(Decimal('100'),[invoice(1,100),invoice(2,60)])
        self.assertEqual(r['status'],'review')
    def test_hole_in_payment_numbers_is_not_skipped(self):
        self.assertEqual(match_amount(Decimal('100'),[invoice(1,40),invoice(3,60)])['status'],'review')
    def test_missing_procedure_or_amount_requires_review(self):
        self.assertEqual(match_amount(Decimal('100'),[invoice(1,100),invoice(2,50,'')])['status'],'review')
        self.assertEqual(match_amount(Decimal('100'),[invoice(1,100),invoice(2,None)])['status'],'review')
    def test_repeated_amounts_are_deterministic_not_combinations(self):
        r=match_amount(Decimal('100'),[invoice(1,50),invoice(2,50),invoice(3,50)])
        self.assertEqual(r['status'],'unique');self.assertEqual(r['consumed_payment_numbers'],[3,2])
    def test_all_assignments_in_same_payment_slot_are_used_together(self):
        invoices=[invoice(2,30,source_row=13),invoice(2,20,source_row=14),invoice(1,50)]
        self.assertEqual(match_amount(Decimal('100'),invoices)['consumed_payment_numbers'],[2,1])
        self.assertEqual(match_amount(Decimal('30'),invoices)['status'],'review')
    def test_zero_missing_and_negative_are_not_guessed(self):
        self.assertEqual(match_amount(Decimal('0'),[])['status'],'zero')
        self.assertEqual(match_amount(None,[])['status'],'missing')
        r=match_amount(Decimal('100'),[invoice(2,-10),invoice(1,110)])
        self.assertEqual(r['status'],'unique')

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
        self.assertEqual(r['monthly'][1]['match']['status'],'unique')
        self.assertEqual(r['monthly'][0]['match']['status'],'review')
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

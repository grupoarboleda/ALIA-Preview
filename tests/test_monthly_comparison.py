from decimal import Decimal as D
import unittest
from payment_range import compare_month

class MonthlyComparisonTests(unittest.TestCase):
    def test_equal_global_totals_do_not_hide_different_contracts(self):
        a=compare_month(D(100),D(0));b=compare_month(D(0),D(100))
        self.assertEqual(a['pending'],100);self.assertEqual(b['unplanned'],100)
        self.assertEqual(a['covered']+b['covered'],0)
    def test_partial_execution_pending(self):
        r=compare_month(D(100),D(60));self.assertEqual(r['pending'],40);self.assertEqual(r['covered'],60)
    def test_excess_separate_from_no_program(self):
        r=compare_month(D(100),D(140));self.assertEqual(r['over_plan'],40);self.assertEqual(r['unplanned'],0)
    def test_missing_records_are_labelled_not_filled_in_source(self):
        r=compare_month(None,D(80));self.assertTrue(r['program_missing']);self.assertEqual(r['unplanned'],80)
        r=compare_month(D(80),None);self.assertTrue(r['execution_missing']);self.assertEqual(r['pending'],80)
    def test_future_month_is_not_classified_as_unpaid(self):
        r=compare_month(D(100),None,False);self.assertFalse(r['observed']);self.assertIsNone(r['pending'])
    def test_negative_adjustment_not_called_unplanned(self):
        r=compare_month(D(100),D(-20));self.assertTrue(r['adjustment']);self.assertIsNone(r['unplanned'])

if __name__=='__main__':unittest.main()

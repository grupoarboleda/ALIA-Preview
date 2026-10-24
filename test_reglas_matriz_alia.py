"""Pruebas del motor de validación ALIA, sin acceso a datos privados ni Explorer."""
import unittest
from reglas_matriz_alia import check_record, check_catalog, check_source_cell

class TestReglasMatriz(unittest.TestCase):
    def test_anticipo_numerico_no_es_fecha(self):
        self.assertEqual(check_source_cell(502, 231, "SH", "46183"), [])
        self.assertEqual(check_record({"sourceRow": 231, "advance": 46183}), [])

    def test_fecha_excel_en_columna_fecha(self):
        self.assertEqual(check_source_cell(235, 13, "IA", "46183"), [])

    def test_fecha_texto_invalida(self):
        self.assertEqual(check_source_cell(235, 13, "IA", "no-fecha")[0]["code"], "INVALID_DATE_CELL")

    def test_25_pagos_contra_factura(self):
        for payment in range(25):
            ident = 237 + payment * 8 + 7
            self.assertEqual(check_source_cell(ident, 13, "XX", "1200.50"), [])
            self.assertEqual(check_source_cell(ident, 13, "XX", "abc")[0]["code"], "INVALID_MONETARY_CELL")

    def test_porcentaje_como_fraccion(self):
        self.assertEqual(check_record({"sourceRow": 13, "physical": 0.75}), [])
        self.assertEqual(check_record({"sourceRow": 13, "physical": 75})[0]["id"], 226)

    def test_catalogo_completo(self):
        self.assertEqual(check_catalog([{"id": i} for i in range(1, 565)]), [])
        self.assertEqual(check_catalog([{"id": i} for i in range(1, 564)])[0]["code"], "COLUMN_IDS_INCOMPLETE")

    def test_observaciones_no_modifican_valores(self):
        record = {"sourceRow": 231, "advance": "texto"}
        original = dict(record)
        self.assertEqual(check_record(record)[0]["code"], "INVALID_MONETARY_VALUE")
        self.assertEqual(record, original)

if __name__ == "__main__":
    unittest.main()

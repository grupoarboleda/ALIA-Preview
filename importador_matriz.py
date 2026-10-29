"""ALIA matrix import core. Standard library only; no network, no database writes.
Usage: python importador_matriz.py "reporte.xlsx" --out "vista_previa.json"
Preview only: NEVER replaces dashboard data automatically.
"""
import argparse
import collections
import datetime
import hashlib
import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET
from reglas_matriz_alia import check_record, check_catalog, check_source_cell

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}

def text_cell(cell, strings):
    v = cell.find("m:v", NS)
    t = cell.get("t")
    if t == "inlineStr":
        inline = cell.find("m:is", NS)
        return "".join(inline.itertext()) if inline is not None else ""
    if v is None or v.text is None:
        return ""
    if t == "s":
        return strings[int(v.text)]
    return v.text


def rows_xlsx(path):
    """Stream first worksheet: validate sheet name before using in production."""
    with zipfile.ZipFile(path) as z:
        workbook = ET.fromstring(z.read("xl/workbook.xml"))
        sheets = workbook.find("m:sheets", NS)
        if sheets is None or not any("MATRIZ CONSOLIDADA" in x.get("name", "").upper()
                                   for x in sheets):
            raise ValueError("No existe la hoja MATRIZ CONSOLIDADA")
        # These source workbooks store MATRIZ CONSOLIDADA as sheet1.xml.
        if sheets[0].get("name", "").strip().upper() != "MATRIZ CONSOLIDADA":
            raise ValueError("La hoja MATRIZ CONSOLIDADA no es la primera: revisar mapeo de hojas")
        strings = []
        if "xl/sharedStrings.xml" in z.namelist():
            with z.open("xl/sharedStrings.xml") as fp:
                for _, node in ET.iterparse(fp, events=("end",)):
                    if node.tag.endswith("}si"):
                        strings.append("".join(node.itertext()))
                        node.clear()
        with z.open("xl/worksheets/sheet1.xml") as fp:
            for _, node in ET.iterparse(fp, events=("end",)):
                if node.tag.endswith("}row"):
                    number = int(node.get("r", "0"))
                    values = {}
                    for cell in node.findall("m:c", NS):
                        col = re.match(r"[A-Z]+", cell.get("r", ""))
                        if col:
                            values[col.group()] = text_cell(cell, strings)
                    yield number, values
                    node.clear()


def amount(raw):
    try:
        return float(raw) if raw not in ("", None) else 0.0
    except (TypeError, ValueError):
        return None


def norm(raw):
    return re.sub(r"\s+", " ", str(raw or "").strip()).upper()


def report_date(raw):
    try:
        number = float(raw)
        return (datetime.datetime(1899, 12, 30) + datetime.timedelta(days=number)).date().isoformat()
    except (TypeError, ValueError, OverflowError):
        try:
            return datetime.date.fromisoformat(str(raw)[:10]).isoformat()
        except ValueError:
            try:
                return datetime.datetime.strptime(str(raw).strip().split(" ")[0], "%d/%m/%Y").date().isoformat()
            except ValueError:
                return None


def inspect_file(path, assigned_month=None, assigned_year=2026):
    path = Path(path)
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    rows = rows_xlsx(path)
    header_row, headers = None, None
    records, issues = [], []
    dates = collections.Counter()
    variant = None
    mapped = {}
    numbered_columns = {}
    column_ids = {}
    administrator_column = None
    dictionary = json.loads((Path(__file__).resolve().parent / "DICCIONARIO_COLUMNAS_ALIA.json").read_text(encoding="utf-8"))
    block_dictionary = json.loads((Path(__file__).resolve().parent / "DICCIONARIO_BLOQUES_ALIA.json").read_text(encoding="utf-8"))
    def group_for(identifier):
        for group in block_dictionary["groups"]:
            if group["start"] <= identifier <= group["end"]:
                if group.get("repeat"):
                    payment = (identifier - group["start"]) // group["step"] + 1
                    field_index = (identifier - group["start"]) % group["step"]
                    return {"block": group["name"], "subblock": f"Pago {payment} contra factura",
                            "field_in_subblock": group["fields"][field_index], "payment_number": payment}
                return {"block": group["name"], "subblock": None}
        return {"block": "Otros campos de la matriz", "subblock": None}
    for row_num, row in rows:
        if row_num == dictionary["header_row"]:
            headers = row
            for col, header in row.items():
                normalized = norm(header)
                if "ADMINISTRADOR" in normalized and "CONTRATO" in normalized:
                    administrator_column = col
                    break
            continue
        if row_num == dictionary["id_row"]:
            for column, raw_id in row.items():
                try:
                    identifier = int(float(raw_id))
                except (ValueError, TypeError):
                    continue
                if identifier in numbered_columns:
                    raise ValueError(f"Identificador de columna duplicado: {identifier}")
                numbered_columns[identifier] = column
                column_ids[column] = identifier
            if not numbered_columns:
                raise ValueError("La fila 12 no contiene identificadores numéricos")
            mapped = {}
            for field, definition in dictionary["fields"].items():
                identifier = definition["id"]
                column = numbered_columns.get(identifier)
                if not column:
                    raise ValueError(f"Falta columna numerada {identifier}: {definition['label']}")
                if norm(headers.get(column)) != norm(definition["label"]):
                    issues.append({"row": 11, "code": "COLUMN_MISMATCH",
                                   "column": column, "id": identifier,
                                   "expected": definition["label"], "found": headers.get(column, "")})
                mapped[field] = column
            mapped["report"] = None
            for i in range(1, 13):
                mapped["physical_month_" + str(i)] = None
            header_row = dictionary["header_row"]
            variant = dictionary["schema"]
            continue
        if header_row is None:
            continue
        # Numeric index row follows the header and is not an assignment.
        if row_num <= header_row + 1:
            continue
        if not norm(row.get(mapped["process"])) and not norm(row.get(mapped["project"])):
            continue
        date = f"{int(assigned_year):04d}-{int(assigned_month):02d}-01" if assigned_month else None
        if date:
            dates[date] += 1
        # Validar todos los campos tipados por ID, incluidos los 25 pagos.
        for column, raw in row.items():
            identifier = column_ids.get(column)
            if identifier is not None:
                issues.extend(check_source_cell(identifier, row_num, column, raw))
        values = {name: row.get(col, "") if col else "" for name, col in mapped.items()}
        values["contract_administrator"] = str(row.get(administrator_column, "") or "").strip() if administrator_column else ""
        for field in ("budget", "committed", "accrued", "advance", "accrued_advance", "physical", *(f"physical_month_{i}" for i in range(1,13))):
            raw_value = values[field]
            if field.startswith("physical_month_") and (raw_value is None or str(raw_value).strip() == ""):
                # Future / unreported months are missing data, NOT malformed numbers.
                values[field] = None
                continue
            values[field] = amount(raw_value)
            if values[field] is None:
                issues.append({"row": row_num, "code": "INVALID_NUMBER", "field": field,
                               "value": str(raw_value)[:80]})
        # Series mensuales reales, línea base original y programación vigente.
        # Se leen por ID de columna (fila 12), nunca por letra de Excel.
        for key, start in (("baseline_monthly", 508), ("planned_monthly", 523), ("actual_monthly", 538)):
            series = []
            for identifier in range(start, start + 12):
                column = numbered_columns.get(identifier)
                raw = row.get(column, "") if column else ""
                if str(raw).strip() == "":
                    series.append(None)
                else:
                    parsed = amount(raw)
                    series.append(parsed)
                    if parsed is None:
                        issues.append({"row": row_num, "code": "INVALID_MONTHLY_AMOUNT",
                                       "id": identifier, "column": column, "value": str(raw)[:80]})
            values[key] = series
        # Fechas contractuales opcionales, identificadas por ID de la fila 12.
        # Se conservan en los nuevos snapshots; nunca se infieren de importes.
        for field, identifier in (("advance_paid_date", 235), ("contract_start_date", 50)):
            column = numbered_columns.get(identifier)
            raw = row.get(column, "") if column else ""
            if raw is None or str(raw).strip() == "":
                values[field] = None
            else:
                parsed_date = report_date(raw)
                values[field] = parsed_date
                if parsed_date is None:
                    issues.append({"row": row_num, "code": "INVALID_CONTRACT_DATE",
                                   "id": identifier, "column": column, "field": field,
                                   "value": str(raw)[:80]})
        # Conservar todos los valores de la matriz sin perder la correspondencia
        # con los identificadores oficiales de la fila 12.
        values["raw_columns"] = {
            str(identifier): row.get(column, "")
            for identifier, column in numbered_columns.items()
        }
        values["original_cells"] = dict(row)
        values["report_date"] = date
        values["process_key"] = norm(values["process"])
        values["contract_key"] = norm(values["contract"] if norm(values["contract"]) not in ("0","") else values["contract_alt"])
        values["project_key"] = norm(values["project_code"])
        values["source_row"] = row_num
        # No clasificar una cantidad como fecha únicamente por su magnitud.
        # El identificador de la fila 12 y el tipo de celda deben prevalecer.
        if not values["process_key"]:
            issues.append({"row": row_num, "code": "MISSING_PROCESS_CODE"})
        issues.extend(check_record(values))
        records.append(values)
    if header_row is None:
        raise ValueError("No se detectó la fila 12 de identificadores numéricos en MATRIZ CONSOLIDADA. Verifica que el servidor Python haya sido reiniciado y esté sincronizado con develop.")
    catalog = [{"id": identifier, "column": column, "label": str(headers.get(column, "")).strip(),
                "type": next((definition["type"] for definition in dictionary["fields"].values() if definition["id"] == identifier), "source"),
                "mapped_field": next((key for key, definition in dictionary["fields"].items() if definition["id"] == identifier), None)}
               | group_for(identifier)
               for identifier, column in sorted(numbered_columns.items())]
    for column in catalog:
        vals=[r["raw_columns"].get(str(column["id"]), "") for r in records]
        vals=[v for v in vals if str(v).strip()]
        numeric=[amount(v) is not None for v in vals]
        column["observed_type"] = ("empty" if not vals else "number" if all(numeric) else "mixed" if any(numeric) else "text")
    issues.extend(check_catalog(catalog))
    return {"dictionary_version": block_dictionary["version"], "column_catalog": catalog, "schema": variant, "file": path.name, "sha256": digest, "header_row": header_row,
            "report_dates": dict(dates), "record_count": len(records),
            "unique_processes": len({r["process_key"] for r in records if r["process_key"]}),
            "unique_contract_codes": len({r["contract_key"] for r in records if r["contract_key"]}),
            "issues": issues, "records": records}


def main():
    ap = argparse.ArgumentParser(description="ALIA: prevalidación local de MATRIZ CONSOLIDADA")
    ap.add_argument("files", nargs="+", help="XLSX de reportes")
    ap.add_argument("--out", help="Archivo JSON de previsualización (mantener local)")
    args = ap.parse_args()
    batches = [inspect_file(f) for f in args.files]
    summary = [{k: v for k, v in batch.items() if k != "records"} for batch in batches]
    if args.out:
        Path(args.out).write_text(json.dumps({"status": "PREVIEW_ONLY", "batches": batches},
                                             ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"status": "PREVIEW_ONLY", "batches": summary}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

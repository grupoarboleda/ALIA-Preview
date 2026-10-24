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

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
COLS = {
    "report": "A", "project_code": "C", "unit": "F", "source": "M",
    "process": "P", "process_name": "R", "project": "S", "area": "T",
    "state": "AT", "contract": "AV", "contract_alt": "AP",
    "physical": "HS", "budget": "SD", "committed": "SF",
    "accrued": "SG", "advance": "SI", "accrued_advance": "SK",
    **{"physical_month_"+str(i+1): col for i,col in enumerate(("UH","UI","UJ","UK","UL","UM","UN","UO","UP","UQ","UR","US"))}
}
REQUIRED = {"A": "Reporte", "P": "CÓDIGO DEL PROCESO",
            "SD": "CODIFICADO AÑO N", "SF": "COMPROMETIDO AÑO N",
            "SG": "DEVENGADO AÑO N", "SI": "ANTICIPO AÑO N"}


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
            return None


def inspect_file(path, assigned_month=None):
    path = Path(path)
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    rows = rows_xlsx(path)
    header_row, headers = None, None
    records, issues = [], []
    dates = collections.Counter()
    variant = None
    mapped = COLS
    for row_num, row in rows:
        if header_row is None:
            is_original = norm(row.get("A")) == "REPORTE" and norm(row.get("P")) == norm(REQUIRED["P"])
            is_new = (norm(row.get("O")) == "CÓDIGO DEL PROCESO" and
                      norm(row.get("SC")) == "CODIFICADO AÑO N" and
                      norm(row.get("SF")) == "DEVENGADO AÑO N")
            if is_original or is_new:
                header_row, headers = row_num, row
                variant = "CORP_2026" if is_new else "ORIGINAL"
                if is_new:
                    mapped = {**COLS, "report": None, "project_code": "B",
                              "unit": "E", "source": "L", "process": "O",
                              "process_name": "Q", "project": "R", "area": "S",
                              "state": "AS", "contract": "AU", "contract_alt": "AO",
                              "physical": "HR", "budget": "SC", "committed": "SE",
                              "accrued": "SF", "advance": "SH",
                              "accrued_advance": "SJ",
                              **{"physical_month_"+str(i): None for i in range(1,13)}}
                for col, expected in ({"O": "CÓDIGO DEL PROCESO", "SC": "CODIFICADO AÑO N",
                                       "SE": "COMPROMETIDO AÑO N", "SF": "DEVENGADO AÑO N"} if is_new else REQUIRED).items():
                    if norm(row.get(col)) != norm(expected):
                        issues.append({"row": row_num, "code": "COLUMN_MISMATCH", "column": col,
                                       "expected": expected, "found": row.get(col, "")})
            continue
        # Numeric index row follows the header and is not an assignment.
        if row_num <= header_row + 1:
            continue
        if not norm(row.get(mapped["process"])) and not norm(row.get(mapped["project"])):
            continue
        date = (f"2026-{int(assigned_month):02d}-01" if variant == "CORP_2026" and assigned_month else
                report_date(row.get("A")) if variant == "ORIGINAL" else None)
        if date:
            dates[date] += 1
        else:
            if variant == "ORIGINAL" or assigned_month:
                issues.append({"row": row_num, "code": "INVALID_REPORT_DATE"})
        values = {name: row.get(col, "") if col else "" for name, col in mapped.items()}
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
        values["report_date"] = date
        values["process_key"] = norm(values["process"])
        values["contract_key"] = norm(values["contract"] if norm(values["contract"]) not in ("0","") else values["contract_alt"])
        values["project_key"] = norm(values["project_code"])
        values["source_row"] = row_num
        # Some SI/SK cells contain Excel date serials, not monetary amounts.
        # Never turn such values into financial advances without reconciliation.
        if values["advance"] is not None and 40000 <= values["advance"] <= 80000:
            issues.append({"row": row_num, "code": "ADVANCE_RESEMBLES_EXCEL_DATE", "value": values["advance"]})
            values["advance"] = None
        if not values["process_key"]:
            issues.append({"row": row_num, "code": "MISSING_PROCESS_CODE"})
        if values["physical"] is not None and not 0 <= values["physical"] <= 1.00001:
            issues.append({"row": row_num, "code": "PHYSICAL_OUT_OF_RANGE"})
        records.append(values)
    if header_row is None:
        raise ValueError("No se encontró el encabezado de MATRIZ CONSOLIDADA")
    if variant == "CORP_2026":
        issues.append({"code": "NO_INTERNAL_REPORT_DATE", "detail": "Mes asignado por archivo/casilla; no es fecha observada en la matriz"})
    if len(dates) > 1:
        issues.append({"code": "MULTIPLE_REPORT_DATES", "dates": dict(dates)})
    if dates:
        major_date = dates.most_common(1)[0][0]
        # Do not silently interpret misleading filenames as reporting dates.
        month_name = {1:"ENERO",2:"FEBRERO",3:"MARZO",4:"ABRIL",5:"MAYO",6:"JUNIO",
                      7:"JULIO",8:"AGOSTO",9:"SEPTIEMBRE",10:"OCTUBRE",11:"NOVIEMBRE",12:"DICIEMBRE"}[int(major_date[5:7])]
        if any(name in norm(path.name) for name in ("ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO",
                "JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE")) and month_name not in norm(path.name):
            issues.append({"code": "FILENAME_REPORT_DATE_MISMATCH", "internal_date": major_date})
    return {"schema": variant, "file": path.name, "sha256": digest, "header_row": header_row,
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

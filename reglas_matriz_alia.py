"""ALIA 2026: reglas basadas en IDs del diccionario; solo observaciones, nunca alteran importes."""
import math

FIELDS = {
    "project_code": (2, "texto"), "unit": (5, "texto"), "source": (12, "texto"),
    "process": (15, "texto"), "process_name": (17, "texto"), "project": (18, "texto"),
    "area": (19, "texto"), "contract_alt": (41, "texto"), "state": (45, "texto"),
    "contract": (47, "texto"), "physical": (226, "porcentaje_0_1"),
    "budget": (497, "moneda"), "committed": (499, "moneda"),
    "accrued": (500, "moneda"), "advance": (502, "moneda"),
    "accrued_advance": (504, "moneda"),
}
PAYMENT_MONEY_IDS = {237 + 8 * payment + offset for payment in range(25) for offset in (1, 2, 3, 4, 5, 7)}
MONETARY_IDS = frozenset([234, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506,
                         *PAYMENT_MONEY_IDS, *range(508, 522), *range(523, 537), *range(538, 552)])
DATE_IDS = frozenset([235, 236, *range(243, 436, 8)])
TEXT_IDS = frozenset([507, 522, 537, 552, *range(553, 565)])
RULE_VERSION = "matrix-dictionary-2026-v2"


def alert(code, row, field=None, value=None, detail=None):
    result = {"code": code, "row": row}
    if field in FIELDS:
        result.update({"field": field, "id": FIELDS[field][0]})
    if value is not None:
        result["value"] = str(value)[:90]
    if detail:
        result["detail"] = detail
    return result


def check_record(record):
    """Conservative checks on fields retained in the local snapshot.
    No arbitrary financial limits; dates/25 payments require original cell evidence."""
    row = record.get("source_row", record.get("sourceRow"))
    issues = []
    for field in ("budget", "committed", "accrued", "advance", "accrued_advance"):
        value = record.get(field)
        if value is None or value == "":
            continue
        try:
            number = float(value)
            if not math.isfinite(number):
                raise ValueError("not finite")
        except (TypeError, ValueError, OverflowError):
            issues.append(alert("INVALID_MONETARY_VALUE", row, field, value,
                                "Importe no numérico o no finito; no se infiere fecha por magnitud."))
    physical = record.get("physical")
    if physical not in (None, ""):
        try:
            value = float(physical)
            if not math.isfinite(value) or not -0.00001 <= value <= 1.00001:
                issues.append(alert("PHYSICAL_PERCENT_OUT_OF_RANGE", row, "physical", physical,
                                    "La matriz almacena el avance físico como fracción entre 0 y 1."))
        except (TypeError, ValueError, OverflowError):
            issues.append(alert("INVALID_PHYSICAL_PERCENT", row, "physical", physical))
    return issues


def check_catalog(catalog):
    issues = []
    ids = [item.get("id") for item in catalog]
    if not catalog:
        return issues  # snapshot anterior: no se inventa catálogo.
    if len(ids) != 564 or set(ids) != set(range(1, 565)):
        issues.append({"code": "COLUMN_IDS_INCOMPLETE", "expected": 564,
                       "found": len(ids), "detail": "Se requieren los identificadores 1 a 564."})
    return issues

def check_source_cell(identifier, row, column, raw):
    """Validate raw source cell by numbered ID; blank cells remain blank.
    Formulas are read via cached values. Monetary magnitude never implies a date."""
    if raw is None or str(raw).strip() == "":
        return []
    kind = "money" if identifier in MONETARY_IDS else "date" if identifier in DATE_IDS else None
    if kind is None:
        return []
    try:
        value = float(raw)
        if not math.isfinite(value):
            raise ValueError("not finite")
        if kind == "date" and not 0 <= value <= 2958465:
            raise ValueError("date serial outside Excel date system")
        return []
    except (TypeError, ValueError, OverflowError):
        if kind == "date":
            from datetime import date
            try:
                date.fromisoformat(str(raw)[:10])
                return []
            except (TypeError, ValueError):
                pass
        return [{"code": "INVALID_DATE_CELL" if kind == "date" else "INVALID_MONETARY_CELL",
                 "row": row, "column": column, "id": identifier, "value": str(raw)[:90],
                 "detail": "Revisar formato de fecha" if kind == "date" else "Importe no numérico; no se interpreta como fecha por su magnitud."}]

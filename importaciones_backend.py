"""Backend del Centro de importación ALIA, aislado del explorador y de GitHub.
Cargas: matrices XLSX por mes, validación previa, activación atómica solo con 12 meses.
"""
import datetime
import json
import os
import re
import tempfile
from pathlib import Path
from urllib.parse import unquote

from importador_matriz import inspect_file
from reglas_matriz_alia import check_record, check_catalog, RULE_VERSION

DATA_ROOT = Path.home() / ".alia_local_data"
STAGING = DATA_ROOT / "monthly"
ACTIVE = DATA_ROOT / "current.json"
MANIFEST = DATA_ROOT / "manifest.json"
YEAR = 2026
CRITICAL = set()  # Observaciones no bloquean; requisitos estructurales siguen validándose.


def read_json(path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return default


def write_json_atomic(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + ".tmp")
    try:
        temp.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        os.replace(temp, path)
    finally:
        temp.unlink(missing_ok=True)


def to_explorer(row):
    return {
        "area": row.get("area") or "SIN ÁREA",
        "source": row.get("source") or "SIN FUENTE",
        "project": row.get("project") or "SIN PROYECTO",
        "project_code": row.get("project_key") or row.get("project_code") or "",
        "process_code": row.get("process_key") or row.get("process") or "",
        "process": row["process_key"],
        "contract": row.get("contract_key") or "",
        "budget": row.get("budget") or 0,
        "committed": row.get("committed") or 0,
        "accrued": row.get("accrued") or 0,
        "advance": row.get("advance") or 0,
        "physical": row.get("physical"),
        "physicalMonths": [row.get("physical_month_" + str(i)) for i in range(1, 13)],
        "reportDate": row["report_date"],
        "sourceRow": row["source_row"],
    }


def stage(content, filename, expected_month="auto"):
    if len(content) < 4 or content[:2] != b"PK":
        raise ValueError("Archivo inválido: solo XLSX")
    if len(content) > 40 * 1024 * 1024:
        raise ValueError("Límite de 40 MB por archivo")
    prefix = re.match(r"^\\s*(0?[1-9]|1[0-2])\\s*[. _-]", filename)
    month = int(expected_month) if expected_month != "auto" else (int(prefix.group(1)) if prefix else None)
    if month is None or not 1 <= month <= 12:
        raise ValueError("No se pudo identificar el mes: utiliza prefijo 01.–12. o selecciona su casilla")
    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as fp:
        fp.write(content)
        tmp = Path(fp.name)
    try:
        batch = inspect_file(tmp, assigned_month=month)
    finally:
        tmp.unlink(missing_ok=True)
    dates = batch["report_dates"]
    if len(dates) != 1:
        raise ValueError("El archivo debe tener una sola fecha interna de Reporte; fechas detectadas: " + ", ".join(dates))
    date = next(iter(dates))
    parsed = datetime.date.fromisoformat(date)
    if parsed.year != YEAR:
        raise ValueError("El reporte no corresponde al ejercicio 2026: " + date)

    if not 1 <= month <= 12:
        raise ValueError("Mes fuera de rango")
    mismatch = False  # El archivo CORP no tiene fecha interna de reporte; mes asignado es provisional.
    if not batch["records"]:
        raise ValueError("La matriz no contiene filas de asignaciones")
    blocking = [e for e in batch["issues"] if e["code"] in CRITICAL]
    if blocking:
        raise ValueError(str(len(blocking)) + " incidencias críticas. Primera: " + json.dumps(blocking[0], ensure_ascii=False))
    records = [to_explorer(row) for row in batch["records"] if row.get("report_date") and row.get("process_key")]
    if not records:
        raise ValueError("No hay registros de procesos con fecha válida")
    manifest = read_json(MANIFEST, {"months": {}, "active": False})
    manifest.setdefault("months", {})
    old = manifest["months"].get(str(month))
    if old and old.get("sha256") == batch["sha256"]:
        prior = read_json(STAGING / f"{month:02d}.json", {})
        if prior.get("column_catalog") and prior.get("parser_version") == "grouped-v1":
            return {"ok": True, "month": month, "records": len(records),
                    "warnings": len(batch["issues"]), "duplicate": True}
    if mismatch:
        batch["issues"].append({"code": "REPORT_DATE_MONTH_MISMATCH", "internal_date": date, "assigned_month": month})
    snapshot = {"date": date, "date_origin": "ASSIGNED_MONTH_NOT_VERIFIED", "month": month, "year": YEAR,
                "file": filename, "sha256": batch["sha256"],
                "records": records, "issues": batch["issues"],
                "column_catalog": batch.get("column_catalog", []),
                "parser_version": "grouped-v1"}
    write_json_atomic(STAGING / (f"{month:02d}.json"), snapshot)
    manifest["months"][str(month)] = {"date": date, "file": filename,
        "sha256": batch["sha256"], "records": len(records),
        "warnings": len(batch["issues"]), "columns": len(batch.get("column_catalog", []))}
    manifest["active"] = False
    write_json_atomic(MANIFEST, manifest)
    return {"ok": True, "month": month, "records": len(records),
            "warnings": len(batch["issues"]), "duplicate": False}


def validated_snapshot(snapshot):
    """Current dictionary-based view of existing locally loaded records.
    Keeps stored evidence untouched; never modifies source Excel or Explorer."""
    if not snapshot:
        return snapshot
    result = dict(snapshot)
    result["records"] = [dict(r) for r in snapshot.get("records", [])]
    rows = {r.get("sourceRow"): r for r in result["records"]}
    issues = []
    for item in snapshot.get("issues", []):
        if item.get("code") != "ADVANCE_RESEMBLES_EXCEL_DATE":
            issues.append(dict(item))
            continue
        row = rows.get(item.get("row"))
        try:
            value = float(item["value"])
            existing = row.get("advance") if row else None
            consistent = row is not None and (existing is None or float(existing) == 0 or abs(float(existing) - value) < 0.00001)
        except (TypeError, ValueError, KeyError):
            consistent = False
        if consistent:
            row["advance"] = value
        else:
            issues.append({"code": "ADVANCE_VALUE_CONFLICT", "row": item.get("row"),
                           "id": 502, "field": "advance", "value": item.get("value"),
                           "detail": "El importe no coincide con el registro cargado; revisar."})
    # Recalcular observaciones desde los datos disponibles en el snapshot.
    # No reescribir archivos locales ni modificar los registros originales.
    regenerated = []
    for record in result["records"]:
        regenerated.extend(check_record(record))
    regenerated.extend(check_catalog(result.get("column_catalog", [])))
    existing = {(i.get("code"), i.get("row"), i.get("id")) for i in issues}
    for issue in regenerated:
        key = (issue.get("code"), issue.get("row"), issue.get("id"))
        if key not in existing:
            issues.append(issue)
            existing.add(key)
    result["issues"] = issues
    result["validation_model"] = RULE_VERSION
    return result


def audit(month):
    """Read-only, local audit. Never sends workbook data to GitHub."""
    month = int(month)
    if not 1 <= month <= 12:
        raise ValueError("Mes fuera de rango")
    snap = read_json(STAGING / f"{month:02d}.json", None)
    if not snap:
        raise ValueError(f"El mes {month:02d} no tiene una matriz cargada")
    snap = validated_snapshot(snap)
    issues = snap.get("issues", [])
    counts = {}
    for item in issues:
        code = item.get("code", "UNKNOWN")
        counts[code] = counts.get(code, 0) + 1
    totals = {key: round(sum((row.get(key) or 0) for row in snap["records"]), 2)
              for key in ("budget", "committed", "accrued")}
    other = []
    for other_month in range(1, 13):
        if other_month == month:
            continue
        previous = read_json(STAGING / f"{other_month:02d}.json", None)
        if previous:
            previous = validated_snapshot(previous)
            previous_totals = tuple(round(sum((row.get(key) or 0) for row in previous["records"]), 2)
                                    for key in ("budget", "committed", "accrued"))
            if previous_totals == tuple(totals.values()):
                other.append(other_month)
    return {"ok": True, "month": month, "file": snap.get("file"),
            "date_origin": snap.get("date_origin", "UNKNOWN"),
            "records": len(snap["records"]), "issues": issues,
            "issue_counts": counts, "column_catalog": snap.get("column_catalog", []),
            "totals": totals, "identical_financial_months": other,
            "validation_model": RULE_VERSION}


def status():
    manifest = read_json(MANIFEST, {"months": {}, "active": False})
    months = manifest.get("months", {})
    warnings = []
    for m in sorted(months, key=int):
        snap = validated_snapshot(read_json(STAGING / f"{int(m):02d}.json", {}))
        count = len(snap.get("issues", []))
        if count:
            warnings.append(f"Mes {int(m):02d}: {count} observaciones para revisión")
    return {"ok": True, "months": months, "active": manifest.get("active", False),
            "blocked": False, "warnings": warnings}


def activate():
    manifest = read_json(MANIFEST, {"months": {}})
    missing = [i for i in range(1, 13) if str(i) not in manifest.get("months", {})]
    if missing:
        raise ValueError("Faltan meses: " + ", ".join(f"{m:02d}" for m in missing))
    snapshots = []
    for month in range(1, 13):
        snap = read_json(STAGING / f"{month:02d}.json", None)
        if not snap or snap.get("month") != month or not snap.get("records"):
            raise ValueError(f"Falta snapshot válido del mes {month:02d}")
        snapshots.append(validated_snapshot(snap))
    signatures = {tuple(round(sum(r[k] for r in snap["records"]), 2)
                        for k in ("budget", "committed", "accrued"))
                  for snap in snapshots}
    if len(signatures) == 1:
        raise ValueError("Los 12 reportes tienen idénticos totales financieros. "
                         "No se activará una falsa serie histórica sin conciliar los cortes.")
    # Latest financial figures are cumulative snapshots: never sum twelve cuts.
    latest = snapshots[-1]
    payload = {"mode": "REAL", "records": latest["records"],
               "report_dates": {latest["date"]: len(latest["records"])},
               "warnings_count": sum(len(s["issues"]) for s in snapshots),
               "months_loaded": 12, "source": "MONTHLY_IMPORT_CENTER",
               "history": [{"month": s["month"], "date": s["date"],
                            "records": len(s["records"])} for s in snapshots]}
    write_json_atomic(ACTIVE, payload)
    manifest["active"] = True
    write_json_atomic(MANIFEST, manifest)
    return {"ok": True, "months": 12, "records": len(latest["records"])}



def explorer_preview(month=None):
    """Read-only cut from staged months; no activation or file changes."""
    manifest = read_json(MANIFEST, {"months": {}})
    available = sorted(int(m) for m in manifest.get("months", {}) if str(m).isdigit() and 1 <= int(m) <= 12)
    if not available:
        return {"mode": "DEMO", "records": [], "available_months": []}
    chosen = int(month) if month not in (None, "") else available[-1]
    if chosen not in available:
        raise ValueError("El mes solicitado no está cargado")
    snap = read_json(STAGING / f"{chosen:02d}.json", None)
    if not snap or not snap.get("records"):
        raise ValueError("El mes seleccionado no tiene registros")
    snap = validated_snapshot(snap)
    return {"mode": "REAL", "source": "MONTHLY_STAGING_READ_ONLY",
            "preview": True, "month": chosen, "available_months": available,
            "date": snap.get("date"), "report_dates": {snap.get("date"): len(snap["records"])},
            "records": snap["records"], "warnings_count": len(snap["issues"]),
            "validation_model": RULE_VERSION}

def monthly_history():
    """Read-only monthly totals; values are cumulative per cut, not monthly flows."""
    manifest = read_json(MANIFEST, {"months": {}, "active": False})
    if not manifest.get("active"):
        return {"active": False, "series": []}
    series = []
    for month in range(1, 13):
        snap = read_json(STAGING / f"{month:02d}.json", None)
        if not snap:
            continue
        rows = validated_snapshot(snap)["records"]
        series.append({"month": month, "date": snap["date"],
                       "budget": sum(r["budget"] for r in rows),
                       "committed": sum(r["committed"] for r in rows),
                       "accrued": sum(r["accrued"] for r in rows)})
    return {"active": True, "series": series}

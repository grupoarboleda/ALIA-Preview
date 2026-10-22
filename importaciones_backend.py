"""Backend del Centro de importación ALIA, aislado del explorador y de GitHub.
Cargas: matrices XLSX por mes, validación previa, activación atómica solo con 12 meses.
"""
import datetime
import json
import os
import tempfile
from pathlib import Path
from urllib.parse import unquote

from importador_matriz import inspect_file

DATA_ROOT = Path.home() / ".alia_local_data"
STAGING = DATA_ROOT / "monthly"
ACTIVE = DATA_ROOT / "current.json"
MANIFEST = DATA_ROOT / "manifest.json"
YEAR = 2026
CRITICAL = {"COLUMN_MISMATCH", "INVALID_REPORT_DATE", "MULTIPLE_REPORT_DATES",
            "INVALID_NUMBER", "MISSING_PROCESS_CODE", "PHYSICAL_OUT_OF_RANGE"}


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
    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as fp:
        fp.write(content)
        tmp = Path(fp.name)
    try:
        batch = inspect_file(tmp)
    finally:
        tmp.unlink(missing_ok=True)
    dates = batch["report_dates"]
    if len(dates) != 1:
        raise ValueError("El archivo debe tener una sola fecha interna de Reporte; fechas detectadas: " + ", ".join(dates))
    date = next(iter(dates))
    parsed = datetime.date.fromisoformat(date)
    if parsed.year != YEAR:
        raise ValueError("El reporte no corresponde al ejercicio 2026: " + date)
    month = parsed.month
    if expected_month != "auto" and int(expected_month) != month:
        raise ValueError("El archivo contiene corte " + date + ", pero se eligió " + str(expected_month) + ". Corrige la selección.")
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
        return {"ok": True, "month": month, "records": len(records),
                "warnings": len(batch["issues"]), "duplicate": True}
    snapshot = {"date": date, "month": month, "year": YEAR,
                "file": filename, "sha256": batch["sha256"],
                "records": records, "issues": batch["issues"]}
    write_json_atomic(STAGING / (f"{month:02d}.json"), snapshot)
    manifest["months"][str(month)] = {"date": date, "file": filename,
        "sha256": batch["sha256"], "records": len(records),
        "warnings": len(batch["issues"])}
    manifest["active"] = False
    write_json_atomic(MANIFEST, manifest)
    return {"ok": True, "month": month, "records": len(records),
            "warnings": len(batch["issues"]), "duplicate": False}


def status():
    manifest = read_json(MANIFEST, {"months": {}, "active": False})
    months = manifest.get("months", {})
    warnings = []
    for m in sorted(months, key=int):
        item = months[m]
        if item.get("warnings", 0):
            warnings.append(f"Mes {int(m):02d}: {item['warnings']} observaciones para revisión")
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
        snapshots.append(snap)
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
        rows = snap["records"]
        series.append({"month": month, "date": snap["date"],
                       "budget": sum(r["budget"] for r in rows),
                       "committed": sum(r["committed"] for r in rows),
                       "accrued": sum(r["accrued"] for r in rows)})
    return {"active": True, "series": series}

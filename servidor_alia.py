"""ALIA local server: refresh browser to fetch latest develop from GitHub."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import socket
import subprocess
import threading
import time
import json
import tempfile
import zipfile
from urllib.parse import unquote, urlsplit, parse_qs

ROOT = Path(__file__).resolve().parent
LOCAL_DATA = Path.home() / ".alia_local_data" / "current.json"
os.chdir(ROOT)
_lock = threading.Lock()
_last_sync = 0.0
_status = "Esperando primera actualización"


def sync():
    global _last_sync, _status
    if os.environ.get("ALIA_DISABLE_SYNC") == "1":
        return
    if time.monotonic() - _last_sync < 3:
        return
    with _lock:
        branch = subprocess.run(["git", "branch", "--show-current"], cwd=ROOT, capture_output=True, text=True).stdout.strip() if (ROOT / ".git").is_dir() else ""
        if branch and branch != "develop":
            _status = "Rama de revisión: sincronización automática desactivada (" + branch + ")"
            return
        if time.monotonic() - _last_sync < 3:
            return
        _last_sync = time.monotonic()
        if not (ROOT / ".git").is_dir():
            _status = "Carpeta ZIP: no puede actualizarse automáticamente. Ejecuta instalar-alia-local.bat una vez."
            print("[ALIA]", _status, flush=True)
            return
        try:
            result = subprocess.run(
                ["git", "-c", "credential.interactive=never", "pull", "--ff-only", "origin", "develop"],
                cwd=ROOT, capture_output=True, text=True, timeout=15,
                stdin=subprocess.DEVNULL,
            )
            _status = ("Actualizado: " if result.returncode == 0 else "Error Git: ") + (
                result.stdout.strip() if result.returncode == 0 else result.stderr.strip()
            )
        except (OSError, subprocess.TimeoutExpired) as exc:
            _status = "No se pudo sincronizar: " + str(exc)
        print("[ALIA]", _status, flush=True)


# Synchronize Python sources before importing backend modules. A browser refresh
# cannot reload modules already imported by the running Python interpreter.
sync()
import importaciones_backend as monthly
from importador_matriz import inspect_file


class ALIAHTTPServer(ThreadingHTTPServer):
    # Windows SO_REUSEADDR permits two unrelated servers on the same endpoint.
    # Claim the loopback port exclusively so an old interpreter cannot shadow a new API.
    allow_reuse_address = os.name != "nt"
    allow_reuse_port = False

    def server_bind(self):
        if os.name == "nt":
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        return super().server_bind()


class Handler(SimpleHTTPRequestHandler):
    # All responses have a length; keep HTTP/1.1 transport consistent for large JS/JSON.
    protocol_version = "HTTP/1.1"
    def do_POST(self):
        endpoint = self.path.split("?", 1)[0]
        if endpoint == "/__alia_enrich_monthly":
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if not 0 < size <= 40 * 1024 * 1024:
                    return self._json({"ok": False, "error": "Tamaño de archivo inválido"}, 413)
                month = self.headers.get("X-ALIA-Month", "")
                filename = unquote(self.headers.get("X-ALIA-Filename", "matriz.xlsx"))
                return self._json(monthly.enrich_monthly_series(self.rfile.read(size), filename, month))
            except (ValueError, OSError, KeyError, zipfile.BadZipFile) as exc:
                return self._json({"ok": False, "error": str(exc)}, 422)
        if endpoint in ("/__alia_import_stage", "/__alia_import_activate"):
            try:
                if endpoint == "/__alia_import_activate":
                    return self._json(monthly.activate())
                size = int(self.headers.get("Content-Length", "0"))
                if size < 1 or size > 40 * 1024 * 1024:
                    return self._json({"ok": False, "error": "Archivo inválido o mayor a 40 MB"}, 413)
                filename = unquote(self.headers.get("X-ALIA-Filename", "matriz.xlsx"))
                requested = self.headers.get("X-ALIA-Month", "auto")
                return self._json(monthly.stage(self.rfile.read(size), filename, requested))
            except (ValueError, OSError, KeyError, zipfile.BadZipFile) as exc:
                return self._json({"ok": False, "error": str(exc)}, 422)
        if self.path.split("?", 1)[0] != "/__alia_import":
            self.send_error(404)
            return
        size = int(self.headers.get("Content-Length", "0"))
        if size < 1 or size > 40 * 1024 * 1024:
            self.send_error(413, "Archivo fuera de rango (máximo 40 MB)")
            return
        data = self.rfile.read(size)
        if not data.startswith(b"PK"):
            self.send_error(400, "Se requiere archivo XLSX")
            return
        try:
            with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp:
                tmp.write(data)
                path = Path(tmp.name)
            try:
                batch = inspect_file(path)
            finally:
                path.unlink(missing_ok=True)
            if not batch["records"]:
                raise ValueError("Matriz sin registros válidos")
            records = []
            for row in batch["records"]:
                if not row.get("report_date") or not row.get("process_key"):
                    continue
                records.append({
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
                    "physicalMonths": [row.get("physical_month_" + str(i)) for i in range(1,13)],
                    "reportDate": row["report_date"]
                })
            if not records:
                raise ValueError("No hay asignaciones con fecha y proceso")
            payload = {"mode": "REAL", "records": records,
                       "report_dates": batch["report_dates"],
                       "issues": batch["issues"][:100],
                       "warnings_count": len(batch["issues"]),
                       "file_hash": batch["sha256"]}
            LOCAL_DATA.parent.mkdir(parents=True, exist_ok=True)
            temp = LOCAL_DATA.with_suffix(".tmp")
            temp.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
            temp.replace(LOCAL_DATA)
            self._json({"ok": True, "records": len(records),
                        "report_dates": batch["report_dates"],
                        "warnings": len(batch["issues"]),
                        "mode": "REAL"})
        except Exception as exc:
            self._json({"ok": False, "error": str(exc)}, 422)

    def _json(self, payload, code=200):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        endpoint = self.path.split("?", 1)[0]
        if endpoint == "/__alia_import_audit":
            try:
                month = parse_qs(urlsplit(self.path).query).get("month", [""])[0]
                return self._json(monthly.audit(month))
            except (ValueError, OSError) as exc:
                return self._json({"ok": False, "error": str(exc)}, 422)
        if endpoint == "/__alia_source_coverage":
            return self._json(monthly.source_coverage())
        if endpoint == "/__alia_import_status":
            return self._json(monthly.status())
        if endpoint == "/__alia_explorer_preview":
            try:
                month = parse_qs(urlsplit(self.path).query).get("month", [""])[0]
                return self._json(monthly.explorer_preview(month))
            except (ValueError, OSError) as exc:
                return self._json({"ok": False, "error": str(exc)}, 422)
        if endpoint in ("/__alia_payment_config", "/__alia_payment_followup"):
            try:
                from payment_followup import configuration, analyze
                if endpoint == "/__alia_payment_config":
                    return self._json(configuration(monthly.DATA_ROOT))
                query = parse_qs(urlsplit(self.path).query)
                return self._json(analyze(monthly.DATA_ROOT, query.get("year", ["2026"])[0], query.get("month", ["1"])[0], query.get("plan", [None])[0], query.get("observed", [None])[0], query.get("basis", ["adjusted"])[0], query.get("advance", ["0"])[0] == "1"))
            except (ValueError, OSError) as exc:
                return self._json({"ok": False, "error": str(exc)}, 422)
        if endpoint == "/__alia_original_records":
            try:
                from original_records import detail
                query = parse_qs(urlsplit(self.path).query)
                return self._json(detail(monthly.DATA_ROOT, query.get("id", [None])[0], query.get("kind", ["contract"])[0]))
            except (ValueError, OSError) as exc:
                return self._json({"ok": False, "error": str(exc)}, 422)
        if endpoint == "/__alia_explorer_history":
            return self._json(monthly.explorer_history())
        if endpoint == "/__alia_monthly_history":
            return self._json(monthly.monthly_history())
        if self.path.split("?", 1)[0] in ("/", "/index.html"):
            sync()
        if self.path.split("?", 1)[0] == "/__alia_data":
            if not LOCAL_DATA.exists():
                return self._json({"mode": "DEMO", "records": []})
            try:
                return self._json(monthly.validated_snapshot(json.loads(LOCAL_DATA.read_text(encoding="utf-8"))))
            except (OSError, ValueError) as exc:
                return self._json({"error": str(exc)}, 500)
        if self.path.split("?", 1)[0] == "/__alia_status":
            body = _status.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        return super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        super().end_headers()


if __name__ == "__main__":
    print("ALIA Local http://localhost:" + os.environ.get("ALIA_PORT", "5500") + "/", flush=True)
    ALIAHTTPServer(("127.0.0.1", int(os.environ.get("ALIA_PORT", "5500"))), Handler).serve_forever()

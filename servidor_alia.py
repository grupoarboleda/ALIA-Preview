"""ALIA local server: refresh browser to fetch latest develop from GitHub."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import subprocess
import threading
import time

ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)
_lock = threading.Lock()
_last_sync = 0.0
_status = "Esperando primera actualización"


def sync():
    global _last_sync, _status
    if time.monotonic() - _last_sync < 3:
        return
    with _lock:
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


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split("?", 1)[0] in ("/", "/index.html"):
            sync()
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
    print("ALIA Local http://localhost:5500/ — Ctrl+F5 sincroniza develop", flush=True)
    ThreadingHTTPServer(("127.0.0.1", 5500), Handler).serve_forever()

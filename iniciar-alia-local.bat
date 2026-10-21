@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  echo ALIA Local: http://localhost:5500/
  start "" "http://localhost:5500/"
  py -m http.server 5500 --bind 127.0.0.1
  goto :end
)
where python >nul 2>nul
if %errorlevel%==0 (
  echo ALIA Local: http://localhost:5500/
  start "" "http://localhost:5500/"
  python -m http.server 5500 --bind 127.0.0.1
  goto :end
)
echo Python no se encuentra instalado o disponible en PATH.
echo Instala Python y vuelve a ejecutar este archivo.
pause
:end

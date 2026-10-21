@echo off
setlocal
cd /d "%~dp0"
if not exist ".git" (
 echo Esta carpeta proviene de un ZIP y no permite actualizaciones automaticas.
 echo Ejecuta instalar-alia-local.bat para preparar la carpeta con Git.
 pause
 exit /b 1
)
where py >nul 2>nul
if %errorlevel%==0 (
 start "" "http://localhost:5500/"
 py servidor_alia.py
 goto :end
)
where python >nul 2>nul
if %errorlevel%==0 (
 start "" "http://localhost:5500/"
 python servidor_alia.py
 goto :end
)
echo Necesitas Python disponible en PATH.
pause
:end

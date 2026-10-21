@echo off
setlocal
set "DEST=C:\Users\noemi\Documents\2. GRUPO ARBOLEDA\7. ALIA CORP"
where git >nul 2>nul
if errorlevel 1 (
 echo Git no esta instalado. Instala Git for Windows desde https://git-scm.com/download/win
 pause
 exit /b 1
)
where py >nul 2>nul
if errorlevel 1 (
 where python >nul 2>nul
 if errorlevel 1 (
  echo Python no esta disponible. Instala Python desde https://www.python.org/downloads/windows/
  pause
  exit /b 1
 )
)
if exist "%DEST%\.git" (
 echo Actualizando ALIA Local existente...
 git -C "%DEST%" pull --ff-only origin develop
 if errorlevel 1 goto :error
) else (
 if exist "%DEST%" (
  dir /a /b "%DEST%" | findstr . >nul
  if not errorlevel 1 (
   echo La carpeta %DEST% contiene archivos sin Git. No se sobrescribira.
   pause
   exit /b 1
  )
  echo Carpeta vacia detectada: se instalara ALIA aqui.
 )
 echo Descargando ALIA develop por primera vez...
 git clone --branch develop --single-branch https://github.com/grupoarboleda/ALIA-Preview.git "%DEST%"
 if errorlevel 1 goto :error
)
echo Iniciando ALIA Local...
call "%DEST%\iniciar-alia-local.bat"
exit /b %errorlevel%
:error
echo No se pudo sincronizar. Revisa la conexion y el acceso a GitHub.
pause
exit /b 1

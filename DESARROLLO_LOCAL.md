# ALIA Local — sincronización automática

## Instalación única en Windows

1. Descarga el archivo `instalar-alia-local.bat` desde la rama develop de GitHub (botón **Download raw file**).
2. Ejecútalo una sola vez. Requiere Git for Windows y Python instalados. Si GitHub solicita autenticación, autoriza el acceso al repositorio.
3. El instalador clona la rama `develop` en `%USERPROFILE%\\ALIA-Local` y abre ALIA en http://localhost:5500/.
4. Para volver a trabajar, ejecuta `%USERPROFILE%\\ALIA-Local\\iniciar-alia-local.bat`.
5. Con el servidor abierto, presiona **Ctrl+F5** en el navegador. El servidor ejecuta `git pull --ff-only origin develop` antes de servir la página.

El estado de sincronización puede consultarse en http://localhost:5500/__alia_status y en la consola del servidor.

**Limitaciones:** necesita conexión a GitHub, Git y permisos para acceder al repositorio. Si se editan archivos locales y Git detecta conflictos, no se sobrescriben; la sincronización informa del error. La actualización automática solo consulta la rama `develop`, no publica cambios en `main`. El servidor escucha únicamente en `127.0.0.1` y no expone archivos a la red local. No guardar matrices sensibles en este repositorio público.

El servidor no se ejecuta en la computadora hasta que completes la instalación única.

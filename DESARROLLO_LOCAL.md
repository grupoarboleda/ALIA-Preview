# ALIA — desarrollo local (Windows)

La rama **develop** es el ambiente de trabajo. La rama **main** es la versión publicada en GitHub Pages. No se deben subir matrices reales, datos confidenciales ni credenciales al repositorio público.

## Inicio rápido

1. Descarga el ZIP de la rama develop: https://github.com/grupoarboleda/ALIA-Preview/archive/refs/heads/develop.zip
2. Extrae el ZIP en una carpeta de tu computadora.
3. Haz doble clic en `iniciar-alia-local.bat`. Necesitas Python instalado y disponible mediante `py` o `python`.
4. Abre **http://localhost:5500/** si el navegador no se abre automáticamente.
5. Para ver cambios en archivos locales, actualiza el navegador con Ctrl+F5. Para detener el servidor, cierra la ventana de la consola.

### Cómo recibir cambios nuevos

Si descargaste el ZIP, vuelve a descargar la rama develop y sustituye los archivos de tu carpeta. Para evitar repetir descargas, puedes clonar el repositorio una sola vez con Git y luego ejecutar `git pull origin develop` desde esa carpeta.

### Publicación

Solo fusionaremos `develop` en `main` cuando la versión haya sido probada y aprobada. La página pública permanece en https://grupoarboleda.github.io/ALIA-Preview/.

**Importante:** localhost solo es accesible desde el equipo donde se ejecuta el servidor. El asistente puede actualizar GitHub, pero no modificar directamente los archivos de tu PC ni abrir tu servidor local.

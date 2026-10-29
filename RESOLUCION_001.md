# ALIA-CODEX-RESOLUCIÓN-001 — resolución local, 29 octubre 2026

## Causa demostrada

El corte guardado de octubre contiene 398 filas, cero con `raw_columns`, aunque declara un catálogo de 564 columnas. Los diez originales están disponibles y sus SHA256 coinciden con el manifiesto. La recuperación anterior sólo buscaba carpetas inmediatas y no encontraba esos archivos. La tabla consultaba esa proyección histórica incompleta, no un repositorio íntegro.

La matriz real confirma fila 12 + encabezado fila 11: proceso ID17/Q y administrador ID59/BG. Para ESTA fuente, Codificado es ID497/SC, Comprometido ID499/SE y Devengado ID500/SF. ID498/SD es Certificado y ID501/SG es Saldo compromiso. El diccionario Python ya reflejaba esa correspondencia; el fallback de la tabla empleaba 498/500/501 y podía mostrar conceptos incorrectos al recuperar columnas. Ahora usa `mapped_field` del catálogo validado. No se corrigieron las cifras aprobadas del backend por una suposición de posición.

Se reprodujeron respuestas HTTP200 truncadas/reset al descargar JavaScript grande y JSON en el servidor HTTP/1.0. El navegador no siempre ejecutaba el explorador; con HTTP/1.1, pruebas de descarga completa por hash y navegador pasan. No se atribuye universalmente el fallo a todos los clientes HTTP/1.0.

El cambio de corte de la gráfica también reiniciaba la selección del detalle. Se separa esa selección durante la carga de un corte, sin alterar las fórmulas financieras ni el estado del gráfico.

## Arquitectura aplicada

- `original_records.py`: archivo XLSX exacto por SHA, proyección completa versionada por parser y registro inmutable de revisiones por año/mes/SHA. Todo fuera del repositorio, en `.alia_local_data`. El XLSX conserva todas las hojas/filas/celdas; la proyección de asignaciones conserva `raw_columns`, celdas físicas, identidad y fila original, catálogo y tipos declarados/observados.
- Reconstrucción explícita con `--source-dir`: exige hash exacto y coteja cada identidad e importe contra el snapshot anterior antes de registrar un corte utilizable. Idempotente; no reescribe los JSON históricos ni `current.json`/manifest. Se reconstruyeron los diez meses existentes, sin pedir cargas innecesarias al usuario.
- Importaciones nuevas conservan el original antes de publicar el corte. Archivos temporales únicos, serialización de cargas del mismo servidor, reconocimiento de duplicados y restauración de snapshot/manifiesto ante fallos de escritura comprobados. El commit del registro de originales ocurre tras la validación. No se ha ensayado corte de energía a mitad de una escritura de varios archivos; no se certifica una transacción de base de datos. Permanecen originales/revisiones para recuperación.
- `GET /__alia_original_records?kind=contract|process&id=...`: último año/mes cronológico, búsqueda exclusivamente dentro de ese corte, sin retroceder a otro mes si falta la selección. Sin nombres inventados. Error explícito si falta reconstrucción. No depende del mes de las gráficas.
- `detail-table-v2.js`: misma selección, catálogo original completo, añadir y retirar columnas (también predeterminadas), nombres múltiples distintos y sumas de asignaciones sólo dentro de un corte. Filas con el mismo contrato son asignaciones legítimas; no se eliminan por repetir número. No se suman cortes acumulativos.
- `data-engine.js`/`pivot-panel.js`: agrupación, dos dimensiones, filtro, suma/promedio/conteo/distintos/mínimo/máximo sobre ese mismo repositorio. No crean otra fuente financiera. El Centro de importación muestra qué archivos requieren reconstrucción.
- El lector de cortes y el repositorio admiten ordenar años/meses. El Centro de importación aprobado continúa configurado para ejercicio 2026; no se rediseñó su interfaz anual. Fechas de mes asignadas siguen siendo provisionales, no fechas internas inventadas.

## Verificación ejecutada

- Python: 12 pruebas de originales/importaciones/HTTP y 7 reglas existentes PASS.
- Motor JS: 7 comprobaciones existentes PASS.
- Navegador Edge sobre datos locales: 29 comprobaciones PASS (dos contratos, metadatos, 564 columnas, importes, añadir/quitar, contrato con varias asignaciones, enero en gráfica con detalle de octubre, treemap presente, sin errores JS).
- Excel original: 3.980 asignaciones de diez archivos, todos los valores de sus 564 columnas comparados exactamente; importes conciliados a centavos. Contratos 32-2026 y 25-2026 con proceso y administrador presentes. Resultados sanitizados adjuntos, sin contenido institucional.
- Diez proyecciones mensuales de la versión anterior y candidata ejecutadas en lectura sobre el mismo almacenamiento: idénticas para identidad y campos financieros.
- Diez snapshots y manifiesto: 11 hashes idénticos antes/después. Respaldo previo privado conservado. La comparación HTTP con el servidor anterior falló por reset; NO se cuenta como prueba superada. Se usó comparación directa del backend baseline.
- Capturas con nombres/importes institucionales y copia de seguridad se mantienen únicamente en `.private-evidence/`, ignorada por Git; no se publican matrices ni datos en el fork/PR.

## Archivos y operación

Modificados: `servidor_alia.py`, `importaciones_backend.py`, `importador_matriz.py`, `explorer.js`, `detail-table-v2.js`, `data-engine.js`, `pivot-panel.js`, `importaciones.js`, `index.html`. Añadidos: repositorio `original_records.py`, `.gitignore`, pruebas y este informe. `DICCIONARIO_COLUMNAS_ALIA.json` se verificó contra Excel; se conserva porque sus IDs ya son correctos.

Reproducción de pruebas: `python -m unittest discover -s tests -p 'test_*.py'`; `python -m unittest test_reglas_matriz_alia`; `node` con `data-engine.js` y `tests/data-engine.test.js`; navegador con `tests/browser-originals.cjs` y variables `ALIA_PLAYWRIGHT_MODULE`, `ALIA_BROWSER_PATH`, `ALIA_TEST_BASE`, `ALIA_EVIDENCE`. Matrices opcionales: `python tests/verify_local_originals.py --source-dir <carpeta-originales>`. Diagnóstico/reconstrucción: `python original_records.py --source-dir <carpeta-originales> [--apply]`.

Servidor de revisión en loopback, sin auto-sync de ramas de trabajo. Python se reinició para cargar el backend; Ctrl+F5 solo no recarga módulos Python. No se modifica producción, main, matrices ni los históricos financieros.

La cuenta conectada `htpweb` tiene READ en `grupoarboleda/ALIA-Preview`, por lo que el código se entrega desde un fork y no puede integrarse por esta cuenta en `develop`. El repositorio adicional `grupoarboleda/ALIA` devolvió 404 con esta conexión; no se afirma haberlo revisado. La prueba funcional se hace contra el checkout real y los originales disponibles.

## Entrega y estado de integración
Implementación: commit 2c54a2212255f686686aa869da214cf8bf9cc270, rama fix/alia-original-records-resolution001 del fork htpweb/ALIA-Preview. PR contra develop: https://github.com/grupoarboleda/ALIA-Preview/pull/2 (OPEN; no fusionado).
La carpeta local original quedó en esa rama tras verificar que no tenía modificaciones versionadas ajenas. Se reinició su servidor en http://localhost:5500/ y se repitieron allí las 29 comprobaciones de navegador: PASS, cero errores JS. Los 11 archivos históricos continúan byte-idénticos. El lanzador iniciar-alia-local.bat de esa carpeta carga la corrección; las ramas de revisión no hacen git pull automático desde develop.
La integración remota sigue pendiente de una cuenta con permiso de escritura en grupoarboleda/ALIA-Preview. La entrega funcional local y el PR están completos; no se declara develop actualizado ni publicación productiva.

# ALIA — Arquitectura de datos de MATRIZ CONSOLIDADA
Fecha de revisión: 2026-10-21. Estado: diseño fundamentado en el archivo de octubre y tres archivos rotulados septiembre. NO es aún un importador operativo ni datos cargados al dashboard.

## Objetivo y alcance
Conservar el dashboard gerencial existente: filtros de unidad, área y fuente; saldos sin comprometer (procesos); saldos sin devengar (contratos); series de devengado y avance físico; seguimiento de hitos; selector de Devengado / Devengado + anticipo y % / USD. Los proyectos describen la asignación presupuestaria; procesos y contratos son unidades de gestión. Un proceso tiene un código y da lugar a un contrato; un contrato puede financiar varios proyectos. Un proceso sin compromiso sigue siendo proceso; un contrato debe tener compromiso confirmado, no solo número escrito.

## Fuentes examinadas
- Matriz_Seguimiento PGE_21 OCTUBRE 2026, hoja MATRIZ CONSOLIDADA, encabezado de campos fila 11, datos desde fila 13. Aproximadamente 398 filas de registros con código de proceso y 538 campos identificados.
- Archivos con nombre 29 SEPTIEMBRE 2026: encabezado de campos fila 10, datos desde fila 12. Sus celdas Reporte observadas indican 2026-10-19, no septiembre; NO tratarlos como septiembre sin reconciliar.
- Octubre: celda Reporte de registros observados indica 2026-10-20. La fecha interna manda, nunca el nombre del archivo.
- Cifras de exploración son preliminares, no auditadas. No subir archivos fuente ni exportaciones con datos institucionales al repositorio.

## Diccionario mínimo (columnas Excel; encabezados literales prevalecen)
A Reporte; B/C código PAI; F unidad; M fuente de financiamiento; P código del proceso; Q tipo proceso; R nombre proceso; S nombre proyecto; T área requirente; AT estado proceso; AH fecha publicación; AL fecha adjudicación; AO fecha suscripción; AP/AV número contrato; HS total avance físico; IA anticipo pagado; RC/RD/RE devengado acumulado de proceso; RF avance global de proceso; SD codificado año N; SF comprometido año N; SG devengado año N; SI anticipo año N; SK devengado + anticipo; SL espacio por devengar; campos de proyección de devengo a partir de SO/TB/TQ (validar su semántica y disposición mensual antes de consumir). Otros campos útiles: RH precontractual, RI avance físico proyecto, RJ liquidación, RK avance total, RO estado proceso, RQ estado proyecto.
Los nombres SD/SF/SG/SI son **AÑO N**: no sustituir automáticamente por acumulados históricos RC/RE. Validar la relación de SF con contratos y de SI con anticipos efectivamente aplicables.

## Modelo normalizado
1. import_batches(batch_id, file_name, file_hash, imported_at, internal_report_date, inferred_period, source_kind=REAL|SIMULATED, validation_status, row_count).
2. raw_assignments(batch_id, source_row, all original columns or raw JSON, source_hash): inmutables, trazables.
3. assignment_snapshots(batch_id, report_date, project_key, process_key, contract_key nullable, area, funding_source, codified_n, committed_n, accrued_n, advance_n, physical_pct, process_status, publication_date, adjudication_date, signature_date, ...).
4. processes(process_key, normalized_code, display_name), contracts(contract_key, normalized_contract_number, process_key), projects(project_key, PAI+nombre según reglas auditadas), assignment_links(process_key, project_key, funding_source, batch_id, source_row).
5. monthly_snapshots(period, entity_type, entity_key, metric, value, data_origin, batch_id), process_stage_snapshots(period, process_key, stage, batch_id), contract_physical_snapshots(period, contract_key, physical_pct, batch_id), contract_projection(period, contract_key, projected_accrued, plan_version, batch_id).
6. validation_issues(batch_id, row, code, severity, message) y dedupe decisions auditables.

## Claves, agrupación y controles
- Filtrar filas de datos reales; ignorar títulos, encabezados duplicados, filas vacías, totales y celdas de fórmulas de presentación.
- Normalizar códigos con trim, espacios, guiones y mayúsculas sin perder ceros iniciales. Si falta código P, no crear identidad ficticia sin registrar incidencia.
- Para procesos: COUNT DISTINCT process_key. Para contratos: COUNT DISTINCT contract_key (número AP/AV validado + proceso); mismo contrato en varios proyectos cuenta una vez.
- NO deduplicar ni sumar montos financieros sin revisar si la fila es asignación presupuestaria o repetición informativa. Clave de asignación propuesta: batch + código PAI + proceso + proyecto + fuente + identificador estable de partida; resolver duplicados con auditoría y regla explícita.
- Los saldos por fila elegible: sin comprometer = MAX(0, SD-SF); sin devengar = MAX(0, SF-SG). Agregar por unidad de gestión según asignaciones verificadas. Alertar saldos negativos, SF>SD, SG>SF y SI no conciliado; no ocultar incidencias en sumas.
- La presencia de número de contrato NO basta: la condición contractual exige SF>0 o evidencia contable validada. Detectar casos mixtos con compromiso parcial.
- Hitos: POR PUBLICAR, PUBLICADO, ADJUDICADO, CONTRATADO; ejecución, liquidación y cierre se validan por campos y estados reales. Permanencia = número de cortes mensuales consecutivos en el mismo estado, NO días.
- Avance físico HS es una proporción 0..1, convertir a 0..100 al presentar. Si hay múltiples filas del mismo contrato, no sumar porcentajes: ponderar por asignación validada o exigir registro maestro del contrato.
- % financiero contrato = devengado / comprometido; USD = montos absolutos. Avance físico siempre %. Devengado + anticipo requiere regla de no doble contabilización (anticipos amortizados y fecha efectiva).
- Proyección de devengo: usar meses de programación existentes, distinguir PLAN ORIGINAL, PROYECCIÓN ACTUAL y DEMO; no extrapolar cifras reales como si fueran proyecciones oficiales.

## Temporalidad y simulación
- Meses enero-agosto 2026 sin reportes confiables: generar escenarios de PRUEBA explícitamente SIMULADOS, nunca sobrescribir ni mezclarlos con REAL. Octubre real, septiembre solo cuando fecha interna y contenido se validen.
- Series acumuladas deben ser no decrecientes dentro de una versión presupuestaria, salvo ajustes/reversiones reales explicados. No deducir trayectoria física desde el devengado.
- Aceptar varios cortes del mismo mes; seleccionar el último por fecha real del campo A, preservando todos los snapshots originales. Detectar discrepancia nombre vs fecha y avisar antes de confirmar carga.
- Simulación de prueba: interpolación conservadora por entidad entre 0 y valor real de octubre, con mes y origen SIMULATED; etapas ficticias solo en ambiente demo. Esta interpolación NO representa historia de ejecución.
- El corte 2026-10-20 no equivale a cierre de octubre: etiquetar CORTE 20 OCT 2026.

## Flujo futuro de importación (pendiente de implementar)
Subir XLSX → vista previa de hojas y fecha detectada → validación de columnas/fechas/identidades/duplicados → comparación con cortes existentes → resumen de incidencias → confirmación de importación → snapshot versionado → recálculo de indicadores y series → panel de auditoría. No enviar datos a GitHub. Los importadores deben ejecutarse localmente o en backend autorizado, no publicar matrices en un repositorio público.

## Estado de implementación
Este documento es el contrato de datos inicial. El dashboard continúa con datos DEMO hasta implementar, probar y conectar un importador. Próximo hito: parser XLSX con pruebas contra octubre, conciliación de sumas por asignación, importación multiarchivo y selector REAL/DEMO. No afirmar que la importación está lista antes de verificar esos pasos.

## Reglas originales recuperadas de la conversación (prioridad de diseño)
- Una fila es una **porción financiera** por proyecto/fuente/proceso; conservarla y sumar montos elegibles. El mismo contrato puede relacionarse con varios proyectos, pero se cuenta una sola vez como contrato. No eliminar filas solo por repetir códigos.
- La fila 12 del XLSX de octubre contiene índices de campos: C=2 (PAI), M=12 (fuente), P=15 (proceso), T=19 (área), AP=41 (contrato), SD=498 (codificado), SF=500 (comprometido), SG=501 (devengado), SI=503 (anticipo), SK=505 (devengado+anticipo). El índice Excel no coincide con la posición física si se interpreta de otro modo; siempre validar encabezados de la fila 11.
- Los importes anuales de las columnas 498–505 son acumulados al corte. El valor del mes se calcula como diferencia entre cortes consecutivos **comparables**, no sumando reportes acumulados.
- Monto contratado total y codificado del año pueden ser diferentes. Ejecución presupuestaria = devengado año N / codificado año N; seguimiento financiero de contrato y avance físico usan bases y cronogramas propios. Nunca mezclar denominadores.
- Antes de consolidar, identificar si hay filas de detalle, totales, subtotales, repartos por fuente o repeticiones informativas. Un código repetido NO significa por sí mismo doble conteo financiero.
- El parser `importador_matriz.py` es una primera herramienta **local de previsualización**: lee filas y columnas originales, extrae claves y valores, advierte fechas internas y devuelve JSON. No alimenta aún el dashboard ni sustituye las series DEMO. Las 9 matrices históricas se incorporarán después de la revisión de su fecha interna y estructura.

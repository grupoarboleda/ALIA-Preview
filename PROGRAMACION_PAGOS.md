# Programación y pagos — nueva rama ALIA

## Uso

Abrir **Programación y pagos** en el menú o **RAMA 02 → Abrir seguimiento de pagos** en el Explorador. La nueva vista no cambia sus gráficas, filtros ni importes.

1. Seleccionar **mes programado**: p. ej. septiembre. Se conserva automáticamente el corte de programación de septiembre si está disponible; no se sustituye por la programación revisada en octubre. El corte puede elegirse expresamente.
2. Seleccionar **seguimiento hasta el corte**: p. ej. octubre. Sólo se ofrecen cortes originales disponibles del ejercicio. Ningún mes futuro se convierte en cero ejecutado.
3. Elegir línea base ajustada (predeterminada) o inicial y, opcionalmente, un contrato/proceso. Gráfica, indicadores y tabla se acotan a ese contrato o al grupo de contratos programados en el mes.
4. La gráfica presenta programación, ejecución mensual de la matriz y transferencias con datos completos. Pulsar un mes cambia el grupo programado. La tabla inferior presenta contrato, proceso, administrador, monto programado, ejecución en el mes, ejecución posterior y trámites.
5. **Meses y trámites** muestra los doce meses y cada registro de factura/anticipo, con fecha, importe, número, fila e IDs de origen. Es posible incluir registros anteriores al mes programado. La búsqueda también encuentra números de trámite/caso.

## Diccionario verificado

- Inicial: IDs508–519; ajustada:523–534; ejecución mensual:538–549. Se validan los encabezados enero–diciembre del catálogo original; totales/comentarios posteriores no se suman como meses.
- Facturas:25 bloques de8campos, ID237–436; número, fecha de transferencia y valor neto pagado por factura. Anticipo:233/235/234, opcional y separado del devengo.
- **Número de caso = número de trámite**, por instrucción expresa del propietario. Diccionario v1.2 incluye un campo canónico `payment_procedure_number` y aliases, incluido ID261. El encabezado literal se conserva como evidencia; la búsqueda y la detección de repeticiones usan el mismo significado, sin exigir reimportar.

## Reglas y límites

Se consulta un corte de programación y otro de observación, sin sumar snapshots acumulados. Las asignaciones legítimas de un mismo contrato/proceso se suman dentro del corte. Importes calculados con Decimal; texto y valores originales no se alteran.

Devengado, ejecución mensual de la matriz y transferencia neta no son conceptos intercambiables. La matriz no proporciona una clave unívoca entre cada cuota programada y una factura. La vista muestra ejecución/transferencias del contrato en el mes y posteriores, pero no inventa una conciliación cuota–factura. No se asignan pagos mediante FIFO ni coincidencia de importes. IVA, retenciones y amortizaciones pueden explicar diferencias.

Mismo contrato+número+fecha repetido entre asignaciones se señala para conciliar: no se presume que son transferencias bancarias independientes ni se borran registros. Se conservan todas las filas y valores en el detalle. Registros sin fecha/trámite/importe válido se muestran y se excluyen de las sumas de transferencias completas. Celdas vacías representadas por ceros no generan facturas ficticias. Futuro/sin dato no equivale a cero. Cobertura parcial y diferencias de ejecución mensual frente a devengo anual se señalan para revisar la fuente.

Los meses proceden del corte asignado en la importación; no se certifica fecha de cierre bancario. El análisis utiliza originales locales; no accede a bancos ni emite comprobantes.

## Implementación

- `payment_followup.py`: selección cronológica, programación conservada, cohortes, importes, trámites y calidad de evidencia, de solo lectura.
- `payment-followup.js` y `.css`: vista independiente, gráfica mensual interactiva, selección de contrato, filtros y detalle.
- `servidor_alia.py`: GET `/__alia_payment_config` y `/__alia_payment_followup`.
- `DICCIONARIO_BLOQUES_ALIA.json`, importador, catálogo de originales y buscador: sinónimos caso/trámite, conservando fuente.
- Navegación añadida en `app.js`/`index.html`, con entrada desde la rama02 antes reservada. Las demás páginas mantienen sus filtros.

## Verificaciones

31 pruebas Python de originales/HTTP/programación y7 reglas anteriores PASS. Se cubren programación de septiembre que cambia en octubre, devengo posterior, asignaciones múltiples, duplicados, sinónimos, falta de datos, ceros vacíos, anticipos separados, futuro y fuentes inmutables.

Navegador real sobre candidata5502:17 comprobaciones PASS, incluidos PC/móvil, gráfica encima de tabla, doce meses seleccionables, contrato individual, filtros, trámites y retorno al Explorador sin errores JS. Se repetirá al activar en5500; no confundir esta prueba de candidata con despliegue productivo.

Cotejo independiente contra originales:14 grupos programados en septiembre, programación del corte09 y observación10, todos los importes de programación/ejecución y pagos coinciden con sus columnas fuente.17 registros por revisar. Once archivos históricos siguen byte-idénticos. Evidencia sanitizada en `docs/programacion-pagos`; capturas con información institucional permanecen privadas, fuera de Git.

Rama Git `feature/alia-programacion-pagos`, basada en la corrección de PR2 aún pendiente de integración. No main ni producción, no escrituras de matrices o históricos. Cuenta upstream READ: entrega por fork/PR, sin declarar merge a develop.

## Activación local y cierre

Versión funcional `ad9ad6394fc824f78fce89fc3e1490ca7b409945`, PR https://github.com/grupoarboleda/ALIA-Preview/pull/3 abierto contra develop. Instalación original en rama `feature/alia-programacion-pagos`, servidor reiniciado en http://localhost:5500/ . Prueba final allí:18 comprobaciones PC/móvil PASS, cero errores JS. Regresión de funciones anteriores:41 comprobaciones PASS en candidata. Fuente y once archivos históricos nuevamente comprobados idénticos. El merge remoto permanece pendiente de permiso WRITE.

La activación encontró dos servidores ALIA en el mismo endpoint, demostrados por netstat, uno del lanzador anterior y otro de revisión. Se cerraron sólo esos servidores identificados. Ahora se usa binding exclusivo en Windows, y la prueba automatizada rechaza un segundo listener. Se confirmó una sola instancia y respuesta de la API nueva. [Referencia primaria de Microsoft sobre reutilización/exclusividad de puertos](https://learn.microsoft.com/en-us/windows/win32/winsock/using-so-reuseaddr-and-so-exclusiveaddruse).

La cifra de registros por revisar no cuenta casillas vacías/ceros como pagos. El diccionario usa caso/trámite como sinónimos por definición humana; no los trata como conceptos distintos. La evidencia pública es sanitizada; los detalles institucionales siguen locales.

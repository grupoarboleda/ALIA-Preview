# Programación y devengado por rango mensual

## Vista vigente

En **Programación y pagos**, seleccionar **ejercicio**, **programación a comparar** (ajustada o inicial) y **Desde / Hasta**. Predeterminado: últimos tres meses del corte disponible, por ejemplo agosto–octubre. Se admite cualquier rango enero–diciembre y un solo mes. Fuente/corte de matriz está en un apartado avanzado; ambas series pertenecen al mismo corte seleccionado.

La gráfica tiene únicamente dos series: **Programado** y **Devengado**. Incluye todos los contratos/procesos con programación O devengado en el rango, también los ejecutados sin programación. No restringe los totales a una cohorte de contratos de un único mes. No usa transferencias netas como devengado.

Tabla: **ID / Contrato y proceso / Administrador / [Programado, Devengado, N.º trámite o caso] por cada mes elegido / Estado del proceso**. El estado procede de ID482. Búsqueda por contrato, proceso, administrador o trámite y filtro por estado se aplican a tabla, gráfica y totales. Cabeceras y contexto de contrato fijos, desplazamiento horizontal superior sincronizado y filas con altura limitada al panel, sin obligar a bajar hasta el final para desplazarse.

## Columnas verificadas

- Programación inicial: IDs508–519.
- Programación ajustada: IDs523–534.
- Devengado/ejecución mensual: IDs538–549.
- Septiembre: programación ajustada531 y devengado546.
- **ID456 es MULTAS COBRADAS, no devengado**. La captura y los encabezados originales de septiembre confirman546.
- Estado del proceso:482.
- Número de trámite/caso:237 +8n; valor facturado SIN IVA:238 +8n; n=0..24. Rango de los25pagos:237–436.
- Caso y trámite son sinónimos de negocio, conservando encabezados literales. Diccionario v1.3 documenta la comparación mensual.

## Regla vigente de trámites — secuencial descendente

Por corrección expresa del propietario, se elimina la búsqueda de combinaciones. Se recorren pagos registrados del mayor número de pago al menor, consecutivos, sin saltos:5/4 o4/3/2. Nunca3/1. Cada posición de pago incluye las asignaciones fuente de ese mismo número, sin escoger subconjuntos entre ellas.

Los meses se concilian del más reciente al anterior y un pago ya conciliado no se reutiliza. Un mes sin coincidencia no consume pagos, por lo que uno anterior todavía puede cotejarse contra los últimos disponibles. Se conserva el rango como filtro de visualización, sin cambiar los trámites al ocultar meses.

Si la secuencia coincide exactamente a centavos con el devengado, se muestran sus trámites en ese mismo orden. Si no suma, falta un pago en la secuencia o falta número/importe, la tabla muestra exactamente **Revisar Pagos**. No hay mensajes de varias combinaciones ni saltos hacia una factura anterior que casualmente coincida. Pulsar permite inspeccionar fuente y motivo.

## Diferencias visibles en la gráfica

Se conservan los totales y las dos barras Programado/Devengado. Dentro de ellas se distinguen Programado sin devengo registrado (violeta) y Devengado fuera de programación/excedente (ámbar). Debajo se elige mes y se separan tres casos: sin programación registrada, por encima de lo programado y programado sin devengo registrado. Cada importe filtra la tabla de contratos; el grupo general de la gráfica se mantiene y el filtro puede quitarse.

El cálculo se hace primero por contrato/proceso y después se suma. Así un exceso en uno no oculta lo pendiente de otro, aunque las barras globales fueran iguales. Programación o devengo vacíos se identifican como falta de registro; meses futuros no se clasifican como impagos. Ajustes negativos se conservan en los importes originales sin atribuirles categorías positivas.

## Comprobaciones de la revisión anterior por rango

43 pruebas Python de originales, HTTP, programación y rangos +7 reglas existentes PASS. Las pruebas sintéticas cubren una factura, suma de varias, ambigüedad, fuente sin IVA frente a neto, estado482, rango parcial/completo, futuros y estabilidad al cambiar el rango.

Candidata5503:19 comprobaciones de navegador PC/móvil PASS. Se verifican dos series, totales completos de septiembre, aceptación del ejemplo del propietario, tríos mensuales y estado, búsqueda y desglose, desplazamiento superior, un mes/12meses y conservación del Explorador. La aceptación con importes institucionales reside sólo en un archivo privado; las pruebas publicadas son sintéticas o reciben ese archivo opcional.

Cotejo independiente de agosto–octubre:30 grupos. Ambas series coinciden con los totales completos de la matriz; todas las combinaciones devueltas suman su devengado a centavos y cada identificador está antes del importe sin IVA. El ejemplo indicado por el propietario coincide con importe y trámite esperados. Once archivos históricos byte-idénticos. Matrices, capturas e importes institucionales no se publican.

Evidencia sanitizada: `docs/programacion-pagos/range-v2/`. La activación final en5500 se registra tras comprobarla. PR3 y rama `feature/alia-programacion-pagos`; sin main/producción ni escrituras a los históricos.

## Antecedente: cierre de la revisión por rango — 30 octubre 2026

La revisión anterior, implementación `63567747b6eac3a22198761a3d0ddace84a307f9` activa en http://localhost:5500/ , rama local `feature/alia-programacion-pagos`. Se completaron las19 comprobaciones de navegador sobre esa instalación: PASS, PC/móvil, sin errores JS. La comprobación final de API vuelve a confirmar el ejemplo privado del propietario, y los once archivos históricos siguen byte-idénticos.

PR vigente: https://github.com/grupoarboleda/ALIA-Preview/pull/3, descripción actualizada al alcance final por rango mensual. Cuenta conectada READ: no fusionado a develop, sin main/producción. La entrega funcional local está completada. Evidencia activa en `docs/programacion-pagos/range-v2/browser-active5500.json`.

## Revisión secuencial y diferencias — 30 octubre 2026

53 pruebas Python +7 reglas existentes PASS. Candidata5504:27 comprobaciones de navegador PASS, con filtros por diferencias, orden consecutivo, texto Revisar Pagos y regresiones de rango/tabla/contratos. La prueba de código rechaza3/1, no salta el pago más reciente, admite5/4 y4/3/2 y conserva la aceptación privada anterior. Cotejo real:17 meses conciliados del rango8–10, suma exacta, secuencia descendente y sin reutilización. El desglose de septiembre reconcilia los dos totales sin compensar contratos. Once archivos históricos byte-idénticos. Evidencia sanitizada: `docs/programacion-pagos/sequential-v3/`. Activación5500 pendiente de comprobación final de esta revisión.

### Activación de la revisión secuencial

Código `677c19fa01f0b3df83b5845bc60da761e8e56a26` activo en http://localhost:5500/ . Prueba final sobre esa instalación:27 comprobaciones PASS, PC/móvil, sin errores JS. Once archivos históricos nuevamente byte-idénticos. Resultado sanitario en `docs/programacion-pagos/sequential-v3/browser-active5500.json`. PR3 actualizado a esta regla; integración remota pendiente por READ, sin main/producción.

### Resumen del mes seleccionado
La leyenda presenta Programado, Programado No devengado, Devengado y Devengado No programado con colores diferenciados. El mes seleccionado muestra Total Programado, Total Devengado y porcentaje de cumplimiento (Devengado / Programado × 100), sin limitarlo al 100 %. Sin base programada se muestra una indicación explícita. Las tarjetas de diferencias comienzan por Programado No devengado y Devengado No Programado. Verificación de navegador: 9 PASS; evidencia en docs/programacion-pagos/month-summary-v4/browser-active5500.json.

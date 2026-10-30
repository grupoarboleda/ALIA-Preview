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

## Identificación del trámite por importe

Se busca en las facturas del mismo contrato/proceso, sin IVA: una factura o una combinación que sume exactamente el devengado mensual, a centavos. Los números se recuperan de la columna inmediatamente anterior a cada importe. El importe neto transferido no participa en esta búsqueda.

- Coincidencia única: números visibles; pulsar abre desglose de facturas, importes, filas y columnas.
- Más de una combinación: ambigua, no se escoge una arbitrariamente.
- Misma factura como única coincidencia de dos meses: requiere revisión, no se asigna dos veces automáticamente.
- Sin coincidencia, ajustes negativos, falta de datos o límite de cálculo: se indican de forma diferenciada. El usuario puede inspeccionar las facturas fuente.

Cálculo Decimal/centavos, búsqueda rápida de1/2/3facturas, meet-in-the-middle y sumas alcanzables para combinaciones mayores. Cálculo acotado para evitar bloquear la aplicación en contratos con muchas asignaciones. En la comprobación anual real quedaron dos búsquedas que requieren revisión por límite; no se presentan como ausencia demostrada de coincidencia. Una coincidencia de importe no certifica transferencia bancaria ni sustituye conciliación.

## Comprobaciones

43 pruebas Python de originales, HTTP, programación y rangos +7 reglas existentes PASS. Las pruebas sintéticas cubren una factura, suma de varias, ambigüedad, fuente sin IVA frente a neto, estado482, rango parcial/completo, futuros y estabilidad al cambiar el rango.

Candidata5503:19 comprobaciones de navegador PC/móvil PASS. Se verifican dos series, totales completos de septiembre, aceptación del ejemplo del propietario, tríos mensuales y estado, búsqueda y desglose, desplazamiento superior, un mes/12meses y conservación del Explorador. La aceptación con importes institucionales reside sólo en un archivo privado; las pruebas publicadas son sintéticas o reciben ese archivo opcional.

Cotejo independiente de agosto–octubre:30 grupos. Ambas series coinciden con los totales completos de la matriz; todas las combinaciones devueltas suman su devengado a centavos y cada identificador está antes del importe sin IVA. El ejemplo indicado por el propietario coincide con importe y trámite esperados. Once archivos históricos byte-idénticos. Matrices, capturas e importes institucionales no se publican.

Evidencia sanitizada: `docs/programacion-pagos/range-v2/`. La activación final en5500 se registra tras comprobarla. PR3 y rama `feature/alia-programacion-pagos`; sin main/producción ni escrituras a los históricos.

## Cierre de la revisión — 30 octubre 2026

Implementación `63567747b6eac3a22198761a3d0ddace84a307f9` activa en http://localhost:5500/ , rama local `feature/alia-programacion-pagos`. Se completaron las19 comprobaciones de navegador sobre esa instalación: PASS, PC/móvil, sin errores JS. La comprobación final de API vuelve a confirmar el ejemplo privado del propietario, y los once archivos históricos siguen byte-idénticos.

PR vigente: https://github.com/grupoarboleda/ALIA-Preview/pull/3, descripción actualizada al alcance final por rango mensual. Cuenta conectada READ: no fusionado a develop, sin main/producción. La entrega funcional local está completada. Evidencia activa en `docs/programacion-pagos/range-v2/browser-active5500.json`.

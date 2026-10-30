# Alertas propuestas para ALIA

Revisión del catálogo original y cobertura del último corte: 398 filas (no equivalen a 398 contratos). Fecha de análisis: 2026-10-30. Una celda no vacía no garantiza un dato válido. Reglas y umbrales propuestos, no activados automáticamente.

| Prioridad | Alerta | Regla propuesta y datos |
|---|---|---|
| 1 | Poco plazo y ejecución pendiente | Vencimiento calculado en 15/30 días y avance físico 226 inferior a 100 %, mostrando saldo por devengar 499−500 por separado. Priorizar por días y saldo. No confundir avance físico con ejecución financiera. |
| 1 | Programado no devengado | Importe pendiente por contrato y mes, con programación ajustada 523–534 y devengado 538–549. Mostrar desde qué mes; no compensar entre contratos. No afirmar impago bancario: el devengado es una etapa distinta. |
| 1 | Revisar Pagos | El devengado mensual no coincide con facturas sin IVA consecutivas desde el último pago, según regla aprobada. Trámite/caso 237+8n, importe 238+8n. Mostrar diferencia y fuente. |
| 1 | Anticipo pendiente de amortizar al cierre | Saldo de anticipo 443 positivo y contrato próximo a terminar, terminado o liquidado. Contrastar con anticipo pagado 234 y amortizaciones 241+8n. No sumar varias filas del mismo contrato sin validar su granularidad. |
| 2 | Sin avance entre reportes | Avance físico 226 y/o devengado sin incremento durante dos cortes consecutivos, en contrato activo. Indicar meses observados, no días exactos. Suspensión 474 se muestra como contexto. |
| 2 | Vencimiento requiere revisar condiciones | Hay suspensión 474, fecha integral 449 diferente o datos de prórroga 230–232. Mostrar fórmula base y contexto documental; no sumar automáticamente prórrogas ni días suspendidos. |
| 2 | Obra concluida pendiente de cierre | Avance físico completo y ausencia de acta provisional/única 450 o definitiva 451. La falta de dato exige revisión, no demuestra ausencia de documento. |
| 2 | Devengado sin programación | Devengado en contratos/meses sin programación o superior a lo previsto, con las diferencias ya calculadas. Mostrar fuera de programación y exceso separadamente. |
| 1 | Datos que impiden controlar | Plazo 49 ausente/no válido; anticipo positivo sin acreditación 235; suscripción 48/40 inválida; fechas antiguas imposibles; estados contradictorios entre filas. No producir una fecha estimada. |

Cobertura observada: estado 482 y avance físico 226 aparecen en todas las filas; plazo 49 en 313; acreditación 235 en 234; saldo de anticipo 443 en 397; suspensión 474 en 47; fecha integral 449 en 285. Prórroga 232 no contiene datos en este corte: no permite calcular una extensión automática confiable. No utilizar columnas de multas como devengado ni equiparar devengado con transferencia bancaria.

Cada alerta debería mostrar contrato/proceso, estado, administrador, importe relacionado cuando corresponda, fecha/días restantes, fuente, motivo y acción sugerida. Solo el icono general debe pulsar suavemente; respetar movimiento reducido. Umbrales configurables y sin notificaciones externas hasta que se soliciten.

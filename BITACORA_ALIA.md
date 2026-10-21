# ALIA — Bitácora maestra de acuerdos y cambios

**Proyecto:** ALIA, inteligencia presupuestaria y contractual.  
**Repositorio de trabajo:** `grupoarboleda/ALIA-Preview`, rama `develop`.  
**Fecha de apertura:** 2026-10-21.  
**Estado:** desarrollo y validación local; no publicación final autorizada.

## 1. Acuerdos permanentes

1. **Primero local, luego publicación.** El usuario revisa ALIA en `http://localhost:5500/`. No desplegar públicamente cambios ni dar por aprobada la versión final sin autorización explícita.
2. **Flujo acordado:** el asistente modifica código en `develop`; el servidor local `servidor_alia.py` ejecuta `git pull --ff-only origin develop` al solicitar la página principal; el usuario recarga el navegador (Ctrl+F5 cuando haga falta) y valida. No proponer descargas, ZIP, instaladores ni copias manuales por cada ajuste.
3. **Carpeta local de referencia:** `C:\Users\noemi\Documents\2. GRUPO ARBOLEDA\7. ALIA CORP`. El asistente no tiene acceso directo al disco del usuario; la sincronización ocurre en su servidor local.
4. **Registrar cada cambio futuro en esta misma bitácora**, con fecha, solicitud, archivos afectados, commit, validación pendiente/realizada y acuerdos nuevos. No afirmar que se comprobó visualmente en localhost si no se ha observado.
5. **Iterar por pasos**: mantener lo aprobado y modificar solo el alcance pedido; evitar saturación de elementos. Gráficos modernos, sofisticados, claros, con estética oscura azul marino/cian; no gráficos rústicos.
6. **Separación de proyectos:** ALIA no es HTP. No modificar `htpweb/htp` para solicitudes de ALIA.
7. **Datos y terminología:** los datos actuales son **demostrativos/sintéticos**, no cifras oficiales. `OBLIGADO` corresponde a **DEVENGADO**. No sustituir DEVENGADO por EJECUTADO. Distinguir devengado, comprometido, anticipo y devengado + anticipo; evitar doble conteo al incorporar datos reales.
8. **Filtros cruzados:** la selección de área, fuente de financiamiento, proyecto, proceso y mes de corte debe actualizar de manera coherente indicadores y gráficos; restablecer debe volver a la vista global.

## 2. Diseño y funciones acordadas

- Cuatro KPI principales: **Codificado**, **Comprometido**, **Devengado**, **Devengado + anticipo**, con importes y tasas correspondientes.
- Barra proporcional de **fuentes de financiamiento** por participación en codificado, mostrando además avance de devengado y permitiendo filtrar al pulsar un segmento.
- **Rama 01 / Áreas:** representación proporcional por codificado, navegación área → proyecto → proceso; para muchos proyectos, priorizar rankings, búsqueda y análisis gerencial antes que una multitud de tarjetas.
- **Rama 02 / Inteligencia temporal:** evolución histórica simulada y proyección demostrativa, con trayectorias diferenciadas según filtros y procesos. La proyección actual **no** representa una predicción validada ni historia real.
- Indicador temporal seleccionable: **Devengado**, **Comprometido** o **Devengado + anticipo**.
- Unidad temporal seleccionable mediante **exactamente dos botones visuales y excluyentes: `%` y `USD`**, no lista desplegable. El botón activo se resalta. En `%`, eje 0–100% del codificado; en `USD`, valores acumulados en dólares. Mantener la selección al volver a dibujar el gráfico.

## 3. Registro cronológico de cambios conocidos

| Fecha | Solicitud / decisión | Archivos | Commit / referencia | Estado |
|---|---|---|---|---|
| Antes del 2026-10-21 | Diferenciar perfiles mensuales por fuente/proceso para que los filtros modifiquen la curva, no solo la escala | `explorer.js` | `2f2456e` | Código incorporado |
| Antes del 2026-10-21 | Mostrar evolución como porcentaje del codificado, eje fijo 0–100% | `explorer.js` | `41f3232` | Código incorporado |
| Antes del 2026-10-21 | Alternar `%` y USD acumulados para los tres indicadores | `explorer.js`, `styles.css`, `index.html` | `3728f71`, `fdb5300`, `e5013fd` | Código incorporado |
| 2026-10-21 | Sustituir selector desplegable de unidad por botones `%` / `USD` | `explorer.js`, `styles.css`, `index.html` | `9a6cfd1`, `96a1cd5`, `a62a930` | Código incorporado |
| 2026-10-21 | Diagnóstico: estado local `Actualizado: Already up to date.`; el usuario facilitó `explorer.js` local que sí contenía ambos botones | Inspección; sin modificación | Confirmación de contenido local | **Visibilidad en pantalla no confirmada** |
| 2026-10-21 | Reforzar visibilidad de los botones con estilos explícitos y renovar versión de script para evitar caché | `explorer.js`, `index.html` | `e91bd8f`, `5518fcb` | Código incorporado; **validación visual local pendiente** |
| 2026-10-21 | Crear bitácora central y registrar en adelante todos los ajustes | `BITACORA_ALIA.md` | Este commit | Registro iniciado |

| 2026-10-21 | Navegación aprobada: retirar INICIO duplicado de Rama 01, conservar VOLVER por nivel, y dejar LIMPIAR global como única acción para nueva exploración; mantener unidad %/USD e indicador temporal | `index.html`, `explorer.js` | `b756243`, `d13be62` | Código incorporado; validación visual local pendiente |

| 2026-10-21 | Centro de Control Gerencial por área: dos bloques SIN COMPROMETER y COMPROMETIDO SIN DEVENGAR, cada uno con monto, recuento distinto de proyectos y procesos, ranking Top 5 por saldo y desglose expandible de procesos; opción de ver todos | `explorer.js`, `styles.css`, `index.html` | `e7afa60`, `c1a37f0`, `9f3429f` | Código incorporado; validación visual local pendiente |

## 4. Protocolo para próximas modificaciones

1. Consultar esta bitácora antes de modificar ALIA.
2. Aplicar el cambio pedido en `develop`, procurando no alterar funciones aprobadas.
3. Actualizar `index.html` con versión nueva de recurso cuando sea necesario para evitar caché.
4. Agregar una fila al registro cronológico **en el mismo ciclo de trabajo**, indicando commit(s) de código, archivos y estado de comprobación.
5. Informar al usuario que recargue `http://localhost:5500/` y pedir validación visual únicamente cuando corresponda.
6. Si no aparece un cambio, verificar sincronización `/__alia_status`, versión del recurso servido, errores de consola y CSS; no asumir que un commit garantiza visibilidad.
7. Solo pasar a publicación cuando el usuario lo autorice.

## 5. Pendientes y límites

- **Validado por el usuario:** los botones `%` y `USD` funcionan correctamente en ALIA Local.
- **Pendiente:** validación visual local del ajuste de navegación (un único LIMPIAR y VOLVER por nivel).
- **Pendiente:** validación visual local de los dos bloques gerenciales y rankings Top 5.
- **Pendiente para fase de datos reales:** importar y validar cortes Excel y series históricas observadas; no presentar series simuladas como registros oficiales.
- El hecho de registrar un cambio en GitHub no implica que se haya probado la interfaz en la computadora del usuario.

### 2026-10-21 — Priorización por contrato/proceso
- Cambio aprobado: los dos bloques gerenciales priorizan **contratos/procesos**, no proyectos; cada registro despliega las asignaciones a proyectos y fuentes con sus saldos.
- Agrupación: `contract` cuando está informado, y `process` como alternativa; un contrato compartido cuenta una sola vez. Se suman los saldos de asignaciones sin duplicar importes contractuales totales.
- DEMO: `CT-DEMO-01` vincula `PROC-001` y `PROC-007` (proyectos diferentes) para ilustrar la relación; **no representa datos oficiales ni confirma estructura de matriz real**.
- Commits: `1cc3b3b`, `3dafa70`, `0fbcafa`, `026c294`. Archivos: `explorer.js`, `index.html`.
- Estado: código guardado en `develop`; validación visual local pendiente. Antes de conectar datos reales, verificar identificadores únicos y cardinalidad contrato–proceso–proyecto.

### 2026-10-21 — Clarificación de procesos y contratos
- Acuerdo: un proceso tiene código único y genera un contrato; el proceso se identifica como contrato al registrar compromiso. Un proyecto puede tener varios contratos.
- Panel: `SALDO SIN COMPROMETER` muestra cantidad de **procesos**; `SALDO SIN DEVENGAR` muestra cantidad de **contratos**. Se retiraron fórmulas visibles y se agregó icono de información activable por clic/teclado con concepto y fórmula.
- Desglose Top 5 se etiqueta por procesos o contratos según el bloque. Recuento distinto por código de proceso; no por filas. Demo usa contrato diferente por proceso; valores y relaciones siguen siendo sintéticos.
- Commits: `91e33ee`, `f985d85`, `017f6d0`; archivos: `explorer.js`, `styles.css`, `index.html`.
- Estado: aplicado en `develop`, pendiente validación visual local. Con datos reales debe comprobarse la correspondencia proceso–contrato y el manejo de compromisos parciales.

### 2026-10-21 — Seguimiento temporal por reportes mensuales
- Aprobado: no calcular días. La permanencia en una etapa se mide contando reportes mensuales consecutivos con el mismo estado, incluyendo POR PUBLICAR desde asignación presupuestaria.
- Interacción: desde el ranking de procesos/contratos, `VER EVOLUCIÓN` activa la Rama 02. Proceso: bandas de etapas y avance de gestión; contrato: curvas devengado, avance físico y compromiso. Las bandas y curvas se pueden activar/desactivar.
- Los estados, meses y porcentajes de la vista nueva son DEMO sintéticos, **no** lecturas de reportes reales. Se requiere conectar snapshots mensuales reales por código de proceso/contrato para validar estancamientos.
- Archivos: `explorer.js`, `index.html`. Commit principal `bb55941`. Validación visual pendiente.

### 2026-10-21 — Acceso directo a curvas desde ranking gerencial
- Aprobado: un clic en la fila de proceso/contrato activa directamente su curva en Rama 02. Se elimina botón intermedio `VER EVOLUCIÓN` y el desglose de proyectos/financiamiento del ranking.
- Cada fila presenta código, saldo, etapa y reportes mensuales consecutivos (procesos), o devengado porcentual e intervalos sin incremento (contratos). Orden económico descendente conservado.
- Gráfica individual incluye aviso `ATENCIÓN GERENCIAL` con orientación de revisión. Todos los estados y avances temporales siguen siendo **DEMO**; no interpretar como datos reales.
- Archivos: `explorer.js`, `styles.css`, `index.html`. Commits `06a8200`, `bce466c`, `9d0f0d0`. Validación visual local pendiente.

### 2026-10-21 — Mejora visual de curva de procesos
- Por solicitud y captura de pantalla: sustituir sombreado mensual fragmentado por **bandas continuas agrupadas por etapa**; etiquetar etapa y rango de meses, contar reportes mensuales consecutivos.
- Mostrar tarjetas de POR PUBLICAR, PUBLICADO, ADJUDICADO y CONTRATADO con períodos y estado actual/superado/pendiente; señalar CORTE y atenuar meses futuros. No dibujar avance de proceso después del corte.
- Mantener controles para activar/desactivar bandas y curva, y aviso de atención gerencial. Seguimiento temporal sigue siendo **DEMO**, no evidencia real de estancamiento.
- Archivos: `explorer.js`, `styles.css`, `index.html`. Commits `3035b29`, `4672a78`, `ad3c073`. Pendiente validación visual en ALIA Local.

### 2026-10-21 — Centro gerencial transversal de la unidad
- Solicitado: mostrar saldos sin comprometer y sin devengar **en EMPRESA / ÁREAS**, sin entrar a cada área, manteniendo el mosaico original debajo.
- Implementación: panel global antes del treemap con los dos saldos consolidados, recuento distinto de procesos y contratos, ayuda de fórmula y rankings Top 5 / Ver todos. Clic en proceso/contrato actualiza la Rama 02 con su seguimiento DEMO.
- Se reutiliza `buildManagementInsight` para conservar las mismas reglas y experiencia en nivel Unidad y nivel Área. Se respetan filtros de área, fuente, proyecto y corte; los importes se agregan por asignaciones y los códigos se cuentan una vez.
- Archivos: `explorer.js`, `styles.css`, `index.html`. Commits: `37779f2`, `e989c50`, `d2ce616`, `2ad0c50`.
- Estado: código guardado en `develop`, validación visual local pendiente; datos y evolución siguen siendo DEMO. No se realizó despliegue público.

### 2026-10-21 — Barra GLOBAL desplegable en nivel Empresa
- El usuario rechazó dos tarjetas globales permanentemente visibles sobre el mosaico de áreas. Nuevo diseño: **una sola barra horizontal `GLOBAL · TODA LA UNIDAD`**, cerrada inicialmente; clic despliega/oculta los dos indicadores y rankings existentes de procesos y contratos.
- El mosaico de áreas permanece visible y sin modificaciones de jerarquía. La apertura persiste en rerenderizados del mismo nivel. Datos y curvas siguen siendo DEMO.
- Archivos: `explorer.js`, `styles.css`, `index.html`. Commits `30f9ec5`, `af348f4`, `ac75117`. Pendiente validación visual local; sin despliegue público.

### 2026-10-21 — Alternancia GLOBAL / ÁREAS en el mismo espacio
- Aprobado: al expandir `GLOBAL · TODA LA UNIDAD`, ocultar completamente el mosaico de áreas y mostrar en su lugar los dos bloques de saldo y sus rankings. Al cerrar GLOBAL, volver a mostrar el mosaico original.
- Cambio mínimo: `root.hidden` ligado al estado `unitManagementOpen`, con regla CSS específica para superar `display:block!important` del treemap. No se cambian cálculos ni navegación individual.
- Archivos: `explorer.js`, `styles.css`, `index.html`; commits `3ebeaaa`, `ce07e7e`, `b7fd7a2`. Validación visual local pendiente, sin despliegue público.

### 2026-10-21 — Animación automática y curvas contractuales reales/proyectadas (DEMO)
- Solicitud: eliminar avance manual mes a mes; curvas dibujadas automáticamente al abrir seguimiento (animación única de 3 segundos, con accesibilidad para movimiento reducido).
- Contratos: cuatro curvas activables: devengado real, devengado proyectado (discontinua), avance físico real y línea de comprometido; las curvas observadas se limitan al mes de corte y la proyección continúa hasta diciembre. Tres indicadores: real, proyectado y brecha en puntos porcentuales.
- **Límite esencial:** la fuente actual es sintética. Tanto el devengado real mensual como su programación y el avance físico están simulados; NO se conectó la programación oficial y no debe interpretarse la proyección ilustrativa como plan contractual real. No se creó proyección de avance físico.
- Procesos: la curva de gestión también se revela automáticamente; se mantienen bandas por etapa, corte y conteo de reportes.
- Archivos: `explorer.js`, `styles.css`, `index.html`. Commits: `7b94617`, `d0f06cc`, `3cb0d5e`. Validación visual pendiente en ALIA Local; sin publicación pública.

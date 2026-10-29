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

### 2026-10-21 — Coherencia entre proyección contractual y tarjetas
- Eliminada línea vertical CORTE en gráfica de contratos y referencias de corte en leyenda; colores verde/naranja siguen marcando la transición de real a proyectado.
- La tarjeta PROYECCIÓN · DICIEMBRE ahora calcula el mismo extremo final de la curva naranja: devengado real del último mes + incrementos proyectados futuros hasta diciembre, con límite de 0 a 100 %.
- La tarjeta DESVIACIÓN VS PLAN indica explícitamente el mes al que corresponde; compara devengado real con programación de ese mismo mes. Se simplificó la nota explicativa.
- Archivos: explorer.js, index.html. Commits 75b9bdc, 766869a. Datos DEMO; validación visual pendiente y sin publicación pública.

### 2026-10-21 — Gráfica contractual con formato de gráfica por área
- Cambio solicitado: leyenda debajo, línea vertical de CORTE, mes resaltado, punto de transición real/proyectado, controles % y USD, y selector Devengado / Devengado + anticipo.
- Implementación: las curvas de devengado y su continuación proyectada conservan animación secuencial. Avance físico llega solamente al mes de corte. En USD, la escala financiera usa el monto comprometido; la serie física permanece porcentual. Las tarjetas de real, diciembre y desviación responden a los selectores.
- Código: explorer.js commit 0475052; caché: index.html commit 96f60aa. Datos y programación DEMO. Validación visual local pendiente. Sin publicación pública.

### 2026-10-21 — Corrección visual de controles y sombreado contractual
- Usuario reportó controles %/USD invisibles, ausencia de sombreado bajo curva real y texto explicativo DEMO redundante.
- Se aplicaron estilos explícitos de visibilidad a los dos botones y su contenedor, idénticos al selector de unidad en gráfica general.
- Se añadió relleno turquesa semitransparente bajo devengado real hasta corte, con animación. Se retiró exclusivamente el párrafo descriptivo bajo la leyenda contractual; permanecen leyenda, tarjetas, curva física, línea CORTE y referencia comprometido.
- Archivos: explorer.js (0335b6e), index.html (859d7c1). Validación visual pendiente; datos DEMO y sin despliegue público.

### 2026-10-21 — Homologación de tarjetas de evolución (área y contrato)
- Se combinaron los dos diseños aprobados: tarjetas con fondo y borde discretos para ambos paneles, y colores consistentes por naturaleza del dato.
- En área y contrato, las etiquetas principales ahora son idénticas: VALOR AL CORTE (turquesa, histórico real/simulado) y PROYECCIÓN DICIEMBRE (naranja). En contratos se mantiene tercera tarjeta DESVIACIÓN VS PLAN (blanco neutro).
- Los colores coinciden con las líneas verde/turquesa del histórico y naranja de la proyección; la estructura de las tarjetas y su tipografía son compartidas.
- Archivos: explorer.js (b042a4f), styles.css (6dfe9f9), index.html (37122c3). Sin cambios en cálculos. Datos DEMO, validación visual pendiente, sin publicación pública.

### 2026-10-21 — GLOBAL vinculado a gráfica consolidada de toda la unidad
- Al abrir la barra GLOBAL en EMPRESA / ÁREAS, la Rama 02 muestra la evolución y proyección agregada de TODOS los registros de Unidad Esmeraldas (sin restringirse a un área), equivalente a tratar toda la unidad como una sola área.
- Se conserva el formato estándar de la gráfica temporal, selectores de indicador y %/USD, línea CORTE y tarjetas VALOR AL CORTE y PROYECCIÓN DICIEMBRE. El contexto identifica explícitamente TOTAL UNIDAD ESMERALDAS.
- Al cerrar GLOBAL se restaura la gráfica del contexto anterior; el panel de áreas vuelve a mostrarse. Se mantiene la capacidad de seleccionar un proceso o contrato en los bloques globales.
- Archivos: explorer.js (e0be73c), index.html (caché actualizado). Datos DEMO; pendiente validación visual; sin despliegue público.

### 2026-10-21 — Avance físico reemplaza desviación vs plan en contratos
- Solicitado: sustituir tercera tarjeta DESVIACIÓN VS PLAN por AVANCE FÍSICO al mes de reporte.
- Implementado: tercera tarjeta AVANCE FÍSICO · MES muestra `physical[current]` en %, independientemente del selector USD/%; color azul correspondiente a la curva física. Sin cambios en las dos tarjetas financieras ni en las curvas.
- Datos físicos siguen simulados (DEMO) hasta conectar registros reales. Archivos: explorer.js (`885166f`), styles.css (`c537a1c`), index.html (`55f2a6c`). Validación visual pendiente. Sin publicación pública.

### 2026-10-21 — Retiro de secciones obsoletas del explorador
- Por solicitud con capturas, se eliminó del HTML la sección antigua «02 // Telemetría financiera / Evolución por corte» con gráfico codificado vs devengado.
- Se dejó de invocar el explorador antiguo de proyectos en el nivel proyecto, retirando de la interfaz «Mayor oportunidad de seguimiento», simulador de brecha TOP 3, «Proyectos con mayor impacto potencial», treemap y «Prioridad de seguimiento».
- Se preservó la navegación estándar por tarjetas de proyectos y el panel nuevo de Inteligencia Temporal / seguimiento de contratos y procesos.
- Archivos: index.html (`5cfc962`), explorer.js (`47872f0`). No se modificaron las fuentes de datos. Validación visual local pendiente; sin publicación pública.

### 2026-10-21 — Reparación: bloques gerenciales por área restaurados
- Se detectó una regresión introducida al retirar el explorador antiguo de proyectos: desaparecieron también los dos bloques operativos de cada área.
- Se restituyó `buildManagementInsight(filtered, 'LECTURA GERENCIAL · ÁREA')` cuando Rama 01 está en nivel proyecto después de seleccionar un área. Vuelven SALDO SIN COMPROMETER (procesos) y SALDO SIN DEVENGAR (contratos), con rankings, selección y gráfica temporal de seguimiento.
- Se conserva el panel GLOBAL independiente, las tarjetas de proyectos y la eliminación del simulador/treemap/ranking antiguos. El bloque gerencial se dispone a ancho completo encima de tarjetas.
- Archivos: explorer.js (`bb53f5b`), styles.css (`119c923`), index.html (`c1930db`). Validación visual local pendiente; sin publicación pública.

### 2026-10-21 — Área sin tarjetas de proyectos
- Al entrar en un área, se muestran exclusivamente los dos bloques gerenciales SALDO SIN COMPROMETER (procesos) y SALDO SIN DEVENGAR (contratos), con rankings clicables que conducen a la gráfica temporal.
- Se suprimen las tarjetas individuales de proyectos en ese nivel. Se mantienen las tarjetas de áreas en la vista raíz y el panel GLOBAL. No se alteran cálculos ni datos.
- Código verificado en explorer.js rama develop; caché actualizada en index.html. Validación visual local pendiente; sin despliegue público.

### 2026-10-21 — Arquitectura de datos reales MATRIZ CONSOLIDADA
- Se revisó la matriz adjunta de corte 20 octubre 2026 y archivos rotulados septiembre. Octubre contiene encabezado en fila 11 y aproximadamente 398 registros de proceso; campos SD/SF/SG/SI/HS y claves P/AV/T/M. Los archivos llamados septiembre muestran fecha interna 19 octubre: incidencia de calidad de datos a resolver.
- Se creó `ARQUITECTURA_DATOS_ALIA.md` con modelo de lotes, filas originales, asignaciones, procesos, contratos, proyectos, snapshots mensuales, conciliación y validación, distinción REAL/SIMULATED y diseño del futuro panel de importación.
- Decisión: el contrato es unidad de gestión; contar contratos/procesos únicos, conservar asignaciones por proyecto y fuente sin doble conteo financiero. Enero-agosto simulados solo para pruebas, sin confundir con historia real.
- Commit documento `3e1096a83`. Aún NO se implementa el importador ni se sustituyen los datos DEMO del dashboard; validación funcional pendiente. No se subieron matrices ni se hizo despliegue público.

### 2026-10-21 — Primer importador local y reglas originales de matriz
- Se recuperaron reglas originales: sumar porciones financieras sin eliminar filas repetidas, contar procesos y contratos únicos, distinguir monto contratado de codificado anual y calcular incrementos mensuales por diferencia de cortes acumulados.
- Se creó `importador_matriz.py` (commit `19f1f78`), parser XLSX local con lectura de MATRIZ CONSOLIDADA, fecha interna, columnas financieras, claves de proceso/contrato, incidencias y salida JSON opcional de previsualización. No sube archivos, no altera el dashboard ni importa datos automáticamente.
- Se amplió `ARQUITECTURA_DATOS_ALIA.md` con estas reglas. Pendiente: prueba integral del parser, conciliación de saldos, conexión al panel y carga de 9 reportes históricos que el usuario facilitará mañana. Datos reales no publicados.

### 2026-10-22 — Primera integración de matriz real en ALIA Local
- Revisada la matriz actualizada de 564 columnas. 398 asignaciones con corte 20/10/2026; SD 12,594,351.20, SF 10,380,402.00, SG 6,421,438.90; 208 códigos proceso y 176 contrato. Columnas UH–US registran avance físico mensual.
- Se extendió el parser local `importador_matriz.py`, el servidor `servidor_alia.py` y el frontend `explorer.js`. Importación XLSX mediante botón en ALIA, datos almacenados únicamente en el equipo del usuario (directorio de usuario, fuera de GitHub). KPI reales y rankings por área/proceso/contrato; curva de avance físico mensual provisional. Histórico de devengado real y proyección no validados: no mostrar curvas sintéticas como reales.
- SI contiene números con apariencia de fechas: no sumar anticipos no conciliados. Avance físico de contratos multiasignación se representa provisionalmente mediante máximo de filas, pendiente conciliación. Fecha de corte real única, no 9 reportes separados.
- Código: commits 19d946c, 5a2b5be, 0139605, c960501, f00d1a2. Validación en navegador local y reinicio del servidor pendientes. No se subió XLSX ni se desplegó información real públicamente.

### 2026-10-22 — Módulo exclusivo Centro de importación · 12 matrices
- Solicitud: separar por completo la importación del Explorador financiero y preparar 12 archivos mensuales como mínimo, con diez archivos iniciales pendientes de recepción.
- Se agregó navegación **Centro de importación**, 12 casillas mensuales, selección múltiple, estado y advertencias, reemplazo por mes y botón de activación únicamente con 12 meses.
- Se creó `importaciones.js` y `importaciones_backend.py`; se actualizó `index.html`, `app.js`, `styles.css`, `servidor_alia.py` y `explorer.js`. Se eliminó el botón antiguo de importación del Explorador financiero.
- El backend guarda datos parseados en el equipo del usuario fuera de GitHub, valida la fecha real del reporte y conserva cada mes por separado. No mezcla acumulados ni reemplaza los datos activos durante la carga. La activación es explícita.
- Commits: interfaz `b4d0531`, navegación `0256165`, cliente `d713464`, backend `bb98f56`, endpoints `b809e3c`, explorador `f1143c3`, estilos `c0385f4`.
- Pendiente: recepción y prueba con los diez archivos, dos meses faltantes, validación funcional en localhost y reinicio del servidor Python para activar los endpoints nuevos. Sin despliegue público ni archivos institucionales en GitHub.

### 2026-10-22 — Auditoría de diez XLSX recibidos y corrección de importación
- Revisados los diez archivos 01. Enero.xlsx a 10. Octubre.xlsx, 9 MB aprox. cada uno. Todos tienen MATRIZ CONSOLIDADA como primera hoja y 398 filas con código de proceso.
- Hallazgo crítico: la columna A Reporte contiene el mismo serial Excel 46315 (= 20/10/2026) en los diez archivos; el importador anterior asignaba todos a octubre. Las hojas son distintas (hash de XML diferente), pero los agregados SD=12,594,351.20; SF=11,228,514.02; SG=6,409,138.50 son idénticos en los diez archivos. No es legítimo presentar esta serie como evolución financiera mensual real sin reconciliar el origen de cada corte.
- Ajustado importaciones_backend.py para reconocer mes por prefijo 01.–12. o casilla seleccionada y guardar discrepancia de fecha como incidencia de auditoría. Activación bloqueada si los 12 meses contienen los mismos totales financieros.
- El mensaje Failed to fetch es de comunicación navegador/servidor, no de estructura XLSX. Mejorado importaciones.js para mostrar explicación de conectividad y necesidad de reiniciar el proceso Python cuando su código cambió. index.html explica la asignación por mes y actualiza caché.
- Commits: b72196b (backend), 85d61a4 (cliente), 531209e (interfaz). Validación en localhost del usuario pendiente. Los XLSX no se incorporaron al repositorio.

### 2026-10-22 — Corrección de 1.194 falsos errores de avance físico
- Error reportado: `01. Enero.xlsx: 1194 incidencias críticas. Primera: {"row": 13, "code": "INVALID_NUMBER", "field": "physical_month_10"}`.
- Diagnóstico: la rutina `inspect_file` convertía correctamente vacíos de `physical_month_*` en `None`, pero luego los registraba erróneamente como `INVALID_NUMBER`. Son meses no informados, no números mal formados.
- Inspección de los diez XLSX: cada uno contiene 1.266 celdas vacías en UH:US (incluye filas de encabezados adicionales) y cero valores no numéricos no vacíos en dichas columnas. El bloque octubre-diciembre de 398 registros explica los 1.194 errores reportados.
- Solución en `importador_matriz.py`: aceptar vacíos como `None` y generar `INVALID_NUMBER` únicamente cuando existe contenido no numérico. Commit `3e0254d`.
- Pendiente: verificar carga real en localhost después de reiniciar el proceso Python. Los archivos fuente no se modificaron.

### 2026-10-23 — Sustitución del importador por estructura CORP 2026
- Por autorización expresa del propietario se retiró la detección del esquema antiguo del parser y se adoptó la estructura de los diez XLSX CORP recibidos.
- Cabecera detectada por O=CÓDIGO DEL PROCESO, SC=CODIFICADO AÑO N, SE=COMPROMETIDO AÑO N, SF=DEVENGADO AÑO N; anticipo SH y avance físico HR. No interpretar la columna A como fecha Reporte.
- El mes se asigna por prefijo del archivo o casilla; se marca expresamente como **mes asignado, no fecha de corte verificada**. No se activan diez meses automáticamente; persisten los controles de 12 meses y la comprobación de totales idénticos.
- Archivos: importador_matriz.py (dca437fe), importaciones_backend.py (2fc3a834).
- Pendiente: ejecutar pruebas del parser con los diez archivos reales en el servidor local y validar importes, avance físico y columnas. Sin despliegue público, sin modificar datos activos.

### 2026-10-23 — Corrección del formato definitivo CORP 2026
- Usuario reportó en ALIA Local: `01. Enero.xlsx: No se encontró el encabezado de MATRIZ CONSOLIDADA`.
- Se verificó directamente el XLSX adjunto: encabezado en fila 11; O = CÓDIGO DEL PROCESO, SC = CODIFICADO AÑO N, SE = COMPROMETIDO AÑO N, SF = DEVENGADO AÑO N; A = CODIGO PAI CONTROL 1 (no Reporte).
- Se corrigió `importador_matriz.py` para utilizar exclusivamente el mapa CORP 2026 y evitar posiciones antiguas. Commit `d003a36f`.
- Los datos activos no se modificaron; validación funcional de importación en localhost pendiente. Reiniciar servidor Python para recargar módulo.

### 2026-10-23 — Aprobación de arquitectura por fila numerada
- Aprobado por propietario: la fila 12 de MATRIZ CONSOLIDADA es el identificador estable de columnas; fila 11 es descripción y fila 13 inicia registros.
- Creado `DICCIONARIO_COLUMNAS_ALIA.json` con 16 campos de uso inmediato, número, nombre y tipo; commit `fe1a3dff`.
- `importador_matriz.py` ahora construye el mapa a partir de números de fila 12, contrasta encabezados de fila 11 y evita confiar en letras de Excel; commit `bb12f79f`.
- El resto de columnas todavía no están catalogadas semánticamente. Avance físico mensual queda sin asignar hasta verificar identificadores exactos, sin fabricar valores.
- Pendiente: reinicio de servidor Python y validación de cargas reales enero–octubre. No se alteraron snapshots activos ni hubo publicación pública.

### 2026-10-23 — Auditoría de importaciones y catálogo completo de columnas
- Usuario validó visualmente 10/12 meses cargados (enero–octubre, 398 filas por archivo), con 59 observaciones en cada mes. Se aprobó ejecutar auditoría, catálogo y conciliación sin activar explorador.
- Parser extrae TODOS los identificadores numéricos de fila 12 y sus encabezados de fila 11 en `column_catalog` (sin publicar contenido institucional); commit `72a92417`.
- Backend almacena el catálogo junto al snapshot local, agrega auditoría por mes con observaciones individuales, agrupación por código, totales financieros y detección de meses con totales idénticos; commits `a107518e`, `a39e1949`.
- Servidor expone GET `/__alia_import_audit?month=N` solo en localhost; commit `908253c5`. Interfaz añade botón AUDITAR por mes y despliega incidencias y catálogo; commit `371e31bc`. Caché HTML actualizado `ec2bbca4`.
- IMPORTANTE: para completar el catálogo de los diez snapshots ya guardados, volver a cargar cada archivo desde REEMPLAZAR después de reiniciar servidor; la carga no activa ni reemplaza el explorador. Hasta reimportar, auditoría de archivos previos puede mostrar 0 columnas catalogadas.
- Pendiente: validación en localhost, análisis de los 59 avisos y reconciliación de fechas/totales históricos. No se alteró producción ni se publicó información.

### 2026-10-23 — Corrección de visibilidad de AUDITAR
- Usuario reportó que botón AUDITAR no mostraba resultado. Se encontró que el panel se añadía al pie, debajo de los 12 meses, fuera de vista.
- Se movió panel justo debajo del mensaje de importación, con desplazamiento automático, feedback visible, errores y compatibilidad con catálogos de snapshots anteriores. Commits `26fcf2cb`, `229e7a01` (caché).
- Pendiente comprobación visual en localhost; no se modificaron snapshots ni producción.

### 2026-10-23 — Observaciones de Anticipo y corrección del formato definitivo
- Propietario aclaró que la primera columna Reporte fue eliminada del Excel definitivo; el desplazamiento aparente de letras no debe corregirse restando 1 a todos los identificadores: el contrato del importador es el número escrito en fila 12, cotejado con encabezado de fila 11.
- Auditoría octubre aportada por usuario: 398 registros, 59 avisos ADVANCE_RESEMBLES_EXCEL_DATE, catálogo 0 porque el snapshot se creó antes del catálogo; totales informados 12.003.770,67 codificado, 10.380.402 comprometido, 6.746.277,17 devengado (provisionales, no conciliados).
- Hallazgo: regla antigua clasificaba importes 40.000–80.000 como fechas sin consultar formato de celda, y los eliminaba de Anticipo. Eliminada regla y preservados importes numéricos; commit `4a99e932`.
- Interfaz AUDITAR traduce códigos a español y muestra fila, columna/campo y valor, con explicación de advertencias antiguas; commit `5f371058`.
- Backend permite reimportar un mismo archivo con igual hash para regenerar snapshots antiguos, con versión de parser `numbered-v2`; commit `511bf5f1`. Caché HTML `f60e1261`.
- **Requiere reiniciar servidor Python y volver a importar octubre (REEMPLAZAR) para corregir sus datos guardados y actualizar catálogo/avisos.** Luego repetir los demás meses antes de activar. Validación en localhost pendiente. Sin despliegue público.

### 2026-10-24 — Aprobación e integración del Diccionario Maestro ALIA v1.0
- Propietario aprobó diccionario visual de 564 columnas con bloques y subbloques.
- Integración en develop: `DICCIONARIO_BLOQUES_ALIA.json` contiene 36 agrupaciones principales y patrón de 25 pagos contra factura, ocho campos cada uno. El catálogo del importador obtiene las etiquetas individuales directamente de los encabezados de la matriz y añade bloque, subbloque y campo de pago.
- El importador valida que existan 564 columnas numeradas; conserva el mapeo por identificador de la fila 12 (no por desplazamiento físico).
- Backend usa versión `grouped-v1` para obligar a regenerar snapshots antiguos aun cuando el archivo tenga el mismo hash. Interfaz AUDITAR presenta los grupos.
- Alcance: integración operativa de agrupaciones principales; el JSON maestro de 564 definiciones de la conversación no se copió literalmente al repositorio. Las etiquetas se obtienen de cada XLSX y se validan las 16 columnas críticas mediante `DICCIONARIO_COLUMNAS_ALIA.json`. No se han implementado nuevos cálculos financieros ni activado datos.
- Pendiente: validación en ALIA Local con archivos originales, reinicio de servidor, reimportación y comprobación del catálogo (564) y de los importes. Detectado en el borrador aprobado un rango secundario proyectado 565–567 fuera del límite 564; integración acotada a 553–564, requiere aclaración si existen campos posteriores.

### 2026-10-24 — Observaciones trazables al diccionario y Excel
- La vista AUDITAR resuelve el ID de columna (incluyendo el aviso histórico de anticipo 502), etiqueta, bloque, subbloque, letra Excel si está catalogada, fila y valor.
- Las observaciones antiguas sin catálogo muestran la identificación por diccionario y la fila, pero no inventan letra de Excel.
- Cambios limitados a interfaz y cache bust; sin modificar cálculos ni datos productivos. Pendiente comprobar en ALIA Local.

### 2026-10-24 — Conciliación sin recarga y alertas no bloqueantes
- Por instrucción del propietario, se reutilizan los snapshots locales cargados. No se exige reemplazar XLSX ni aprobar 59 alertas individualmente.
- `reconciled_snapshot` construye una vista derivada en memoria, identifica `ADVANCE_RESEMBLES_EXCEL_DATE` obsoleta, restaura el importe de `advance` desde `issue.value` si el registro `sourceRow` coincide y el valor existente es 0, nulo o idéntico; las discrepancias quedan pendientes. No modifica el snapshot original ni el Excel.
- La auditoría muestra grupo plegable de alertas conciliadas automáticamente; contadores y activación usan vista derivada. Las observaciones de validación no bloquean la importación; errores estructurales y requisitos de activación siguen aplicando.
- Pendiente: verificar en equipo local recuperación de 59 importes, totales y activación. No se ha realizado prueba de extremo a extremo con archivos locales.

### 2026-10-24 — Limpieza de reglas y preservación del Explorador Financiero
- A solicitud del propietario, auditoría sin textos «aviso antiguo» ni aprobaciones individuales. Se elimina de la vista el código de alerta obsoleto y se genera vista de validación actual sobre snapshots ya cargados.
- Para registros con evidencia local del importe de anticipo (ID 502), la vista de trabajo restaura el valor solo si coincide el número de fila y no contradice un valor no nulo previo; conflictos quedan como `ADVANCE_VALUE_CONFLICT`.
- Se mantienen intactos `app.js`, `explorer.js`, estilos y diseños del Explorador Financiero, así como los XLSX y snapshots originales. El flujo de activación existente conserva sus restricciones (12 meses y conciliación de totales).
- Pendiente comprobar ejecución en servidor Python reiniciado y conciliación de datos en el equipo local; el archivo original no está almacenado en GitHub.

### 2026-10-24 — Auditoría profunda de las diez matrices reales y reglas v2
- Se inspeccionaron los diez XLSX originales de enero–octubre 2026 (fuera de GitHub): todos presentan 564 identificadores en fila 12; filas 13–435 aproximadamente con datos/formato y fórmulas. Octubre tiene 44.761 celdas con fórmula en la hoja principal. La celda del anticipo año N ID 502 usa formato numérico (estilo 982, formato incorporado 43), mientras fechas de anticipo ID 235/236 usan estilo 38, formato fecha 14.
- La columna 226 avance físico contiene fracciones entre 0 y 1. El bloque 508–522 contiene enero–diciembre, total, total planificado y observaciones; 523–537 y 538–552 repiten estructura; 553–564 son x1–x12, no «meses ejecutados».
- Nuevas reglas declarativas en `reglas_matriz_alia.py`: números finitos para importes, rango físico 0..1, estructura de IDs 1..564, fechas seriales Excel o ISO, 25 grupos de pago por desplazamiento de ocho campos y series mensuales. No se infiere fecha por magnitud. La nueva validación se ejecuta sobre XLSX futuros y sobre los campos retenidos en snapshots locales ya cargados; los 564 campos de snapshots antiguos no están disponibles para una reauditoría completa sin conservar el archivo fuente.
- `importador_matriz.py` deja de usar mapas de letras físicos y retira reglas inalcanzables; interfaz presenta códigos nuevos en español.
- NO se tocaron archivos Excel originales, snapshots locales, `app.js`, `explorer.js` ni diseño del Explorador Financiero. Pendiente: pruebas de ejecución end-to-end en ALIA Local y comprobación de conciliación financiera. No activar serie histórica sin revisar los cortes.

### 2026-10-24 — Enlace de snapshots existentes con Explorador Financiero
- Se estudió `explorer.js` (interfaz aprobada), `importaciones_backend.py`, `servidor_alia.py` y diccionario de IDs. El Explorador estaba leyendo solamente `/__alia_data`, dependiente de activación formal de 12 meses, mientras enero–octubre ya estaban cargados en `monthly`.
- Nuevo endpoint local de solo lectura `/__alia_explorer_preview?month=N`, que sirve el corte mensual almacenado tras validación en memoria, sin modificar XLSX, snapshots ni `current.json`; no activa la serie de 12 meses.
- `explorer.js` conserva la presentación y navegación aprobadas, obtiene los cortes del endpoint, ofrece selector de meses cargados y mantiene métricas Codificado (ID 497), Comprometido (499), Devengado (500), Anticipo año N (502), con filtros por área/fuente/proyecto/proceso/contrato según los campos ya almacenados.
- No se han generado curvas ficticias de ejecución. El módulo temporal real aún muestra resumen al corte; evolución financiera multi-mes y pagos requieren una integración posterior validada de snapshots y conciliación por identificadores únicos.
- No se modificaron `styles.css`, `app.js`, `index.html`, ni datos locales. Pruebas funcionales en equipo del propietario pendientes.

### 2026-10-24 — Presentación de fuentes con datos reales
- Tras comprobar visualmente que el Explorador ya recibe datos, se sustituyó únicamente la composición gráfica de fuentes (treemap desproporcionado) por filas comparativas horizontales, ordenadas por codificado, con importe, participación, barra y porcentaje devengado.
- Se preservaron selección interactiva de fuente, filtros, tarjetas financieras, jerarquías, panel temporal y colores corporativos. Cambios solo en `explorer.js` y versión de caché de `index.html`; no se modificaron importes, reglas, snapshots ni XLSX.
- Pendiente: comprobar la presentación y el funcionamiento de filtros en ALIA Local con los datos cargados.

### 2026-10-24 — Barra de composición restaurada (v3)
- Por decisión del propietario se restauró una única barra proporcional horizontal para las fuentes, sustituyendo las filas horizontales individuales.
- Cada fuente mantiene su ancho proporcional al codificado. Los segmentos suficientemente anchos muestran nombre, participación y ejecución; los pequeños conservan su ancho pero se identifican exclusivamente en leyenda, evitando etiquetas verticales y superposiciones.
- Tooltip descriptivo y filtro por clic tanto en segmento como leyenda. Colores y métricas existentes preservados; sin cambios a importador, snapshots, cálculos, jerarquía o panel temporal.
- Pendiente: comprobación visual en ALIA Local tras reiniciar y Ctrl+F5.

### 2026-10-24 — Barra compacta de fuentes v4
- Por solicitud del propietario, se redujo la altura de la barra proporcional a 120 px (aproximadamente la mitad del diseño anterior).
- Los segmentos con participación de 3 % a menos de 14 % muestran las primeras tres letras de su nombre (p. ej., BID); los menores de 3 % no muestran texto interno para evitar superposición. La leyenda conserva los nombres completos, importes y porcentajes; tooltip y clic conservados.
- Sin cambios a cálculos, datos, filtros, importador ni demás paneles del Explorador. Pendiente de validación visual local.

### 2026-10-24 — Rama 01 Áreas: tarjetas adaptables
- Se eliminó la distribución treemap de áreas que comprimía Administración y Comercial en columnas estrechas con texto vertical.
- Rama 01 presenta tarjetas responsivas con nombres horizontales, codificado, devengado, barra de ejecución y conteos de proyectos/procesos. Conserva clic de navegación y panel GLOBAL.
- Sin cambios a cálculos, datos, filtros, rama temporal ni composición por fuentes. Pendiente revisión visual en ALIA Local.

### 2026-10-24 — Mapa de bloques por codificado, Rama 01
- El usuario solicitó conservar la lectura visual del mapa original, dando más superficie al área con mayor codificado y excluyendo áreas con codificado igual a cero.
- Rama 01 filtra exclusivamente al nivel de áreas aquellas con suma de codificado > 0 para el corte/filtros actuales. El mayor presupuesto aparece como bloque dominante y las restantes áreas como bloques secundarios legibles, sin texto vertical. Diseño adaptativo a ancho disponible.
- La superficie del bloque es jerárquica y visual (no un treemap de área matemáticamente exacta); importes, porcentajes y jerarquía se mantienen reales y sin cambios. Otros niveles no se filtran por cero.
- Sin alteraciones a datos locales, importación, reglas, ni Rama 02. Pendiente comprobación visual local.

### 2026-10-25 — Barras de ejecución y cabecera GLOBAL
- Corrección visual de RAMA 01: cada barra representa 100 % del codificado de su propia área, el tramo turquesa muestra devengado/codificado y el resto azul oscuro muestra pendiente de devengar. Se elimina la escala por presupuesto del área mayor que distorsionaba la lectura de ejecución.
- Leyenda de dos colores diferenciados y ampliación del icono de GLOBAL · TODA LA UNIDAD.
- Se conservan importes, porcentaje de ejecución, conteos, fila TOTAL y filtros. Sin modificaciones de datos ni de la RAMA 02. Pendiente validación visual local.

### 2026-10-25 — Recuento distinto de PAI y procesos
- Corrección de indicadores de proyectos y procesos del Explorador: los proyectos se cuentan por código PAI (`project_key`/`project_code`, id 2), y los procesos por código único de proceso (`process_key`, id 15); nunca por cantidad de filas ni por descripción de proyecto.
- La vista previa del backend ahora expone `project_code` y `process_code` directamente desde snapshots ya cargados, sin exigir recarga de XLSX. El frontend calcula `Set` de códigos no vacíos por área y globalmente (TOTAL), evitando duplicados entre filas.
- Se preservan cálculos financieros, datos locales, filtros, diseño aprobado y RAMA 02. Requiere reiniciar servidor Python y Ctrl+F5; cifras pendientes de contrastar con Excel real.

### 2026-10-26 — Regreso al treemap equilibrado de áreas
- A petición del propietario se sustituye la vista de barras horizontales de RAMA 01 por treemap de bloques con tamaño relativo al codificado suavizado mediante raíz cuadrada; máximo 60 % y mínimo 19 % para tres áreas, para que la de mayor presupuesto destaque sin desplazar a las demás.
- Se conservan iconos, codificado, devengado, avance porcentual, filtro codificado > 0, fila TOTAL, panel GLOBAL y navegación; sin cambios en RAMA 02 ni archivos importados.
- Pendiente verificación visual en ALIA Local. Los recuentos de proyectos/procesos en cero de la captura requieren diagnóstico separado sobre la procedencia de los códigos en los snapshots locales.

### 2026-10-26 — Treemap vertical y dos bloques horizontales
- RAMA 01: el área con mayor codificado ocupa el bloque principal vertical izquierdo (ancho suavizado 55–63 %); las dos restantes se presentan en bloques horizontales apilados a la derecha, con ancho suficiente para importes y nombres.
- Se conservan la ejecución por barra, iconos, panel GLOBAL, fila TOTAL, navegación y filtro codificado > 0. No se modifican datos ni RAMA 02.
- Pendiente validación visual local; el error de conteos cero se atiende por separado.

### 2026-10-26 — Suavizado armónico y legibilidad del treemap
- Se aplica una ponderación por raíz cuarta del codificado a la geometría del treemap de tres áreas, con bloque principal entre 52 % y 57 % del ancho y dos bloques secundarios horizontales apilados.
- Se incrementa la altura del lienzo y se establecen reglas de espacio, columnas de importes y separación de barras y porcentajes para evitar solapamientos en Administrativo y Comercial.
- Sin cambios en matrices, cifras financieras, RAMA 02 ni filtros. Validación visual local pendiente. Continúa pendiente el diagnóstico de conteos de proyectos y procesos en cero.

### 2026-10-26 — Cabeceras horizontales y barras homologadas en treemap
- Iconos y nombres de las áreas se presentan en una misma línea para ganar espacio vertical.
- Cada bloque usa la misma plantilla interna de filas para importes, porcentaje, barra de ejecución y conteos, evitando solapamientos y diferencias de posición entre Distribución, Administrativo y Comercial.
- Sin modificaciones de cifras, snapshots ni RAMA 02. Pendiente validación visual en ALIA Local. Conteos cero continúan pendientes de revisión independiente.

### 2026-10-26 — Filtro estricto de saldo sin comprometer
- Se sustituye la regla anterior (codificado menos comprometido positivo por fila) por un filtro a nivel de proceso: codificado total > 0 y comprometido total = 0, sumando todas las filas del proceso en el corte seleccionado.
- Los procesos parcialmente comprometidos dejan de aparecer en el ranking y en el indicador de saldo sin comprometer. El monto mostrado es el codificado total de procesos sin ningún compromiso.
- Saldo sin devengar continúa con el criterio comprometido menos devengado positivo por contrato. Sin cambios en los datos importados, treemap ni RAMA 02. Pendiente contraste con la matriz real en ALIA Local.

### 2026-10-26 — RAMA 02: curvas de evolución con datos reales cargados
- Se recupera la presentación de curvas para Codificado, Comprometido y Devengado, utilizando únicamente los snapshots mensuales realmente importados (sin activación, modificación ni reimportación).
- Nuevo endpoint local de solo lectura `/__alia_explorer_history`; la vista filtra cada corte por área, fuente, proyecto y selección de proceso/contrato. Los meses sin archivo no se interpolan.
- Selector Acumulado / Variación mensual / % del codificado y leyenda para activar u ocultar cada curva; los puntos muestran importes reales del corte.
- Pendientes: validar en el equipo local que las series coincidan con las matrices; construir las curvas de etapas de contratación, avance físico y línea base cuando se verifique su historial por entidad. No se inventan etapas ni cronogramas.

### 2026-10-26 — Curva mensual: línea base, real, proyección y codificado
- Diccionario: línea base inicial IDs 508–519; programación vigente 523–534; devengado real mensual 538–549; codificado anual ID 497.
- Importador captura las 36 celdas por fila y conserva las tres series en los nuevos registros; gráfico acumulado con línea real hasta el corte, proyección desde el último real para meses restantes y codificado anual como referencia de porcentaje.
- Los snapshots cargados anteriormente carecen de estas columnas; no se inventan curvas ni se recalculan importes a partir de datos insuficientes. Falta mecanismo de enriquecimiento local de los snapshots desde las matrices XLSX originales sin reemplazar las cargas existentes.
- Cambios solo en rama develop; pendientes pruebas con XLSX reales. No se modifica RAMA 01.

### 2026-10-26 — Resolución de gráfica sin series
- Causa: los snapshots originales no almacenaron las 36 columnas mensuales, por lo que el gráfico no podía dibujar series verificables.
- Nuevo botón de recuperación en RAMA 02: seleccionar una sola vez el XLSX original del corte. Se comprueba SHA256 idéntico al archivo ya cargado, número de filas y procesos; únicamente se añaden baselineMonthly/plannedMonthly/actualMonthly al snapshot existente. No se reemplazan los importes, el catálogo ni las observaciones, ni se vuelve a importar la matriz completa.
- Endpoint local POST /__alia_enrich_monthly; rechazo sin cambios si el archivo no coincide. Tras completar, RAMA 02 se refresca.
- La operación necesita selección explícita del XLSX porque el servidor no conserva una copia original del archivo Excel. Pendiente prueba de extremo a extremo con el archivo local real.

### 2026-10-26 — Recuperación de leyendas aprobadas en curva mensual real
- Conforme a decisiones previas de 2026-10-21: leyenda de curvas bajo el gráfico, botones excluyentes % y USD, línea vertical CORTE y mes resaltado, proyección discontinua diferenciada de devengado real.
- Cuatro curvas visibles y conmutables: Línea base inicial (violeta), Devengado real (turquesa), Proyección vigente (naranja), Codificado anual (azul). La leyenda se construye con elementos HTML visibles y permite activar/ocultar cada serie.
- En % el denominador es el codificado anual (ID 497), en USD se usan montos acumulados. Se preservan las series reales existentes y el treemap de RAMA 01.

### 2026-10-26 — Corrección de leyendas invisibles en RAMA 02
- Diagnóstico: `styles.css` contenía la regla `#explorer #ex-pane-source.exv-reserved-pane button{display:none!important}`, heredada de la vista reservada, que ocultaba los controles de unidad y la leyenda del nuevo gráfico aunque el DOM los generaba.
- Se retira `exv-reserved-pane` al construir la vista temporal real, preservando la clase `exv-temporal-pane`. No se modifican los datos ni las curvas.
- Se actualiza versión del JS para evitar caché; validación visual pendiente en ALIA Local.

### 2026-10-26 — Gráfica mensual: espacio, contraste y animación
- Controles excluyentes %/USD trasladados al extremo superior derecho del encabezado para liberar espacio vertical; altura útil SVG ampliada.
- Paleta diferenciada: línea base violeta, real verde turquesa, proyección naranja discontinua, codificado azul apagado. Sombreado sutil bajo devengado real.
- Recuperada animación automática de trazado (3 segundos) al dibujar curvas continuas y aparición diferida de proyección; respeta prefers-reduced-motion. Leyenda interactiva debajo y marcador CORTE conservados.
- No se modificaron cifras, archivos XLSX, snapshots ni RAMA 01. Pendiente verificación visual local.

### 2026-10-26 — Reparación de gráfica desaparecida al animar SVG
- Captura del usuario: encabezado, botones y leyendas visibles, pero sin ejes ni curvas. La animación introducida ejecutaba `getTotalLength()` sobre polilíneas antes de insertar el SVG en el documento; esto puede fallar en Firefox y abortar `draw()` antes de `plot.append(svg)`.
- Solución: primero dibujar e insertar el SVG completo; después ejecutar animaciones opcionales dentro de try/catch, respetando reducción de movimiento. Si falla la animación, la gráfica permanece visible.
- Se conserva posición de %/USD, paleta, líneas, datos y RAMA 01. Pendiente validación visual local en Firefox.

### 2026-10-26 — Animación secuencial devengado real → proyección
- La curva real se dibuja en 3 segundos. La curva proyectada naranja permanece oculta y empieza su revelado de 900 ms solo al finalizar la animación del devengado real (promesa `Animation.finished`, sin temporizador arbitrario).
- Respeta `prefers-reduced-motion`, filtros de leyenda y sustitución del SVG. Se conserva la proyección discontinua, las demás series y los datos.
- Pendiente comprobación visual en ALIA Local.

### 2026-10-26 — Proyección dibujada progresivamente mes a mes
- La proyección naranja ya no aparece por desvanecimiento completo: una máscara SVG avanza horizontalmente desde el último mes real hasta diciembre, revelando el trazo discontinuo y sus puntos al alcanzar cada mes.
- Comienza solo después de terminar la animación de devengado real (3 s); duración de recorrido proyectado: 1,8 s. Mantiene compatibilidad con movimiento reducido y no altera cifras.
- Pendiente validación visual en ALIA Local.

### 2026-10-26 — Resaltar punto final del devengado real
- En la curva mensual, el último punto real del mes de corte tiene halo turquesa pulsante y doble marcador de alto contraste, más una etiqueta permanente con el porcentaje de devengado sobre codificado (modo %) o monto real acumulado (modo USD).
- La etiqueta se posiciona dentro del SVG, evita desbordar el borde derecho y se recalcula al cambiar unidad o filtros. El pulso respeta `prefers-reduced-motion`.
- Se preservan series, animación secuencial, importaciones y RAMA 01. Pendiente validación visual local.

### 2026-10-26 — Proyección discontinua dibujada gradualmente, sin puntos
- Corrección tras captura del usuario: la animación previa del ancho del rectángulo SVG con Web Animations no era fiable en Firefox, dejando visibles solo los puntos naranjas.
- Se eliminan los puntos de la serie Proyección vigente y se conserva únicamente su línea naranja discontinua. Se revela de izquierda a derecha con SVG animate(attributeName=width), duración 1,8 s, iniciando al concluir la animación del devengado real.
- Se conserva punto destacado del devengado real, controles y datos; no se modifica RAMA 01. Pendiente validación visual local.

### 2026-10-26 — Etiqueta del devengado fuera del trazado
- La etiqueta flotante de valor al corte tapaba las curvas naranja y violeta (captura del usuario). Se reemplazó por una banda compacta alineada a la derecha encima del área SVG: `DEVENGADO REAL AL CORTE` + valor dinámico %/USD.
- El último punto real mantiene su halo y pulso sin texto superpuesto. Se recalcula con unidad y filtros; si se oculta la serie real también se oculta el indicador. Curvas, datos y animación secuencial sin cambios.
- Pendiente verificación visual en ALIA Local.

### 2026-10-26 — Cuarta tarjeta de porcentaje de devengado
- A solicitud del usuario se elimina el indicador flotante encima del gráfico. Se agrega una cuarta tarjeta `% DEVENGADO` junto a Codificado, Comprometido y Devengado USD en RAMA 02.
- Valor calculado como 100 × devengado / codificado del corte y selección vigentes, con `—` cuando el codificado es cero. Las cuatro tarjetas se distribuyen en una cuadrícula de cuatro columnas con tamaños de texto adaptables.
- La curva conserva solo el punto final resaltado, sin etiquetas superpuestas. No se modifican datos ni RAMA 01. Pendiente verificación local.

### 2026-10-26 — Codificado mensual histórico y consulta de proyección diciembre
- Curva de codificado USD obtenida de cada snapshot mensual realmente cargado mediante `/__alia_explorer_history`, sin inventar meses no cargados. En vista porcentual, codificado de los meses disponibles permanece al 100%.
- El punto naranja al cierre de diciembre admite clic y teclado y muestra el USD previsto y su porcentaje respecto del codificado del corte seleccionado. Mantiene línea discontinua y animación secuencial.
- Pendiente comprobar visualmente en ALIA Local la correspondencia de filtros de áreas/procesos entre reportes históricos; no se tocaron archivos Excel.

### 2026-10-26 — Puntos mensuales visibles en la proyección
- Se incorporan marcadores naranja discretos en cada mes posterior al corte (noviembre y diciembre en el ejemplo), sobre la línea naranja discontinua. Cada marcador aparece al alcanzarlo la animación progresiva de 1,8 segundos; el punto final permanece ligeramente mayor.
- Se conservan las áreas de clic/teclado por mes para consultar USD y porcentaje en el panel inferior. Con movimiento reducido, los marcadores se muestran sin animación.
- Sin cambios a cifras ni RAMA 01; pendiente validación visual en ALIA Local.

### 2026-10-26 — Curvas financieras por contrato/proceso
- Corregido `renderRealTemporal`: el gráfico de RAMA 02 ahora recibe `rows` filtradas por el contrato o proceso seleccionado, en lugar de `rs` (toda el área). Se conservan la curva, cuatro indicadores, selector %/USD, proyección y marcadores interactivos.
- No se alteraron fórmulas, importaciones ni diseño de RAMA 01. Pendiente validación local de los importes por contrato y filtros históricos.

### 2026-10-26 — Avance físico en la misma curva financiera de contratos
- Diccionario validado: ID 226 `TOTAL AVANCE FISICO (100%)`, tipo porcentaje. Para contratos seleccionados se extrae ese dato de cada snapshot mensual cargado, se normaliza a escala 0–100 y se grafica como quinta serie rosa en la curva financiera existente, con puntos mensuales consultables y leyenda para mostrar/ocultar.
- Cuando un contrato aparece en varias filas se calcula avance físico ponderado por importe de contrato si está disponible y, si no, por codificado; cuando no hay ponderadores se promedia únicamente entre mediciones disponibles. No se rellenan meses faltantes ni se proyecta avance físico. En USD, la serie física sigue su propia escala porcentual 0–100.
- Se elimina el gráfico físico separado, redundante y sin datos. No se modifica RAMA 01 ni archivos fuente. Pendiente comprobación en entorno local de los registros y pesos reales por contrato.

### 2026-10-26 — Corrección de escala del avance físico
- Corregida la curva física en RAMA 02: tanto la polilínea como sus marcadores mensuales deben llamar `y(..., ..., l===physicalLine)` para representar porcentajes sobre su eje fijo 0–100%, no sobre la magnitud financiera.
- Caso reportado: tooltip junio 20.0% con línea pegada a 0. Se conservan los importes y la curva financiera sin cambios. Pendiente comprobación visual local tras actualizar.

### 2026-10-27 — Hitos de anticipo e inicio y curvas predeterminadas en contratos
- En RAMA 02, al seleccionar contrato se muestran inicialmente Devengado real, Proyección vigente y Avance físico; Línea base y Codificado permanecen disponibles pero desactivados. No se alteran los valores ni el diseño de las áreas.
- El importador identifica fecha de pago del anticipo mediante ID 235 y fecha de inicio del contrato mediante ID 50, usando fila 12. Se preservan como `advance_paid_date` y `contract_start_date` en snapshots nuevos. El gráfico señala con un discreto hito dorado el mes del anticipo pagado; solo si no se pagó anticipo, muestra inicio contractual. Clic revela fecha completa. Sin fecha registrada no inventa hito.
- **Limitación:** snapshots locales ya cargados no incluyen esos dos campos; la actualización del código no recupera retroactivamente fechas de archivos Excel que no fueron conservados. No se recargaron ni alteraron los archivos locales. Requiere mecanismo de enriquecimiento verificable o nueva lectura autorizada del archivo fuente para mostrar hitos históricos.

### 2026-10-27 — Corrección de hito contractual que no aparecía
- Se corrigió el historial de exploración para invocar efectivamente la recuperación de fechas desde el Excel local idéntico (SHA256) y entregar fechas de columnas 235 y 50 al navegador.
- El gráfico de contratos ahora utiliza las fechas del historial enriquecido, no solamente las del registro reducido del corte.
- El lector admite también fechas DD/MM/AAAA. Sin archivo original local coincidente, no se inventan fechas ni se alteran snapshots.
- Validación pendiente en el equipo del usuario: contrato 32-2026, anticipo 10/06/2026.

### 2026-10-28 — Información contextual del contrato
- Añadido botón (i) junto al número del contrato en Rama 02 / Datos reales. Despliega nombre del proceso y administrador del contrato; muestra no disponible cuando no existe en snapshot.
- El importador captura el administrador a partir del encabezado de la matriz que contenga ADMINISTRADOR y CONTRATO. Para snapshots previamente importados, no se inventan nombres ni se exige volver a importar para visualizar el botón; el administrador solo aparecerá cuando el dato exista en el snapshot.
- Commits b15a6f7, 3acf14a; falta comprobar en localhost.

### 2026-10-28 — Recuperación de datos contractuales existentes
- Verificado directamente en 10. Octubre.xlsx: fila 11 NOMBRE DEL PROCESO = ID 17 (columna R); NOMBRE DEL ADMINISTRADOR DEL CONTRATO = ID 59 (columna BH). El diccionario solo incluía ID 17; se incorpora ID 59.
- Causa de valores no disponibles: to_explorer descartaba process_name y contract_administrator, pese a conservar raw_columns. Se corrige proyección y recuperación de snapshots locales existentes sin reimportar, mediante validated_snapshot y lectura directa en explorer.js de raw_columns[17] y raw_columns[59].
- Se modifica /__alia_data para enriquecer en memoria sin sobrescribir los JSON almacenados. No se altera ningún Excel ni se publica información institucional en GitHub.
- Validación en localhost pendiente.

### 2026-10-28 — Información contractual desde último reporte cargado
- Causa: la ventana (i) consultaba únicamente registros del corte seleccionado; los campos podían faltar allí aunque existieran en el último corte cargado.
- Nuevo endpoint de solo lectura /__alia_contract_info?contract=...: consulta meses del manifiesto desde el más reciente, busca coincidencia por contrato y por IDs crudos 41/47, extrae nombre del proceso ID 17 y administrador ID 59. Devuelve fuente y mes. No modifica matrices ni snapshots.
- Explorer solicita información al abrir (i), independiente del corte visualizado. Requiere reiniciar servidor Python local para activar nuevo endpoint; pendiente prueba real en equipo del usuario.

### 2026-10-28 — Reversión selectiva por instrucción del propietario
- Revertidos importaciones_backend.py y servidor_alia.py al estado anterior a la intervención sobre consulta contractual (commit de referencia a01d174). Se conserva íntegra la lógica de cortes, acumulados y gráficas.
- Explorer restaurado a ese estado y modificado exclusivamente el evento del ícono (i): lee metadatos de contrato del último mes cargado mediante endpoint existente /__alia_explorer_history; IDs 17 nombre de proceso y 59 administrador. No cambia records, selectedManagement, corte, importaciones ni cálculo financiero.
- No se modificaron archivos XLSX ni snapshots locales. Validación en localhost pendiente.

### 2026-10-28 — Diagnóstico y consulta específica del ícono contractual
- La consulta anterior descargaba todo el historial y buscaba coincidencia exacta; no permitía distinguir entre ausencia de contrato, ausencia de columnas o ausencia de valor.
- Nuevo endpoint de solo lectura /__alia_contract_metadata consulta únicamente el snapshot mensual más reciente, compara contratos normalizando separadores y presenta cobertura raw_columns, número de coincidencias, archivo/mes y valores ID 17/59.
- El Explorador únicamente modifica el panel (i); no modifica cortes, datos financieros acumulados, importaciones, cálculos ni snapshots. Se requiere reiniciar el servidor Python para habilitar endpoint. Comprobación local pendiente.

### 2026-10-28 — Reversión solicitada de la última intervención
- Por reporte de alteración visual de los acumulados, se restauraron importaciones_backend.py, servidor_alia.py, explorer.js e index.html al contenido exacto del commit a0ee6b501383505447efe3868dc8134a27fb96ec, anterior al diagnóstico de metadatos.
- No se modificaron snapshots locales ni Excel. Se suspende el trabajo del ícono (i) hasta replantear y verificar por separado los datos financieros y la procedencia de los metadatos.

### 2026-10-29 — Tabla 03 por contratos y procesos, exclusivamente último reporte
- En modo REAL, solo la tabla 03 se alimenta de /__alia_explorer_preview sin mes, que entrega el último reporte cargado. No altera records, el corte seleccionado, los KPI, el mapa ni las series históricas.
- Agrupa las filas con contrato por número de contrato y las filas sin contrato por código de proceso; suma los montos de cada grupo del último reporte. Aplica el mismo contexto de área, proyecto y financiamiento de la vista.
- El botón EXPLORAR selecciona el contrato/proceso en la gráfica existente, que conserva su fuente y corte original.
- En modo DEMO se mantiene el comportamiento anterior. Validación visual y funcional en localhost pendiente.


### 2026-10-29 — Motor universal y tabla dinámica sobre snapshots existentes
- Se confirmó el servidor real en `servidor_alia.py`, el historial en `importaciones_backend.py` y la captura de todas las columnas numeradas de la fila 12 en `importador_matriz.py` mediante `raw_columns`. No es necesario solicitar al usuario la carpeta ni volver a importar para cambios de interfaz.
- Se incorporaron `data-engine.js` y `pivot-panel.js` en `develop`: catálogo dinámico, agrupación por dos dimensiones, operaciones de suma/conteo/recuento distinto/promedio/mínimo/máximo, consulta del último corte y columnas adicionales en la tabla inferior.
- Se corrigió el tratamiento del año ausente y de formatos numéricos con coma/punto; el panel ahora presenta automáticamente un primer resultado y la cobertura de `raw_columns`.
- No se modificaron los Excel, snapshots, importador Python ni los acumulados y gráficos existentes. **Pendiente:** validar en `localhost:5500` contra matrices reales, identificar posibles snapshots históricos sin `raw_columns` y cotejar cifras antes de certificar. No afirmar certificación sin esa prueba.
- Flujo: el servidor local sincroniza `develop` al cargar la página principal; recargar navegador. Si se cambia Python en el futuro, reiniciar servidor.

### 2026-10-29 — ALIA-CODEX-RESOLUCIÓN-001: originales completos y detalle independiente
- Causa probada: snapshots398 filas/corte sin raw_columns; catálogo564. Originales SHA idéntico recuperados en repositorio separado, sin tocar snapshots/manifest/current ni Excel.
- Confirmado en Excel: nombre17/Q, administrador59/BG; importes497/499/500. Tabla ahora usa catálogo mapped_field, no offsets498/500/501. Se preservan todas las columnas y registros fuente por SHA/fila.
- Endpoint de originales completo y último año/mes, selección independiente del mes gráfico; añadir/quitar columnas, agrupación legítima de asignaciones, análisis dinámico y diagnóstico de reconstrucción. HTTP/1.1 elimina resets reproducidos al recibir JS/JSON grandes.
- Pruebas: Python12 + reglas7, motorJS7, navegador29 PASS; 3980 filas fuente comparadas, 11 archivos históricos byte-idénticos y proyecciones financieras10meses iguales al baseline. Ver RESOLUCION_001.md y resultados sanitizados docs/resolucion-001. Capturas/datos privados excluidos de Git.
- Pendiente integración remota: cuenta htpweb READ en repositorio principal; entrega por fork/PR, sin merge/main/producción. Repo adicional ALIA404, no accesible. No declarar integración por tener PR.

- Entrega final RESOLUCIÓN-001: implementación 2c54a2212255f686686aa869da214cf8bf9cc270; PR https://github.com/grupoarboleda/ALIA-Preview/pull/2 abierto hacia develop. Carpeta original actualizada a rama fix/alia-original-records-resolution001; servicio local5500 reiniciado y browser29 PASS allí, archivos históricos11 exactos. Merge remoto pendiente de permiso WRITE; producción sin cambios.

### 2026-10-29 — Buscador de columnas originales
- Buscador visible sobre el selector: filtra por nombre o número, acepta varias palabras e ignora mayúsculas/tildes. Conserva la búsqueda al añadir columnas y muestra cantidad de coincidencias.
- Sin resultados, selector y botón Añadir quedan desactivados; limpiar la búsqueda recupera las columnas disponibles. Sin consultas adicionales ni cambios en datos o cálculos.

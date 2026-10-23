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

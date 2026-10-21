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

## 4. Protocolo para próximas modificaciones

1. Consultar esta bitácora antes de modificar ALIA.
2. Aplicar el cambio pedido en `develop`, procurando no alterar funciones aprobadas.
3. Actualizar `index.html` con versión nueva de recurso cuando sea necesario para evitar caché.
4. Agregar una fila al registro cronológico **en el mismo ciclo de trabajo**, indicando commit(s) de código, archivos y estado de comprobación.
5. Informar al usuario que recargue `http://localhost:5500/` y pedir validación visual únicamente cuando corresponda.
6. Si no aparece un cambio, verificar sincronización `/__alia_status`, versión del recurso servido, errores de consola y CSS; no asumir que un commit garantiza visibilidad.
7. Solo pasar a publicación cuando el usuario lo autorice.

## 5. Pendientes y límites

- **Pendiente:** confirmación visual de los dos botones `%` y `USD` en ALIA Local después del ajuste `5518fcb`.
- **Pendiente para fase de datos reales:** importar y validar cortes Excel y series históricas observadas; no presentar series simuladas como registros oficiales.
- El hecho de registrar un cambio en GitHub no implica que se haya probado la interfaz en la computadora del usuario.

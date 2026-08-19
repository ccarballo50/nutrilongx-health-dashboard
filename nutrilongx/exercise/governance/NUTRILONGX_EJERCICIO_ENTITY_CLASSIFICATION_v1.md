# NUTRILONGX — Ejercicio: Entity Purity Pass — Auditoría de las 40 familias candidatas

Fecha: 2026-08-18. Audita, una por una, las 40 familias candidatas de `NUTRILONGX_EJERCICIO_PHASE3A_PILOT_PLAN_v1.md` y las clasifica según la taxonomía formalizada en `NUTRILONGX_EJERCICIO_MASTER_SCHEMA_v1.2.md`, sección E.2. Este documento es el razonamiento; `NUTRILONGX_EJERCICIO_PHASE3A_PILOT_PLAN_v1.1.md` es el resultado estructurado con trazabilidad completa.

---

## 1. CRITERIO OPERATIVO APLICADO

Se aplicó consistentemente el siguiente criterio, no solo el nombre de la familia (tal como se exigió explícitamente):

- **`EXERCISE`**: movimiento individual, incluso si es multi-fase, cuando se ejecuta y repite como una sola unidad integrada (criterio: ¿la literatura de ciencias del ejercicio lo cataloga convencionalmente como "un ejercicio"? — burpee, transición de suelo, Turkish get-up son ejemplos aceptados de esto en la sección B.1/B.3 de las fases anteriores).
- **`SESSION_TEMPLATE`**: combinación de **varios movimientos distintos** en secuencia o estructura de series/intervalos — incluye protocolos de trabajo/descanso del mismo movimiento base (p.ej. sprints con intervalos), porque el objeto que se está describiendo no es el movimiento en sí sino la estructura temporal que lo envuelve.
- **`BEHAVIOURAL_CONTENT`**: la unidad conceptual es el patrón de comportamiento (cuándo/cuánto/con qué frecuencia), no el movimiento concreto — puede o no referenciar un `EXERCISE` existente como su forma de ejecución típica.
- **`OTHER_REQUIRES_DECISION`**: la ambigüedad es genuina y no se puede resolver sin una decisión de producto/contenido explícita (p.ej. si un "drill" de agilidad se define como un movimiento atómico único o como una colección de patrones distintos).

---

## 2. AUDITORÍA DETALLADA — LAS 9 FAMILIAS SEÑALADAS EXPLÍCITAMENTE POR CÉSAR

### #18 `sesion_fuerza_full_body` → **`SESSION_TEMPLATE`**
El propio nombre original ("sesión de fuerza full-body") ya lo indicaba en la Fase 3A, donde se documentó como "candidata de referencia, se resolverá como SESSION_TEMPLATE real en Fase 3C" — la auditoría confirma esa intuición inicial de forma sistemática. No es un movimiento, es una combinación de varios ejercicios (sentadilla, bisagra, press, remo) organizados en una sesión.

### #20 `sprints_intervalos` → **`SESSION_TEMPLATE`**
Análisis conceptual: "sprints con intervalos de descanso" no es un movimiento — el movimiento es "sprint" (carrera a máxima velocidad, patrón `LO`), que **no existe como candidata independiente** en las 40 originales. Lo que describe `sprints_intervalos` es la estructura de trabajo/descanso (protocolo HIIT), que es por definición un `SESSION_TEMPLATE`. **Gap identificado**: falta un `EXERCISE` atómico "sprint" del que este `SESSION_TEMPLATE` dependería — no se ha añadido silenciosamente, se documenta como gap en la sección 4 del plan actualizado.

### #21 `movilidad_articular_general` → **`SESSION_TEMPLATE`**
El nombre legacy original (`serie_de_movilidad_articular_min`, `CANONICAL v1.0`) usa la palabra "serie", que ya denota secuencia de varios movimientos (hombro, cadera, tobillo, columna...), no un movimiento único. **Gap identificado**: los movimientos individuales de movilidad articular que compondrían esta serie no están definidos como `EXERCISE` atómicos en el piloto — necesarios antes de construir este `SESSION_TEMPLATE` en Fase 3C.

### #22 `yoga_fluido` → **`SESSION_TEMPLATE`**
Por definición, un "flow" de yoga es una secuencia de posturas distintas encadenadas. Mismo razonamiento que #21. **Gap identificado**: posturas individuales no definidas como `EXERCISE`.

### #23 `estiramiento_estatico_grandes_grupos` → **`SESSION_TEMPLATE`**
"Grandes grupos" (plural) indica varios estiramientos de distintos grupos musculares combinados, no un estiramiento único. **Gap identificado**: estiramientos individuales por grupo muscular no definidos como `EXERCISE` atómicos.

### #24 `movilidad_dinamica_calentamiento` → **`SESSION_TEMPLATE`**
Mismo razonamiento que #21/#23 — un calentamiento dinámico es, por naturaleza, una combinación de varios movimientos preparatorios. Se clasifica además como un **subtipo** de `SESSION_TEMPLATE` (plantilla de calentamiento, distinta funcionalmente de una plantilla de sesión principal) — nota para Fase 3C, no resuelta aquí.

### #32 `circuito_multicomponente_equilibrio_fuerza` → **`SESSION_TEMPLATE`**
El propio nombre contiene "circuito" — por definición una combinación estructurada de varios ejercicios de distintos dominios (equilibrio + fuerza). Caso más inequívoco de los 7 reclasificados a `SESSION_TEMPLATE`.

### #33 `pausa_activa_breve` → **`BEHAVIOURAL_CONTENT`**
Análisis conceptual: "pausa activa breve" no prescribe un movimiento concreto — es un patrón de comportamiento ("levántate/muévete brevemente cada cierto tiempo") que podría materializarse con cualquier movimiento de baja complejidad técnica (sentadillas, caminar en el sitio, estiramientos). No referencia un único `EXERCISE` de forma inequívoca — `references_exercise_ids` queda vacío con nota explicativa (ver esquema v1.2, sección E.3).

### #34 `snack_de_movimiento_sentadillas` → **`BEHAVIOURAL_CONTENT`**
A diferencia de #33, este sí especifica un movimiento concreto (sentadillas = `EXERCISE` #11). Pero la unidad conceptual sigue siendo el patrón de comportamiento (repetir un movimiento breve cada N minutos), no el movimiento en sí — el movimiento ya está cubierto por #11 y no debe duplicarse como una familia `EXERCISE` independiente. Se clasifica `BEHAVIOURAL_CONTENT` con `references_exercise_ids: ["exercise.resistance.sentadilla"]`.

---

## 3. AUDITORÍA — RECLASIFICACIONES ADICIONALES DETECTADAS MÁS ALLÁ DE LAS 9 SEÑALADAS

La instrucción pedía explícitamente no limitarse a las 9 señaladas ("y cualquier otra que por estructura resulte no atómica"). Se detectaron 3 adicionales por el mismo razonamiento aplicado a #33/#34:

### #3 `caminata_postprandial` → **`BEHAVIOURAL_CONTENT`** (reclasificación adicional)
El movimiento en sí es idéntico a #1 (`caminata_ritmo_moderado`) — lo que distingue a #3 es exclusivamente el **momento/contexto** (después de comer, por relevancia glucémica en DM2), no el movimiento. Igual que #34, es un patrón de comportamiento/timing aplicado a un `EXERCISE` ya existente (#1), no una familia de movimiento nueva. `references_exercise_ids: ["exercise.cardiorespiratory.caminata_ritmo_moderado"]`.

### #35 `subir_escaleras_breve` → **`BEHAVIOURAL_CONTENT`** (reclasificación adicional)
Mismo patrón que #3: el calificador "breve" y el contexto de uso (interrupción de sedentarismo a lo largo del día, no una sesión de cardio dedicada) apunta a comportamiento, no a un nuevo movimiento. **Gap identificado**: a diferencia de #3, no existe en el piloto un `EXERCISE` atómico "subida de escalones" al que referenciar limpiamente — #40 (`subida_al_cajon_step_up`) es un movimiento de fuerza/equilibrio controlado con cajón, contextualmente distinto de subir una escalera real. Se deja `references_exercise_ids` vacío con nota de gap, marcado además como sub-cuestión dentro de `OTHER_REQUIRES_DECISION` (¿se define un nuevo `EXERCISE` "subida de escalones real" o se reutiliza #40 como proxy?) — no resuelto aquí.

### #36 `caminata_acumulada_por_pasos` → **`BEHAVIOURAL_CONTENT`** (reclasificación adicional)
Mismo movimiento base que #1, distinguido solo por el patrón de acumulación fragmentada a lo largo del día (medido por pasos) en vez de una sesión continua. `references_exercise_ids: ["exercise.cardiorespiratory.caminata_ritmo_moderado"]`.

**Nota de consistencia**: estas 3 reclasificaciones no fueron señaladas explícitamente por César pero se derivan del mismo criterio aplicado a #33/#34 — se documentan con el mismo nivel de justificación para no aplicar el criterio de forma inconsistente entre familias.

---

## 4. AUDITORÍA — CASOS `OTHER_REQUIRES_DECISION`

### #30 `entrenamiento_reactivo_de_pasos` → **`OTHER_REQUIRES_DECISION`**
El propio nombre usa "entrenamiento" (training), lo que sugiere un protocolo/categoría de drill más que un movimiento único — pero a diferencia de #21/#22/#23/#24, no hay evidencia textual clara de que combine *varios movimientos distintos* (podría ser una única técnica de "paso reactivo" repetida, análogo a #26 equilibrio unipodal). La ambigüedad es genuina: sin una definición de contenido más precisa, no se puede decidir si es un `EXERCISE` atómico repetido o un `SESSION_TEMPLATE` de varios patrones reactivos distintos. Se deja explícitamente sin resolver.

### #31 `escalera_de_agilidad` → **`OTHER_REQUIRES_DECISION`**
Mismo razonamiento que #30: "escalera de agilidad" es el nombre del *equipamiento/formato* (agility ladder), no de un movimiento específico — bajo ese formato caben decenas de patrones de pisada distintos (in-in-out-out, lateral shuffle, ickey shuffle...). Podría resolverse como `SESSION_TEMPLATE` (una secuencia de patrones) o como varios `EXERCISE` atómicos individuales (uno por patrón de pisada) más un futuro `SESSION_TEMPLATE` que los combine. Se deja explícitamente sin resolver — depende de si César quiere granularidad de patrón individual o no.

---

## 5. AUDITORÍA — CASO DE FUSIÓN (NO ES UN PROBLEMA DE CLASE, ES UN PROBLEMA DE DUPLICACIÓN)

### #39 `remo_en_maquina_guiada` → se mantiene en clase **`EXERCISE`**, con nota de fusión recomendada
A diferencia de los casos anteriores, #39 sí es un movimiento atómico legítimo — pero es esencialmente el mismo patrón (`PL`, remo) que #14 (`remo_con_carga`), diferenciado solo por equipamiento (máquina guiada vs. mancuerna/banda libre) y menor complejidad técnica. Esto no es un problema de **clase de entidad** (ambos son de clase `EXERCISE`), sino de **catalogación**: #39 debería modelarse como `EXERCISE_VARIANT` de #14 (`relationship_type: TECHNICAL_VARIANT`) en vez de como familia base independiente, para evitar duplicidad en la biblioteca. Se señala como nota de ejecución para la Fase 3A real, no como una reclasificación de las 5 categorías del Entity Purity Pass.

---

## 6. AUDITORÍA — CASO LÍMITE CONSERVADO COMO `EXERCISE`

### #25 `movilidad_cadera_dirigida` → se mantiene **`EXERCISE`** (caso límite, decisión razonada)
Se consideró reclasificar a `SESSION_TEMPLATE` por analogía con #21/#23/#24, pero el calificador "dirigida" (targeted/focused) apunta a un movimiento único y específico (p.ej. un ejercicio de movilidad de cadera 90/90), a diferencia de "serie" (#21) o "grandes grupos" (#23) que explícitamente denotan pluralidad. Se conserva como `EXERCISE`, documentando la ambigüedad para que quede trazada, no oculta.

---

## 7. RESTO DE FAMILIAS — CONFIRMADAS SIN CAMBIO DE CLASE

Las 26 familias restantes (#1, #2, #4–#17, #19, #26–#29, #37, #38, #40) se confirman como `EXERCISE` — cada una representa un movimiento individual atómico, sin combinación de movimientos distintos ni naturaleza de patrón de comportamiento fragmentado. Se revisaron una a una contra el criterio de la sección 1; ninguna presentó ambigüedad suficiente para justificar reclasificación u `OTHER_REQUIRES_DECISION`.

---

## 8. RESUMEN DE VEREDICTOS

| Clase final | Cantidad | IDs originales |
|---|---|---|
| `EXERCISE` | 26 | #1,2,4,5,6,7,8,9,10,11,12,13,14,15,16,17,19,25,26,27,28,29,37,38,39,40 |
| `SESSION_TEMPLATE` | 7 | #18,20,21,22,23,24,32 |
| `BEHAVIOURAL_CONTENT` | 5 | #3,33,34,35,36 |
| `OTHER_REQUIRES_DECISION` | 2 | #30,31 |
| `PROGRAM_TEMPLATE` | 0 | — |

**Total: 40/40 auditadas, cero pérdida de trazabilidad.** Ver `NUTRILONGX_EJERCICIO_PHASE3A_PILOT_PLAN_v1.1.md` para la tabla estructurada final con `destination_phase` por elemento.

---

## 9. GAPS IDENTIFICADOS DURANTE LA AUDITORÍA (no resueltos aquí)

1. `EXERCISE` atómico "sprint" — necesario para que #20 (`sprints_intervalos`, `SESSION_TEMPLATE`) tenga un movimiento base al que referenciar.
2. Movimientos individuales de movilidad articular (hombro, cadera, tobillo, columna...) — necesarios para #21.
3. Posturas de yoga individuales — necesarias para #22 (o decisión de que #22 no requiere descomposición atómica para su primera versión).
4. Estiramientos individuales por grupo muscular — necesarios para #23.
5. Movimientos individuales de calentamiento dinámico — necesarios para #24.
6. Definición de referencia de movimiento para #33 (`pausa_activa_breve`) — genérica por diseño, o ¿se le asigna un `EXERCISE` por defecto?
7. `EXERCISE` atómico de subida de escalones real (vs. #40, cajón controlado) — necesario para #35, o decisión de reutilizar #40 como proxy.
8. Resolución de #30/#31 (`OTHER_REQUIRES_DECISION`) — decisión de contenido, no de arquitectura.
9. Fusión de #39 como `EXERCISE_VARIANT` de #14 en vez de familia base independiente — decisión de catalogación para la ejecución real de Fase 3A.

Ninguno de estos 9 gaps se ha resuelto por inferencia — todos quedan explícitamente pendientes de decisión o de construcción posterior.

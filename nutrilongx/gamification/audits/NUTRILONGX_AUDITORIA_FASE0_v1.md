# NUTRILONGX — Auditoría, Reconciliación y Canonización de Fuentes Históricas (Fase 0)

Fecha: 2026-08-18
Alcance: exclusivamente auditoría. No se ha escrito código de aplicación, no se ha tocado GitHub ni Supabase, no se han generado migraciones ni los tres artefactos canónicos finales.

Fuentes auditadas: `NUTRILONGX_creditos_v3.xlsx`, `actions_catalog.json`, `engine_config.json`, `PLAN DE GAMIFICACIÓN NUTRILONGX.pdf`, `NUTRILONGX_README.txt`, más los documentos de proyecto `auditoria_app_vercel.md`, `estado_pilares_bienestar.md` y `excel_to_json_upsert2.py` como contexto operativo (este último es, de hecho, el script generador real de `actions_catalog.json`, lo que ha permitido reconstruir su lógica exacta de IDs).

---

## 1. EXECUTIVE AUDIT

El catálogo de acciones está en muy buen estado: `actions_catalog.json` es una réplica exacta y sin pérdidas de `NUTRILONGX_creditos_v3.xlsx` (600/600 filas, cero discrepancias de texto, valores o fuentes). El hallazgo estructural más importante es que esas 600 filas no son 600 actividades independientes, sino **120 familias conceptuales de acción × 5 variantes de nivel** (Inicial/Bronce/Plata/Oro/Platino), con una relación perfectamente limpia y verificable matemáticamente: dentro de cada familia solo cambian el texto de dosis, `life_hours`, `life_days` y `message_user`; `unit`, `rationale` y `source_ids` permanecen constantes. Esto confirma sin ambigüedad que el modelo `action_family + level_variant` que se pide evaluar es viable y ya está implícito en los datos.

El hallazgo más delicado no está en el catálogo sino en el cruce catálogo↔motor: el catálogo ya incorpora una progresión de crédito por nivel propia y muy limpia (Inicial≈0,667×, Bronce=1×, Plata≈1,333×, Oro≈1,667×, Platino=2× del valor Bronce), mientras que `engine_config.json` define un `levelMultiplier` completamente distinto (0,9× / 1,0× / 1,08× / 1,16× / 1,24×) que el PDF histórico indica aplicar **sobre** `vida_base_horas` en la fórmula por acción. Ninguna de las tres fuentes aclara si ambos mecanismos son la misma cosa (y por tanto se duplicarían) o dos ejes distintos que comparten, por coincidencia o por deuda de nomenclatura, los mismos cinco nombres de nivel. Es el conflicto de mayor severidad de toda la auditoría.

El pilar `Rutinas` queda confirmado como una capa transversal de adherencia/hábito que redistribuye subpilares y fuentes bibliográficas de los otros tres dominios (ejercicio, alimentación, sueño/estrés) más un núcleo propio de auto-monitoreo y vínculo social — no es equivalente a "rutinas de ejercicio". Se detectó además una única pero real duplicación conceptual entre pilares: "Sin alcohol 3 h antes de dormir" existe como familia completa tanto en `Mente` como en `Rutinas`, con créditos distintos para el mismo comportamiento.

La trazabilidad de fuentes es sólida (16/16 IDs definidos y usados, cero IDs huérfanos o no definidos), aunque hay reutilización de fuentes entre dominios que en un caso (mindfulness aplicado a movilidad/yoga dentro de "Retos") merece revisión de pertinencia, no de existencia.

El motor de gamificación (rachas, boosters, combos, multiplicadores semanales) está reconciliado **al 100%** entre Excel, JSON y PDF — es la parte más sólida de todo el proyecto. Los caps y las reglas de rendimientos decrecientes, en cambio, solo existen en `engine_config.json`: no hay hoja de Excel ni cifra exacta en el PDF que las corrobore, así que hoy son una afirmación de fuente única.

**Veredicto de esta fase: `NOT_READY_FOR_CANONICAL_BUILD`** — no por mala calidad de los datos (que es alta), sino porque hay decisiones de gobernanza pendientes (el conflicto de doble escalado por nivel, el duplicado Mente/Rutinas, la falta de corroboración de los caps) que deben resolverse por decisión humana antes de fijar un esquema canónico, tal como pide el encargo.

---

## 2. DATA RECONCILIATION — Excel v3 vs `actions_catalog.json`

| Métrica | Excel v3 | actions_catalog.json | Coincide |
|---|---|---|---|
| Total de acciones | 600 | 600 | Sí |
| Acciones por pilar | 150 / 150 / 150 / 150 (Retos, Rutinas, Alimentación, Mente) | idéntico | Sí |
| Acciones por nivel | 120 × 5 niveles | idéntico | Sí |
| IDs únicos | 600/600 (0 duplicados) | 600/600 (0 duplicados) | Sí |
| Acciones solo en Excel | — | 0 | Sí |
| Acciones solo en JSON | — | 0 | Sí |
| Diferencias de `life_hours` | — | 0 filas con diferencia | Sí |
| Diferencias de `life_days` | — | 0 filas con diferencia | Sí |
| Diferencias de `source_ids` | — | 0 filas con diferencia | Sí |
| Diferencias de texto (`title`, `subpillar`, `unit`, `rationale`, `message_user`) | — | 0 filas con diferencia | Sí |
| Valores nulos/vacíos | 0 en las 8 columnas relevantes | 0 | Sí |

El merge por `id` entre las 600 filas reconstruidas del Excel (aplicando exactamente la lógica de `excel_to_json_upsert2.py`: `id = {PILLAR}-{NIVEL}-{nº de fila dentro de la hoja, 3 dígitos}`) y las 600 del JSON da un resultado perfecto (`600 both`, `0 left_only`, `0 right_only`). El JSON es, en la práctica, una serialización fiel del Excel v3 y puede tratarse como equivalente a él para todo lo que sigue.

**Importante sobre los IDs**: el ID de cada acción no codifica nada del contenido — es simplemente la posición de la fila dentro de su hoja y nivel (`RET-INI-001`, `RET-INI-002`…). Si alguien reordena filas en el Excel al editarlo, los IDs se resignifican silenciosamente y dejan de apuntar a la misma actividad. Esto es aceptable como estado histórico pero es un riesgo real para la canonización: el canon necesitará un identificador estable e independiente de la posición de fila (ver sección 7).

**Incoherencias de unidades detectadas** (no son errores de transcripción — son un patrón sistemático por pilar): la misma noción de "cadencia diaria/semanal" se representa con dos vocabularios distintos según el pilar. `Retos (Ejercicio)`, `Alimentación` y `Mente` usan `"1 día"`, `"1 semana"`, `"1 sesión"`, `"1 jornada"`, `"1 comida"`, `"1 hito"`; `Rutinas` usa exclusivamente `"Diaria"` y `"Semanal"`. Son 405 filas "por día" repartidas en dos strings distintos (`"1 día"`: 295; `"Diaria"`: 110) y 65 filas "por semana" en otros dos strings (`"1 semana"`: 25; `"Semanal"`: 40). Sin normalizar, cualquier lógica que agrupe por `unit` tratará estos dos vocabularios como unidades distintas.

---

## 3. ACTION-FAMILY ANALYSIS

**120 familias conceptuales, cada una con exactamente 5 variantes de nivel — sin excepciones.** Se detectaron agrupando cada fila por `(pilar, subpilar, título con los números sustituidos por un comodín)`; los 120 grupos resultantes tienen, todos y cada uno, exactamente 5 filas (una por nivel), y ninguna familia quedó incompleta. 30 familias por pilar × 4 pilares × 5 niveles = 600. Esta limpieza estructural (100% de familias completas, 0% de sobrantes) es una señal fuerte de que el Excel se diseñó ya pensando en `action_family + level_variant`, aunque nunca se haya modelado explícitamente así.

Dentro de cada familia, lo que varía por nivel es exactamente: el texto de dosis en `title` (p. ej. "Correr suave 16 min" → 32 → 35 → 41 → 46 min), `life_hours`, `life_days`, y el texto de `message_user` (que re-incrusta el nuevo valor de días). Lo que permanece **constante** dentro de la familia, verificado sobre las 120 familias sin ninguna excepción: `unit`, `rationale` (la "justificación breve") y `source_ids`. Es decir: la dosis/duración/repeticiones sube con el nivel, la evidencia citada y el tipo de unidad no cambian — solo un caso (ver más abajo) tiene, además, un mensaje al cliente redactado de forma distinta en vez de solo actualizar la cifra.

**Progresión de crédito por nivel dentro de cada familia** (razón de `life_hours` respecto al valor de Bronce de la misma familia, agregada sobre las 120 familias):

| Nivel | Ratio medio vs. Bronce | Ratio esperado si fuera exactamente 2/3, 1, 4/3, 5/3, 2 |
|---|---|---|
| Inicial | 0,668 (±0,014) | 0,667 |
| Bronce | 1,000 (por definición) | 1,000 |
| Plata | 1,333 (±0,019) | 1,333 |
| Oro | 1,664 (±0,024) | 1,667 |
| Platino | 2,002 (±0,024) | 2,000 |

La progresión es monótona estrictamente creciente en el 100% de las 120 familias (Inicial < Bronce < Plata < Oro < Platino sin ninguna excepción) y sigue casi exactamente una secuencia aritmética de incrementos de 1/3 sobre el valor Bronce. Esto **no coincide** con la tabla `levelMultiplier` del motor (0,9/1,0/1,08/1,16/1,24) — se desarrolla en la sección 6 y en conflictos, porque es el hallazgo más importante de toda la auditoría del motor.

**Duplicado conceptual entre pilares** (el único detectado tras comparar las 120 plantillas de título entre los cuatro pilares): la familia "Sin alcohol # h antes de dormir" existe completa y por separado en `Mente` (subpilar "Sueño/calidad") y en `Rutinas` (subpilar "Sueño/calidad"), con la misma fuente (`ACC2023`) pero **créditos distintos** en cada pilar para el mismo comportamiento real (p. ej. Inicial: 1,3 h en Mente vs. 1,0 h en Rutinas; Platino: 3,9 h en Mente vs. 2,9 h en Rutinas) y mensajes al usuario redactados de forma diferente. No se ha tocado ni fusionado — se deja marcado para decisión de gobernanza porque, tal cual está, un usuario podría registrar la misma acción dos veces (una en cada pilar) y cobrar DVG por partida doble.

---

## 4. PILLAR ANALYSIS

| Pilar | Acciones | Familias | Subpilares | Fuentes usadas | `life_hours` medio (Inicial→Platino) |
|---|---|---|---|---|---|
| Retos (Ejercicio) | 150 | 30 | 25 | WEN2011, PALUCH2021, DING2025, MOMMA2022, EKELUND2016, REPLACESED2018, MBI_DISTRESS2023 | 1,49 → 4,48 |
| Rutinas | 150 | 30 | 28 | las 13 fuentes reutilizadas de los otros 3 pilares (ninguna propia) | 0,83 → 2,49 |
| Alimentación | 150 | 30 | 27 | FADNES2022, SOFI2008, SSB2019, UPF2024 | 1,54 → 4,62 |
| Mente | 150 | 30 | 24 | ACC2023, SLEEPU2017, MBSR_BP2020, MBI_DISTRESS2023, DISTRESS2012, SOCIAL2010 | 1,13 → 3,39 |

**Retos (Ejercicio)**: el más homogéneo. 25 subpilares que cubren fuerza (7 variantes por grupo muscular), cardio (6 variantes de intensidad/modalidad), HIIT, movilidad, prevención de caídas, NEAT y pasos. Progresión de crédito coherente y sin outliers relevantes salvo la familia "Romper sedentarismo" (pausas activas de 2–5 min), que sistemáticamente recibe menos crédito que el resto del pilar en todos los niveles — estadísticamente es un outlier bajo, pero tiene sentido por la dosis tan corta; se marca `REQUIRES_DVG_REVIEW` de severidad baja solo para confirmar que es intencional.

**Alimentación**: 27 subpilares centrados en patrón mediterráneo, reducción de ultraprocesados/azúcares, planificación e hidratación. Es el único pilar cuya `rationale` ("Acción alineada con patrón mediterráneo/óptimo y menor mortalidad") es coherente con sus 4 fuentes propias sin solapamientos raros.

**Mente**: 24 subpilares, con un reparto claro en tres sub-familias temáticas que ya coincide con la separación de cara al cliente que consta en `estado_pilares_bienestar.md` (Sueño / Estrés / Bienestar emocional), aunque a nivel de catálogo de créditos sigue siendo un único pilar backend "MEN". Es el pilar con menor crédito medio por acción de los tres dominios primarios.

**Rutinas — atención especial**: el nombre histórico **no** es equivalente a una futura pestaña "Rutinas de ejercicio". Sus 28 subpilares se reparten así, por dominio real de contenido:
- Relacionados con ejercicio/movimiento (7): Acumular MVPA, Adherencia ejercicio, Movilidad, Pasos acumulados, Romper sedentarismo, Romper sedentarismo/NEAT, Transporte activo.
- Relacionados con alimentación (7): Aumentar fruta, Cereales integrales, Glucemia postprandial, Mejor elección, Patrón mediterráneo, Planificación nutricional, Reducción SSB.
- Relacionados con sueño/estrés (8): Dolor/estrés, Estrés/fatiga, Glucemia/sueño, Higiene del sueño, Reducción estrés, Regularidad sueño, Sueño/calidad, Sueño/relajación.
- Meta-hábito transversal (6): Autocuidado, Automonitoreo, Conexión social, Feedback/adhesión, Implementación hábito, Objetivo semanal.

Esto se confirma también por fuentes: las 13 referencias bibliográficas que se reutilizan entre pilares aparecen **todas** también en Rutinas — es decir, Rutinas no tiene una base de evidencia propia, sino que toma prestada la de los otros tres dominios. Además recibe sistemáticamente menos crédito por acción que cualquiera de los otros tres pilares (0,83–2,49 h vs. 1,1–4,6 h), lo que encaja con la hipótesis de que fue diseñado como una capa secundaria de "hábito/adherencia", no como un cuarto dominio de igual peso. No se reclasifica ningún registro en esta fase; la pregunta que queda abierta para gobernanza es si `Rutinas` debe (a) conservarse como capa transversal de adherencia con su propio nombre canónico distinto de "ejercicio", (b) dividirse y redistribuir sus 28 subpilares entre los tres dominios primarios, o (c) ambas cosas — conservar el concepto de "hábito/adherencia" pero renombrado para no chocar con la futura pestaña de rutinas de ejercicio de la app.

---

## 5. DVG AUDIT

**Consistencia `life_days ≈ life_hours / 24`**: se cumple en las 600 filas dentro de la tolerancia esperada por redondeo a 2 decimales (`life_days` está redondeado a 2 decimales según la propia `engine_config.json`, `precision_days: 2`). La diferencia máxima observada entre `life_days` y `life_hours/24` es 0,005 (el error máximo posible de un redondeo a 2 decimales), y ninguna fila supera ese umbral. **No hay ninguna inconsistencia real aquí** — la relación matemática se cumple con exactitud dentro del redondeo declarado.

**Distribución de `life_hours` global**: mínimo 0,7 h, máximo 5,5 h, media 2,49 h, mediana 2,4 h. Por nivel, la media sube de forma monótona y suave (Inicial 1,25 h → Bronce 1,87 h → Plata 2,49 h → Oro 3,11 h → Platino 3,74 h, promediando los 4 pilares). Por pilar (ver tabla de la sección 4), Alimentación y Retos son los de mayor crédito medio, Rutinas el de menor.

**Outliers** (|z|>2 dentro de su grupo pilar+nivel): 10 filas, las 5 correspondientes a la familia "Romper sedentarismo" en `Retos (Ejercicio)` (repetida porque tiene 2 variantes de subpilar), en los 5 niveles. Es el único patrón de outlier estadístico detectado en las 600 filas. Se etiqueta `REQUIRES_DVG_REVIEW` (severidad baja) solo para confirmación de intencionalidad, no como error.

**Chequeo aproximado de calibración contra los objetivos de negocio del PDF** (sección 8 del PDF: "Plata ≈ +45 días/año/pilar; Oro ≈ +60; Platino ≈ +90", asumiendo una acción/día durante un año, sin rachas ni boosters ni multiplicadores semanales — es una aproximación deliberadamente simplificada, no una simulación del motor completo):

| Pilar | Plata (obj. ≈45) | Oro (obj. ≈60) | Platino (obj. ≈90) |
|---|---|---|---|
| Retos (Ejercicio) | 46,0 ✅ | 58,2 ✅ | 69,2 ⚠️ (−23%) |
| Alimentación | 47,4 ✅ | 59,9 ✅ | 71,5 ⚠️ (−21%) |
| Mente | 33,9 ⚠️ (−25%) | 41,2 ⚠️ (−31%) | 50,2 ⚠️ (−44%) |
| Rutinas | 26,0 ⚠️ (−42%) | 30,8 ⚠️ (−49%) | 37,7 ⚠️ (−58%) |

Con una sola acción/día, Retos y Alimentación se acercan bien a los objetivos declarados en Plata y Oro, pero los cuatro pilares se quedan por debajo en Platino, y Mente/Rutinas se quedan sistemáticamente por debajo en los tres niveles. Añadir el efecto de rachas (+hasta 20%) y multiplicadores semanales (+10%) cerraría buena parte de la brecha en Retos/Alimentación, pero no en Mente/Rutinas, cuyo déficit es demasiado grande para explicarse solo por esos multiplicadores. Esto no es necesariamente un error — puede ser una decisión deliberada (Mente/Rutinas como pilares "de apoyo" con techos de crédito más bajos, coherente con sus caps diarios/semanales también más bajos) — pero al no estar documentada la intención en ninguna de las tres fuentes, se etiqueta `REQUIRES_DVG_REVIEW` de severidad media a nivel de pilar completo, no de fila individual.

**Campo `rationale` ("Justificación breve")**: solo tiene 4 valores distintos en las 600 filas — uno exactamente por pilar (150 filas cada uno). Funciona hoy como una descripción genérica del dominio, no como una justificación específica de cada acción individual, pese a su nombre. Es una limitación de granularidad a tener en cuenta para el canon (ver sección 7), no un dato incorrecto.

---

## 6. ENGINE RECONCILIATION — JSON vs PDF vs Excel

**Niveles**: Excel (`Engine_LevelMultiplier`) y `engine_config.json` coinciden exactamente: Inicial 0,90 / Bronce 1,00 / Plata 1,08 / Oro 1,16 / Platino 1,24. El PDF no da la tabla de valores, solo la fórmula `vida_base_horas × levelMultiplier(nivel)`. **Conflicto** (ver sección 8): esta tabla no coincide con la progresión de crédito ya embebida en el catálogo por nivel (sección 3).

**Rachas**: coincidencia total en las tres fuentes. Diaria `f_d(s) = min(1 + 0,02·s, 1,20)`; semanal `f_w(w) = min(1 + 0,05·w, 1,35)`. Sin conflictos.

**Boosters**: coincidencia total en las tres fuentes, incluyendo nombre, multiplicador, condición, alcance y el flag `delayed` de "Recovery Perfect": Weekend Warrior ×1,30 (Retos, fin de semana, ≥90 min), Coach Check ×1,15 (por acción, máx. 2/semana, verificación de coach), Social Buddy ×1,10 (todos los pilares, participación en reto comunitario), Recovery Perfect ×1,15 diferido (Retos del día siguiente, condiciones de sueño). Sin conflictos.

**Combos**: coincidencia total. Move+Sleep +0,3 h, Food+Mind +0,2 h, All 4 pilares +0,6 h, Cardio+Fuerza +0,2 h. Todos son bonos planos ("flat"), no multiplicadores, en las tres fuentes. Sin conflictos.

**Multiplicadores semanales**: coincidencia total. WHO cumplido (Retos) ×1,10, Mediterránea 5+ días (Alimentación) ×1,10, Sueño saludable 5/7 (Mente) ×1,10, All-pillars week (Global) ×1,10. Sin conflictos.

**Caps y rendimientos decrecientes**: existen **únicamente** en `engine_config.json`. El Excel v3 no contiene ninguna hoja de caps (las 10 hojas del libro son las 4 de pilares, `Fuentes` y 5 hojas `Engine_*`; no hay `Engine_Caps` ni una hoja `README`, pese a que el PDF menciona explícitamente que "el Excel v2 ya contiene todas las hojas del engine (LevelMultiplier, Streaks, Boosters, Combos, WeeklyMultipliers, **Caps**, **README**)"). El PDF da la cifra de los caps en prosa (coincide textualmente con `engine_config.json`: diario Retos≤6h/Rutinas≤4h/Alimentación≤6h/Mente≤4h/Global≤10h; semanal Retos≤84h/Rutinas≤72h/Alimentación≤84h/Mente≤72h/Global≤240h), pero las reglas de rendimientos decrecientes (los umbrales exactos: 180 min/día para Retos, 8/6/4 acciones/día para Rutinas/Alimentación/Mente) **no** tienen ninguna corroboración fuera de `engine_config.json` — ni el Excel ni el PDF dan esas cifras exactas. Se registra como gap de fuente única, no como conflicto de valores (no hay nada con qué discrepar).

**Orden de cálculo**: el PDF es la única fuente que declara explícitamente el orden (`Rachas → Boosters → Combos (flat) → Caps diarios → Multiplicadores semanales → Cap semanal`) y la fórmula por acción (`horas_ajustadas = vida_base_horas × levelMultiplier(nivel) × f_d(streak) × boosterMult`). Ni el Excel ni `engine_config.json` codifican ese orden como dato explícito — hoy vive solo en la prosa del PDF. Es un gap de gobernanza real: el futuro motor canónico necesita este orden como campo estructurado, no como documentación aparte.

**Metadato de procedencia inconsistente**: `engine_config.json.catalog_source.path` apunta a `"NUTRILONGX_creditos_v2.xlsx"`, y el propio PDF está escrito íntegramente sobre "el Excel v2" (lo menciona más de diez veces). Sin embargo, el catálogo realmente auditado y ya vigente es v3 (`actions_catalog.json` declara `"source_excel": "NUTRILONGX_creditos_v3.xlsx"`). El motor y la especificación histórica (Tier 2/Tier 3) no se han actualizado para reflejar el salto v2→v3; funcionalmente no rompe nada porque el `columns_map` de `engine_config.json` sigue siendo compatible con las columnas de v3, pero el puntero de versión es hoy incorrecto.

---

## 7. LEGACY → CANONICAL PROPOSAL (nomenclatura, sin cambiar IDs históricos todavía)

Propuesta de capa de mapeo (solo propuesta — no implementada):

| legacy_pillar | canonical_domain | canonical_subdomain (propuesto, ejemplos) |
|---|---|---|
| Retos (Ejercicio) | `movement` | fuerza, cardio, HIIT, movilidad, NEAT, prevención de caídas |
| Alimentación | `nutrition` | patrón mediterráneo, procesados/azúcar, hidratación, planificación |
| Mente | `mind` (posible división futura en `sleep` / `stress` / `emotional_wellbeing`, ya usada de cara al cliente según `estado_pilares_bienestar.md`) | sueño, gestión del estrés, mindfulness, conexión social, propósito |
| Rutinas | `adherence` (nombre provisional — a decidir; explícitamente **no** `exercise_routines`) | sub-etiquetado por el dominio real que redistribuye: `adherence.movement`, `adherence.nutrition`, `adherence.sleep_stress`, `adherence.self_tracking` |

Cada acción legacy conservaría su `legacy_id` (el ID posicional actual, p. ej. `RET-INI-001`) como campo de trazabilidad, nunca como clave primaria del canon, precisamente porque hoy ese ID depende del orden de fila en el Excel y no del contenido.

Para separar "acción conceptual" de "variante por nivel" sin perder nada, el canon necesitaría como mínimo dos niveles de entidad: una `action_family` (los 120 grupos ya detectados: pilar + subpilar + plantilla de dosis) con sus campos invariantes (`unit`, `rationale`/justificación de dominio, `source_ids`, `legacy_pillar`, `canonical_domain`, `canonical_subdomain`), y un `level_variant` por familia (los 5 niveles) con sus campos variables (`title` con dosis, `life_hours`, `life_days`, `message_user`, `legacy_id`).

---

## 8. GOBERNANZA (propuesta de campos, sin SQL)

Como mínimo el canon debería distinguir, por entidad:
- **Acción conceptual** (`action_family`): identidad estable, dominio/subdominio canónico, evidencia (lista de `source_ids`), estado.
- **Variante por nivel** (`level_variant`): valor base de crédito, texto de dosis, mensaje al usuario, `legacy_id` heredado.
- **Gobernanza transversal**: `status` (`active` / `deprecated` / `review`), `review_flags` (lista abierta — ya se han identificado en esta auditoría los valores `REQUIRES_DVG_REVIEW`, `REQUIRES_SOURCE_REVIEW`, `REQUIRES_ENGINE_REVIEW`, `CROSS_PILLAR_DUPLICATE`), `source_version` (para no volver a perder de vista si algo se generó desde v2 o v3), y `legacy_ids` (array, por si en el futuro una familia hereda de más de un ID histórico, como en el caso Mente/Rutinas si se decide fusionar).

**Disclaimer obligatorio** (a preservar literalmente en el motor canónico y en la UX, unificando la redacción — hoy existen dos versiones casi idénticas pero no iguales entre `engine_config.json` y el PDF):
> "Los DVG son créditos educativos inspirados en evidencia poblacional y no predicen individualmente la esperanza de vida."

---

## 9. CONFLICTS AND GAPS (lista explícita)

1. **[ALTA] Doble escalado por nivel, no resuelto en ninguna fuente.** El catálogo ya embebe una progresión de crédito por nivel (≈0,667×/1×/1,333×/1,667×/2× sobre Bronce) y el motor define un `levelMultiplier` distinto (0,9×/1,0×/1,08×/1,16×/1,24×) que, según la fórmula literal del PDF (`vida_base_horas × levelMultiplier(nivel)`), se aplicaría sobre ese mismo valor ya escalado. Nadie ha confirmado si son el mismo eje (y por tanto hay que elegir uno) o dos ejes distintos que comparten nombre por coincidencia.
2. **[ALTA] Duplicado conceptual entre pilares.** "Sin alcohol 3 h antes de dormir" existe como familia completa e independiente en `Mente` y en `Rutinas`, con créditos distintos para el mismo comportamiento real — riesgo de doble cómputo de DVG.
3. **[MEDIA] Ambigüedad semántica de "Rutinas".** Confirmado que no equivale a "rutinas de ejercicio"; es una capa transversal de adherencia que toma subpilares y fuentes de los otros tres dominios. Requiere decisión de negocio (conservar/renombrar/dividir), no solo técnica.
4. **[MEDIA] Objetivos de negocio del PDF no verificados en Mente y Rutinas.** Con el chequeo aproximado de la sección 5, ambos pilares se quedan sistemáticamente por debajo de los objetivos anuales declarados (`+45/+60/+90` días/año/pilar), incluso antes de aplicar caps.
5. **[MEDIA] Caps y rendimientos decrecientes son de fuente única.** Solo existen en `engine_config.json`; no hay hoja de Excel `Engine_Caps` (el PDF la da por existente y no está) ni cifras exactas de umbrales en el PDF.
6. **[BAJA-MEDIA] Metadato de versión obsoleto.** `engine_config.json` y el PDF apuntan a "v2"; el catálogo realmente vigente y auditado es v3. No rompe nada funcionalmente pero debe corregirse antes de canonizar.
7. **[BAJA] IDs posicionales, no semánticos.** El esquema actual de IDs (`PILLAR-NIVEL-nº de fila`) no es estable ante reordenaciones del Excel; no debe usarse como clave primaria del canon.
8. **[BAJA] Vocabulario de unidades inconsistente entre pilares.** `Rutinas` usa "Diaria"/"Semanal" donde el resto usa "1 día"/"1 semana"; son 405 y 65 filas respectivamente afectadas por la falta de normalización.
9. **[BAJA] `rationale` funciona como etiqueta de dominio, no de acción.** Solo 4 valores distintos en 600 filas (uno por pilar) pese a llamarse "Justificación breve" por fila.
10. **[BAJA] Reutilización de fuente de dudosa pertinencia.** `MBI_DISTRESS2023` (mindfulness y distrés) justifica dos familias de `Retos (Ejercicio)` ("Movilidad", "Movilidad/antiestrés") donde existen fuentes de ejercicio más directas para el resto del pilar. Defendible (yoga/movilidad tienen componente mente-cuerpo) pero merece confirmación explícita.
11. **[BAJA] Orden de cálculo del motor no está codificado como dato.** Solo existe en la prosa del PDF (Rachas→Boosters→Combos→Caps diarios→Multiplicadores semanales→Cap semanal); ni el Excel ni el JSON lo declaran como campo estructurado.
12. **[INFO] Outlier estadístico de baja severidad.** La familia "Romper sedentarismo" en `Retos (Ejercicio)` recibe sistemáticamente menos crédito que el resto del pilar en los 5 niveles — coherente con su dosis corta, se marca solo para confirmación.

---

## RECOMENDACIÓN

**`NOT_READY_FOR_CANONICAL_BUILD`**

La calidad de los datos de origen es alta (reconciliación Excel↔JSON perfecta, trazabilidad de fuentes completa, estructura de familias limpia al 100%), pero hay al menos dos conflictos de severidad alta (el doble escalado por nivel entre catálogo y motor, y el duplicado Mente/Rutinas) que afectan directamente a cómo se calcularía el crédito en el sistema canónico, y no deben resolverse por defecto ni de forma silenciosa. Antes de construir los tres artefactos canónicos necesito tu decisión explícita sobre:

1. Si el `levelMultiplier` del motor es un eje distinto del "Nivel" del catálogo (y por tanto ambos se mantienen y se documentan como ejes separados) o si es el mismo eje y hay que elegir cuál de las dos progresiones es la válida.
2. Qué hacer con el duplicado "Sin alcohol 3 h antes de dormir" (fusionar en un solo pilar, mantener ambos como intencionales y documentarlo, o marcarlo `deprecated` en uno de los dos).
3. El futuro de `Rutinas` como nombre/dominio (conservar como capa de adherencia con nombre propio, dividir entre los tres dominios primarios, o algo intermedio).
4. Si los objetivos anuales de DVG del PDF (`+45/+60/+90`) siguen vigentes como referencia de calibración, en particular para Mente y Rutinas, o si hay que revisarlos.

En cuanto confirmes estos puntos (o me digas que los das por buenos tal cual y prefieres que documente la ambigüedad en vez de resolverla), genero los tres artefactos: `NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1.json`, `NUTRILONGX_GAMIFICATION_ENGINE_CANONICAL_v1.json` y `NUTRILONGX_LEGACY_MAPPING_REPORT_v1.md`.

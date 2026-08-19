# NUTRILONGX — EJERCICIO: Fase 1 — Diseño de la Especificación Canónica desde Cero

Fecha: 2026-08-18. Este documento es una **propuesta de diseño**, no un artefacto FROZEN. No se ha generado `NUTRILONGX_EJERCICIO_MASTER_v1.json`. No se ha tocado `CANONICAL v1.0` (`NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1.json`, `NUTRILONGX_GAMIFICATION_ENGINE_CANONICAL_v1.json`, `NUTRILONGX_LEGACY_MAPPING_REPORT_v1.md`) ni `NUTRILONGX_ALIMENTACION_MASTER_v1.json`. Sin SQL, sin Supabase, sin GitHub, sin Vercel, sin frontend.

No existe corpus legacy de ejercicio que reconciliar — esta NO es una auditoría de fuentes históricas, es un diseño de especificación desde cero, apoyado en evidencia científica externa.

---

## A. EXECUTIVE SUMMARY

NUTRILONGX no dispone actualmente de un catálogo de ejercicio propio (ni en Excel, ni en JSON, ni en Supabase). Lo único que existe hoy relacionado con "ejercicio" son **acciones de gamificación** ya congeladas en `CANONICAL v1.0`: 30 familias `movement.*` y 8 familias `adherence.movement.*` (auditadas de forma read-only en la sección K). Estas acciones describen *comportamientos que generan crédito (DVG)*, no un modelo de contenido de ejercicio (series, repeticiones, técnica, seguridad, progresión).

Este informe propone una arquitectura de datos separando explícitamente seis capas conceptuales — **Ejercicio, Variante, Sesión, Programa, Acción Gamificada, Adherence.movement** — y diseña, para cada una, qué campos necesita basándose en el modelo FITT-VP (ACSM) y en la jerarquía de fuentes definida en la sección B. Se propone una taxonomía de 4 dominios de entrenamiento ortogonales (cardiorrespiratorio, fuerza/resistencia, flexibilidad, neuromotor) más un constructo conductual transversal (interrupción del sedentarismo), y se identifican explícitamente los puntos donde la taxonomía científica **no coincide** con la agrupación ya congelada en `CANONICAL v1.0` (HIIT, mobility, fall_prevention) — sin resolver esa discrepancia unilateralmente; se deja como decisión explícita para César en la sección O.

Se diseña un modelo de seguridad clínica de 5 estados (`ABSOLUTE_CONTRAINDICATION` / `RELATIVE_CONTRAINDICATION` / `PRECAUTION` / `ADAPTATION` / `NOT_ASSESSED`) con la misma disciplina que Alimentación aplicó a `COMPOSITION_UNKNOWN`: la ausencia de evaluación nunca se convierte silenciosamente en "seguro". Se evalúan 11 perfiles clínicos NUTRILONGX y se documenta honestamente que la evidencia es sólida para algunos (fragilidad/sarcopenia, oncología, HTA, DM2) y notablemente más débil o mixta para otros (menopausia, inmunosupresión) — sin inventar certeza donde no la hay.

No se ha generado ningún ejercicio, ninguna sesión, ningún programa, ninguna regla clínica con valores concretos. Este documento es la especificación previa a esa construcción.

**Veredicto de esta fase**: `READY_FOR_GOVERNANCE_REVIEW` (ver sección P).

---

## B. SCIENTIFIC SOURCE HIERARCHY

Clasificación aplicada de forma consistente: `GUIDELINE` > `CONSENSUS` > `SYSTEMATIC_REVIEW` / `META_ANALYSIS` > `PRIMARY_STUDY`. Ninguna regla propuesta en este documento se apoya en un único estudio primario cuando existe guía o consenso disponible.

### B.1 Actividad física general / FITT-VP / dominios

| Fuente | Clasificación | Año | Aporta |
|---|---|---|---|
| WHO, *Guidelines on Physical Activity and Sedentary Behaviour* | `GUIDELINE` | 2020 | Dosis aeróbica (150–300 min/sem moderada o 75–150 vigorosa) y de fuerza (≥2 días/sem) para adultos y adultos mayores; dominio adicional de equilibrio/funcional para 65+ (≥3 días/sem); sedentarismo tratado como constructo conductual separado, no como dominio de entrenamiento. |
| Bull FC et al., *BJSM* (companion paper del WHO 2020) | `GUIDELINE` | 2020 | Confirma que WHO trata aeróbico, fuerza y (en mayores) equilibrio/funcional como recomendaciones paralelas e independientes, no como sub-atributos entre sí. |
| ACSM, *Guidelines for Exercise Testing and Prescription*, 11ª ed. | `GUIDELINE` | 2021 | Define formalmente el marco FITT-VP (Frequency/Intensity/Time/Type/Volume/Progression) y operacionaliza intensidad vía %HRmax, %HRR, METs, RPE 6–20 y RPE 0–10. |
| Garber CE et al. (ACSM Position Stand), *MSSE* 43(7) | `GUIDELINE` | 2011 | Fuente más autorizada de taxonomía de dominios: 4 pilares — cardiorrespiratorio, musculoesquelético/fuerza, flexibilidad, **neuromotor** (equilibrio + agilidad + coordinación + marcha, fusionados en una sola categoría). |
| ACSM/ESSA Joint Consensus, *J Sci Med Sport* | `CONSENSUS` | 2024 | Armonización terminológica de intensidad (ligera/moderada/vigorosa/casi-máxima/máxima) entre %HRmax, %HRR, METs y RPE. |
| AHA, *Resistance Exercise Training…: 2023 Update* (Paluch et al.), *Circulation* | `GUIDELINE` (scientific statement) | 2023 | Fuerza 2×/sem, 8–12 reps a fatiga, ~40–60% 1RM produce beneficio cardiovascular medible; menor intensidad relativa que el rango general ACSM, orientado a resultado cardiometabólico. |
| Ainsworth BE et al., *Compendium of Physical Activities* | `CONSENSUS` (base de referencia, no guía clínica) | 1993/2000/2011/2024 | Sistema de codificación MET plano — no organiza actividades en dominios ortogonales; confirma que la separación por dominio es una decisión de diseño posterior, no algo inherente a la clasificación por gasto energético. |

### B.2 Prescripción de fuerza / escalas de esfuerzo

| Fuente | Clasificación | Año | Aporta |
|---|---|---|---|
| Kraemer WJ, Ratamess NA (ACSM Position Stand), *MSSE* | `GUIDELINE` | 2002/2009 | Variables de progresión separables: carga (%1RM), volumen (series×reps×carga), orden, descanso, complejidad de ejercicio (mono- vs multiarticular). |
| NASM, *Optimum Performance Training (OPT) Model* | Marco de certificación profesional — no es literatura académica revisada por pares; tratado explícitamente como tal | vigente | Precedente aplicado de separar complejidad técnica/demanda de estabilidad (fases iniciales) de carga/intensidad (fases avanzadas, 85–100% 1RM) como ejes independientes. |
| Borg G, *Scand J Rehabil Med* / *MSSE* 14(5) | `PRIMARY_STUDY` (adoptado luego como estándar por ACSM) | 1970/1982 | Escala RPE 6–20 (esfuerzo aeróbico global) y escala CR-10 0–10 (sensaciones localizadas: disnea, fatiga muscular, dolor). |
| Zourdos MC et al., *J Strength Cond Res* / Helms ER et al., *NSCA SCJ* | `PRIMARY_STUDY` / guía aplicada de facto | 2016 | Escala RIR (Repeticiones en Reserva) 0–10 para entrenamiento de fuerza: RPE 10 = 0 RIR (fallo), RPE 9 = 1 RIR, etc. Validada frente a velocidad de ejecución. |
| Bastos V et al., scoping review, *Sage journals* | `SYSTEMATIC_REVIEW` | 2024 | Confirma adopción creciente del marco RIR 0–10 como métrica estándar de esfuerzo en fuerza junto a Borg CR-10. |
| Estudio piloto RIR vs %1RM en rehabilitación cardiaca, *J Funct Morphol Kinesiol* | `PRIMARY_STUDY` (ECA piloto) | 2023 | RIR y %1RM producen ganancias de fuerza comparables en rehabilitación cardiaca — apoya RIR como alternativa clínicamente válida cuando el test de 1RM es de riesgo/logística elevada. |

### B.3 Taxonomía, dificultad y clasificación de contraindicaciones

| Fuente | Clasificación | Año | Aporta |
|---|---|---|---|
| Ide BN et al., *Front Sports Act Living* | `SYSTEMATIC_REVIEW` (conceptual) | 2022 | "Functional training" no es un dominio distinto — carece de definición universal y produce las mismas adaptaciones que fuerza/potencia/flexibilidad/resistencia convencional. |
| Pereira et al., consenso Delphi internacional, *J Sports Sci* | `CONSENSUS` (Delphi, 13 expertos) | 2025 | Confirma que "funcional" se modela mejor como atributo/continuo de especificidad superpuesto a otros dominios, no como dominio ortogonal. |
| ACC/AHA Guidelines for Exercise Testing (Gibbons RJ et al.) reflejadas en ACSM GETP | `GUIDELINE` | 1997/2002, vigente en ediciones ACSM actuales | Define la dicotomía estándar `ABSOLUTE` (no proceder bajo ninguna circunstancia — p.ej. cambios ECG sugestivos de isquemia en las últimas 48h, angina inestable, estenosis aórtica sintomática grave, insuficiencia cardiaca descompensada) vs `RELATIVE` (proceder si el beneficio esperado supera el riesgo, típicamente con supervisión — p.ej. HTA no controlada >200/110 mmHg, valvulopatía moderada, anomalías electrolíticas). |
| PAR-Q+ (Warburton DER et al., basado en CSEP PAR-Q original) | `GUIDELINE` / instrumento validado | 1992 (revisión) / PAR-Q+ 2011+ | Cribado de preparticipación autoadministrado; complementario al cuestionario conjunto AHA/ACSM. |
| ACSM risk stratification (bajo/moderado/alto riesgo) | `GUIDELINE` | ediciones GETP vigentes | Estratificación por nº de factores de riesgo CV + enfermedad conocida + síntomas, determina necesidad de clearance médico. |

### B.4 Poblaciones clínicas específicas

| Perfil | Fuente principal | Clasificación | Año | Madurez de evidencia |
|---|---|---|---|---|
| Adulto sano | WHO 2020, ACSM GETP 11ª ed. | `GUIDELINE` | 2020/2021 | **STRONG** |
| Obesidad | ACSM Consensus Statement (Jakicic JM et al.), *Transl J ACSM* | `CONSENSUS` | 2024 | **STRONG** (dosis aeróbica); recomienda enfoque multimodal individualizado, sin superioridad de un modo sobre otro |
| DM2 | ADA *Standards of Care in Diabetes* + Colberg SR et al. (ADA Position Statement), *Diabetes Care* | `GUIDELINE` + `CONSENSUS` | 2026 (vigente) / 2016 (base de precauciones por complicación) | **STRONG** |
| HTA | ESH 2023 Guidelines + ACSM Pronouncement + AHA 2023 Scientific Statement | `GUIDELINE` + `CONSENSUS` | 2023 | **STRONG**, con el matiz de que el vínculo Valsalva/HTA se trata como extrapolación de literatura ACSM/AHA, no cita textual de ESH 2023 |
| Dislipemia | ESC/EAS 2019 (+ focused update 2025) | `GUIDELINE` | 2019/2025 | **MODERATE** — sin prescripción distintiva propia; se pliega en guía CV general |
| Edad avanzada | WHO 2020, ACSM Position Stand 2009, NICE NG249 (2025) | `GUIDELINE` | 2009–2025 | **STRONG** |
| Fragilidad/sarcopenia | EWGSOP2 (Cruz-Jentoft et al., *Age Ageing*), ICFSR (Dent et al., *J Nutr Health Aging*) | `CONSENSUS` | 2019 | **STRONG** para recomendación general (entrenamiento de fuerza multicomponente como primera línea); EWGSOP2 es diagnóstico, no de prescripción de ejercicio detallada |
| Menopausia | NAMS 2021 (salud ósea), LIFTMOR RCT 2018, revisión de revisiones BMC Women's Health 2024 | `GUIDELINE` (ósea) + `PRIMARY_STUDY` + `SYSTEMATIC_REVIEW` | 2018–2024 | **MIXED**: fuerte para salud ósea (fuerza/impacto), **INSUFFICIENT** para alivio de síntomas vasomotores/psicológicos (conclusión explícita de la revisión 2024: "insufficient evidence to recommend a particular form of exercise") |
| Oncología | ACSM Roundtable 2010/2019, ASCO Guideline 2022/2024, IBMEWG (metástasis óseas) 2022 | `CONSENSUS` + `GUIDELINE` | 2010–2024 | **STRONG** general; **MODERATE** para subpoblaciones específicas (recuentos hematológicos, metástasis óseas) |
| Renal leve/moderada | KDIGO 2024, UK Renal Association/UKKA 2021 (endosada por NICE) | `GUIDELINE` | 2021/2024 | **STRONG** — sorprendentemente permisiva; principal diferencia respecto a población general: exclusión de HIIT y de carga de alto impacto no supervisada |
| Inmunosupresión | De Smet S et al., *Transplant International* (narrative review); ausencia de guía formal | `SYSTEMATIC_REVIEW`/`narrative review` | 2024 | **LIMITED** — no existe guía o consenso multidisciplinar equivalente a EWGSOP2; literatura específica de trasplante de órgano sólido, no de inmunosupresión no-trasplante (p.ej. biológicos/DMARD) |

---

## C. EXERCISE TAXONOMY

### C.1 Propuesta de dominios ortogonales

Basado en Garber et al. 2011 (ACSM Position Stand, la fuente más autorizada localizada) y confirmado por WHO 2020, se proponen **4 dominios de entrenamiento** más **1 constructo conductual**:

1. `CARDIORESPIRATORY` (aeróbico) — dominio independiente.
2. `RESISTANCE` (fuerza/musculoesquelético) — dominio independiente.
3. `FLEXIBILITY` — dominio independiente según ACSM, aunque es el menos cuantificado (WHO y AHA no le asignan objetivo numérico semanal).
4. `NEUROMOTOR` — dominio independiente que **fusiona** equilibrio + agilidad + coordinación + marcha (así lo define Garber et al. 2011 explícitamente).
5. `SEDENTARY_BEHAVIOUR_INTERRUPTION` — **no es un dominio de entrenamiento** en el sentido ACSM; es un constructo conductual que WHO trata de forma separada y aditiva ("sustituir tiempo sedentario por actividad de cualquier intensidad"). Se conserva como agrupación de primer nivel en la propuesta por continuidad con el catálogo `CANONICAL v1.0` ya congelado (`movement.daily_activity`, con 5 familias, y buena parte de `adherence.movement`), pero se documenta explícitamente que su naturaleza científica es distinta a la de los otros 4.

### C.2 Categorías evaluadas y NO adoptadas como dominio independiente

- **`FUNCTIONAL TRAINING`**: Ide et al. 2022 y el consenso Delphi de Pereira et al. 2025 concluyen que "entrenamiento funcional" carece de definición universal, usa los mismos ejercicios y produce las mismas adaptaciones que fuerza/potencia/flexibilidad convencionales. **Propuesta: NO dominio — atributo `movement_pattern`** (squat/hinge/push/pull/carry/rotate/gait) aplicado transversalmente a ejercicios de `RESISTANCE` y `NEUROMOTOR`.
- **`MOBILITY`**: no se encontró en esta investigación una fuente de nivel `GUIDELINE`/`CONSENSUS` que trate "mobility" (control activo del rango de movimiento) como dominio distinto de `FLEXIBILITY` (rango de movimiento pasivo). **Gap explícito** (ver sección N) — no se ha resuelto con evidencia suficiente. El catálogo `CANONICAL v1.0`, sin embargo, ya trata `movement.mobility` como subdominio propio con 2 familias congeladas. **Se deja como decisión explícita para César** (sección O), no se fuerza una unificación.
- **`HIIT` (entrenamiento interválico de alta intensidad)**: científicamente es un **formato/protocolo de entrenamiento** (una forma de estructurar F/I/T dentro de un dominio, típicamente `CARDIORESPIRATORY`, aunque también aplicable a `RESISTANCE` metabólico), no un dominio fisiológico independiente. El catálogo `CANONICAL v1.0` ya lo trata como subdominio propio con 4 familias congeladas. **Misma situación que mobility — decisión explícita pendiente**, no resuelta aquí.
- **`FALL PREVENTION`**: la evidencia (WHO 2020, NICE NG249, Otago Exercise Programme) lo trata como un **objetivo de programación** dentro del entrenamiento de equilibrio/funcional (`NEUROMOTOR`), no como un dominio fisiológico distinto. El catálogo `CANONICAL v1.0` lo trata como subdominio propio con 1 familia congelada. Misma situación — decisión pendiente.

### C.3 Justificación de no adoptar automáticamente

Esta sección responde explícitamente a la instrucción de no adoptar la lista de dominios candidatos sin justificar: de los 7 candidatos originales (aerobic/cardiorespiratory, resistance/strength, mobility, flexibility, balance, functional training, sedentary-behaviour interruption), la evidencia respalda tratar **4 como dominios** (cardiorespiratory, resistance, flexibility, neuromotor —que absorbe balance—), **1 como constructo conductual aditivo** (sedentary-behaviour interruption) y **1 como atributo transversal, no dominio** (functional training). "Mobility" queda sin resolver por insuficiencia de evidencia localizada en esta fase.

---

## D. ENTITY MODEL

Seis capas conceptuales, explícitamente distintas entre sí:

| Entidad | Qué es | Qué NO es |
|---|---|---|
| **EXERCISE** | Movimiento individual ejecutable (p.ej. sentadilla, remo, caminar). Unidad de contenido con atributos relativamente fijos: dominio(s), patrón de movimiento, complejidad técnica, requisito funcional, equipamiento, grupos musculares, notas de seguridad, multimedia. | No es una acción de gamificación. No tiene nivel Inicial/Bronce/Plata/Oro/Platino. |
| **EXERCISE_VARIANT** | Regresión/progresión o variante técnica de un `EXERCISE` base (p.ej. sentadilla con silla → sentadilla → sentadilla búlgara). Vinculada al ejercicio base vía `progression_stage` y `relationship_type` (`TECHNICAL_VARIANT` / `LOAD_VARIANT` / `REGRESSION` / `PROGRESSION`). | No es un ejercicio nuevo sin relación — siempre referencia a un `base_exercise_id`. |
| **SESSION** | Combinación estructurada de `EXERCISE`/`EXERCISE_VARIANT` ejecutada en una sesión, con parámetros FITT-VP concretos (series, reps, duración, descanso, intensidad) por instancia de ejercicio dentro de la sesión. | No es un programa. No genera DVG por sí sola salvo binding explícito futuro (ver sección K). |
| **PROGRAM** | Secuencia temporal de `SESSION` a lo largo de semanas, con lógica de progresión (cómo cambian F/I/T/V a lo largo del tiempo) y objetivo del programa. | No es un reto de gamificación. No sustituye a `adherence.movement`. |
| **GAMIFICATION ACTION** (`movement.*`, `adherence.*.movement`) | Unidad de comportamiento del catálogo `CANONICAL v1.0`, FROZEN, que genera DVG al registrarse (`action_log`, aún no implementado en Supabase). | No es un ejercicio ni una sesión — es una capa de negocio distinta, ya construida en la Fase 0. |
| **ADHERENCE.MOVEMENT** | Subconjunto de acciones gamificadas transversales que facilitan la adherencia al movimiento (desplazamiento activo, pausas de pie, escaleras). Ya documentado en `NUTRILONGX_LEGACY_MAPPING_REPORT_v1.md` como conceptualmente distinto de la futura pantalla "Rutinas". | Extiende esa misma distinción: `adherence.movement` tampoco equivale a `EXERCISE`/`SESSION`/`PROGRAM` — es una capa de seguimiento de hábito, no de contenido de entrenamiento. |

**Relaciones**: `SESSION` contiene N instancias de `EXERCISE`/`EXERCISE_VARIANT` (con overrides de FITT-VP por instancia). `PROGRAM` contiene N instancias de `SESSION` distribuidas en el tiempo. Tanto `SESSION` como `PROGRAM` **pueden** (no deben) tener `gamification_bindings` hacia acciones `movement`/`adherence.movement` — la relación es opcional y explícita, nunca implícita.

---

## E. FITT-VP MODEL

FITT-VP (ACSM GETP 11ª ed.) estructurado por nivel de entidad — no todos los campos aplican a todas las entidades ni a todos los ejercicios:

| Componente | Definición ACSM | A nivel EXERCISE/VARIANT | A nivel SESSION | A nivel PROGRAM |
|---|---|---|---|---|
| **Frequency** | Sesiones por semana | No aplica (propiedad de sesión/programa) | No aplica directamente | `sessions_per_week` |
| **Intensity** | Cuán duro se ejecuta | `default_intensity_hint` (opcional, orientativo) | `target_intensity` (RPE 0–10 / RIR / %1RM / %HRR / METs — el que corresponda al dominio) | `intensity_progression_curve` (cómo evoluciona la intensidad objetivo a lo largo del programa) |
| **Time** | Duración | `typical_duration_range` (si aplica, p.ej. plancha) | `session_duration_min` | `program_duration_weeks` |
| **Type** | Modalidad | `domain` + `movement_pattern` (fijo por ejercicio) | `session_focus` (qué dominios cubre la sesión) | `program_goal` (objetivo, acotado a lo que la evidencia soporta — nunca una promesa clínica no respaldada) |
| **Volume** | Dosis total | No aplica a nivel ejercicio aislado | `sets` × `reps` (fuerza) o `total_duration` (cardio) por ejercicio dentro de la sesión; `session_volume_load` agregado | `weekly_volume_target` |
| **Progression** | Tasa de incremento de F/I/T/V | `progression_stage` (posición ordinal en cadena de variantes) | No aplica directamente | `progression_rules` (cómo y cuándo sube F/I/T/V entre sesiones/semanas) |

Campos de series/reps/duración/descanso/carga/RPE/RIR/intensidad relativa se representan **a nivel de instancia de ejercicio dentro de una sesión**, nunca como propiedad fija del `EXERCISE` — porque el mismo ejercicio puede prescribirse con distinta dosis según el usuario, el programa o el día. El `EXERCISE`/`EXERCISE_VARIANT` solo lleva *rangos orientativos* (`typical_reps_range`, `typical_load_hint`), nunca valores prescriptivos fijos.

Escalas de esfuerzo soportadas explícitamente (sección B.2): Borg RPE 6–20 (esfuerzo aeróbico global), Borg CR-10 0–10 (esfuerzo localizado/fuerza), RIR 0–10 (fuerza, reps en reserva). El campo `intensity` debe declarar qué escala usa (`scale: "BORG_6_20" | "BORG_CR10" | "RIR_0_10" | "PERCENT_1RM" | "PERCENT_HRR" | "METS"`) — nunca un número sin escala declarada.

---

## F. DIFFICULTY / CAPACITY / INTENSITY MODEL

Se evaluaron los 5 ejes candidatos (`exercise_difficulty`, `functional_requirement`, `technical_complexity`, `training_intensity`, `progression_stage`) contra la evidencia (Kraemer/Ratamess 2002/2009, NASM OPT, RIR/RPE) y se decide **no adoptar los 5 como ejes independientes** — `exercise_difficulty` como escalar único es en la práctica una conflación de los otros tres y genera dimensionalidad redundante. Propuesta: **4 ejes**, cada uno con una fuente que lo respalda:

1. **`technical_complexity`** (propiedad fija del `EXERCISE`/`EXERCISE_VARIANT`): demanda de coordinación/estabilidad para ejecutar el movimiento con seguridad. Respaldado por el modelo NASM OPT (fases de estabilidad→fuerza→potencia) y por Kraemer/Ratamess (mono- vs multiarticular).
2. **`functional_requirement`** (propiedad fija del `EXERCISE`/`EXERCISE_VARIANT`): capacidad física basal necesaria para intentar el ejercicio de forma segura, **independiente** de la complejidad técnica — p.ej. "levantarse del suelo" es técnicamente simple pero tiene alto requisito funcional para una persona frágil. Este eje es el que conecta con elegibilidad clínica (sección G/H), no con dificultad de ejecución.
3. **`training_intensity`** (propiedad de la prescripción, a nivel `SESSION`, no del `EXERCISE`): esfuerzo relativo a la capacidad del usuario en un momento dado (RPE/RIR/%1RM/%HRR). Varía con el usuario y el día — nunca es un atributo fijo del ejercicio. Respaldado por RIR/RPE (Zourdos 2016, Helms 2016).
4. **`progression_stage`** (relación entre `EXERCISE_VARIANT`s de una misma cadena): posición ordinal en una cadena de regresión↔progresión. No es una propiedad aislada de un ejercicio sino una relación entre variantes.

**Regla explícita**: ninguno de estos 4 ejes usa ni referencia Inicial/Bronce/Plata/Oro/Platino. Esos niveles pertenecen exclusivamente al motor de gamificación (`CANONICAL v1.0`) y determinan crédito (DVG), no capacidad física ni dificultad de ejecución — la separación exigida en la sección 3 del encargo queda así estructuralmente garantizada, no solo declarada.

`exercise_difficulty` puede existir como **campo derivado/calculado únicamente para UI** (p.ej. una etiqueta "fácil/media/difícil" calculada a partir de los 3 ejes fijos), marcado explícitamente `DERIVED`, nunca como fuente de verdad ni como filtro de elegibilidad clínica.

---

## G. SAFETY MODEL

### G.1 Taxonomía de estados

Basada en la dicotomía ACC/AHA/ACSM (`ABSOLUTE` vs `RELATIVE` contraindication, sección B.3), extendida con `PRECAUTION`, `ADAPTATION` y `NOT_ASSESSED` (petición explícita de César):

| Estado | Definición operativa |
|---|---|
| `ABSOLUTE_CONTRAINDICATION` | No proceder bajo ninguna circunstancia hasta resolución médica del cuadro (p.ej. angina inestable, insuficiencia cardiaca descompensada, infección aguda con fiebre). |
| `RELATIVE_CONTRAINDICATION` | Proceder solo si el beneficio esperado supera el riesgo, típicamente con supervisión/adaptación y tras valoración médica (p.ej. HTA no controlada, retinopatía proliferativa para ejercicio de alta intensidad). |
| `PRECAUTION` | Proceder con vigilancia/ajuste, sin requerir valoración médica previa obligatoria (p.ej. neuropatía periférica → preferir modalidades sin carga de impacto). |
| `ADAPTATION` | Modificación concreta recomendada para poder realizar la actividad de forma seguIra (p.ej. progresión de carga lenta y supervisada tras disección axilar de ganglios). |
| `NOT_ASSESSED` | No existe regla clínica evaluada para esa combinación ejercicio×perfil. **Regla absoluta**: `NOT_ASSESSED` nunca se convierte silenciosamente en "seguro" ni en `ADAPTATION` — es un estado explícito que bloquea recomendación automática hasta evaluación futura. Mismo principio que `COMPOSITION_UNKNOWN != 0` en Alimentación. |

### G.2 Componentes adicionales

- `medical_clearance_required` (booleano, a nivel de perfil de usuario o de combinación ejercicio×perfil, no fijo por ejercicio): derivado conceptualmente de herramientas de cribado de preparticipación (PAR-Q+, cuestionario conjunto AHA/ACSM) — el diseño de qué preguntas de onboarding alimentan este campo queda fuera de esta fase (ver sección N).
- `stop_criteria`: lista de síntomas que exigen cese inmediato durante la ejecución (dolor torácico, mareo, disnea desproporcionada) — **distinta** de las contraindicaciones (que se evalúan antes de empezar, no durante).
- `not_assessed` como valor por defecto: toda combinación `(exercise_id, clinical_profile_id)` sin regla explícita debe reportar `NOT_ASSESSED`, nunca omitirse silenciosamente del dato.

---

## H. CLINICAL PERSONALIZATION MODEL

No se generan reglas clínicas con valores concretos en esta fase — solo la estructura y el estado de madurez de evidencia por perfil (tabla completa de fuentes en B.4).

Estructura propuesta por perfil clínico:

```
clinical_profile: {
  profile_id,
  evidence_maturity: "STRONG" | "MODERATE" | "LIMITED" | "INSUFFICIENT",
  primary_sources: [ {source_id, classification, year} ],
  contraindication_examples_illustrative: [ ... ],   // ilustrativos, NO reglas aprobadas
  status: "DEFINITION_NOT_PROVIDED_FINAL"            // hasta que César apruebe reglas concretas en fase posterior
}
```

11 perfiles evaluados: adulto sano, obesidad, HTA, DM2, dislipemia, edad avanzada, fragilidad/sarcopenia, menopausia, oncología, renal leve/moderada, inmunosupresión. No se propone ningún perfil adicional — la lista de César cubre razonablemente el espacio de necesidades observado en la evidencia revisada.

**Nota de honestidad explícita** (evita sobreestimar certeza, tal y como se pidió):
- **Dislipemia** no tiene prescripción de ejercicio distintiva en la literatura (ESC/EAS 2019) — se propone que **herede** las reglas de HTA/riesgo CV general en vez de mantener una rama independiente (decisión para César, sección O).
- **Menopausia**: evidencia sólida solo para salud ósea (fuerza + impacto, LIFTMOR 2018 y metaanálisis de 2025); la revisión de revisiones de 2024 (BMC Women's Health) concluye explícitamente que la evidencia es **insuficiente** para recomendar una forma de ejercicio específica para síntomas vasomotores/psicológicos. Cualquier contenido de personalización debe reflejar esa incertidumbre, no ocultarla.
- **Inmunosupresión**: no existe guía ni consenso multidisciplinar formal equivalente al de fragilidad/sarcopenia u oncología; la literatura disponible es de trasplante de órgano sólido específicamente, no de inmunosupresión por biológicos/DMARD. Se recomienda diseñar este perfil de forma conservadora (remisión a valoración médica individualizada) en vez de codificar umbrales numéricos no respaldados.

---

## I. EQUIPMENT / CONTEXT MODEL

No existe una taxonomía científica de equipamiento — la literatura consultada (sección B) no incluye una fuente `GUIDELINE`/`CONSENSUS` para esto; la clasificación de la industria (bodyweight/bandas/mancuernas/máquinas/pesas libres, hogar/gimnasio/exterior) es convención de producto, no ciencia. Se documenta así explícitamente para no atribuirle falsa autoridad científica.

Propuesta: `equipment` y `context` como **vocabularios controlados (tags)**, no como entidades con registro propio — mismo patrón metodológico que la normalización de alérgenos en Alimentación (vocabulario cerrado + estado explícito), pero aquí sin base científica que citar, solo utilidad de filtrado de producto. Si en el futuro se necesita un catálogo de equipamiento específico de gimnasio (p.ej. para escaneo de código de barras), se puede promover a entidad — no es necesario ahora.

---

## J. MULTIMEDIA MODEL

Estructura propuesta por `EXERCISE`/`EXERCISE_VARIANT`, sin generar ningún activo en esta fase:

```
media: {
  image: { status: "NO_SOURCE_PROVIDED", url: null },
  demonstration_video: { status: "NO_SOURCE_PROVIDED", url: null },
  technique_instructions: { status: "NO_SOURCE_PROVIDED", text: null },
  common_errors: { status: "NO_SOURCE_PROVIDED", items: [] },
  safety_cues: { status: "NO_SOURCE_PROVIDED", items: [] }
}
```

Mismo patrón que `educational_content`/`habits_microhabits`/`challenges`/`media` en `NUTRILONGX_ALIMENTACION_MASTER_v1.json`: sección presente estructuralmente, vacía y marcada honestamente, nunca rellenada por inferencia.

---

## K. GAMIFICATION INTEGRATION MODEL

### K.1 Auditoría read-only de `CANONICAL v1.0`

Se auditaron, sin modificar nada, las 30 familias `movement.*` y las 8 familias `adherence.movement.*` del catálogo congelado:

**`movement.*` — 30 familias, por subdominio (recuento verificado programáticamente sobre el JSON):**

| Subdominio legacy congelado | Familias | Fuentes bibliográficas usadas |
|---|---|---|
| `cardio` | 10 | WEN2011, DING2025, PALUCH2021 |
| `strength` | 8 | MOMMA2022 |
| `daily_activity` | 5 | DING2025, PALUCH2021, EKELUND2016, REPLACESED2018 |
| `hiit` | 4 | DING2025, WEN2011 |
| `mobility` | 2 | MBI_DISTRESS2023 |
| `fall_prevention` | 1 | DING2025 |

**Nota de observación (no modifica el documento FROZEN)**: la tabla de la sección 5 de `NUTRILONGX_LEGACY_MAPPING_REPORT_v1.md` reporta para `movement` los recuentos "strength (8), cardio (6), hiit (4), mobility (2), daily_activity (4), fall_prevention (1)" — suman 25, no 30. El recuento verificado en esta auditoría (arriba) suma correctamente 30. Se deja constancia de esta discrepancia como observación para una futura corrección editorial de esa tabla descriptiva — **no se ha tocado el archivo FROZEN**, solo se señala.

**`adherence.movement.*` — 8 familias:** transporte activo, pausa caminando en llamadas, levántate cada N min de pantalla, pausa de movilidad, plan semanal de entreno, repartir MVPA, reunión de pie/andar, escaleras siempre — todas ya clasificadas correctamente como hábito transversal de adherencia, no como contenido de entrenamiento estructurado, consistente con la nota de nomenclatura ya existente en el Legacy Mapping Report (`adherence` ≠ pantalla "Rutinas").

### K.2 Relación conceptual propuesta (sin generar bindings todavía)

Se reutiliza metodológicamente — no se copia mecánicamente — el marco `Binding Semantics v1.0` ya aprobado en la Fase 1B de Alimentación: `supports` / `candidate` / `contextual_opposite` / `unmapped` / `direct`. Aplicado aquí:

- `EXERCISE`/`SESSION`/`PROGRAM` son entidades de **contenido**; `movement.*`/`adherence.movement.*` son entidades de **comportamiento gamificado**. Un `SESSION` de fuerza full-body podría tener un binding `candidate` o `supports` hacia `movement.strength.sesion_de_fuerza_full_body_min`, pero esa vinculación **no se genera en esta fase**.
- **Regla explícita a ratificar (no asumida silenciosamente)**: visualizar o completar una `SESSION`/`PROGRAM` **no debe** generar DVG automáticamente. Solo lo haría si en una fase posterior se diseña explícitamente esa lógica (equivalente al futuro `action_logs`, que hoy no existe en Supabase — confirmado en la Auditoría Fase 0: solo existen 6 tablas: `content_pieces`, `infografias`, `retos_insignia`, `subpilar_mapeo`, `video_bloques`, `videos`).

---

## L. PROPOSED MASTER SCHEMA (conceptual — NO generado)

Esquema conceptual futuro de `NUTRILONGX_EJERCICIO_MASTER_v1.json`, propuesto y sujeto a modificación en la revisión de gobernanza — no es un esquema aprobado como el de Alimentación:

```
{
  schema, version, generated_at, status,
  source_lineage: { scientific_sources: [...] },        // tabla B, con classification/year/finding
  taxonomy_reference: { domains: [...], attributes: [...], open_questions: [...] },  // sección C
  exercise_library: [],           // NO poblado en esta fase
  exercise_variants: [],          // NO poblado
  sessions: [],                   // NO poblado (plantillas, no historial de usuario)
  programs: [],                   // NO poblado
  equipment_vocabulary: { status: "PRODUCT_CONVENTION_NOT_SCIENTIFIC", items: [] },
  media: { status: "NO_SOURCE_PROVIDED" },               // ver sección J
  safety_model_reference: { states: [...], stop_criteria_vocabulary: [] },   // sección G
  clinical_profiles_reference: [ ... 11 perfiles, status DEFINITION_NOT_PROVIDED_FINAL ... ],  // sección H
  gamification_bindings_reference: { version, types: [...], dvg_note: "no binding generates DVG automatically" },
  fitt_vp_field_reference: { ... },   // sección E, definiciones de campo reutilizables
  provenance,
  disclaimer
}
```

No se aceptó automáticamente la estructura sugerida por César en el encargo (`exercise_library, exercise_variants, sessions, programs, clinical_rules, safety_rules, equipment, media, gamification_bindings, sources, provenance`) — se ha renombrado `clinical_rules`→`clinical_profiles_reference` y `safety_rules`→`safety_model_reference` (para reflejar que en esta fase son *estructura y estado de madurez*, no reglas con valores) y se han añadido `taxonomy_reference` y `fitt_vp_field_reference` como secciones explícitas, dado que la taxonomía y el modelo FITT-VP son decisiones de arquitectura tan centrales como las clínicas y merecen su propio espacio versionable.

---

## M. APP CONSUMPTION MODEL (sin frontend)

| Pantalla | Entidades que consumiría | Dependencias no resueltas |
|---|---|---|
| **RUTINAS** (= ejercicio estructurado, explícitamente distinto del antiguo pilar "Rutinas" legacy — misma precisión ya aplicada en el Legacy Mapping Report) | `PROGRAM`, `SESSION`, `EXERCISE`/`EXERCISE_VARIANT` (vía sesión), `safety_model_reference` (para filtrado por perfil) | Ninguna tabla Supabase existe todavía para estas entidades. |
| **RETOS** | Posiblemente `PROGRAM`/`SESSION` + `gamification_bindings_reference` (`candidate`/`supports`) | No hay fuente de "retos" de ejercicio específica — mismo estado `NO_SOURCE_PROVIDED` que en Alimentación; no confundir con `retos_insignia` (tabla Supabase ya existente, de otro dominio). |
| **ESTADÍSTICAS** | Historial de `SESSION`/`PROGRAM` completados, progresión de capacidad si se decide trackear | Depende de una futura tabla equivalente a `action_logs`/historial de ejercicio, hoy inexistente. |
| **DASHBOARD** | Agregación cruzada de `EJERCICIO_MASTER` (futuro) + `NUTRILONGX_ALIMENTACION_MASTER_v1.json` (ya construido) + motor de gamificación `CANONICAL v1.0` | Ningún esquema de agregación cross-pilar existe todavía — no se diseña aquí, solo se señala el punto de unión. |

---

## N. GAPS

1. No existe fuente/catálogo legacy de ejercicios individuales — el mayor bloqueo real para Fase 2 (ver decisión #11 en O).
2. Evidencia para menopausia (síntomas, no salud ósea) e inmunosupresión (no-trasplante) es limitada/insuficiente — documentado honestamente en H, no resuelto.
3. Distinción científica mobility vs flexibility no confirmada con fuente `GUIDELINE`/`CONSENSUS` en esta pasada de investigación.
4. Discrepancia entre la taxonomía científica propuesta (HIIT/mobility/fall_prevention como atributos, no dominios) y la agrupación ya congelada en `CANONICAL v1.0` (los trata como subdominios independientes) — no resuelta, ver O.
5. No se han revisado wireframes/diseños reales de las pantallas Rutinas/Retos/Estadísticas/Dashboard — el modelo de consumo (sección M) es inferido de los nombres dados, no validado contra diseño de producto.
6. No existen tablas Supabase para `exercise`/`session`/`program`/historial — fuera de alcance de esta fase (sin SQL), pero es una dependencia de construcción futura.
7. No se ha diseñado qué preguntas de onboarding alimentan `medical_clearance_required` ni los perfiles clínicos del usuario — depende de decisiones de producto no tomadas aún.
8. Varias fuentes secundarias (PMC/PubMed) devolvieron bloqueos de acceso (CAPTCHA/robots) durante la investigación; donde ocurrió, se marcó explícitamente como hallazgo no re-verificado en texto completo (ver informes de los agentes de investigación) — no afecta a las fuentes `GUIDELINE` primarias citadas (WHO, ACSM, KDIGO, ADA, EWGSOP2, ASCO), que sí se confirmaron.

---

## O. DECISIONS REQUIRED FROM CÉSAR

1. ¿Se adopta la taxonomía de 4 dominios científicos (`CARDIORESPIRATORY`/`RESISTANCE`/`FLEXIBILITY`/`NEUROMOTOR`) + 1 constructo conductual (`SEDENTARY_BEHAVIOUR_INTERRUPTION`) como agrupación de primer nivel de `EJERCICIO_MASTER`?
2. **HIIT**: ¿modelar como atributo `training_format` (recomendado, científicamente correcto) o mantener como dominio independiente (compatible con `CANONICAL v1.0`)?
3. **Mobility**: ¿fusionar en `FLEXIBILITY` como atributo (recomendado con reserva por gap de evidencia) o mantener independiente (compatible con legacy)?
4. **Fall prevention**: ¿modelar como objetivo/tag dentro de `NEUROMOTOR` (recomendado) o mantener como dominio independiente (compatible con legacy)?
5. **Functional training**: ¿modelar como atributo `movement_pattern` (recomendado, respaldado por Ide 2022 y Pereira 2025) en vez de dominio independiente?
6. ¿Se aprueban los 4 ejes de dificultad/capacidad (`technical_complexity`, `functional_requirement`, `training_intensity`, `progression_stage`) y se descarta un escalar único `exercise_difficulty` como fuente de verdad (permitiéndolo solo como campo `DERIVED` de UI)?
7. ¿Se aprueba el enum de seguridad de 5 estados con `NOT_ASSESSED` como default obligatorio (nunca "seguro" implícito)?
8. **Dislipemia**: ¿hereda las reglas de HTA/riesgo CV general en vez de mantener rama clínica independiente (recomendado, sin evidencia distintiva encontrada)?
9. **Menopausia e inmunosupresión**: ¿se procede con estas dos con etiqueta de madurez `LIMITED`/`INSUFFICIENT` y framing explícito de incertidumbre, en vez de posponer el perfil por completo?
10. **Equipamiento/contexto**: ¿quién posee y aprueba el vocabulario controlado — César, o un futuro equipo de producto? (No es una decisión científica, es de producto.)
11. **La decisión más bloqueante**: no existe fuente legacy para poblar `exercise_library`. ¿Cómo se construye el catálogo inicial — lista proporcionada por César, contenido semilla generado con asistencia de IA pero con atribución explícita de fuente científica y `review_flags` por ejercicio, o una base de datos de terceros con licencia? Esta decisión determina si la Fase 3 es "reconciliación" o "construcción desde cero citada".
12. ¿Se confirma la reutilización de `Binding Semantics v1.0` (supports/candidate/contextual_opposite/unmapped/direct) de Alimentación para Ejercicio, o se define una semántica de binding específica de movimiento?
13. ¿Se ratifica formalmente que completar/visualizar una `SESSION`/`PROGRAM` nunca genera DVG automáticamente salvo diseño explícito futuro? (Restableciendo como decisión de gobernanza la regla que César ya declaró en el encargo, para que quede documentada igual que las demás.)

---

## P. RECOMMENDED PHASE 2

1. Revisión de gobernanza de este documento — resolución de las 13 decisiones de la sección O.
2. Si se aprueba, construir `NUTRILONGX_EJERCICIO_MASTER_SCHEMA_v1.md` (esquema JSON final aprobado, mismo patrón que el de Alimentación) — todavía sin datos.
3. Resolver la decisión #11 (fuente del catálogo de ejercicios) — determina si la fase siguiente es reconciliación o construcción citada.
4. Investigación de seguimiento específica, solo si César la solicita: distinción mobility vs flexibility, literatura actualizada de ejercicio y síntomas de menopausia, inmunosupresión no-trasplante (biológicos/DMARD).
5. Solo tras aprobar esquema + decisión de fuente: construir `NUTRILONGX_EJERCICIO_MASTER_v1.json` con la misma disciplina de QA-como-código aplicada en Alimentación (batería de validaciones automatizadas antes de declarar el build válido).

---

## FINAL STATUS

```
READY_FOR_GOVERNANCE_REVIEW
```

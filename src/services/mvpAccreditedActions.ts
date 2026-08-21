/**
 * mvpAccreditedActions.ts — PLAYABLE MVP UI INTEGRATION.
 *
 * Espejo EXACTO de la tabla "§2.1" de
 * nutrilongx/governance/implementation/PLAYABLE_MVP_BACKEND_HANDOFF_v1.md
 * (las 11 reglas de acreditación MVP activas hoy en el backend real).
 * No es una fuente independiente: si el backend añade/quita reglas, este
 * fichero debe actualizarse a mano contra ese handoff, nunca al revés.
 *
 * Por qué existe (en vez de descubrir esto dinámicamente): no hay
 * ninguna función `actions.*` en el contrato que devuelva "qué acciones
 * tienen regla de acreditación activa" — `actions.list` devuelve las 119
 * familias canónicas sin distinguir cuáles son acreditables hoy, y el
 * Dashboard no debe reproducir la lógica de resolución de reglas
 * (§3 del encargo: "no reproducir reglas de acreditación"). Por eso el
 * único origen honesto de esta lista es el propio handoff, citado
 * literalmente.
 *
 * `content_action_bindings` real hoy solo cubre `recipe`/`nutrition`, y
 * de esas solo NLX-007 tiene un binding sin ambigüedad — por eso
 * `batch_cooking` es la única acción con `resolution.type: 'content'`;
 * las otras 10 usan `resolution.type: 'entity'`
 * (`source_entity_type: 'canonical_action'`), que es la vía activada en
 * MVP Accreditation Pack v1 para acciones sin contenido asignado.
 */

export type Pillar = 'nutrition' | 'exercise' | 'sleep' | 'stress' | 'conscious_wellbeing';

export type MvpEvidenceResolution =
  | { type: 'content'; content_type: 'recipe' | 'exercise' | 'exercise_variant' | 'mind_content'; canonical_id: string }
  | { type: 'entity' };

export interface MvpAccreditedAction {
  canonical_action_id: string;
  pillar: Pillar;
  /** Etiqueta legible en español -- no viene del backend (los canonical_action_id son slugs técnicos). */
  label: string;
  resolution: MvpEvidenceResolution;
  /** Campo de evidencia que exige la regla. */
  field: 'duration_minutes' | 'quantity';
  /** Unidad mostrada junto al campo (solo relevante para field: 'quantity'). */
  unit?: string;
  /** Umbral exacto citado en el handoff -- se usa como valor por defecto del input, editable por el profesional. */
  threshold: number;
  /** Texto de condición citado en el handoff, para mostrar como ayuda. */
  conditionHint: string;
}

export const MVP_ACCREDITED_ACTIONS: MvpAccreditedAction[] = [
  {
    canonical_action_id: 'adherence.nutrition.batch_cooking_saludable_h_sem',
    pillar: 'nutrition',
    label: 'Batch cooking saludable',
    resolution: { type: 'content', content_type: 'recipe', canonical_id: 'NLX-007' },
    field: 'duration_minutes',
    threshold: 120,
    conditionHint: 'Al menos 120 min (2 h/sem)',
  },
  {
    canonical_action_id: 'nutrition.hydration.agua_l_dia',
    pillar: 'nutrition',
    label: 'Agua al día',
    resolution: { type: 'entity' },
    field: 'quantity',
    unit: 'litros',
    threshold: 2.5,
    conditionHint: 'Al menos 2.5 L',
  },
  {
    canonical_action_id: 'nutrition.mediterranean_pattern.fruta_entera_pieza_s',
    pillar: 'nutrition',
    label: 'Fruta entera',
    resolution: { type: 'entity' },
    field: 'quantity',
    unit: 'piezas',
    threshold: 1,
    conditionHint: 'Al menos 1 pieza',
  },
  {
    canonical_action_id: 'movement.cardio.caminata_vigorosa_min',
    pillar: 'exercise',
    label: 'Caminata vigorosa',
    resolution: { type: 'entity' },
    field: 'duration_minutes',
    threshold: 18,
    conditionHint: 'Al menos 18 min',
  },
  {
    canonical_action_id: 'movement.mobility.yoga_fluido_min',
    pillar: 'exercise',
    label: 'Yoga fluido',
    resolution: { type: 'entity' },
    field: 'duration_minutes',
    threshold: 11,
    conditionHint: 'Al menos 11 min',
  },
  {
    canonical_action_id: 'mind.sleep.cierre_digital_min_antes_de_dormir',
    pillar: 'sleep',
    label: 'Cierre digital antes de dormir',
    resolution: { type: 'entity' },
    field: 'duration_minutes',
    threshold: 60,
    conditionHint: 'Al menos 60 min sin pantallas',
  },
  {
    canonical_action_id: 'mind.sleep.tiempo_en_cama_h',
    pillar: 'sleep',
    label: 'Tiempo en cama',
    resolution: { type: 'entity' },
    field: 'duration_minutes',
    threshold: 480,
    conditionHint: 'Entre 7 y 9 h (420–540 min)',
  },
  {
    canonical_action_id: 'mind.stress.musica_relajante_min',
    pillar: 'stress',
    label: 'Música relajante',
    resolution: { type: 'entity' },
    field: 'duration_minutes',
    threshold: 10,
    conditionHint: 'Al menos 10 min',
  },
  {
    canonical_action_id: 'mind.stress.respiracion_durante_min',
    pillar: 'stress',
    label: 'Respiración consciente',
    resolution: { type: 'entity' },
    field: 'duration_minutes',
    threshold: 3,
    conditionHint: 'Al menos 3 min',
  },
  {
    canonical_action_id: 'mind.emotional_wellbeing.meditacion_mindfulness_min',
    pillar: 'conscious_wellbeing',
    label: 'Meditación mindfulness',
    resolution: { type: 'entity' },
    field: 'duration_minutes',
    threshold: 15,
    conditionHint: 'Al menos 15 min',
  },
  {
    canonical_action_id: 'mind.emotional_wellbeing.mindful_walk_min_sin_movil',
    pillar: 'conscious_wellbeing',
    label: 'Paseo consciente sin móvil',
    resolution: { type: 'entity' },
    field: 'duration_minutes',
    threshold: 10,
    conditionHint: 'Al menos 10 min',
  },
];

export const MVP_PILLARS: { key: Pillar; label: string; emoji: string }[] = [
  { key: 'nutrition', label: 'Alimentación', emoji: '🥗' },
  { key: 'exercise', label: 'Ejercicio', emoji: '🏃' },
  { key: 'sleep', label: 'Sueño', emoji: '😴' },
  { key: 'stress', label: 'Estrés', emoji: '🧘' },
  { key: 'conscious_wellbeing', label: 'Bienestar consciente', emoji: '🌱' },
];

export function actionsForPillar(pillar: Pillar): MvpAccreditedAction[] {
  return MVP_ACCREDITED_ACTIONS.filter((a) => a.pillar === pillar);
}

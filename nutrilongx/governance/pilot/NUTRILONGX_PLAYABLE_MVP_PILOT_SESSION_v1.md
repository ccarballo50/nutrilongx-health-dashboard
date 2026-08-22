# NUTRILONGX — Playable MVP Pilot Session v1

Plantilla breve. Una copia de la sección "Registro" por cada
participante — copiar el bloque de abajo en
`NUTRILONGX_PLAYABLE_MVP_PILOT_FEEDBACK_LOG_v1.md` y rellenarlo durante o
inmediatamente después de la sesión. Ejecutar el guion de
`NUTRILONGX_PLAYABLE_MVP_PILOT_CHECKLIST_v1.md` sección B mientras se
observa.

**No recoger más datos personales de los necesarios** (encargo sección
5): usar siempre el `pilot_id` pseudónimo (`PILOT-01`..`PILOT-05`, ver
`NUTRILONGX_PLAYABLE_MVP_PILOT_ONBOARDING_v1.md`), nunca el nombre real
en este documento.

---

## Registro (copiar por participante)

```yaml
pilot_id: PILOT-0X
fecha: YYYY-MM-DD
tipo_de_usuario: profesional | cliente_final   # quién operó el Dashboard en esta sesión

flujo_completado: si | no
tiempo_happy_path_aprox: "X min"   # desde seleccionar cliente hasta ver el DVG actualizado

bloqueos:
  - ""   # qué impidió avanzar, si algo lo hizo

errores:
  - codigo: ""        # error.code si fue visible
    pantalla: ""
    contexto: ""

confusiones:
  - ""   # dónde dudó, qué esperaba que pasara y no pasó

comentarios_espontaneos:
  - ""   # frases textuales, positivas y negativas

acciones_que_esperaba_encontrar:
  - ""   # funcionalidad que el participante buscó y no existe hoy

acciones_no_entendidas:
  - ""   # de las 11 acciones MVP, cuál etiqueta/condición no se entendió a la primera

percepcion_dvg:
  entendio_que_es: si | no | parcial
  comentario: ""

incidencias:
  - severidad: P0 | P1 | P2 | P3   # ver modelo en el feedback log
    descripcion: ""
    reproducible: si | no
```

---

## Notas de ejecución

- Rellenar en el momento si es posible; si no, inmediatamente después
  (memoria fresca > detalle perfecto más tarde).
- `tipo_de_usuario` existe porque el MVP actual es "professional first"
  (encargo PLAYABLE MVP UI INTEGRATION sección 12) — puede que en
  algunas sesiones sea el profesional quien opera el Dashboard en
  nombre del cliente, y en otras el propio cliente si el piloto lo
  permite. Anotarlo siempre, es relevante para interpretar el resto de
  campos.
- Una incidencia con severidad `P0`/`P1` (ver
  `NUTRILONGX_PLAYABLE_MVP_PILOT_FEEDBACK_LOG_v1.md`) debe comunicarse
  de inmediato al equipo técnico, no esperar a que termine el piloto
  completo.

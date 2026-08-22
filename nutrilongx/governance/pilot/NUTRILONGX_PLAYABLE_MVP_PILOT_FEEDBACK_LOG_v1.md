# NUTRILONGX — Playable MVP Pilot Feedback Log v1

Registro estructurado del piloto (3–5 usuarios). **Inicialmente vacío**
— se rellena sesión a sesión durante el piloto real, copiando el bloque
"Registro" de `NUTRILONGX_PLAYABLE_MVP_PILOT_SESSION_v1.md` por
participante en la sección "Sesiones" de abajo.

No se construye ningún analytics nuevo para esto (Mixpanel/Amplitude/
similar) — fuente de datos: `audit_log` real + observación manual +
este documento.

---

## Modelo de severidad

| Nivel | Definición | Durante feature freeze |
|---|---|---|
| **P0** | Seguridad, pérdida de datos, o el happy path es imposible de completar | Puede justificar un cambio inmediato, saltándose el freeze |
| **P1** | El happy path queda bloqueado para una parte de los usuarios (no todos) | Puede justificar un cambio inmediato, saltándose el freeze |
| **P2** | Fricción importante pero existe un workaround disponible | Backlog — no se toca hasta terminar el piloto |
| **P3** | Mejora o detalle no bloqueante | Backlog — no se toca hasta terminar el piloto |

Un `P0`/`P1` detectado durante una sesión se comunica de inmediato, no
se espera al cierre del piloto para decidir si actuar.

---

## Sesiones

_(vacío — pegar aquí un bloque `Registro` por cada sesión ejecutada,
usando la plantilla de `NUTRILONGX_PLAYABLE_MVP_PILOT_SESSION_v1.md`)_

---

## Incidencias consolidadas

_(vacío — al final del piloto, consolidar aquí todas las incidencias
`incidencias:` de las sesiones anteriores, una fila por incidencia
única, agrupando duplicados de distintos participantes)_

| # | pilot_id(s) | severidad | descripción | reproducible | estado |
|---|---|---|---|---|---|
| | | | | | |

---

## Cierre del piloto — Pilot Decision Gate

Rellenar únicamente al terminar las sesiones de los 3–5 participantes.
Criterios definidos en
`NUTRILONGX_PLAYABLE_MVP_PILOT_CHECKLIST_v1.md` sección E.

```yaml
pilot_closure:
  sessions_completed: 0   # de 3-5
  happy_path_completion_rate: ""   # X de Y participantes
  p0_count: 0
  p1_count: 0
  p1_recurrent: null   # si/no -- mismo P1 en >1 participante
  dvg_progress_understood: null   # mayoritariamente si/no/parcial (ver percepcion_dvg de cada sesión)
  professional_operation_viable: null   # si/no, según observación

  result: null   # PILOT_PASS | PILOT_PASS_WITH_FIXES | PILOT_BLOCKED
  rationale: ""
```

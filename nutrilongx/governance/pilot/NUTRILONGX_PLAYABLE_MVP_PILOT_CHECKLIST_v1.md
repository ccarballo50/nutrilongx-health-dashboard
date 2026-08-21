# NUTRILONGX — Playable MVP Pilot Checklist v1

Corto y operativo. Para usar antes/durante cada sesión piloto (3–5
usuarios iniciales, PLAYABLE_MVP_FROZEN_FOR_PILOT). No es documentación
técnica — esa vive en
`nutrilongx/governance/implementation/NUTRILONGX_PLAYABLE_MVP_UI_IMPLEMENTATION_REPORT_v1.md`
y `PLAYABLE_MVP_BACKEND_HANDOFF_v1.md`.

---

## A. Antes del piloto

- [ ] El profesional puede entrar al Dashboard (`/admin/clients`).
- [ ] Existe al menos 1 cliente de prueba/piloto real creado (`clients.create`).
- [ ] Ese cliente tiene perfil básico (`clients.getProfile` no vacío, o
      aceptable "Perfil no completado" si el piloto no lo requiere).
- [ ] Hay contenido publicado asignable en los 5 pilares (`ContentCatalog`
      muestra al menos 1 ítem por pestaña).
- [ ] `/admin/clients/:id/today` carga sin error para ese cliente.
- [ ] Se ha verificado en real (no solo en local) que:
  - `evidence.register` crea una fila real.
  - `actions.accreditAndCalculate` produce `validated` para al menos 1
    de las 11 acciones MVP.
  - El DVG resultante es un número > 0, no un placeholder.
  - `progress.get` refleja ese DVG inmediatamente después.
- [ ] `audit_log` tiene entradas correlacionadas por `request_id` para
      las acciones anteriores (verificable vía Supabase, no expuesto en
      el Dashboard).
- [ ] Ningún secreto (`DASHBOARD_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
      aparece en el bundle del navegador ni en ningún commit.

## B. Happy path (guion de la sesión)

1. Seleccionar el cliente piloto en `/admin/clients`.
2. Abrir su ficha (`ClientDetail`) y asignar 1 contenido (`Asignar
   contenido` → elegir pilar → `Asignar`).
3. Confirmar que la asignación aparece en "Asignaciones actuales".
4. Abrir "HOY" (`Ver HOY — marcar actividades y DVG`).
5. Elegir una de las 11 acciones MVP, ajustar el valor si hace falta, y
   pulsar `✓ HECHO`.
6. Confirmar el feedback mostrado (`+ X h de vida ganada` si validated).
7. Confirmar que el bloque "Vida ganada" se actualiza sin recargar la
   página.
8. Confirmar que el desglose por pilar cambia en el pilar correcto.

## C. Casos de fallo a observar deliberadamente

- [ ] **Doble click** en `✓ HECHO`: no debe crear una segunda fila ni
      duplicar el DVG (botón debe quedar deshabilitado mientras está en
      vuelo).
- [ ] **Acción `pending`**: marcar hecho una acción de las 119 que no
      esté en las 11 con regla MVP (si el piloto lo permite) — debe
      mostrar "Actividad registrada. Pendiente de validación.", nunca un
      error rojo.
- [ ] **Acción `rejected`**: introducir un valor por debajo del umbral —
      debe mostrar el mensaje neutral de no acreditación, nunca "+X h".
- [ ] **Error de backend** (desconectar red, o forzar un fallo): debe
      verse un mensaje genérico, nunca un código técnico crudo ni un
      stack trace.
- [ ] **Cliente sin progreso todavía**: `progress.get` de un cliente
      recién creado debe mostrar `0.0 h` y 0 en todos los pilares, nunca
      un error ni una pantalla en blanco.
- [ ] **Contenido ya asignado**: reasignar el mismo contenido debe
      mostrar "Ya estaba asignado", nunca duplicar la fila.

## D. Datos a recoger durante el piloto

Usar notas estructuradas (no analytics — ver más abajo). Para cada
sesión, registrar:

- **Errores técnicos observados**: código (`error.code` si es visible),
  pantalla, qué se estaba haciendo.
- **Clicks/confusión**: dónde dudó el usuario, qué esperaba que pasara y
  no pasó.
- **Acciones no entendidas**: qué etiqueta/condición de las 11 acciones
  MVP no se entendió a la primera.
- **Feedback cualitativo**: frases textuales del usuario, positivas y
  negativas.
- **Fricciones**: pasos que se sintieron largos, repetitivos o
  innecesarios.
- **Bugs**: cualquier comportamiento que contradiga esta checklist.
- **Requests de features**: qué pidió el usuario que hoy no existe (p.
  ej. niveles, badges, historial visual) — anotar sin prometer fecha.

---

## No analytics complejos

Para este piloto inicial **no** se instala Mixpanel/Amplitude/similar.
Fuente de datos: `audit_log` (backend real, ya persistido, correlacionado
por `request_id`) + observación manual + estas notas estructuradas. Si el
piloto demuestra que se necesita telemetría de producto, es una decisión
explícita de una fase posterior, no una construcción automática de esta.

## Escala del piloto

Diseñado y verificado para **3–5 usuarios iniciales** operando sobre
clientes de prueba. No se ha optimizado (caching, rate limiting,
paginación real, chunking del bundle) para 100 usuarios — eso queda
fuera de alcance hasta que el piloto lo justifique.

# NUTRILONGX — Playable MVP Pilot Onboarding v1

Procedimiento para dar de alta a los 3–5 participantes reales del
piloto. **No usar los clientes de prueba técnicos** (`NLX-TEST-2A-001` y
similares, usados en las verificaciones live de fases anteriores) como
pacientes piloto — son fixtures de desarrollo, no participantes reales.

---

## Gap operativo (documentado, no oculto)

El Dashboard hoy **no tiene una pantalla "Crear cliente"**.
`clientsApi.create()`/`clients.create` existen y están verificados en
real desde Fase 2A, pero ninguna pantalla los invoca todavía —
`ClientsList.tsx` es de solo lectura.

Durante **feature freeze** (`PLAYABLE MVP PILOT OPERATIONS v1`, sección
9: "no nuevas pantallas") no se construye esa pantalla ahora. El
procedimiento de alta para este piloto usa en su lugar
`scripts/nutrilongx/onboard_pilot_client.mjs`: un script operativo que
llama exactamente a la misma función de negocio (`clients.create`) a
través del mismo proxy real (`api/apps-script.ts`) que una pantalla
futura llamaría — mismas validaciones, misma idempotencia, mismo
`audit_log`. **No es SQL manual, no es acceso directo a Supabase.**

Si el piloto confirma que se necesita una pantalla real de alta, es una
decisión explícita de una fase posterior (post-feature-freeze), no una
construcción automática de esta.

---

## Procedimiento (por cada participante)

1. Obtener el consentimiento del participante para tratar sus datos
   mínimos (nombre; email/teléfono son opcionales — no recoger más de lo
   necesario, encargo sección 5).
2. Asignar un `external_code` pseudónimo y no reutilizado, formato
   sugerido: `PILOT-01`, `PILOT-02`, … `PILOT-05`. Este código (no el
   nombre) es el identificador que se usa en el resto de la
   documentación del piloto (plantilla de sesión, log de feedback).
3. Ejecutar (requiere `DASHBOARD_API_KEY`/`APPS_SCRIPT_WEB_APP_URL`,
   igual que el smoke test):

   ```bash
   APPS_SCRIPT_WEB_APP_URL="..." DASHBOARD_API_KEY="$(cat 'ruta/a/la/clave.txt')" \
     npx tsx scripts/nutrilongx/onboard_pilot_client.mjs \
       --external_code "PILOT-01" \
       --first_name "Nombre real o pseudónimo acordado"
   ```

4. El script imprime `client_id` y los enlaces directos a la ficha
   (`/admin/clients/<id>`) y a "HOY" (`/admin/clients/<id>/today`).
   Guardar `external_code → client_id` en un registro interno del
   equipo (no en este repo, no en texto plano compartido si contiene
   datos identificables).
5. Verificar en el Dashboard (`/admin/clients`) que el participante
   aparece en la lista.
6. Repetir con el siguiente `external_code` hasta completar 3–5
   participantes.
7. (Opcional, recomendado) Completar el perfil básico
   (`clients.getProfile`/`clients.updateProfile`) si el piloto lo
   requiere — ya soportado por `ClientDetail.tsx`, aunque sigue siendo
   de solo lectura en esta pantalla (la edición de perfil no forma parte
   del alcance actual de UI).

## Reintentos seguros

Si el script falla a mitad (red, timeout) y no se está seguro de si el
cliente se creó, **volver a ejecutar exactamente el mismo comando** (con
el mismo `external_code`). `clients.create` deduplica server-side por
`external_code` — un reintento nunca crea un segundo cliente
(`idempotent: true` en la salida si ya existía).

## Al terminar el piloto

Los clientes piloto (`PILOT-01`..`PILOT-05`) se archivan (`status:
archived` vía `clients.update`), igual que se hizo con los fixtures
técnicos de fases anteriores — nunca se borran físicamente
(`audit_log` debe permanecer íntegro).

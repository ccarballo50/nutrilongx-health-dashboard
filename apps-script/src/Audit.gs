/**
 * Audit.gs — NUTRILONGX Apps Script Phase 2A
 *
 * Helper reutilizable para escribir en audit_log
 * (NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1.md seccion 17; encargo
 * seccion 39).
 *
 * `insertFn` se inyecta (por defecto sbInsert, ver SupabaseClient.gs) para
 * que los servicios y sus tests puedan sustituirlo por un fake sin tocar
 * UrlFetchApp/Supabase real.
 *
 * IMPORTANTE (documentado tambien en el implementation report): PostgREST
 * no ofrece transacciones distribuidas entre requests HTTP separados. Si
 * la escritura de negocio (p.ej. clients.create) tiene exito pero el
 * insert de audit_log falla, NO se oculta el problema ni se finge
 * atomicidad inexistente: se lanza NlxDataIntegrityError y se registra en
 * el log interno, dejando constancia de que la operacion de negocio ya se
 * aplico pero su auditoria quedo incompleta.
 */

function writeAudit(entry, insertFn) {
  insertFn = insertFn || sbInsert;
  requireObject(entry, 'auditEntry');
  var row = {
    request_id: entry.requestId,
    actor_type: entry.actorType,
    actor_id: entry.actorId || null,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId || null,
    before_data: entry.beforeData !== undefined ? entry.beforeData : null,
    after_data: entry.afterData !== undefined ? entry.afterData : null,
    metadata: entry.metadata || {}
  };
  try {
    insertFn('audit_log', [row]);
  } catch (e) {
    console.error('audit_log insert failed for action=' + entry.action + ' entity=' + entry.entityType + '/' + entry.entityId + ': ' + (e && e.message));
    throw NlxDataIntegrityError(
      'The operation completed but its audit record could not be written.',
      { action: entry.action, entity_type: entry.entityType }
    );
  }
  return row;
}

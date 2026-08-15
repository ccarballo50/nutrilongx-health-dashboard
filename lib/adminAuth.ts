// lib/adminAuth.ts
//
// Protección mínima viable para los endpoints de administración/escritura.
// No es un sistema de usuarios: es una clave compartida (ADMIN_API_KEY) que
// debe configurarse como variable de entorno en Vercel y que el panel de
// admin debe enviar en la cabecera 'x-admin-key' en cada petición.
//
// Esto NO sustituye una autenticación real de usuarios (Supabase Auth con
// roles) para los endpoints que representan acciones del propio cliente
// (actions/log, profile/upsert, notify/subscribe, achievements/log): esos
// hoy aceptan cualquier 'externalId' sin verificar que quien llama es ese
// usuario (IDOR). Cerrar eso es un cambio más grande —requiere decidir cómo
// se autentica al cliente final— y queda documentado como pendiente aparte;
// no lo resuelve este helper.

export function isAdminAuthorized(providedKey: string | null | undefined): boolean {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) {
    // Si no hay clave configurada en el entorno, denegamos por defecto.
    // Evita que un despliegue sin configurar quede abierto "por accidente".
    return false;
  }
  return !!providedKey && providedKey === expected;
}

// Para endpoints Edge (Request/Response)
export function unauthorizedEdgeResponse(): Response {
  return new Response(JSON.stringify({ error: "No autorizado. Falta o es incorrecta la cabecera x-admin-key." }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

// Para endpoints Node (req/res estilo Vercel)
export function sendUnauthorizedNode(res: any) {
  res.status(401).json({ error: "No autorizado. Falta o es incorrecta la cabecera x-admin-key." });
}

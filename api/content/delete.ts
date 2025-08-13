export const config = { runtime: 'edge' };

import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const { id } = await req.json();
    if (!id) return new Response('Missing id', { status: 400 });

    const supa = supabaseAdmin();
    // Borrar medias primero (por FK también se borrarían, pero así controlamos errores)
    await supa.from('content_media').delete().eq('content_id', id);
    const { error } = await supa.from('content').delete().eq('id', id);
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  } catch (e: any) {
    return new Response(e.message || 'delete failed', { status: 500 });
  }
}

export const config = { runtime: 'edge' };

import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const { externalId, displayName } = await req.json();
    if (!externalId) return new Response('Missing externalId', { status: 400 });

    const supa = supabaseAdmin();
    const { data: up, error } = await supa
      .from('users')
      .upsert(
        { external_id: externalId, display_name: displayName ?? null },
        { onConflict: 'external_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify({ ok: true, user: up }), {
      headers: { 'content-type': 'application/json' }, status: 200
    });
  } catch (e: any) {
    return new Response(e.message || 'profile upsert failed', { status: 500 });
  }
}

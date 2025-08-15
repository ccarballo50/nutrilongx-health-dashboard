// /api/notify/list.ts
export const config = { runtime: 'edge' };
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler(req: Request) {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const externalId = url.searchParams.get('externalId');
  if (!externalId) return new Response('Missing externalId', { status: 400 });

  const supa = supabaseAdmin();

  const { data: user, error: uErr } = await supa
    .from('users')
    .select('id')
    .eq('external_id', externalId)
    .single();

  if (uErr || !user) return new Response(JSON.stringify([]), { headers: { 'content-type': 'application/json' }});

  const { data, error } = await supa
    .from('notification_subscriptions')
    .select('id, channel, address, consent, created_at')
    .eq('user_id', user.id);

  if (error) return new Response(error.message, { status: 500 });

  return new Response(JSON.stringify(data ?? []), { headers: { 'content-type': 'application/json' }});
}

// /api/notify/unsubscribe.ts
export const config = { runtime: 'edge' };
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const { subscriptionId } = await req.json();
  if (!subscriptionId) return new Response('Missing subscriptionId', { status: 400 });

  const supa = supabaseAdmin();
  const { error } = await supa
    .from('notification_subscriptions')
    .update({ consent: false })
    .eq('id', subscriptionId);

  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' }});
}

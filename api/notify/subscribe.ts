// /api/notify/subscribe.ts
export const config = { runtime: 'edge' };
import { supabaseAdmin } from '../../lib/supabaseAdmin';

type Payload = {
  externalId: string;
  email?: { address: string; consent: boolean };
  whatsapp?: { address: string; consent: boolean };
  telegram?: { address: string; consent: boolean };
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const body = (await req.json()) as Payload;
  if (!body?.externalId) return new Response('Missing externalId', { status: 400 });

  const supa = supabaseAdmin();

  // 1) Buscar o crear usuario por external_id
  let { data: user, error: uErr } = await supa
    .from('users')
    .select('id, external_id, display_name')
    .eq('external_id', body.externalId)
    .single();

  if (uErr || !user) {
    const { data, error } = await supa
      .from('users')
      .insert({ external_id: body.externalId, display_name: body.externalId })
      .select('id, external_id, display_name')
      .single();
    if (error) return new Response(error.message, { status: 500 });
    user = data!;
  }

  // 2) Preparar upserts por canal
  const rows: any[] = [];
  (['email', 'whatsapp', 'telegram'] as const).forEach((ch) => {
    const cfg = (body as any)[ch];
    if (cfg?.address) {
      rows.push({
        user_id: user!.id,
        channel: ch,
        address: cfg.address,
        consent: cfg.consent ?? true,
      });
    }
  });

  if (rows.length === 0) {
    return new Response(JSON.stringify({ ok: true, message: 'No channels provided' }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  // 3) Upsert (si tienes UNIQUE(user_id, channel, address), funciona perfecto)
  const { data: subs, error: sErr } = await supa
    .from('notification_subscriptions')
    .upsert(rows, { onConflict: 'user_id,channel,address' })
    .select('*');

  if (sErr) return new Response(sErr.message, { status: 500 });

  return new Response(JSON.stringify({ ok: true, subscriptions: subs }), {
    headers: { 'content-type': 'application/json' },
  });
}

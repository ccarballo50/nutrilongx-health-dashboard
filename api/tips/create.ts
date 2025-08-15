export const config = { runtime: 'edge' };

import { supabaseAdmin } from '../../lib/supabaseAdmin';

type Payload = {
  title: string;
  body: string;
  is_ai?: boolean;
  weight?: number;
  is_active?: boolean;
  start_at?: string | null;
  end_at?: string | null;
  targets?: {
    levels?: number[];
    userExternalIds?: string[];
    tags?: string[];
  }
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const body = (await req.json()) as Payload;
  if (!body?.title || !body?.body) return new Response('Missing title/body', { status: 400 });

  const supa = supabaseAdmin();

  // 1) Crear tip
  const { data: tip, error: terr } = await supa
    .from('tips')
    .insert({
      title: body.title,
      body: body.body,
      is_ai: !!body.is_ai,
      weight: body.weight && body.weight > 0 ? body.weight : 1,
      is_active: body.is_active !== false,
      start_at: body.start_at || null,
      end_at: body.end_at || null
    })
    .select('*')
    .single();

  if (terr || !tip) return new Response(terr?.message || 'create failed', { status: 500 });

  const tipId = tip.id as string;

  // 2) Targets (best-effort; si algo falla, intentamos limpiar)
  try {
    // Niveles (numéricos)
    const levels = (body.targets?.levels || []).filter(n => Number.isFinite(n));
    if (levels.length) {
      const rows = levels.map(n => ({ tip_id: tipId, level: Number(n) }));
      const { error } = await supa.from('tip_targets_level').insert(rows);
      if (error) throw error;
    }

    // Users por externalId
    const extIds = (body.targets?.userExternalIds || []).filter(Boolean);
    if (extIds.length) {
      const { data: users, error: uerr } = await supa
        .from('users')
        .select('id, external_id')
        .in('external_id', extIds as any);
      if (uerr) throw uerr;
      if (users?.length) {
        const rows = users.map(u => ({ tip_id: tipId, user_id: u.id }));
        const { error } = await supa.from('tip_targets_user').insert(rows);
        if (error) throw error;
      }
    }

    // Tags
    const tags = (body.targets?.tags || []).map(t => String(t).toLowerCase().trim()).filter(Boolean);
    if (tags.length) {
      const rows = tags.map(t => ({ tip_id: tipId, tag: t }));
      const { error } = await supa.from('tip_targets_tag').insert(rows);
      if (error) throw error;
    }

  } catch (e: any) {
    // Limpia el tip si algún target falló, para no dejar datos incompletos
    await supa.from('tips').delete().eq('id', tipId);
    return new Response(e?.message || 'targets failed', { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, tipId }), { headers: { 'content-type': 'application/json' }});
}

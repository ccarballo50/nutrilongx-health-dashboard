export const config = { runtime: 'edge' };

import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler(req: Request) {
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  const url = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 50)));

  const supa = supabaseAdmin();

  // 1) Trae tips
  const { data: tips, error: terr } = await supa
    .from('tips')
    .select('id, title, body, is_ai, weight, is_active, start_at, end_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (terr) return new Response(terr.message, { status: 500 });

  if (!tips?.length) {
    return new Response(JSON.stringify([]), { headers: { 'content-type': 'application/json' }});
  }

  const ids = tips.map(t => t.id);

  // 2) Targets en bloque y ensamblado en memoria
  const [lvls, tags, users] = await Promise.all([
    supa.from('tip_targets_level').select('tip_id, level').in('tip_id', ids as any),
    supa.from('tip_targets_tag').select('tip_id, tag').in('tip_id', ids as any),
    supa.from('tip_targets_user')
        .select('tip_id, user_id, users!inner(external_id)')
        .in('tip_id', ids as any)
  ]);

  const L = (lvls.data || []).reduce<Record<string, number[]>>((acc, r: any) => {
    acc[r.tip_id] = acc[r.tip_id] || []; acc[r.tip_id].push(Number(r.level)); return acc;
  }, {});
  const G = (tags.data || []).reduce<Record<string, string[]>>((acc, r: any) => {
    acc[r.tip_id] = acc[r.tip_id] || []; acc[r.tip_id].push(String(r.tag)); return acc;
  }, {});
  const U = (users.data || []).reduce<Record<string, { user_id: string; external_id: string }[]>>((acc, r: any) => {
    acc[r.tip_id] = acc[r.tip_id] || [];
    acc[r.tip_id].push({ user_id: r.user_id, external_id: r.users.external_id });
    return acc;
  }, {});

  const out = tips.map(t => ({
    ...t,
    targets: {
      levels: L[t.id] || [],
      tags: G[t.id] || [],
      users: U[t.id] || []
    }
  }));

  return new Response(JSON.stringify(out), { headers: { 'content-type': 'application/json' }});
}

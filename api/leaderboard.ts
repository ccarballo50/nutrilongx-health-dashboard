export const config = { runtime: 'edge' };

import { supabaseAdmin } from '../lib/supabaseAdmin';

export default async function handler(req: Request) {
  const supa = supabaseAdmin();
  const url = new URL(req.url);
  const externalId = url.searchParams.get('externalId');
  const levelParam = url.searchParams.get('level');

  let level: number | null = levelParam ? Number(levelParam) : null;
  let me: any = null;

  if (externalId) {
    const { data } = await supa.from('users')
      .select('external_id, display_name, level, points')
      .eq('external_id', externalId).single();
    me = data || null;
    if (!level && me) level = me.level;
  }
  if (!level) level = 1;

  const { data: top } = await supa.from('users')
    .select('external_id, display_name, level, points')
    .eq('level', level)
    .order('points', { ascending: false })
    .limit(10);

  let myRank: number | null = null;
  if (me) {
    const { count } = await supa.from('users')
      .select('*', { count: 'exact', head: true })
      .eq('level', level)
      .gt('points', me.points);
    myRank = (count ?? 0) + 1;
  }

  return new Response(JSON.stringify({
    level, me, myRank, top: top ?? []
  }), { headers: { 'content-type': 'application/json' }, status: 200 });
}

export const config = { runtime: 'edge' };

import { supabaseAdmin } from '../lib/supabaseAdmin';

function todayInTZ(tz = 'Europe/Madrid'): string {
  const fmt = new Intl.DateTimeFormat('en-CA',{ timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit' });
  const p = fmt.formatToParts(new Date());
  return `${p.find(x=>x.type==='year')!.value}-${p.find(x=>x.type==='month')!.value}-${p.find(x=>x.type==='day')!.value}`;
}

export default async function handler(req: Request) {
  const supa = supabaseAdmin();
  const url = new URL(req.url);
  const externalId = url.searchParams.get('externalId');
  if (!externalId) return new Response('Missing externalId', { status: 400 });

  const { data: me } = await supa
    .from('users')
    .select('id, display_name, level, points, streak_current, streak_best')
    .eq('external_id', externalId).single();

  if (!me) return new Response(JSON.stringify({ me: null }), { headers: { 'content-type':'application/json' }});

  const day = todayInTZ('Europe/Madrid');

  const { data: today } = await supa
    .from('user_day').select('retos, rutinas, mente, bonus_awarded')
    .eq('user_id', me.id).eq('day', day).single();

  const { data: badges } = await supa
    .from('user_badges').select('badge_code, earned_at')
    .eq('user_id', me.id).order('earned_at', { ascending: false });

  return new Response(JSON.stringify({
    me,
    today: today || { retos:0, rutinas:0, mente:0, bonus_awarded:false },
    badges: badges || []
  }), { headers: { 'content-type': 'application/json' }});
}

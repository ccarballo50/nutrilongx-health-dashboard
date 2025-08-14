export const config = { runtime: 'edge' };

import { supabaseAdmin } from '../../lib/supabaseAdmin';

const LEVELS = [
  { level: 1, name: 'Inicio',   threshold: 0 },
  { level: 2, name: 'Bronce',   threshold: 50 },
  { level: 3, name: 'Plata',    threshold: 150 },
  { level: 4, name: 'Oro',      threshold: 300 },
  { level: 5, name: 'Platino',  threshold: 600 },
  { level: 6, name: 'Diamante', threshold: 1000 },
];

function levelFor(points: number) {
  let current = LEVELS[0];
  for (const l of LEVELS) if (points >= l.threshold) current = l;
  const next = LEVELS.find(l => l.threshold > current.threshold) || null;
  const toNext = next ? Math.max(0, next.threshold - points) : 0;
  return { current, next, toNext };
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const body = await req.json();
    const { externalId, contentId, section, title, dvg } = body || {};
    if (!externalId) return new Response('Missing externalId', { status: 400 });

    const gain = Math.max(1, Number(dvg || 0)); // mínimo 1

    const supa = supabaseAdmin();

    // Asegura usuario
    const { data: user, error: uerr } = await supa
      .from('users').select('id, points, level').eq('external_id', externalId).single();
    let userId = user?.id; let points = user?.points ?? 0;

    if (uerr || !userId) {
      const { data: up } = await supa
        .from('users')
        .upsert({ external_id: externalId }, { onConflict: 'external_id' })
        .select('id, points, level').single();
      userId = up?.id; points = up?.points ?? 0;
    }
    if (!userId) throw new Error('Cannot create/find user');

    // Inserta logro
    const { error: aerr } = await supa.from('achievements').insert({
      user_id: userId, content_id: contentId ?? null, section: section ?? null,
      title: title ?? null, dvg: Number.isFinite(dvg) ? dvg : null, points: gain
    });
    if (aerr) throw aerr;

    // Actualiza puntos y nivel
    const newPoints = Number(points) + gain;
    const { current, next, toNext } = levelFor(newPoints);

    const { error: uperr, data: updated } = await supa
      .from('users')
      .update({ points: newPoints, level: current.level })
      .eq('id', userId)
      .select('level, points')
      .single();
    if (uperr) throw uperr;

    return new Response(JSON.stringify({
      ok: true,
      level: current.level,
      levelName: current.name,
      points: updated.points,
      nextLevel: next?.level ?? null,
      toNext,
    }), { headers: { 'content-type': 'application/json' }, status: 200 });

  } catch (e: any) {
    return new Response(e.message || 'log failed', { status: 500 });
  }
}

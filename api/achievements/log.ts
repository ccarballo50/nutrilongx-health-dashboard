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

const STREAK_BADGES = [
  { code: 'streak3',  days: 3  },
  { code: 'streak7',  days: 7  },
  { code: 'streak14', days: 14 },
  { code: 'streak30', days: 30 },
];

function levelFor(points: number) {
  let current = LEVELS[0];
  for (const l of LEVELS) if (points >= l.threshold) current = l;
  const next = LEVELS.find(l => l.threshold > current.threshold) || null;
  const toNext = next ? Math.max(0, next.threshold - points) : 0;
  return { current, next, toNext };
}

function todayInTZ(tz = 'Europe/Madrid'): string {
  const fmt = new Intl.DateTimeFormat('en-CA',{ timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit' });
  const p = fmt.formatToParts(new Date());
  const y = p.find(x=>x.type==='year')!.value;
  const m = p.find(x=>x.type==='month')!.value;
  const d = p.find(x=>x.type==='day')!.value;
  return `${y}-${m}-${d}`; // YYYY-MM-DD
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const body = await req.json();
    const { externalId, contentId, section, title, dvg } = body || {};
    if (!externalId) return new Response('Missing externalId', { status: 400 });

    const gain = Math.max(1, Number(dvg || 0)); // mínimo 1
    const day = todayInTZ('Europe/Madrid');
    const supa = supabaseAdmin();

    // Asegura usuario
    const { data: u0 } = await supa
      .from('users').select('id, points, level, streak_current, streak_best, last_log_date')
      .eq('external_id', externalId).single();

    let user = u0;
    if (!user) {
      const { data: up } = await supa
        .from('users')
        .upsert({ external_id: externalId }, { onConflict: 'external_id' })
        .select('id, points, level, streak_current, streak_best, last_log_date')
        .single();
      user = up!;
    }
    if (!user) throw new Error('Cannot create/find user');

    // Inserta logro
    const { error: aerr } = await supa.from('achievements').insert({
      user_id: user.id, content_id: contentId ?? null, section: section ?? null,
      title: title ?? null, dvg: Number.isFinite(dvg) ? dvg : null, points: gain
    });
    if (aerr) throw aerr;

    // Recalcula puntos y nivel
    const newPoints = Number(user.points ?? 0) + gain;
    const { current, next, toNext } = levelFor(newPoints);

    // Racha diaria
    let streakCurrent = Number(user.streak_current ?? 0);
    let streakBest = Number(user.streak_best ?? 0);

    const last = user.last_log_date as string | null;
    if (last === day) {
      // mismo día → no cambia la racha
    } else {
      // diferencia de días en Madrid
      const dayDate = new Date(day + 'T00:00:00');
      const lastDate = last ? new Date(last + 'T00:00:00') : null;
      const diff = lastDate ? Math.round((+dayDate - +lastDate) / 86400000) : null;
      if (diff === 1) streakCurrent += 1;
      else streakCurrent = 1;
      if (streakCurrent > streakBest) streakBest = streakCurrent;
    }

    // Guarda usuario
    const { error: uperr } = await supa
      .from('users')
      .update({
        points: newPoints,
        level: current.level,
        streak_current: streakCurrent,
        streak_best: streakBest,
        last_log_date: day
      })
      .eq('id', user.id);
    if (uperr) throw uperr;

    // Misiones diarias (1 reto + 1 rutina + 1 mente)
    const field =
      section === 'RETOS'   ? 'retos'   :
      section === 'RUTINAS' ? 'rutinas' :
      section === 'MENTE'   ? 'mente'   : null;

    let dailyBonusAwarded = false;
    if (field) {
      // upsert del día
      const { data: d0 } = await supa
        .from('user_day')
        .upsert({ user_id: user.id, day }, { onConflict: 'user_id,day' })
        .select().single();

      const o = d0 || { retos: 0, rutinas: 0, mente: 0, bonus_awarded: false };
      // incrementa el contador de la sección usada
      o[field] = Number(o[field] || 0) + 1;

      // ¿cumple misión (>=1 en cada sección)?
      const missionDone = (o.retos > 0 && o.rutinas > 0 && o.mente > 0);

      if (missionDone && !o.bonus_awarded) {
        // da bonus (ej. +5) una sola vez al día
        const bonus = 5;
        const { error: ab } = await supa.from('achievements').insert({
          user_id: user.id, content_id: null, section: 'RETOS', title: 'Bonus diario', dvg: bonus, points: bonus
        });
        if (ab) throw ab;
        const { error: upUser } = await supa.from('users')
          .update({ points: newPoints + bonus })
          .eq('id', user.id);
        if (upUser) throw upUser;
        o.bonus_awarded = true;
        dailyBonusAwarded = true;
      }

      // guarda el día
      const { error: upDay } = await supa.from('user_day')
        .update({ retos: o.retos, rutinas: o.rutinas, mente: o.mente, bonus_awarded: o.bonus_awarded })
        .eq('user_id', user.id).eq('day', day);
      if (upDay) throw upDay;
    }

    // Otorgar medallas por puntos totales
    const { data: pointBadges } = await supa.from('badges')
      .select('code, threshold_points')
      .not('threshold_points','is', null)
      .lte('threshold_points', newPoints);

    const codesByPoints = (pointBadges||[]).map(b => b.code);
    if (codesByPoints.length) {
      const { data: mine } = await supa.from('user_badges')
        .select('badge_code').eq('user_id', user.id);
      const have = new Set((mine||[]).map((m:any)=>m.badge_code));
      const toGrant = codesByPoints.filter(c => !have.has(c));
      if (toGrant.length) {
        await supa.from('user_badges').insert(toGrant.map(c => ({ user_id: user.id, badge_code: c })));
      }
    }

    // Otorgar medallas por racha
    const streakToGrant = STREAK_BADGES
      .filter(b => streakCurrent >= b.days)
      .map(b => b.code);
    if (streakToGrant.length) {
      const { data: mine2 } = await supa.from('user_badges')
        .select('badge_code').eq('user_id', user.id);
      const have2 = new Set((mine2||[]).map((m:any)=>m.badge_code));
      const add2 = streakToGrant.filter(c => !have2.has(c));
      if (add2.length) {
        await supa.from('user_badges').insert(add2.map(c => ({ user_id: user.id, badge_code: c })));
      }
    }

    // Lee medallas del usuario para devolver a la UI
    const { data: myBadges } = await supa
      .from('user_badges').select('badge_code, earned_at')
      .eq('user_id', user.id);

    return new Response(JSON.stringify({
      ok: true,
      // nivel/puntos
      level: current.level,
      levelName: current.name,
      points: newPoints,
      nextLevel: next?.level ?? null,
      toNext,
      // racha
      streakCurrent,
      streakBest,
      // misiones diarias
      dailyBonusAwarded,
      // medallas actuales
      badges: (myBadges||[]).map(b => b.badge_code),
    }), { headers: { 'content-type': 'application/json' }, status: 200 });

  } catch (e: any) {
    return new Response(e.message || 'log failed', { status: 500 });
  }
}


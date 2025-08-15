// /api/ai/daily-tip.ts
export const config = { runtime: 'edge' };

import { supabaseAdmin } from '../../lib/supabaseAdmin';

type User = {
  id: string;
  external_id: string;
  display_name: string | null;
  level: number | null; // NUMÉRICO
  points: number | null;
};

const LEVEL_NAME: Record<number, string> = {
  1: 'inicio',
  2: 'bronce',
  3: 'plata',
  4: 'oro',
  5: 'platino',
  6: 'diamante',
};

function pickWeighted<T extends { weight?: number }>(items: T[]): T | null {
  if (!items?.length) return null;
  const total = items.reduce((s, i) => s + (i.weight ?? 1), 0);
  let r = Math.random() * total;
  for (const it of items) {
    r -= (it.weight ?? 1);
    if (r <= 0) return it;
  }
  return items[0];
}

// Gemini (REST) → devuelve string seguro
async function generateWithGemini(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }]}],
    generationConfig: { temperature: 0.7, maxOutputTokens: 350 },
  };

  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey,
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }
  );

  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Devuelve null para que el caller haga fallback al tip.body
    return null;
  }
  try {
    const parts = data?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
      const text = parts.map((p: any) => p?.text).filter(Boolean).join('\n').trim();
      return text || null;
    }
  } catch {}
  return null;
}

export default async function handler(req: Request) {
  try {
    const url = new URL(req.url);
    const externalId = url.searchParams.get('externalId');
    const debug = url.searchParams.get('debug') === '1';

    if (!externalId) {
      return new Response('Missing externalId', { status: 400 });
    }

    const supa = supabaseAdmin();

    // 1) Usuario
    const { data: user, error: uErr } = await supa
      .from('users')
      .select('id, external_id, display_name, level, points')
      .eq('external_id', externalId)
      .single();

    if (uErr || !user) {
      return new Response('User not found', { status: 404 });
    }
    const u = user as User;
    const lvlNum = Number(u.level ?? 0);
    const lvlName = LEVEL_NAME[lvlNum] || String(lvlNum || '');

    // 2) Construir TAGS del usuario (nivel + categorías recientes del contenido logrado)
    const userTags = new Set<string>();
    if (lvlNum) userTags.add(`nivel:${lvlName}`);

    // últimas 10 categorías de contenido conseguido (vía achievements → content)
    const { data: recentAch } = await supa
      .from('achievements')
      .select('content_id')
      .eq('user_id', u.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const contentIds = (recentAch || [])
      .map((a: any) => a?.content_id)
      .filter((x: any) => !!x);

    if (contentIds.length) {
      // Traer categorías distintas de esos contenidos
      const idsCsv = contentIds.map((id: string) => id).join(',');
      const { data: contents } = await supa
        .from('content')
        .select('id, category')
        .in('id', contentIds as any);

      (contents || [])
        .map((c: any) => c?.category)
        .filter(Boolean)
        .forEach((cat: string) => userTags.add(String(cat).toLowerCase()));
    }

    // 3) Candidatos por prioridad
    // 3.a) Directo al usuario
    const { data: byUser } = await supa
      .from('tips')
      .select('id, title, body, is_ai, weight, start_at, end_at, is_active, tip_targets_user!inner(user_id)')
      .eq('tip_targets_user.user_id', u.id)
      .eq('is_active', true);

    // 3.b) Por nivel (NUMÉRICO)
    const { data: byLevel } = await supa
      .from('tips')
      .select('id, title, body, is_ai, weight, start_at, end_at, is_active, tip_targets_level!inner(level)')
      .eq('tip_targets_level.level', lvlNum)
      .eq('is_active', true);

    // 3.c) Por tags (pueden ser varias llamadas; unimos resultados)
    let byTag: any[] = [];
    for (const tag of Array.from(userTags)) {
      const { data } = await supa
        .from('tips')
        .select('id, title, body, is_ai, weight, start_at, end_at, is_active, tip_targets_tag!inner(tag)')
        .eq('tip_targets_tag.tag', tag)
        .eq('is_active', true);
      if (data?.length) byTag = byTag.concat(data);
    }

    // 3.d) Globales (sin targets): intenta RPC; si no existe, fallback
    let globals: any[] = [];
    try {
      const rpcRes = await supa.rpc('tips_without_targets');
      if (!rpcRes.error && rpcRes.data) globals = rpcRes.data as any[];
    } catch {
      // Fallback:
      const { data: allTips } = await supa
        .from('tips')
        .select('id, title, body, is_ai, weight, start_at, end_at, is_active')
        .eq('is_active', true);
      // Quitar los que tengan targets
      const ids = (allTips || []).map((t: any) => t.id);
      const { data: tUser } = await supa.from('tip_targets_user').select('tip_id').in('tip_id', ids as any);
      const { data: tLvl } = await supa.from('tip_targets_level').select('tip_id').in('tip_id', ids as any);
      const { data: tTag } = await supa.from('tip_targets_tag').select('tip_id').in('tip_id', ids as any);
      const targeted = new Set<string>([
        ...((tUser || []).map((x: any) => x.tip_id)),
        ...((tLvl || []).map((x: any) => x.tip_id)),
        ...((tTag || []).map((x: any) => x.tip_id)),
      ]);
      globals = (allTips || []).filter((t: any) => !targeted.has(t.id));
    }

    // Unir por prioridad y ventana activa
    const now = Date.now();
    const seen = new Set<string>();
    const prioritized: any[] = [];

    function pushUnique(arr?: any[]) {
      for (const t of arr || []) {
        if (!t?.id || seen.has(t.id)) continue;
        const startOk = !t.start_at || new Date(t.start_at).getTime() <= now;
        const endOk = !t.end_at || new Date(t.end_at).getTime() >= now;
        if (!startOk || !endOk || !t.is_active) continue;
        prioritized.push(t);
        seen.add(t.id);
      }
    }

    pushUnique(byUser);
    pushUnique(byLevel);
    pushUnique(byTag);
    pushUnique(globals);

    // 4) Evitar duplicados del mismo tip el mismo día (zona Madrid)
    //   No podemos usar upsert por índice expresivo, así que comprobamos y si insert duplica lo ignoramos.
    //   Aún así, filtramos: si ya se envió HOY ese tip al usuario, no lo elegimos.
    const dayInMadrid = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Madrid',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date()); // YYYY-MM-DD
    const madridStartUtc = new Date(`${dayInMadrid}T00:00:00`).toISOString(); // aproximación

    const { data: todays } = await supa
      .from('tip_history')
      .select('tip_id, sent_at')
      .eq('user_id', u.id)
      .gte('sent_at', madridStartUtc);

    const sentToday = new Set((todays || []).map((x: any) => x.tip_id));
    const candidates = prioritized.filter(t => !sentToday.has(t.id));

    // Fallback si se quedó sin candidatos
    const finalPool = candidates.length ? candidates : prioritized;
    const chosen = pickWeighted(finalPool);
    if (!chosen) {
      return new Response(JSON.stringify({
        text: 'Sigue con tu plan hoy: hidrátate y camina 10 minutos tranquilos.',
        context: { fallback: true, reason: 'no_candidates' }
      }), { headers: { 'content-type': 'application/json' }});
    }

    // 5) Registrar histórico (ignorar duplicado diario si sucede)
    const ins = await supa.from('tip_history').insert({ user_id: u.id, tip_id: chosen.id });
    if (ins.error && (ins.error as any).code !== '23505') {
      // Si no es duplicado (unique_violation), propaga error
      return new Response(ins.error.message, { status: 500 });
    }

    // 6) Generar texto final (IA si is_ai=true)
    let finalText: string = chosen.body || '';
    if (chosen.is_ai) {
      const tags = Array.from(userTags).join(', ') || 'general';
      const sys =
`Eres un coach de salud. Redacta un consejo breve (60–80 palabras), cálido, en español, con 1 acción concreta para hoy.
Personaliza por nivel y etiquetas del usuario (si las hay). Evita repeticiones, sé específico y útil.`;

      const prompt =
`${sys}
Contexto del usuario:
- Nombre: ${u.display_name ?? u.external_id}
- Nivel: ${lvlName || 'N/A'} (${lvlNum || 0})
- Etiquetas/intereses: ${tags}
Tip base seleccionado: "${chosen.title}" → "${chosen.body}"`;

      const maybe = await generateWithGemini(prompt);
      if (maybe && maybe.length > 20) finalText = maybe;
    }

    const payload = {
      text: finalText,
      context: {
        tipId: chosen.id,
        title: chosen.title,
        chosenFrom: {
          byUser: (byUser || []).map((t: any) => t.id),
          byLevel: (byLevel || []).map((t: any) => t.id),
          byTag: Array.from(new Set((byTag || []).map((t: any) => t.id))),
          globals: (globals || []).map((t: any) => t.id),
        },
        user: {
          externalId: u.external_id,
          name: u.display_name,
          level: lvlNum,
          levelName: lvlName,
          points: u.points ?? 0,
          tags: Array.from(userTags),
        },
        debug,
      }
    };

    return new Response(JSON.stringify(payload), {
      headers: { 'content-type': 'application/json' },
      status: 200
    });

  } catch (e: any) {
    return new Response(e?.message ?? 'Internal error', { status: 500 });
  }
}


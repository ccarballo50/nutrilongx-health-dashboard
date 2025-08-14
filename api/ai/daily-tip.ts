export const config = { runtime: 'edge' };

import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const externalId = url.searchParams.get('externalId');
  if (!externalId) return new Response('Missing externalId', { status: 400 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return new Response('Missing GEMINI_API_KEY', { status: 500 });

  const supa = supabaseAdmin();
  const { data: me } = await supa
    .from('users')
    .select('id, display_name, level, points, streak_current, streak_best')
    .eq('external_id', externalId).single();

  const { data: last3 } = await supa
    .from('achievements')
    .select('section, title, dvg, created_at')
    .eq('user_id', me?.id || '00000000-0000-0000-0000-000000000000')
    .order('created_at', { ascending: false })
    .limit(3);

  const context = {
    name: me?.display_name || 'Cliente',
    level: me?.level || 1,
    points: me?.points || 0,
    streak: me?.streak_current || 0,
    last: last3 || []
  };

  const system = "Eres coach de salud. Da 1 párrafo breve y 3 bullets accionables. Menciona DVG cuando aporte motivación. Español, tono cálido y específico.";
  const prompt = `Perfil: ${JSON.stringify(context)}. Diseña el consejo de hoy, teniendo en cuenta su racha y últimos logros.`;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: `${system}\n${prompt}` }]}],
    generationConfig: { temperature: 0.7, maxOutputTokens: 350 }
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }
  );
  const data = await res.json();
  if (!res.ok) return new Response(JSON.stringify({ error: data.error?.message || 'IA error' }), { status: res.status });

  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('\n') || '';
  return new Response(JSON.stringify({ text, context }), { headers: { 'content-type': 'application/json' } });
}

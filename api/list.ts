export const config = { runtime: 'edge' };

import { supabaseAdmin } from '../lib/supabaseAdmin';

export default async function handler(req: Request) {
  const supa = supabaseAdmin();
  const url = new URL(req.url);

  const section = url.searchParams.get('section');   // "RETOS" | "RUTINAS" | "MENTE" | null
  const category = url.searchParams.get('category'); // p.ej. "Alimentación" | null
  const limitStr = url.searchParams.get('limit');
  const limit = Math.min(100, Math.max(1, Number(limitStr || 50) || 50));

  let q = supa
    .from('content')
    .select('id, section, title, description, dvg, category, created_at, content_media ( url, kind )')
    .neq('visibility', 'draft')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (section)  q = q.eq('section', section);
  if (category) q = q.eq('category', category);

  const { data, error } = await q;
  if (error) return new Response(error.message, { status: 500, headers: { 'content-type': 'text/plain' } });

  return new Response(JSON.stringify(data ?? []), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

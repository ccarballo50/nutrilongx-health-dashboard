export const config = { runtime: 'edge' };

import { supabaseAdmin } from '../lib/supabaseAdmin';

export default async function handler(req: Request) {
  const supa = supabaseAdmin();
  const url = new URL(req.url);
  const section = url.searchParams.get('section'); // "RETOS"|"RUTINAS"|"MENTE"|null

  let q = supa
    .from('content')
    .select('id, section, title, description, dvg, category, created_at, content_media ( url, kind )')
    .neq('visibility', 'draft')
    .order('created_at', { ascending: false });

  if (section) q = q.eq('section', section);

  const { data, error } = await q;
  if (error) return new Response(error.message, { status: 500 });

  return new Response(JSON.stringify(data ?? []), {
    headers: { 'content-type': 'application/json' },
    status: 200,
  });
}

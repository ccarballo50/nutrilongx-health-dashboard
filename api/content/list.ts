export const config = { runtime: 'edge' };
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler() {
  const supa = supabaseAdmin();
  const { data, error } = await supa
    .from('content')
    .select('id, section, title, category, visibility, dvg, created_at')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify(data ?? []), {
    headers: { 'content-type': 'application/json' },
    status: 200,
  });
}

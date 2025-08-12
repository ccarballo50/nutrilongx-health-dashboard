export const config = { runtime: 'edge' };

import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const body = await req.json();

    const required = ['section','title','description','category'];
    for (const k of required) if (!body[k]) return new Response(`Missing ${k}`, { status: 400 });

    const supa = supabaseAdmin();
    const { data, error } = await supa
      .from('content')
      .insert({
        section: body.section,
        title: body.title,
        description: body.description,
        dvg: body.dvg ?? null,
        category: body.category,
        duration_min: body.duration_min ?? null,
        level: body.level ?? null,
        tags: body.tags ?? null,
        text_content: body.text_content ?? null,
        visibility: body.visibility ?? 'public',
        created_by: body.created_by ?? 'admin',
      })
      .select('id')
      .single();

    if (error) throw error;

    const contentId = data.id;

    if (Array.isArray(body.media) && body.media.length) {
      const mediaRows = body.media.map((m: any) => ({
        content_id: contentId,
        kind: m.kind,
        name: m.name,
        type: m.type,
        size: m.size,
        url: m.url,
      }));
      const { error: mErr } = await supa.from('content_media').insert(mediaRows);
      if (mErr) throw mErr;
    }

    return new Response(JSON.stringify({ ok: true, id: contentId }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? 'create failed' }), { status: 500 });
  }
}

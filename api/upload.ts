export const config = { runtime: 'edge' };

import { supabaseAdmin } from '../lib/supabaseAdmin';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }
  try {
    const fileName = (req.headers.get('x-filename') || `upload-${Date.now()}`)
      .replace(/[^a-zA-Z0-9_.-]/g, '_');
    const contentType = req.headers.get('x-content-type') || 'application/octet-stream';
    const arrayBuffer = await req.arrayBuffer();

    const supa = supabaseAdmin();
    const path = `${new Date().toISOString().slice(0,10)}/${fileName}`;

    const { error } = await supa.storage.from('content').upload(path, arrayBuffer, {
      contentType,
      upsert: false, // si da 'already exists', puedes cambiar a true
    });
    if (error) throw error;

    const { data } = supa.storage.from('content').getPublicUrl(path);
    return new Response(JSON.stringify({ url: data.publicUrl, path }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? 'upload failed' }), { status: 500 });
  }
}

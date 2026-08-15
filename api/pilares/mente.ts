export const config = { runtime: 'edge' };

// /api/pilares/mente
//
// Lectura pública (sin auth: solo devuelve filas estado='aprobado', igual
// que /api/list.ts para la tabla `content`) del contenido de los 3 pilares
// visibles de cliente que viven en el backend bajo el pilar único "MEN":
// Sueño, Estrés, Bienestar emocional. Tablas nuevas de
// supabase/migrations/0001_contenido_pilares.sql.
//
// El frontend (services/pilares.ts) intenta primero leer directo vía RLS
// con la anon key y solo cae aquí como fallback, igual que services/content.ts.

import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler(req: Request) {
  const supa = supabaseAdmin();

  const [subpilares, fichas, retos, infografias] = await Promise.all([
    supa.from('subpilar_mapeo').select('subpilar, pilar_visible, nota'),
    supa.from('content_pieces').select('*').eq('estado', 'aprobado'),
    supa.from('retos_insignia').select('*').eq('estado', 'aprobado'),
    supa.from('infografias').select('*').eq('estado', 'aprobado'),
  ]);

  const err = subpilares.error || fichas.error || retos.error || infografias.error;
  if (err) {
    return new Response(err.message, { status: 500, headers: { 'content-type': 'text/plain' } });
  }

  return new Response(
    JSON.stringify({
      subpilares: subpilares.data ?? [],
      fichas: fichas.data ?? [],
      retos: retos.data ?? [],
      infografias: infografias.data ?? [],
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
}

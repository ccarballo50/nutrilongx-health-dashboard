import { supabase } from "../src/lib/supabaseClient";

// Los 3 pilares visibles de cliente que viven bajo el pilar único de
// backend "MEN" (ver subpilar_mapeo en la migración 0001). No confundir
// con Section ("MENTE") de services/content.ts, que es el pilar de backend.
export type PilarVisible = "Sueño" | "Estrés" | "Bienestar emocional";

export interface SubpilarMapeo {
  subpilar: string;
  pilar_visible: PilarVisible;
  nota: string | null;
}

export interface PilaresMenteData {
  subpilares: SubpilarMapeo[];
  fichas: any[];
  retos: any[];
  infografias: any[];
}

const EMPTY: PilaresMenteData = { subpilares: [], fichas: [], retos: [], infografias: [] };

export async function listPilaresMente(): Promise<PilaresMenteData> {
  // 1) intento directo (RLS, la policy pública ya filtra estado='aprobado')
  try {
    const [r1, r2, r3, r4] = await Promise.all([
      supabase.from("subpilar_mapeo").select("subpilar, pilar_visible, nota"),
      supabase.from("content_pieces").select("*"),
      supabase.from("retos_insignia").select("*"),
      supabase.from("infografias").select("*"),
    ]);
    if (r1.error || r2.error || r3.error || r4.error) throw r1.error || r2.error || r3.error || r4.error;
    if ((r2.data?.length ?? 0) + (r3.data?.length ?? 0) + (r4.data?.length ?? 0) > 0) {
      return {
        subpilares: r1.data ?? [],
        fichas: r2.data ?? [],
        retos: r3.data ?? [],
        infografias: r4.data ?? [],
      };
    }
  } catch (_) {
    // sigue al fallback
  }

  // 2) fallback al backend (service role), igual que listPublicContent
  const r = await fetch(`/api/pilares/mente`, { cache: "no-store" });
  if (!r.ok) throw new Error(`/api/pilares/mente ${r.status}`);
  const data = await r.json();
  return { ...EMPTY, ...data };
}

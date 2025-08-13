// services/content.ts
import { supabase } from "../src/lib/supabaseClient";

export type Section = "RETOS" | "RUTINAS" | "MENTE";

/**
 * Lee contenidos publicados (no 'draft') desde Supabase.
 * Si pasas section, filtra por RETOS / RUTINAS / MENTE.
 */
export async function listPublicContent(section?: Section) {
  const select = `
    id, section, title, description, dvg, category, created_at,
    content_media ( url, kind )
  `;

  let q = supabase
    .from("content")
    .select(select)
    .neq("visibility", "draft")
    .order("created_at", { ascending: false });

  if (section) q = q.eq("section", section);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

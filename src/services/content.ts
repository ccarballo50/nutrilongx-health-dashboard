import { supabase } from "../lib/supabaseClient";

export async function listPublicContent(section?: "RETOS" | "RUTINAS" | "MENTE") {
  let q = supabase
    .from("content")
    .select("id, section, title, description, dvg, category, created_at, content_media(url, kind)")
    .neq("visibility", "draft")
    .order("created_at", { ascending: false });

  if (section) q = q.eq("section", section);

  const { data, error } = await q;
  if (error) throw error;
  return data;
}

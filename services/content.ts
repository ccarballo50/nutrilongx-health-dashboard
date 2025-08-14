import { supabase } from "../src/lib/supabaseClient";

export type Section = "RETOS" | "RUTINAS" | "MENTE";

const SELECT = `
  id, section, title, description, dvg, category, created_at,
  content_media ( url, kind )
`;

export async function listPublicContent(section?: Section) {
  // 1) intento directo (RLS)
  try {
    let q = supabase
      .from("content")
      .select(SELECT)
      .neq("visibility", "draft")
      .order("created_at", { ascending: false });

    if (section) q = q.eq("section", section);

    const { data, error } = await q;
    if (error) throw error;
    if (data?.length) return data;
  } catch (_) {}

  // 2) fallback al backend (service role)
  const qs = section ? `?section=${encodeURIComponent(section)}` : "";
  const r = await fetch(`/api/list${qs}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`/api/list ${r.status}`);
  return r.json();
}

export async function listByCategory(category: string) {
  // 1) intento directo (RLS)
  try {
    const { data, error } = await supabase
      .from("content")
      .select(SELECT)
      .neq("visibility", "draft")
      .eq("category", category)
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (data?.length) return data;
  } catch (_) {}

  // 2) fallback al backend
  const r = await fetch(`/api/list?category=${encodeURIComponent(category)}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`/api/list ${r.status}`);
  return r.json();
}


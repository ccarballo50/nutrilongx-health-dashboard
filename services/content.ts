import { supabase } from "../src/lib/supabaseClient";

export type Section = "RETOS" | "RUTINAS" | "MENTE";

export async function listPublicContent(section?: Section) {
  // 1) intento con Supabase (cliente)
  try {
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
    if (data?.length) return data;
  } catch (_) {}

  // 2) fallback al backend (service role)
  const qs = section ? `?section=${encodeURIComponent(section)}` : "";
  const r = await fetch(`/api/list${qs}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`/api/list ${r.status}`);
  return await r.json();
}


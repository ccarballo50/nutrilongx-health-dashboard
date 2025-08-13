export const config = { runtime: 'edge' };

export default function handler() {
  const url = process.env.SUPABASE_URL || "";
  const ref = url.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co/i)?.[1] || "unknown";
  return new Response(JSON.stringify({ supabaseUrl: url, projectRef: ref }), {
    headers: { "content-type": "application/json" },
    status: 200,
  });
}


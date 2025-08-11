export const config = { runtime: "edge" };

export default async function handler(_req: Request) {
  return new Response(JSON.stringify({ ok: true, note: "advice endpoint disabled for now" }), {
    headers: { "content-type": "application/json" },
    status: 200,
  });
}

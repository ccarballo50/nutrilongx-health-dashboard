export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return new Response('Missing GEMINI_API_KEY', { status: 500 });

  let body: any = {};
  try { body = await req.json(); } catch {}
  const { prompt = "Dame un consejo breve para hoy.", profile } = body;

  const system =
    "Eres un coach de salud. Da 3 consejos numerados, prácticos y seguros. Evita diagnósticos. " +
    "Personaliza con el contexto si lo hay. Responde en español.";

  const userCtx = profile ? `Contexto usuario: ${JSON.stringify(profile)}` : "";

  const payload = {
    contents: [
      { role: 'user', parts: [{ text: `${system}\n${userCtx}\nPregunta: ${prompt}` }] }
    ],
    generationConfig: { temperature: 0.7, maxOutputTokens: 400 }
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }
  );
  const data = await res.json();

  if (!res.ok) {
    return new Response(JSON.stringify({ error: data.error?.message || 'IA error' }), {
      status: res.status, headers: { 'content-type': 'application/json' }
    });
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('\n') || '';
  return new Response(JSON.stringify({ text }), { headers: { 'content-type': 'application/json' } });
}


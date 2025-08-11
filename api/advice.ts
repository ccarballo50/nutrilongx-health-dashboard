// Vercel Serverless Function: /api/advice
import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const MODEL_NAME = "gemini-2.5-flash";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing GEMINI_API_KEY" });

    const { user, kpis, pageContext } = req.body || {};
    const ai = new GoogleGenAI({ apiKey });

    const prompt = buildPrompt(user, kpis, pageContext);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    // Some SDKs return { output: { text: ... } } or similar—normalize:
    const text = (response && (response.text || response.output_text || response.output?.[0]?.content || "")) || "";
    return res.status(200).json({ text });
  } catch (err:any) {
    console.error("Advice API error:", err?.message || err);
    return res.status(500).json({ error: "AI generation failed" });
  }
}

// Minimal prompt builder (keep same shape as client expected)
function buildPrompt(user:any, kpis:any, pageContext:string) {
  const persona = user?.profile || "longevidad";
  const name = user?.name || "usuario";
  const lvl = kpis?.level ?? 1;
  const xp = kpis?.xp ?? 0;
  const ctx = pageContext || "dashboard";

  return [
    {
      role: "user",
      parts: [
        {
          text:
`Eres un coach de salud breve y accionable. Usuario: ${name}. Perfil clínico: ${persona}.
Contexto: ${ctx}. Nivel ${lvl}, XP ${xp}.
Da 3 recomendaciones cortas (bullets) y un "Primer paso hoy".
Formato:
- Consejo 1
- Consejo 2
- Consejo 3
Primer paso hoy: ...

No des consejos médicos específicos si hay contraindicaciones aparentes. Usa tono motivador, concreto y seguro.`
        }
      ]
    }
  ];
}

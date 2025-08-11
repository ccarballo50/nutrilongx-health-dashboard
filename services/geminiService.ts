import { User, Kpis } from '../types';

export async function generateAdvice(user: User, kpis: Kpis, pageContext: string): Promise<string> {
  try {
    const res = await fetch('/api/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, kpis, pageContext })
    });
    if (!res.ok) {
      console.error('AI endpoint error', res.status);
      return "No pude generar el consejo ahora mismo. Inténtalo más tarde.";
    }
    const data = await res.json();
    return data.text ?? "Sin consejo disponible en este momento.";
  } catch (e) {
    console.error('AI fetch error', e);
    return "Parece que hay un problema para generar tu consejo. Inténtalo de nuevo más tarde.";
  }
}

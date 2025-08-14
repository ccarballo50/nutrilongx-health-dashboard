import { getOrCreateClientId } from "./profile";

export async function logAchievement(payload: {
  contentId?: string;
  section?: "RETOS" | "RUTINAS" | "MENTE";
  title?: string;
  dvg?: number | null;
}) {
  const externalId = getOrCreateClientId();
  if (!externalId) throw new Error('No client id');

  const r = await fetch('/api/achievements/log', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ externalId, ...payload })
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || JSON.stringify(j));
  return j; // { ok, level, levelName, points, nextLevel, toNext }
}

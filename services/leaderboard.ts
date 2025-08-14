import { getOrCreateClientId } from "./profile";

export async function fetchLeaderboard(level?: number) {
  const externalId = getOrCreateClientId();
  const qs = new URLSearchParams();
  if (externalId) qs.set('externalId', externalId);
  if (level) qs.set('level', String(level));
  const r = await fetch(`/api/leaderboard?${qs.toString()}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(String(r.status));
  return r.json(); // { level, me, myRank, top }
}

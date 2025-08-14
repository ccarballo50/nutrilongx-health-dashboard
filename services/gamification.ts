import { getOrCreateClientId } from "./profile";

export async function fetchMe() {
  const externalId = getOrCreateClientId();
  const r = await fetch(`/api/me?externalId=${encodeURIComponent(externalId!)}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(String(r.status));
  return r.json(); // { me, today, badges }
}

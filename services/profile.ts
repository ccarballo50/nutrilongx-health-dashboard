const KEY = 'nx_uid';

export function getOrCreateClientId() {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(KEY, id);
  }
  return id;
}

export async function ensureProfile(displayName?: string) {
  const externalId = getOrCreateClientId();
  if (!externalId) return null;
  const r = await fetch('/api/profile/upsert', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ externalId, displayName })
  });
  return r.ok ? r.json() : null;
}

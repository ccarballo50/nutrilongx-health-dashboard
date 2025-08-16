// services/notify.ts
export type Channel = 'email' | 'whatsapp';

export async function listAudience() {
  const r = await fetch('/api/notify/audience');
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function sendNotification(payload: {
  channel: Channel;
  subject?: string;
  html?: string;
  text?: string;
  external_id?: string;   // opcional si segmentas por usuario
  level_min?: number;     // opcional si segmentas por nivel
  level_max?: number;     // opcional
}) {
  const r = await fetch('/api/notify/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function upsertConsent(row: {
  external_id: string;
  channel: Channel;
  address: string;  // email o número
  is_active: boolean;
}) {
  const r = await fetch('/api/notify/consent', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(row),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

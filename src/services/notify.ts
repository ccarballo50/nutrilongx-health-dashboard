// src/services/notify.ts
export async function listSubscriptions(externalId: string) {
  const r = await fetch(`/api/notify/list?externalId=${encodeURIComponent(externalId)}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

type ChannelCfg = { address: string; consent?: boolean };

export async function subscribeChannels(params: {
  externalId: string;
  email?: ChannelCfg;
  whatsapp?: ChannelCfg;
  telegram?: ChannelCfg;
}) {
  const r = await fetch('/api/notify/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function unsubscribe(subscriptionId: string) {
  const r = await fetch('/api/notify/unsubscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ subscriptionId }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

import React, { useEffect, useState } from 'react';
import { sendNotification, listAudience } from '@services/notify';


function getExternalId(): string {
  // Usa el externalId real si ya lo tienes en tu contexto de usuario.
  const saved = localStorage.getItem('externalId');
  if (saved) return saved;
  const gen = 'user-' + Math.random().toString(36).slice(2, 8);
  localStorage.setItem('externalId', gen);
  return gen;
}

export default function Notifications() {
  const externalId = getExternalId();

  const [email, setEmail] = useState('');
  const [emailConsent, setEmailConsent] = useState(true);

  const [whats, setWhats] = useState('');
  const [whatsConsent, setWhatsConsent] = useState(false);

  const [tg, setTg] = useState('');
  const [tgConsent, setTgConsent] = useState(false);

  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const s = await listSubscriptions(externalId);
      setSubs(s);
      // Rellenar campos si ya existen
      const emailRow = s.find((x: any) => x.channel === 'email' && x.consent);
      if (emailRow) { setEmail(emailRow.address); setEmailConsent(true); }
      const wRow = s.find((x: any) => x.channel === 'whatsapp' && x.consent);
      if (wRow) { setWhats(wRow.address); setWhatsConsent(true); }
      const tRow = s.find((x: any) => x.channel === 'telegram' && x.consent);
      if (tRow) { setTg(tRow.address); setTgConsent(true); }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onSave() {
    setErr(null); setMsg(null);
    try {
      const payload: any = { externalId };
      if (email) payload.email = { address: email, consent: emailConsent };
      if (whats) payload.whatsapp = { address: whats, consent: whatsConsent };
      if (tg) payload.telegram = { address: tg, consent: tgConsent };
      await subscribeChannels(payload);
      setMsg('Preferencias guardadas.');
      await load();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function onUnsub(id: string) {
    await unsubscribe(id);
    await load();
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold">Preferencias de comunicación</h1>
      <p className="text-sm text-gray-600">ID usuario: <span className="font-mono">{externalId}</span></p>

      {err && <div className="p-2 bg-red-100 text-red-700 rounded">{err}</div>}
      {msg && <div className="p-2 bg-green-100 text-green-700 rounded">{msg}</div>}

      <div className="space-y-3">
        <div className="border rounded p-3">
          <label className="block text-sm font-medium">Email</label>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="mt-1 w-full border rounded px-3 py-2"
            type="email"
          />
          <label className="mt-2 inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={emailConsent} onChange={e => setEmailConsent(e.target.checked)} />
            Quiero recibir emails
          </label>
        </div>

        <div className="border rounded p-3">
          <label className="block text-sm font-medium">WhatsApp (+34…)</label>
          <input
            value={whats}
            onChange={e => setWhats(e.target.value)}
            placeholder="+34 600 000 000"
            className="mt-1 w-full border rounded px-3 py-2"
          />
          <label className="mt-2 inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={whatsConsent} onChange={e => setWhatsConsent(e.target.checked)} />
            Quiero recibir WhatsApps
          </label>
        </div>

        <div className="border rounded p-3">
          <label className="block text-sm font-medium">Telegram (usuario o chat id)</label>
          <input
            value={tg}
            onChange={e => setTg(e.target.value)}
            placeholder="@tuusuario"
            className="mt-1 w-full border rounded px-3 py-2"
          />
          <label className="mt-2 inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={tgConsent} onChange={e => setTgConsent(e.target.checked)} />
            Quiero recibir mensajes por Telegram
          </label>
        </div>

        <button
          onClick={onSave}
          className="w-full bg-green-600 text-white rounded py-2 font-medium"
        >
          Guardar preferencias
        </button>
      </div>

      <div className="pt-4">
        <h2 className="font-medium mb-2">Mis suscripciones</h2>
        {loading ? <div>Cargando…</div> : (
          subs.length === 0 ? <div className="text-sm text-gray-500">No hay suscripciones.</div> : (
            <ul className="space-y-2">
              {subs.map((s: any) => (
                <li key={s.id} className="flex items-center justify-between border rounded px-3 py-2">
                  <div>
                    <div className="text-sm">
                      <span className="font-medium">{s.channel}</span> · {s.address}
                    </div>
                    <div className="text-xs text-gray-500">
                      {s.consent ? 'Activo' : 'Inactivo'}
                    </div>
                  </div>
                  {s.consent && (
                    <button
                      onClick={() => onUnsub(s.id)}
                      className="text-sm px-3 py-1 border rounded"
                    >
                      Darme de baja
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  );
}

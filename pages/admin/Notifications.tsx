// pages/admin/Notifications.tsx
import React, { useEffect, useState } from "react";
import { getPreferences, savePreferences } from "../../services/notify";

type Channels = { email: boolean; whatsapp: boolean; telegram: boolean };

export default function Notifications() {
  const [uid, setUid] = useState<string>("demo-1");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [telegram, setTelegram] = useState("");
  const [channels, setChannels] = useState<Channels>({
    email: true,
    whatsapp: false,
    telegram: false,
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    // Saco el externalId del almacenamiento o dejo demo-1
    const stored =
      localStorage.getItem("user_external_id") ||
      new URLSearchParams(location.search).get("uid") ||
      "demo-1";
    setUid(stored);
    load(stored);
  }, []);

  async function load(id: string) {
    try {
      setLoading(true);
      const p = await getPreferences(id);
      setEmail(p.email || "");
      setWhatsapp(p.whatsapp || "");
      setTelegram(p.telegram || "");
      setChannels({
        email: !!p.channels?.email,
        whatsapp: !!p.channels?.whatsapp,
        telegram: !!p.channels?.telegram,
      });
      setErr(null);
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      setOk(null);
      setErr(null);
      await savePreferences(uid, {
        email,
        whatsapp,
        telegram,
        channels,
      });
      setOk("Preferencias guardadas.");
    } catch (e: any) {
      setErr(e.message || String(e));
    }
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold">Notificaciones</h1>
      <div className="text-xs text-gray-500">ID usuario: {uid}</div>

      {err && <div className="bg-red-100 text-red-700 p-2 rounded">{err}</div>}
      {ok && <div className="bg-green-100 text-green-700 p-2 rounded">{ok}</div>}
      {loading && <div>Cargando…</div>}

      {!loading && (
        <form className="space-y-4" onSubmit={onSave}>
          <div className="space-y-2 border rounded p-3">
            <label className="block text-sm font-medium">Email</label>
            <input
              className="border rounded p-2 w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@dominio.com"
            />
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={channels.email}
                onChange={(e) =>
                  setChannels((c) => ({ ...c, email: e.target.checked }))
                }
              />
              Quiero recibir emails
            </label>
          </div>

          <div className="space-y-2 border rounded p-3">
            <label className="block text-sm font-medium">
              WhatsApp (+34…)
            </label>
            <input
              className="border rounded p-2 w-full"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+34 600 000 000"
            />
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={channels.whatsapp}
                onChange={(e) =>
                  setChannels((c) => ({ ...c, whatsapp: e.target.checked }))
                }
              />
              Quiero recibir WhatsApps
            </label>
          </div>

          <div className="space-y-2 border rounded p-3">
            <label className="block text-sm font-medium">
              Telegram (usuario o chat id)
            </label>
            <input
              className="border rounded p-2 w-full"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="@tuusuario o chat id"
            />
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={channels.telegram}
                onChange={(e) =>
                  setChannels((c) => ({ ...c, telegram: e.target.checked }))
                }
              />
              Quiero recibir mensajes por Telegram
            </label>
          </div>

          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Guardar preferencias
          </button>
        </form>
      )}
    </div>
  );
}


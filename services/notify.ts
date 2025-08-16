// services/notify.ts
import { supabase } from "../src/lib/supabaseClient";

export type Channel = "email" | "whatsapp" | "telegram";

type Prefs = {
  email?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  channels?: Partial<Record<Channel, boolean>>;
};

export async function getPreferences(user_id: string) {
  // Perfil de contacto
  const { data: profile, error: e1 } = await supabase
    .from("users")
    .select("external_id,email,whatsapp,telegram")
    .eq("external_id", user_id)
    .maybeSingle();

  if (e1) throw e1;

  // Canales suscritos
  const { data: subs, error: e2 } = await supabase
    .from("user_subscriptions")
    .select("channel,enabled")
    .eq("user_id", user_id);

  if (e2) throw e2;

  const channels: Record<Channel, boolean> = {
    email: false,
    whatsapp: false,
    telegram: false,
  };
  (subs || []).forEach((s: any) => {
    channels[s.channel as Channel] = !!s.enabled;
  });

  return {
    email: profile?.email ?? "",
    whatsapp: profile?.whatsapp ?? "",
    telegram: profile?.telegram ?? "",
    channels,
  };
}

export async function subscribeChannels(
  user_id: string,
  channels: Partial<Record<Channel, boolean>>
) {
  const rows = Object.entries(channels).map(([channel, enabled]) => ({
    user_id,
    channel,
    enabled: !!enabled,
  }));
  if (rows.length === 0) return;

  const { error } = await supabase
    .from("user_subscriptions")
    .upsert(rows, { onConflict: "user_id,channel" });
  if (error) throw error;
}

export async function savePreferences(user_id: string, prefs: Prefs) {
  // Contacto
  const up = {
    external_id: user_id,
    email: prefs.email ?? null,
    whatsapp: prefs.whatsapp ?? null,
    telegram: prefs.telegram ?? null,
  };
  const { error: e1 } = await supabase
    .from("users")
    .upsert(up, { onConflict: "external_id" });
  if (e1) throw e1;

  // Canales
  if (prefs.channels) {
    await subscribeChannels(user_id, prefs.channels);
  }
}


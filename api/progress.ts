// /api/progress.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const externalId = (req.query.externalId as string) || (req.query.external_id as string);
    if (!externalId) {
      return res.status(400).json({ error: 'externalId requerido' });
    }

    // Leemos SIEMPRE de la vista enriquecida (une logs + catálogo)
    const { data, error } = await supabase
      .from('v_action_logs_enriched')
      .select('created_at, pillar, level, title, life_days, life_hours, qty, action_id')
      .eq('external_id', externalId)
      .order('created_at', { ascending: false })
      .limit(2000);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const rows = Array.isArray(data) ? data : [];

    // Agregados
    const byPillar: Record<string, number> = {};
    let totalDays = 0;
    for (const r of rows) {
      const days = (Number(r.life_days) || 0) * (Number(r.qty) || 1);
      totalDays += days;
      const k = String(r.pillar ?? 'Sin pilar');
      byPillar[k] = (byPillar[k] || 0) + days;
    }

    // Actividad reciente (máx 20)
    const recent = rows.slice(0, 20).map(r => ({
      when: r.created_at,
      actionId: r.action_id,
      title: r.title,
      pillar: r.pillar,
      qty: r.qty,
      life_days: r.life_days
    }));

    return res.status(200).json({
      externalId,
      total_days: Number(totalDays.toFixed(2)),
      total_hours: Number((totalDays * 24).toFixed(2)),
      by_pillar: byPillar,
      recent
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? 'unexpected error' });
  }
}


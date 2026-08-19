
// engine_reference.ts — referencia para NUTRILONGX (TypeScript/Node)
export type Level = "Inicial"|"Bronce"|"Plata"|"Oro"|"Platino";
export type Pillar = "Retos (Ejercicio)"|"Rutinas"|"Alimentación"|"Mente";

export interface EngineConfig {
  engine_version: string;
  levels: {name: Level, multiplier: number}[];
  streaks: { daily: {k:number, cap:number}, weekly: {k:number, cap:number} };
  boosters: {name:string, multiplier:number, scope:any, condition:string, stacking:string, delayed:boolean}[];
  combos: {name:string, bonus_hours:number, condition:string, stacking:boolean}[];
  weekly_multipliers: {name:string, factor:number, pillar_scope:Pillar|"GLOBAL", criterion:string}[];
  caps: {
    daily: Record<Pillar|"GLOBAL", number>,
    weekly: Record<Pillar|"GLOBAL", number>,
    diminishing_returns: {pillar:Pillar, threshold:any, extra_credit_multiplier:number}[]
  };
}

export interface ActionLog {
  date: string; pillar: Pillar; level: Level; action_id: string;
  base_hours: number; qty?: number; meta?: Record<string, any>;
  coach_verified?: boolean; community?: boolean; sleep_goal_achieved?: boolean;
}

export interface DayInput {
  userId: string; date: string; logs: ActionLog[];
  streakDaysByPillar: Partial<Record<Pillar, number>>;
  context: {
    isWeekend?: boolean; total_activity_minutes?: number;
    diet_day_level?: Level; mindfulness_minutes?: number;
    sleep_goal_achieved?: boolean; alcohol_caffeine_evening?: boolean;
    presleep_routine?: boolean; pillars_present?: Pillar[];
    cardio_done?: boolean; strength_done?: boolean;
  }
}

export interface DayResult {
  userId: string; date: string;
  byAction: {action_id:string, adjusted_hours:number, multipliers:{level:number, streak:number, booster:number}}[];
  combo_bonus_hours: number;
  byPillar: Record<Pillar, number>; total_hours_capped: number;
}

const lvl = (cfg:EngineConfig, l:Level)=> (cfg.levels.find(x=>x.name===l)?.multiplier ?? 1.0);
const fd = (k:number, cap:number, s:number)=> Math.min(1 + k*s, 1 + cap);

function boosterMult(cfg:EngineConfig, log:ActionLog, ctx:DayInput["context"]): number {
  let m = 1.0;
  for (const b of cfg.boosters) {
    let ok = false;
    if (b.name==="Weekend Warrior") ok = !!ctx.isWeekend && (ctx.total_activity_minutes??0)>=90 && log.pillar==="Retos (Ejercicio)";
    else if (b.name==="Coach Check") ok = !!log.coach_verified;
    else if (b.name==="Social Buddy") ok = !!log.community;
    else if (b.name==="Recovery Perfect") ok = log.pillar==="Retos (Ejercicio)" && !!ctx.sleep_goal_achieved && !(ctx.alcohol_caffeine_evening) && !!ctx.presleep_routine;
    if (ok) m *= b.multiplier;
  }
  return m;
}

export function computeDay(cfg:EngineConfig, input:DayInput): DayResult {
  const byPillar = {"Retos (Ejercicio)":0, "Rutinas":0, "Alimentación":0, "Mente":0} as Record<Pillar, number>;
  const byAction: DayResult["byAction"] = [];
  for (const log of input.logs) {
    const lm = lvl(cfg, log.level);
    const sm = fd(cfg.streaks.daily.k, cfg.streaks.daily.cap, input.streakDaysByPillar[log.pillar] ?? 0);
    const bm = boosterMult(cfg, log, input.context);
    const adj = (log.base_hours * (log.qty ?? 1)) * lm * sm * bm;
    byAction.push({action_id:log.action_id, adjusted_hours: Number(adj.toFixed(2)), multipliers:{level:lm, streak:sm, booster:bm}});
    byPillar[log.pillar] += adj;
  }

  // Combos (flat)
  let combo = 0;
  const pillars = new Set(input.context.pillars_present ?? (Object.keys(byPillar) as Pillar[]).filter(p=>byPillar[p]>0));
  const all4 = ["Retos (Ejercicio)","Rutinas","Alimentación","Mente"].every(p=>pillars.has(p as Pillar));
  if (all4) combo += 0.6;
  if (pillars.has("Retos (Ejercicio)") && input.context.sleep_goal_achieved) combo += 0.3;
  if ((input.context.diet_day_level && ["Plata","Oro","Platino"].includes(input.context.diet_day_level)) && (input.context.mindfulness_minutes ?? 0) >= 10) combo += 0.2;
  if ((input.context.cardio_done) && (input.context.strength_done)) combo += 0.2;

  // Caps diarios
  (Object.keys(byPillar) as Pillar[]).forEach(p=>{ if (byPillar[p] > cfg.caps.daily[p]) byPillar[p] = cfg.caps.daily[p]; });
  let total = Object.values(byPillar).reduce((a,b)=>a+b,0) + combo;
  if (total > cfg.caps.daily.GLOBAL) total = cfg.caps.daily.GLOBAL;

  return { userId: input.userId, date: input.date, byAction, combo_bonus_hours: Number(combo.toFixed(2)),
           byPillar: Object.fromEntries(Object.entries(byPillar).map(([k,v])=>[k, Number(v.toFixed(2))])) as Record<Pillar,number>,
           total_hours_capped: Number(total.toFixed(2)) };
}

export function hoursToDays(h:number){ return Number((h/24).toFixed(2)); }

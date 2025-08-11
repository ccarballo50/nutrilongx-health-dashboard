export interface User {
  id: string;
  name: string;
  profile: 'obesidad' | 'menopausia' | 'onco' | 'longevidad';
}

export interface Kpis {
  level: number;
  xp: number;
  maxXp: number;
  calories: number;
  protein: number;
  carbs: number;
  weeklyProgress: number;
}

export interface Routine {
  id: string;
  title: string;
  category: 'Cardio' | 'Fuerza' | 'Yoga';
  duration: number; // in minutes
  status: 'pending' | 'completed';
  progress: number; // 0-100
  dvg: number; // Días de Vida Ganados
}

export interface Challenge {
  id: string;
  type: 'daily' | 'weekly';
  category: 'Actividad física' | 'Nutrición' | 'Sueño' | 'Pasos' | 'Entrenamiento' | 'Meditación';
  title: string;
  description: string; // Short description for lists
  fullDescription: string; // Detailed description for detail page
  progress: number; // percentage
  dvg: number; // Días de Vida Ganados
  status: 'not-started' | 'in-progress' | 'completed' | 'not-completed';
  durationText: string;
}

export interface StatsData {
  weekly: { day: string; value: number }[];
  healthyHabits: { day: string; value: number }[];
}

export interface MindEntry {
  id: string;
  text: string;
  mood: 'happy' | 'neutral' | 'sad';
  timestamp: string; // ISO string
}

export interface MindData {
  sleep: { duration: string; change: number };
  stress: { level: string; change: number };
  weeklySleep: { day: string; value: number }[];
  journalEntries: MindEntry[];
}

export interface AchievementLog {
  id: string;
  challengeId: string;
  challengeTitle: string;
  achieved: boolean;
  comment: string;
  timestamp: string;
}

export interface AppState {
  isAuthenticated: boolean;
  user: User | null;
  kpis: Kpis | null;
  routines: Routine[];
  challenges: Challenge[];
  achievementLogs: AchievementLog[];
  stats: StatsData | null;
  mind: MindData | null;
}

export type AppAction =
  | { type: 'HYDRATE'; payload: AppState } & any
  |
  | { type: 'LOGIN' }
  | { type: 'COMPLETE_ROUTINE'; payload: string }
  | { type: 'ADD_JOURNAL_ENTRY'; payload: MindEntry }
  | { type: 'ADD_ACHIEVEMENT_LOG'; payload: AchievementLog }
  | { type: 'JOIN_CHALLENGE'; payload: string }; // payload is challengeId

export interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}
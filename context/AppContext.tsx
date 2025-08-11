import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import { AppState, AppAction, AppContextType, MindEntry, AchievementLog } from '../types';
import { INITIAL_STATE } from '../constants';

const AppContext = createContext<AppContextType | undefined>(undefined);

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;
    case 'LOGIN':
      return {
        ...state,
        isAuthenticated: true,
      };
    case 'COMPLETE_ROUTINE':
      return {
        ...state,
        routines: state.routines.map(routine =>
          routine.id === action.payload
            ? { ...routine, status: 'completed', progress: 100 }
            : routine
        ),
      };
    case 'ADD_JOURNAL_ENTRY':
      if (!state.mind) return state;
      return {
        ...state,
        mind: {
          ...state.mind,
          journalEntries: [action.payload, ...state.mind.journalEntries],
        },
      };
    case 'ADD_ACHIEVEMENT_LOG':
      return {
        ...state,
        achievementLogs: [action.payload, ...state.achievementLogs],
        challenges: state.challenges.map(challenge =>
          challenge.id === action.payload.challengeId
            ? { ...challenge, status: action.payload.achieved ? 'completed' : 'not-completed', progress: action.payload.achieved ? 100 : challenge.progress }
            : challenge
        ),
      };
    case 'JOIN_CHALLENGE':
      return {
        ...state,
        challenges: state.challenges.map(challenge =>
          challenge.id === action.payload
            ? { ...challenge, status: 'in-progress' }
            : challenge
        ),
      };
    default:
      return state;
  }
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE, (init) => {
  try {
    const saved = localStorage.getItem('nlx_state');
    return saved ? JSON.parse(saved) : init;
  } catch { return init; }
});

  useEffect(() => {
    try { localStorage.setItem('nlx_state', JSON.stringify(state)); } catch {}
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
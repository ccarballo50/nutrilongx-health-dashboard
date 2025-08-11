import React from 'react';
import { AppState } from './types';

export const INITIAL_STATE: AppState = {
  isAuthenticated: false,
  user: {
    id: "u_123",
    name: "César",
    profile: "longevidad",
  },
  kpis: {
    level: 3,
    xp: 1200,
    maxXp: 2000,
    calories: 2000,
    protein: 150,
    carbs: 250,
    weeklyProgress: 5,
  },
  routines: [
    { id: 'r1', title: 'Yoga matutino', category: 'Yoga', duration: 20, status: 'pending', progress: 0, dvg: 2 },
    { id: 'r2', title: 'Carrera energética', category: 'Cardio', duration: 30, status: 'completed', progress: 100, dvg: 3 },
    { id: 'r3', title: 'Entrenamiento de fuerza', category: 'Fuerza', duration: 45, status: 'pending', progress: 0, dvg: 4 },
    { id: 'r4', title: 'Cardio matutino', category: 'Cardio', duration: 30, status: 'pending', progress: 0, dvg: 3 },
    { id: 'r5', title: 'Yoga para la flexibilidad', category: 'Yoga', duration: 60, status: 'completed', progress: 100, dvg: 5 },
  ],
  challenges: [
    { id: 'c1', type: 'daily', category: 'Actividad física', title: 'Completa 30 min de actividad', description: 'Activa tu cuerpo y mente cada día.', progress: 60, dvg: 5, status: 'in-progress', durationText: 'Diario', fullDescription: 'Dedica al menos 30 minutos a una actividad física de tu elección. Puede ser caminar, correr, bailar, o cualquier cosa que eleve tu ritmo cardíaco. La constancia es clave para construir un hábito saludable.' },
    { id: 'c2', type: 'daily', category: 'Nutrición', title: 'Mantén una dieta equilibrada', description: 'Come conscientemente y nutre tu cuerpo.', progress: 80, dvg: 5, status: 'in-progress', durationText: 'Diario', fullDescription: 'Asegúrate de incluir una variedad de frutas, verduras, proteínas magras y granos enteros en tus comidas de hoy. Evita los alimentos procesados y las bebidas azucaradas.' },
    { id: 'c3', type: 'daily', category: 'Sueño', title: 'Duerme al menos 7 horas', description: 'Un buen descanso es fundamental.', progress: 100, dvg: 4, status: 'completed', durationText: 'Diario', fullDescription: 'Prioriza tu descanso. Intenta acostarte y levantarte a la misma hora todos los días para regular tu ciclo de sueño. Evita las pantallas al menos una hora antes de dormir.' },
    { id: 'c4', type: 'weekly', category: 'Pasos', title: 'Camina 10,000 pasos cada día', description: 'Un reto semanal para mantenerte activo.', progress: 70, dvg: 10, status: 'in-progress', durationText: '7 días', fullDescription: 'El objetivo es alcanzar 10,000 pasos cada día durante una semana completa. Utiliza un podómetro o tu teléfono para seguir tu progreso. ¡Cada paso cuenta!' },
    { id: 'c5', type: 'weekly', category: 'Entrenamiento', title: 'Realiza 3 sesiones de entrenamiento', description: 'Fuerza, cardio o lo que prefieras.', progress: 50, dvg: 15, status: 'not-started', durationText: '7 días', fullDescription: 'Completa tres sesiones de entrenamiento estructurado esta semana. Cada sesión debe durar al menos 30 minutos. Puedes combinar cardio, fuerza o cualquier otra disciplina que te guste.' },
    { id: 'c6', type: 'weekly', category: 'Meditación', title: 'Practica la atención plena', description: 'Dedica 15 minutos al día a meditar.', progress: 90, dvg: 8, status: 'not-started', durationText: '7 días', fullDescription: 'Encuentra un lugar tranquilo y dedica 15 minutos cada día a la meditación o a ejercicios de atención plena. Esto te ayudará a reducir el estrés y a mejorar tu enfoque.' },
  ],
  achievementLogs: [],
  stats: {
    weekly: [
        { day: 'Lun', value: 20 }, { day: 'Mar', value: 30 }, { day: 'Mié', value: 25 }, { day: 'Jue', value: 45 },
        { day: 'Vie', value: 40 }, { day: 'Sáb', value: 60 }, { day: 'Dom', value: 50 }
    ],
    healthyHabits: [
        { day: 'Lun', value: 10 }, { day: 'Mar', value: 15 }, { day: 'Mié', value: 8 }, { day: 'Jue', value: 20 },
        { day: 'Vie', value: 12 }, { day: 'Sáb', value: 40 }, { day: 'Dom', value: 35 }
    ]
  },
  mind: {
      sleep: { duration: '7h 30m', change: 15 },
      stress: { level: 'Bajo', change: -5 },
      weeklySleep: [
          { day: 'L', value: 7 }, { day: 'M', value: 6.5 }, { day: 'X', value: 7.5 }, { day: 'J', value: 8 },
          { day: 'V', value: 6 }, { day: 'S', value: 8.5 }, { day: 'D', value: 7 }
      ],
      journalEntries: [
        { id: 'entry_1', text: 'Hoy me sentí con mucha energía después de mi carrera matutina. ¡Un gran día!', mood: 'happy', timestamp: new Date(Date.now() - 86400000).toISOString() }
      ]
  }
};

export const ICONS = {
    menu: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>,
    routines: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.024.217 1.464l-.69.825a1.125 1.125 0 0 1-1.667 0l-.69-.825a1.125 1.125 0 0 1 .217-1.464l1.068-.89a1.125 1.125 0 0 0 .405-.864v-.568a1.125 1.125 0 0 1 1.125-1.125h.632c.621 0 1.125.504 1.125 1.125v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.024.217 1.464l-.69.825a1.125 1.125 0 0 1-1.667 0l-.69-.825a1.125 1.125 0 0 1 .217-1.464l1.068-.89a1.125 1.125 0 0 0 .405-.864v-.568a1.125 1.125 0 0 1 1.125-1.125h.632c.621 0 1.125.504 1.125 1.125v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.024.217 1.464l-.69.825a1.125 1.125 0 0 1-1.667 0l-.69-.825a1.125 1.125 0 0 1 .217-1.464l1.068-.89a1.125 1.125 0 0 0 .405-.864v-.568a1.125 1.125 0 0 1 1.125-1.125h.632c.621 0 1.125.504 1.125 1.125v9.75A1.125 1.125 0 0 1 21 18.75h-2.625a1.125 1.125 0 0 1-1.125-1.125v-2.25c0-.621-.504-1.125-1.125-1.125H15c-.621 0-1.125.504-1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H11.25A1.125 1.125 0 0 1 10.125 17.625v-2.25c0-.621-.504-1.125-1.125-1.125H7.5c-.621 0-1.125.504-1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H3.75A1.125 1.125 0 0 1 2.625 17.625v-9.75c0-.621.504-1.125 1.125-1.125h.632c.621 0 1.125.504 1.125 1.125v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.024.217 1.464l-.69.825a1.125 1.125 0 0 1-1.667 0l-.69-.825a1.125 1.125 0 0 1 .217-1.464l1.068-.89a1.125 1.125 0 0 0 .405-.864v-.568A1.125 1.125 0 0 1 6.375 3.03h.632c.621 0 1.125.504 1.125 1.125v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.024.217 1.464l-.69.825a1.125 1.125 0 0 1-1.667 0l-.69-.825a1.125 1.125 0 0 1 .217-1.464l1.068-.89a1.125 1.125 0 0 0 .405-.864v-.568a1.125 1.125 0 0 1 1.125-1.125h.632A1.125 1.125 0 0 1 12.75 3.03z" /></svg>,
    challenges: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-6.75c-.622 0-1.125.504-1.125 1.125v3.375m9 0h-9m9-12.75h-9m9 0A2.25 2.25 0 0 0 12 3.75h-1.5A2.25 2.25 0 0 0 9 6v.375m-3.75 0h15M12 15.75v3" /></svg>,
    stats: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V5.25A2.25 2.25 0 0 0 18 3H6A2.25 2.25 0 0 0 3.75 5.25v12.75A2.25 2.25 0 0 0 6 20.25z" /></svg>,
    mind: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.375a6.375 6.375 0 1 1 0-12.75 6.375 6.375 0 0 1 0 12.75zM12 18.375a6.375 6.375 0 0 0-6.375-6.375M12 18.375a6.375 6.375 0 0 1-6.375-6.375m6.375 6.375v-6.375" /></svg>,
    settings: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.008 1.11-1.226a21.75 21.75 0 0 1 2.59 0c.55.218 1.02.684 1.11 1.226.09.542-.043 1.087-.386 1.517a21.75 21.75 0 0 1-4.518 0c-.343-.43-.476-.975-.386-1.517zM12 6.75c.995 0 1.954.162 2.872.463a21.75 21.75 0 0 1 4.518 0c.343.43.476.975.386 1.517-.09.542-.56 1.008-1.11 1.226a21.75 21.75 0 0 1-2.59 0c-.55-.218-1.02-.684-1.11-1.226-.09-.542.043-1.087.386-1.517a21.75 21.75 0 0 1 4.518 0c-.343-.43-.476-.975-.386-1.517a6.375 6.375 0 1 0-10.941 4.147A21.75 21.75 0 0 1 2.625 12c.343.43.476.975.386 1.517-.09.542-.56 1.008-1.11 1.226a21.75 21.75 0 0 1-2.59 0c-.55-.218-1.02-.684-1.11-1.226-.09-.542.043-1.087.386-1.517a21.75 21.75 0 0 1 4.518 0c.918-.301 1.877-.463 2.872-.463 3.524 0 6.375 2.851 6.375 6.375s-2.851 6.375-6.375 6.375-6.375-2.851-6.375-6.375c0-1.536.54-2.94 1.442-4.042" /></svg>,
    back: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>,
    plus: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
    badgeCheck: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" /></svg>,
};
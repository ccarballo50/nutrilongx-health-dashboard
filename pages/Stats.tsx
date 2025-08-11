import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, YAxis, CartesianGrid, Legend } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { AiTip } from '../components/AiTip';
import { Routine, Challenge } from '../types';

const formatDays = (totalDays: number): string => {
    if (totalDays < 0) return "0 días";

    const years = Math.floor(totalDays / 365);
    const remainingDaysAfterYears = totalDays % 365;
    const months = Math.floor(remainingDaysAfterYears / 30);
    const days = remainingDaysAfterYears % 30;

    const parts: string[] = [];
    if (years > 0) parts.push(`${years} ${years > 1 ? 'años' : 'año'}`);
    if (months > 0) parts.push(`${months} ${months > 1 ? 'meses' : 'mes'}`);
    if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);
    
    return parts.join(', ');
};

const mapRoutineCategory = (category: Routine['category']): 'Físico' | 'Mente' => {
  switch (category) {
    case 'Cardio':
    case 'Fuerza':
      return 'Físico';
    case 'Yoga':
      return 'Mente';
    default:
      return 'Físico';
  }
};

const mapChallengeCategory = (category: Challenge['category']): 'Físico' | 'Mente' | 'Alimentación' | null => {
    switch (category) {
        case 'Actividad física':
        case 'Pasos':
        case 'Entrenamiento':
            return 'Físico';
        case 'Nutrición':
            return 'Alimentación';
        case 'Sueño':
        case 'Meditación':
            return 'Mente';
        default:
            return null;
    }
};

const Stats: React.FC = () => {
    const { state } = useAppContext();
    if (!state.stats || !state.routines || !state.challenges) return <div>Cargando...</div>;
    
    const totalDVG = 12450;

    const habitStatsData = useMemo(() => {
        const stats: { [key: string]: { count: number, progressSum: number } } = {
            'Alimentación': { count: 0, progressSum: 0 },
            'Físico': { count: 0, progressSum: 0 },
            'Mente': { count: 0, progressSum: 0 },
        };

        state.routines.forEach(routine => {
            const category = mapRoutineCategory(routine.category);
            stats[category].count++;
            stats[category].progressSum += routine.progress;
        });

        state.challenges.forEach(challenge => {
            const category = mapChallengeCategory(challenge.category);
            if (category && (challenge.status === 'in-progress' || challenge.status === 'completed')) {
              stats[category].count++;
              stats[category].progressSum += challenge.progress;
            }
        });
        
        return Object.keys(stats).map(key => {
            const categoryData = stats[key as keyof typeof stats];
            const averageProgress = categoryData.count > 0 ? Math.round(categoryData.progressSum / categoryData.count) : 0;
            return {
                name: key,
                progreso: averageProgress,
            };
        });

    }, [state.routines, state.challenges]);


  return (
    <div className="p-4 pb-24 space-y-6 flex flex-col h-full">
        <div className="bg-green-100 p-4 rounded-xl text-center">
            <p className="text-sm text-green-800 uppercase tracking-wider font-semibold">Días de Vida Ganados</p>
            <p className="text-4xl font-bold text-green-900 my-1">{new Intl.NumberFormat('es-ES').format(totalDVG)}</p>
            <p className="text-md text-green-800">{formatDays(totalDVG)}</p>
        </div>

        <div>
            <h3 className="font-bold text-lg mb-2">Gráfico de Hábitos Saludables</h3>
            <p className="text-sm text-gray-500 mb-4">Progreso promedio de tus hábitos esta semana.</p>
            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={habitStatsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}}/>
                        <YAxis hide={false} axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} unit="%" domain={[0, 100]} />
                        <Tooltip cursor={{fill: 'rgba(230,230,230,0.5)'}} formatter={(value: number) => [`${value}%`, 'Progreso']}/>
                        <Legend wrapperStyle={{fontSize: "14px", paddingTop: '10px'}}/>
                        <Bar dataKey="progreso" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      
      <AiTip pageContext="Estadísticas" />
    </div>
  );
};

export default Stats;
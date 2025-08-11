import React from 'react';
import * as RRD from 'react-router-dom';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, YAxis } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { AiTip } from '../components/AiTip';
import { ICONS } from '../constants';

const Dashboard: React.FC = () => {
  const { state } = useAppContext();
  const { kpis, stats, user } = state;
  const navigate = RRD.useNavigate();

  if (!kpis || !stats || !user) return <div className="p-4">Cargando...</div>;
  
  const xpPercentage = (kpis.xp / kpis.maxXp) * 100;

  return (
    <div className="p-4 pb-24 space-y-4 flex flex-col h-full">
      <div className="text-left">
        <p className="text-gray-500">Nivel {kpis.level}</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 my-1">
          <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${xpPercentage}%` }}></div>
        </div>
        <p className="text-xs text-gray-500">{kpis.xp}/{kpis.maxXp} XP</p>
      </div>

      <div>
        <h3 className="font-bold text-lg">Objetivos</h3>
        <div className="flex space-x-2 mt-2">
          <span className="bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1 rounded-full">Perder peso</span>
          <span className="bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1 rounded-full">Ganar masa muscular</span>
        </div>
      </div>
      
      <div className="bg-green-100 p-3 rounded-lg">
        <h3 className="font-bold">Retos</h3>
        <p>Desafío de hidratación <span className="text-green-600 font-semibold">7 días restantes</span></p>
        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '76%' }}></div>
        </div>
      </div>

      <div 
        className="bg-blue-100 p-4 rounded-lg flex items-center space-x-4 cursor-pointer hover:bg-blue-200 transition-colors shadow-sm"
        onClick={() => navigate('/log-achievement')}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => e.key === 'Enter' && navigate('/log-achievement')}
        aria-label="Introducir un nuevo logro"
      >
        <ICONS.badgeCheck className="h-10 w-10 text-blue-600 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-blue-800">Introduce tus logros</h3>
          <p className="text-sm text-blue-700">Registra tus progresos y metas conseguidas.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-100 p-3 rounded-lg text-center">
            <p className="text-gray-500 text-sm">Calorías</p>
            <p className="font-bold text-xl">{kpis.calories}</p>
        </div>
        <div className="bg-gray-100 p-3 rounded-lg text-center">
            <p className="text-gray-500 text-sm">Proteínas</p>
            <p className="font-bold text-xl">{kpis.protein}g</p>
        </div>
        <div className="bg-gray-100 p-3 rounded-lg text-center col-span-2">
            <p className="text-gray-500 text-sm">Carbohidratos</p>
            <p className="font-bold text-xl">{kpis.carbs}g</p>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-lg">Estadísticas</h3>
        <p className="text-gray-600">Progreso semanal <span className="text-green-500 font-bold">+{kpis.weeklyProgress}%</span></p>
        <div className="h-32 mt-2">
           <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.weekly} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <YAxis hide={true} domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} dot={false} />
            </LineChart>
            </ResponsiveContainer>
        </div>
      </div>
      
      <AiTip pageContext="Dashboard" />
    </div>
  );
};

export default Dashboard;

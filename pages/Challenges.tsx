import React, { useState, useMemo } from 'react';
import * as RRD from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { AiTip } from '../components/AiTip';
import { Challenge } from '../types';

const categoryIcons: { [key: string]: string } = {
  'Actividad física': '🏃',
  'Nutrición': '🍎',
  'Sueño': '🌙',
  'Pasos': '👣',
  'Entrenamiento': '🏋️',
  'Meditación': '🧘',
};

const StatusBadge: React.FC<{ status: Challenge['status'] }> = ({ status }) => {
    const statusStyles = {
        'in-progress': { text: 'EN CURSO', color: 'bg-blue-100 text-blue-800' },
        'completed': { text: 'COMPLETADO', color: 'bg-green-100 text-green-800' },
        'not-completed': { text: 'NO LOGRADO', color: 'bg-red-100 text-red-800' },
        'not-started': { text: '', color: '' },
    };
    const style = statusStyles[status];

    if (!style.text) return null;

    return (
        <span className={`px-2 py-1 text-xs font-bold rounded-full ${style.color}`}>
            {style.text}
        </span>
    );
};

const ChallengeItem: React.FC<{ challenge: Challenge }> = ({ challenge }) => {
  const navigate = RRD.useNavigate();

  return (
    <div 
        className="flex items-center bg-white p-3 rounded-lg shadow-sm space-x-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => navigate(`/challenges/${challenge.id}`)}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => e.key === 'Enter' && navigate(`/challenges/${challenge.id}`)}
        aria-label={`Ver detalles del reto ${challenge.title}`}
    >
      <div className="bg-gray-100 w-12 h-12 flex items-center justify-center rounded-lg text-2xl flex-shrink-0">
        {categoryIcons[challenge.category] || '🎯'}
      </div>
      <div className="flex-grow">
        <p className="font-semibold text-gray-800">{challenge.title}</p>
        <p className="text-sm text-gray-500">{challenge.description} • <span className="font-bold text-green-600">+{challenge.dvg} DVG</span></p>
      </div>
      <StatusBadge status={challenge.status} />
    </div>
  );
};

type View = 'my_challenges' | 'explore';

const Challenges: React.FC = () => {
  const { state } = useAppContext();
  const [currentView, setCurrentView] = useState<View>('my_challenges');
  const [searchTerm, setSearchTerm] = useState('');

  const myChallenges = state.challenges.filter(c => c.status !== 'not-started');
  
  const exploreChallenges = useMemo(() => {
    return state.challenges.filter(c => 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [state.challenges, searchTerm]);

  return (
    <div className="p-4 pb-24 flex flex-col h-full">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={() => setCurrentView('my_challenges')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              currentView === 'my_challenges'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Mis Retos
          </button>
          <button
            onClick={() => setCurrentView('explore')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              currentView === 'explore'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Explorar Retos
          </button>
        </nav>
      </div>
      
      <div className="flex-grow overflow-y-auto pt-4 space-y-4">
        {currentView === 'my_challenges' && (
          <div className="space-y-3">
            {myChallenges.length > 0 ? (
                myChallenges.map(challenge => (
                    <ChallengeItem key={challenge.id} challenge={challenge} />
                ))
            ) : (
                <div className="text-center py-10 px-4">
                    <h3 className="text-lg font-semibold text-gray-800">No tienes retos activos</h3>
                    <p className="text-gray-500 mt-1">¡Ve a la sección "Explorar Retos" para unirte a uno!</p>
                </div>
            )}
          </div>
        )}

        {currentView === 'explore' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="🔍 Buscar reto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              aria-label="Buscar reto"
            />
            <div className="space-y-3">
                {exploreChallenges.map(challenge => (
                    <ChallengeItem key={challenge.id} challenge={challenge} />
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <AiTip pageContext="Retos" />
      </div>
    </div>
  );
};

export default Challenges;
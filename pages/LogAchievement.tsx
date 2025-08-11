import React, { useState, useMemo } from 'react';
import * as RRD from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Challenge, AchievementLog } from '../types';

type CategoryFilter = 'Físico' | 'Mental' | 'Alimentación' | 'Todos';

const challengeCategoryMap: { [key: string]: CategoryFilter } = {
  'Actividad física': 'Físico',
  'Entrenamiento': 'Físico',
  'Pasos': 'Físico',
  'Meditación': 'Mental',
  'Sueño': 'Mental',
  'Nutrición': 'Alimentación',
};

const LogAchievement: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const navigate = RRD.useNavigate();

  const [filter, setFilter] = useState<CategoryFilter>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [achieved, setAchieved] = useState<boolean>(true);
  const [comment, setComment] = useState('');
  
  const filteredChallenges = useMemo(() => {
    return state.challenges.filter(challenge => {
      const categoryMatch = filter === 'Todos' || challengeCategoryMap[challenge.category] === filter;
      const searchMatch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [state.challenges, filter, searchTerm]);

  const handleSelectChallenge = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
  };

  const handleSave = () => {
    if (!selectedChallenge) {
      alert('Por favor, selecciona un reto.');
      return;
    }

    const newLog: AchievementLog = {
      id: `ach_${Date.now()}`,
      challengeId: selectedChallenge.id,
      challengeTitle: selectedChallenge.title,
      achieved,
      comment,
      timestamp: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_ACHIEVEMENT_LOG', payload: newLog });
    
    navigate('/dashboard');
  };

  const filters: CategoryFilter[] = ['Todos', 'Físico', 'Mental', 'Alimentación'];

  return (
    <div className="p-4 pb-24 space-y-6">
      <div>
        <h3 className="font-bold text-lg mb-2">1. Selecciona un Reto</h3>
        <div className="space-y-3">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {filters.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${
                    filter === f
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="🔍 Buscar reto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              aria-label="Buscar reto"
            />
        </div>
      </div>
      
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {filteredChallenges.length > 0 ? filteredChallenges.map(challenge => (
          <div
            key={challenge.id}
            onClick={() => handleSelectChallenge(challenge)}
            className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
              selectedChallenge?.id === challenge.id
                ? 'bg-green-100 border-green-500'
                : 'bg-white border-transparent hover:border-gray-300'
            }`}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && handleSelectChallenge(challenge)}
            aria-pressed={selectedChallenge?.id === challenge.id}
          >
            <p className="font-semibold">{challenge.title}</p>
            <p className="text-sm text-gray-500">{challengeCategoryMap[challenge.category]}</p>
          </div>
        )) : (
            <p className="text-center text-gray-500 py-4">No se encontraron retos con esos criterios.</p>
        )}
      </div>

      {selectedChallenge && (
        <div className="bg-white p-4 rounded-lg shadow-sm space-y-4 animate-fade-in">
          <h3 className="font-bold text-lg mb-2">2. Completa los detalles</h3>
          <div>
              <p className="font-semibold text-gray-700 mb-2">Reto seleccionado:</p>
              <p className="text-gray-800 p-3 bg-gray-100 rounded-lg">{selectedChallenge.title}</p>
          </div>
          
          <fieldset>
            <legend className="font-semibold text-gray-700">¿Conseguido?</legend>
            <div className="mt-2 flex items-center space-x-4 p-2 bg-gray-100 rounded-lg">
                <button onClick={() => setAchieved(true)} className={`w-1/2 text-center font-bold py-2 rounded-md transition-colors ${achieved ? 'bg-green-500 text-white shadow' : 'bg-transparent text-gray-600'}`} aria-pressed={achieved}>Sí</button>
                <button onClick={() => setAchieved(false)} className={`w-1/2 text-center font-bold py-2 rounded-md transition-colors ${!achieved ? 'bg-red-500 text-white shadow' : 'bg-transparent text-gray-600'}`} aria-pressed={!achieved}>No</button>
            </div>
          </fieldset>

          <div>
            <label htmlFor="comment" className="font-semibold text-gray-700">Comentario (opcional)</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Añade una nota sobre tu logro..."
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg h-24 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
      )}
      
      <button
        onClick={handleSave}
        disabled={!selectedChallenge}
        className="w-full mt-4 bg-green-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Guardar Logro
      </button>

      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LogAchievement;

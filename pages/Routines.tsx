import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { AiTip } from '../components/AiTip';
import { Routine } from '../types';

type FilterType = 'Todos' | 'Cardio' | 'Fuerza' | 'Yoga';

const RoutineItem: React.FC<{ routine: Routine }> = ({ routine }) => {
  const { dispatch } = useAppContext();
  const handleComplete = () => {
    if (routine.status === 'pending') {
      dispatch({ type: 'COMPLETE_ROUTINE', payload: routine.id });
    }
  };

  const isCompleted = routine.status === 'completed';

  return (
    <div className={`flex items-center bg-white p-4 rounded-lg shadow-sm transition-all ${isCompleted ? 'opacity-70' : ''}`}>
      <div className="flex items-center flex-grow">
        <div className="w-16 h-16 bg-gray-200 rounded-lg mr-4 flex-shrink-0">
          <img src={`https://picsum.photos/seed/${routine.id}/100/100`} alt={routine.title} className="w-full h-full object-cover rounded-lg" />
        </div>
        <div className="flex-grow">
          <h4 className="font-bold text-gray-800">{routine.title}</h4>
          <p className="text-sm text-gray-500">{routine.duration} min • <span className="font-bold text-green-600">+{routine.dvg} DVG</span></p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${routine.progress}%` }}></div>
          </div>
        </div>
      </div>
      <button
        onClick={handleComplete}
        disabled={isCompleted}
        className={`ml-4 px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex-shrink-0 ${
          isCompleted
            ? 'bg-green-100 text-green-700 cursor-default'
            : 'bg-green-500 text-white hover:bg-green-600'
        }`}
      >
        {isCompleted ? 'Completada' : 'Completar'}
      </button>
    </div>
  );
};

const Routines: React.FC = () => {
  const { state } = useAppContext();
  const [activeFilter, setActiveFilter] = useState<FilterType>('Todos');

  const filters: FilterType[] = ['Todos', 'Cardio', 'Fuerza', 'Yoga'];

  const filteredRoutines = state.routines.filter(routine => 
    activeFilter === 'Todos' || routine.category === activeFilter
  );

  return (
    <div className="p-4 pb-24 space-y-4 flex flex-col h-full">
      <div>
        <div className="flex space-x-2">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                activeFilter === filter
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3 overflow-y-auto flex-grow">
        {filteredRoutines.map(routine => (
          <RoutineItem key={routine.id} routine={routine} />
        ))}
      </div>
      <AiTip pageContext="Rutinas" />
    </div>
  );
};

export default Routines;
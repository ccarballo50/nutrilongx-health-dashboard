import React from 'react';
import * as RRD from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ICONS } from '../constants';

const Welcome: React.FC = () => {
  const navigate = RRD.useNavigate();
  const { dispatch } = useAppContext();

  const handleStart = () => {
    dispatch({ type: 'LOGIN' });
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col h-full bg-white text-center p-6">
       <header className="flex items-center justify-between py-2">
            <h1 className="text-xl font-bold text-gray-800">NutrilongX</h1>
            <button className="text-gray-600">
                <ICONS.settings className="h-6 w-6" />
            </button>
        </header>
      <div className="flex-grow flex flex-col items-center justify-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">Bienvenido a NutrilongX</h2>
        <p className="text-gray-600 max-w-sm">
          Tu viaje hacia una vida más saludable comienza aquí. Descubre planes personalizados y seguimiento de bienestar.
        </p>
      </div>
      <div className="space-y-4">
        <button 
          onClick={handleStart}
          className="w-full bg-lime-500 text-white font-bold py-4 px-4 rounded-xl shadow-lg hover:bg-lime-600 transition-colors"
        >
          Empezar
        </button>
        <button 
          className="w-full bg-gray-200 text-gray-800 font-bold py-4 px-4 rounded-xl hover:bg-gray-300 transition-colors"
        >
          Iniciar Sesión
        </button>
      </div>
    </div>
  );
};

export default Welcome;

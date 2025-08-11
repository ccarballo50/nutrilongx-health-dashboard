import React from 'react';
import * as RRD from 'react-router-dom';
import { ICONS } from '../constants';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const navigate = RRD.useNavigate();
  const location = RRD.useLocation();

  const showBackButton = location.pathname !== '/dashboard';

  return (
    <header className="flex items-center justify-between p-4 bg-white sticky top-0 z-10">
      {showBackButton ? (
        <button onClick={() => navigate(-1)} className="text-gray-600">
          <ICONS.back className="h-6 w-6" />
        </button>
      ) : (
        <div className="w-6"></div> // Placeholder for alignment
      )}
      <h1 className="text-xl font-bold text-gray-800">{title}</h1>
       { location.pathname === '/welcome' || location.pathname === '/' ?  
          <button className="text-gray-600">
            <ICONS.settings className="h-6 w-6" />
          </button> : <div className="w-6"></div> // Placeholder for alignment
       }
    </header>
  );
};

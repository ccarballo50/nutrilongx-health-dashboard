import React from 'react';
import * as RRD from 'react-router-dom';
import { ICONS } from '../constants';

const navItems = [
  { path: '/dashboard', label: 'Menú', icon: ICONS.menu },
  { path: '/routines', label: 'Rutinas', icon: ICONS.routines },
  { path: '/challenges', label: 'Retos', icon: ICONS.challenges },
  { path: '/stats', label: 'Estadísticas', icon: ICONS.stats },
  { path: '/mind', label: 'Mente', icon: ICONS.mind },
];

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-t-sm z-50">
      <div className="flex justify-around max-w-lg mx-auto">
        {navItems.map(({ path, label, icon: Icon }) => (
          <RRD.NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full pt-2 pb-1 text-sm ${
                isActive ? 'text-green-500' : 'text-gray-500'
              }`
            }
          >
            <Icon className="h-6 w-6 mb-1" />
            <span>{label}</span>
          </RRD.NavLink>
        ))}
      </div>
    </nav>
  );
};

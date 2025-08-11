import React from 'react';
import * as RRD from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import Routines from './pages/Routines';
import Challenges from './pages/Challenges';
import ChallengeDetail from './pages/ChallengeDetail';
import Stats from './pages/Stats';
import Mind from './pages/Mind';
import LogAchievement from './pages/LogAchievement';
import { BottomNav } from './components/BottomNav';
import { Header } from './components/Header';

const titles: { [key: string]: string } = {
  '/dashboard': 'Bienestar',
  '/routines': 'Rutinas',
  '/challenges': 'Retos',
  '/stats': 'Estadísticas',
  '/mind': 'Mente',
  '/log-achievement': 'Registrar Logro',
};

const MainLayout: React.FC = () => {
    const location = RRD.useLocation();
    let title = 'NutrilongX';

    if (location.pathname.startsWith('/challenges/')) {
      title = 'Detalle del Reto';
    } else {
      title = titles[location.pathname] || 'NutrilongX';
    }
  
    return (
      <div className="max-w-lg mx-auto h-screen flex flex-col bg-gray-50 font-sans">
        <Header title={title} />
        <main className="flex-grow overflow-y-auto">
          <RRD.Outlet />
        </main>
        <BottomNav />
      </div>
    );
};

const PrivateRoute: React.FC = () => {
    const { state } = useAppContext();
    return state.isAuthenticated ? <MainLayout /> : <RRD.Navigate to="/welcome" replace />;
};

const AppRoutes: React.FC = () => {
    const { state } = useAppContext();

    return (
        <RRD.Routes>
            <RRD.Route path="/welcome" element={<div className="max-w-lg mx-auto h-screen flex flex-col bg-white"><Welcome /></div>} />
            <RRD.Route path="/" element={<PrivateRoute />}>
                <RRD.Route index element={<RRD.Navigate to="/dashboard" replace />} />
                <RRD.Route path="dashboard" element={<Dashboard />} />
                <RRD.Route path="routines" element={<Routines />} />
                <RRD.Route path="challenges" element={<Challenges />} />
                <RRD.Route path="challenges/:challengeId" element={<ChallengeDetail />} />
                <RRD.Route path="stats" element={<Stats />} />
                <RRD.Route path="mind" element={<Mind />} />
                <RRD.Route path="log-achievement" element={<LogAchievement />} />
            </RRD.Route>
            <RRD.Route path="*" element={<RRD.Navigate to={state.isAuthenticated ? "/dashboard" : "/welcome"} replace />} />
        </RRD.Routes>
    );
};


const App: React.FC = () => {
  return (
    <AppProvider>
      <RRD.HashRouter>
        <AppRoutes />
      </RRD.HashRouter>
    </AppProvider>
  );
};

export default App;
import React, { useState, useEffect } from 'react';
import { generateAdvice } from '../services/geminiService';
import { useAppContext } from '../context/AppContext';

interface AiTipProps {
  pageContext: string;
}

export const AiTip: React.FC<AiTipProps> = ({ pageContext }) => {
  const [tip, setTip] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { state } = useAppContext();

  useEffect(() => {
    const fetchAdvice = async () => {
      if (state.user && state.kpis) {
        setIsLoading(true);
        try {
          const advice = await generateAdvice(state.user, state.kpis, pageContext);
          setTip(advice);
        } catch (error) {
          console.error(error);
          setTip("No se pudo cargar el consejo. Inténtalo de nuevo.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchAdvice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageContext, state.user, state.kpis]);

  return (
    <div className="bg-gray-100 p-4 rounded-lg mt-auto">
      <h3 className="font-bold text-gray-800 text-sm mb-2">Consejo Personal de la IA</h3>
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-2 bg-gray-300 rounded w-full"></div>
          <div className="h-2 bg-gray-300 rounded w-5/6"></div>
          <div className="h-2 bg-gray-300 rounded w-3/4"></div>
        </div>
      ) : (
        <p className="text-gray-600 text-sm">
          {tip}
        </p>
      )}
    </div>
  );
};
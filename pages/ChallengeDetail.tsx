import React from 'react';
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

const ChallengeDetail: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { challengeId } = RRD.useParams<{ challengeId: string }>();
    const navigate = RRD.useNavigate();
    
    const challenge = state.challenges.find(c => c.id === challengeId);

    if (!challenge) {
        return <div className="p-4 text-center">Reto no encontrado.</div>;
    }

    const handleJoinChallenge = () => {
        dispatch({ type: 'JOIN_CHALLENGE', payload: challenge.id });
        navigate('/challenges');
    };

    const InfoPill: React.FC<{ label: string, value: string, icon: string }> = ({ label, value, icon }) => (
        <div className="bg-gray-100 p-3 rounded-lg flex items-center space-x-3">
            <span className="text-2xl">{icon}</span>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="font-semibold text-gray-800">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="p-4 pb-24 flex flex-col h-full">
            <div className="flex-grow space-y-6">
                <div className="flex items-center space-x-4">
                    <div className="bg-gray-100 w-16 h-16 flex items-center justify-center rounded-xl text-4xl flex-shrink-0">
                        {categoryIcons[challenge.category] || '🎯'}
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{challenge.category}</p>
                        <h1 className="text-2xl font-bold text-gray-900">{challenge.title}</h1>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <InfoPill label="Duración" value={challenge.durationText} icon="⏳" />
                    <InfoPill label="Recompensa" value={`+${challenge.dvg} DVG`} icon="❤️" />
                </div>

                <div>
                    <h2 className="font-bold text-lg text-gray-800 mb-2">¿En qué consiste?</h2>
                    <p className="text-gray-600 leading-relaxed">{challenge.fullDescription}</p>
                </div>

                {challenge.status === 'not-started' && (
                    <button
                        onClick={handleJoinChallenge}
                        className="w-full bg-green-500 text-white font-bold py-4 px-4 rounded-xl shadow-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        ¡ME APUNTO!
                    </button>
                )}
                 {challenge.status === 'in-progress' && (
                    <div className="w-full text-center bg-blue-100 text-blue-800 font-bold py-3 px-4 rounded-xl">
                        Reto en curso
                    </div>
                )}
                {challenge.status === 'completed' && (
                    <div className="w-full text-center bg-green-100 text-green-800 font-bold py-3 px-4 rounded-xl">
                        Reto completado
                    </div>
                )}
            </div>

            <div className="mt-4">
                <AiTip pageContext={`Detalle del Reto: ${challenge.title}`} />
            </div>
        </div>
    );
};

export default ChallengeDetail;
import React, { useState } from 'react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, YAxis } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { AiTip } from '../components/AiTip';
import { MindEntry } from '../types';

const moodOptions = {
    happy: { icon: '😊', color: 'bg-green-100', text: 'Feliz' },
    neutral: { icon: '😐', color: 'bg-yellow-100', text: 'Neutral' },
    sad: { icon: '😢', color: 'bg-blue-100', text: 'Triste' },
};

type MoodKey = keyof typeof moodOptions;

const JournalEntry: React.FC<{ entry: MindEntry }> = ({ entry }) => {
    const mood = moodOptions[entry.mood as MoodKey];
    return (
        <div className={`flex items-start p-3 rounded-lg space-x-3 ${mood.color}`}>
            <span className="text-2xl mt-1">{mood.icon}</span>
            <div className="flex-grow">
                 <p className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                <p className="text-gray-800 text-sm">{entry.text}</p>
            </div>
        </div>
    );
};


const Mind: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [comment, setComment] = useState('');
    const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);

    if (!state.mind) return <div>Cargando...</div>;

    const { sleep, stress, weeklySleep, journalEntries } = state.mind;

    const handleSaveEntry = () => {
        if (!comment.trim() || !selectedMood) {
            alert("Por favor, escribe cómo te sientes y selecciona un estado de ánimo.");
            return;
        }

        const newEntry: MindEntry = {
            id: `entry_${Date.now()}`,
            text: comment,
            mood: selectedMood,
            timestamp: new Date().toISOString(),
        };

        dispatch({ type: 'ADD_JOURNAL_ENTRY', payload: newEntry });

        // Reset form
        setComment('');
        setSelectedMood(null);
    };

    return (
        <div className="p-4 pb-24 space-y-4 flex flex-col h-full">
            <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-100 p-4 rounded-xl">
                        <p className="font-semibold text-blue-800">Sueño</p>
                        <p className="text-2xl font-bold text-blue-900">{sleep.duration}</p>
                        <p className={`text-sm font-semibold ${sleep.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {sleep.change > 0 ? '+' : ''}{sleep.change}%
                        </p>
                    </div>
                    <div className="bg-purple-100 p-4 rounded-xl">
                        <p className="font-semibold text-purple-800">Estrés</p>
                        <p className="text-2xl font-bold text-purple-900">{stress.level}</p>
                        <p className={`text-sm font-semibold ${stress.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {stress.change > 0 ? '+' : ''}{stress.change}%
                        </p>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-lg">Sueño Semanal</h3>
                    <div className="h-32 mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weeklySleep} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                                <YAxis hide={true} domain={['dataMin - 1', 'dataMax + 1']} />
                                <Tooltip />
                                <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-bold text-lg">Registro Diario</h3>
                    <p className="text-sm text-gray-500 mb-3">Tómate un momento para reflexionar.</p>
                    
                    <textarea 
                        className="w-full mt-2 p-3 border border-gray-300 rounded-lg h-24 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="¿Cómo te sientes hoy?"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        aria-label="Entrada de diario"
                    ></textarea>

                    <div className="mt-4">
                        <p className="font-semibold text-gray-700 mb-2 text-sm">¿Cuál es tu estado de ánimo?</p>
                        <div className="flex items-center justify-around gap-2">
                            {(Object.keys(moodOptions) as MoodKey[]).map(moodKey => (
                                <button 
                                    key={moodKey}
                                    onClick={() => setSelectedMood(moodKey)}
                                    className={`flex flex-col items-center p-2 rounded-lg w-1/3 transition-all duration-200 ${selectedMood === moodKey ? 'bg-green-200 ring-2 ring-green-500' : 'bg-gray-100 hover:bg-gray-200'}`}
                                    aria-pressed={selectedMood === moodKey}
                                    aria-label={`Seleccionar estado de ánimo ${moodOptions[moodKey].text}`}
                                >
                                    <span className="text-3xl">{moodOptions[moodKey].icon}</span>
                                    <span className="text-xs font-semibold text-gray-600 mt-1">{moodOptions[moodKey].text}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveEntry}
                        disabled={!comment.trim() || !selectedMood}
                        className="w-full mt-4 bg-green-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Guardar Registro
                    </button>
                </div>
                
                {journalEntries && journalEntries.length > 0 && (
                    <div>
                        <h3 className="font-bold text-lg mt-4 mb-2">Registros Anteriores</h3>
                        <div className="space-y-3">
                            {journalEntries.map(entry => (
                                <JournalEntry key={entry.id} entry={entry} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
      
            <AiTip pageContext="Mente" />
        </div>
    );
};

export default Mind;

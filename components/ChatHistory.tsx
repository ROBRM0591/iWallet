import React from 'react';
import { ChatBubbleLeftRightIcon } from './Icons';

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-black/20 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg text-white ${className}`}>
        {children}
    </div>
);

export const ChatHistory: React.FC = () => {
    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Asistente AI</h1>
            <GlassCard className="p-8">
                <div className="text-center">
                    <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto text-primary-400 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Asistente Financiero iWallet</h2>
                    <p className="text-gray-300">
                        Próximamente podrás chatear con tus finanzas. <br/>
                        Haz preguntas como "¿Cuánto gasté en comida este mes?" y obtén respuestas inteligentes.
                    </p>
                </div>
            </GlassCard>
        </div>
    );
};

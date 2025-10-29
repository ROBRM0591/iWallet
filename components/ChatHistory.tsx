import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AppData } from '../types';
import { GoogleGenAI } from '@google/genai';
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, SparklesIcon } from './Icons';
import { toDateKey } from './utils';

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-black/20 dark:backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/20 shadow-lg text-gray-900 dark:text-white ${className}`}>
        {children}
    </div>
);

const formatDataForAI = (data: AppData) => {
    const { concepts, categories, dailyExpenses, incomes, plannedExpenses, monthlyBudgets, savingsGoals } = data;
    
    const conceptMap = new Map(concepts.map(c => [c.id, c.name]));
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));

    const simplifiedData = {
        incomes: incomes.slice(-50).map(i => ({ amount: i.amount, date: i.date.split('T')[0], description: i.description })),
        dailyExpenses: dailyExpenses.slice(-100).map(d => ({ amount: d.amount, date: d.date.split('T')[0], concept: conceptMap.get(d.conceptId) || 'Concepto Desconocido' })),
        plannedExpenses: plannedExpenses.map(p => ({
            concept: conceptMap.get(p.conceptId) || 'Concepto Desconocido',
            amountPerPeriod: p.amountPerPeriod,
            frequency: p.frequency,
            payments: p.payments.slice(-12).map(pm => ({ amount: pm.amount, date: pm.date.split('T')[0], period: pm.period })),
        })),
        monthlyBudgets: monthlyBudgets.map(b => ({ category: categoryMap.get(b.categoryId) || 'Categoría Desconocida', amount: b.amount })),
        savingsGoals: savingsGoals.map(g => ({ name: g.name, targetAmount: g.targetAmount, currentAmount: g.currentAmount, deadline: g.deadline.split('T')[0] })),
    };

    return JSON.stringify(simplifiedData, null, 2);
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export const ChatHistory: React.FC = () => {
    const { appData } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: '¡Hola! Soy tu asistente financiero. Puedes preguntarme sobre tus gastos, ingresos, presupuestos y más. Por ejemplo: "¿Cuánto gasté en comida este mes?" o "¿Cuál es mi próximo gasto planificado a vencer?"' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !appData) return;

        const userMessage = { role: 'user' as const, content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const dataContext = formatDataForAI(appData);
            
            const prompt = `
                Actúa como un asistente financiero experto para la aplicación 'iWallet'. Tu nombre es 'Asistente iWallet'.
                Tu tarea es analizar los datos financieros del usuario (en formato JSON) y responder a sus preguntas de manera clara, concisa y amigable.
                Tus respuestas DEBEN basarse únicamente en los datos proporcionados. Si la información no está en los datos, indica que no tienes acceso a esa información.
                La fecha actual es ${toDateKey(new Date())}.
                Todas las cantidades monetarias están en Pesos Mexicanos (MXN).
                Al responder, sé directo y útil. Si es apropiado, puedes usar listas de viñetas. Tu respuesta debe estar en español.

                DATOS FINANCIEROS DEL USUARIO (extracto reciente):
                ${dataContext}

                PREGUNTA DEL USUARIO:
                "${input}"
            `;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const assistantMessage = { role: 'assistant' as const, content: response.text };
            setMessages(prev => [...prev, assistantMessage]);

        } catch (error) {
            console.error("Error al llamar a la API de Gemini:", error);
            const errorMessage = { role: 'assistant' as const, content: 'Lo siento, no pude procesar tu solicitud en este momento. Por favor, revisa tu conexión e inténtalo de nuevo más tarde.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Asistente AI</h1>
            <GlassCard className="h-[70vh] flex flex-col p-4">
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                                    <SparklesIcon className="w-5 h-5 text-primary-500" />
                                </div>
                            )}
                            <div className={`max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-black/20 rounded-bl-none'}`}>
                                <p className="text-sm" style={{whiteSpace: "pre-wrap"}}>{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                                <SparklesIcon className="w-5 h-5 text-primary-500 animate-pulse" />
                            </div>
                            <div className="max-w-md p-3 rounded-2xl bg-gray-100 dark:bg-black/20 rounded-bl-none">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="mt-4 border-t border-gray-200 dark:border-white/20 pt-4">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Pregúntale a tu asistente financiero..."
                            className="flex-1 w-full px-4 py-2 rounded-full shadow-sm"
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !input.trim()} className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-3 shadow-lg transition-transform hover:scale-110 disabled:bg-primary-400 disabled:scale-100">
                            <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </GlassCard>
        </div>
    );
};
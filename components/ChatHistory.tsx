import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AppData } from '../types';
import { GoogleGenAI } from '@google/genai';
import { PaperAirplaneIcon, SparklesIcon, ClipboardIcon, CheckIcon } from './Icons';
import { toDateKey } from './utils';

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-2xl border border-white/30 dark:border-slate-700/80 shadow-2xl text-gray-900 dark:text-white ${className}`}>
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

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const renderInline = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*|__.*?__)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('__') && part.endsWith('__')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    const blocks = content.split('\n\n');

    const elements = blocks.flatMap((block, blockIndex) => {
        const lines = block.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) return [];

        // Check for table
        if (lines.length > 1 && lines.every(l => l.trim().startsWith('|'))) {
            const headerLine = lines[0];
            const separatorLine = lines[1];
            if (!separatorLine.includes('---')) return [<p key={blockIndex}>{renderInline(block)}</p>];

            const headers = headerLine.trim().slice(1, -1).split('|').map(h => h.trim());
            const rows = lines.slice(2).map((rowLine, rowIndex) => {
                const cells = rowLine.trim().slice(1, -1).split('|').map(c => c.trim());
                return (
                    <tr key={rowIndex} className="border-b border-gray-300 dark:border-slate-600">
                        {cells.map((cell, cellIndex) => <td key={cellIndex} className="p-2">{renderInline(cell)}</td>)}
                    </tr>
                );
            });

            return [(
                <div key={blockIndex} className="my-3 overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b-2 border-gray-400 dark:border-slate-500">
                                {headers.map((header, headerIndex) => <th key={headerIndex} className="p-2 font-semibold">{renderInline(header)}</th>)}
                            </tr>
                        </thead>
                        <tbody>{rows}</tbody>
                    </table>
                </div>
            )];
        }

        // Check for lists (can be multiline)
        if (lines.every(l => l.trim().startsWith('* ') || l.trim().startsWith('- '))) {
            const listItems = lines.map((line, i) => <li key={i}>{renderInline(line.trim().substring(2))}</li>);
            return [<ul key={blockIndex} className="list-disc list-inside space-y-1 my-2 pl-4">{listItems}</ul>];
        }
        if (lines.every(l => l.trim().match(/^\d+\.\s/))) {
            const listItems = lines.map((line, i) => <li key={i}>{renderInline(line.trim().replace(/^\d+\.\s/, ''))}</li>);
            return [<ol key={blockIndex} className="list-decimal list-inside space-y-1 my-2 pl-4">{listItems}</ol>];
        }

        // Default to paragraphs for the block
        const paragraphs = block.split('\n').map((line, lineIndex) => (
            <p key={lineIndex}>{renderInline(line)}</p>
        ));
        return paragraphs;
    });

    return <div className="text-sm space-y-3">{elements}</div>;
};

interface AIAssistantProps {
    isOpen: boolean;
}

export const ChatHistory: React.FC<AIAssistantProps> = ({ isOpen }) => {
    const { appData } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: '¡Hola! Soy tu asistente financiero. Puedes preguntarme sobre tus gastos, ingresos, presupuestos y más.\nPor ejemplo:\n* ¿Cuánto gasté en comida este mes?\n* ¿Cuál es mi próximo gasto planificado a vencer?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [isOpen, messages]);

    const handleCopy = (content: string, index: number) => {
        navigator.clipboard.writeText(content).then(() => {
            setCopiedMessageId(`msg-${index}`);
            setTimeout(() => setCopiedMessageId(null), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

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

                **REGLAS DE FORMATO IMPORTANTES:**
                1.  **Moneda:** TODAS las cantidades monetarias deben estar en Pesos Mexicanos (MXN). Usa el formato "$1,234.56 MXN".
                2.  **Tablas y Listas:** Cuando presentes datos tabulares (como una lista de gastos con montos y fechas), USA tablas de Markdown para una visualización clara. Para otros desgloses, usa listas de viñetas (*).
                3.  **Idioma:** Tu respuesta debe estar completamente en español.
                4.  **Markdown:** Usa formato markdown simple (listas con *, negritas con **, tablas).

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

    if (!isOpen) {
        return null;
    }
    
    return (
        <div className="fixed bottom-36 right-4 md:bottom-24 md:right-6 z-40 w-[calc(100vw-2rem)] max-w-sm md:max-w-md lg:max-w-lg h-[65vh] md:h-[70vh] max-h-[520px] md:max-h-[700px] animate-fadeInUp">
            <GlassCard className="h-full flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-white/10">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-primary-500" />
                        Asistente AI
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                                    <SparklesIcon className="w-5 h-5 text-primary-500" />
                                </div>
                            )}
                            <div className={`relative max-w-md p-3 rounded-2xl group ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-slate-200/50 dark:bg-slate-800/50 rounded-bl-none'}`}>
                                {msg.role === 'assistant' ? (
                                    <MarkdownRenderer content={msg.content} />
                                ) : (
                                    <p className="text-sm">{msg.content}</p>
                                )}
                                {msg.role === 'assistant' && (
                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleCopy(msg.content, index)} 
                                            className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-slate-700 transition"
                                            aria-label="Copiar respuesta"
                                        >
                                            {copiedMessageId === `msg-${index}` ? (
                                                <CheckIcon className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <ClipboardIcon className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                                <SparklesIcon className="w-5 h-5 text-primary-500 animate-pulse" />
                            </div>
                            <div className="max-w-md p-3 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 rounded-bl-none">
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
                <div className="mt-auto border-t border-gray-200 dark:border-white/20 p-4">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Pregúntale a tu asistente..."
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
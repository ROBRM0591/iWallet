import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DailyExpense, Concept, MovementTypeName } from '../types';
import { generateSequentialId } from './utils';
import { DeleteIcon, WarningIcon, CheckCircleIcon } from './Icons';
import { CalendarGrid } from './CalendarGrid';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-black/20 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg text-white ${className}`}>
        {children}
    </div>
);

const ConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}> = ({ isOpen, onClose, onConfirm, title, message }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-800 border border-white/20 rounded-2xl shadow-2xl w-full max-w-md m-4 transform transition-all text-center p-6 text-white">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50">
                    <WarningIcon className="h-6 w-6 text-red-300" />
                </div>
                <h3 className="text-lg leading-6 font-bold mt-4">{title}</h3>
                <div className="mt-2">
                    <p className="text-sm text-gray-400">{message}</p>
                </div>
                <div className="mt-6 flex justify-center gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-600 hover:bg-gray-500 text-gray-200 font-bold py-2 px-4 rounded-lg transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => { onConfirm(); onClose(); }}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

const SuccessToast: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
}> = ({ isOpen, onClose, title, message }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    return (
        <div
            className={`fixed bottom-4 left-4 z-50 w-full max-w-sm transition-all duration-300 ease-in-out ${
                isOpen ? 'transform translate-y-0 opacity-100' : 'transform translate-y-4 opacity-0'
            }`}
        >
            {isOpen && (
                 <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl p-4 flex items-start gap-4 text-white">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-900/50 flex items-center justify-center">
                       <CheckCircleIcon className="h-6 w-6 text-green-300" />
                    </div>
                    <div className="flex-grow">
                        <p className="font-bold">{title}</p>
                        <p className="text-sm text-gray-300">{message}</p>
                    </div>
                     <button onClick={onClose} className="text-gray-400 hover:text-gray-200">&times;</button>
                </div>
            )}
        </div>
    );
};

export const DailyExpenses: React.FC = () => {
    const { appData: data, setData } = useAuth();
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayISO = today.toISOString().split('T')[0];
    
    const [formState, setFormState] = useState({ conceptId: '', amount: 0, date: todayISO });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [successInfo, setSuccessInfo] = useState<{ title: string; message: string } | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(today);
    const [calendarDate, setCalendarDate] = useState(new Date());

    useEffect(() => {
        if (selectedDate) {
            setFormState(prev => ({...prev, date: selectedDate.toISOString().split('T')[0]}));
        }
    }, [selectedDate]);

    if (!data) return <div className="text-white">Cargando...</div>;

    const movGastoId = useMemo(() => data.movementTypes.find(m => m.name === MovementTypeName.GASTO)?.id, [data.movementTypes]);
    const diarioCostTypeId = useMemo(() => data.costTypes.find(ct => ct.name === 'Diario')?.id, [data.costTypes]);
    const expenseConcepts = useMemo(() => {
        return data.concepts.filter(c => c.movementTypeId === movGastoId && c.costTypeId === diarioCostTypeId);
    }, [data.concepts, movGastoId, diarioCostTypeId]);

    const { expensesByDate } = useMemo(() => {
        const expenseMap = new Map<string, DailyExpense[]>();
        
        data.dailyExpenses.forEach(expense => {
            const expenseDate = new Date(expense.date);
            const dateKey = expenseDate.toISOString().split('T')[0];

            if (!expenseMap.has(dateKey)) expenseMap.set(dateKey, []);
            expenseMap.get(dateKey)!.push(expense);
        });
        
        return { expensesByDate: expenseMap };
    }, [data.dailyExpenses]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        if (!formState.conceptId) newErrors.conceptId = 'Debe seleccionar un concepto.';
        if (formState.amount <= 0) newErrors.amount = 'El monto debe ser mayor a 0.';
        if (!formState.date) newErrors.date = 'La fecha es requerida.';
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const newExpense: DailyExpense = {
            id: generateSequentialId('GD', data.dailyExpenses),
            conceptId: formState.conceptId,
            amount: formState.amount,
            date: new Date(formState.date).toISOString()
        };
        setData({ ...data, dailyExpenses: [...data.dailyExpenses, newExpense] });
        setFormState({ conceptId: '', amount: 0, date: formState.date });
        setErrors({});
        setSuccessInfo({ title: 'Éxito', message: 'Gasto diario registrado correctamente.' });
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (!deleteId) return;
        setData({ ...data, dailyExpenses: data.dailyExpenses.filter(e => e.id !== deleteId) });
        setDeleteId(null);
    };

    const renderDayCell = useCallback((date: Date) => {
        const today = new Date();
        today.setHours(0,0,0,0);
        date.setHours(0,0,0,0);

        const dateKey = date.toISOString().split('T')[0];
        const hasExpenses = expensesByDate.has(dateKey);
        
        const isSelected = selectedDate ? date.getTime() === selectedDate.getTime() : false;
        const isToday = date.getTime() === today.getTime();

        let cellClass = "relative flex flex-col items-center justify-center h-20 w-full rounded-lg cursor-pointer transition-colors hover:bg-white/10";
        if (isSelected) cellClass += " bg-primary-700/80";
        else if (isToday) cellClass += " ring-2 ring-primary-500";
        
        return (
            <div className={cellClass}>
                <span>{date.getDate()}</span>
                {hasExpenses && <div className="absolute bottom-2 w-2 h-2 rounded-full bg-red-500"></div>}
            </div>
        );
    }, [selectedDate, expensesByDate]);

    const selectedDayExpenses = useMemo(() => {
        if (!selectedDate) return [];
        const dateKey = selectedDate.toISOString().split('T')[0];
        return expensesByDate.get(dateKey) || [];
    }, [selectedDate, expensesByDate]);

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">Gastos Diarios</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <CalendarGrid 
                        currentDate={calendarDate}
                        onDateClick={(date) => setSelectedDate(date)}
                        renderDay={renderDayCell}
                        onPrevMonth={() => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                        onNextMonth={() => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                    />
                </div>

                <GlassCard className="p-4 flex flex-col">
                    <h3 className="text-lg font-bold mb-4">{selectedDate ? selectedDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long'}) : 'Selecciona un día'}</h3>
                    <div className="flex-grow overflow-y-auto pr-2 space-y-2 mb-4">
                        {selectedDayExpenses.length > 0 ? selectedDayExpenses.map(exp => (
                            <div key={exp.id} className="p-2 bg-black/20 rounded-lg flex justify-between items-center">
                                <span className="text-sm font-medium">{expenseConcepts.find(c => c.id === exp.conceptId)?.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-red-400">{formatCurrency(exp.amount)}</span>
                                    <button onClick={() => handleDelete(exp.id)} className="text-gray-500 hover:text-red-400"><DeleteIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                        )) : <p className="text-gray-400 text-center text-sm pt-4">No hay gastos para este día.</p>}
                    </div>
                     <form onSubmit={handleSubmit} className="space-y-3 border-t border-white/20 pt-4">
                         <h4 className="font-bold text-md">Añadir Gasto para este día</h4>
                        <div>
                            <select value={formState.conceptId} onChange={e => setFormState(s => ({...s, conceptId: e.target.value}))} className="block w-full rounded-md shadow-sm">
                                <option value="">Seleccione un concepto</option>
                                {expenseConcepts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            {errors.conceptId && <p className="text-red-400 text-xs mt-1">{errors.conceptId}</p>}
                        </div>
                        <div>
                            <input type="number" step="0.01" placeholder="Monto" value={formState.amount || ''} onChange={e => setFormState(s => ({...s, amount: parseFloat(e.target.value)}))} className="block w-full rounded-md shadow-sm" />
                            {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount}</p>}
                        </div>
                        <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">
                            Registrar Gasto
                        </button>
                    </form>
                </GlassCard>
            </div>

            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que quieres eliminar este gasto diario? Esta acción no se puede deshacer."
            />
            <SuccessToast 
                isOpen={!!successInfo}
                onClose={() => setSuccessInfo(null)}
                title={successInfo?.title || ''}
                message={successInfo?.message || ''}
            />
        </div>
    );
};
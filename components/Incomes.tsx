import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Income, MovementTypeName } from '../types';
import { generateSequentialId, toDateKey, generatePeriods } from './utils';
import { DeleteIcon, WarningIcon, CheckCircleIcon, ListBulletIcon, EditIcon, PlusIcon, CloseIcon, TrendingUpIcon, TrendingDownIcon, WalletIcon, ClockIcon } from './Icons';
import { CalendarGrid } from './CalendarGrid';
import { CalendarIcon } from './PlannedExpenses';
import { PREDEFINED_ICONS } from './IconDisplay';
import { IconDisplay } from './IconDisplay';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

const months = [
    { value: 0, label: 'Enero' }, { value: 1, label: 'Febrero' }, { value: 2, label: 'Marzo' },
    { value: 3, label: 'Abril' }, { value: 4, label: 'Mayo' }, { value: 5, label: 'Junio' },
    { value: 6, label: 'Julio' }, { value: 7, label: 'Agosto' }, { value: 8, label: 'Septiembre' },
    { value: 9, label: 'Octubre' }, { value: 10, label: 'Noviembre' }, { value: 11, label: 'Diciembre' }
];

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/90 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg text-gray-900 dark:text-white ${className}`}>
        {children}
    </div>
);

const SummaryCard: React.FC<{
    title: string;
    amount: number;
    icon: React.ReactElement<{ className?: string }>;
    colors: {
        iconBg: string;
        iconText: string;
    };
}> = ({ title, amount, icon, colors }) => (
    <GlassCard className="p-4 animate-fadeInUp">
        <div className="flex items-center space-x-3">
            <div className={`rounded-lg p-2 ${colors.iconBg}`}>
                {React.cloneElement(icon, { className: `w-6 h-6 ${colors.iconText}` })}
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        </div>
        <div className="mt-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(amount)}</p>
        </div>
    </GlassCard>
);


const Modal: React.FC<{ isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border border-slate-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all animate-fadeInUp">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-white/20">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};


const IncomeForm: React.FC<{
    item: Partial<Income> | null;
    incomeConcepts: any[];
    onSave: (item: Income) => void;
    onCancel: () => void;
    initialDate?: string;
}> = ({ item, incomeConcepts, onSave, onCancel, initialDate }) => {
    const [formState, setFormState] = useState({
        conceptId: '',
        amount: 0,
        date: toDateKey(new Date()),
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        let conceptIdToSet = item?.conceptId || '';
        if (!conceptIdToSet && item?.description) {
            const concept = incomeConcepts.find(c => c.name === item.description);
            if (concept) {
                conceptIdToSet = concept.id;
            }
        }
        setFormState({
            conceptId: conceptIdToSet,
            amount: item?.amount || 0,
            date: item?.date ? toDateKey(new Date(item.date)) : initialDate || toDateKey(new Date()),
        });
    }, [item, incomeConcepts, initialDate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        if (!formState.conceptId) newErrors.conceptId = 'El concepto es requerido.';
        if (formState.amount <= 0) newErrors.amount = 'El monto debe ser mayor a 0.';
        if (!formState.date) newErrors.date = 'La fecha es requerida.';
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        const concept = incomeConcepts.find(c => c.id === formState.conceptId);

        onSave({
            ...item,
            id: item?.id || '',
            conceptId: formState.conceptId,
            description: concept ? concept.name : 'Ingreso',
            amount: formState.amount,
            date: new Date(`${formState.date}T00:00:00`).toISOString()
        } as Income);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium">Concepto</label>
                <select 
                  value={formState.conceptId} 
                  onChange={e => setFormState(s => ({ ...s, conceptId: e.target.value }))} 
                  className="mt-1 block w-full rounded-md shadow-sm"
                >
                    <option value="">Seleccione un concepto...</option>
                    {incomeConcepts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.conceptId && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.conceptId}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Monto</label>
                    <input type="number" step="0.01" placeholder="Monto" value={formState.amount || ''} onChange={e => setFormState(s => ({ ...s, amount: parseFloat(e.target.value) }))} className="mt-1 block w-full rounded-md shadow-sm" />
                    {errors.amount && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.amount}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium">Fecha</label>
                    <input type="date" value={formState.date} onChange={e => setFormState(s => ({ ...s, date: e.target.value }))} className="mt-1 block w-full rounded-md shadow-sm" />
                    {errors.date && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.date}</p>}
                </div>
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">
                    {item?.id ? 'Guardar Cambios' : 'Registrar Ingreso'}
                </button>
            </div>
        </form>
    );
};


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
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-md m-4 transform transition-all text-center p-6 text-gray-900 dark:text-white">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50">
                    <WarningIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
                </div>
                <h3 className="text-lg leading-6 font-bold mt-4">{title}</h3>
                <div className="mt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
                </div>
                <div className="mt-6 flex justify-center gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg transition"
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
            className={`success-toast-container transition-all duration-300 ease-in-out ${
                isOpen ? 'transform translate-y-0 opacity-100' : 'transform translate-y-4 opacity-0'
            }`}
        >
            {isOpen && (
                 <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-xl shadow-2xl p-4 flex items-start gap-4 text-gray-900 dark:text-white">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                       <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
                    </div>
                    <div className="flex-grow">
                        <p className="font-bold">{title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
                    </div>
                     <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">&times;</button>
                </div>
            )}
        </div>
    );
};

export const Incomes: React.FC = () => {
    const { appData: data, setData, userProfile } = useAuth();
    const [view, setView] = useState<'calendar' | 'list'>('calendar');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Income | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [successInfo, setSuccessInfo] = useState<{ title: string; message: string } | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [calendarDate, setCalendarDate] = useState(new Date());

    const getSummaryCardName = (card: string, defaultName: string) => userProfile?.summaryCardNames?.[card] || defaultName;

    useEffect(() => {
        if (!selectedDate && view === 'calendar') {
            const today = new Date();
            today.setHours(0,0,0,0);
            setSelectedDate(today);
        }
    }, [selectedDate, view]);

    if (!data) return <div className="text-center">Cargando...</div>;
    
    const { summary } = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const periodIncome = data.incomes
            .filter(i => { const d = new Date(i.date); return d >= startOfMonth && d <= endOfMonth; })
            .reduce((sum, i) => sum + Number(i.amount), 0);

        const periodDailyExpenses = data.dailyExpenses
            .filter(e => { const d = new Date(e.date); return d >= startOfMonth && d <= endOfMonth; })
            .reduce((sum, e) => sum + Number(e.amount), 0);

        const periodPaidPlannedExpenses = data.plannedExpenses.reduce((sum, expense) => sum + (expense.payments || [])
                .filter(p => { const d = new Date(p.date); return d >= startOfMonth && d <= endOfMonth; })
                .reduce((pSum, p) => pSum + Number(p.amount), 0), 0);

        const periodExpenses = periodDailyExpenses + periodPaidPlannedExpenses;
        const periodBalance = periodIncome - periodExpenses;

        const periodStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        const totalPlannedForMonth = data.plannedExpenses.reduce((sum, pe) => {
            const amountForPeriod = generatePeriods(pe).includes(periodStr) ? (pe.periodOverrides?.[periodStr] ?? pe.amountPerPeriod) : 0;
            return sum + Number(amountForPeriod);
        }, 0);

        const paidOnPlannedForMonth = data.plannedExpenses.reduce((sum, pe) => {
            return sum + (pe.payments || [])
                .filter(p => p.period === periodStr)
                .reduce((pSum, p) => pSum + Number(p.amount), 0);
        }, 0);
        
        const pendingInPeriod = totalPlannedForMonth - paidOnPlannedForMonth;

        const summary = { periodIncome, periodExpenses, periodBalance, pendingInPeriod };

        return { summary };

    }, [data]);

    const incomeConcepts = useMemo(() => {
        if (!data) return [];
        const ingresoMovementType = data.movementTypes.find(m => m.name === MovementTypeName.INGRESO);
        if (!ingresoMovementType) return [];
        return data.concepts.filter(c => c.movementTypeId === ingresoMovementType.id);
    }, [data]);

    const incomeIconName = userProfile?.summaryCardIcons?.income || 'trending-up';
    const IncomeIconComponent = PREDEFINED_ICONS[incomeIconName]?.icon || TrendingUpIcon;

    const expenseIconName = userProfile?.summaryCardIcons?.expenses || 'trending-down';
    const ExpenseIconComponent = PREDEFINED_ICONS[expenseIconName]?.icon || TrendingDownIcon;

    const balanceIconName = userProfile?.summaryCardIcons?.balance || 'wallet';
    const BalanceIconComponent = PREDEFINED_ICONS[balanceIconName]?.icon || WalletIcon;

    const pendingIconName = userProfile?.summaryCardIcons?.pending || 'clock';
    const PendingIconComponent = PREDEFINED_ICONS[pendingIconName]?.icon || ClockIcon;


    const { incomesByDate, monthIncomes } = useMemo(() => {
        const incomeMap = new Map<string, Income[]>();
        
        data.incomes.forEach(income => {
            const incomeDate = new Date(income.date);
            const dateKey = toDateKey(incomeDate);

            if (!incomeMap.has(dateKey)) incomeMap.set(dateKey, []);
            incomeMap.get(dateKey)!.push(income);
        });

        const startOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
        const endOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        const monthIncomes = data.incomes
            .filter(inc => {
                const incDate = new Date(inc.date);
                return incDate >= startOfMonth && incDate <= endOfMonth;
            })
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        return { incomesByDate: incomeMap, monthIncomes };
    }, [data.incomes, calendarDate]);

    const handleOpenModal = (item: Income | null = null) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingItem(null);
        setIsModalOpen(false);
    };

    const handleSave = (item: Income) => {
        let newIncomes;
        if (item.id) { // Editing existing
            newIncomes = data.incomes.map(i => i.id === item.id ? item : i);
        } else { // Adding new
            newIncomes = [...data.incomes, { ...item, id: generateSequentialId('IN', data.incomes) }];
        }
        setData({ ...data, incomes: newIncomes });
        setSuccessInfo({ title: 'Éxito', message: `Ingreso ${item.id ? 'actualizado' : 'registrado'} correctamente.` });
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (!deleteId) return;
        setData({ ...data, incomes: data.incomes.filter(e => e.id !== deleteId) });
        setDeleteId(null);
    };

    const renderDayCell = useCallback((date: Date) => {
        const today = new Date();
        today.setHours(0,0,0,0);
        date.setHours(0,0,0,0);

        const dateKey = toDateKey(date);
        const hasIncomes = incomesByDate.has(dateKey);
        
        const isSelected = selectedDate ? date.getTime() === selectedDate.getTime() : false;
        const isToday = date.getTime() === today.getTime();

        let cellClass = "relative flex flex-col items-center justify-center h-20 w-full rounded-lg cursor-pointer transition-colors hover:bg-gray-200 dark:hover:bg-white/10";
        if (isSelected) cellClass += " bg-primary-600/80 dark:bg-primary-700/80 text-white";
        else if (isToday) cellClass += " ring-2 ring-primary-500";
        
        return (
            <div className={cellClass}>
                <span>{date.getDate()}</span>
                {hasIncomes && <div className="absolute bottom-2 w-2 h-2 rounded-full bg-green-500"></div>}
            </div>
        );
    }, [selectedDate, incomesByDate]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold">Ingresos</h1>
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-gray-200 dark:bg-black/20 flex items-center">
                        <button onClick={() => setView('calendar')} className={`p-1.5 rounded-md ${view === 'calendar' ? 'bg-primary-600 text-white' : ''}`}><CalendarIcon className="w-5 h-5"/></button>
                        <button onClick={() => setView('list')} className={`p-1.5 rounded-md ${view === 'list' ? 'bg-primary-600 text-white' : ''}`}><ListBulletIcon className="w-5 h-5"/></button>
                    </div>
                    <button onClick={() => handleOpenModal()} className="flex-shrink-0 flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">
                        <PlusIcon className="w-5 h-5" /> Añadir Ingreso
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard title={`${getSummaryCardName('income', "Ingresos")} del Mes`} amount={summary.periodIncome} icon={<IncomeIconComponent />} colors={{ iconBg: 'bg-emerald-100 dark:bg-emerald-900/50', iconText: 'text-emerald-600 dark:text-emerald-400' }} />
                <SummaryCard title={`${getSummaryCardName('expenses', "Gastos")} del Mes`} amount={summary.periodExpenses} icon={<ExpenseIconComponent />} colors={{ iconBg: 'bg-red-100 dark:bg-red-900/50', iconText: 'text-red-600 dark:text-red-400' }} />
                <SummaryCard title={`${getSummaryCardName('balance', "Disponible")} del Mes`} amount={summary.periodBalance} icon={<BalanceIconComponent />} colors={{ iconBg: 'bg-blue-100 dark:bg-blue-900/50', iconText: 'text-blue-600 dark:text-blue-400' }} />
                <SummaryCard title={`${getSummaryCardName('pending', "Pendiente")} del Mes`} amount={summary.pendingInPeriod} icon={<PendingIconComponent />} colors={{ iconBg: 'bg-amber-100 dark:bg-amber-900/50', iconText: 'text-amber-600 dark:text-amber-400' }} />
            </div>

            {view === 'calendar' ? (
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
                        <h3 className="text-lg font-bold mb-4">Ingresos de {months[calendarDate.getMonth()].label}</h3>
                        <div className="flex-grow overflow-y-auto pr-2 space-y-2 mb-4">
                            {monthIncomes.length > 0 ? monthIncomes.map(inc => (
                                <div key={inc.id} className="p-2 bg-gray-100 dark:bg-black/20 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium">{data.concepts.find(c => c.id === inc.conceptId)?.name || inc.description}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(inc.date).toLocaleDateString('es-MX', {day: '2-digit', month: 'short'})}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-green-500 dark:text-green-400">{formatCurrency(inc.amount)}</span>
                                        <button onClick={() => handleOpenModal(inc)} className="text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400"><EditIcon className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(inc.id)} className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"><DeleteIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            )) : <p className="text-gray-500 dark:text-gray-400 text-center text-sm pt-4">No hay ingresos para este mes.</p>}
                        </div>
                    </GlassCard>
                </div>
            ) : (
                <GlassCard className="p-4 sm:p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-300 dark:border-white/20">
                                    <th className="p-3">Fecha</th>
                                    <th className="p-3">Descripción</th>
                                    <th className="p-3 text-right">Monto</th>
                                    <th className="p-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthIncomes.map(inc => {
                                    const concept = data.concepts.find(c => c.id === inc.conceptId);
                                    return (
                                        <tr key={inc.id} className="border-b border-gray-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10">
                                            <td className="p-3">{new Date(inc.date).toLocaleDateString('es-MX')}</td>
                                            <td className="p-3 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <IconDisplay icon={concept?.icon} iconColor={concept?.iconColor} className="w-5 h-5" />
                                                    <span>{concept?.name || inc.description}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right font-semibold text-green-500 dark:text-green-400">{formatCurrency(inc.amount)}</td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => handleOpenModal(inc)} className="text-primary-500 dark:text-primary-400 p-1"><EditIcon className="w-5 h-5"/></button>
                                                <button onClick={() => handleDelete(inc.id)} className="text-red-500 dark:text-red-400 p-1 ml-2"><DeleteIcon className="w-5 h-5"/></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? 'Editar Ingreso' : 'Nuevo Ingreso'}>
                <IncomeForm 
                    item={editingItem}
                    incomeConcepts={incomeConcepts}
                    onSave={handleSave}
                    onCancel={handleCloseModal}
                    initialDate={selectedDate ? toDateKey(selectedDate) : undefined}
                />
            </Modal>
            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que quieres eliminar este ingreso? Esta acción no se puede deshacer."
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
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DailyExpense, Concept, MovementTypeName } from '../types';
import { generateSequentialId, toDateKey, generatePeriods } from './utils';
import { DeleteIcon, ListBulletIcon, EditIcon, PlusIcon, TrendingUpIcon, TrendingDownIcon, WalletIcon, ClockIcon } from './Icons';
import { CalendarGrid } from './CalendarGrid';
import { CalendarIcon } from './PlannedExpenses';
import { PREDEFINED_ICONS } from './IconDisplay';
import { IconDisplay } from './IconDisplay';
import { Modal, ConfirmationModal, SuccessToast } from './common/Portals';

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

const ExpenseForm: React.FC<{
    item: Partial<DailyExpense> | null;
    concepts: Concept[];
    onSave: (item: DailyExpense) => void;
    onCancel: () => void;
    initialDate?: string;
}> = ({ item, concepts, onSave, onCancel, initialDate }) => {
    const [formState, setFormState] = useState({
        conceptId: item?.conceptId || '',
        amount: item?.amount || 0,
        date: item?.date ? toDateKey(new Date(item.date)) : initialDate || toDateKey(new Date()),
        notes: item?.notes || ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

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

        onSave({
            ...item,
            id: item?.id || '',
            ...formState,
            date: new Date(`${formState.date}T00:00:00`).toISOString()
        } as DailyExpense);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium">Concepto</label>
                <select value={formState.conceptId} onChange={e => setFormState(s => ({ ...s, conceptId: e.target.value }))} className="mt-1 block w-full rounded-md shadow-sm">
                    <option value="">Seleccione un concepto</option>
                    {concepts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                    {item?.id ? 'Guardar Cambios' : 'Registrar Gasto'}
                </button>
            </div>
        </form>
    );
};

export const DailyExpenses: React.FC = () => {
    const { appData: data, setData, userProfile } = useAuth();
    const [view, setView] = useState<'calendar' | 'list'>('calendar');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<DailyExpense | null>(null);
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

    if (!data) return <div className="text-white">Cargando...</div>;

    const expenseConcepts = useMemo(() => {
        const movGastoId = 'TM-001'; // GASTO
        // User requested 'Corriente', but it might not exist. Fallback to 'Variable'.
        const corrienteCostType = data.costTypes.find(ct => ct.name === 'Corriente');
        const targetCostTypeId = corrienteCostType ? corrienteCostType.id : 'TC-002'; // 'TC-002' is 'Variable'

        if (!data.movementTypes.some(m => m.id === movGastoId) || !data.costTypes.some(ct => ct.id === targetCostTypeId)) return [];
        
        return data.concepts.filter(c => 
            c.movementTypeId === movGastoId && 
            c.costTypeId === targetCostTypeId
        );
    }, [data]);

    const incomeIconName = userProfile?.summaryCardIcons?.income || 'trending-up';
    const IncomeIconComponent = PREDEFINED_ICONS[incomeIconName]?.icon || TrendingUpIcon;

    const expenseIconName = userProfile?.summaryCardIcons?.expenses || 'trending-down';
    const ExpenseIconComponent = PREDEFINED_ICONS[expenseIconName]?.icon || TrendingDownIcon;

    const balanceIconName = userProfile?.summaryCardIcons?.balance || 'wallet';
    const BalanceIconComponent = PREDEFINED_ICONS[balanceIconName]?.icon || WalletIcon;

    const pendingIconName = userProfile?.summaryCardIcons?.pending || 'clock';
    const PendingIconComponent = PREDEFINED_ICONS[pendingIconName]?.icon || ClockIcon;

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


    const { expensesByDate, totalMonthExpenses, monthExpenses } = useMemo(() => {
        const expenseMap = new Map<string, DailyExpense[]>();
        
        data.dailyExpenses.forEach(expense => {
            const expenseDate = new Date(expense.date);
            const dateKey = toDateKey(expenseDate);

            if (!expenseMap.has(dateKey)) expenseMap.set(dateKey, []);
            expenseMap.get(dateKey)!.push(expense);
        });

        const startOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
        const endOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        const monthExpenses = data.dailyExpenses
            .filter(exp => {
                const expDate = new Date(exp.date);
                return expDate >= startOfMonth && expDate <= endOfMonth;
            })
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
        const total = monthExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
        
        return { expensesByDate: expenseMap, totalMonthExpenses: total, monthExpenses };
    }, [data.dailyExpenses, calendarDate]);

    const handleOpenModal = (item: DailyExpense | null = null) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingItem(null);
        setIsModalOpen(false);
    };

    const handleSave = (item: DailyExpense) => {
        let newExpenses;
        if (item.id) {
            newExpenses = data.dailyExpenses.map(e => e.id === item.id ? item : e);
        } else {
            newExpenses = [...data.dailyExpenses, { ...item, id: generateSequentialId('GD', data.dailyExpenses) }];
        }
        setData({ ...data, dailyExpenses: newExpenses });
        setSuccessInfo({ title: 'Éxito', message: `Gasto ${item.id ? 'actualizado' : 'registrado'} correctamente.` });
        handleCloseModal();
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

        const dateKey = toDateKey(date);
        const hasExpenses = expensesByDate.has(dateKey);
        
        const isSelected = selectedDate ? date.getTime() === selectedDate.getTime() : false;
        const isToday = date.getTime() === today.getTime();

        let cellClass = "relative flex flex-col items-center justify-center h-20 w-full rounded-lg cursor-pointer transition-colors hover:bg-gray-200 dark:hover:bg-white/10";
        if (isSelected) cellClass += " bg-primary-600/80 dark:bg-primary-700/80 text-white";
        else if (isToday) cellClass += " ring-2 ring-primary-500";
        
        return (
            <div className={cellClass}>
                <span>{date.getDate()}</span>
                {hasExpenses && <div className="absolute bottom-2 w-2 h-2 rounded-full bg-red-500"></div>}
            </div>
        );
    }, [selectedDate, expensesByDate]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold">Gastos Diarios</h1>
                <div className="flex items-center gap-2">
                     <div className="p-1 rounded-lg bg-gray-200 dark:bg-black/20 flex items-center">
                        <button onClick={() => setView('calendar')} className={`p-1.5 rounded-md ${view === 'calendar' ? 'bg-primary-600 text-white' : ''}`}><CalendarIcon className="w-5 h-5"/></button>
                        <button onClick={() => setView('list')} className={`p-1.5 rounded-md ${view === 'list' ? 'bg-primary-600 text-white' : ''}`}><ListBulletIcon className="w-5 h-5"/></button>
                    </div>
                    <button onClick={() => handleOpenModal()} className="flex-shrink-0 flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">
                        <PlusIcon className="w-5 h-5" /> Añadir Gasto
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
                        <h3 className="text-lg font-bold mb-4">Gastos de {months[calendarDate.getMonth()].label}</h3>
                        <div className="flex-grow overflow-y-auto pr-2 space-y-2 mb-4">
                            {monthExpenses.length > 0 ? monthExpenses.map(exp => (
                                <div key={exp.id} className="p-2 bg-gray-100 dark:bg-black/20 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium">{expenseConcepts.find(c => c.id === exp.conceptId)?.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(exp.date).toLocaleDateString('es-MX', {day: '2-digit', month: 'short'})}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-red-500 dark:text-red-400">{formatCurrency(exp.amount)}</span>
                                        <button onClick={() => handleOpenModal(exp)} className="text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400"><EditIcon className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(exp.id)} className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"><DeleteIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            )) : <p className="text-gray-500 dark:text-gray-400 text-center text-sm pt-4">No hay gastos para este mes.</p>}
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
                                    <th className="p-3">Concepto</th>
                                    <th className="p-3 text-right">Monto</th>
                                    <th className="p-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthExpenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => {
                                    const concept = expenseConcepts.find(c => c.id === exp.conceptId);
                                    return (
                                        <tr key={exp.id} className="border-b border-gray-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10">
                                            <td className="p-3">{new Date(exp.date).toLocaleDateString('es-MX')}</td>
                                            <td className="p-3 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <IconDisplay icon={concept?.icon} iconColor={concept?.iconColor} className="w-5 h-5" />
                                                    <span>{concept?.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right font-semibold text-red-500 dark:text-red-400">{formatCurrency(exp.amount)}</td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => handleOpenModal(exp)} className="text-primary-500 dark:text-primary-400 p-1"><EditIcon className="w-5 h-5"/></button>
                                                <button onClick={() => handleDelete(exp.id)} className="text-red-500 dark:text-red-400 p-1 ml-2"><DeleteIcon className="w-5 h-5"/></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? 'Editar Gasto' : 'Nuevo Gasto'}>
                <ExpenseForm
                    item={editingItem}
                    concepts={expenseConcepts}
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
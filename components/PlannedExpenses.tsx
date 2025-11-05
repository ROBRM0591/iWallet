import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppData, PlannedExpense, Frequency, Concept, Payment, Priority, MovementTypeName } from '../types';
import { PlusIcon, EditIcon, DeleteIcon, CheckCircleIcon, ListBulletIcon, CurrencyDollarIcon, ChevronDownIcon, WalletIcon, TrendingUpIcon, TrendingDownIcon, ClockIcon } from './Icons';
import { generatePeriods, getNextPeriodToPay, generateSequentialId, getStatusInfo, toDateKey } from './utils';
import { IconPicker } from './IconPicker';
import { IconDisplay, PREDEFINED_ICONS } from './IconDisplay';
import { useAuth } from '../contexts/AuthContext';
import { CalendarGrid } from './CalendarGrid';
import { Modal, ConfirmationModal, SuccessToast } from './common/Portals';

export const PlannedExpenseIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 12.75h.008v.008H12v-.008z" />
    </svg>
);
// FIX: Changed re-export syntax to direct const assignment to avoid potential compiler issues.
export const CalendarIcon = PlannedExpenseIcon;

const formatCurrency = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/90 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg text-gray-900 dark:text-white ${className}`}>
        {children}
    </div>
);

const PlannedExpenseForm: React.FC<{
    item: Partial<PlannedExpense> | null;
    concepts: Concept[];
    onSave: (item: PlannedExpense) => void;
    onCancel: () => void;
    data: AppData;
    setData: (data: AppData) => void;
    defaultActiveTab?: 'details' | 'payments' | 'periods';
}> = ({ item, concepts, onSave, onCancel, data, setData, defaultActiveTab }) => {
    const [activeTab, setActiveTab] = useState<'details' | 'periods' | 'payments'>(defaultActiveTab || 'details');
    
    const [formState, setFormState] = useState({
        conceptId: '',
        icon: 'tag',
        iconColor: 'text-gray-900 dark:text-white',
        amountPerPeriod: 0,
        startPeriod: new Date().toISOString().slice(0, 7),
        frequency: Frequency.MENSUAL,
        periods: 12,
        cutOffDay: 15,
        dueDay: 30,
        reminderDays: data.notifications.defaultReminderDays,
        reminderTime: data.notifications.defaultReminderTime,
    });
    const [periodOverrides, setPeriodOverrides] = useState<Record<string, number>>({});

    useEffect(() => {
        setFormState({
            conceptId: item?.conceptId || '',
            icon: item?.icon || 'tag',
            iconColor: item?.iconColor || 'text-gray-900 dark:text-white',
            amountPerPeriod: item?.amountPerPeriod || 0,
            startPeriod: item?.startPeriod || new Date().toISOString().slice(0, 7),
            frequency: item?.frequency || Frequency.MENSUAL,
            periods: item?.periods || 12,
            cutOffDay: item?.cutOffDay || 15,
            dueDay: item?.dueDay || 30,
            reminderDays: item?.reminderDays ?? data.notifications.defaultReminderDays,
            reminderTime: item?.reminderTime ?? data.notifications.defaultReminderTime,
        });
        setPeriodOverrides(item?.periodOverrides || {});
    }, [item, data.notifications]);


    const paymentsByPeriod = useMemo(() => {
        if (!item?.payments) return new Map<string, number>();
        const map = new Map<string, number>();
        (item.payments || []).forEach(p => {
            map.set(p.period, (map.get(p.period) || 0) + Number(p.amount));
        });
        return map;
    }, [item?.payments]);


    const [iconPickerAnchor, setIconPickerAnchor] = useState<HTMLButtonElement | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const todayISO = toDateKey(new Date());
    const [paymentDate, setPaymentDate] = useState(todayISO);
    const [paymentPeriod, setPaymentPeriod] = useState('');
    const [paymentRemaining, setPaymentRemaining] = useState(0);
    const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});

    const availablePeriodsToPay = useMemo(() => {
        if (!item) return [];
        const allPeriods = generatePeriods(item as PlannedExpense);
        const paymentsByPeriod = new Map<string, number>();

        (item.payments || []).forEach(p => {
            paymentsByPeriod.set(p.period, (paymentsByPeriod.get(p.period) || 0) + Number(p.amount));
        });

        return allPeriods.filter(period => {
            const paidAmount = paymentsByPeriod.get(period) || 0;
            const amountForPeriod = (item as PlannedExpense).periodOverrides?.[period] ?? (item as PlannedExpense).amountPerPeriod;
            return paidAmount < Number(amountForPeriod);
        });
    }, [item]);
    
     useEffect(() => {
        if (paymentPeriod && item) {
            const paidInPeriod = (item.payments || [])
                .filter(p => p.period === paymentPeriod)
                .reduce((sum, p) => sum + Number(p.amount), 0);
            const amountForPeriod = Number(item.periodOverrides?.[paymentPeriod] ?? item.amountPerPeriod);
            const remaining = amountForPeriod - paidInPeriod;
            setPaymentRemaining(remaining);
            setPaymentAmount(remaining > 0 ? remaining : 0);
            setPaymentErrors({});
        } else {
            setPaymentRemaining(0);
            setPaymentAmount(0);
        }
    }, [paymentPeriod, item]);

    const generatedFormPeriods = useMemo(() => {
        return generatePeriods({ ...formState, id: '', payments: [] } as PlannedExpense);
    }, [formState.startPeriod, formState.periods, formState.frequency]);

    const handleOverrideChange = (period: string, value: string) => {
        const amount = parseFloat(value);
        setPeriodOverrides(prev => {
            const newOverrides = { ...prev };
            if (isNaN(amount) || amount === formState.amountPerPeriod) {
                delete newOverrides[period];
            } else {
                newOverrides[period] = amount;
            }
            return newOverrides;
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numValue = ['amountPerPeriod', 'periods', 'cutOffDay', 'dueDay', 'reminderDays'].includes(name) ? Number(value) : value;
        setFormState(prev => ({ ...prev, [name]: numValue }));
    };

    const handleIconSelect = (details: { icon: string; color: string; }) => {
        setFormState(prev => ({ ...prev, icon: details.icon, iconColor: details.color }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...item, ...formState, periodOverrides, payments: item?.payments || [] } as PlannedExpense);
    };

    const handleAddPayment = () => {
        if (!item?.id || !paymentPeriod || paymentAmount <= 0) return;
        
        if (paymentAmount > paymentRemaining) {
            setPaymentErrors({ amount: `El monto no puede exceder el restante (${formatCurrency(paymentRemaining)}).` });
            return;
        }
        setPaymentErrors({});
        
        const allPayments = data.plannedExpenses.flatMap(pe => pe.payments || []);
        const newPayment: Payment = {
            id: generateSequentialId('PA', allPayments),
            amount: paymentAmount,
            date: new Date(`${paymentDate}T00:00:00`).toISOString(),
            period: paymentPeriod,
        };

        const updatedExpenses = data.plannedExpenses.map(pe => 
            pe.id === item.id ? { ...pe, payments: [...(pe.payments || []), newPayment] } : pe
        );
        setData({ ...data, plannedExpenses: updatedExpenses });
        setPaymentAmount(0);
        setPaymentPeriod('');
    };

    return (
        <div>
            <div className="border-b border-gray-200 dark:border-white/20 mb-4">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <button onClick={() => setActiveTab('details')} className={`${activeTab === 'details' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Detalles</button>
                    <button onClick={() => setActiveTab('periods')} className={`${activeTab === 'periods' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Montos por Periodo</button>
                    {item?.id && <button onClick={() => setActiveTab('payments')} className={`${activeTab === 'payments' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Pagos</button>}
                </nav>
            </div>
            {activeTab === 'details' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Concepto</label>
                        <div className="flex items-center gap-2 mt-1">
                            <div>
                                <button type="button" onClick={(e) => setIconPickerAnchor(iconPickerAnchor ? null : e.currentTarget)} className="p-2 border border-gray-300 dark:border-white/20 rounded-md bg-white/50 dark:bg-white/10">
                                    <IconDisplay icon={formState.icon} iconColor={formState.iconColor} className="w-6 h-6" />
                                </button>
                                {iconPickerAnchor && <IconPicker anchorEl={iconPickerAnchor} onSelect={handleIconSelect} onClose={() => setIconPickerAnchor(null)} currentColor={formState.iconColor} position="left" />}
                            </div>
                            <select name="conceptId" value={formState.conceptId} onChange={handleChange} className="block w-full rounded-md shadow-sm">
                                <option value="">Seleccione...</option>
                                {concepts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto por Periodo</label><input type="number" name="amountPerPeriod" value={formState.amountPerPeriod} onChange={handleChange} className="mt-1 w-full" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Frecuencia</label><select name="frequency" value={formState.frequency} onChange={handleChange} className="mt-1 w-full"><option value={Frequency.MENSUAL}>Mensual</option><option value={Frequency.BIMESTRAL}>Bimestral</option></select></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300"># de Periodos</label><input type="number" name="periods" value={formState.periods} onChange={handleChange} className="mt-1 w-full" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Periodo de Inicio</label><input type="month" name="startPeriod" value={formState.startPeriod} onChange={handleChange} className="mt-1 w-full" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Día de Corte</label><input type="number" name="cutOffDay" value={formState.cutOffDay} onChange={handleChange} className="mt-1 w-full" min="1" max="31" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Día Límite de Pago</label><input type="number" name="dueDay" value={formState.dueDay} onChange={handleChange} className="mt-1 w-full" min="1" max="31" /></div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Recordatorio</label>
                        <div className="flex items-center gap-2 mt-1">
                            <select name="reminderDays" value={formState.reminderDays} onChange={handleChange} className="w-full">
                                <option value="-1">No recordar</option><option value="0">El día del vencimiento</option><option value="1">1 día antes</option>
                                <option value="3">3 días antes</option><option value="5">5 días antes</option><option value="7">1 semana antes</option>
                            </select>
                            <input type="time" name="reminderTime" value={formState.reminderTime} onChange={handleChange} className="w-full" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-primary-600 hover:bg-primary-700 font-bold py-2 px-4 rounded-lg text-white">Guardar</button>
                    </div>
                </form>
            ) : activeTab === 'periods' ? (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Ajusta los montos para periodos específicos. Si un campo se deja vacío, se usará el monto por periodo predeterminado de {formatCurrency(formState.amountPerPeriod)}.</p>
                    <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                        {generatedFormPeriods.map((period, index) => {
                            const amountForPeriod = Number(periodOverrides[period] ?? formState.amountPerPeriod);
                            const paidInPeriod = paymentsByPeriod.get(period) || 0;
                            const isPaid = paidInPeriod >= amountForPeriod && amountForPeriod > 0;

                            return (
                                <div key={period} className="grid grid-cols-3 items-center gap-2">
                                    <label htmlFor={`period-override-${period}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">Periodo {index + 1} ({period}):</label>
                                    <div className="relative col-span-2 mt-1">
                                        <input
                                            type="number"
                                            id={`period-override-${period}`}
                                            placeholder={formatCurrency(formState.amountPerPeriod)}
                                            value={periodOverrides[period] ?? ''}
                                            onChange={(e) => handleOverrideChange(period, e.target.value)}
                                            className="w-full rounded-md shadow-sm disabled:bg-gray-200 dark:disabled:bg-gray-700/50 disabled:cursor-not-allowed"
                                            disabled={isPaid}
                                            aria-describedby={isPaid ? `paid-info-${period}` : undefined}
                                        />
                                        {isPaid && (
                                            <div id={`paid-info-${period}`} className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none" title={`Periodo cubierto con ${formatCurrency(paidInPeriod)}`}>
                                                <CheckCircleIcon className="w-5 h-5 text-green-500 dark:text-green-400" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                     <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                        <button type="button" onClick={handleSubmit} className="bg-primary-600 hover:bg-primary-700 font-bold py-2 px-4 rounded-lg text-white">Guardar Cambios</button>
                    </div>
                </div>

            ) : (
                <div className="space-y-4">
                    <div className="max-h-60 overflow-y-auto pr-2">
                        <table className="w-full text-left">
                           <thead><tr className="border-b border-gray-200 dark:border-white/20"><th className="p-2">Periodo</th><th className="p-2">Fecha</th><th className="p-2 text-right">Monto</th></tr></thead>
                           <tbody>
                               {(item?.payments || []).length > 0 ? (item?.payments || []).map(p => <tr key={p.id}><td className="p-2">{p.period}</td><td className="p-2">{new Date(p.date).toLocaleDateString()}</td><td className="p-2 text-right">{formatCurrency(p.amount)}</td></tr>) : <tr><td colSpan={3} className="text-center p-4 text-gray-500 dark:text-gray-400">No hay pagos registrados.</td></tr>}
                           </tbody>
                        </table>
                    </div>
                    <div className="border-t border-gray-200 dark:border-white/20 pt-4 space-y-2">
                        <h4 className="font-bold">Registrar Nuevo Abono</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <select value={paymentPeriod} onChange={e => setPaymentPeriod(e.target.value)} className="w-full md:col-span-2">
                                <option value="">Seleccione periodo</option>
                                {availablePeriodsToPay.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <input type="number" placeholder="Monto" value={paymentAmount || ''} onChange={e => setPaymentAmount(Number(e.target.value))} className="w-full"/>
                            <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full"/>
                        </div>
                         {paymentErrors.amount && <p className="text-red-400 text-xs mt-1">{paymentErrors.amount}</p>}
                        <button onClick={handleAddPayment} className="w-full bg-primary-600 hover:bg-primary-700 font-bold py-2 px-4 rounded-lg text-white">Añadir Pago</button>
                    </div>
                </div>
            )}
        </div>
    );
};

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

export const PlannedExpenses: React.FC = () => {
    const { appData: data, setData, userProfile } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<{ item: PlannedExpense | null, defaultTab: 'details' | 'payments' | 'periods' }>({ item: null, defaultTab: 'details' });
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [successInfo, setSuccessInfo] = useState<{ title: string; message: string } | null>(null);
    const [view, setView] = useState<'calendar' | 'list'>('calendar');
    const [statusFilter, setStatusFilter] = useState<'all' | 'vencidos' | 'urgent' | 'proximos' | 'partial' | 'paid'>('all');
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [calendarDate, setCalendarDate] = useState(new Date());

    const getSummaryCardName = (card: string, defaultName: string) => userProfile?.summaryCardNames?.[card] || defaultName;

    const expenseConcepts = useMemo(() => {
        if (!data) return [];
        const movGastoId = 'TM-001'; // GASTO
        const corrienteCostTypeId = data.costTypes.find(ct => ct.name === 'Corriente')?.id;
        
        const filtered = data.concepts.filter(c => 
            c.movementTypeId === movGastoId && 
            c.costTypeId !== corrienteCostTypeId
        );

        if (editingItem.item?.conceptId) {
            const currentConcept = data.concepts.find(c => c.id === editingItem.item!.conceptId);
            if (currentConcept && !filtered.some(c => c.id === currentConcept.id)) {
                return [currentConcept, ...filtered].sort((a,b) => a.name.localeCompare(b.name));
            }
        }
        
        return filtered.sort((a,b) => a.name.localeCompare(b.name));
    }, [data, editingItem.item]);

    useEffect(() => {
        const expenseId = location.state?.openExpenseId;
        if (expenseId !== undefined) {
            const itemToEdit = expenseId ? data?.plannedExpenses.find(e => e.id === expenseId) : null;
            handleOpenModal(itemToEdit || null);
            navigate(location.pathname, { state: {}, replace: true });
        }
    }, [location.state, data?.plannedExpenses, navigate]);
    
    const handleOpenModal = (item: PlannedExpense | null = null, defaultTab: 'details' | 'payments' | 'periods' = 'details') => {
        setEditingItem({ item, defaultTab });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingItem({ item: null, defaultTab: 'details' });
        setIsModalOpen(false);
    };
    
    const handleSave = (item: PlannedExpense) => {
        let newExpenses;
        if (item.id) {
            newExpenses = data!.plannedExpenses.map(e => e.id === item.id ? item : e);
        } else {
            newExpenses = [...data!.plannedExpenses, { ...item, id: generateSequentialId('GP', data!.plannedExpenses) }];
        }
        setData({ ...data!, plannedExpenses: newExpenses });
        handleCloseModal();
    };
    
    const handleDelete = (id: string) => setDeleteId(id);
    const confirmDelete = () => {
        if (!deleteId) return;
        setData({ ...data!, plannedExpenses: data!.plannedExpenses.filter(e => e.id !== deleteId) });
        setDeleteId(null);
    };
    
    const { summary, filteredExpenses, duesByDate, selectedDayDues } = useMemo(() => {
        if (!data) return { 
            summary: { periodIncome: 0, periodExpenses: 0, periodBalance: 0, pendingInPeriod: 0, totalPlannedForMonth: 0 }, 
            filteredExpenses: [], 
            duesByDate: new Map(), 
            selectedDayDues: [] 
        };
        
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

        const summary = { periodIncome, periodExpenses, periodBalance, pendingInPeriod, totalPlannedForMonth };
        
        const term = searchTerm.toLowerCase();
        let allExpensesWithDetails = data.plannedExpenses.map(expense => {
            const concept = data.concepts.find(c => c.id === expense.conceptId);
            const category = data.categories.find(c => c.id === concept?.categoryId);
            const nextPeriodToPay = getNextPeriodToPay(expense);
            const amountForPeriod = nextPeriodToPay ? (expense.periodOverrides?.[nextPeriodToPay.period] ?? expense.amountPerPeriod) : 0;
            const paidInPeriod = nextPeriodToPay ? (expense.payments || []).filter(p => p.period === nextPeriodToPay.period).reduce((s,p) => s + p.amount, 0) : amountForPeriod;
            
            const status = getStatusInfo(expense);
            return { ...expense, concept, category, nextPeriodToPay, amountForPeriod, paidInPeriod, status };
        }).filter(e => !term || e.concept?.name.toLowerCase().includes(term));
        
        if (statusFilter !== 'all') {
            allExpensesWithDetails = allExpensesWithDetails.filter(e => {
                const s = e.status.text;
                if (statusFilter === 'vencidos') return s === 'Vencido';
                if (statusFilter === 'urgent') return s === 'Urgente';
                if (statusFilter === 'proximos') return s === 'Próximo';
                if (statusFilter === 'partial') return s === 'Parcial';
                if (statusFilter === 'paid') return s === 'Pagado';
                return true;
            });
        }
        
        if (statusFilter === 'all') {
            allExpensesWithDetails.sort((a, b) => {
                if (a.status.priority !== b.status.priority) return a.status.priority - b.status.priority;
                return a.dueDay - b.dueDay;
            });
        }
        
        const dues = new Map<string, any[]>();
        data.plannedExpenses.forEach(expense => {
            const periods = generatePeriods(expense);
            periods.forEach((period) => {
                const [pYear, pMonth] = period.split('-').map(Number);
                if (pYear === calendarDate.getFullYear() && pMonth - 1 === calendarDate.getMonth()) {
                     const [year, month] = period.split('-').map(Number);
                    let dueMonth = month;
                    let dueYear = year;
                    if (expense.cutOffDay > expense.dueDay) {
                        dueMonth += 1;
                        if (dueMonth > 12) {
                            dueMonth = 1;
                            dueYear += 1;
                        }
                    }
                    const dueDate = new Date(dueYear, dueMonth - 1, expense.dueDay);
                    const dateKey = toDateKey(dueDate);

                    const concept = data.concepts.find(c => c.id === expense.conceptId);
                    const amountForPeriod = expense.periodOverrides?.[period] ?? expense.amountPerPeriod;
                    const paidInPeriod = (expense.payments || []).filter(p => p.period === period).reduce((s,p) => s + p.amount, 0);
                    
                    const status = getStatusInfo(expense);

                    if (!dues.has(dateKey)) dues.set(dateKey, []);
                    dues.get(dateKey)!.push({ ...expense, concept, amountForPeriod, paidInPeriod, duePeriod: period, status });
                }
            });
        });

        const dayDues = selectedDate ? (dues.get(toDateKey(selectedDate)) || []) : [];

        return {
            summary,
            filteredExpenses: allExpensesWithDetails,
            duesByDate: dues,
            selectedDayDues: dayDues
        };
    }, [data, currentDate, searchTerm, calendarDate, statusFilter, selectedDate]);

    const renderDayCell = useCallback((date: Date) => {
        const today = new Date();
        today.setHours(0,0,0,0);
        date.setHours(0,0,0,0);
        const dateKey = toDateKey(date);
        const duesForDay = duesByDate.get(dateKey) || [];
        
        const isSelected = selectedDate ? date.getTime() === selectedDate.getTime() : false;
        const isToday = date.getTime() === today.getTime();

        let cellClass = "relative flex flex-col items-center justify-center h-20 w-full rounded-lg cursor-pointer transition-colors hover:bg-gray-200 dark:hover:bg-white/10";
        if (isSelected) cellClass += " bg-primary-600/80 dark:bg-primary-700/80 text-white";
        else if (isToday) cellClass += " ring-2 ring-primary-500";

        const hasDue = duesForDay.length > 0;
        const isOverdue = hasDue && duesForDay.some(d => d.status.text === 'Vencido');
        const isUpcoming = hasDue && duesForDay.some(d => ['Próximo', 'Urgente'].includes(d.status.text));
        
        return (
            <div className={cellClass}>
                <span>{date.getDate()}</span>
                {isOverdue && <div className="absolute bottom-2 w-2 h-2 rounded-full bg-red-500"></div>}
                {isUpcoming && !isOverdue && <div className="absolute bottom-2 w-2 h-2 rounded-full bg-yellow-500"></div>}
            </div>
        );
    }, [selectedDate, duesByDate]);

    const incomeIconName = userProfile?.summaryCardIcons?.income || 'trending-up';
    const IncomeIconComponent = PREDEFINED_ICONS[incomeIconName]?.icon || TrendingUpIcon;

    const expenseIconName = userProfile?.summaryCardIcons?.expenses || 'trending-down';
    const ExpenseIconComponent = PREDEFINED_ICONS[expenseIconName]?.icon || TrendingDownIcon;

    const balanceIconName = userProfile?.summaryCardIcons?.balance || 'wallet';
    const BalanceIconComponent = PREDEFINED_ICONS[balanceIconName]?.icon || WalletIcon;

    const pendingIconName = userProfile?.summaryCardIcons?.pending || 'clock';
    const PendingIconComponent = PREDEFINED_ICONS[pendingIconName]?.icon || ClockIcon;
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold">Gastos Planificados</h1>
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

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                        <h3 className="text-lg font-bold mb-4">
                           {selectedDate ? `Vencimientos del ${selectedDate.toLocaleDateString('es-MX', {day: 'numeric', month: 'long'})}` : 'Seleccione una fecha'}
                        </h3>
                         <div className="flex-grow overflow-y-auto pr-2 space-y-2 mb-4">
                           {selectedDayDues.length > 0 ? selectedDayDues.map(due => (
                                <div key={`${due.id}-${due.duePeriod}`} className="p-2 bg-gray-100 dark:bg-black/20 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium">{due.concept.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{due.duePeriod}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-bold ${due.status.text === 'Vencido' ? 'text-red-500' : ''}`}>{formatCurrency(due.amountForPeriod - due.paidInPeriod)}</span>
                                        <button onClick={() => handleOpenModal(due, 'payments')} className="text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400"><EditIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            )) : <p className="text-gray-500 dark:text-gray-400 text-center text-sm pt-4">No hay vencimientos para esta fecha.</p>}
                        </div>
                    </GlassCard>
                </div>
            ) : (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                         <input type="search" placeholder="Buscar gasto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full md:w-auto px-3 py-2 rounded-lg shadow-sm" />
                         <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-full md:w-auto rounded-lg shadow-sm">
                             <option value="all">Todos los estados</option>
                             <option value="vencidos">Vencidos</option>
                             <option value="urgent">Urgentes</option>
                             <option value="proximos">Próximos a Vencer</option>
                             <option value="partial">Pagos Parciales</option>
                             <option value="paid">Pagados</option>
                         </select>
                     </div>
                    <GlassCard className="p-4 sm:p-6">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-300 dark:border-white/20">
                                        <th className="p-3">Concepto</th>
                                        <th className="p-3">Categoría</th>
                                        <th className="p-3 text-right">Monto</th>
                                        <th className="p-3 text-right">Pagado</th>
                                        <th className="p-3 text-right">Restante</th>
                                        <th className="p-3 text-center">Estado</th>
                                        <th className="p-3 text-center">Vence</th>
                                        <th className="p-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExpenses.map(exp => {
                                        const remaining = exp.amountForPeriod - exp.paidInPeriod;
                                        return (
                                        <tr key={exp.id} className="border-b border-gray-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10">
                                            <td className="p-3 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <IconDisplay icon={exp.icon} iconColor={exp.iconColor} className="w-5 h-5" />
                                                    <span>{exp.concept?.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-sm text-gray-500 dark:text-gray-400">{exp.category?.name}</td>
                                            <td className="p-3 text-right">{formatCurrency(exp.amountForPeriod)}</td>
                                            <td className="p-3 text-right text-green-600 dark:text-green-400">{formatCurrency(exp.paidInPeriod)}</td>
                                            <td className={`p-3 text-right font-semibold ${remaining > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>{formatCurrency(remaining)}</td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${exp.status.color}`}>
                                                    {exp.status.text}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center text-sm">Día {exp.dueDay}</td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => handleOpenModal(exp, 'payments')} className="text-green-500 p-1" title="Pagar / Ver Abonos"><CurrencyDollarIcon className="w-5 h-5"/></button>
                                                <button onClick={() => handleOpenModal(exp, 'details')} className="text-primary-500 p-1 ml-2" title="Editar"><EditIcon className="w-5 h-5"/></button>
                                                <button onClick={() => handleDelete(exp.id)} className="text-red-500 p-1 ml-2" title="Eliminar"><DeleteIcon className="w-5 h-5"/></button>
                                            </td>
                                        </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </>
            )}
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem.item?.id ? 'Editar Gasto Planificado' : 'Nuevo Gasto Planificado'}>
                <PlannedExpenseForm 
                    item={editingItem.item} 
                    concepts={expenseConcepts} 
                    onSave={handleSave} 
                    onCancel={handleCloseModal} 
                    data={data!} 
                    setData={setData}
                    defaultActiveTab={editingItem.defaultTab}
                />
            </Modal>

            <ConfirmationModal 
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Confirmar Eliminación"
                message="¿Estás seguro de eliminar este gasto planificado y todos sus pagos asociados? Esta acción es irreversible."
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
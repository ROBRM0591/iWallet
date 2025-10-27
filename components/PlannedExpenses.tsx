import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { AppData, PlannedExpense, Frequency, Concept, Payment, Priority } from '../types';
import { CloseIcon, PlusIcon, EditIcon, DeleteIcon, WarningIcon, CheckCircleIcon, DownloadIcon, ListBulletIcon, PlannedExpenseIcon as CalendarIcon, CurrencyDollarIcon, ChevronDownIcon } from './Icons';
import { generatePeriods, getNextPeriodToPay, generateSequentialId, getStatusInfo } from './utils';
import { IconPicker } from './IconPicker';
import { IconDisplay } from './IconDisplay';
import { useAuth } from '../contexts/AuthContext';
import { CalendarGrid } from './CalendarGrid';

declare const XLSX: any;

const formatCurrency = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg text-white ${className}`}>
        {children}
    </div>
);

// Modal, ConfirmationModal, and SuccessToast components
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
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all">
                <div className="flex justify-between items-center p-4 border-b border-white/20">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

const ConfirmationModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; }> = ({ isOpen, onClose, onConfirm, title, message }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl w-full max-w-md m-4 text-center p-6 text-white">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50"><WarningIcon className="h-6 w-6 text-red-300" /></div>
                <h3 className="text-lg font-bold mt-4">{title}</h3>
                <p className="mt-2 text-sm text-gray-400">{message}</p>
                <div className="mt-6 flex justify-center gap-4">
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button onClick={() => { onConfirm(); onClose(); }} className="bg-red-600 hover:red:bg-red-700 font-bold py-2 px-4 rounded-lg">Confirmar</button>
                </div>
            </div>
        </div>
    );
};

const SuccessToast: React.FC<{ isOpen: boolean; onClose: () => void; title: string; message: string; }> = ({ isOpen, onClose, title, message }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(onClose, 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);
    if (!isOpen) return null;
    return (
        <div className="fixed bottom-4 left-4 z-50 w-full max-w-sm transition-all duration-300 transform translate-y-0 opacity-100">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl p-4 flex items-start gap-4 text-white">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-900/50 flex items-center justify-center"><CheckCircleIcon className="h-6 w-6 text-green-300" /></div>
                <div className="flex-grow">
                    <p className="font-bold">{title}</p>
                    <p className="text-sm text-gray-300">{message}</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-200">&times;</button>
            </div>
        </div>
    );
};

const PlannedExpenseForm: React.FC<{
    item: Partial<PlannedExpense> | null;
    concepts: Concept[];
    onSave: (item: PlannedExpense) => void;
    onCancel: () => void;
    data: AppData;
    setData: (data: AppData) => void;
    defaultActiveTab?: 'details' | 'payments';
}> = ({ item, concepts, onSave, onCancel, data, setData, defaultActiveTab }) => {
    const [activeTab, setActiveTab] = useState(defaultActiveTab || 'details');
    
    const currentItem = useMemo(() => {
        if (!item?.id || !data) return item;
        return data.plannedExpenses.find(pe => pe.id === item.id) || item;
    }, [data.plannedExpenses, item]);

    const paymentsByPeriod = useMemo(() => {
        if (!currentItem?.payments) return new Map<string, number>();
        const map = new Map<string, number>();
        currentItem.payments.forEach(p => {
            map.set(p.period, (map.get(p.period) || 0) + p.amount);
        });
        return map;
    }, [currentItem?.payments]);

    const [formState, setFormState] = useState({
        conceptId: currentItem?.conceptId || '',
        icon: currentItem?.icon || 'tag',
        iconColor: currentItem?.iconColor || 'text-white',
        amountPerPeriod: currentItem?.amountPerPeriod || 0,
        startPeriod: currentItem?.startPeriod || new Date().toISOString().slice(0, 7),
        frequency: currentItem?.frequency || Frequency.MENSUAL,
        periods: currentItem?.periods || 12,
        cutOffDay: currentItem?.cutOffDay || 15,
        dueDay: currentItem?.dueDay || 30,
        reminderDays: currentItem?.reminderDays ?? data.notifications.defaultReminderDays,
        reminderTime: currentItem?.reminderTime ?? data.notifications.defaultReminderTime,
    });
    const [periodOverrides, setPeriodOverrides] = useState<Record<string, number>>(currentItem?.periodOverrides || {});

    const [isIconPickerOpen, setIconPickerOpen] = useState(false);
    const iconPickerContainerRef = useRef<HTMLDivElement>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const todayISO = new Date().toISOString().split('T')[0];
    const [paymentDate, setPaymentDate] = useState(todayISO);
    const [paymentPeriod, setPaymentPeriod] = useState('');
    const [paymentRemaining, setPaymentRemaining] = useState(0);
    const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (iconPickerContainerRef.current && !iconPickerContainerRef.current.contains(event.target as Node)) {
                setIconPickerOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const availablePeriodsToPay = useMemo(() => {
        if (!currentItem) return [];
        const allPeriods = generatePeriods(currentItem as PlannedExpense);
        const paymentsByPeriod = new Map<string, number>();

        (currentItem.payments || []).forEach(p => {
            paymentsByPeriod.set(p.period, (paymentsByPeriod.get(p.period) || 0) + p.amount);
        });

        return allPeriods.filter(period => {
            const paidAmount = paymentsByPeriod.get(period) || 0;
            const amountForPeriod = (currentItem as PlannedExpense).periodOverrides?.[period] ?? (currentItem as PlannedExpense).amountPerPeriod;
            return paidAmount < amountForPeriod;
        });
    }, [currentItem]);
    
     useEffect(() => {
        if (paymentPeriod && currentItem) {
            const paidInPeriod = (currentItem.payments || [])
                .filter(p => p.period === paymentPeriod)
                .reduce((sum, p) => sum + p.amount, 0);
            const amountForPeriod = currentItem.periodOverrides?.[paymentPeriod] ?? currentItem.amountPerPeriod;
            const remaining = amountForPeriod - paidInPeriod;
            setPaymentRemaining(remaining);
            setPaymentAmount(remaining > 0 ? remaining : 0);
            setPaymentErrors({});
        } else {
            setPaymentRemaining(0);
            setPaymentAmount(0);
        }
    }, [paymentPeriod, currentItem]);

    const generatedFormPeriods = useMemo(() => {
        return generatePeriods({ ...formState, id: '', payments: [] });
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
        onSave({ ...currentItem, ...formState, periodOverrides, payments: currentItem?.payments || [] } as PlannedExpense);
    };

    const handleAddPayment = () => {
        if (!currentItem?.id || !paymentPeriod || paymentAmount <= 0) return;
        
        if (paymentAmount > paymentRemaining) {
            setPaymentErrors({ amount: `El monto no puede exceder el restante (${formatCurrency(paymentRemaining)}).` });
            return;
        }
        setPaymentErrors({});
        
        const allPayments = data.plannedExpenses.flatMap(pe => pe.payments);
        const newPayment: Payment = {
            id: generateSequentialId('PA', allPayments),
            amount: paymentAmount,
            date: new Date(paymentDate).toISOString(),
            period: paymentPeriod,
        };

        const updatedExpenses = data.plannedExpenses.map(pe => 
            pe.id === currentItem.id ? { ...pe, payments: [...(pe.payments || []), newPayment] } : pe
        );
        setData({ ...data, plannedExpenses: updatedExpenses });
        setPaymentAmount(0);
        setPaymentPeriod('');
    };

    return (
        <div>
            <div className="border-b border-white/20 mb-4">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <button onClick={() => setActiveTab('details')} className={`${activeTab === 'details' ? 'border-primary-400 text-primary-400' : 'border-transparent text-gray-400'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Detalles</button>
                    <button onClick={() => setActiveTab('periods')} className={`${activeTab === 'periods' ? 'border-primary-400 text-primary-400' : 'border-transparent text-gray-400'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Montos por Periodo</button>
                    {currentItem?.id && <button onClick={() => setActiveTab('payments')} className={`${activeTab === 'payments' ? 'border-primary-400 text-primary-400' : 'border-transparent text-gray-400'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Pagos</button>}
                </nav>
            </div>
            {activeTab === 'details' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Concepto</label>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="relative" ref={iconPickerContainerRef}>
                                <button type="button" onClick={() => setIconPickerOpen(prev => !prev)} className="p-2 border border-white/20 rounded-md bg-white/10">
                                    <IconDisplay icon={formState.icon} iconColor={formState.iconColor} className="w-6 h-6" />
                                </button>
                                {isIconPickerOpen && <IconPicker onSelect={handleIconSelect} onClose={() => setIconPickerOpen(false)} currentColor={formState.iconColor} />}
                            </div>
                            <select name="conceptId" value={formState.conceptId} onChange={handleChange} className="block w-full rounded-md shadow-sm" disabled={!!currentItem?.id}>
                                <option value="">Seleccione...</option>
                                {concepts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="block text-sm font-medium">Monto por Periodo</label><input type="number" name="amountPerPeriod" value={formState.amountPerPeriod} onChange={handleChange} className="mt-1 w-full" /></div>
                        <div><label className="block text-sm font-medium">Frecuencia</label><select name="frequency" value={formState.frequency} onChange={handleChange} className="mt-1 w-full"><option value={Frequency.MENSUAL}>Mensual</option><option value={Frequency.BIMESTRAL}>Bimestral</option></select></div>
                        <div><label className="block text-sm font-medium"># de Periodos</label><input type="number" name="periods" value={formState.periods} onChange={handleChange} className="mt-1 w-full" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="block text-sm font-medium">Periodo de Inicio</label><input type="month" name="startPeriod" value={formState.startPeriod} onChange={handleChange} className="mt-1 w-full" /></div>
                        <div><label className="block text-sm font-medium">Día de Corte</label><input type="number" name="cutOffDay" value={formState.cutOffDay} onChange={handleChange} className="mt-1 w-full" min="1" max="31" /></div>
                        <div><label className="block text-sm font-medium">Día Límite de Pago</label><input type="number" name="dueDay" value={formState.dueDay} onChange={handleChange} className="mt-1 w-full" min="1" max="31" /></div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Recordatorio</label>
                        <div className="flex items-center gap-2 mt-1">
                            <select name="reminderDays" value={formState.reminderDays} onChange={handleChange} className="w-full">
                                <option value="-1">No recordar</option><option value="0">El día del vencimiento</option><option value="1">1 día antes</option>
                                <option value="3">3 días antes</option><option value="5">5 días antes</option><option value="7">1 semana antes</option>
                            </select>
                            <input type="time" name="reminderTime" value={formState.reminderTime} onChange={handleChange} className="w-full" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onCancel} className="bg-white/10 hover:bg-white/20 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-primary-600 hover:bg-primary-700 font-bold py-2 px-4 rounded-lg">Guardar</button>
                    </div>
                </form>
            ) : activeTab === 'periods' ? (
                <div className="space-y-4">
                    <p className="text-sm text-gray-300">Ajusta los montos para periodos específicos. Si un campo se deja vacío, se usará el monto por periodo predeterminado de {formatCurrency(formState.amountPerPeriod)}.</p>
                    <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                        {generatedFormPeriods.map((period, index) => {
                            const amountForPeriod = periodOverrides[period] ?? formState.amountPerPeriod;
                            const paidInPeriod = paymentsByPeriod.get(period) || 0;
                            const isPaid = paidInPeriod >= amountForPeriod && amountForPeriod > 0;

                            return (
                                <div key={period} className="grid grid-cols-3 items-center gap-2">
                                    <label htmlFor={`period-override-${period}`} className="text-sm font-medium">Periodo {index + 1} ({period}):</label>
                                    <div className="relative col-span-2 mt-1">
                                        <input
                                            type="number"
                                            id={`period-override-${period}`}
                                            placeholder={formatCurrency(formState.amountPerPeriod)}
                                            value={periodOverrides[period] ?? ''}
                                            onChange={(e) => handleOverrideChange(period, e.target.value)}
                                            className="w-full rounded-md shadow-sm disabled:bg-gray-700/50 disabled:cursor-not-allowed"
                                            disabled={isPaid}
                                            aria-describedby={isPaid ? `paid-info-${period}` : undefined}
                                        />
                                        {isPaid && (
                                            <div id={`paid-info-${period}`} className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none" title={`Periodo cubierto con ${formatCurrency(paidInPeriod)}`}>
                                                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                     <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onCancel} className="bg-white/10 hover:bg-white/20 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                        <button type="button" onClick={handleSubmit} className="bg-primary-600 hover:bg-primary-700 font-bold py-2 px-4 rounded-lg">Guardar Cambios</button>
                    </div>
                </div>

            ) : (
                <div className="space-y-4">
                    <div className="max-h-60 overflow-y-auto pr-2">
                        <table className="w-full text-left">
                           <thead><tr className="border-b border-white/20"><th className="p-2">Periodo</th><th className="p-2">Fecha</th><th className="p-2 text-right">Monto</th></tr></thead>
                           <tbody>
                               {(currentItem?.payments || []).length > 0 ? (currentItem?.payments || []).map(p => <tr key={p.id}><td className="p-2">{p.period}</td><td className="p-2">{new Date(p.date).toLocaleDateString()}</td><td className="p-2 text-right">{formatCurrency(p.amount)}</td></tr>) : <tr><td colSpan={3} className="text-center p-4 text-gray-400">No hay pagos registrados.</td></tr>}
                           </tbody>
                        </table>
                    </div>
                    <div className="border-t border-white/20 pt-4 space-y-2">
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
                        <button onClick={handleAddPayment} className="w-full bg-primary-600 hover:bg-primary-700 font-bold py-2 px-4 rounded-lg">Añadir Pago</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const SummaryCard: React.FC<{ title: string; amount: number; colorClass: string; children?: React.ReactNode }> = ({ title, amount, colorClass, children }) => (
    <GlassCard className={`p-4 flex flex-col justify-between ${colorClass}`}>
        <div>
            <div className="flex justify-between items-center text-gray-200">
                <h3 className="text-sm font-medium">{title}</h3>
            </div>
            <p className="mt-1 text-2xl font-semibold">{formatCurrency(amount)}</p>
        </div>
        {children}
    </GlassCard>
);

const BalanceProgressCircle: React.FC<{ percentage: number }> = ({ percentage }) => {
    const data = [
        { name: 'Used', value: percentage },
        { name: 'Remaining', value: Math.max(0, 100 - percentage) },
    ];
    return (
        <div className="w-16 h-16 relative">
            <ResponsiveContainer>
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius="80%" outerRadius="100%" startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                        <Cell fill="#3b82f6" />
                        <Cell fill="rgba(255, 255, 255, 0.2)" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold">{Math.round(percentage)}%</span>
            </div>
        </div>
    );
};

export const PlannedExpenses: React.FC = () => {
    const { appData: data, setData } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<{ item: PlannedExpense | null, defaultTab: 'details' | 'payments' }>({ item: null, defaultTab: 'details' });
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [successInfo, setSuccessInfo] = useState<{ title: string; message: string } | null>(null);
    const [view, setView] = useState<'list' | 'calendar'>('list');
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [expandedDueKey, setExpandedDueKey] = useState<string | null>(null);

    useEffect(() => {
        const expenseId = location.state?.openExpenseId;
        if (expenseId !== undefined) {
            const itemToEdit = expenseId ? data?.plannedExpenses.find(e => e.id === expenseId) : null;
            handleOpenModal(itemToEdit || null);
            navigate(location.pathname, { state: {}, replace: true });
        }
    }, [location.state, data?.plannedExpenses, navigate]);
    
    const handleOpenModal = (item: PlannedExpense | null = null, defaultTab: 'details' | 'payments' = 'details') => {
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
    
    const { summaryData, filteredExpenses, duesByDate, allDueDates, monthDues } = useMemo(() => {
        if (!data) return { summaryData: {}, filteredExpenses: [], duesByDate: new Map(), allDueDates: new Map(), monthDues: [] };
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

        const incomeThisMonth = data.incomes.filter(i => { const d = new Date(i.date); return d >= startOfMonth && d <= endOfMonth; }).reduce((sum, i) => sum + i.amount, 0);
        const totalPlannedForMonth = data.plannedExpenses.reduce((sum, pe) => { const periodStr = `${year}-${(month + 1).toString().padStart(2, '0')}`; return sum + (generatePeriods(pe).includes(periodStr) ? (pe.periodOverrides?.[periodStr] ?? pe.amountPerPeriod) : 0);}, 0);
        const paidThisMonth = data.plannedExpenses.reduce((sum, pe) => sum + pe.payments.filter(p => { const d = new Date(p.date); return d >= startOfMonth && d <= endOfMonth; }).reduce((pSum, p) => pSum + p.amount, 0), 0);
        const availableBalance = incomeThisMonth - paidThisMonth;
        const budgetUsage = incomeThisMonth > 0 ? (totalPlannedForMonth / incomeThisMonth) * 100 : 0;
        
        const term = searchTerm.toLowerCase();
        const allExpensesWithDetails = data.plannedExpenses.map(expense => {
            const concept = data.concepts.find(c => c.id === expense.conceptId);
            const nextPeriodToPay = getNextPeriodToPay(expense);
            const status = getStatusInfo(expense, nextPeriodToPay);
            return { ...expense, conceptName: concept?.name || 'N/A', status, nextPeriodToPay };
        }).filter(e => !term || e.conceptName.toLowerCase().includes(term));
        
        const dues = new Map<string, (PlannedExpense & { duePeriod: string; amountForPeriod: number })[]>();
        const allDates = new Map<string, Priority>();
        
        data.plannedExpenses.forEach(expense => {
            const paymentsByPeriod = new Map<string, number>();
            (expense.payments || []).forEach(p => {
                paymentsByPeriod.set(p.period, (paymentsByPeriod.get(p.period) || 0) + p.amount);
            });

            const periods = generatePeriods(expense);
            periods.forEach(period => {
                const paidAmount = paymentsByPeriod.get(period) || 0;
                const amountForPeriod = expense.periodOverrides?.[period] ?? expense.amountPerPeriod;

                if (paidAmount < amountForPeriod) {
                    const [pYear, pMonth] = period.split('-').map(Number);
                    const dueDate = new Date(pYear, pMonth - 1, expense.dueDay);
                    dueDate.setUTCHours(0, 0, 0, 0);
                    const dateKey = dueDate.toISOString().split('T')[0];

                    if (!dues.has(dateKey)) dues.set(dateKey, []);
                    dues.get(dateKey)!.push({ ...expense, duePeriod: period, amountForPeriod: amountForPeriod });
                    
                    const status = getStatusInfo(expense, getNextPeriodToPay(expense));
                    if (!allDates.has(dateKey) || status.priority > (allDates.get(dateKey) || Priority.BAJA)) {
                        allDates.set(dateKey, status.priority);
                    }
                }
            });
        });

        // For calendar month view
        const calendarYear = calendarDate.getFullYear();
        const calendarMonth = calendarDate.getMonth();
        const startOfVisibleMonth = new Date(calendarYear, calendarMonth, 1);
        const endOfVisibleMonth = new Date(calendarYear, calendarMonth + 1, 0);
        
        const duesForMonth: { due: PlannedExpense & { duePeriod: string, amountForPeriod: number }, date: Date }[] = [];
        
        for (let d = new Date(startOfVisibleMonth); d <= endOfVisibleMonth; d.setDate(d.getDate() + 1)) {
            const dateKey = new Date(d).toISOString().split('T')[0];
            const dayDues = dues.get(dateKey);
            if (dayDues) {
                 dayDues.forEach(due => {
                     duesForMonth.push({ due, date: new Date(d) });
                });
            }
        }

        return {
            summaryData: { incomeThisMonth, availableBalance, totalPlannedForMonth, paidThisMonth, budgetUsage },
            filteredExpenses: allExpensesWithDetails,
            duesByDate: dues,
            allDueDates: allDates,
            monthDues: duesForMonth.sort((a, b) => a.date.getTime() - b.date.getTime())
        };
    }, [data, currentDate, searchTerm, calendarDate]);

    if (!data) return <div className="text-white text-center">Cargando...</div>;

    const expenseConcepts = data.concepts.filter(c => data.costTypes.some(ct => ct.id === c.costTypeId && (ct.name === 'Fijo' || ct.name === 'Variable')));
    
    const renderDayCell = useCallback((date: Date) => {
        const today = new Date();
        today.setHours(0,0,0,0);
        date.setHours(0,0,0,0);

        const dateKey = date.toISOString().split('T')[0];
        const priority = allDueDates.get(dateKey);
        
        const isSelected = selectedDate ? date.getTime() === new Date(selectedDate).setHours(0,0,0,0).valueOf() : false;
        const isToday = date.getTime() === today.getTime();

        let cellClass = "relative flex flex-col items-center justify-center h-20 w-full rounded-lg cursor-pointer transition-colors hover:bg-white/10";
        if (isSelected) cellClass += " bg-primary-700/80";
        else if (isToday) cellClass += " ring-2 ring-primary-500";
        
        let dotColorClass = '';
        if(priority === Priority.ALTA) dotColorClass = 'bg-red-500';
        else if (priority === Priority.MEDIA) dotColorClass = 'bg-yellow-500';
        else if (priority === Priority.BAJA) dotColorClass = 'bg-blue-500';

        return (
            <div className={cellClass}>
                <span>{date.getDate()}</span>
                {priority && <div className={`absolute bottom-2 w-2 h-2 rounded-full ${dotColorClass}`}></div>}
            </div>
        );
    }, [selectedDate, allDueDates]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold">Gastos Planificados</h1>
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-black/20 flex items-center">
                        <button onClick={() => setView('list')} className={`p-1.5 rounded-md ${view === 'list' ? 'bg-primary-600' : ''}`}><ListBulletIcon className="w-5 h-5"/></button>
                        <button onClick={() => setView('calendar')} className={`p-1.5 rounded-md ${view === 'calendar' ? 'bg-primary-600' : ''}`}><CalendarIcon className="w-5 h-5"/></button>
                    </div>
                    <button onClick={() => handleOpenModal()} className="flex-shrink-0 flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">
                        <PlusIcon className="w-5 h-5" /> Añadir Gasto
                    </button>
                </div>
            </div>
            
            {view === 'list' ? (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <SummaryCard title="Ingresos del Mes" amount={summaryData.incomeThisMonth || 0} colorClass="bg-blue-900/30" />
                    <SummaryCard title="Saldo Disponible" amount={summaryData.availableBalance || 0} colorClass="bg-indigo-900/30">
                        <div className="flex justify-between items-end mt-2">
                             <p className="text-xs text-indigo-300">Comprometido <br/> {formatCurrency(summaryData.totalPlannedForMonth || 0)}</p>
                            <BalanceProgressCircle percentage={summaryData.budgetUsage || 0} />
                        </div>
                    </SummaryCard>
                    <SummaryCard title="Gastos Totales (Mes)" amount={summaryData.totalPlannedForMonth || 0} colorClass="bg-red-900/30" />
                    <SummaryCard title="Gastos Pagados (Mes)" amount={summaryData.paidThisMonth || 0} colorClass="bg-green-900/30" />
                </div>
                <GlassCard className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Todos los Gastos Planificados</h3>
                        <input type="text" placeholder="Buscar por concepto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-auto px-3 py-2 rounded-md shadow-sm" />
                    </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead><tr className="border-b border-white/20"><th className="p-2">Concepto</th><th className="p-2">Monto/Periodo</th><th className="p-2">Próximo Pago</th><th className="p-2">Estado</th><th className="p-2 text-right">Acciones</th></tr></thead>
                            <tbody>
                                {filteredExpenses.map(exp => (
                                    <tr key={exp.id} className="border-b border-white/10 hover:bg-white/10">
                                        <td className="p-2 flex items-center gap-2"><IconDisplay icon={exp.icon} iconColor={exp.iconColor} /><span className="font-medium">{exp.conceptName}</span></td>
                                        <td className="p-2">{formatCurrency(exp.amountPerPeriod)}</td>
                                        <td className="p-2">{exp.nextPeriodToPay ? `${exp.nextPeriodToPay.period} (Día ${exp.dueDay})` : 'Completado'}</td>
                                        <td className="p-2"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${exp.status.color}`}>{exp.status.text}</span></td>
                                        <td className="p-2 text-right">
                                            {(exp.status.text === 'Vencido' || exp.status.text === 'Próximo a Vencer') && (
                                                <button onClick={() => handleOpenModal(exp, 'payments')} className="text-green-400 hover:text-green-300 p-1" title="Registrar Pago">
                                                    <CurrencyDollarIcon className="w-5 h-5" />
                                                </button>
                                            )}
                                            <button onClick={() => handleOpenModal(exp)} className="text-primary-400 p-1"><EditIcon className="w-5 h-5"/></button>
                                            <button onClick={() => handleDelete(exp.id)} className="text-red-400 p-1 ml-2"><DeleteIcon className="w-5 h-5"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
                </>
            ) : (
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
                    <GlassCard className="p-4 flex flex-col h-full">
                        <h3 className="text-lg font-bold mb-4">Vencimientos de {calendarDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</h3>
                        <div className="flex-grow overflow-y-auto pr-2 space-y-2">
                            {monthDues.length > 0 ? monthDues.map(({ due, date }) => {
                                const concept = data.concepts.find(c => c.id === due.conceptId);
                                const uniqueKey = `${due.id}-${date.toISOString()}`;
                                const isExpanded = expandedDueKey === uniqueKey;
                                const paymentsForPeriod = due.payments.filter(p => p.period === due.duePeriod);
                                return (
                                <div key={uniqueKey} className="bg-black/20 rounded-lg">
                                    <div className="p-2 flex flex-col">
                                        <div 
                                            className="flex justify-between items-center text-sm cursor-pointer" 
                                            onClick={() => setExpandedDueKey(isExpanded ? null : uniqueKey)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-primary-300">{date.getDate()}</span>
                                                <span className="font-semibold">{concept?.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">{formatCurrency(due.amountForPeriod)}</span>
                                                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            </div>
                                        </div>
                                         <div className="flex justify-end gap-2 text-xs mt-2">
                                            <button onClick={() => handleOpenModal(due, 'payments')} className="bg-primary-600 hover:bg-primary-700 px-3 py-1 rounded-md">Pagar / Editar</button>
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="mt-2 p-2 border-t border-white/20 text-xs">
                                            <p className="font-semibold mb-1">Pagos para periodo {due.duePeriod}:</p>
                                            {paymentsForPeriod.length > 0 ? (
                                                <ul className="space-y-1 list-disc list-inside pl-2">
                                                    {paymentsForPeriod.map(p => (
                                                        <li key={p.id}>
                                                            {new Date(p.date).toLocaleDateString()}: <span className="font-semibold">{formatCurrency(p.amount)}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : <p className="text-gray-400 italic">No hay pagos registrados para este periodo.</p>}
                                        </div>
                                    )}
                                </div>
                            )}) : <p className="text-gray-400 text-center text-sm pt-4">No hay vencimientos para este mes.</p>}
                        </div>
                    </GlassCard>
                </div>
            )}
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem.item ? 'Editar Gasto Planificado' : 'Nuevo Gasto Planificado'}>
                <PlannedExpenseForm item={editingItem.item} concepts={expenseConcepts} onSave={handleSave} onCancel={handleCloseModal} data={data} setData={setData} defaultActiveTab={editingItem.defaultTab} />
            </Modal>
            <ConfirmationModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={confirmDelete} title="Eliminar Gasto" message="¿Estás seguro? Se eliminará el gasto y todos sus pagos registrados." />
            <SuccessToast isOpen={!!successInfo} onClose={() => setSuccessInfo(null)} title={successInfo?.title || ''} message={successInfo?.message || ''} />
        </div>
    );
};
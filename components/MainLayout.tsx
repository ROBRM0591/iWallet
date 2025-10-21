import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { AppData, DailyExpense, Income, MovementTypeName, Payment } from '../types';
import { COLOR_PALETTES } from '../constants';
import { Header } from './Header';
import { getNextPeriodToPay, generateSequentialId } from './utils';
import { PlusIcon, CloseIcon } from './Icons';

type Theme = 'light' | 'dark';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
const months = [
    { value: '01', label: 'Enero' }, { value: '02', label: 'Febrero' }, { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' }, { value: '05', label: 'Mayo' }, { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' }, { value: '08', label: 'Agosto' }, { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' }, { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' }
];

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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

interface QuickAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: AppData;
    setData: (data: AppData) => void;
}

const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose, data, setData }) => {
    const [activeTab, setActiveTab] = useState<'expense' | 'payment' | 'income'>('expense');
    
    const todayISO = new Date().toISOString().split('T')[0];
    const [expenseState, setExpenseState] = useState({ conceptId: '', amount: 0, date: todayISO });
    const [incomeState, setIncomeState] = useState({
        periodType: '1ra Quincena',
        month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
        year: new Date().getFullYear().toString(),
        amount: 0,
        date: todayISO,
        description: '',
    });
    const [paymentState, setPaymentState] = useState({ expenseId: '', amount: 0, date: todayISO, period: '', remaining: 0 });
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const movGastoId = useMemo(() => data.movementTypes.find(m => m.name === MovementTypeName.GASTO)?.id, [data.movementTypes]);
    const variableCostTypeId = useMemo(() => data.costTypes.find(ct => ct.name === 'Variable')?.id, [data.costTypes]);
    const expenseConcepts = useMemo(() => data.concepts.filter(c => c.movementTypeId === movGastoId && c.costTypeId === variableCostTypeId), [data.concepts, movGastoId, variableCostTypeId]);
    const fixedCostTypeId = useMemo(() => data.costTypes.find(ct => ct.name === 'Fijo')?.id, [data.costTypes]);
    const pendingPlannedExpenses = useMemo(() => {
        return data.plannedExpenses.filter(pe => {
            const concept = data.concepts.find(c => c.id === pe.conceptId);
            return getNextPeriodToPay(pe) !== null && concept?.costTypeId === fixedCostTypeId;
        });
    }, [data.plannedExpenses, data.concepts, fixedCostTypeId]);

    useEffect(() => {
        const { periodType, month, year } = incomeState;
        const monthLabel = months.find(m => m.value === month)?.label || '';
        setIncomeState(s => ({...s, description: `Nómina ${periodType} ${monthLabel} ${year}`}));
    }, [incomeState.periodType, incomeState.month, incomeState.year]);
    
    useEffect(() => {
        if (paymentState.expenseId) {
            const expense = data.plannedExpenses.find(pe => pe.id === paymentState.expenseId);
            if (!expense) return;

            const nextPeriod = getNextPeriodToPay(expense);
            if (nextPeriod) {
                const paidInPeriod = expense.payments
                    .filter(p => p.period === nextPeriod.period)
                    .reduce((sum, p) => sum + p.amount, 0);
                const remaining = expense.amountPerPeriod - paidInPeriod;
                setPaymentState(s => ({ ...s, period: nextPeriod.period, remaining, amount: remaining > 0 ? remaining : 0 }));
            }
        } else {
            setPaymentState(s => ({ ...s, period: '', remaining: 0, amount: 0 }));
        }
    }, [paymentState.expenseId, data.plannedExpenses]);

    const handleExpenseSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        if (!expenseState.conceptId) newErrors.conceptId = 'Debe seleccionar un concepto.';
        if (expenseState.amount <= 0) newErrors.amount = 'El monto debe ser mayor a 0.';
        if (!expenseState.date) newErrors.date = 'La fecha es requerida.';
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const newExpense: DailyExpense = {
            id: generateSequentialId('GD', data.dailyExpenses),
            conceptId: expenseState.conceptId,
            amount: expenseState.amount,
            date: new Date(expenseState.date).toISOString()
        };
        setData({ ...data, dailyExpenses: [...data.dailyExpenses, newExpense] });
        setExpenseState({ conceptId: '', amount: 0, date: todayISO });
        setErrors({});
        onClose();
    };

    const handleIncomeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        if (!incomeState.description.trim()) newErrors.description = 'La descripción es requerida.';
        if (incomeState.amount <= 0) newErrors.amount = 'El monto debe ser mayor a 0.';
        if (!incomeState.date) newErrors.date = 'La fecha es requerida.';
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const newIncome: Income = {
            id: generateSequentialId('IN', data.incomes),
            description: incomeState.description,
            amount: incomeState.amount,
            date: new Date(incomeState.date).toISOString()
        };
        setData({ ...data, incomes: [...data.incomes, newIncome] });
        setIncomeState({ periodType: '1ra Quincena', month: (new Date().getMonth() + 1).toString().padStart(2, '0'), year: new Date().getFullYear().toString(), amount: 0, date: todayISO, description: '' });
        setErrors({});
        onClose();
    };

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { expenseId, amount, date, period, remaining } = paymentState;
        
        const newErrors: Record<string, string> = {};
        if (!expenseId) newErrors.expenseId = 'Debe seleccionar un gasto planificado.';
        if (amount <= 0) newErrors.amount = 'El monto debe ser mayor a 0.';
        if (!date) newErrors.date = 'La fecha es requerida.';
        if (amount > remaining) newErrors.amount = `El monto no puede exceder el restante (${formatCurrency(remaining)}).`;
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const allPayments = data.plannedExpenses.flatMap(pe => pe.payments);
        const newPayment: Payment = {
            id: generateSequentialId('PA', allPayments),
            amount,
            date: new Date(date).toISOString(),
            period: period,
        };

        setData({
            ...data,
            plannedExpenses: data.plannedExpenses.map(pe => 
                pe.id === expenseId ? { ...pe, payments: [...pe.payments, newPayment] } : pe
            ),
        });
        
        setPaymentState({ expenseId: '', amount: 0, date: todayISO, period: '', remaining: 0 });
        setErrors({});
        onClose();
    };

    const resetForms = () => {
        setExpenseState({ conceptId: '', amount: 0, date: todayISO });
        setIncomeState({ periodType: '1ra Quincena', month: (new Date().getMonth() + 1).toString().padStart(2, '0'), year: new Date().getFullYear().toString(), amount: 0, date: todayISO, description: '' });
        setPaymentState({ expenseId: '', amount: 0, date: todayISO, period: '', remaining: 0 });
        setErrors({});
    };
    
    const handleTabChange = (tab: 'expense' | 'payment' | 'income') => {
        setActiveTab(tab);
        resetForms();
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registro Rápido">
             <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <button onClick={() => handleTabChange('expense')} className={`${activeTab === 'expense' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                        Gasto
                    </button>
                    <button onClick={() => handleTabChange('payment')} className={`${activeTab === 'payment' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                        Abono Planificado
                    </button>
                    <button onClick={() => handleTabChange('income')} className={`${activeTab === 'income' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                        Ingreso
                    </button>
                </nav>
            </div>
            {activeTab === 'expense' ? (
                <form onSubmit={handleExpenseSubmit} className="space-y-4 mt-4">
                     <div>
                        <label className="block text-sm font-medium">Concepto (Gasto Variable)</label>
                        <select value={expenseState.conceptId} onChange={e => setExpenseState(s => ({...s, conceptId: e.target.value}))} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm">
                            <option value="">Seleccione un concepto</option>
                            {expenseConcepts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {errors.conceptId && <p className="text-red-500 text-xs mt-1">{errors.conceptId}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Monto</label>
                        <input type="number" step="0.01" value={expenseState.amount || ''} onChange={e => setExpenseState(s => ({...s, amount: parseFloat(e.target.value)}))} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" />
                        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Fecha</label>
                        <input type="date" value={expenseState.date} onChange={e => setExpenseState(s => ({...s, date: e.target.value}))} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" />
                        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Guardar Gasto</button>
                    </div>
                </form>
            ) : activeTab === 'payment' ? (
                 <form onSubmit={handlePaymentSubmit} className="space-y-4 mt-4">
                     <div>
                        <label className="block text-sm font-medium">Gasto Planificado (Costo Fijo)</label>
                        <select value={paymentState.expenseId} onChange={e => setPaymentState(s => ({...s, expenseId: e.target.value}))} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm">
                            <option value="">Seleccione un gasto</option>
                            {pendingPlannedExpenses.map(pe => <option key={pe.id} value={pe.id}>{data.concepts.find(c => c.id === pe.conceptId)?.name}</option>)}
                        </select>
                         {paymentState.period && <p className="text-xs text-gray-500 mt-1">Abono para el periodo {months[Number(paymentState.period.split('-')[1]) - 1].label}. Restante: {formatCurrency(paymentState.remaining)}</p>}
                         {errors.expenseId && <p className="text-red-500 text-xs mt-1">{errors.expenseId}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Monto del Abono</label>
                        <input type="number" step="0.01" value={paymentState.amount || ''} onChange={e => setPaymentState(s => ({...s, amount: parseFloat(e.target.value)}))} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" disabled={!paymentState.expenseId} />
                        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Fecha del Abono</label>
                        <input type="date" value={paymentState.date} onChange={e => setPaymentState(s => ({...s, date: e.target.value}))} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" />
                        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Guardar Abono</button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleIncomeSubmit} className="space-y-4 mt-4">
                     <div>
                        <label className="block text-sm font-medium">Periodo</label>
                        <div className="flex gap-2 mt-1">
                             <select value={incomeState.periodType} onChange={e => setIncomeState(s => ({...s, periodType: e.target.value}))} className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm">
                                <option>1ra Quincena</option>
                                <option>2da Quincena</option>
                            </select>
                            <select value={incomeState.month} onChange={e => setIncomeState(s => ({...s, month: e.target.value}))} className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm">
                                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                            <select value={incomeState.year} onChange={e => setIncomeState(s => ({...s, year: e.target.value}))} className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm">
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Descripción</label>
                        <input type="text" value={incomeState.description} onChange={e => setIncomeState(s => ({...s, description: e.target.value}))} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" />
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Monto</label>
                        <input type="number" step="0.01" value={incomeState.amount || ''} onChange={e => setIncomeState(s => ({...s, amount: parseFloat(e.target.value)}))} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" />
                        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Fecha de Registro</label>
                        <input type="date" value={incomeState.date} onChange={e => setIncomeState(s => ({...s, date: e.target.value}))} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" />
                        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Guardar Ingreso</button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export const MainLayout: React.FC = () => {
    const { appData, setData, userProfile, logout } = useAuth();
    const [theme, setTheme] = useLocalStorage<Theme>('iwallet-theme', 'light');
    const [appIcon, setAppIcon] = useLocalStorage('iwallet-app-icon', 'wallet');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isQuickAddModalOpen, setQuickAddModalOpen] = useState(false);

    const refreshData = useCallback(() => {
        setIsRefreshing(true);
        setTimeout(() => {
            const item = window.localStorage.getItem('iwallet-session');
            if (item) {
                const session = JSON.parse(item);
                if (session.appData) {
                    setData(session.appData);
                }
            }
            setIsRefreshing(false);
        }, 1000);
    }, [setData]);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);
    
    useEffect(() => {
        const intervalId = setInterval(refreshData, 60000);
        return () => clearInterval(intervalId);
    }, [refreshData]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    }, [setTheme]);

    const setPalette = useCallback((palette: typeof COLOR_PALETTES[0]) => {
        const root = document.documentElement;
        Object.entries(palette.shades).forEach(([key, value]) => root.style.setProperty(`--color-primary-${key}`, value));
        root.style.setProperty('--color-primary', palette.hex);
    }, []);
    
    useEffect(() => {
        setPalette(COLOR_PALETTES[0]);
    }, [setPalette]);

    useEffect(() => {
        if (!appData || !('Notification' in window) || Notification.permission !== 'granted' || !appData.plannedExpenses) return;

        const NOTIFIED_EXPENSES_KEY = 'iwallet-notified-expenses';
        const getNotifiedExpenses = (): Record<string, string> => JSON.parse(localStorage.getItem(NOTIFIED_EXPENSES_KEY) || '{}');
        const setNotifiedExpense = (expenseId: string, period: string) => {
            const notified = getNotifiedExpenses();
            notified[`${expenseId}-${period}`] = new Date().toISOString();
            localStorage.setItem(NOTIFIED_EXPENSES_KEY, JSON.stringify(notified));
        };
        
        const now = new Date();
        const upcomingExpenses = appData.plannedExpenses.map(expense => {
            const nextPeriod = getNextPeriodToPay(expense);
            if (!nextPeriod) return null;
            const [year, month] = nextPeriod.period.split('-').map(Number);
            const dueDate = new Date(year, month - 1, expense.dueDay);
            if (now > dueDate) return null;
            if (expense.reminderDays < 0) return null;
            const reminderDate = new Date(dueDate);
            reminderDate.setDate(dueDate.getDate() - expense.reminderDays);
            const [hours = 9, minutes = 0] = (expense.reminderTime || appData.notifications.defaultReminderTime).split(':').map(Number);
            reminderDate.setHours(hours, minutes, 0, 0);
            if (now >= reminderDate) return { ...expense, dueDate, nextPeriod: nextPeriod.period };
            return null;
        }).filter(Boolean);

        const notifiedExpenses = getNotifiedExpenses();
        upcomingExpenses.forEach(expense => {
            if (!expense) return;
            const notificationId = `${expense.id}-${expense.nextPeriod}`;
            if (!notifiedExpenses[notificationId]) {
                const concept = appData.concepts.find(c => c.id === expense.conceptId);
                new Notification(`Recordatorio: ${concept?.name}`, {
                    body: `Tu pago de ${formatCurrency(expense.amountPerPeriod)} vence el ${expense.dueDate.toLocaleDateString('es-MX', {day: 'numeric', month: 'long'})}.`,
                    icon: "https://picsum.photos/192/192",
                    tag: notificationId,
                });
                setNotifiedExpense(expense.id, expense.nextPeriod);
            }
        });
    }, [appData]);

    if (!appData || !userProfile) {
        return <div>Cargando datos de la aplicación...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
            <Header
                username={userProfile.username}
                theme={theme}
                toggleTheme={toggleTheme}
                setPalette={setPalette}
                refreshData={refreshData}
                isRefreshing={isRefreshing}
                onLogout={logout}
                appIcon={appIcon}
            />
            <main>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Outlet context={{ appIcon, setAppIcon }} />
                </div>
            </main>
            <button
                onClick={() => setQuickAddModalOpen(true)}
                className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110 z-30"
                aria-label="Añadir registro rápido"
            >
                <PlusIcon className="w-6 h-6" />
            </button>
            <QuickAddModal 
                isOpen={isQuickAddModalOpen} 
                onClose={() => setQuickAddModalOpen(false)}
                data={appData}
                setData={setData}
            />
        </div>
    );
};
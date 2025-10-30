import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { AppData, DailyExpense, Income, MovementTypeName, Payment } from '../types';
import { COLOR_PALETTES } from '../constants';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { getNextPeriodToPay, generateSequentialId, toDateKey } from './utils';
import { PlusIcon, CloseIcon } from './Icons';

type Theme = 'light' | 'dark' | 'system';

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
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 backdrop-blur-xl border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all">
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

interface QuickAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: AppData;
    setData: (data: AppData) => void;
}

const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose, data, setData }) => {
    const [activeTab, setActiveTab] = useState<'expense' | 'payment' | 'income'>('expense');
    
    const todayISO = toDateKey(new Date());
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
    const variableCostTypeIdForDaily = useMemo(() => data.costTypes.find(ct => ct.name === 'Variable')?.id, [data.costTypes]);
    const expenseConcepts = useMemo(() => data.concepts.filter(c => c.movementTypeId === movGastoId && c.costTypeId === variableCostTypeIdForDaily), [data.concepts, movGastoId, variableCostTypeIdForDaily]);
    
    const fijoCostTypeId = useMemo(() => data.costTypes.find(ct => ct.name === 'Fijo')?.id, [data.costTypes]);
    const variableCostTypeId = useMemo(() => data.costTypes.find(ct => ct.name === 'Variable')?.id, [data.costTypes]);
    const pendingPlannedExpenses = useMemo(() => {
        return data.plannedExpenses.filter(pe => {
            const concept = data.concepts.find(c => c.id === pe.conceptId);
            if (!concept) return false;
            const isPlannedType = concept.costTypeId === fijoCostTypeId || concept.costTypeId === variableCostTypeId;
            return getNextPeriodToPay(pe) !== null && isPlannedType;
        });
    }, [data.plannedExpenses, data.concepts, fijoCostTypeId, variableCostTypeId]);

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
                    .reduce((sum, p) => sum + Number(p.amount), 0);
                const amountForPeriod = expense.periodOverrides?.[nextPeriod.period] ?? expense.amountPerPeriod;
                const remaining = Number(amountForPeriod) - paidInPeriod;
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
            date: new Date(`${expenseState.date}T00:00:00`).toISOString()
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
            date: new Date(`${incomeState.date}T00:00:00`).toISOString()
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
            date: new Date(`${date}T00:00:00`).toISOString(),
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
             <div className="border-b border-gray-200 dark:border-white/20">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <button onClick={() => handleTabChange('expense')} className={`${activeTab === 'expense' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                        Gasto Diario
                    </button>
                    <button onClick={() => handleTabChange('payment')} className={`${activeTab === 'payment' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                        Gasto Planificado
                    </button>
                    <button onClick={() => handleTabChange('income')} className={`${activeTab === 'income' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                        Ingreso
                    </button>
                </nav>
            </div>
            {activeTab === 'expense' ? (
                <form onSubmit={handleExpenseSubmit} className="space-y-4 mt-4">
                     <div>
                        <label className="block text-sm font-medium">Concepto (Gasto Diario)</label>
                        <select value={expenseState.conceptId} onChange={e => setExpenseState(s => ({...s, conceptId: e.target.value}))} className="mt-1 block w-full rounded-md shadow-sm">
                            <option value="">Seleccione un concepto</option>
                            {expenseConcepts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {errors.conceptId && <p className="text-red-400 text-xs mt-1">{errors.conceptId}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Monto</label>
                        <input type="number" step="0.01" value={expenseState.amount || ''} onChange={e => setExpenseState(s => ({...s, amount: parseFloat(e.target.value)}))} className="mt-1 block w-full rounded-md shadow-sm" />
                        {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Fecha</label>
                        <input type="date" value={expenseState.date} onChange={e => setExpenseState(s => ({...s, date: e.target.value}))} className="mt-1 block w-full rounded-md shadow-sm" />
                        {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Guardar Gasto</button>
                    </div>
                </form>
            ) : activeTab === 'payment' ? (
                 <form onSubmit={handlePaymentSubmit} className="space-y-4 mt-4">
                     <div>
                        <label className="block text-sm font-medium">Gasto Planificado (Fijo/Variable)</label>
                        <select value={paymentState.expenseId} onChange={e => setPaymentState(s => ({...s, expenseId: e.target.value}))} className="mt-1 block w-full rounded-md shadow-sm">
                            <option value="">Seleccione un gasto</option>
                            {pendingPlannedExpenses.map(pe => <option key={pe.id} value={pe.id}>{data.concepts.find(c => c.id === pe.conceptId)?.name}</option>)}
                        </select>
                         {paymentState.period && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Abono para el periodo {months.find(m => m.value === paymentState.period.split('-')[1])?.label}. Restante: {formatCurrency(paymentState.remaining)}</p>}
                         {errors.expenseId && <p className="text-red-400 text-xs mt-1">{errors.expenseId}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Monto del Abono</label>
                        <input type="number" step="0.01" value={paymentState.amount || ''} onChange={e => setPaymentState(s => ({...s, amount: parseFloat(e.target.value)}))} className="mt-1 block w-full rounded-md shadow-sm" disabled={!paymentState.expenseId} />
                        {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Fecha del Abono</label>
                        <input type="date" value={paymentState.date} onChange={e => setPaymentState(s => ({...s, date: e.target.value}))} className="mt-1 block w-full rounded-md shadow-sm" />
                        {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Guardar Abono</button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleIncomeSubmit} className="space-y-4 mt-4">
                     <div>
                        <label className="block text-sm font-medium">Periodo</label>
                        <div className="flex gap-2 mt-1">
                             <select value={incomeState.periodType} onChange={e => setIncomeState(s => ({...s, periodType: e.target.value}))} className="block w-full rounded-md shadow-sm">
                                <option>1ra Quincena</option>
                                <option>2da Quincena</option>
                            </select>
                            <select value={incomeState.month} onChange={e => setIncomeState(s => ({...s, month: e.target.value}))} className="block w-full rounded-md shadow-sm">
                                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                            <select value={incomeState.year} onChange={e => setIncomeState(s => ({...s, year: e.target.value}))} className="block w-full rounded-md shadow-sm">
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Descripción</label>
                        <input type="text" value={incomeState.description} onChange={e => setIncomeState(s => ({...s, description: e.target.value}))} className="mt-1 block w-full rounded-md shadow-sm" />
                        {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Monto</label>
                        <input type="number" step="0.01" value={incomeState.amount || ''} onChange={e => setIncomeState(s => ({...s, amount: parseFloat(e.target.value)}))} className="mt-1 block w-full rounded-md shadow-sm" />
                        {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Fecha de Registro</label>
                        <input type="date" value={incomeState.date} onChange={e => setIncomeState(s => ({...s, date: e.target.value}))} className="mt-1 block w-full rounded-md shadow-sm" />
                        {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Guardar Ingreso</button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export const MainLayout: React.FC = () => {
    const { appData, setData } = useAuth();
    const [theme, setTheme] = useLocalStorage<Theme>('iwallet-theme', 'system');
    const [palette, setPaletteState] = useLocalStorage('iwallet-palette', COLOR_PALETTES[2]);
    const [appIcon, setAppIcon] = useLocalStorage('iwallet-app-icon', 'wallet');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isQuickAddModalOpen, setQuickAddModalOpen] = useState(false);
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        const checkInstalled = () => {
            const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
            setIsInstalled(isPWA);
        };
        checkInstalled();

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
            checkInstalled();
        };
        const handleAppInstalled = () => {
            setInstallPrompt(null);
            setIsInstalled(true);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);


    const handleInstallClick = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the A2HS prompt');
        } else {
            console.log('User dismissed the A2HS prompt');
        }
        setInstallPrompt(null);
    };

    const refreshData = useCallback(() => {
        setIsRefreshing(true);
        setTimeout(() => {
            const item = window.localStorage.getItem('iwallet-data');
            if (item) {
                const session = JSON.parse(item);
                setData(session);
            }
            setIsRefreshing(false);
        }, 1000);
    }, [setData]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const applyTheme = () => {
            if (theme === 'system') {
                document.documentElement.classList.toggle('dark', mediaQuery.matches);
            } else {
                document.documentElement.classList.toggle('dark', theme === 'dark');
            }
        };

        const handleChange = () => {
            if (theme === 'system') {
                applyTheme();
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        applyTheme();

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);
    
    useEffect(() => {
        const intervalId = setInterval(refreshData, 60000);
        return () => clearInterval(intervalId);
    }, [refreshData]);

    const setPalette = useCallback((p: typeof COLOR_PALETTES[0]) => {
        setPaletteState(p);
        const root = document.documentElement;
        Object.entries(p.shades).forEach(([key, value]) => root.style.setProperty(`--color-primary-${key}`, value));
        root.style.setProperty('--color-primary', p.hex);
    }, [setPaletteState]);

    useEffect(() => {
        setPalette(palette);
    }, [palette, setPalette]);

    if (!appData) {
        return <div>Cargando...</div>; 
    }

    return (
        <div className="min-h-screen">
            <Header
                theme={theme}
                setTheme={setTheme}
                setPalette={setPalette}
                refreshData={refreshData}
                isRefreshing={isRefreshing}
                appIcon={appIcon}
            />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pb-8">
                <Outlet context={{ appIcon, setAppIcon, theme, setTheme, setPalette, installPrompt, handleInstallClick, isInstalled }} />
            </main>

            <button
                onClick={() => setQuickAddModalOpen(true)}
                className="fixed bottom-20 md:bottom-8 right-4 sm:right-6 lg:right-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg z-40 transition-transform hover:scale-110"
                aria-label="Añadir registro rápido"
            >
                <PlusIcon className="w-8 h-8" />
            </button>
            <QuickAddModal 
                isOpen={isQuickAddModalOpen}
                onClose={() => setQuickAddModalOpen(false)}
                data={appData}
                setData={setData}
            />
            <BottomNav />
        </div>
    );
};
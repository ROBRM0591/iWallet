import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { AppData, DailyExpense, Income, MovementTypeName, Payment, Concept, MonthlyBudget, SavingsGoal, Category } from '../types';
import { COLOR_PALETTES } from '../constants';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { getNextPeriodToPay, generateSequentialId, toDateKey } from './utils';
import { PlusIcon, CloseIcon, ChatBubbleLeftRightIcon, SparklesIcon, PiggyBankIcon, SavingsGoalIcon as TargetIcon } from './Icons';
import { ICON_SVGS } from '../utils/icon-svgs';
import { ChatHistory as AIAssistantWidget } from './ChatHistory';
import { Modal, SuccessToast } from './common/Portals';

type Theme = 'light' | 'dark' | 'system';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
const months = [
    { value: '01', label: 'Enero' }, { value: '02', label: 'Febrero' }, { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' }, { value: '05', label: 'Mayo' }, { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' }, { value: '08', label: 'Agosto' }, { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' }, { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' }
];

interface QuickAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: AppData;
    setData: (data: AppData) => void;
    setSuccessInfo: (info: { title: string; message: string } | null) => void;
}

const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose, data, setData, setSuccessInfo }) => {
    const [activeTab, setActiveTab] = useState<'expense' | 'payment' | 'income' | 'budget' | 'savings'>('expense');
    
    const todayISO = toDateKey(new Date());
    const [expenseState, setExpenseState] = useState({ conceptId: '', amount: 0, date: todayISO });
    const [incomeState, setIncomeState] = useState({ conceptId: '', amount: 0, date: todayISO });
    const [paymentState, setPaymentState] = useState({ expenseId: '', amount: 0, date: todayISO, period: '', remaining: 0 });
    const [budgetState, setBudgetState] = useState({ categoryId: '', amount: 0 });
    const [savingsGoalState, setSavingsGoalState] = useState({ name: '', targetAmount: 0, deadline: todayISO });
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const expenseConcepts = useMemo(() => {
        const movGastoId = data.movementTypes.find(m => m.name === MovementTypeName.GASTO)?.id;
        const corrienteCostTypeId = data.costTypes.find(ct => ct.name === 'Corriente')?.id;
        if (!movGastoId || !corrienteCostTypeId) return [];
        
        return data.concepts.filter(c => c.movementTypeId === movGastoId && c.costTypeId === corrienteCostTypeId);
    }, [data]);

    const incomeConcepts = useMemo(() => {
        const ingresoMovementType = data.movementTypes.find(m => m.name === MovementTypeName.INGRESO);
        if (!ingresoMovementType) return [];
        return data.concepts.filter(c => c.movementTypeId === ingresoMovementType.id);
    }, [data]);
    
    const pendingPlannedExpenses = useMemo(() => {
        const movGastoId = data.movementTypes.find(m => m.name === MovementTypeName.GASTO)?.id;
        const corrienteCostTypeId = data.costTypes.find(ct => ct.name === 'Corriente')?.id;

        // A planned expense must be a GASTO, and we need to be able to distinguish it from 'Corriente'
        if (!movGastoId || !corrienteCostTypeId) return [];

        return data.plannedExpenses.filter(pe => {
            const concept = data.concepts.find(c => c.id === pe.conceptId);
            if (!concept || concept.movementTypeId !== movGastoId) {
                return false;
            }
            
            // Planned expenses are by definition not 'Corriente' (daily) expenses.
            if (concept.costTypeId === corrienteCostTypeId) {
                return false;
            }
            
            // Only show expenses that have a pending payment period.
            return getNextPeriodToPay(pe) !== null;
        });
    }, [data]);


     const unbudgetedCategories = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const movGastoId = data.movementTypes.find(m => m.name === MovementTypeName.GASTO)?.id;
        const expenseCategories = data.categories.filter(c => c.movementTypeId === movGastoId);
        const budgetedCategoryIds = new Set(
            data.monthlyBudgets
                .filter(b => b.month === currentMonth && b.year === currentYear)
                .map(b => b.categoryId)
        );
        return expenseCategories.filter(c => !budgetedCategoryIds.has(c.id));
    }, [data]);

    useEffect(() => {
        if (activeTab === 'budget' && unbudgetedCategories.length > 0) {
            setBudgetState(s => ({ ...s, categoryId: unbudgetedCategories[0].id }));
        }
    }, [activeTab, unbudgetedCategories]);

    useEffect(() => {
        if (paymentState.expenseId) {
            const expense = data.plannedExpenses.find(pe => pe.id === paymentState.expenseId);
            if (!expense) return;

            const nextPeriod = getNextPeriodToPay(expense);
            if (nextPeriod) {
                const paidInPeriod = (expense.payments || [])
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
        setSuccessInfo({ title: 'Éxito', message: 'Gasto diario registrado.' });
        onClose();
    };

    const handleIncomeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        if (!incomeState.conceptId) newErrors.conceptId = 'El concepto es requerido.';
        if (incomeState.amount <= 0) newErrors.amount = 'El monto debe ser mayor a 0.';
        if (!incomeState.date) newErrors.date = 'La fecha es requerida.';
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const conceptName = incomeConcepts.find(c => c.id === incomeState.conceptId)?.name || 'Ingreso';

        const newIncome: Income = {
            id: generateSequentialId('IN', data.incomes),
            conceptId: incomeState.conceptId,
            description: conceptName,
            amount: incomeState.amount,
            date: new Date(`${incomeState.date}T00:00:00`).toISOString()
        };
        setData({ ...data, incomes: [...data.incomes, newIncome] });
        setSuccessInfo({ title: 'Éxito', message: 'Ingreso registrado.' });
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

        const allPayments = data.plannedExpenses.flatMap(pe => pe.payments || []);
        const newPayment: Payment = {
            id: generateSequentialId('PA', allPayments),
            amount,
            date: new Date(`${date}T00:00:00`).toISOString(),
            period: period,
        };

        setData({
            ...data,
            plannedExpenses: data.plannedExpenses.map(pe => 
                pe.id === expenseId ? { ...pe, payments: [...(pe.payments || []), newPayment] } : pe
            ),
        });
        setSuccessInfo({ title: 'Éxito', message: 'Abono registrado.' });
        onClose();
    };
    
    const handleBudgetSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        if (!budgetState.categoryId) newErrors.categoryId = 'Debe seleccionar una categoría.';
        if (budgetState.amount <= 0) newErrors.amount = 'El monto debe ser mayor a 0.';
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const now = new Date();
        const newBudget: MonthlyBudget = {
            id: generateSequentialId('PR', data.monthlyBudgets),
            categoryId: budgetState.categoryId,
            amount: budgetState.amount,
            month: now.getMonth(),
            year: now.getFullYear(),
        };
        setData({ ...data, monthlyBudgets: [...data.monthlyBudgets, newBudget] });
        setSuccessInfo({ title: 'Éxito', message: 'Presupuesto añadido.' });
        onClose();
    };

    const handleSavingsGoalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        if (!savingsGoalState.name.trim()) newErrors.name = 'El nombre es requerido.';
        if (savingsGoalState.targetAmount <= 0) newErrors.targetAmount = 'El monto objetivo debe ser mayor a 0.';
        if (!savingsGoalState.deadline) newErrors.deadline = 'La fecha límite es requerida.';
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const newGoal: SavingsGoal = {
            id: generateSequentialId('MA', data.savingsGoals),
            name: savingsGoalState.name,
            targetAmount: savingsGoalState.targetAmount,
            deadline: new Date(`${savingsGoalState.deadline}T00:00:00`).toISOString(),
            currentAmount: 0,
            icon: 'target',
            iconColor: 'text-gray-800 dark:text-white',
        };
        setData({ ...data, savingsGoals: [...data.savingsGoals, newGoal] });
        setSuccessInfo({ title: 'Éxito', message: 'Nueva meta de ahorro creada.' });
        onClose();
    };

    const resetForms = useCallback(() => {
        setExpenseState({ conceptId: '', amount: 0, date: todayISO });
        setIncomeState({ conceptId: '', amount: 0, date: todayISO });
        setPaymentState({ expenseId: '', amount: 0, date: todayISO, period: '', remaining: 0 });
        setBudgetState({ categoryId: unbudgetedCategories.length > 0 ? unbudgetedCategories[0].id : '', amount: 0 });
        setSavingsGoalState({ name: '', targetAmount: 0, deadline: todayISO });
        setErrors({});
    }, [todayISO, unbudgetedCategories]);
    
    useEffect(() => {
        if (!isOpen) {
            resetForms();
        }
    }, [isOpen, resetForms]);

    const handleTabChange = (tab: 'expense' | 'payment' | 'income' | 'budget' | 'savings') => {
        setActiveTab(tab);
        resetForms();
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registro Rápido">
             <div className="border-b border-gray-200 dark:border-white/20">
                <nav className="-mb-px flex flex-wrap space-x-2 sm:space-x-4" aria-label="Tabs">
                    <button onClick={() => handleTabChange('expense')} className={`${activeTab === 'expense' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Gasto</button>
                    <button onClick={() => handleTabChange('payment')} className={`${activeTab === 'payment' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Abono</button>
                    <button onClick={() => handleTabChange('income')} className={`${activeTab === 'income' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Ingreso</button>
                    <button onClick={() => handleTabChange('budget')} className={`${activeTab === 'budget' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Presupuesto</button>
                    <button onClick={() => handleTabChange('savings')} className={`${activeTab === 'savings' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Meta</button>
                </nav>
            </div>
            {activeTab === 'expense' && (
                <form onSubmit={handleExpenseSubmit} className="space-y-4 mt-4">
                     <div>
                        <label className="block text-sm font-medium">Concepto (Gasto Diario)</label>
                        <select value={expenseState.conceptId} onChange={e => setExpenseState(s => ({...s, conceptId: e.target.value}))} className="mt-1 block w-full px-4 py-2 rounded-md">
                            <option value="">Seleccione...</option>
                            {expenseConcepts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {errors.conceptId && <p className="text-red-500 text-xs mt-1">{errors.conceptId}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Monto</label>
                            <input type="number" value={expenseState.amount || ''} onChange={e => setExpenseState(s => ({...s, amount: parseFloat(e.target.value)}))} className="mt-1 block w-full rounded-md" />
                             {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                        </div>
                         <div>
                            <label className="block text-sm font-medium">Fecha</label>
                            <input type="date" value={expenseState.date} onChange={e => setExpenseState(s => ({...s, date: e.target.value}))} className="mt-1 block w-full rounded-md" />
                            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Registrar Gasto</button>
                </form>
            )}
            {activeTab === 'payment' && (
                 <form onSubmit={handlePaymentSubmit} className="space-y-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium">Gasto Planificado</label>
                        <select value={paymentState.expenseId} onChange={e => setPaymentState(s => ({...s, expenseId: e.target.value}))} className="mt-1 block w-full rounded-md">
                            <option value="">Seleccione un gasto...</option>
                            {pendingPlannedExpenses.map(pe => <option key={pe.id} value={pe.id}>{data.concepts.find(c => c.id === pe.conceptId)?.name}</option>)}
                        </select>
                         {errors.expenseId && <p className="text-red-500 text-xs mt-1">{errors.expenseId}</p>}
                    </div>
                     {paymentState.expenseId && (
                        <div className="p-2 bg-gray-100 dark:bg-black/20 rounded-md text-sm">
                            <p><strong>Periodo a Pagar:</strong> {paymentState.period}</p>
                            <p><strong>Monto Restante:</strong> {formatCurrency(paymentState.remaining)}</p>
                        </div>
                    )}
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Monto a Pagar</label>
                            <input type="number" value={paymentState.amount || ''} onChange={e => setPaymentState(s => ({...s, amount: parseFloat(e.target.value)}))} className="mt-1 block w-full rounded-md" />
                            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                        </div>
                         <div>
                            <label className="block text-sm font-medium">Fecha de Pago</label>
                            <input type="date" value={paymentState.date} onChange={e => setPaymentState(s => ({...s, date: e.target.value}))} className="mt-1 block w-full rounded-md" />
                            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                        </div>
                    </div>
                     <button type="submit" disabled={!paymentState.expenseId} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">Registrar Abono</button>
                </form>
            )}
            {activeTab === 'income' && (
                <form onSubmit={handleIncomeSubmit} className="space-y-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium">Concepto de Ingreso</label>
                        <select value={incomeState.conceptId} onChange={e => setIncomeState(s => ({...s, conceptId: e.target.value}))} className="mt-1 block w-full rounded-md">
                            <option value="">Seleccione un concepto</option>
                            {incomeConcepts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {errors.conceptId && <p className="text-red-500 text-xs mt-1">{errors.conceptId}</p>}
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Monto</label>
                            <input type="number" value={incomeState.amount || ''} onChange={e => setIncomeState(s => ({...s, amount: parseFloat(e.target.value)}))} className="mt-1 block w-full rounded-md" />
                             {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                        </div>
                         <div>
                            <label className="block text-sm font-medium">Fecha</label>
                            <input type="date" value={incomeState.date} onChange={e => setIncomeState(s => ({...s, date: e.target.value}))} className="mt-1 block w-full rounded-md" />
                            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Registrar Ingreso</button>
                </form>
            )}
            {activeTab === 'budget' && (
                <form onSubmit={handleBudgetSubmit} className="space-y-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium">Categoría sin Presupuesto</label>
                        <select value={budgetState.categoryId} onChange={e => setBudgetState(s => ({...s, categoryId: e.target.value}))} className="mt-1 block w-full rounded-md" disabled={unbudgetedCategories.length === 0}>
                            {unbudgetedCategories.length > 0 ? (
                                unbudgetedCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                            ) : (
                                <option>Todas las categorías tienen presupuesto</option>
                            )}
                        </select>
                        {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Monto Presupuestado</label>
                        <input type="number" value={budgetState.amount || ''} onChange={e => setBudgetState(s => ({...s, amount: parseFloat(e.target.value)}))} className="mt-1 block w-full rounded-md" disabled={unbudgetedCategories.length === 0} />
                        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                    </div>
                    <button type="submit" disabled={unbudgetedCategories.length === 0} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">Añadir Presupuesto</button>
                </form>
            )}
            {activeTab === 'savings' && (
                <form onSubmit={handleSavingsGoalSubmit} className="space-y-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium">Nombre de la Meta</label>
                        <input type="text" value={savingsGoalState.name} onChange={e => setSavingsGoalState(s => ({...s, name: e.target.value}))} className="mt-1 block w-full rounded-md" />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium">Monto Objetivo</label>
                            <input type="number" value={savingsGoalState.targetAmount || ''} onChange={e => setSavingsGoalState(s => ({...s, targetAmount: parseFloat(e.target.value)}))} className="mt-1 block w-full rounded-md" />
                            {errors.targetAmount && <p className="text-red-500 text-xs mt-1">{errors.targetAmount}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Fecha Límite</label>
                            <input type="date" value={savingsGoalState.deadline} onChange={e => setSavingsGoalState(s => ({...s, deadline: e.target.value}))} className="mt-1 block w-full rounded-md" />
                            {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>}
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Crear Meta de Ahorro</button>
                </form>
            )}
        </Modal>
    );
};


// Main Layout Component
export const MainLayout: React.FC = () => {
    const { appData, setData } = useAuth();
    const [theme, setTheme] = useLocalStorage<Theme>('iwallet-theme', 'system');
    const [palette, setPalette] = useLocalStorage('iwallet-palette', COLOR_PALETTES[2]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [appIcon, setAppIcon] = useLocalStorage('iwallet-app-icon', 'wallet');
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isFabMenuOpen, setFabMenuOpen] = useState(false);
    const [successInfo, setSuccessInfo] = useState<{ title: string; message: string; } | null>(null);
    const fabRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
                setFabMenuOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setFabMenuOpen(false);
            }
        };

        if (isFabMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isFabMenuOpen]);


     useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);

        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
        });

        // Check if the app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
            setIsInstalled(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = () => {
        if (installPrompt) {
            installPrompt.prompt();
            installPrompt.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                    setIsInstalled(true);
                }
                setInstallPrompt(null);
            });
        }
    };
    
    // Favicon update logic
    useEffect(() => {
        const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (link) {
            const svgData = ICON_SVGS[appIcon] || ICON_SVGS['wallet'];
            link.href = `data:image/svg+xml,${encodeURIComponent(svgData.replace('{{color}}', palette.hex))}`;
        }
    }, [appIcon, palette]);

    // Theme and Palette application logic
    useEffect(() => {
        const root = window.document.documentElement;
        
        // Apply theme
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (theme === 'dark' || (theme === 'system' && systemPrefersDark)) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Apply palette
        Object.entries(palette.shades).forEach(([shade, color]) => {
            root.style.setProperty(`--color-primary-${shade}`, color);
        });
        root.style.setProperty('--color-primary', palette.hex);
        
    }, [theme, palette]);

    const refreshData = useCallback(() => {
        setIsRefreshing(true);
        const storedData = localStorage.getItem('appData');
        if (storedData) {
            setData(JSON.parse(storedData));
        }
        setTimeout(() => setIsRefreshing(false), 500);
    }, [setData]);

    const openAIAssistant = () => {
        setIsAIAssistantOpen(true);
        setIsQuickAddOpen(false);
        setFabMenuOpen(false);
    };

    const openQuickAdd = () => {
        setIsAIAssistantOpen(false);
        setIsQuickAddOpen(true);
        setFabMenuOpen(false);
    };

    const toggleFabMenu = () => {
        setFabMenuOpen(prev => !prev);
    };

    return (
        <div className="bg-slate-100 dark:bg-slate-900 min-h-screen text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
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
            <BottomNav />
            {appData && (
                <QuickAddModal 
                    isOpen={isQuickAddOpen}
                    onClose={() => setIsQuickAddOpen(false)}
                    data={appData}
                    setData={setData}
                    setSuccessInfo={setSuccessInfo}
                />
            )}
            <AIAssistantWidget isOpen={isAIAssistantOpen} />
            { isAIAssistantOpen &&
                <button onClick={() => setIsAIAssistantOpen(false)} className="fixed inset-0 bg-transparent z-30" aria-label="Cerrar asistente AI"></button>
            }
             <SuccessToast 
                isOpen={!!successInfo}
                onClose={() => setSuccessInfo(null)}
                title={successInfo?.title || ''}
                message={successInfo?.message || ''}
            />

            <div ref={fabRef} className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-4">
                {isFabMenuOpen && (
                    <div className="flex flex-col items-end gap-4 animate-fadeInUp" style={{animationDuration: '200ms'}}>
                        <div className="flex items-center gap-3">
                            <span className="bg-slate-900/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">Asistente AI</span>
                            <button
                                onClick={openAIAssistant}
                                className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110"
                                aria-label="Abrir Asistente AI"
                            >
                                <SparklesIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                             <span className="bg-slate-900/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">Registro Rápido</span>
                            <button
                                onClick={openQuickAdd}
                                className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110"
                                aria-label="Registro Rápido"
                            >
                                <PlusIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                )}
                
                <button
                    onClick={toggleFabMenu}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110"
                    aria-label={isFabMenuOpen ? "Cerrar menú rápido" : "Abrir menú rápido"}
                >
                    {isFabMenuOpen ? <CloseIcon className="w-6 h-6" /> : <SparklesIcon className="w-6 h-6" />}
                </button>
            </div>
        </div>
    );
};

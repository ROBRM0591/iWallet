import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { getNextPeriodToPay, generateSequentialId, generatePeriods, getStatusInfo, toDateKey } from './utils';
import { IconDisplay, PREDEFINED_ICONS } from './IconDisplay';
import { useAuth } from '../contexts/AuthContext';
import { PlannedExpense, Payment, Concept, Priority, SavingsGoal, DailyExpense, Income } from '../types';
import { TrendingUpIcon, TrendingDownIcon, WalletIcon, ClockIcon, TargetIcon, PieChartIcon, ActivityIcon, CloseIcon, ChevronDownIcon, CheckCircleIcon, ListBulletIcon, CurrencyDollarIcon } from './Icons';
import { PlannedExpenseIcon as CalendarIcon } from './PlannedExpenses';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

const GlassCard: React.FC<{ children: React.ReactNode; className?: string, style?: React.CSSProperties }> = ({ children, className = '', style }) => (
    <div style={style} className={`bg-white/90 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg text-gray-900 dark:text-white ${className}`}>
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


const SavingsGoalWidget: React.FC<{ goal: SavingsGoal | null }> = ({ goal }) => {
    const progress = goal && Number(goal.targetAmount) > 0 ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100 : 0;
    const daysLeft = goal ? Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;
    const progressBarColor = progress >= 100 ? 'bg-green-500' : progress > 75 ? 'bg-blue-500' : progress > 40 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="p-4 sm:p-6 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl">Meta de Ahorro</h3>
                <TargetIcon className="w-6 h-6 text-gray-400" />
            </div>
            {goal ? (
                <div className="flex-grow flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-3">
                        <IconDisplay icon={goal.icon} iconColor={goal.iconColor} className="w-8 h-8" />
                        <h4 className="text-lg font-bold truncate">{goal.name}</h4>
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Progreso</p>
                            <p className="text-xl font-bold">{formatCurrency(goal.currentAmount)}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">de {formatCurrency(goal.targetAmount)}</p>
                        </div>
                        <p className="text-3xl font-bold">{progress.toFixed(0)}%</p>
                    </div>
                    <div className="mt-2 h-3 w-full bg-gray-200 dark:bg-black/30 rounded-full">
                        <div className={`${progressBarColor} h-3 rounded-full transition-all duration-500`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                    </div>
                    <div className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
                        {progress >= 100 ? "¡Meta Alcanzada! 🎉" : `${daysLeft} días restantes`}
                    </div>
                </div>
            ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 my-auto flex-grow flex flex-col justify-center items-center">
                    <TargetIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    No hay metas de ahorro.
                </div>
            )}
        </div>
    );
};


const CategoryDonutChart: React.FC<{ data: { name: string, value: number, percent: number }[] }> = ({ data }) => {
    const COLORS = ['#3b82f6', '#f59e0b', '#ec4899', '#10b981', '#8b5cf6', '#ef4444'];
    
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="p-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-gray-200 dark:border-white/20 rounded-md shadow-lg text-gray-900 dark:text-white text-sm">
                    <p className="font-bold mb-1">{payload[0].name}</p>
                    <p>
                        <span className="font-semibold">{formatCurrency(payload[0].value)}</span>
                        <span className="text-gray-600 dark:text-gray-400"> ({(payload[0].payload.percent * 100).toFixed(1)}%)</span>
                    </p>
                </div>
            );
        }
        return null;
    };
    
    const renderLegend = (props: any) => {
        const { payload } = props;
        return (
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4 text-xs">
                {payload.map((entry: any, index: number) => (
                    <div key={`item-${index}`} className="flex items-center space-x-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span>{entry.value} ({(entry.payload.percent * 100).toFixed(1)}%)</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                    cornerRadius={10}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend content={renderLegend} />
            </PieChart>
        </ResponsiveContainer>
    );
}

interface DueExpense extends PlannedExpense {
    concept: Concept | undefined;
    amountForPeriod: number;
    paidInPeriod: number;
    status: ReturnType<typeof getStatusInfo>;
    dueDate: Date;
    duePeriod: string;
}

interface RecentActivityItem {
    id: string;
    date: Date;
    type: 'income' | 'daily' | 'payment';
    description: string;
    amount: number;
    icon?: string;
    iconColor?: string;
}

const DueExpensesWidget: React.FC<{ 
    dues: DueExpense[], 
    onAddPayment: (expenseId: string, period: string, form: { amount: number, date: string }) => void 
}> = ({ dues, onAddPayment }) => {
    const [expandedDueId, setExpandedDueId] = useState<string | null>(null);
    const [paymentForm, setPaymentForm] = useState<{ amount: number | '', date: string }>({ amount: '', date: toDateKey(new Date()) });

    const urgentDues = dues
        .filter(d => d.status.text !== 'Pagado' && d.status.text !== 'Al Corriente')
        .sort((a, b) => a.status.priority - b.status.priority || a.dueDate.getTime() - b.dueDate.getTime());
    
    const handleExpand = (due: DueExpense) => {
        if (expandedDueId === due.id) {
            setExpandedDueId(null);
        } else {
            const remaining = due.amountForPeriod - due.paidInPeriod;
            setPaymentForm({ amount: remaining > 0 ? remaining : '', date: toDateKey(new Date()) });
            setExpandedDueId(due.id);
        }
    };

    const handlePaymentSubmit = (e: React.FormEvent, expenseId: string, period: string) => {
        e.preventDefault();
        onAddPayment(expenseId, period, { amount: Number(paymentForm.amount), date: paymentForm.date });
        setExpandedDueId(null);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl">Próximos Vencimientos</h3>
                <CalendarIcon className="w-6 h-6 text-gray-400" />
            </div>
            {urgentDues.length > 0 ? (
                <div className="space-y-2 overflow-y-auto flex-grow pr-2">
                    {urgentDues.map(due => (
                        <div key={due.id}>
                            <div 
                                className="p-2 bg-gray-100 dark:bg-black/20 rounded-lg flex justify-between items-center cursor-pointer"
                                onClick={() => handleExpand(due)}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <IconDisplay icon={due.icon} iconColor={due.iconColor} className="w-5 h-5 flex-shrink-0" />
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-medium truncate">{due.concept?.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Restan: {formatCurrency(due.amountForPeriod - due.paidInPeriod)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${due.status.color}`}>
                                        {due.status.text}
                                    </span>
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${expandedDueId === due.id ? 'rotate-180' : ''}`} />
                                </div>
                            </div>
                            {expandedDueId === due.id && (
                                <form onSubmit={(e) => handlePaymentSubmit(e, due.id, due.duePeriod)} className="mt-2 p-3 bg-gray-200 dark:bg-black/30 rounded-lg space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({...f, amount: Number(e.target.value)}))} placeholder="Monto" className="w-full" />
                                        <input type="date" value={paymentForm.date} onChange={e => setPaymentForm(f => ({...f, date: e.target.value}))} className="w-full" />
                                    </div>
                                    <button type="submit" className="w-full bg-primary-600 text-white font-bold py-1.5 px-3 rounded-md text-sm">Registrar Abono</button>
                                </form>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 my-auto flex-grow flex flex-col justify-center items-center">
                    <CheckCircleIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    ¡Todo al corriente!
                </div>
            )}
        </div>
    );
};


export const Dashboard: React.FC = () => {
    const { appData: data, setData, userProfile } = useAuth();
    const navigate = useNavigate();
    
    const getSummaryCardName = (card: string, defaultName: string) => userProfile?.summaryCardNames?.[card] || defaultName;

    if (!data) {
        return <div className="text-white text-center">Cargando...</div>;
    }

    const handleAddPayment = (expenseId: string, period: string, form: { amount: number, date: string }) => {
        if (!expenseId || !data) return;
        const amount = Number(form.amount);
        if (amount <= 0 || !form.date) return;

        const allPayments = data.plannedExpenses.flatMap(pe => pe.payments || []);
        const newPayment: Payment = {
            id: generateSequentialId('PA', allPayments),
            amount: amount,
            date: new Date(`${form.date}T00:00:00`).toISOString(),
            period: period,
        };

        const updatedExpenses = data.plannedExpenses.map(pe => 
            pe.id === expenseId ? { ...pe, payments: [...(pe.payments || []), newPayment] } : pe
        );
        setData({ ...data, plannedExpenses: updatedExpenses });
    };

    const { summary, periodDues, categorySpendingData, firstSavingsGoal, recentActivity } = useMemo(() => {
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

        const dues: DueExpense[] = [];
        data.plannedExpenses.forEach(expense => {
            if (generatePeriods(expense).includes(periodStr)) {
                const paymentsByPeriod = new Map<string, number>();
                (expense.payments || []).forEach(p => {
                    paymentsByPeriod.set(p.period, (paymentsByPeriod.get(p.period) || 0) + Number(p.amount));
                });
                
                const paidInPeriod = paymentsByPeriod.get(periodStr) || 0;
                const amountForPeriod = Number(expense.periodOverrides?.[periodStr] ?? expense.amountPerPeriod);
                const concept = data.concepts.find(c => c.id === expense.conceptId);
                const status = getStatusInfo(expense);
                const dueDate = new Date(now.getFullYear(), now.getMonth(), expense.dueDay);
                dues.push({ ...expense, concept, amountForPeriod, paidInPeriod, status, dueDate, duePeriod: periodStr });
            }
        });

        // Category Spending
        let totalSpendingThisMonth = 0;
        const categoryMap = new Map<string, number>();
        [...data.dailyExpenses, ...data.plannedExpenses.flatMap(pe => pe.payments || [])].forEach(transaction => {
            const tDate = new Date(transaction.date);
            if (tDate >= startOfMonth && tDate <= endOfMonth) {
                totalSpendingThisMonth += Number(transaction.amount);
                const conceptId = 'conceptId' in transaction ? transaction.conceptId : data.plannedExpenses.find(pe => (pe.payments || []).some(p => p.id === transaction.id))?.conceptId;
                if(conceptId) {
                    const concept = data.concepts.find(c => c.id === conceptId);
                    if (concept?.categoryId) {
                        const categoryName = data.categories.find(cat => cat.id === concept.categoryId)?.name || 'Sin Categoría';
                        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + Number(transaction.amount));
                    }
                }
            }
        });
        const spendingData = Array.from(categoryMap.entries())
            .map(([name, value]) => ({ name, value, percent: totalSpendingThisMonth > 0 ? value / totalSpendingThisMonth : 0 }))
            .sort((a, b) => b.value - a.value);
            
        // Recent Activity
        const activity: RecentActivityItem[] = [];
        data.incomes.forEach(i => {
            const concept = data.concepts.find(c => c.id === i.conceptId);
            activity.push({ 
                id: i.id, 
                date: new Date(i.date), 
                type: 'income', 
                description: concept?.name || i.description, // Fallback to description for old data
                amount: i.amount, 
                icon: concept?.icon || 'arrow-up', 
                iconColor: concept?.iconColor || 'text-green-500' 
            });
        });
        data.dailyExpenses.forEach(d => {
            const concept = data.concepts.find(c => c.id === d.conceptId);
            activity.push({ id: d.id, date: new Date(d.date), type: 'daily', description: concept?.name || 'Gasto Diario', amount: d.amount, icon: concept?.icon, iconColor: concept?.iconColor });
        });
        data.plannedExpenses.forEach(p => {
            (p.payments || []).forEach(pm => {
                const concept = data.concepts.find(c => c.id === p.conceptId);
                activity.push({ id: pm.id, date: new Date(pm.date), type: 'payment', description: concept?.name || 'Gasto Planificado', amount: pm.amount, icon: p.icon, iconColor: p.iconColor });
            });
        });

        const recentActivity = activity.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 15);

        return {
            summary,
            periodDues: dues.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()),
            categorySpendingData: spendingData,
            firstSavingsGoal: data.savingsGoals.length > 0 ? data.savingsGoals[0] : null,
            recentActivity
        };
    }, [data]);
    
    return (
        <div className="space-y-6">
            <GlassCard className="p-4 sm:p-6 animate-fadeInUp">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold">Dashboard</h1>
                         <p className="text-gray-500 dark:text-gray-300 dark:opacity-80">{new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-300 dark:opacity-80">Balance del Mes</p>
                        <p className="text-3xl sm:text-4xl font-bold">{formatCurrency(summary.periodBalance)}</p>
                    </div>
                </div>
            </GlassCard>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard title={`${getSummaryCardName('income', "Ingresos")} del Mes`} amount={summary.periodIncome} icon={<TrendingUpIcon />} colors={{ iconBg: 'bg-emerald-100 dark:bg-emerald-900/50', iconText: 'text-emerald-600 dark:text-emerald-400' }} />
                <SummaryCard title={`${getSummaryCardName('expenses', "Gastos")} del Mes`} amount={summary.periodExpenses} icon={<TrendingDownIcon />} colors={{ iconBg: 'bg-red-100 dark:bg-red-900/50', iconText: 'text-red-600 dark:text-red-400' }} />
                <SummaryCard title={`${getSummaryCardName('balance', "Disponible")} del Mes`} amount={summary.periodBalance} icon={<WalletIcon />} colors={{ iconBg: 'bg-blue-100 dark:bg-blue-900/50', iconText: 'text-blue-600 dark:text-blue-400' }} />
                <SummaryCard title={`${getSummaryCardName('pending', "Pendiente")} del Mes`} amount={summary.pendingInPeriod} icon={<ClockIcon />} colors={{ iconBg: 'bg-amber-100 dark:bg-amber-900/50', iconText: 'text-amber-600 dark:text-amber-400' }} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <GlassCard className="lg:col-span-2 p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-xl">Gastos por Categoría</h3>
                        <PieChartIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    {categorySpendingData.length > 0 ? (
                        <CategoryDonutChart data={categorySpendingData} />
                    ) : (
                         <div className="text-center text-gray-500 dark:text-gray-400 h-60 flex flex-col justify-center items-center">
                            <PieChartIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            No hay gastos este mes.
                        </div>
                    )}
                </GlassCard>
                <GlassCard>
                    <SavingsGoalWidget goal={firstSavingsGoal} />
                </GlassCard>
            </div>
            
             <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <GlassCard className="lg:col-span-3 p-4 sm:p-6">
                    <DueExpensesWidget dues={periodDues} onAddPayment={handleAddPayment} />
                </GlassCard>
                <GlassCard className="lg:col-span-2 p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-xl">Actividad Reciente</h3>
                        <ActivityIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    {recentActivity.length > 0 ? (
                        <div className="flow-root">
                            <ul className="-mb-4">
                                {recentActivity.map((item, itemIdx) => (
                                    <li key={`${item.id}-${itemIdx}`}>
                                        <div className="relative pb-4">
                                            {itemIdx !== recentActivity.length - 1 ? (
                                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                                            ) : null}
                                            <div className="relative flex space-x-3">
                                                <div>
                                                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-slate-100 dark:ring-slate-900 ${item.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}>
                                                        <IconDisplay icon={item.icon} iconColor="text-white" className="w-5 h-5" />
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                    <div>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                                                    </div>
                                                    <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                        <p className={`font-semibold ${item.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(item.amount)}</p>
                                                        <time dateTime={item.date.toISOString()}>{item.date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</time>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                            No hay actividad reciente.
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
};
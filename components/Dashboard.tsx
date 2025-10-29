import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { getNextPeriodToPay, generateSequentialId, generatePeriods, getStatusInfo, toDateKey } from './utils';
import { IconDisplay } from './IconDisplay';
import { useAuth } from '../contexts/AuthContext';
import { PlannedExpense, Payment, Concept, Priority } from '../types';
import { ArrowUpIcon, ArrowDownIcon, BriefcaseIcon, ClockIcon, CurrencyDollarIcon, WarningIcon, CloseIcon, ChevronDownIcon, CheckCircleIcon } from './Icons';
import { CalendarGrid } from './CalendarGrid';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

const months = [
    { value: 0, label: 'Enero' }, { value: 1, label: 'Febrero' }, { value: 2, label: 'Marzo' },
    { value: 3, label: 'Abril' }, { value: 4, label: 'Mayo' }, { value: 5, label: 'Junio' },
    { value: 6, label: 'Julio' }, { value: 7, label: 'Agosto' }, { value: 8, label: 'Septiembre' },
    { value: 9, label: 'Octubre' }, { value: 10, label: 'Noviembre' }, { value: 11, label: 'Diciembre' }
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

const priorityOrder: { [key in Priority]: number } = {
    [Priority.BAJA]: 1,
    [Priority.MEDIA]: 2,
    [Priority.ALTA]: 3,
};

// Reusable GlassCard component
const GlassCard: React.FC<{ children: React.ReactNode; className?: string, style?: React.CSSProperties }> = ({ children, className = '', style }) => (
    <div style={style} className={`bg-white dark:bg-black/20 dark:backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/20 shadow-lg text-gray-900 dark:text-white ${className}`}>
        {children}
    </div>
);

const SummaryCard: React.FC<{ title: string; amount: number; icon: React.ReactNode; }> = ({ title, amount, icon }) => (
    <GlassCard className="p-4 animate-fadeInUp">
        <div className="flex items-center space-x-3">
            <div className="bg-gray-100 dark:bg-black/20 rounded-lg p-2">
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-300">{title}</p>
                <p className="text-lg font-bold">{formatCurrency(amount)}</p>
            </div>
        </div>
    </GlassCard>
);

const SavingsGoalChart: React.FC<{ goal: any }> = ({ goal }) => {
    const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    const data = [
        { name: 'Progress', value: progress },
        { name: 'Remaining', value: Math.max(0, 100 - progress) },
    ];
    const colors = ['#a78bfa', '#4ade80', '#1e1b4b']; // Adjusted colors to match image

    return (
        <div className="relative w-40 h-40 mx-auto">
            <ResponsiveContainer>
                <PieChart>
                    <defs>
                        <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4ade80" />
                        <stop offset="100%" stopColor="#a78bfa" />
                        </linearGradient>
                    </defs>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius="70%"
                        outerRadius="100%"
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={20}
                    >
                        <Cell fill="url(#progressGradient)" />
                        <Cell fill="rgba(255, 255, 255, 0.1)" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold">{Math.round(progress)}%</span>
            </div>
        </div>
    );
};

const CategoryDonutChart: React.FC<{ data: { name: string, value: number, percent: number }[] }> = ({ data }) => {
    const COLORS = ['#3b82f6', '#f59e0b', '#ec4899', '#10b981', '#8b5cf6', '#ef4444'];
    
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="p-2 bg-white/80 dark:bg-black/50 backdrop-blur-sm border border-gray-200 dark:border-white/20 rounded-md shadow-lg text-gray-900 dark:text-white">
                    <p className="label">{`${payload[0].name} : ${formatCurrency(payload[0].value)} (${(payload[0].payload.percent * 100).toFixed(0)}%)`}</p>
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
                        <span>{entry.value} ({(entry.payload.percent * 100).toFixed(0)}%)</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <ResponsiveContainer width="100%" height={250}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
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

export const Dashboard: React.FC = () => {
    const { appData: data, setData } = useAuth();
    const navigate = useNavigate();
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const [selectedDate, setSelectedDate] = useState<Date>(today);
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [expandedDueId, setExpandedDueId] = useState<string | null>(null);
    const [paymentForm, setPaymentForm] = useState<{ amount: number | string, date: string }>({ amount: '', date: toDateKey(today) });
    
    const currentDateLabel = new Date(calendarDate.getFullYear(), calendarDate.getMonth()).toLocaleDateString('es-MX', { month: 'long', year: 'numeric'});

    if (!data) {
        return <div className="text-white text-center">Cargando...</div>;
    }

    const handleAddPayment = (expenseId: string, period: string) => {
        if (!expenseId || !data) return;
        const amount = Number(paymentForm.amount);
        if (amount <= 0 || !paymentForm.date) return;

        const allPayments = data.plannedExpenses.flatMap(pe => pe.payments || []);
        const newPayment: Payment = {
            id: generateSequentialId('PA', allPayments),
            amount: amount,
            date: new Date(`${paymentForm.date}T00:00:00`).toISOString(),
            period: period,
        };

        const updatedExpenses = data.plannedExpenses.map(pe => 
            pe.id === expenseId ? { ...pe, payments: [...(pe.payments || []), newPayment] } : pe
        );
        setData({ ...data, plannedExpenses: updatedExpenses });
        setExpandedDueId(null);
    };

    const { summary, periodDues, categorySpendingData, firstSavingsGoal, transactionDates } = useMemo(() => {
        const startOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
        const endOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0, 23, 59, 59);

        const periodIncome = data.incomes
            .filter(i => { const d = new Date(i.date); return d >= startOfMonth && d <= endOfMonth; })
            .reduce((sum, i) => sum + i.amount, 0);

        const periodDailyExpenses = data.dailyExpenses
            .filter(e => { const d = new Date(e.date); return d >= startOfMonth && d <= endOfMonth; })
            .reduce((sum, e) => sum + e.amount, 0);

        const periodPaidPlannedExpenses = data.plannedExpenses.reduce((sum, expense) => sum + (expense.payments || [])
                .filter(p => { const d = new Date(p.date); return d >= startOfMonth && d <= endOfMonth; })
                .reduce((pSum, p) => pSum + p.amount, 0), 0);

        const periodExpenses = periodDailyExpenses + periodPaidPlannedExpenses;
        const periodBalance = periodIncome - periodExpenses;

        const periodStr = `${calendarDate.getFullYear()}-${(calendarDate.getMonth() + 1).toString().padStart(2, '0')}`;
        const totalPlannedForMonth = data.plannedExpenses.reduce((sum, pe) => {
            return sum + (generatePeriods(pe).includes(periodStr) ? (pe.periodOverrides?.[periodStr] ?? pe.amountPerPeriod) : 0);
        }, 0);

        const paidOnPlannedForMonth = data.plannedExpenses.reduce((sum, pe) => {
            return sum + (pe.payments || [])
                .filter(p => p.period === periodStr)
                .reduce((pSum, p) => pSum + p.amount, 0);
        }, 0);
        
        const pendingInPeriod = totalPlannedForMonth - paidOnPlannedForMonth;

        const summary = { periodIncome, periodExpenses, periodBalance, pendingInPeriod };

        const dues: DueExpense[] = [];
        data.plannedExpenses.forEach(expense => {
            if (generatePeriods(expense).includes(periodStr)) {
                const paymentsByPeriod = new Map<string, number>();
                (expense.payments || []).forEach(p => {
                    paymentsByPeriod.set(p.period, (paymentsByPeriod.get(p.period) || 0) + p.amount);
                });
                
                const paidInPeriod = paymentsByPeriod.get(periodStr) || 0;
                const amountForPeriod = expense.periodOverrides?.[periodStr] ?? expense.amountPerPeriod;
                const concept = data.concepts.find(c => c.id === expense.conceptId);
                const status = getStatusInfo(expense, getNextPeriodToPay(expense));
                const dueDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), expense.dueDay);
                dues.push({ ...expense, concept, amountForPeriod, paidInPeriod, status, dueDate, duePeriod: periodStr });
            }
        });

        // Category Spending
        let totalSpendingThisMonth = 0;
        const categoryMap = new Map<string, number>();
        [...data.dailyExpenses, ...data.plannedExpenses.flatMap(pe => pe.payments || [])].forEach(transaction => {
            const tDate = new Date(transaction.date);
            if (tDate >= startOfMonth && tDate <= endOfMonth) {
                totalSpendingThisMonth += transaction.amount;
                const conceptId = 'conceptId' in transaction ? transaction.conceptId : data.plannedExpenses.find(pe => (pe.payments || []).some(p => p.id === transaction.id))?.conceptId;
                if(conceptId) {
                    const concept = data.concepts.find(c => c.id === conceptId);
                    if (concept?.categoryId) {
                        const categoryName = data.categories.find(cat => cat.id === concept.categoryId)?.name || 'Sin Categoría';
                        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + transaction.amount);
                    }
                }
            }
        });
        const spendingData = Array.from(categoryMap.entries())
            .map(([name, value]) => ({ name, value, percent: totalSpendingThisMonth > 0 ? value / totalSpendingThisMonth : 0 }))
            .sort((a, b) => b.value - a.value);
            
        // For calendar
        const dates = new Map<string, { income: boolean, expense: boolean, due: boolean, duePriority: Priority }>();
        const processDate = (dateStr: string, type: 'income' | 'expense') => {
            const dateKey = toDateKey(new Date(dateStr));
            const existing = dates.get(dateKey) || { income: false, expense: false, due: false, duePriority: Priority.BAJA };
            existing[type] = true;
            dates.set(dateKey, existing);
        };
        data.incomes.forEach(i => processDate(i.date, 'income'));
        data.dailyExpenses.forEach(e => processDate(e.date, 'expense'));
        data.plannedExpenses.forEach(pe => {
            (pe.payments || []).forEach(p => processDate(p.date, 'expense'));

            const allPeriods = generatePeriods(pe);
            
            allPeriods.forEach((period, index) => {
                const paidInPeriod = (pe.payments || []).filter(p => p.period === period).reduce((sum, p) => sum + p.amount, 0);
                const amountForPeriod = pe.periodOverrides?.[period] ?? pe.amountPerPeriod;

                if (paidInPeriod < amountForPeriod) {
                    const [pYear, pMonth] = period.split('-').map(Number);
                    const dueDate = new Date(pYear, pMonth - 1, pe.dueDay);
                    const dateKey = toDateKey(dueDate);
                    const status = getStatusInfo(pe, { period, index });
    
                    const existing = dates.get(dateKey) || { income: false, expense: false, due: false, duePriority: Priority.BAJA };
                    existing.due = true;
                    if (priorityOrder[status.priority] > priorityOrder[existing.duePriority]) {
                        existing.duePriority = status.priority;
                    }
                    dates.set(dateKey, existing);
                }
            });
        });

        return {
            summary,
            periodDues: dues.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()),
            categorySpendingData: spendingData,
            firstSavingsGoal: data.savingsGoals.length > 0 ? data.savingsGoals[0] : null,
            transactionDates: dates,
        };
    }, [data, calendarDate]);
    
    const renderDayCell = useCallback((date: Date) => {
        const today = new Date();
        today.setHours(0,0,0,0);
        date.setHours(0,0,0,0);

        const dateKey = toDateKey(date);
        const dayData = transactionDates.get(dateKey);
        
        const isSelected = selectedDate ? date.getTime() === selectedDate.getTime() : false;
        const isToday = date.getTime() === today.getTime();

        let cellClass = `relative flex flex-col items-center justify-center h-16 w-full rounded-lg cursor-pointer transition-colors hover:bg-gray-200 dark:hover:bg-white/10 ${date.getMonth() !== calendarDate.getMonth() ? 'text-gray-400 dark:text-gray-500' : ''}`;
        if (isSelected) cellClass += " bg-primary-600/80 dark:bg-primary-700/80 text-white";
        else if (isToday) cellClass += " ring-2 ring-primary-500";
        
        let dotColorClass = '';
        if(dayData?.due){
            if(dayData.duePriority === Priority.ALTA) dotColorClass = 'bg-red-500';
            else if (dayData.duePriority === Priority.MEDIA) dotColorClass = 'bg-yellow-500';
            else dotColorClass = 'bg-blue-500';
        }

        return (
            <div className={cellClass}>
                <span>{date.getDate()}</span>
                <div className="absolute bottom-1.5 flex gap-1">
                    {dayData?.income && <div className="w-1.5 h-1.5 rounded-full bg-green-500" title="Ingreso"></div>}
                    {dayData?.expense && <div className="w-1.5 h-1.5 rounded-full bg-red-500" title="Gasto"></div>}
                    {dayData?.due && <div className={`w-1.5 h-1.5 rounded-full ${dotColorClass}`} title="Vencimiento"></div>}
                </div>
            </div>
        );
    }, [selectedDate, transactionDates, calendarDate]);
    
    return (
        <div className="space-y-6">
            <GlassCard className="p-6 animate-fadeInUp">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold">Dashboard</h1>
                         <p className="text-gray-500 dark:text-gray-300 dark:opacity-80">{new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-300 dark:opacity-80">Balance del Mes</p>
                        <p className="text-4xl font-bold">{formatCurrency(summary.periodBalance)}</p>
                    </div>
                </div>
            </GlassCard>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard title="Ingresos del Mes" amount={summary.periodIncome} icon={<ArrowUpIcon className="w-6 h-6 text-green-400" />} />
                <SummaryCard title="Gastos del Mes" amount={summary.periodExpenses} icon={<ArrowDownIcon className="w-6 h-6 text-red-400" />} />
                <SummaryCard title="Balance del Mes" amount={summary.periodBalance} icon={<BriefcaseIcon className="w-6 h-6 text-blue-400" />} />
                <SummaryCard title="Pendiente en el Mes" amount={summary.pendingInPeriod} icon={<ClockIcon className="w-6 h-6 text-yellow-400" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <GlassCard className="p-4 animate-fadeInUp" style={{animationDelay: '100ms'}}>
                        <CalendarGrid
                           currentDate={calendarDate}
                           onDateClick={(date) => setSelectedDate(date)}
                           renderDay={renderDayCell}
                           onPrevMonth={() => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                           onNextMonth={() => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                        />
                    </GlassCard>
                     <GlassCard className="p-6 animate-fadeInUp" style={{animationDelay: '200ms'}}>
                        <h3 className="font-bold text-xl mb-4">Gastos del Mes por Categoría</h3>
                        {categorySpendingData.length > 0 ? (
                            <CategoryDonutChart data={categorySpendingData} />
                        ) : (
                            <div className="text-center text-gray-500 dark:text-gray-400 my-auto flex-grow flex flex-col justify-center items-center h-48">No hay gastos este mes.</div>
                        )}
                    </GlassCard>
                </div>
                
                <div className="space-y-6">
                     <GlassCard className="p-6 flex flex-col animate-fadeInUp" style={{animationDelay: '300ms'}}>
                        <h3 className="font-bold text-xl mb-4">Vencimientos del Mes</h3>
                        <div className="space-y-2 overflow-y-auto max-h-80 pr-2">
                            {periodDues.length > 0 ? periodDues.map(due => {
                                const isExpanded = expandedDueId === due.id;
                                const remainingInPeriod = due.amountForPeriod - due.paidInPeriod;
                                const isPaid = remainingInPeriod <= 0;
                                return (
                                    <div key={due.id} className={`bg-gray-100 dark:bg-black/20 rounded-lg p-2 ${isPaid ? 'opacity-60' : ''}`}>
                                        <div className="flex justify-between items-center cursor-pointer" onClick={() => {
                                            if (isExpanded) {
                                                setExpandedDueId(null);
                                            } else {
                                                setExpandedDueId(due.id);
                                                const remaining = due.amountForPeriod - due.paidInPeriod;
                                                setPaymentForm({ amount: remaining > 0 ? remaining : '', date: toDateKey(new Date()) });
                                            }
                                        }}>
                                            <div className="flex items-center space-x-3">
                                                <IconDisplay icon={due.icon} iconColor={due.iconColor} className="w-5 h-5"/>
                                                <div>
                                                    <p className={`font-medium text-sm ${due.status.text === 'Vencido' ? 'text-red-500 dark:text-red-400' : ''}`}>{due.concept?.name || 'Gasto'}</p>
                                                    {!isPaid && <p className="text-xs text-gray-500 dark:text-gray-400">Vence: {due.dueDate.toLocaleDateString('es-MX', {day: '2-digit', month: 'short'})}</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isPaid ? <CheckCircleIcon className="w-5 h-5 text-green-500 dark:text-green-400" /> : <span className="text-sm font-semibold">{formatCurrency(remainingInPeriod)}</span> }
                                                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            </div>
                                        </div>
                                        {isExpanded && (
                                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-white/10 text-xs">
                                                {!isPaid && (
                                                <div className="mt-2">
                                                    <p className="font-semibold mb-1 text-sm">Registrar Abono</p>
                                                    <div className="flex flex-col sm:flex-row gap-2 items-center">
                                                        <input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm(s => ({...s, amount: e.target.value}))} className="w-full sm:w-1/2 px-2 py-1 rounded-md shadow-sm text-sm" placeholder="Monto" />
                                                        <input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm(s => ({...s, date: e.target.value}))} className="w-full sm:w-1/2 px-2 py-1 rounded-md shadow-sm text-sm" />
                                                    </div>
                                                    <button onClick={() => handleAddPayment(due.id, due.duePeriod)} className="w-full mt-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-1.5 px-3 rounded-lg text-sm">Registrar Pago</button>
                                                </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            }) : (
                                <div className="text-center text-gray-500 dark:text-gray-400 my-auto h-full flex flex-col justify-center items-center">No hay gastos planificados para este periodo.</div>
                            )}
                        </div>
                    </GlassCard>
                    <GlassCard className="p-6 flex flex-col animate-fadeInUp" style={{animationDelay: '400ms'}}>
                        <h3 className="font-bold text-xl mb-4">Metas de Ahorro</h3>
                        {firstSavingsGoal ? (
                            <div className="flex-grow flex flex-col items-center justify-center">
                                <SavingsGoalChart goal={firstSavingsGoal} />
                                <p className="mt-4 font-semibold">{firstSavingsGoal.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-300 dark:opacity-80">{formatCurrency(firstSavingsGoal.currentAmount)} / {formatCurrency(firstSavingsGoal.targetAmount)}</p>
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 my-auto flex-grow flex flex-col justify-center items-center">No hay metas de ahorro.</div>
                        )}
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};
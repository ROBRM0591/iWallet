import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { getNextPeriodToPay, generateSequentialId, generatePeriods, getStatusInfo } from './utils';
import { IconDisplay } from './IconDisplay';
import { useAuth } from '../contexts/AuthContext';
import { PlannedExpense, Payment, Concept } from '../types';
import { ArrowUpIcon, ArrowDownIcon, BriefcaseIcon, ClockIcon, CurrencyDollarIcon, WarningIcon, CloseIcon, ChevronDownIcon } from './Icons';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

const months = [
    { value: 0, label: 'Enero' }, { value: 1, label: 'Febrero' }, { value: 2, label: 'Marzo' },
    { value: 3, label: 'Abril' }, { value: 4, label: 'Mayo' }, { value: 5, label: 'Junio' },
    { value: 6, label: 'Julio' }, { value: 7, label: 'Agosto' }, { value: 8, label: 'Septiembre' },
    { value: 9, label: 'Octubre' }, { value: 10, label: 'Noviembre' }, { value: 11, label: 'Diciembre' }
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

// Reusable GlassCard component
const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg text-white ${className}`}>
        {children}
    </div>
);

const SummaryCard: React.FC<{ title: string; amount: number; icon: React.ReactNode; }> = ({ title, amount, icon }) => (
    <GlassCard className="p-4">
        <div className="flex items-center space-x-3">
            <div className="bg-black/20 rounded-lg p-2">
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-300">{title}</p>
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
                <div className="p-2 bg-black/50 backdrop-blur-sm border border-white/20 rounded-md shadow-lg text-white">
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
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [expandedDueId, setExpandedDueId] = useState<string | null>(null);
    
    const currentDateLabel = new Date(selectedYear, selectedMonth).toLocaleDateString('es-MX', { month: 'long', year: 'numeric'});

    if (!data) {
        return <div className="text-white text-center">Cargando...</div>;
    }

    const { summary, pendingDues, categorySpendingData, firstSavingsGoal } = useMemo(() => {
        const startOfMonth = new Date(selectedYear, selectedMonth, 1);
        const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

        const periodIncome = data.incomes
            .filter(i => { const d = new Date(i.date); return d >= startOfMonth && d <= endOfMonth; })
            .reduce((sum, i) => sum + i.amount, 0);

        const periodDailyExpenses = data.dailyExpenses
            .filter(e => { const d = new Date(e.date); return d >= startOfMonth && d <= endOfMonth; })
            .reduce((sum, e) => sum + e.amount, 0);

        const periodPaidPlannedExpenses = data.plannedExpenses.reduce((sum, expense) => sum + expense.payments
                .filter(p => { const d = new Date(p.date); return d >= startOfMonth && d <= endOfMonth; })
                .reduce((pSum, p) => pSum + p.amount, 0), 0);

        const periodExpenses = periodDailyExpenses + periodPaidPlannedExpenses;
        const periodBalance = periodIncome - periodExpenses;

        const periodStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}`;
        const totalPlannedForMonth = data.plannedExpenses.reduce((sum, pe) => {
            return sum + (generatePeriods(pe).includes(periodStr) ? (pe.periodOverrides?.[periodStr] ?? pe.amountPerPeriod) : 0);
        }, 0);

        const paidOnPlannedForMonth = data.plannedExpenses.reduce((sum, pe) => {
            return sum + pe.payments
                .filter(p => p.period === periodStr)
                .reduce((pSum, p) => pSum + p.amount, 0);
        }, 0);
        
        const pendingInPeriod = totalPlannedForMonth - paidOnPlannedForMonth;

        const summary = { periodIncome, periodExpenses, periodBalance, pendingInPeriod };

        const dues: DueExpense[] = [];
        data.plannedExpenses.forEach(expense => {
            const paymentsByPeriod = new Map<string, number>();
            expense.payments.forEach(p => {
                paymentsByPeriod.set(p.period, (paymentsByPeriod.get(p.period) || 0) + p.amount);
            });

            if (generatePeriods(expense).includes(periodStr)) {
                const paidInPeriod = paymentsByPeriod.get(periodStr) || 0;
                const amountForPeriod = expense.periodOverrides?.[periodStr] ?? expense.amountPerPeriod;
                
                if (paidInPeriod < amountForPeriod) {
                    const concept = data.concepts.find(c => c.id === expense.conceptId);
                    const status = getStatusInfo(expense, getNextPeriodToPay(expense));
                    const dueDate = new Date(selectedYear, selectedMonth, expense.dueDay);
                    dues.push({ ...expense, concept, amountForPeriod, paidInPeriod, status, dueDate, duePeriod: periodStr });
                }
            }
        });

        // Category Spending
        let totalSpendingThisMonth = 0;
        const categoryMap = new Map<string, number>();
        [...data.dailyExpenses, ...data.plannedExpenses.flatMap(pe => pe.payments)].forEach(transaction => {
            const tDate = new Date(transaction.date);
            if (tDate >= startOfMonth && tDate <= endOfMonth) {
                totalSpendingThisMonth += transaction.amount;
                const conceptId = 'conceptId' in transaction ? transaction.conceptId : data.plannedExpenses.find(pe => pe.payments.some(p => p.id === transaction.id))?.conceptId;
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

        return {
            summary,
            pendingDues: dues.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()),
            categorySpendingData: spendingData,
            firstSavingsGoal: data.savingsGoals.length > 0 ? data.savingsGoals[0] : null
        };
    }, [data, selectedMonth, selectedYear]);
    
    return (
        <div className="space-y-6">
            <GlassCard className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold">Dashboard</h1>
                        <p className="text-gray-300 opacity-80">{currentDateLabel.replace(currentDateLabel.split(' ')[0], currentDateLabel.split(' ')[0].charAt(0).toUpperCase() + currentDateLabel.split(' ')[0].slice(1))}</p>
                        <div className="flex items-center gap-2 mt-2">
                             <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-black/20 border border-white/20 rounded-md py-1 px-2 text-sm font-semibold">
                                {months.map((m, i) => <option key={i} value={i}>{m.label}</option>)}
                            </select>
                            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-black/20 border border-white/20 rounded-md py-1 px-2 text-sm font-semibold">
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-300 opacity-80">Balance del Periodo</p>
                        <p className="text-4xl font-bold">{formatCurrency(summary.periodBalance)}</p>
                    </div>
                </div>
            </GlassCard>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <SummaryCard title="Ingresos del Periodo" amount={summary.periodIncome} icon={<ArrowUpIcon className="w-6 h-6 text-green-400" />} />
                <SummaryCard title="Gastos del Periodo" amount={summary.periodExpenses} icon={<ArrowDownIcon className="w-6 h-6 text-red-400" />} />
                <SummaryCard title="Balance del Periodo" amount={summary.periodBalance} icon={<BriefcaseIcon className="w-6 h-6 text-blue-400" />} />
                <SummaryCard title="Pendiente en el Periodo" amount={summary.pendingInPeriod} icon={<ClockIcon className="w-6 h-6 text-yellow-400" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <GlassCard className="p-6 flex flex-col">
                    <h3 className="font-bold text-xl mb-4">Metas de Ahorro</h3>
                    {firstSavingsGoal ? (
                        <div className="flex-grow flex flex-col items-center justify-center">
                            <SavingsGoalChart goal={firstSavingsGoal} />
                            <p className="mt-4 font-semibold">{firstSavingsGoal.name}</p>
                            <p className="text-sm text-gray-300 opacity-80">{formatCurrency(firstSavingsGoal.currentAmount)} / {formatCurrency(firstSavingsGoal.targetAmount)}</p>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 my-auto flex-grow flex flex-col justify-center items-center">No hay metas de ahorro.</div>
                    )}
                </GlassCard>
                
                 <GlassCard className="p-6">
                    <h3 className="font-bold text-xl mb-4">Vencimientos Próximos</h3>
                    <div className="space-y-2">
                        {pendingDues.length > 0 ? pendingDues.map(due => {
                            const isExpanded = expandedDueId === due.id;
                            return (
                                <div key={due.id} className="bg-black/20 rounded-lg p-2">
                                    <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedDueId(isExpanded ? null : due.id)}>
                                        <div className="flex items-center space-x-3">
                                            <IconDisplay icon={due.icon} iconColor={due.iconColor} className="w-5 h-5"/>
                                            <div>
                                                <p className={`font-medium text-sm ${due.status.text === 'Vencido' ? 'text-red-400' : ''}`}>{due.concept?.name || 'Gasto'}</p>
                                                <p className="text-xs text-gray-400">Vence: {due.dueDate.toLocaleDateString('es-MX', {day: '2-digit', month: 'short'})}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold">{formatCurrency(due.amountForPeriod - due.paidInPeriod)}</span>
                                            <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="mt-2 pt-2 border-t border-white/10 text-xs">
                                            <p className="font-semibold mb-1">Pagos realizados ({due.payments.length})</p>
                                            {due.payments.length > 0 ? (
                                                <ul className="space-y-1 max-h-24 overflow-y-auto pr-2">
                                                   {due.payments.map(p => (
                                                        <li key={p.id} className="flex justify-between items-center text-gray-300">
                                                           <span>{p.period}: {new Date(p.date).toLocaleDateString()}</span>
                                                           <span className="font-semibold">{formatCurrency(p.amount)}</span>
                                                        </li>
                                                   ))}
                                                </ul>
                                            ) : <p className="text-gray-400 italic">No hay pagos registrados.</p>}
                                        </div>
                                    )}
                                </div>
                            );
                        }) : (
                            <div className="text-center text-gray-400 my-auto h-full flex flex-col justify-center items-center">¡Todo al día en este periodo!</div>
                        )}
                    </div>
                </GlassCard>

                <GlassCard className="p-6">
                    <h3 className="font-bold text-xl mb-4">Categorías</h3>
                    {categorySpendingData.length > 0 ? (
                        <CategoryDonutChart data={categorySpendingData} />
                    ) : (
                        <div className="text-center text-gray-400 my-auto flex-grow flex flex-col justify-center items-center">No hay gastos este mes.</div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
};
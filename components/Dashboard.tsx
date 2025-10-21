import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getNextPeriodToPay, generateSequentialId } from './utils';
import { IconDisplay } from './IconDisplay';
import { useAuth } from '../contexts/AuthContext';
import { PlannedExpense, Payment } from '../types';
import { CloseIcon, WarningIcon, CurrencyDollarIcon } from './Icons';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
const months = [
    { value: '01', label: 'Enero' }, { value: '02', label: 'Febrero' }, { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' }, { value: '05', label: 'Mayo' }, { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' }, { value: '08', label: 'Agosto' }, { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' }, { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' }
];

// Main Modal Component
const Modal: React.FC<{ isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode, size?: 'lg' | '2xl' }> = ({ isOpen, onClose, title, children, size = '2xl' }) => {
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
            <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-${size} transform transition-all`}>
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

// Payment Modal
const PaymentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (amount: number, date: string) => void;
    periodLabel: string;
    remainingAmount: number;
}> = ({ isOpen, onClose, onSave, periodLabel, remainingAmount }) => {
    const todayISO = new Date().toISOString().split('T')[0];
    const [amount, setAmount] = useState(remainingAmount > 0 ? remainingAmount : 0);
    const [date, setDate] = useState(todayISO);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setAmount(remainingAmount > 0 ? remainingAmount : 0);
            setDate(todayISO);
            setError('');
        }
    }, [isOpen, remainingAmount, todayISO]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (amount <= 0) {
            setError('El monto debe ser mayor a 0.');
            return;
        }
        if (amount > remainingAmount) {
             setError(`El monto no puede ser mayor al restante (${formatCurrency(remainingAmount)}).`);
            return;
        }
        onSave(amount, new Date(date).toISOString());
    };

    return (
         <Modal isOpen={isOpen} onClose={onClose} title={`Registrar Abono para ${periodLabel}`} size="lg">
             <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium">Monto a Pagar</label>
                    <input 
                        type="number"
                        value={amount}
                        onChange={e => setAmount(Number(e.target.value))}
                        max={remainingAmount}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm"
                        required 
                    />
                    <p className="text-xs text-gray-500 mt-1">Restante para este periodo: {formatCurrency(remainingAmount)}</p>
                    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                 </div>
                 <div>
                    <label className="block text-sm font-medium">Fecha del Pago</label>
                    <input 
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm"
                        required
                    />
                 </div>
                 <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Guardar Abono</button>
                </div>
             </form>
         </Modal>
    )
};


interface DashboardProps {
}

const SummaryCard: React.FC<{ title: string; amount: number; color: string; onClick?: () => void; }> = ({ title, amount, color, onClick }) => (
    <div 
        className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-l-4 ${color} ${onClick ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''}`}
        onClick={onClick}
        onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
        role={onClick ? 'button' : 'figure'}
        tabIndex={onClick ? 0 : -1}
    >
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{formatCurrency(amount)}</p>
    </div>
);

export const Dashboard: React.FC<DashboardProps> = () => {
    const { appData: data, setData } = useAuth();
    const navigate = useNavigate();
    const [paymentModalInfo, setPaymentModalInfo] = useState<{ isOpen: boolean; expense: PlannedExpense | null; period: string; periodLabel: string; remaining: number; }>({ isOpen: false, expense: null, period: '', periodLabel: '', remaining: 0 });

    if (!data) {
        return <div>Cargando...</div>;
    }

    const summary = useMemo(() => {
        const totalIncome = data.incomes.reduce((sum, income) => sum + income.amount, 0);
        
        const totalDailyExpenses = data.dailyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        const totalPaidPlannedExpenses = data.plannedExpenses.reduce((sum, expense) => {
            return sum + expense.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0);
        }, 0);
        
        const totalExpenses = totalDailyExpenses + totalPaidPlannedExpenses;
        
        const availableBalance = totalIncome - totalExpenses;
        
        const pendingToPay = data.plannedExpenses.reduce((sum, expense) => {
             const paidAmount = expense.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0);
             const totalDebt = expense.amountPerPeriod * expense.periods;
             const remaining = totalDebt - paidAmount;
             return sum + (remaining > 0 ? remaining : 0);
        }, 0);

        return { totalIncome, totalExpenses, availableBalance, pendingToPay };
    }, [data]);
    
    const pendingDues = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return data.plannedExpenses
            .map(expense => {
                const nextPeriodToPay = getNextPeriodToPay(expense);
                if (!nextPeriodToPay) return null;

                const [year, month] = nextPeriodToPay.period.split('-').map(Number);
                
                let dueMonth = month - 1;
                let dueYear = year;
                if (expense.cutOffDay > expense.dueDay) {
                    dueMonth += 1;
                    if (dueMonth > 11) {
                        dueMonth = 0;
                        dueYear += 1;
                    }
                }
                const dueDate = new Date(dueYear, dueMonth, expense.dueDay);
                dueDate.setHours(0, 0, 0, 0);
                
                const isOverdue = dueDate < today;

                return { ...expense, nextPeriodToPay, dueDate, isOverdue };
            })
            .filter((expense): expense is NonNullable<typeof expense> => expense !== null)
            .sort((a, b) => {
                 if (a.isOverdue && !b.isOverdue) return -1;
                 if (!a.isOverdue && b.isOverdue) return 1;
                 return a.dueDate.getTime() - b.dueDate.getTime();
            })
            .slice(0, 5);
    }, [data.plannedExpenses]);

    const categorySpendingData = useMemo(() => {
        const categoryMap = new Map<string, number>();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        data.dailyExpenses.forEach(expense => {
            const expenseDate = new Date(expense.date);
            if (expenseDate >= startOfMonth && expenseDate <= endOfMonth) {
                const concept = data.concepts.find(c => c.id === expense.conceptId);
                if (concept && concept.categoryId) {
                    const categoryName = data.categories.find(cat => cat.id === concept.categoryId)?.name || 'Sin Categoría';
                    categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + expense.amount);
                }
            }
        });

        data.plannedExpenses.forEach(expense => {
            expense.payments.forEach(payment => {
                const paymentDate = new Date(payment.date);
                if (paymentDate >= startOfMonth && paymentDate <= endOfMonth) {
                    const concept = data.concepts.find(c => c.id === expense.conceptId);
                    if (concept && concept.categoryId) {
                         const categoryName = data.categories.find(cat => cat.id === concept.categoryId)?.name || 'Sin Categoría';
                         categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + payment.amount);
                    }
                }
            });
        });
        
        if (categoryMap.size === 0) {
            return [];
        }

        return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
    }, [data.categories, data.concepts, data.dailyExpenses, data.plannedExpenses]);
    
    const handleOpenPaymentModal = (expense: PlannedExpense) => {
        const nextPeriod = getNextPeriodToPay(expense);
        if (!nextPeriod) return;

        const paidInPeriod = expense.payments
            .filter(p => p.period === nextPeriod.period)
            .reduce((sum, p) => sum + p.amount, 0);
        
        const remaining = expense.amountPerPeriod - paidInPeriod;
        const [year, monthVal] = nextPeriod.period.split('-').map(Number);
        const periodLabel = `${months[monthVal - 1].label} ${year}`;

        setPaymentModalInfo({
            isOpen: true,
            expense,
            period: nextPeriod.period,
            periodLabel,
            remaining,
        });
    };
    
    const handleAddPayment = (amount: number, date: string) => {
        const { expense, period } = paymentModalInfo;
        if (!expense || !period) return;

        const allPayments = data.plannedExpenses.flatMap(pe => pe.payments);

        const newPayment: Payment = {
            id: generateSequentialId('PA', allPayments),
            amount,
            date,
            period,
        };

        const updatedPlannedExpenses = data.plannedExpenses.map(pe =>
            pe.id === expense.id
                ? { ...pe, payments: [...pe.payments, newPayment] }
                : pe
        );

        setData({ ...data, plannedExpenses: updatedPlannedExpenses });

        setPaymentModalInfo({ isOpen: false, expense: null, period: '', periodLabel: '', remaining: 0 });
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
            <div className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-lg">
                <p className="label">{`${payload[0].name} : ${formatCurrency(payload[0].value)}`}</p>
            </div>
            );
        }
        return null;
    };


    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard title="Ingresos Totales" amount={summary.totalIncome} color="border-green-500" onClick={() => navigate('/reports', { state: { filter: 'incomes' } })} />
                <SummaryCard title="Gastos Totales" amount={summary.totalExpenses} color="border-red-500" onClick={() => navigate('/reports', { state: { filter: 'expenses' } })} />
                <SummaryCard title="Saldo Disponible" amount={summary.availableBalance} color="border-primary-500" />
                <SummaryCard title="Saldo Pendiente" amount={summary.pendingToPay} color="border-yellow-500" onClick={() => navigate('/planned-expenses')} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="font-bold text-xl mb-4 text-gray-800 dark:text-white">Progreso de Metas de Ahorro</h3>
                    <div className="space-y-2">
                        {data.savingsGoals.length > 0 ? data.savingsGoals.map(goal => {
                            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                            const action = () => navigate('/savings-goals', { state: { openGoalId: goal.id } });
                            return (
                                <div 
                                    key={goal.id} 
                                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 -m-2 rounded-lg transition-colors"
                                    onClick={action}
                                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && action()}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            <IconDisplay icon={goal.icon} iconColor={goal.iconColor} className="w-5 h-5"/>
                                            <p className="font-medium text-sm text-gray-800 dark:text-white">{goal.name}</p>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">{Math.round(progress)}%</p>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                        <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                                    </div>
                                     <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        <span>{formatCurrency(goal.currentAmount)}</span>
                                        <span>{formatCurrency(goal.targetAmount)}</span>
                                    </div>
                                </div>
                            )
                        }) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">Aún no tienes metas de ahorro.</p>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="font-bold text-xl mb-4 text-gray-800 dark:text-white">Vencimientos Próximos y Vencidos</h3>
                    <div className="space-y-1">
                        {pendingDues.length > 0 ? (
                            pendingDues.map(due => {
                                const concept = data.concepts.find(c => c.id === due.conceptId);
                                const action = () => navigate('/planned-expenses', { state: { openExpenseId: due.id } });
                                return (
                                    <div 
                                        key={due.id} 
                                        className="flex justify-between items-center p-2 -m-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                                        onClick={action}
                                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && action()}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`Ver detalles de ${concept?.name}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <IconDisplay icon={due.icon} iconColor={due.iconColor} className="w-8 h-8 flex-shrink-0" />
                                            <div>
                                                <p className="font-medium text-gray-800 dark:text-white">{concept?.name || 'Gasto'}</p>
                                                <p className={`text-sm ${due.isOverdue ? 'text-red-500 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {due.isOverdue ? 'Venció' : 'Vence'}: {due.dueDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(due.amountPerPeriod)}</p>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenPaymentModal(due);
                                                }}
                                                className="p-1.5 rounded-md bg-green-100 hover:bg-green-200 dark:bg-green-900/50 dark:hover:bg-green-900 text-green-700 dark:text-green-200 transition"
                                                title={`Abonar a ${concept?.name}`}
                                                aria-label={`Abonar a ${concept?.name}`}
                                            >
                                                <CurrencyDollarIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">¡Todo al día! No hay vencimientos pendientes.</p>
                        )}
                    </div>
                </div>
                
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="font-bold text-xl mb-4 text-gray-800 dark:text-white">Gastos del Mes por Categoría</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        {categorySpendingData.length > 0 ? (
                            <ResponsiveContainer>
                                <BarChart data={categorySpendingData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(value) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', notation: 'compact' }).format(value as number)} />
                                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" name="Gastos" fill="var(--color-primary-500)" barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                No hay datos de gastos para el mes actual.
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <PaymentModal
                isOpen={paymentModalInfo.isOpen}
                onClose={() => setPaymentModalInfo({ isOpen: false, expense: null, period: '', periodLabel: '', remaining: 0 })}
                onSave={handleAddPayment}
                periodLabel={paymentModalInfo.periodLabel}
                remainingAmount={paymentModalInfo.remaining}
            />
        </div>
    );
};
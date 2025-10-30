import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MonthlyBudget, MovementTypeName } from '../types';
import { DeleteIcon, CheckCircleIcon, EditIcon, PlusIcon, CloseIcon } from '../components/Icons';
import { useAuth } from '../contexts/AuthContext';
import { CsvTools, CsvHeader } from '../components/CsvTools';
import { generateSequentialId } from '../components/utils';
import { IconDisplay } from './IconDisplay';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

const months = [
    { value: 0, label: 'Enero' }, { value: 1, label: 'Febrero' }, { value: 2, label: 'Marzo' },
    { value: 3, label: 'Abril' }, { value: 4, label: 'Mayo' }, { value: 5, label: 'Junio' },
    { value: 6, label: 'Julio' }, { value: 7, label: 'Agosto' }, { value: 8, label: 'Septiembre' },
    { value: 9, label: 'Octubre' }, { value: 10, label: 'Noviembre' }, { value: 11, label: 'Diciembre' }
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-black/20 dark:backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/20 shadow-lg text-gray-900 dark:text-white ${className}`}>
        {children}
    </div>
);
const SuccessToast: React.FC<{isOpen: boolean; onClose: () => void; title: string; message: string;}> = ({ isOpen, onClose, title, message }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(onClose, 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);
    if (!isOpen) return null;
    return (
        <div className={`fixed bottom-4 left-4 z-50 w-full max-w-sm transition-all duration-300 ${isOpen ? 'transform translate-y-0 opacity-100' : 'transform translate-y-4 opacity-0'}`}>
            {isOpen && (
                 <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-xl shadow-2xl p-4 flex items-start gap-4 text-gray-900 dark:text-white">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center"><CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-300" /></div>
                    <div><p className="font-bold">{title}</p><p className="text-sm text-gray-600 dark:text-gray-300">{message}</p></div>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400">&times;</button>
                </div>
            )}
        </div>
    );
};
const SummaryCard: React.FC<{ title: string; amount: number; color: string; }> = ({ title, amount, color }) => (
    <GlassCard className={`p-6 border-l-4 ${color}`}>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{formatCurrency(amount)}</p>
    </GlassCard>
);

const BudgetCategoryItem: React.FC<{
    category: { id: string, name: string, icon?: string, iconColor?: string };
    spent: number;
    budgeted: number;
    onBudgetChange: (newAmount: number) => void;
    onDelete: () => void;
    onClick: () => void;
}> = ({ category, spent, budgeted, onBudgetChange, onDelete, onClick }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newAmount, setNewAmount] = useState(budgeted);

    const progress = budgeted > 0 ? (spent / budgeted) * 100 : 0;
    const progressBarColor = progress > 100 ? 'bg-red-500' : progress > 80 ? 'bg-yellow-500' : 'bg-primary-500';

    const handleSave = () => {
        onBudgetChange(newAmount);
        setIsEditing(false);
    };

    return (
        <div className="bg-gray-100/50 dark:bg-black/20 p-4 rounded-xl">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <IconDisplay icon={category.icon} iconColor={category.iconColor} className="w-6 h-6"/>
                    <button onClick={onClick} className="font-bold text-lg hover:underline">{category.name}</button>
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                           <input
                                type="number"
                                value={newAmount || ''}
                                onChange={(e) => setNewAmount(Number(e.target.value))}
                                className="w-24 text-right rounded-md py-1"
                                autoFocus
                            />
                            <button onClick={handleSave} className="text-green-500"><CheckCircleIcon className="w-6 h-6"/></button>
                            <button onClick={() => setIsEditing(false)} className="text-gray-500"><CloseIcon className="w-6 h-6"/></button>
                        </>
                    ) : (
                        <>
                            <div className="text-right">
                                <span className="font-semibold">{formatCurrency(spent)}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400"> / {formatCurrency(budgeted)}</span>
                            </div>
                            <button onClick={() => { setIsEditing(true); setNewAmount(budgeted); }} className="text-primary-500"><EditIcon className="w-5 h-5"/></button>
                            <button onClick={onDelete} className="text-red-500"><DeleteIcon className="w-5 h-5"/></button>
                        </>
                    )}
                </div>
            </div>
            <div className="mt-2 h-4 w-full bg-gray-200 dark:bg-black/30 rounded-full">
                <div className={`${progressBarColor} h-4 rounded-full transition-all duration-500`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
            </div>
        </div>
    );
};

export const Budget: React.FC = () => {
    const { appData: data, setData } = useAuth();
    const navigate = useNavigate();
    const [successInfo, setSuccessInfo] = useState<{ title: string; message: string } | null>(null);
    const [addingBudgetId, setAddingBudgetId] = useState<string | null>(null);
    const [newBudgetAmount, setNewBudgetAmount] = useState<number>(0);
    const [selectedDate, setSelectedDate] = useState({
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
    });

    if (!data) {
        return <div>Cargando...</div>;
    }

    const { expenseCategories, periodSpending, budgetsForPeriod } = useMemo(() => {
        const movGasto = data.movementTypes.find(m => m.name === MovementTypeName.GASTO);
        if (!movGasto) return { expenseCategories: [], periodSpending: new Map<string, number>(), budgetsForPeriod: [] };

        const expenseCategories = data.categories.filter(c => c.movementTypeId === movGasto.id);

        const startOfMonth = new Date(selectedDate.year, selectedDate.month, 1);
        const endOfMonth = new Date(selectedDate.year, selectedDate.month + 1, 0, 23, 59, 59);

        const periodSpending = new Map<string, number>();
        const addExpense = (categoryId: string | undefined, amount: number) => {
             if (categoryId) {
                periodSpending.set(categoryId, (periodSpending.get(categoryId) || 0) + Number(amount));
            }
        };

        data.dailyExpenses.forEach(expense => {
            const expenseDate = new Date(expense.date);
            if (expenseDate >= startOfMonth && expenseDate <= endOfMonth) {
                const concept = data.concepts.find(c => c.id === expense.conceptId);
                addExpense(concept?.categoryId, expense.amount);
            }
        });

        data.plannedExpenses.forEach(expense => {
            (expense.payments || []).forEach(payment => {
                const paymentDate = new Date(payment.date);
                 if (paymentDate >= startOfMonth && paymentDate <= endOfMonth) {
                    const concept = data.concepts.find(c => c.id === expense.conceptId);
                    addExpense(concept?.categoryId, payment.amount);
                }
            });
        });
        
        const budgetsForPeriod = data.monthlyBudgets.filter(b => b.month === selectedDate.month && b.year === selectedDate.year);

        return { expenseCategories, periodSpending, budgetsForPeriod };
    }, [data, selectedDate]);
    
    const summary = useMemo(() => {
        // FIX: Operator '+' cannot be applied to types 'unknown' and 'number'. Removed redundant Number cast.
        const totalBudgeted = budgetsForPeriod.reduce((sum: number, b: MonthlyBudget) => sum + b.amount, 0);
        // FIX: The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type. Removed redundant Number cast and added explicit types.
        const totalSpent = Array.from(periodSpending.values()).reduce((sum: number, amount: number) => sum + amount, 0);
        const totalRemaining = totalBudgeted - totalSpent;
        return { totalBudgeted, totalSpent, totalRemaining };
    }, [budgetsForPeriod, periodSpending]);

    const handleBudgetChange = (categoryId: string, amount: number) => {
        const existingBudgetIndex = data.monthlyBudgets.findIndex(b => 
            b.categoryId === categoryId && b.month === selectedDate.month && b.year === selectedDate.year
        );
        
        let newBudgets;
        if (existingBudgetIndex > -1) {
            newBudgets = data.monthlyBudgets.map((b, index) => 
                index === existingBudgetIndex ? { ...b, amount } : b
            );
        } else {
            const newId = generateSequentialId('PM', data.monthlyBudgets);
            newBudgets = [...data.monthlyBudgets, { 
                id: newId, 
                categoryId, 
                amount, 
                month: selectedDate.month, 
                year: selectedDate.year 
            }];
        }
        setData({ ...data, monthlyBudgets: newBudgets });
    };
    
    const handleDeleteBudget = (categoryId: string) => {
        setData({
            ...data,
            monthlyBudgets: data.monthlyBudgets.filter(b => 
                !(b.categoryId === categoryId && b.month === selectedDate.month && b.year === selectedDate.year)
            )
        });
    };

    const handleCategoryClick = (categoryId: string) => {
        const categoryName = data.categories.find(c => c.id === categoryId)?.name;
        if(categoryName) {
            navigate('/reports', { 
                state: { 
                    filter: 'expenses', 
                    categoryFilter: categoryName,
                    month: selectedDate.month,
                    year: selectedDate.year
                } 
            });
        }
    };
    
    const handleAddBudgetClick = (categoryId: string) => {
        setAddingBudgetId(categoryId);
        setNewBudgetAmount(0);
    };

    const handleSaveNewBudget = (categoryId: string) => {
        if (newBudgetAmount > 0) {
            handleBudgetChange(categoryId, newBudgetAmount);
        }
        setAddingBudgetId(null);
    };

    const handleCancelAddBudget = () => {
        setAddingBudgetId(null);
    };
    
    const handleImport = (importedData: any[]) => {
        if (Array.isArray(importedData) && importedData.every(item => 'categoryId' in item && 'amount' in item && 'month' in item && 'year' in item)) {
            const typedData = importedData.map(d => ({...d, amount: Number(d.amount), month: Number(d.month), year: Number(d.year) })) as MonthlyBudget[];
            
            const otherMonthsBudgets = data.monthlyBudgets.filter(existing => 
                !typedData.some(imported => imported.month === existing.month && imported.year === existing.year)
            );
            
            const mergedBudgets = [...otherMonthsBudgets, ...typedData];
            setData({ ...data, monthlyBudgets: mergedBudgets });

            setSuccessInfo({ title: 'Importación Exitosa', message: `${typedData.length} presupuestos importados.` });
        } else {
             alert('Error: El archivo CSV no tiene el formato correcto. Debe incluir "categoryId", "amount", "month", y "year".');
        }
    };
    
    const budgetHeaders: CsvHeader<MonthlyBudget>[] = [
        { key: 'id', label: 'ID' },
        { key: 'categoryId', label: 'ID Categoría' },
        { key: 'amount', label: 'Monto' },
        { key: 'month', label: 'Mes' },
        { key: 'year', label: 'Año' }
    ];

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Presupuesto Mensual</h1>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-black/20 p-1.5 rounded-lg">
                    <select value={selectedDate.month} onChange={(e) => setSelectedDate(prev => ({ ...prev, month: Number(e.target.value) }))} className="border border-gray-300 dark:border-white/20 rounded-md py-1 px-2 text-sm font-semibold">
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <select value={selectedDate.year} onChange={(e) => setSelectedDate(prev => ({ ...prev, year: Number(e.target.value) }))} className="border border-gray-300 dark:border-white/20 rounded-md py-1 px-2 text-sm font-semibold">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <SummaryCard title="Total Presupuestado" amount={summary.totalBudgeted} color="border-primary-500" />
                <SummaryCard title="Total Gastado" amount={summary.totalSpent} color="border-red-500" />
                <SummaryCard title="Restante Total" amount={summary.totalRemaining < 0 ? 0 : summary.totalRemaining} color={summary.totalRemaining < 0 ? 'border-yellow-500' : 'border-green-500'} />
            </div>

            <GlassCard className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Presupuesto por Categoría</h2>
                    <CsvTools
                        entityName={`Presupuestos-${selectedDate.year}-${months[selectedDate.month].label}`}
                        items={budgetsForPeriod}
                        headers={budgetHeaders}
                        onImport={handleImport}
                        onExportSuccess={() => setSuccessInfo({ title: 'Exportación Exitosa', message: 'Tu presupuesto ha sido exportado.' })}
                    />
                </div>
                 <div className="space-y-4">
                    {expenseCategories.length > 0 ? (
                        expenseCategories.map(category => {
                            const budget = budgetsForPeriod.find(b => b.categoryId === category.id);
                            const spent = periodSpending.get(category.id) || 0;

                            if (budget) {
                                return (
                                    <BudgetCategoryItem
                                        key={category.id}
                                        category={category}
                                        spent={spent}
                                        budgeted={Number(budget.amount)}
                                        onBudgetChange={(amount) => handleBudgetChange(category.id, amount)}
                                        onDelete={() => handleDeleteBudget(category.id)}
                                        onClick={() => handleCategoryClick(category.id)}
                                    />
                                );
                            } else if (addingBudgetId === category.id) {
                                return (
                                    <div key={category.id} className="bg-gray-100/50 dark:bg-black/20 p-4 rounded-xl">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <IconDisplay icon={category.icon} iconColor={category.iconColor} className="w-6 h-6"/>
                                                <span className="font-bold text-lg">{category.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={newBudgetAmount || ''}
                                                    onChange={(e) => setNewBudgetAmount(Number(e.target.value))}
                                                    className="w-24 text-right rounded-md py-1"
                                                    placeholder="Monto"
                                                    autoFocus
                                                />
                                                <button onClick={() => handleSaveNewBudget(category.id)} className="text-green-500"><CheckCircleIcon className="w-6 h-6"/></button>
                                                <button onClick={handleCancelAddBudget} className="text-gray-500"><CloseIcon className="w-6 h-6"/></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            } else {
                                return (
                                    <div key={category.id} className="bg-gray-100/50 dark:bg-black/20 p-4 rounded-xl">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                 <IconDisplay icon={category.icon} iconColor={category.iconColor} className="w-6 h-6"/>
                                                 <button onClick={() => handleCategoryClick(category.id)} className="font-bold text-lg hover:underline">{category.name}</button>
                                            </div>
                                            <button onClick={() => handleAddBudgetClick(category.id)} className="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 font-semibold">
                                                <PlusIcon className="w-4 h-4"/> Añadir Presupuesto
                                            </button>
                                        </div>
                                    </div>
                                );
                            }
                        })
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <p>No hay categorías de gastos para presupuestar.</p>
                            <p className="text-sm">Ve a <button className="underline" onClick={() => navigate('/catalogs')}>Catálogos</button> para añadirlas.</p>
                        </div>
                    )}
                </div>
            </GlassCard>

            <SuccessToast 
                isOpen={!!successInfo}
                onClose={() => setSuccessInfo(null)}
                title={successInfo?.title || ''}
                message={successInfo?.message || ''}
            />
        </div>
    );
};

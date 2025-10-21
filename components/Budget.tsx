import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppData, MonthlyBudget, MovementTypeName } from '../types';
import { DeleteIcon, CheckCircleIcon } from './Icons';
import { useAuth } from '../contexts/AuthContext';
import { CsvTools, CsvHeader } from './CsvTools';
import { generateSequentialId } from './utils';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

const SuccessToast: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
}> = ({ isOpen, onClose, title, message }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => {
                clearTimeout(timer)
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isOpen, onClose]);

    return (
        <div
            className={`fixed bottom-4 left-4 z-50 w-full max-w-sm transition-all duration-300 ease-in-out ${
                isOpen ? 'transform translate-y-0 opacity-100' : 'transform translate-y-4 opacity-0'
            }`}
        >
            {isOpen && (
                 <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 flex items-start gap-4 ring-1 ring-black ring-opacity-5">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                       <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
                    </div>
                    <div className="flex-grow">
                        <p className="font-bold text-gray-900 dark:text-white">{title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
                    </div>
                     <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">&times;</button>
                </div>
            )}
        </div>
    );
};

const SummaryCard: React.FC<{ title: string; amount: number; color: string; }> = ({ title, amount, color }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-l-4 ${color}`}>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{formatCurrency(amount)}</p>
    </div>
);


const BudgetCategoryItem: React.FC<{
    categoryName: string;
    spent: number;
    budgeted: number;
    onBudgetChange: (newAmount: number) => void;
    onDelete: () => void;
    onClick: () => void;
}> = ({ categoryName, spent, budgeted, onBudgetChange, onDelete, onClick }) => {
    
    const progress = budgeted > 0 ? (spent / budgeted) * 100 : 0;
    const remaining = budgeted - spent;

    const getProgressBarColor = () => {
        if (progress > 100) return 'bg-red-500';
        if (progress > 75) return 'bg-yellow-500';
        return 'bg-primary-600';
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl group">
            <div className="flex justify-between items-center mb-2">
                <h4 
                    className="font-bold text-lg cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition"
                    onClick={onClick}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
                    role="button"
                    tabIndex={0}
                >
                    {categoryName}
                </h4>
                <div className="w-1/3 flex items-center gap-1">
                     <div className="relative flex-grow">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                        <input
                            type="number"
                            value={budgeted === 0 ? '' : budgeted}
                            onChange={(e) => onBudgetChange(Number(e.target.value) || 0)}
                            className="w-full pl-7 pr-2 py-1 text-right rounded-md border-gray-300 dark:border-gray-600 shadow-sm"
                            placeholder="Presupuesto"
                        />
                    </div>
                    <button 
                        onClick={onDelete} 
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        title="Eliminar presupuesto"
                    >
                        <DeleteIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div 
                className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-600 mb-2 cursor-pointer"
                onClick={onClick}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
                role="button"
                tabIndex={0}
                aria-label={`Ver detalles de gastos para ${categoryName}`}
            >
                <div className={`${getProgressBarColor()} h-4 rounded-full transition-all duration-500`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Gastado: {formatCurrency(spent)}</span>
                {budgeted > 0 && (
                    <span className={remaining < 0 ? 'text-red-500 font-semibold' : ''}>
                        {remaining >= 0 ? `Restante: ${formatCurrency(remaining)}` : `Excedido: ${formatCurrency(Math.abs(remaining))}`}
                    </span>
                )}
            </div>
        </div>
    );
};


export const Budget: React.FC = () => {
    const { appData: data, setData } = useAuth();
    const navigate = useNavigate();
    const [successInfo, setSuccessInfo] = useState<{ title: string; message: string } | null>(null);
    const [addingBudgetId, setAddingBudgetId] = useState<string | null>(null);
    const [newBudgetAmount, setNewBudgetAmount] = useState<number | string>('');

    if (!data) {
        return <div>Cargando...</div>;
    }

    const { expenseCategories, monthlySpending } = useMemo(() => {
        const movGasto = data.movementTypes.find(m => m.name === MovementTypeName.GASTO);
        if (!movGasto) return { expenseCategories: [], monthlySpending: new Map<string, number>() };

        const expenseCategories = data.categories.filter(c => c.movementTypeId === movGasto.id);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const monthlySpending = new Map<string, number>();

        const addExpense = (categoryId: string | undefined, amount: number) => {
             if (categoryId) {
                monthlySpending.set(categoryId, (monthlySpending.get(categoryId) || 0) + amount);
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
            expense.payments.forEach(payment => {
                const paymentDate = new Date(payment.date);
                 if (paymentDate >= startOfMonth && paymentDate <= endOfMonth) {
                    const concept = data.concepts.find(c => c.id === expense.conceptId);
                    addExpense(concept?.categoryId, payment.amount);
                }
            });
        });

        return { expenseCategories, monthlySpending };
    }, [data]);
    
    const summary = useMemo(() => {
        // FIX: Explicitly type the accumulator `sum` as `number` to resolve TypeScript
        // inference issues where `sum` could be inferred as `unknown`.
        const totalBudgeted = data.monthlyBudgets.reduce((sum: number, b) => sum + Number(b.amount || 0), 0);
        const totalSpent = Array.from(monthlySpending.values()).reduce((sum: number, amount) => sum + Number(amount || 0), 0);
        const totalRemaining = totalBudgeted - totalSpent;
        return { totalBudgeted, totalSpent, totalRemaining };
    }, [data.monthlyBudgets, monthlySpending]);

    const handleBudgetChange = (categoryId: string, amount: number) => {
        const existingBudget = data.monthlyBudgets.find(b => b.categoryId === categoryId);
        let newBudgets;
        if (existingBudget) {
            newBudgets = data.monthlyBudgets.map(b => 
                b.categoryId === categoryId ? { ...b, amount } : b
            );
        } else {
            const newId = generateSequentialId('PM', data.monthlyBudgets);
            newBudgets = [...data.monthlyBudgets, { id: newId, categoryId, amount }];
        }
        setData({ ...data, monthlyBudgets: newBudgets });
    };
    
    const handleDeleteBudget = (categoryId: string) => {
        setData({
            ...data,
            monthlyBudgets: data.monthlyBudgets.filter(b => b.categoryId !== categoryId)
        });
    };

    const handleCategoryClick = (categoryId: string) => {
        const categoryName = data.categories.find(c => c.id === categoryId)?.name;
        if(categoryName) {
            navigate('/reports', { state: { filter: 'expenses', categoryFilter: categoryName } });
        }
    };
    
    const handleAddBudgetClick = (categoryId: string) => {
        setAddingBudgetId(categoryId);
        setNewBudgetAmount('');
    };

    const handleSaveNewBudget = (categoryId: string) => {
        const amount = Number(newBudgetAmount) || 0;
        if (amount > 0) {
            handleBudgetChange(categoryId, amount);
        }
        setAddingBudgetId(null);
    };

    const handleCancelAddBudget = () => {
        setAddingBudgetId(null);
    };
    
    const handleImport = (importedData: any[]) => {
        if (Array.isArray(importedData) && importedData.every(item => 'id' in item && 'categoryId' in item && 'amount' in item)) {
            const typedData = importedData.map(d => ({...d, amount: Number(d.amount) })) as MonthlyBudget[];
            setData({ ...data, monthlyBudgets: typedData });
            setSuccessInfo({
                title: 'Importación Exitosa',
                message: `${typedData.length} presupuestos importados con éxito.`
            });
        } else {
             alert('Error: El archivo CSV no tiene el formato correcto para presupuestos.');
        }
    };
    
    const budgetHeaders: CsvHeader<MonthlyBudget>[] = [
        { key: 'id', label: 'ID' },
        { key: 'categoryId', label: 'ID Categoría' },
        { key: 'amount', label: 'Monto' }
    ];


    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Presupuesto Mensual</h1>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <SummaryCard title="Total Presupuestado" amount={summary.totalBudgeted} color="border-primary-500" />
                <SummaryCard title="Total Gastado" amount={summary.totalSpent} color="border-red-500" />
                <SummaryCard title="Restante Total" amount={summary.totalRemaining < 0 ? 0 : summary.totalRemaining} color={summary.totalRemaining < 0 ? 'border-yellow-500' : 'border-green-500'} />
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Presupuesto por Categoría</h2>
                    <CsvTools
                        entityName="Presupuestos"
                        items={data.monthlyBudgets}
                        headers={budgetHeaders}
                        onImport={handleImport}
                        onExportSuccess={() => setSuccessInfo({ title: 'Exportación Exitosa', message: 'Tu presupuesto ha sido exportado a un archivo CSV.' })}
                    />
                </div>
                 <div className="space-y-4">
                    {expenseCategories.length > 0 ? (
                        expenseCategories.map(category => {
                            const budget = data.monthlyBudgets.find(b => b.categoryId === category.id);
                            const spent = monthlySpending.get(category.id) || 0;

                            if (budget) {
                                return (
                                <BudgetCategoryItem
                                        key={category.id}
                                        categoryName={category.name}
                                        spent={spent}
                                        budgeted={budget.amount}
                                        onBudgetChange={(amount) => handleBudgetChange(category.id, amount)}
                                        onDelete={() => handleDeleteBudget(category.id)}
                                        onClick={() => handleCategoryClick(category.id)}
                                />
                                );
                            } else if (addingBudgetId === category.id) {
                                return (
                                    <div key={category.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl transition-all duration-300">
                                        <h4 className="font-bold text-lg mb-2">{category.name}</h4>
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                            <div className="relative flex-grow">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                                                <input
                                                    type="number"
                                                    value={newBudgetAmount}
                                                    onChange={(e) => setNewBudgetAmount(e.target.value)}
                                                    placeholder="Monto del presupuesto"
                                                    className="w-full pl-7 pr-2 py-2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={() => handleSaveNewBudget(category.id)} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition">
                                                    Guardar
                                                </button>
                                                <button onClick={handleCancelAddBudget} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-semibold px-4 py-2 rounded-lg text-sm transition">
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            } else {
                                return (
                                <div key={category.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl flex justify-between items-center">
                                    <h4 className="font-bold text-lg">{category.name}</h4>
                                    <button onClick={() => handleAddBudgetClick(category.id)} className="bg-primary-100 hover:bg-primary-200 dark:bg-primary-900/50 dark:hover:bg-primary-900 text-primary-700 dark:text-primary-200 font-semibold px-4 py-2 rounded-lg text-sm transition">
                                        Añadir Presupuesto
                                    </button>
                                </div>
                                );
                            }
                        })
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <p>No hay categorías de gastos para presupuestar.</p>
                            <p className="mt-2 text-sm">
                                Por favor, ve a <a href="#/catalogs" className="font-medium text-primary-600 hover:underline">Catálogos</a> para añadir categorías de gastos.
                            </p>
                        </div>
                    )}
                </div>
            </div>
            <SuccessToast 
                isOpen={!!successInfo}
                onClose={() => setSuccessInfo(null)}
                title={successInfo?.title || ''}
                message={successInfo?.message || ''}
            />
        </div>
    );
};
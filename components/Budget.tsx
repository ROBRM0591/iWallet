import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MonthlyBudget, MovementTypeName, Category } from '../types';
import { DeleteIcon, CheckCircleIcon, EditIcon, PlusIcon, CloseIcon } from '../components/Icons';
import { useAuth } from '../contexts/AuthContext';
import { generateSequentialId } from '../components/utils';
import { IconDisplay } from './IconDisplay';
import { Modal, ConfirmationModal, SuccessToast } from './common/Portals';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-slate-700/80 shadow-2xl text-gray-900 dark:text-white ${className}`}>
        {children}
    </div>
);

const SummaryCard: React.FC<{ title: string; amount: number; className: string; }> = ({ title, amount, className }) => (
    <GlassCard className={`p-4 sm:p-6 ${className}`}>
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
        <div className="p-4 bg-gray-100 dark:bg-black/20 rounded-lg">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 cursor-pointer" onClick={onClick}>
                    <IconDisplay icon={category.icon} iconColor={category.iconColor} className="w-6 h-6" />
                    <h4 className="font-bold hover:underline">{category.name}</h4>
                </div>
                <div className="flex items-center gap-2">
                    {budgeted > 0 && (
                        <button onClick={() => setIsEditing(!isEditing)} className="text-gray-500 dark:text-gray-400 hover:text-primary-500 p-1">
                            {isEditing ? <CloseIcon className="w-5 h-5" /> : <EditIcon className="w-5 h-5" />}
                        </button>
                    )}
                    {budgeted > 0 && <button onClick={onDelete} className="text-gray-500 dark:text-gray-400 hover:text-red-500 p-1"><DeleteIcon className="w-5 h-5" /></button>}
                </div>
            </div>
            {isEditing ? (
                <div className="mt-2 flex items-center gap-2">
                    <input
                        type="number"
                        value={newAmount || ''}
                        onChange={(e) => setNewAmount(Number(e.target.value))}
                        className="w-full"
                        autoFocus
                    />
                    <button onClick={handleSave} className="bg-primary-600 text-white rounded-md p-2"><CheckCircleIcon className="w-5 h-5" /></button>
                </div>
            ) : budgeted > 0 ? (
                <div className="mt-2">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{formatCurrency(spent)}</span>
                        <span className="text-gray-500 dark:text-gray-400">{formatCurrency(budgeted)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div className={`${progressBarColor} h-3 rounded-full`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                    </div>
                    <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {progress > 100
                            ? `${formatCurrency(spent - budgeted)} sobre el presupuesto`
                            : `${formatCurrency(budgeted - spent)} restante`}
                    </div>
                </div>
            ) : (
                <div className="mt-2">
                    <button onClick={() => setIsEditing(true)} className="w-full bg-gray-200 dark:bg-gray-700/50 hover:bg-gray-300 dark:hover:bg-gray-600/50 text-gray-600 dark:text-gray-300 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                        <PlusIcon className="w-5 h-5" /> Añadir Presupuesto
                    </button>
                </div>
            )}
        </div>
    );
};

interface BudgetFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (categoryId: string, amount: number) => void;
    unbudgetedCategories: Category[];
}

const BudgetFormModal: React.FC<BudgetFormModalProps> = ({ isOpen, onClose, onSave, unbudgetedCategories }) => {
    const [categoryId, setCategoryId] = useState('');
    const [amount, setAmount] = useState(0);
    const [error, setError] = useState('');
    
    useEffect(() => {
        if(unbudgetedCategories.length > 0) {
            setCategoryId(unbudgetedCategories[0].id);
        }
    }, [unbudgetedCategories]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!categoryId || amount <= 0) {
            setError('Por favor, seleccione una categoría y un monto mayor a cero.');
            return;
        }
        setError('');
        onSave(categoryId, amount);
        setCategoryId(unbudgetedCategories.length > 1 ? unbudgetedCategories[1].id : '');
        setAmount(0);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Añadir Nuevo Presupuesto">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Categoría</label>
                    <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="mt-1 block w-full rounded-md shadow-sm">
                        {unbudgetedCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">Monto Presupuestado</label>
                    <input type="number" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} className="mt-1 block w-full rounded-md shadow-sm" placeholder="Ej: 5000" />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Guardar</button>
                </div>
            </form>
        </Modal>
    );
};


export const Budget: React.FC = () => {
    const { appData, setData } = useAuth();
    const navigate = useNavigate();
    const [successInfo, setSuccessInfo] = useState<{ title: string; message: string; } | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [deleteInfo, setDeleteInfo] = useState<{ categoryId: string; categoryName: string } | null>(null);

    const { summary, budgetData, unbudgetedCategories } = useMemo(() => {
        if (!appData) return { summary: { totalBudget: 0, totalSpent: 0, remaining: 0 }, budgetData: [], unbudgetedCategories: [] };
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

        const periodSpending = new Map<string, number>();

        // Daily Expenses
        appData.dailyExpenses.forEach(expense => {
            const expenseDate = new Date(expense.date);
            if (expenseDate >= startOfMonth && expenseDate <= endOfMonth) {
                const concept = appData.concepts.find(c => c.id === expense.conceptId);
                if (concept?.categoryId) {
                    periodSpending.set(concept.categoryId, (periodSpending.get(concept.categoryId) || 0) + Number(expense.amount));
                }
            }
        });

        // Planned Expenses Payments
        appData.plannedExpenses.forEach(expense => {
            (expense.payments || []).forEach(payment => {
                const paymentDate = new Date(payment.date);
                if (paymentDate >= startOfMonth && paymentDate <= endOfMonth) {
                    const concept = appData.concepts.find(c => c.id === expense.conceptId);
                    if (concept?.categoryId) {
                        periodSpending.set(concept.categoryId, (periodSpending.get(concept.categoryId) || 0) + Number(payment.amount));
                    }
                }
            });
        });

        const movGastoId = appData.movementTypes.find(m => m.name === MovementTypeName.GASTO)?.id;
        const expenseCategories = appData.categories.filter(c => c.movementTypeId === movGastoId);
        
        const budgetedCategoryIds = new Set(
            appData.monthlyBudgets
                .filter(b => b.month === currentMonth && b.year === currentYear)
                .map(b => b.categoryId)
        );
        
        const budgetItems = expenseCategories.map(category => {
            const budget = appData.monthlyBudgets.find(b => b.categoryId === category.id && b.month === currentMonth && b.year === currentYear);
            return {
                category: { id: category.id, name: category.name, icon: category.icon, iconColor: category.iconColor },
                spent: periodSpending.get(category.id) || 0,
                budgeted: budget?.amount || 0,
            };
        });
        
        let totalBudget = 0;
        let totalSpent = 0;
        budgetItems.forEach(item => {
            if (item.budgeted > 0) {
                totalBudget += item.budgeted;
                totalSpent += item.spent;
            }
        });

        const unbudgeted = expenseCategories.filter(c => !budgetedCategoryIds.has(c.id));

        return {
            summary: { totalBudget, totalSpent, remaining: totalBudget - totalSpent },
            budgetData: budgetItems,
            unbudgetedCategories: unbudgeted,
        };
    }, [appData]);

    const handleBudgetChange = (categoryId: string, newAmount: number) => {
        if (!appData) return;
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        let budgetFound = false;
        const updatedBudgets = appData.monthlyBudgets.map(budget => {
            if (budget.categoryId === categoryId && budget.month === currentMonth && budget.year === currentYear) {
                budgetFound = true;
                return { ...budget, amount: newAmount };
            }
            return budget;
        });

        if (!budgetFound) {
            updatedBudgets.push({
                id: generateSequentialId('PR', appData.monthlyBudgets),
                categoryId,
                amount: newAmount,
                month: currentMonth,
                year: currentYear
            });
        }
        
        setData({ ...appData, monthlyBudgets: updatedBudgets });
        setSuccessInfo({ title: 'Éxito', message: 'Presupuesto actualizado correctamente.'});
    };
    
    const handleDeleteRequest = (categoryId: string, categoryName: string) => {
        setDeleteInfo({ categoryId, categoryName });
    };

    const handleConfirmDelete = () => {
        if (!deleteInfo || !appData) return;
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const updatedBudgets = appData.monthlyBudgets.filter(b => 
            !(b.categoryId === deleteInfo.categoryId && b.month === currentMonth && b.year === currentYear)
        );
        setData({ ...appData, monthlyBudgets: updatedBudgets });
        setDeleteInfo(null);
    };

    const handleCategoryClick = (categoryId: string) => {
        navigate('/reports', { state: { filter: 'expenses', categoryFilter: appData?.categories.find(c => c.id === categoryId)?.name }});
    };
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold">Presupuesto Mensual</h1>
                {unbudgetedCategories.length > 0 && (
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition">
                        <PlusIcon className="w-5 h-5" />
                        Añadir Presupuesto
                    </button>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard title="Total Presupuestado" amount={summary.totalBudget} className="bg-blue-100 dark:bg-blue-900/50" />
                <SummaryCard title="Total Gastado" amount={summary.totalSpent} className="bg-red-100 dark:bg-red-900/50" />
                <SummaryCard title="Restante General" amount={summary.remaining} className="bg-green-100 dark:bg-green-900/50" />
            </div>
            
            <GlassCard className="p-4 sm:p-6">
                <h2 className="text-xl font-bold mb-4">Presupuesto por Categoría</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {budgetData.map(({ category, spent, budgeted }) => (
                        <BudgetCategoryItem 
                            key={category.id}
                            category={category}
                            spent={spent}
                            budgeted={budgeted}
                            onBudgetChange={(newAmount) => handleBudgetChange(category.id, newAmount)}
                            onDelete={() => handleDeleteRequest(category.id, category.name)}
                            onClick={() => handleCategoryClick(category.id)}
                        />
                    ))}
                </div>
            </GlassCard>

            <BudgetFormModal 
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleBudgetChange}
                unbudgetedCategories={unbudgetedCategories}
            />

            <ConfirmationModal
                isOpen={!!deleteInfo}
                onClose={() => setDeleteInfo(null)}
                onConfirm={handleConfirmDelete}
                title={`Eliminar Presupuesto`}
                message={`¿Estás seguro de que quieres eliminar el presupuesto para la categoría "${deleteInfo?.categoryName}" de este mes?`}
            />
            
            <SuccessToast
                isOpen={!!successInfo}
                onClose={() => setSuccessInfo(null)}
                title={successInfo?.title || ''}
                message={successInfo?.message || ''}
            />
        </div>
    );
};
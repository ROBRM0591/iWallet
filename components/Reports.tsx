import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppData, DailyExpense, Income } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { DeleteIcon, WarningIcon, CheckCircleIcon } from './Icons';
import { useAuth } from '../contexts/AuthContext';
import { CsvTools, CsvHeader } from './CsvTools';

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value}`;
};
const formatFullCurrency = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

const ConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}> = ({ isOpen, onClose, onConfirm, title, message }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md m-4 transform transition-all text-center p-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50">
                    <WarningIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
                </div>
                <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white mt-4">{title}</h3>
                <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
                </div>
                <div className="mt-6 flex justify-center gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => { onConfirm(); onClose(); }}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

const SuccessToast: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
}> = ({ isOpen, onClose, title, message }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
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

const CustomTooltipContent = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-lg">
                <p className="label font-bold">{label}</p>
                {payload.map((pld: any, index: number) => (
                    <div key={index} style={{ color: pld.color }}>
                        {`${pld.name}: ${formatFullCurrency(pld.value)}`}
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

type TransactionSource = 'income' | 'daily' | 'planned';

interface Transaction {
    id: string;
    source: TransactionSource;
    expenseId?: string;
    type: string;
    date: string;
    concept: string;
    category: string;
    amount: number;
}

const TransactionList: React.FC<{
    transactions: Transaction[];
    onDelete: (id: string, source: TransactionSource, expenseId?: string) => void;
}> = ({ transactions, onDelete }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <h3 className="font-bold text-xl mb-4 text-gray-800 dark:text-white">Detalle de Transacciones</h3>
            <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left">
                    <thead className="sticky top-0 bg-white dark:bg-gray-800">
                        <tr className="border-b dark:border-gray-700">
                            <th className="p-3">Fecha</th>
                            <th className="p-3">Concepto</th>
                            <th className="p-3">Categoría</th>
                            <th className="p-3">Tipo</th>
                            <th className="p-3 text-right">Monto</th>
                            <th className="p-3 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.length === 0 ? (
                             <tr><td colSpan={6} className="text-center p-8 text-gray-500">No se encontraron transacciones con los filtros seleccionados.</td></tr>
                        ) : (
                            transactions.map(t => (
                                <tr key={`${t.source}-${t.id}`} className="border-b dark:border-gray-700 even:bg-gray-50 dark:even:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                    <td className="p-3 text-sm whitespace-nowrap">{new Date(t.date).toLocaleDateString('es-MX')}</td>
                                    <td className="p-3 font-medium">{t.concept}</td>
                                    <td className="p-3 text-sm">{t.category}</td>
                                    <td className="p-3 text-sm">{t.type}</td>
                                    <td className={`p-3 text-right font-semibold ${t.source === 'income' ? 'text-green-600' : 'text-red-600'}`}>{formatFullCurrency(t.amount)}</td>
                                    <td className="p-3 text-right">
                                        <button onClick={() => onDelete(t.id, t.source, t.expenseId)} className="text-gray-400 hover:text-red-500 p-1" title="Eliminar registro">
                                            <DeleteIcon className="w-5 h-5"/>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export const Reports: React.FC = () => {
    const { appData: data, setData } = useAuth();
    const location = useLocation();
    const stateFilters = location.state || {};

    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const lastDayOfMonth = new Date(year, today.getMonth() + 1, 0).getDate().toString().padStart(2, '0');

    const startOfYear = `${year}-01-01`;
    const endOfMonth = `${year}-${month}-${lastDayOfMonth}`;

    const [startDate, setStartDate] = useState(startOfYear);
    const [endDate, setEndDate] = useState(endOfMonth);
    const [typeFilter, setTypeFilter] = useState(stateFilters.filter || 'all');
    const [categoryFilter, setCategoryFilter] = useState(stateFilters.categoryFilter || 'all');
    const [deleteInfo, setDeleteInfo] = useState<{ id: string, source: TransactionSource, expenseId?: string } | null>(null);
    const [successInfo, setSuccessInfo] = useState<{ title: string; message: string } | null>(null);

    if (!data) {
        return <div>Cargando...</div>;
    }
    
    const { filteredTransactions, categorySpendingData, incomeVsExpenseData, uniqueCategories } = useMemo(() => {
        const createUtcDate = (dateString: string, endOfDay = false) => {
            if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                return endOfDay ? new Date() : new Date(0);
            }
            const [year, month, day] = dateString.split('-').map(Number);
            if (endOfDay) {
                return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
            }
            return new Date(Date.UTC(year, month - 1, day));
        };
        
        const start = createUtcDate(startDate);
        const end = createUtcDate(endDate, true);

        // 1. Build a complete list of all transactions within the date range
        const allTransactions: Transaction[] = [];
        data.incomes.forEach(income => {
            if (new Date(income.date) >= start && new Date(income.date) <= end) {
                allTransactions.push({ id: income.id, source: 'income', type: 'Ingreso', date: income.date, concept: income.description, category: 'N/A', amount: income.amount });
            }
        });
        data.dailyExpenses.forEach(expense => {
            if (new Date(expense.date) >= start && new Date(expense.date) <= end) {
                const concept = data.concepts.find(c => c.id === expense.conceptId);
                const category = data.categories.find(cat => cat.id === concept?.categoryId)?.name || 'Sin Categoría';
                allTransactions.push({ id: expense.id, source: 'daily', type: 'Gasto Diario', date: expense.date, concept: concept?.name || 'N/A', category, amount: expense.amount });
            }
        });
        data.plannedExpenses.forEach(expense => {
            expense.payments.forEach(payment => {
                 if (new Date(payment.date) >= start && new Date(payment.date) <= end) {
                    const concept = data.concepts.find(c => c.id === expense.conceptId);
                    const category = data.categories.find(cat => cat.id === concept?.categoryId)?.name || 'Sin Categoría';
                    allTransactions.push({ id: payment.id, source: 'planned', expenseId: expense.id, type: 'Gasto Planificado', date: payment.date, concept: concept?.name || 'N/A', category, amount: payment.amount });
                }
            })
        });

        // 2. Aggregate data for charts in a single loop
        const categoryMap = new Map<string, number>();
        const monthMap = new Map<string, { ingresos: number, gastos: number }>();
        
        allTransactions.forEach(t => {
            const date = new Date(t.date);
            const monthKey = `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}`;
            if (!monthMap.has(monthKey)) {
                monthMap.set(monthKey, { ingresos: 0, gastos: 0 });
            }
            const currentMonthData = monthMap.get(monthKey)!;

            if (t.type === 'Ingreso') {
                currentMonthData.ingresos += t.amount;
            } else {
                currentMonthData.gastos += t.amount;
                categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
            }
        });

        // 3. Transform aggregated data for charts
        const finalCategorySpendingData = Array.from(categoryMap.entries()).map(([name, Gastos]) => ({ name, Gastos }));
        
        const finalIncomeVsExpenseData = Array.from(monthMap.entries())
            .map(([month, values]) => ({ month, ...values }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .map(({ month, ingresos, gastos }) => {
                const date = new Date(`${month}-02T00:00:00Z`);
                return {
                    month: date.toLocaleString('es-MX', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
                    Ingresos: ingresos,
                    Gastos: gastos,
                };
            });

        // 4. Create filtered list for the table view
        let finalFilteredTransactions = [...allTransactions];
        if (typeFilter === 'incomes') {
            finalFilteredTransactions = finalFilteredTransactions.filter(t => t.type === 'Ingreso');
        } else if (typeFilter === 'expenses') {
            finalFilteredTransactions = finalFilteredTransactions.filter(t => t.type !== 'Ingreso');
        }
        if (categoryFilter !== 'all') {
             finalFilteredTransactions = finalFilteredTransactions.filter(t => t.category === categoryFilter);
        }
        finalFilteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // 5. Get unique categories for the dropdown filter
        const finalUniqueCategories = [...new Set(allTransactions.map(t => t.category))].filter(c => c !== 'N/A' && c !== 'Sin Categoría');

        return { 
            filteredTransactions: finalFilteredTransactions, 
            categorySpendingData: finalCategorySpendingData, 
            incomeVsExpenseData: finalIncomeVsExpenseData, 
            uniqueCategories: finalUniqueCategories
        };
    }, [startDate, endDate, typeFilter, categoryFilter, data]);


    const handleDelete = (id: string, source: TransactionSource, expenseId?: string) => {
        setDeleteInfo({ id, source, expenseId });
    };

    const confirmDelete = () => {
        if (!deleteInfo || !data) return;

        let newData = { ...data };

        switch (deleteInfo.source) {
            case 'income':
                newData.incomes = data.incomes.filter(i => i.id !== deleteInfo.id);
                break;
            case 'daily':
                newData.dailyExpenses = data.dailyExpenses.filter(e => e.id !== deleteInfo.id);
                break;
            case 'planned':
                if (deleteInfo.expenseId) {
                    newData.plannedExpenses = data.plannedExpenses.map(pe => {
                        if (pe.id === deleteInfo.expenseId) {
                            return {
                                ...pe,
                                payments: pe.payments.filter(p => p.id !== deleteInfo.id),
                            };
                        }
                        return pe;
                    });
                }
                break;
        }

        setData(newData);
        setDeleteInfo(null);
    };

    const handleImportIncomes = (importedData: any[]) => {
        if (Array.isArray(importedData)) {
            const typedData = importedData.map(d => ({
                ...d,
                amount: Number(d.amount),
            })) as Income[];
            setData({ ...data, incomes: typedData });
            setSuccessInfo({
                title: 'Importación Exitosa',
                message: `${typedData.length} ingresos importados con éxito.`
            });
        } else {
            alert('Error: El archivo CSV no tiene el formato correcto para ingresos.');
        }
    };
    
    const handleImportDailyExpenses = (importedData: any[]) => {
        if (Array.isArray(importedData)) {
            const typedData = importedData.map(d => ({
                ...d,
                amount: Number(d.amount),
            })) as DailyExpense[];
            setData({ ...data, dailyExpenses: typedData });
             setSuccessInfo({
                title: 'Importación Exitosa',
                message: `${typedData.length} gastos diarios importados con éxito.`
            });
        } else {
             alert('Error: El archivo CSV no tiene el formato correcto para gastos diarios.');
        }
    };
    
    const incomeHeaders: CsvHeader<Income>[] = [
        { key: 'id', label: 'ID' },
        { key: 'description', label: 'Descripción' },
        { key: 'amount', label: 'Monto' },
        { key: 'date', label: 'Fecha (ISO)' },
    ];
    
    const dailyExpenseHeaders: CsvHeader<DailyExpense>[] = [
        { key: 'id', label: 'ID' },
        { key: 'conceptId', label: 'ID Concepto' },
        { key: 'amount', label: 'Monto' },
        { key: 'date', label: 'Fecha (ISO)' },
    ];


    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Reportes</h1>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg flex flex-wrap items-center gap-4">
                <div>
                    <label className="text-sm font-medium mr-2">Desde:</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm" />
                </div>
                <div>
                    <label className="text-sm font-medium mr-2">Hasta:</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm" />
                </div>
                <div>
                    <label className="text-sm font-medium mr-2">Tipo:</label>
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm">
                        <option value="all">Todos</option>
                        <option value="incomes">Ingresos</option>
                        <option value="expenses">Gastos</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium mr-2">Categoría:</label>
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm" disabled={typeFilter === 'incomes'}>
                        <option value="all">Todas</option>
                        {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="font-bold text-xl mb-4 text-gray-800 dark:text-white">Ingresos vs. Gastos</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={incomeVsExpenseData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={formatCurrency} />
                            <Tooltip content={<CustomTooltipContent />} />
                            <Legend />
                            <Bar dataKey="Ingresos" fill="#22c55e" />
                            <Bar dataKey="Gastos" fill="#ef4444" />
                            <Line type="monotone" dataKey="Ingresos" stroke="#16a34a" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="Gastos" stroke="#dc2626" strokeWidth={2} dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="font-bold text-xl mb-4 text-gray-800 dark:text-white">Gastos por Categoría</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={categorySpendingData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tickFormatter={formatCurrency} />
                            <YAxis type="category" dataKey="name" width={100} />
                            <Tooltip content={<CustomTooltipContent />} />
                            <Bar dataKey="Gastos" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="font-bold text-xl mb-4 text-gray-800 dark:text-white">Herramientas de Datos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Gestión de Ingresos</h4>
                        <CsvTools 
                            entityName="Ingresos" 
                            items={data.incomes} 
                            headers={incomeHeaders} 
                            onImport={handleImportIncomes}
                            onExportSuccess={() => setSuccessInfo({ title: 'Exportación Exitosa', message: 'Tus ingresos han sido exportados a un archivo CSV.' })}
                        />
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Gestión de Gastos Diarios</h4>
                        <CsvTools 
                            entityName="Gastos Diarios" 
                            items={data.dailyExpenses} 
                            headers={dailyExpenseHeaders} 
                            onImport={handleImportDailyExpenses}
                            onExportSuccess={() => setSuccessInfo({ title: 'Exportación Exitosa', message: 'Tus gastos diarios han sido exportados a un archivo CSV.' })}
                        />
                    </div>
                </div>
            </div>

            <TransactionList transactions={filteredTransactions} onDelete={handleDelete} />

            <ConfirmationModal
                isOpen={!!deleteInfo}
                onClose={() => setDeleteInfo(null)}
                onConfirm={confirmDelete}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que quieres eliminar esta transacción? Esta acción no se puede deshacer."
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
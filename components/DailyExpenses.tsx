import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DailyExpense, Concept, MovementTypeName } from '../types';
import { generateSequentialId } from './utils';
import { CsvTools, CsvHeader } from './CsvTools';
import { DeleteIcon, WarningIcon, CheckCircleIcon, CurrencyDollarIcon, PlusIcon } from './Icons';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

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

export const DailyExpenses: React.FC = () => {
    const { appData: data, setData } = useAuth();
    const todayISO = new Date().toISOString().split('T')[0];
    const [formState, setFormState] = useState({ conceptId: '', amount: 0, date: todayISO });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [successInfo, setSuccessInfo] = useState<{ title: string; message: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    if (!data) return <div>Cargando...</div>;

    const movGastoId = useMemo(() => data.movementTypes.find(m => m.name === MovementTypeName.GASTO)?.id, [data.movementTypes]);
    const variableCostTypeId = useMemo(() => data.costTypes.find(ct => ct.name === 'Variable')?.id, [data.costTypes]);
    const expenseConcepts = useMemo(() => {
        return data.concepts.filter(c => c.movementTypeId === movGastoId && c.costTypeId === variableCostTypeId);
    }, [data.concepts, movGastoId, variableCostTypeId]);

    const { monthlyTotal, filteredExpenses } = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        let total = 0;
        const filtered = data.dailyExpenses
            .map(expense => {
                const concept = data.concepts.find(c => c.id === expense.conceptId);
                const category = data.categories.find(cat => cat.id === concept?.categoryId)?.name || 'Sin Categoría';
                return { ...expense, conceptName: concept?.name || 'N/A', categoryName: category };
            })
            .filter(expense => {
                const expenseDate = new Date(expense.date);
                if (expenseDate >= startOfMonth && expenseDate <= endOfMonth) {
                    total += expense.amount;
                }
                const term = searchTerm.toLowerCase();
                return !term || expense.conceptName.toLowerCase().includes(term) || expense.categoryName.toLowerCase().includes(term);
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return { monthlyTotal: total, filteredExpenses: filtered };
    }, [data.dailyExpenses, data.concepts, data.categories, searchTerm]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        if (!formState.conceptId) newErrors.conceptId = 'Debe seleccionar un concepto.';
        if (formState.amount <= 0) newErrors.amount = 'El monto debe ser mayor a 0.';
        if (!formState.date) newErrors.date = 'La fecha es requerida.';
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const newExpense: DailyExpense = {
            id: generateSequentialId('GD', data.dailyExpenses),
            conceptId: formState.conceptId,
            amount: formState.amount,
            date: new Date(formState.date).toISOString()
        };
        setData({ ...data, dailyExpenses: [...data.dailyExpenses, newExpense] });
        setFormState({ conceptId: '', amount: 0, date: todayISO });
        setErrors({});
        setSuccessInfo({ title: 'Éxito', message: 'Gasto diario registrado correctamente.' });
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (!deleteId) return;
        setData({ ...data, dailyExpenses: data.dailyExpenses.filter(e => e.id !== deleteId) });
        setDeleteId(null);
    };
    
    const handleImport = (importedData: any[]) => {
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
    
    const headers: CsvHeader<DailyExpense>[] = [
        { key: 'id', label: 'ID' },
        { key: 'conceptId', label: 'ID Concepto' },
        { key: 'amount', label: 'Monto' },
        { key: 'date', label: 'Fecha (ISO)' },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gastos Diarios</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                        <PlusIcon className="w-6 h-6" />
                        Agregar Gasto
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Concepto (Gasto Variable)</label>
                            <select value={formState.conceptId} onChange={e => setFormState(s => ({...s, conceptId: e.target.value}))} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm">
                                <option value="">Seleccione un concepto</option>
                                {expenseConcepts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            {errors.conceptId && <p className="text-red-500 text-xs mt-1">{errors.conceptId}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Monto</label>
                            <input type="number" step="0.01" value={formState.amount || ''} onChange={e => setFormState(s => ({...s, amount: parseFloat(e.target.value)}))} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" />
                            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Fecha</label>
                            <input type="date" value={formState.date} onChange={e => setFormState(s => ({...s, date: e.target.value}))} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" />
                            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                        </div>
                        <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">
                            Registrar Gasto
                        </button>
                    </form>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                        <div className="flex-grow">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Historial de Gastos</h2>
                            <p className="text-gray-500 dark:text-gray-400">Total del mes actual: <span className="font-bold text-primary-600 dark:text-primary-400">{formatCurrency(monthlyTotal)}</span></p>
                        </div>
                         <div className="w-full md:w-auto flex items-center gap-2">
                             <input 
                                type="text"
                                placeholder="Buscar en historial..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full md:w-auto px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm"
                            />
                            <CsvTools
                                entityName="Gastos Diarios"
                                items={data.dailyExpenses}
                                headers={headers}
                                onImport={handleImport}
                                onExportSuccess={() => setSuccessInfo({ title: 'Exportación Exitosa', message: 'Tus gastos diarios han sido exportados.' })}
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white dark:bg-gray-800">
                                <tr className="border-b dark:border-gray-700">
                                    <th className="p-3">Fecha</th>
                                    <th className="p-3">Concepto</th>
                                    <th className="p-3">Categoría</th>
                                    <th className="p-3 text-right">Monto</th>
                                    <th className="p-3 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center p-8 text-gray-500">No hay gastos diarios registrados.</td></tr>
                                ) : (
                                    filteredExpenses.map(expense => (
                                        <tr key={expense.id} className="border-b dark:border-gray-700 even:bg-gray-50 dark:even:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                            <td className="p-3 text-sm whitespace-nowrap">{new Date(expense.date).toLocaleDateString('es-MX')}</td>
                                            <td className="p-3 font-medium">{expense.conceptName}</td>
                                            <td className="p-3 text-sm">{expense.categoryName}</td>
                                            <td className="p-3 text-right font-semibold text-red-600">{formatCurrency(expense.amount)}</td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => handleDelete(expense.id)} className="text-gray-400 hover:text-red-500 p-1" title="Eliminar gasto">
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
            </div>
            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que quieres eliminar este gasto diario? Esta acción no se puede deshacer."
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

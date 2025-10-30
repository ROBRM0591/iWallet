import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppData, SavingsGoal } from '../types';
import { CloseIcon, PlusIcon, EditIcon, DeleteIcon, WarningIcon, CheckCircleIcon } from './Icons';
import { IconPicker } from './IconPicker';
import { IconDisplay } from './IconDisplay';
import { useAuth } from '../contexts/AuthContext';
import { CsvTools, CsvHeader } from './CsvTools';
import { generateSequentialId } from './utils';

const GlassCard = React.forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(({ children, className = '' }, ref) => (
    <div ref={ref} className={`bg-white dark:bg-black/20 dark:backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/20 shadow-lg text-gray-900 dark:text-white ${className}`}>
        {children}
    </div>
));
GlassCard.displayName = "GlassCard";

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
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-2xl shadow-2xl w-full max-w-md m-4 transform transition-all text-center p-6 text-gray-900 dark:text-white">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50">
                    <WarningIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
                </div>
                <h3 className="text-lg leading-6 font-bold mt-4">{title}</h3>
                <div className="mt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
                </div>
                <div className="mt-6 flex justify-center gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg transition"
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
                 <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-xl shadow-2xl p-4 flex items-start gap-4 text-gray-900 dark:text-white">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                       <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
                    </div>
                    <div className="flex-grow">
                        <p className="font-bold">{title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
                    </div>
                     <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">&times;</button>
                </div>
            )}
        </div>
    );
};

// Modal Component
const Modal: React.FC<{ isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 backdrop-blur-xl border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-white/20">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

// Savings Goal Form
const SavingsGoalForm: React.FC<{
    item: Partial<SavingsGoal> | null;
    onSave: (item: SavingsGoal) => void;
    onCancel: () => void;
}> = ({ item, onSave, onCancel }) => {
    const [formState, setFormState] = useState({
        name: item?.name || '',
        targetAmount: item?.targetAmount || 0,
        currentAmount: item?.currentAmount || 0,
        deadline: item?.deadline ? item.deadline.split('T')[0] : '',
        icon: item?.icon || 'tag',
        iconColor: item?.iconColor || 'text-gray-900 dark:text-white',
    });
    const [isIconPickerOpen, setIconPickerOpen] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const iconPickerContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (iconPickerContainerRef.current && !iconPickerContainerRef.current.contains(event.target as Node)) {
                setIconPickerOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: name.includes('Amount') ? parseFloat(value) : value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleIconSelect = (details: { icon: string; color: string; }) => {
        setFormState(prev => ({ ...prev, icon: details.icon, iconColor: details.color }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formState.name.trim()) newErrors.name = 'El nombre de la meta es requerido.';
        if (formState.targetAmount <= 0) newErrors.targetAmount = 'El monto objetivo debe ser mayor a 0.';
        if (!formState.deadline) newErrors.deadline = 'La fecha límite es requerida.';
        if (formState.currentAmount < 0) newErrors.currentAmount = 'El monto actual no puede ser negativo.';
        if (formState.currentAmount > formState.targetAmount) newErrors.currentAmount = 'El monto actual no puede ser mayor al objetivo.';
        return newErrors;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        onSave({
            ...item,
            ...formState,
            deadline: new Date(`${formState.deadline}T00:00:00`).toISOString(),
        } as SavingsGoal);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium">Nombre de la Meta</label>
                 <div className="flex items-center gap-2 mt-1">
                    <div className="relative" ref={iconPickerContainerRef}>
                        <button type="button" onClick={() => setIconPickerOpen(prev => !prev)} className="p-2 border border-gray-300 dark:border-white/20 rounded-md bg-white/50 dark:bg-white/10">
                            <IconDisplay icon={formState.icon} iconColor={formState.iconColor} className="w-6 h-6" />
                        </button>
                        {isIconPickerOpen && <IconPicker onSelect={handleIconSelect} onClose={() => setIconPickerOpen(false)} currentColor={formState.iconColor} />}
                    </div>
                    <input type="text" name="name" value={formState.name} onChange={handleChange} className="block w-full rounded-md shadow-sm" />
                </div>
                {errors.name && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium">Monto Objetivo</label>
                    <input type="number" name="targetAmount" value={formState.targetAmount || ''} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm" />
                    {errors.targetAmount && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.targetAmount}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium">Monto Actual</label>
                    <input type="number" name="currentAmount" value={formState.currentAmount || ''} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm" />
                    {errors.currentAmount && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.currentAmount}</p>}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium">Fecha Límite</label>
                <input type="date" name="deadline" value={formState.deadline} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm" />
                {errors.deadline && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.deadline}</p>}
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Guardar Meta</button>
            </div>
        </form>
    );
};

const formatCurrency = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

const SavingsGoalCard: React.FC<{
    goal: SavingsGoal;
    onEdit: (goal: SavingsGoal) => void;
    onDelete: (id: string) => void;
}> = ({ goal, onEdit, onDelete }) => {
    const progress = Number(goal.targetAmount) > 0 ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100 : 0;
    const daysLeft = Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
    const progressBarColor = progress >= 100 ? 'bg-green-500' : progress > 75 ? 'bg-blue-500' : progress > 40 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <GlassCard className="p-6 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <IconDisplay icon={goal.icon} iconColor={goal.iconColor} className="w-8 h-8" />
                        <h3 className="text-xl font-bold">{goal.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => onEdit(goal)} className="p-1 text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300"><EditIcon className="w-5 h-5" /></button>
                        <button onClick={() => onDelete(goal.id)} className="p-1 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"><DeleteIcon className="w-5 h-5" /></button>
                    </div>
                </div>
                <div className="flex justify-between items-end mt-4">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Progreso</p>
                        <p className="text-2xl font-bold">{formatCurrency(goal.currentAmount)} / <span className="text-lg font-medium">{formatCurrency(goal.targetAmount)}</span></p>
                    </div>
                    <p className="text-3xl font-bold">{progress.toFixed(0)}%</p>
                </div>
                <div className="mt-2 h-4 w-full bg-gray-200 dark:bg-black/30 rounded-full">
                    <div className={`${progressBarColor} h-4 rounded-full transition-all duration-500`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/20 text-center text-sm text-gray-500 dark:text-gray-400">
                {progress >= 100 ? "¡Meta Alcanzada! 🎉" : `${daysLeft} días restantes`}
            </div>
        </GlassCard>
    );
};

export const SavingsGoals: React.FC = () => {
    const { appData, setData } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<SavingsGoal | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [successInfo, setSuccessInfo] = useState<{ title: string; message: string } | null>(null);

    const handleOpenModal = (item: SavingsGoal | null = null) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingItem(null);
        setIsModalOpen(false);
    };

    const handleSave = (item: SavingsGoal) => {
        let newGoals;
        if (item.id) {
            newGoals = appData!.savingsGoals.map(g => g.id === item.id ? item : g);
        } else {
            newGoals = [...appData!.savingsGoals, { ...item, id: generateSequentialId('MA', appData!.savingsGoals) }];
        }
        setData({ ...appData!, savingsGoals: newGoals });
        handleCloseModal();
    };

    const handleDelete = (id: string) => setDeleteId(id);

    const confirmDelete = () => {
        if (!deleteId) return;
        setData({ ...appData!, savingsGoals: appData!.savingsGoals.filter(g => g.id !== deleteId) });
        setDeleteId(null);
    };

    const handleImport = (importedData: any[]) => {
        if (Array.isArray(importedData)) {
            const typedData = importedData.map(d => ({
                ...d,
                targetAmount: Number(d.targetAmount),
                currentAmount: Number(d.currentAmount),
            })) as SavingsGoal[];
            setData({ ...appData!, savingsGoals: typedData });
            setSuccessInfo({ title: 'Importación Exitosa', message: `${typedData.length} metas importadas.` });
        } else {
            alert('Error: El archivo CSV no tiene el formato correcto.');
        }
    };
    
    const csvHeaders: CsvHeader<SavingsGoal>[] = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Nombre' },
        { key: 'targetAmount', label: 'Monto Objetivo' },
        { key: 'currentAmount', label: 'Monto Actual' },
        { key: 'deadline', label: 'Fecha Límite' },
        { key: 'icon', label: 'Icono' },
        { key: 'iconColor', label: 'Color Icono' },
    ];

    if (!appData) return null;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Metas de Ahorro</h1>
                <div className="flex items-center gap-2">
                    <CsvTools 
                        entityName="Metas de Ahorro" 
                        items={appData.savingsGoals} 
                        headers={csvHeaders} 
                        onImport={handleImport}
                        onExportSuccess={() => setSuccessInfo({ title: 'Exportación Exitosa', message: 'Tus metas de ahorro han sido exportadas.' })}
                    />
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition">
                        <PlusIcon className="w-5 h-5" />
                        Nueva Meta
                    </button>
                </div>
            </div>

            {appData.savingsGoals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {appData.savingsGoals.map(goal => (
                        <SavingsGoalCard key={goal.id} goal={goal} onEdit={handleOpenModal} onDelete={handleDelete} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-lg text-gray-500 dark:text-gray-400">Aún no tienes metas de ahorro.</p>
                    <p className="text-gray-400 dark:text-gray-500">¡Crea una para empezar a ahorrar para tus sueños!</p>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? 'Editar Meta de Ahorro' : 'Nueva Meta de Ahorro'}>
                <SavingsGoalForm item={editingItem} onSave={handleSave} onCancel={handleCloseModal} />
            </Modal>
            <ConfirmationModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={confirmDelete} title="Eliminar Meta" message="¿Estás seguro de que quieres eliminar esta meta de ahorro?" />
            <SuccessToast isOpen={!!successInfo} onClose={() => setSuccessInfo(null)} title={successInfo?.title || ''} message={successInfo?.message || ''} />
        </div>
    );
};
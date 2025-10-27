import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppData, SavingsGoal } from '../types';
import { CloseIcon, PlusIcon, EditIcon, DeleteIcon, WarningIcon, CheckCircleIcon } from './Icons';
import { IconPicker } from './IconPicker';
import { IconDisplay } from './IconDisplay';
import { useAuth } from '../contexts/AuthContext';
import { CsvTools, CsvHeader } from './CsvTools';
import { generateSequentialId } from './utils';

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg text-white ${className}`}>
        {children}
    </div>
);

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
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl w-full max-w-md m-4 transform transition-all text-center p-6 text-white">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50">
                    <WarningIcon className="h-6 w-6 text-red-300" />
                </div>
                <h3 className="text-lg leading-6 font-bold mt-4">{title}</h3>
                <div className="mt-2">
                    <p className="text-sm text-gray-400">{message}</p>
                </div>
                <div className="mt-6 flex justify-center gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded-lg transition"
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
                 <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl p-4 flex items-start gap-4 text-white">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-900/50 flex items-center justify-center">
                       <CheckCircleIcon className="h-6 w-6 text-green-300" />
                    </div>
                    <div className="flex-grow">
                        <p className="font-bold">{title}</p>
                        <p className="text-sm text-gray-300">{message}</p>
                    </div>
                     <button onClick={onClose} className="text-gray-400 hover:text-gray-200">&times;</button>
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
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all">
                <div className="flex justify-between items-center p-4 border-b border-white/20">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
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
        iconColor: item?.iconColor || 'text-white',
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
            deadline: new Date(formState.deadline).toISOString(),
        } as SavingsGoal);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium">Nombre de la Meta</label>
                 <div className="flex items-center gap-2 mt-1">
                    <div className="relative" ref={iconPickerContainerRef}>
                        <button type="button" onClick={() => setIconPickerOpen(prev => !prev)} className="p-2 border border-white/20 rounded-md bg-white/10">
                            <IconDisplay icon={formState.icon} iconColor={formState.iconColor} className="w-6 h-6" />
                        </button>
                        {isIconPickerOpen && <IconPicker onSelect={handleIconSelect} onClose={() => setIconPickerOpen(false)} currentColor={formState.iconColor} />}
                    </div>
                    <input type="text" name="name" value={formState.name} onChange={handleChange} className="block w-full rounded-md shadow-sm" />
                </div>
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium">Monto Objetivo</label>
                    <input type="number" name="targetAmount" value={formState.targetAmount || ''} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm" />
                    {errors.targetAmount && <p className="text-red-400 text-xs mt-1">{errors.targetAmount}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium">Monto Actual</label>
                    <input type="number" name="currentAmount" value={formState.currentAmount || ''} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm" />
                     {errors.currentAmount && <p className="text-red-400 text-xs mt-1">{errors.currentAmount}</p>}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium">Fecha Límite</label>
                <input type="date" name="deadline" value={formState.deadline} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm" />
                {errors.deadline && <p className="text-red-400 text-xs mt-1">{errors.deadline}</p>}
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="bg-white/10 hover:bg-white/20 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Guardar</button>
            </div>
        </form>
    );
};


export const SavingsGoals: React.FC = () => {
    const { appData: data, setData } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<SavingsGoal | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [successInfo, setSuccessInfo] = useState<{ title: string; message: string } | null>(null);
    const location = useLocation();
    const navigate = useNavigate();
    const goalRefs = useRef<Record<string, HTMLDivElement | null>>({});

    if (!data) {
        return <div>Cargando...</div>;
    }

    useEffect(() => {
        const goalIdToOpen = location.state?.openGoalId;
        if (goalIdToOpen && goalRefs.current[goalIdToOpen]) {
            const element = goalRefs.current[goalIdToOpen];
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element?.classList.add('ring-2', 'ring-primary-500');
            setTimeout(() => {
                element?.classList.remove('ring-2', 'ring-primary-500');
            }, 2500);
            // Clear state from location
            navigate(location.pathname, { state: {}, replace: true });
        }
    }, [location.state, navigate]);

    const filteredGoals = useMemo(() => {
        if (!searchTerm) return data.savingsGoals;
        return data.savingsGoals.filter(goal => 
            goal.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data.savingsGoals, searchTerm]);

    const handleOpenModal = (item: SavingsGoal | null = null) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingItem(null);
        setIsModalOpen(false);
    };

    const handleSave = (item: SavingsGoal) => {
        let newSavingsGoals;
        if (item.id) {
            newSavingsGoals = data.savingsGoals.map(sg => sg.id === item.id ? item : sg);
        } else {
            newSavingsGoals = [...data.savingsGoals, { ...item, id: generateSequentialId('MA', data.savingsGoals) }];
        }
        setData({ ...data, savingsGoals: newSavingsGoals });
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };
    
    const confirmDelete = () => {
        if (!deleteId) return;
        setData({ ...data, savingsGoals: data.savingsGoals.filter(sg => sg.id !== deleteId) });
        setDeleteId(null);
    };
    
    const handleImport = (importedData: any[]) => {
        if (Array.isArray(importedData)) {
            const typedData = importedData.map(d => ({
                ...d,
                targetAmount: Number(d.targetAmount),
                currentAmount: Number(d.currentAmount),
            })) as SavingsGoal[];
            setData({ ...data, savingsGoals: typedData });
             setSuccessInfo({
                title: 'Importación Exitosa',
                message: `${typedData.length} metas de ahorro importadas con éxito.`
            });
        } else {
             alert('Error: El archivo CSV no tiene el formato correcto para metas de ahorro.');
        }
    };
    
    const headers: CsvHeader<SavingsGoal>[] = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Nombre' },
        { key: 'icon', label: 'Icono' },
        { key: 'iconColor', label: 'Icono Color' },
        { key: 'targetAmount', label: 'Monto Objetivo' },
        { key: 'currentAmount', label: 'Monto Actual' },
        { key: 'deadline', label: 'Fecha Límite (ISO)' },
    ];

    const formatCurrency = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h1 className="text-3xl font-bold">Metas de Ahorro</h1>
                <div className="w-full md:w-auto flex items-center gap-4 flex-wrap">
                     <input 
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-auto flex-grow px-3 py-2 rounded-md shadow-sm"
                    />
                     <CsvTools
                        entityName="Metas de Ahorro"
                        items={data.savingsGoals}
                        headers={headers}
                        onImport={handleImport}
                        onExportSuccess={() => setSuccessInfo({ title: 'Exportación Exitosa', message: 'Tus metas de ahorro han sido exportadas a un archivo CSV.' })}
                    />
                    <button onClick={() => handleOpenModal()} className="flex-shrink-0 flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">
                        <PlusIcon className="w-5 h-5" />
                        Añadir Meta
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {filteredGoals.map(goal => {
                    const progress = (goal.currentAmount / goal.targetAmount) * 100;
                    return (
                        <GlassCard 
                            key={goal.id} 
                            ref={el => goalRefs.current[goal.id] = el}
                            className="p-4 transition-all duration-300"
                        >
                             <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <IconDisplay icon={goal.icon} iconColor={goal.iconColor} className="w-10 h-10 flex-shrink-0"/>
                                    <div>
                                        <h3 className="font-bold text-lg">
                                            <button onClick={() => handleOpenModal(goal)} className="text-left hover:text-primary-400 hover:underline">
                                                {goal.name}
                                            </button>
                                        </h3>
                                        <p className="text-sm text-gray-400">Objetivo: {formatDate(goal.deadline)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <button onClick={() => handleOpenModal(goal)} className="text-primary-400 p-1"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDelete(goal.id)} className="text-red-400 p-1 ml-2"><DeleteIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                            <div className="mt-2">
                                <div className="flex justify-between mb-1">
                                    <span className="font-semibold text-gray-300">{formatCurrency(goal.currentAmount)}</span>
                                    <span className="text-sm font-medium text-gray-400">{formatCurrency(goal.targetAmount)}</span>
                                </div>
                                <div className="w-full bg-black/20 rounded-full h-4">
                                    <div
                                        className="bg-primary-500 h-4 rounded-full text-center text-white text-xs flex items-center justify-center"
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    >
                                      {progress >= 10 && `${Math.round(progress)}%`}
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    );
                })}
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? 'Editar Meta de Ahorro' : 'Añadir Meta de Ahorro'}>
                <SavingsGoalForm
                    item={editingItem}
                    onSave={handleSave}
                    onCancel={handleCloseModal}
                />
            </Modal>
            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que quieres eliminar esta meta de ahorro?"
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
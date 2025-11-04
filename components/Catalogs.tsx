import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppData, CatalogItem, Category, Concept, CostType, MovementType, MovementTypeName } from '../types';
import { PlusIcon, EditIcon, DeleteIcon, WarningIcon, ArrowsUpDownIcon, TagIcon, DownloadIcon, ListBulletIcon, ClipboardIcon, ChevronDownIcon } from './Icons';
import { CsvTools, CsvHeader } from './CsvTools';
import { useAuth, UserProfile } from '../contexts/AuthContext';
import { generateSequentialId } from './utils';
import { IconPicker } from './IconPicker';
import { IconDisplay } from './IconDisplay';
import { Modal, ConfirmationModal, SuccessToast } from './common/Portals';

type CatalogKey = keyof Pick<AppData, 'categories' | 'costTypes' | 'movementTypes' | 'concepts'>;
declare const XLSX: any;

const getPrefix = (singularTitle: string): string => {
    switch(singularTitle) {
        case 'Tipo de Movimiento': return 'TM';
        case 'Tipo de Costo': return 'TC';
        case 'Categoría': return 'CA';
        case 'Concepto': return 'CO';
        default: return 'ID';
    }
};

interface CatalogManagerProps<T extends CatalogItem> {
    title: string;
    singularTitle: string;
    items: T[];
    renderForm: (item: Partial<T> | null, onSave: (item: T) => void, onCancel: () => void) => React.ReactNode;
    renderTable: (items: T[], onEdit: (item: T) => void, onDelete: (id: string) => void) => React.ReactNode;
    onAdd: (item: T) => void;
    onUpdate: (item: T) => void;
    onDelete: (id: string) => void;
    csvHeaders: CsvHeader<T>[];
    onImport: (importedData: T[]) => void;
    onExportSuccess: () => void;
}

function CatalogManager<T extends CatalogItem>({ title, singularTitle, items, renderForm, renderTable, onAdd, onUpdate, onDelete, csvHeaders, onImport, onExportSuccess }: CatalogManagerProps<T>) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<T> | null>(null);
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

    const handleOpenModal = (item: T | null = null) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingItem(null);
        setIsModalOpen(false);
    };

    const handleSave = (item: T) => {
        if ('id' in item && item.id) {
            onUpdate(item);
        } else {
            const prefix = getPrefix(singularTitle);
            const newId = generateSequentialId(prefix, items);
            onAdd({ ...item, id: newId } as T);
        }
        handleCloseModal();
    };

    const handleRequestDelete = (id: string) => {
        setConfirmingDeleteId(id);
    };

    const handleConfirmDelete = () => {
        if (confirmingDeleteId) {
            onDelete(confirmingDeleteId);
        }
    };

    return (
        <div>
            <div className="flex justify-end items-center mb-4 gap-2">
                 <CsvTools
                    entityName={title}
                    items={items}
                    headers={csvHeaders}
                    onImport={onImport}
                    onExportSuccess={onExportSuccess}
                />
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition flex-shrink-0">
                    <PlusIcon className="w-5 h-5" />
                    Añadir
                </button>
            </div>
            {renderTable(items, handleOpenModal, handleRequestDelete)}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`${editingItem && 'id' in editingItem ? 'Editar' : 'Nuevo'} ${singularTitle}`} maxWidth="max-w-lg">
                {renderForm(editingItem, handleSave, handleCloseModal)}
            </Modal>
            <ConfirmationModal
                isOpen={!!confirmingDeleteId}
                onClose={() => setConfirmingDeleteId(null)}
                onConfirm={handleConfirmDelete}
                title={`Eliminar ${singularTitle}`}
                message={`¿Estás seguro de que quieres eliminar este elemento? Esta acción no se puede deshacer.`}
            />
        </div>
    );
}

const MovementTypeTable: React.FC<{
    items: MovementType[];
    onEdit: (item: MovementType) => void;
    onDelete: (id: string) => void;
}> = ({ items, onEdit, onDelete }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-left">
            <thead>
                <tr className="border-b border-gray-300 dark:border-white/20">
                    <th className="p-3">Nombre</th>
                    <th className="p-3 text-right">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {items.map(item => (
                    <tr key={item.id} className="border-b border-gray-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10">
                        <td className="p-3">
                             <button onClick={() => onEdit(item)} className="text-left font-medium text-gray-800 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 hover:underline flex items-center gap-2">
                                <IconDisplay icon={item.icon} iconColor={item.iconColor} className="w-5 h-5" />
                                <span>{item.name}</span>
                            </button>
                        </td>
                        <td className="p-3 text-right">
                            <button onClick={() => onEdit(item)} className="text-primary-500 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 p-1"><EditIcon className="w-5 h-5"/></button>
                            <button onClick={() => onDelete(item.id)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 ml-2"><DeleteIcon className="w-5 h-5"/></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const MovementTypeForm: React.FC<{
    item: Partial<MovementType> | null;
    onSave: (item: MovementType) => void;
    onCancel: () => void;
}> = ({ item, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: item?.name || '',
        icon: item?.icon || 'tag',
        iconColor: item?.iconColor || (document.documentElement.classList.contains('dark') ? 'text-white' : 'text-gray-800'),
    });
    const [error, setError] = useState('');
    const [iconPickerAnchor, setIconPickerAnchor] = useState<HTMLButtonElement | null>(null);

    const handleIconSelect = (details: { icon: string; color: string; }) => {
        setFormData(prev => ({ ...prev, icon: details.icon, iconColor: details.color }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('El nombre es requerido.');
            return;
        }
        setError('');
        onSave({
            ...item,
            name: formData.name as MovementTypeName,
            icon: formData.icon,
            iconColor: formData.iconColor,
        } as MovementType);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Nombre</label>
                 <div className="flex items-center gap-2 mt-1">
                    <div>
                        <button type="button" onClick={(e) => setIconPickerAnchor(iconPickerAnchor ? null : e.currentTarget)} className="p-2 border border-gray-300 dark:border-white/20 rounded-md bg-white/50 dark:bg-white/10">
                            <IconDisplay icon={formData.icon} iconColor={formData.iconColor} className="w-6 h-6" />
                        </button>
                        {iconPickerAnchor && <IconPicker anchorEl={iconPickerAnchor} onSelect={handleIconSelect} onClose={() => setIconPickerAnchor(null)} currentColor={formData.iconColor} position="left" />}
                    </div>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({...prev, name: e.target.value as MovementTypeName}))}
                        className="block w-full rounded-md shadow-sm"
                        required
                    />
                </div>
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Guardar</button>
            </div>
        </form>
    );
};


const CostTypeForm: React.FC<{
    item: Partial<CostType> | null;
    movementTypes: MovementType[];
    onSave: (item: CostType) => void;
    onCancel: () => void;
}> = ({ item, movementTypes, onSave, onCancel }) => {
    const [formData, setFormData] = useState({ 
        name: item?.name || '', 
        movementTypeId: item?.movementTypeId || '',
        icon: item?.icon || 'tag',
        iconColor: item?.iconColor || (document.documentElement.classList.contains('dark') ? 'text-white' : 'text-gray-800'),
    });
    const [errors, setErrors] = useState<{ name?: string; movementTypeId?: string }>({});
    const [iconPickerAnchor, setIconPickerAnchor] = useState<HTMLButtonElement | null>(null);

    const validate = () => {
        const newErrors: { name?: string; movementTypeId?: string } = {};
        if (!formData.name.trim()) newErrors.name = 'El nombre es requerido.';
        if (!formData.movementTypeId) newErrors.movementTypeId = 'Debe seleccionar un tipo de movimiento.';
        return newErrors;
    };

    const handleIconSelect = (details: { icon: string; color: string; }) => {
        setFormData(prev => ({ ...prev, icon: details.icon, iconColor: details.color }));
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
            name: formData.name,
            movementTypeId: formData.movementTypeId,
            icon: formData.icon,
            iconColor: formData.iconColor,
        } as CostType);
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium">Nombre</label>
                <div className="flex items-center gap-2 mt-1">
                    <div>
                        <button type="button" onClick={(e) => setIconPickerAnchor(iconPickerAnchor ? null : e.currentTarget)} className="p-2 border border-gray-300 dark:border-white/20 rounded-md bg-white/50 dark:bg-white/10">
                            <IconDisplay icon={formData.icon} iconColor={formData.iconColor} className="w-6 h-6" />
                        </button>
                        {iconPickerAnchor && <IconPicker anchorEl={iconPickerAnchor} onSelect={handleIconSelect} onClose={() => setIconPickerAnchor(null)} currentColor={formData.iconColor} position="left" />}
                    </div>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="block w-full rounded-md shadow-sm"
                    />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium">Tipo de Movimiento</label>
                <select name="movementTypeId" value={formData.movementTypeId} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm">
                    <option value="">Seleccione...</option>
                    {movementTypes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                 {errors.movementTypeId && <p className="text-red-500 text-xs mt-1">{errors.movementTypeId}</p>}
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Guardar</button>
            </div>
        </form>
    );
};

const CostTypeTable: React.FC<{
    items: CostType[];
    data: AppData;
    onEdit: (item: CostType) => void;
    onDelete: (id: string) => void;
}> = ({ items, data, onEdit, onDelete }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-left">
            <thead>
                <tr className="border-b border-gray-300 dark:border-white/20">
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Tipo de Movimiento</th>
                    <th className="p-3 text-right">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {items.map(item => (
                    <tr key={item.id} className="border-b border-gray-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10">
                        <td className="p-3">
                             <button onClick={() => onEdit(item)} className="text-left font-medium text-gray-800 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 hover:underline flex items-center gap-2">
                                <IconDisplay icon={item.icon} iconColor={item.iconColor} className="w-5 h-5" />
                                <span>{item.name}</span>
                            </button>
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{data.movementTypes.find(m => m.id === item.movementTypeId)?.name || 'N/A'}</td>
                        <td className="p-3 text-right">
                            <button onClick={() => onEdit(item)} className="text-primary-500 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 p-1"><EditIcon className="w-5 h-5"/></button>
                            <button onClick={() => onDelete(item.id)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 ml-2"><DeleteIcon className="w-5 h-5"/></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const CategoryForm: React.FC<{
    item: Partial<Category> | null;
    data: AppData;
    onSave: (item: Category) => void;
    onCancel: () => void;
}> = ({ item, data, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: item?.name || '',
        description: item?.description || '',
        movementTypeId: item?.movementTypeId || '',
        costTypeId: item?.costTypeId || '',
        icon: item?.icon || 'tag',
        iconColor: item?.iconColor || (document.documentElement.classList.contains('dark') ? 'text-white' : 'text-gray-800'),
    });
    const [errors, setErrors] = useState<{ name?: string; movementTypeId?: string; costTypeId?: string }>({});
    const [iconPickerAnchor, setIconPickerAnchor] = useState<HTMLButtonElement | null>(null);

    const isGasto = useMemo(() => {
        if (!formData.movementTypeId) return false;
        const movementType = data.movementTypes.find(mt => mt.id === formData.movementTypeId);
        return movementType?.name === MovementTypeName.GASTO;
    }, [formData.movementTypeId, data.movementTypes]);

    const filteredCostTypes = useMemo(() => {
        if (!isGasto) return [];
        return data.costTypes.filter(c => c.movementTypeId === formData.movementTypeId);
    }, [isGasto, formData.movementTypeId, data.costTypes]);

    useEffect(() => {
        // Clear cost type if movement type changes and it's no longer applicable
        if (!isGasto) {
            setFormData(prev => ({ ...prev, costTypeId: '' }));
        }
    }, [isGasto]);
    
    const validate = () => {
        const newErrors: { name?: string; movementTypeId?: string; costTypeId?: string } = {};
        if (!formData.name.trim()) newErrors.name = 'El nombre es requerido.';
        if (!formData.movementTypeId) newErrors.movementTypeId = 'Debe seleccionar un tipo de movimiento.';
        if (isGasto && !formData.costTypeId) {
            newErrors.costTypeId = 'Debe seleccionar un tipo de costo para un gasto.';
        }
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
            name: formData.name,
            description: formData.description,
            movementTypeId: formData.movementTypeId,
            costTypeId: isGasto ? formData.costTypeId : '',
            icon: formData.icon,
            iconColor: formData.iconColor
        } as Category);
    };
    
     const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleIconSelect = (details: { icon: string; color: string; }) => {
        setFormData(prev => ({ ...prev, icon: details.icon, iconColor: details.color }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium">Nombre</label>
                 <div className="flex items-center gap-2 mt-1">
                    <div>
                        <button type="button" onClick={(e) => setIconPickerAnchor(iconPickerAnchor ? null : e.currentTarget)} className="p-2 border border-gray-300 dark:border-white/20 rounded-md bg-white/50 dark:bg-white/10">
                            <IconDisplay icon={formData.icon} iconColor={formData.iconColor} className="w-6 h-6" />
                        </button>
                        {iconPickerAnchor && <IconPicker anchorEl={iconPickerAnchor} onSelect={handleIconSelect} onClose={() => setIconPickerAnchor(null)} currentColor={formData.iconColor} position="left" />}
                    </div>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="block w-full rounded-md shadow-sm" />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium">Descripción (Opcional)</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md shadow-sm"
                    rows={3}
                />
            </div>
            <div>
                <label className="block text-sm font-medium">Tipo de Movimiento</label>
                <select name="movementTypeId" value={formData.movementTypeId} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm">
                    <option value="">Seleccione...</option>
                    {data.movementTypes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                 {errors.movementTypeId && <p className="text-red-500 text-xs mt-1">{errors.movementTypeId}</p>}
            </div>
            {isGasto && (
                <div>
                    <label className="block text-sm font-medium">Tipo de Costo</label>
                    <select 
                        name="costTypeId"
                        value={formData.costTypeId} 
                        onChange={handleChange} 
                        className="mt-1 block w-full rounded-md shadow-sm"
                    >
                        <option value="">Seleccione...</option>
                        {filteredCostTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {errors.costTypeId && <p className="text-red-500 text-xs mt-1">{errors.costTypeId}</p>}
                </div>
            )}
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Guardar</button>
            </div>
        </form>
    );
};

const CategoryTable: React.FC<{
    items: Category[];
    data: AppData;
    onEdit: (item: Category) => void;
    onDelete: (id: string) => void;
}> = ({ items, data, onEdit, onDelete }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-left">
            <thead>
                <tr className="border-b border-gray-300 dark:border-white/20">
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Descripción</th>
                    <th className="p-3">Tipo de Movimiento</th>
                    <th className="p-3">Tipo de Costo</th>
                    <th className="p-3 text-right">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {items.map(item => (
                    <tr key={item.id} className="border-b border-gray-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10">
                        <td className="p-3">
                             <button onClick={() => onEdit(item)} className="text-left font-medium text-gray-800 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 hover:underline flex items-center gap-2">
                                <IconDisplay icon={item.icon} iconColor={item.iconColor} className="w-5 h-5" />
                                <span>{item.name}</span>
                            </button>
                        </td>
                        <td className="p-3 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{item.description || 'N/A'}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{data.movementTypes.find(m => m.id === item.movementTypeId)?.name || 'N/A'}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{data.costTypes.find(c => c.id === item.costTypeId)?.name || 'N/A'}</td>
                        <td className="p-3 text-right">
                           <button onClick={() => onEdit(item)} className="text-primary-500 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 p-1"><EditIcon className="w-5 h-5"/></button>
                           <button onClick={() => onDelete(item.id)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 ml-2"><DeleteIcon className="w-5 h-5"/></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);


const ConceptForm: React.FC<{
    item: Partial<Concept> | null;
    data: AppData;
    onSave: (item: Concept) => void;
    onCancel: () => void;
}> = ({ item, data, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: item?.name || '',
        description: item?.description || '',
        movementTypeId: item?.movementTypeId || '',
        costTypeId: item?.costTypeId || '',
        categoryId: item?.categoryId || '',
        icon: item?.icon || 'tag',
        iconColor: item?.iconColor || (document.documentElement.classList.contains('dark') ? 'text-white' : 'text-gray-800'),
    });
    const [errors, setErrors] = useState<{ name?: string; movementTypeId?: string; categoryId?: string; }>({});
    const [iconPickerAnchor, setIconPickerAnchor] = useState<HTMLButtonElement | null>(null);

    const filteredCategories = useMemo(() => {
        if (!formData.movementTypeId) return [];
        return data.categories.filter(c => c.movementTypeId === formData.movementTypeId);
    }, [formData.movementTypeId, data.categories]);

    const validate = () => {
        const newErrors: { name?: string; movementTypeId?: string; categoryId?: string; } = {};
        if (!formData.name.trim()) newErrors.name = 'El nombre es requerido.';
        if (!formData.movementTypeId) {
            newErrors.movementTypeId = 'Debe seleccionar un tipo de movimiento.';
        } else {
            if (!formData.categoryId) newErrors.categoryId = 'Debe seleccionar una categoría.';
        }
        return newErrors;
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        let finalCostTypeId = '';
        if (formData.categoryId) {
            const selectedCategory = data.categories.find(c => c.id === formData.categoryId);
            finalCostTypeId = selectedCategory ? selectedCategory.costTypeId : '';
        }

        onSave({ 
            ...item, 
            name: formData.name, 
            description: formData.description,
            icon: formData.icon,
            iconColor: formData.iconColor,
            movementTypeId: formData.movementTypeId, 
            costTypeId: finalCostTypeId, 
            categoryId: formData.categoryId
        } as Concept);
    };
    
    const handleMainChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'movementTypeId') {
                newState.costTypeId = '';
                newState.categoryId = '';
            }
            return newState;
        });

        if (errors[name as keyof typeof errors]) {
            setErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[name as keyof typeof errors];
                return newErrors;
            });
        }
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedCategoryId = e.target.value;
        const selectedCategory = data.categories.find(c => c.id === selectedCategoryId);
        
        setFormData(prev => ({
            ...prev,
            categoryId: selectedCategoryId,
            costTypeId: selectedCategory ? selectedCategory.costTypeId : ''
        }));
        
        if (errors.categoryId) {
            setErrors(prev => ({...prev, categoryId: undefined}));
        }
    };


     const handleIconSelect = (details: { icon: string; color: string; }) => {
        setFormData(prev => ({ ...prev, icon: details.icon, iconColor: details.color }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium">Nombre</label>
                 <div className="flex items-center gap-2 mt-1">
                    <div>
                        <button type="button" onClick={(e) => setIconPickerAnchor(iconPickerAnchor ? null : e.currentTarget)} className="p-2 border border-gray-300 dark:border-white/20 rounded-md bg-white/50 dark:bg-white/10">
                            <IconDisplay icon={formData.icon} iconColor={formData.iconColor} className="w-6 h-6" />
                        </button>
                        {iconPickerAnchor && <IconPicker anchorEl={iconPickerAnchor} onSelect={handleIconSelect} onClose={() => setIconPickerAnchor(null)} currentColor={formData.iconColor} position="left" />}
                    </div>
                    <input type="text" name="name" value={formData.name} onChange={handleMainChange} className="block w-full rounded-md shadow-sm" />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium">Descripción (Opcional)</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleMainChange}
                    className="mt-1 block w-full rounded-md shadow-sm"
                    rows={3}
                />
            </div>
            <div>
                <label className="block text-sm font-medium">Tipo de Movimiento</label>
                <select name="movementTypeId" value={formData.movementTypeId} onChange={handleMainChange} className="mt-1 block w-full rounded-md shadow-sm">
                    <option value="">Seleccione...</option>
                    {data.movementTypes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                {errors.movementTypeId && <p className="text-red-500 text-xs mt-1">{errors.movementTypeId}</p>}
            </div>
            
            <div>
                <label className="block text-sm font-medium">Categoría</label>
                <select 
                    name="categoryId" 
                    value={formData.categoryId} 
                    onChange={handleCategoryChange} 
                    className="mt-1 block w-full rounded-md shadow-sm"
                    disabled={!formData.movementTypeId}
                >
                    <option value="">{formData.movementTypeId ? 'Seleccione...' : 'Primero elija un tipo de movimiento'}</option>
                    {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>}
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Guardar</button>
            </div>
        </form>
    );
};

const ConceptTable: React.FC<{
    items: Concept[];
    data: AppData;
    onEdit: (item: Concept) => void;
    onDelete: (id: string) => void;
}> = ({ items, data, onEdit, onDelete }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-left">
            <thead>
                <tr className="border-b border-gray-300 dark:border-white/20">
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Descripción</th>
                    <th className="p-3">Tipo de Movimiento</th>
                    <th className="p-3">Tipo de Costo</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3 text-right">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {items.map(item => (
                    <tr key={item.id} className="border-b border-gray-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10">
                        <td className="p-3">
                             <button onClick={() => onEdit(item)} className="text-left font-medium text-gray-800 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 hover:underline flex items-center gap-2">
                                <IconDisplay icon={item.icon} iconColor={item.iconColor} className="w-5 h-5" />
                                <span>{item.name}</span>
                            </button>
                        </td>
                        <td className="p-3 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{item.description || 'N/A'}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{data.movementTypes.find(m => m.id === item.movementTypeId)?.name || 'N/A'}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{data.costTypes.find(c => c.id === item.costTypeId)?.name || 'N/A'}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{data.categories.find(cat => cat.id === item.categoryId)?.name || 'N/A'}</td>
                        <td className="p-3 text-right">
                            <button onClick={() => onEdit(item)} className="text-primary-500 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 p-1"><EditIcon className="w-5 h-5"/></button>
                            <button onClick={() => onDelete(item.id)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 ml-2"><DeleteIcon className="w-5 h-5"/></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export const Catalogs: React.FC = () => {
    const { appData: data, setData, userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<CatalogKey>('movementTypes');
    const [successInfo, setSuccessInfo] = useState<{ title: string; message: string } | null>(null);
    const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
    const [dataToImport, setDataToImport] = useState<Partial<AppData> | null>(null);
    const importFileRef = useRef<HTMLInputElement>(null);
    const [isGlobalMenuOpen, setIsGlobalMenuOpen] = useState(false);
    const globalMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (globalMenuRef.current && !globalMenuRef.current.contains(event.target as Node)) {
                setIsGlobalMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [globalMenuRef]);

    const movementTypeHeaders: CsvHeader<MovementType>[] = [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Nombre' }, { key: 'icon', label: 'Icono' }, { key: 'iconColor', label: 'Color' }];
    const costTypeHeaders: CsvHeader<CostType>[] = [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Nombre' }, { key: 'movementTypeId', label: 'ID Tipo Movimiento' }, { key: 'icon', label: 'Icono' }, { key: 'iconColor', label: 'Color' }];
    const categoryHeaders: CsvHeader<Category>[] = [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Nombre' }, { key: 'description', label: 'Descripción' }, { key: 'movementTypeId', label: 'ID Tipo Movimiento' }, { key: 'costTypeId', label: 'ID Tipo Costo' }, { key: 'icon', label: 'Icono' }, { key: 'iconColor', label: 'Color' }];
    const conceptHeaders: CsvHeader<Concept>[] = [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Nombre' }, { key: 'description', label: 'Descripción' }, { key: 'categoryId', label: 'ID Categoría' }, { key: 'movementTypeId', label: 'ID Tipo Movimiento' }, { key: 'costTypeId', label: 'ID Tipo Costo' }, { key: 'icon', label: 'Icono' }, { key: 'iconColor', label: 'Color' }];

    const handleCrud = <T extends CatalogItem>(
        key: CatalogKey, 
        action: 'add' | 'update' | 'delete', 
        itemOrId: T | string
    ) => {
        if (!data) return;
        let newItems;
        const currentItems = data[key] as T[];

        switch(action) {
            case 'add':
                newItems = [...currentItems, itemOrId as T];
                break;
            case 'update':
                const updatedItem = itemOrId as T;
                newItems = currentItems.map(i => i.id === updatedItem.id ? updatedItem : i);
                break;
            case 'delete':
                newItems = currentItems.filter(i => i.id !== itemOrId as string);
                break;
        }
        setData({ ...data, [key]: newItems });
    };

    const handleSingleImport = (key: CatalogKey) => (items: CatalogItem[]) => {
        if (!data) return;
        setData({ ...data, [key]: items });
        setSuccessInfo({ title: 'Importación Exitosa', message: `Los datos de ${key} se han importado correctamente.` });
    };

    const handleExportSuccess = (title: string) => {
        setSuccessInfo({ title: 'Exportación Exitosa', message: `El catálogo de ${title} se ha exportado.` });
    };

    const handleExportAll = () => {
        if (!data) return;
        try {
            const wb = XLSX.utils.book_new();

            const addSheet = <T extends {}>(sheetName: string, items: T[], headers: CsvHeader<T>[]) => {
                const headerRow = headers.map(h => h.label);
                const dataRows = items.map(item =>
                    headers.map(header => {
                        const value = item[header.key as keyof T];
                        return header.formatter ? header.formatter(value) : String(value ?? '');
                    })
                );
                const sheetData = [headerRow, ...dataRows];
                const ws = XLSX.utils.aoa_to_sheet(sheetData);
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
            };

            addSheet('Tipos_Movimiento', data.movementTypes, movementTypeHeaders);
            addSheet('Tipos_Costo', data.costTypes, costTypeHeaders);
            addSheet('Categorias', data.categories, categoryHeaders);
            addSheet('Conceptos', data.concepts, conceptHeaders);

            XLSX.writeFile(wb, `iwallet_catalogos_export.xlsx`);
            setSuccessInfo({ title: 'Exportación Completa', message: 'Todos los catálogos han sido exportados.' });

        } catch (error) {
            console.error("Error al exportar todo:", error);
            alert("Ocurrió un error al exportar los catálogos.");
        }
    };

    const handleImportAllClick = () => {
        importFileRef.current?.click();
    };

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const buffer = e.target?.result;
            try {
                const workbook = XLSX.read(buffer, { type: 'array' });
                const importedData: Partial<AppData> = {};

                const processSheet = <T extends CatalogItem>(sheetName: string, headers: CsvHeader<T>[], catalogKey: CatalogKey) => {
                    const ws = workbook.Sheets[sheetName];
                    if (!ws) return;
                    
                    const jsonData: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
                    const labelToKeyMap = new Map<string, keyof T>();
                    headers.forEach(h => labelToKeyMap.set(h.label, h.key));
                    const expectedHeaders = headers.map(h => h.label);
                    
                    const mappedData = jsonData.map(row => {
                        const newRow: Partial<T> = {};
                        for (const label of expectedHeaders) {
                            const key = labelToKeyMap.get(label);
                            if (key && row[label] !== undefined) {
                               (newRow as any)[key] = String(row[label]).trim();
                            }
                        }
                        return newRow as T;
                    }).filter(item => item.id); 
                    (importedData as any)[catalogKey] = mappedData;
                };

                processSheet('Tipos_Movimiento', movementTypeHeaders, 'movementTypes');
                processSheet('Tipos_Costo', costTypeHeaders, 'costTypes');
                processSheet('Categorias', categoryHeaders, 'categories');
                processSheet('Conceptos', conceptHeaders, 'concepts');

                if (Object.keys(importedData).length > 0) {
                    setDataToImport(importedData);
                    setIsImportConfirmOpen(true);
                } else {
                    alert('El archivo no contiene ninguna hoja de catálogo válida.');
                }

            } catch (error) {
                console.error("Error parsing XLSX file for all catalogs:", error);
                alert(`Error al procesar el archivo XLSX: ${error instanceof Error ? error.message : 'Formato incorrecto.'}`);
            }
        };
        reader.readAsArrayBuffer(file);
        if(event.target) event.target.value = '';
    };

    const confirmImportAll = () => {
        if (dataToImport) {
            setData({ ...data!, ...dataToImport });
            setSuccessInfo({ title: 'Importación Exitosa', message: 'Todos los catálogos han sido importados.' });
        }
        setIsImportConfirmOpen(false);
        setDataToImport(null);
    };

    
    if (!data) return <div>Cargando datos...</div>;
    
    const getCatalogIcon = (section: 'movementTypes' | 'costTypes' | 'categories' | 'concepts', defaultIcon: string) => {
        const settings = userProfile?.catalogSectionIcons?.[section];
        const icon = settings?.icon || defaultIcon;
        const color = settings?.color || 'text-current';
        return <IconDisplay icon={icon} iconColor={color} className="w-5 h-5" />;
    };
    
    const getCatalogName = (section: keyof UserProfile['catalogSectionNames'], defaultName: string) => userProfile?.catalogSectionNames?.[section] || defaultName;

    const catalogTabs: { key: CatalogKey; name: string; defaultIcon: string; }[] = [
        { key: 'movementTypes', name: getCatalogName('movementTypes', "Tipos de Movimiento"), defaultIcon: 'arrows-up-down' },
        { key: 'costTypes', name: getCatalogName('costTypes', "Tipos de Costo"), defaultIcon: 'tag' },
        { key: 'categories', name: getCatalogName('categories', "Categorías"), defaultIcon: 'list-bullet' },
        { key: 'concepts', name: getCatalogName('concepts', "Conceptos"), defaultIcon: 'clipboard' },
    ];
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold">Catálogos</h1>
                <div className="flex items-center gap-2">
                    <input type="file" ref={importFileRef} onChange={handleFileSelected} className="hidden" accept=".xlsx" />
                    <div className="relative inline-block text-left" ref={globalMenuRef}>
                        <div>
                            <button
                                type="button"
                                onClick={() => setIsGlobalMenuOpen(!isGlobalMenuOpen)}
                                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-3 rounded-lg text-sm"
                            >
                                Importar/Exportar Todo
                                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isGlobalMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                        {isGlobalMenuOpen && (
                            <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                <div className="py-1" role="menu" aria-orientation="vertical">
                                    <button
                                        onClick={() => { handleImportAllClick(); setIsGlobalMenuOpen(false); }}
                                        className="w-full text-left text-gray-700 dark:text-gray-200 block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                                    >
                                        Importar Catálogos
                                    </button>
                                    <button
                                        onClick={() => { handleExportAll(); setIsGlobalMenuOpen(false); }}
                                        className="w-full text-left text-gray-700 dark:text-gray-200 block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                                    >
                                        Exportar Catálogos
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
    
            <div className="border-b border-gray-300 dark:border-white/20">
                <nav className="-mb-px flex flex-wrap space-x-4" aria-label="Tabs">
                    {catalogTabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`${
                                activeTab === tab.key
                                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
                            } flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                            aria-current={activeTab === tab.key ? 'page' : undefined}
                        >
                            {getCatalogIcon(tab.key, tab.defaultIcon)}
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>
    
            <div className="mt-6">
                {activeTab === 'movementTypes' && (
                    <CatalogManager<MovementType>
                        title="Tipos de Movimiento"
                        singularTitle="Tipo de Movimiento"
                        items={data.movementTypes}
                        renderForm={(item, onSave, onCancel) => <MovementTypeForm item={item} onSave={onSave} onCancel={onCancel} />}
                        renderTable={(items, onEdit, onDelete) => <MovementTypeTable items={items} onEdit={onEdit} onDelete={onDelete} />}
                        onAdd={(item) => handleCrud('movementTypes', 'add', item)}
                        onUpdate={(item) => handleCrud('movementTypes', 'update', item)}
                        onDelete={(id) => handleCrud('movementTypes', 'delete', id)}
                        csvHeaders={movementTypeHeaders}
                        onImport={handleSingleImport('movementTypes')}
                        onExportSuccess={() => handleExportSuccess('Tipos de Movimiento')}
                    />
                )}
                {activeTab === 'costTypes' && (
                     <CatalogManager<CostType>
                        title="Tipos de Costo"
                        singularTitle="Tipo de Costo"
                        items={data.costTypes}
                        renderForm={(item, onSave, onCancel) => <CostTypeForm item={item} movementTypes={data.movementTypes} onSave={onSave} onCancel={onCancel} />}
                        renderTable={(items, onEdit, onDelete) => <CostTypeTable items={items} data={data} onEdit={onEdit} onDelete={onDelete} />}
                        onAdd={(item) => handleCrud('costTypes', 'add', item)}
                        onUpdate={(item) => handleCrud('costTypes', 'update', item)}
                        onDelete={(id) => handleCrud('costTypes', 'delete', id)}
                        csvHeaders={costTypeHeaders}
                        onImport={handleSingleImport('costTypes')}
                        onExportSuccess={() => handleExportSuccess('Tipos de Costo')}
                    />
                )}
                {activeTab === 'categories' && (
                    <CatalogManager<Category>
                        title="Categorías"
                        singularTitle="Categoría"
                        items={data.categories}
                        renderForm={(item, onSave, onCancel) => <CategoryForm item={item} data={data} onSave={onSave} onCancel={onCancel} />}
                        renderTable={(items, onEdit, onDelete) => <CategoryTable items={items} data={data} onEdit={onEdit} onDelete={onDelete} />}
                        onAdd={(item) => handleCrud('categories', 'add', item)}
                        onUpdate={(item) => handleCrud('categories', 'update', item)}
                        onDelete={(id) => handleCrud('categories', 'delete', id)}
                        csvHeaders={categoryHeaders}
                        onImport={handleSingleImport('categories')}
                        onExportSuccess={() => handleExportSuccess('Categorías')}
                    />
                )}
                {activeTab === 'concepts' && (
                     <CatalogManager<Concept>
                        title="Conceptos"
                        singularTitle="Concepto"
                        items={data.concepts}
                        renderForm={(item, onSave, onCancel) => <ConceptForm item={item} data={data} onSave={onSave} onCancel={onCancel} />}
                        renderTable={(items, onEdit, onDelete) => <ConceptTable items={items} data={data} onEdit={onEdit} onDelete={onDelete} />}
                        onAdd={(item) => handleCrud('concepts', 'add', item)}
                        onUpdate={(item) => handleCrud('concepts', 'update', item)}
                        onDelete={(id) => handleCrud('concepts', 'delete', id)}
                        csvHeaders={conceptHeaders}
                        onImport={handleSingleImport('concepts')}
                        onExportSuccess={() => handleExportSuccess('Conceptos')}
                    />
                )}
            </div>
            
            <SuccessToast
                isOpen={!!successInfo}
                onClose={() => setSuccessInfo(null)}
                title={successInfo?.title || ''}
                message={successInfo?.message || ''}
            />
            <ConfirmationModal
                isOpen={isImportConfirmOpen}
                onClose={() => setIsImportConfirmOpen(false)}
                onConfirm={confirmImportAll}
                title="Confirmar Importación Masiva"
                message="¿Estás seguro de que quieres importar todos los catálogos? Esta acción reemplazará todos los datos existentes en los catálogos correspondientes."
            />
        </div>
    );
}
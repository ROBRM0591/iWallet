import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppData, CatalogItem, Category, Concept, CostType, MovementType, MovementTypeName } from '../types';
import { CloseIcon, PlusIcon, EditIcon, DeleteIcon, ChevronDownIcon, ChevronUpIcon, WarningIcon, CheckCircleIcon, ArrowsUpDownIcon } from './Icons';
import { CsvTools, CsvHeader } from './CsvTools';
import { useAuth } from '../contexts/AuthContext';
import { generateSequentialId } from './utils';

type CatalogKey = keyof Pick<AppData, 'categories' | 'costTypes' | 'movementTypes' | 'concepts'>;
declare const XLSX: any;

const ConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}> = ({ isOpen, onClose, onConfirm, title, message }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
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

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);
    
    if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md m-4 transform transition-all">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const ImportPreviewModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    fileName: string;
    sheets: string[];
}> = ({ isOpen, onClose, onConfirm, fileName, sheets }) => {
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg m-4 transform transition-all p-6">
                <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white">Confirmar Importación</h3>
                <div className="mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Se importarán los siguientes catálogos desde el archivo <strong>{fileName}</strong>. Esta acción reemplazará todos los datos de catálogos existentes.
                    </p>
                    <div className="mt-4 max-h-60 overflow-y-auto bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2">Hojas/Tablas encontradas:</h4>
                        {sheets.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                {sheets.map((sheet, index) => <li key={index}>{sheet}</li>)}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">No se encontraron tablas o pestañas válidas en el archivo.</p>
                        )}
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={sheets.length === 0}
                        className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Sí, Importar y Reemplazar
                    </button>
                </div>
            </div>
        </div>
    );
};

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
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`${editingItem && 'id' in editingItem ? 'Editar' : 'Nuevo'} ${singularTitle}`}>
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

const CollapsibleCatalog: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void; }> = ({ title, children, isOpen, onToggle }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center p-6 text-left"
            >
                <h2 className="text-2xl font-bold">{title}</h2>
                {isOpen ? <ChevronUpIcon className="w-6 h-6 text-primary-600" /> : <ChevronDownIcon className="w-6 h-6 text-gray-500" />}
            </button>
            {isOpen && (
                <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
                    {children}
                </div>
            )}
        </div>
    );
};

// Generic Table for simple catalogs like MovementType
const GenericTable: React.FC<{
    items: CatalogItem[];
    onEdit: (item: CatalogItem) => void;
    onDelete: (id: string) => void;
}> = ({ items, onEdit, onDelete }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-left">
            <thead>
                <tr className="border-b dark:border-gray-700">
                    <th className="p-3">Nombre</th>
                    <th className="p-3 text-right">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {items.map(item => (
                    <tr key={item.id} className="border-b dark:border-gray-700 even:bg-gray-50 dark:even:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700/50">
                        <td className="p-3">
                             <button onClick={() => onEdit(item)} className="text-left font-medium text-gray-800 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 hover:underline">
                                {item.name}
                            </button>
                        </td>
                        <td className="p-3 text-right">
                            <button onClick={() => onEdit(item)} className="text-primary-600 hover:text-primary-800 dark:hover:text-primary-400 p-1"><EditIcon className="w-5 h-5"/></button>
                            <button onClick={() => onDelete(item.id)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 ml-2"><DeleteIcon className="w-5 h-5"/></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);


// --- Forms and Tables for each Catalog Type ---

const MovementTypeForm: React.FC<{
    item: Partial<MovementType> | null;
    onSave: (item: MovementType) => void;
    onCancel: () => void;
}> = ({ item, onSave, onCancel }) => {
    const [name, setName] = useState(item?.name || '');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('El nombre es requerido.');
            return;
        }
        setError('');
        onSave({ ...item, name } as MovementType);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                 <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value as MovementTypeName)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm"
                    required
                />
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg">Cancelar</button>
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
    const [formData, setFormData] = useState({ name: item?.name || '', movementTypeId: item?.movementTypeId || '' });
    const [errors, setErrors] = useState<{ name?: string; movementTypeId?: string }>({});

    const validate = () => {
        const newErrors: { name?: string; movementTypeId?: string } = {};
        if (!formData.name.trim()) newErrors.name = 'El nombre es requerido.';
        if (!formData.movementTypeId) newErrors.movementTypeId = 'Debe seleccionar un tipo de movimiento.';
        return newErrors;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        onSave({ ...item, ...formData } as CostType);
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
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium">Tipo de Movimiento</label>
                <select name="movementTypeId" value={formData.movementTypeId} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm">
                    <option value="">Seleccione...</option>
                    {movementTypes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                 {errors.movementTypeId && <p className="text-red-500 text-xs mt-1">{errors.movementTypeId}</p>}
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg">Cancelar</button>
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
                <tr className="border-b dark:border-gray-700">
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Tipo de Movimiento</th>
                    <th className="p-3 text-right">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {items.map(item => (
                    <tr key={item.id} className="border-b dark:border-gray-700 even:bg-gray-50 dark:even:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700/50">
                        <td className="p-3">
                             <button onClick={() => onEdit(item)} className="text-left font-medium text-gray-800 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 hover:underline">
                                {item.name}
                            </button>
                        </td>
                        <td className="p-3">{data.movementTypes.find(m => m.id === item.movementTypeId)?.name || 'N/A'}</td>
                        <td className="p-3 text-right">
                            <button onClick={() => onEdit(item)} className="text-primary-600 hover:text-primary-800 dark:hover:text-primary-400 p-1"><EditIcon className="w-5 h-5"/></button>
                            <button onClick={() => onDelete(item.id)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 ml-2"><DeleteIcon className="w-5 h-5"/></button>
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
    });
    const [errors, setErrors] = useState<{ name?: string; movementTypeId?: string; costTypeId?: string }>({});

    const filteredCostTypes = useMemo(() => {
        if (!formData.movementTypeId) return [];
        return data.costTypes.filter(c => c.movementTypeId === formData.movementTypeId);
    }, [formData.movementTypeId, data.costTypes]);

    useEffect(() => {
        if (formData.costTypeId && !filteredCostTypes.some(c => c.id === formData.costTypeId)) {
            setFormData(prev => ({ ...prev, costTypeId: '' }));
        }
    }, [formData.movementTypeId, formData.costTypeId, filteredCostTypes]);
    
    const validate = () => {
        const newErrors: { name?: string; movementTypeId?: string; costTypeId?: string } = {};
        if (!formData.name.trim()) newErrors.name = 'El nombre es requerido.';
        if (!formData.movementTypeId) newErrors.movementTypeId = 'Debe seleccionar un tipo de movimiento.';
        if (!formData.costTypeId) newErrors.costTypeId = 'Debe seleccionar un tipo de costo.';
        return newErrors;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        onSave({ ...item, ...formData } as Category);
    };
    
     const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium">Descripción (Opcional)</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm"
                    rows={3}
                />
            </div>
            <div>
                <label className="block text-sm font-medium">Tipo de Movimiento</label>
                <select name="movementTypeId" value={formData.movementTypeId} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm">
                    <option value="">Seleccione...</option>
                    {data.movementTypes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                 {errors.movementTypeId && <p className="text-red-500 text-xs mt-1">{errors.movementTypeId}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium">Tipo de Costo</label>
                <select 
                    name="costTypeId"
                    value={formData.costTypeId} 
                    onChange={handleChange} 
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm disabled:bg-gray-200 dark:disabled:bg-gray-700" 
                    disabled={!formData.movementTypeId}
                >
                    <option value="">{formData.movementTypeId ? 'Seleccione...' : 'Primero elija un tipo de movimiento'}</option>
                    {filteredCostTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.costTypeId && <p className="text-red-500 text-xs mt-1">{errors.costTypeId}</p>}
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg">Cancelar</button>
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
                <tr className="border-b dark:border-gray-700">
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Descripción</th>
                    <th className="p-3">Tipo de Movimiento</th>
                    <th className="p-3">Tipo de Costo</th>
                    <th className="p-3 text-right">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {items.map(item => (
                    <tr key={item.id} className="border-b dark:border-gray-700 even:bg-gray-50 dark:even:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700/50">
                        <td className="p-3">
                             <button onClick={() => onEdit(item)} className="text-left font-medium text-gray-800 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 hover:underline">
                                {item.name}
                            </button>
                        </td>
                        <td className="p-3 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{item.description || 'N/A'}</td>
                        <td className="p-3">{data.movementTypes.find(m => m.id === item.movementTypeId)?.name || 'N/A'}</td>
                        <td className="p-3">{data.costTypes.find(c => c.id === item.costTypeId)?.name || 'N/A'}</td>
                        <td className="p-3 text-right">
                           <button onClick={() => onEdit(item)} className="text-primary-600 hover:text-primary-800 dark:hover:text-primary-400 p-1"><EditIcon className="w-5 h-5"/></button>
                           <button onClick={() => onDelete(item.id)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 ml-2"><DeleteIcon className="w-5 h-5"/></button>
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
    const INCOME_KEY = 'income-option';
    const movIngreso = data.movementTypes.find(m => m.name === MovementTypeName.INGRESO);
    const isEditingIncome = item?.movementTypeId === movIngreso?.id && !item.categoryId;

    const [formData, setFormData] = useState({
        name: item?.name || '',
        description: item?.description || '',
        categoryId: isEditingIncome ? INCOME_KEY : (item?.categoryId || ''),
    });
    const [errors, setErrors] = useState<{ name?: string; categoryId?: string; }>({});

    const derivedState = useMemo(() => {
        if (formData.categoryId === INCOME_KEY) {
            return {
                costTypeId: '',
                movementTypeId: movIngreso?.id || '',
            };
        }
        if (formData.categoryId) {
            const selectedCategory = data.categories.find(c => c.id === formData.categoryId);
            return {
                costTypeId: selectedCategory?.costTypeId || '',
                movementTypeId: selectedCategory?.movementTypeId || '',
            };
        }
        return { costTypeId: '', movementTypeId: '' };
    }, [formData.categoryId, data.categories, movIngreso]);

    const validate = () => {
        const newErrors: { name?: string; categoryId?: string; } = {};
        if (!formData.name.trim()) newErrors.name = 'El nombre es requerido.';
        if (!formData.categoryId) newErrors.categoryId = 'Debe seleccionar una categoría o tipo.';
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
            movementTypeId: derivedState.movementTypeId, 
            categoryId: formData.categoryId === INCOME_KEY ? '' : formData.categoryId, 
            costTypeId: derivedState.costTypeId 
        } as Concept);
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium">Descripción (Opcional)</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm"
                    rows={3}
                />
            </div>
            <div>
                <label className="block text-sm font-medium">Categoría (o tipo)</label>
                <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm">
                    <option value="">Seleccione...</option>
                    <option value={INCOME_KEY}>-- Es un Ingreso --</option>
                    <optgroup label="Categorías de Gastos">
                        {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </optgroup>
                </select>
                {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium">Tipo de Costo</label>
                <select value={derivedState.costTypeId} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm disabled:bg-gray-200 dark:disabled:bg-gray-700" disabled>
                    <option value="">{formData.categoryId ? 'Autocompletado' : 'Seleccione una categoría'}</option>
                    {data.costTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium">Tipo de Movimiento</label>
                <select value={derivedState.movementTypeId} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm disabled:bg-gray-200 dark:disabled:bg-gray-700" disabled>
                    <option value="">{formData.categoryId ? 'Autocompletado' : 'Seleccione una categoría'}</option>
                    {data.movementTypes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg">Cancelar</button>
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
                <tr className="border-b dark:border-gray-700">
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
                    <tr key={item.id} className="border-b dark:border-gray-700 even:bg-gray-50 dark:even:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700/50">
                        <td className="p-3">
                             <button onClick={() => onEdit(item)} className="text-left font-medium text-gray-800 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 hover:underline">
                                {item.name}
                            </button>
                        </td>
                        <td className="p-3 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{item.description || 'N/A'}</td>
                        <td className="p-3">{data.movementTypes.find(m => m.id === item.movementTypeId)?.name}</td>
                        <td className="p-3">{data.costTypes.find(c => c.id === item.costTypeId)?.name || 'N/A'}</td>
                        <td className="p-3">{data.categories.find(c => c.id === item.categoryId)?.name || 'N/A'}</td>
                        <td className="p-3 text-right">
                           <button onClick={() => onEdit(item)} className="text-primary-600 hover:text-primary-800 dark:hover:text-primary-400 p-1"><EditIcon className="w-5 h-5"/></button>
                           <button onClick={() => onDelete(item.id)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 ml-2"><DeleteIcon className="w-5 h-5"/></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export const Catalogs: React.FC = () => {
    const { appData: data, setData } = useAuth();
    const [openCatalog, setOpenCatalog] = useState<string | null>('Tipos de Movimiento');
    const [successInfo, setSuccessInfo] = useState<{ title: string; message: string } | null>(null);
    const [globalSearchTerm, setGlobalSearchTerm] = useState('');
    const [isDataMenuOpen, setIsDataMenuOpen] = useState(false);
    const dataMenuRef = useRef<HTMLDivElement>(null);
    const importFileInputRef = useRef<HTMLInputElement>(null);
    const [importPreview, setImportPreview] = useState<{
        isOpen: boolean;
        fileName: string;
        sheets: string[];
        onConfirm: () => void;
    } | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dataMenuRef.current && !dataMenuRef.current.contains(event.target as Node)) {
                setIsDataMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    if (!data) {
        return <div>Cargando...</div>;
    }
    
    const filteredData = useMemo(() => {
        if (!globalSearchTerm) return data;
        const term = globalSearchTerm.toLowerCase();
        
        const filterByName = <T extends CatalogItem,>(items: T[]) => items.filter(item => item.name.toLowerCase().includes(term));
        
        return {
            ...data,
            movementTypes: filterByName(data.movementTypes),
            costTypes: filterByName(data.costTypes),
            categories: filterByName(data.categories),
            concepts: filterByName(data.concepts),
        };
    }, [data, globalSearchTerm]);


    const handleUpdate = <T extends CatalogItem,>(key: CatalogKey, item: T) => {
        setData({
            ...data,
            [key]: (data[key] as T[]).map((i) => (i.id === item.id ? item : i)),
        });
    };

    const handleAdd = <T extends CatalogItem,>(key: CatalogKey, item: T) => {
        setData({
            ...data,
            [key]: [...(data[key] as T[]), item],
        });
    };

    const handleDelete = (key: CatalogKey, id: string) => {
        setData({
            ...data,
            [key]: data[key].filter((i: CatalogItem) => i.id !== id),
        });
    };
    
    const handleImport = (key: CatalogKey, importedData: any[]) => {
        // Simple validation, can be enhanced
        if (Array.isArray(importedData) && importedData.every(item => 'id' in item && 'name' in item)) {
            setData({
                ...data,
                [key]: importedData
            });
            setSuccessInfo({
                title: 'Importación Exitosa',
                message: `${importedData.length} registros importados a ${key} con éxito.`
            });
        } else {
            alert(`Error: El archivo XLSX no tiene el formato correcto para ${key}.`);
        }
    };

    const handleToggleCatalog = (title: string) => {
        setOpenCatalog(prev => (prev === title ? null : title));
    };

    const handleExportSuccess = (title: string) => {
        setSuccessInfo({
            title: 'Exportación Exitosa',
            message: `Los datos de "${title}" se han exportado a un archivo XLSX.`
        });
    };
    
    const executeImportAllXlsx = (workbook: any) => {
        try {
            const newCatalogData: Pick<AppData, 'movementTypes' | 'costTypes' | 'categories' | 'concepts'> = {
                movementTypes: [], costTypes: [], categories: [], concepts: []
            };

            const catalogDefs = [
                { sheetName: 'Tipos de Movimiento', key: 'movementTypes', headers: [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Nombre' }] },
                { sheetName: 'Tipos de Costo', key: 'costTypes', headers: [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Nombre' }, { key: 'movementTypeId', label: 'ID Tipo Movimiento' }] },
                { sheetName: 'Categorías', key: 'categories', headers: [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Nombre' }, { key: 'description', label: 'Descripcion' }, { key: 'movementTypeId', label: 'ID Tipo Movimiento' }, { key: 'costTypeId', label: 'ID Tipo Costo' }] },
                { sheetName: 'Conceptos', key: 'concepts', headers: [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Nombre' }, { key: 'description', label: 'Descripcion' }, { key: 'movementTypeId', label: 'ID Tipo Movimiento' }, { key: 'costTypeId', label: 'ID Tipo Costo' }, { key: 'categoryId', label: 'ID Categoria' }] }
            ];

            catalogDefs.forEach(def => {
                const sheet = workbook.Sheets[def.sheetName];
                if (sheet) {
                    const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
                    const mappedData = jsonData.map(row => {
                        const newRow: { [key: string]: any } = {};
                        def.headers.forEach(headerDef => {
                           newRow[headerDef.key] = row[headerDef.label] !== undefined ? String(row[headerDef.label]).trim() : '';
                        });
                        return newRow;
                    });
                    newCatalogData[def.key as keyof typeof newCatalogData] = mappedData as any;
                }
            });

            if (Object.values(newCatalogData).every(arr => arr.length === 0)) {
                throw new Error("El archivo XLSX no contiene datos válidos o las pestañas no tienen los nombres esperados (ej. 'Tipos de Movimiento', 'Categorías', etc.).");
            }

            setData({ ...data, ...newCatalogData });
            setSuccessInfo({ title: '¡Importación Completa!', message: 'Todos los catálogos han sido restaurados desde el archivo XLSX.' });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
            console.error("Error al importar el archivo XLSX:", error);
            alert(`Error al procesar el archivo: ${errorMessage}`);
        }
    };

    const handleImportFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
        if (fileExtension === 'xlsx') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const buffer = e.target?.result;
                const workbook = XLSX.read(buffer, { type: 'array' });
                
                setImportPreview({
                    isOpen: true,
                    fileName: file.name,
                    sheets: workbook.SheetNames,
                    onConfirm: () => {
                        executeImportAllXlsx(workbook);
                        setImportPreview(null);
                    }
                });
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert('Por favor, selecciona un archivo .xlsx válido.');
        }

        if (event.target) event.target.value = '';
    };
    
    const handleExportAllXlsx = () => {
        setIsDataMenuOpen(false);
        if (!data) return;

        const today = new Date().toISOString().slice(0, 10);
        const filename = `iwallet-catalogs-backup-${today}.xlsx`;

        const catalogs = [
            { name: 'Tipos de Movimiento', items: data.movementTypes, headers: [{ key: 'id' as keyof MovementType, label: 'ID' }, { key: 'name' as keyof MovementType, label: 'Nombre' }] },
            { name: 'Tipos de Costo', items: data.costTypes, headers: [{ key: 'id' as keyof CostType, label: 'ID' }, { key: 'name' as keyof CostType, label: 'Nombre' }, { key: 'movementTypeId' as keyof CostType, label: 'ID Tipo Movimiento' }] },
            { name: 'Categorías', items: data.categories, headers: [{ key: 'id' as keyof Category, label: 'ID' }, { key: 'name' as keyof Category, label: 'Nombre' }, { key: 'description' as keyof Category, label: 'Descripcion' }, { key: 'movementTypeId' as keyof Category, label: 'ID Tipo Movimiento' }, { key: 'costTypeId' as keyof Category, label: 'ID Tipo Costo' }] },
            { name: 'Conceptos', items: data.concepts, headers: [{ key: 'id' as keyof Concept, label: 'ID' }, { key: 'name' as keyof Concept, label: 'Nombre' }, { key: 'description' as keyof Concept, label: 'Descripcion' }, { key: 'movementTypeId' as keyof Concept, label: 'ID Tipo Movimiento' }, { key: 'costTypeId' as keyof Concept, label: 'ID Tipo Costo' }, { key: 'categoryId' as keyof Concept, label: 'ID Categoria' }] }
        ];

        try {
            const wb = XLSX.utils.book_new();
            catalogs.forEach(catalog => {
                const headerRow = catalog.headers.map(h => h.label);
                const dataRows = catalog.items.map(item => {
                    return catalog.headers.map(header => {
                        const value = item[header.key];
                        // Using any for formatter to avoid complex type casting, as it's not defined for these headers anyway.
                        const formattedValue = (header as any).formatter ? (header as any).formatter(value) : value;
                        return formattedValue;
                    });
                });
                const sheetData = [headerRow, ...dataRows];
                const ws = XLSX.utils.aoa_to_sheet(sheetData);
                XLSX.utils.book_append_sheet(wb, ws, catalog.name);
            });
            XLSX.writeFile(wb, filename);
            setSuccessInfo({ title: 'Exportación Exitosa', message: `Los catálogos se han guardado en ${filename}.` });
        } catch (error) {
            console.error("Error al exportar a XLSX:", error);
            alert("Ocurrió un error al exportar el archivo XLSX.");
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Catálogos</h1>
                    <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                         <input
                            type="text"
                            placeholder="Buscar en todos los catálogos..."
                            value={globalSearchTerm}
                            onChange={(e) => setGlobalSearchTerm(e.target.value)}
                            className="w-full sm:w-64 px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm"
                        />
                         <div ref={dataMenuRef} className="relative">
                            <button
                                onClick={() => setIsDataMenuOpen(v => !v)}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg transition"
                            >
                                <span>Datos</span>
                                <ArrowsUpDownIcon className="w-5 h-5" />
                            </button>
                            {isDataMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                    <div className="px-1 py-1">
                                        <button onClick={handleExportAllXlsx} className="w-full text-left rounded-md px-2 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Exportar Todo (.xlsx)</button>
                                    </div>
                                    <div className="px-1 py-1">
                                        <button onClick={() => importFileInputRef.current?.click()} className="w-full text-left rounded-md px-2 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Importar Catálogos</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <input type="file" ref={importFileInputRef} onChange={handleImportFileSelect} className="hidden" accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />

            <div className="space-y-6">
                <CollapsibleCatalog title="Tipos de Movimiento" isOpen={openCatalog === 'Tipos de Movimiento'} onToggle={() => handleToggleCatalog('Tipos de Movimiento')}>
                    <CatalogManager
                        title="Tipos de Movimiento"
                        singularTitle="Tipo de Movimiento"
                        items={filteredData.movementTypes}
                        onAdd={(item) => handleAdd('movementTypes', item)}
                        onUpdate={(item) => handleUpdate('movementTypes', item)}
                        onDelete={(id) => handleDelete('movementTypes', id)}
                        renderForm={(item, onSave, onCancel) => <MovementTypeForm item={item as Partial<MovementType>} onSave={onSave} onCancel={onCancel} />}
                        renderTable={(items, onEdit, onDelete) => <GenericTable items={items} onEdit={onEdit} onDelete={onDelete} />}
                        csvHeaders={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Nombre' }]}
                        onImport={(d) => handleImport('movementTypes', d)}
                        onExportSuccess={() => handleExportSuccess('Tipos de Movimiento')}
                    />
                </CollapsibleCatalog>

                <CollapsibleCatalog title="Tipos de Costo" isOpen={openCatalog === 'Tipos de Costo'} onToggle={() => handleToggleCatalog('Tipos de Costo')}>
                     <CatalogManager
                        title="Tipos de Costo"
                        singularTitle="Tipo de Costo"
                        items={filteredData.costTypes}
                        onAdd={(item) => handleAdd('costTypes', item)}
                        onUpdate={(item) => handleUpdate('costTypes', item)}
                        onDelete={(id) => handleDelete('costTypes', id)}
                        renderForm={(item, onSave, onCancel) => <CostTypeForm item={item as Partial<CostType>} movementTypes={data.movementTypes} onSave={onSave} onCancel={onCancel} />}
                        renderTable={(items, onEdit, onDelete) => <CostTypeTable items={items as CostType[]} data={data} onEdit={onEdit as (item: CostType) => void} onDelete={onDelete} />}
                        csvHeaders={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Nombre' }, { key: 'movementTypeId', label: 'ID Tipo Movimiento' }]}
                        onImport={(d) => handleImport('costTypes', d)}
                        onExportSuccess={() => handleExportSuccess('Tipos de Costo')}
                    />
                </CollapsibleCatalog>

                <CollapsibleCatalog title="Categorías" isOpen={openCatalog === 'Categorías'} onToggle={() => handleToggleCatalog('Categorías')}>
                    <CatalogManager
                        title="Categorías"
                        singularTitle="Categoría"
                        items={filteredData.categories}
                        onAdd={(item) => handleAdd('categories', item)}
                        onUpdate={(item) => handleUpdate('categories', item)}
                        onDelete={(id) => handleDelete('categories', id)}
                        renderForm={(item, onSave, onCancel) => <CategoryForm item={item as Partial<Category>} data={data} onSave={onSave} onCancel={onCancel} />}
                        renderTable={(items, onEdit, onDelete) => <CategoryTable items={items as Category[]} data={data} onEdit={onEdit as (item: Category) => void} onDelete={onDelete} />}
                        csvHeaders={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Nombre' }, { key: 'description', label: 'Descripción' }, { key: 'movementTypeId', label: 'ID Tipo Movimiento' }, { key: 'costTypeId', label: 'ID Tipo Costo' }]}
                        onImport={(d) => handleImport('categories', d)}
                        onExportSuccess={() => handleExportSuccess('Categorías')}
                    />
                </CollapsibleCatalog>

                <CollapsibleCatalog title="Conceptos" isOpen={openCatalog === 'Conceptos'} onToggle={() => handleToggleCatalog('Conceptos')}>
                    <CatalogManager
                        title="Conceptos"
                        singularTitle="Concepto"
                        items={filteredData.concepts}
                        onAdd={(item) => handleAdd('concepts', item)}
                        onUpdate={(item) => handleUpdate('concepts', item)}
                        onDelete={(id) => handleDelete('concepts', id)}
                        renderForm={(item, onSave, onCancel) => <ConceptForm item={item as Partial<Concept>} data={data} onSave={onSave} onCancel={onCancel} />}
                        renderTable={(items, onEdit, onDelete) => <ConceptTable items={items as Concept[]} data={data} onEdit={onEdit as (item: Concept) => void} onDelete={onDelete} />}
                        csvHeaders={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Nombre' }, { key: 'description', label: 'Descripción' }, { key: 'movementTypeId', label: 'ID Tipo Movimiento' }, { key: 'costTypeId', label: 'ID Tipo Costo' }, { key: 'categoryId', label: 'ID Categoría' }]}
                        onImport={(d) => handleImport('concepts', d)}
                        onExportSuccess={() => handleExportSuccess('Conceptos')}
                    />
                </CollapsibleCatalog>
            </div>
             <SuccessToast 
                isOpen={!!successInfo}
                onClose={() => setSuccessInfo(null)}
                title={successInfo?.title || ''}
                message={successInfo?.message || ''}
            />
            <ImportPreviewModal
                isOpen={!!importPreview}
                onClose={() => setImportPreview(null)}
                onConfirm={() => importPreview?.onConfirm()}
                fileName={importPreview?.fileName || ''}
                sheets={importPreview?.sheets || []}
            />
        </div>
    );
};
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppData, PlannedExpense, Frequency, Concept, Priority, Payment, MovementType, MovementTypeName } from '../types';
import { CloseIcon, PlusIcon, EditIcon, DeleteIcon, ChevronUpIcon, ChevronDownIcon, WarningIcon, CheckCircleIcon } from './Icons';
import { generatePeriods, getNextPeriodToPay, getStatusInfo, generateSequentialId } from './utils';
import { IconPicker } from './IconPicker';
import { IconDisplay } from './IconDisplay';
import { useAuth } from '../contexts/AuthContext';
import { CsvTools, CsvHeader } from './CsvTools';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
const months = [
    { value: '01', label: 'Enero' }, { value: '02', label: 'Febrero' }, { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' }, { value: '05', label: 'Mayo' }, { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' }, { value: '08', label: 'Agosto' }, { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' }, { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' }
];

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
        setAmount(remainingAmount > 0 ? remainingAmount : 0);
    }, [remainingAmount]);

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


// Planned Expense Form
const PlannedExpenseForm: React.FC<{
    item: Partial<PlannedExpense> | null;
    concepts: Concept[];
    movementTypes: MovementType[];
    onSave: (item: PlannedExpense) => void;
    onCancel: () => void;
    defaultReminderDays: number;
    defaultReminderTime: string;
    allPlannedExpenses: PlannedExpense[];
}> = ({ item, concepts, movementTypes, onSave, onCancel, defaultReminderDays, defaultReminderTime, allPlannedExpenses }) => {
    const [formState, setFormState] = useState({
        conceptId: item?.conceptId || '',
        amountPerPeriod: item?.amountPerPeriod || 0,
        cutOffDay: item?.cutOffDay || 1,
        dueDay: item?.dueDay || 15,
        startPeriodMonth: item?.startPeriod ? item.startPeriod.split('-')[1] : (new Date().getMonth() + 1).toString().padStart(2, '0'),
        startPeriodYear: item?.startPeriod ? item.startPeriod.split('-')[0] : new Date().getFullYear().toString(),
        frequency: item?.frequency || Frequency.MENSUAL,
        periods: item?.periods || 1,
        reminderDays: item?.reminderDays ?? defaultReminderDays,
        reminderTime: item?.reminderTime ?? defaultReminderTime,
        icon: item?.icon || 'tag',
        iconColor: item?.iconColor || 'text-gray-800 dark:text-gray-200',
    });
    const [payments, setPayments] = useState<Payment[]>(item?.payments || []);
    const [isIconPickerOpen, setIconPickerOpen] = useState(false);
    const [paymentModalState, setPaymentModalState] = useState({ isOpen: false, period: '', remaining: 0 });
    const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
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

    const movGastoId = useMemo(() => movementTypes.find(m => m.name === MovementTypeName.GASTO)?.id, [movementTypes]);
    const expenseConcepts = useMemo(() => concepts.filter(c => c.movementTypeId === movGastoId), [concepts, movGastoId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['amountPerPeriod', 'cutOffDay', 'dueDay', 'periods', 'reminderDays'].includes(name);
        setFormState(prev => ({ ...prev, [name]: isNumeric ? parseFloat(value) || 0 : value }));
         if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleIconSelect = (details: { icon: string; color: string; }) => {
        setFormState(prev => ({ ...prev, icon: details.icon, iconColor: details.color }));
    };

    const allGlobalPayments = useMemo(() => allPlannedExpenses.flatMap(pe => pe.payments), [allPlannedExpenses]);

    const handleAddPayment = (amount: number, date: string) => {
        if (!paymentModalState.period) return;
        const allCurrentPayments = [...allGlobalPayments, ...payments];
        const newPayment: Payment = {
            id: generateSequentialId('PA', allCurrentPayments),
            amount,
            date,
            period: paymentModalState.period,
        };
        setPayments(prev => [...prev, newPayment]);
        setPaymentModalState({ isOpen: false, period: '', remaining: 0 });
    };
    
    const handleConfirmDeletePayment = () => {
        if (!paymentToDelete) return;
        setPayments(prev => prev.filter(p => p.id !== paymentToDelete.id));
        setPaymentToDelete(null);
    };

    const endPeriod = useMemo(() => {
        const { startPeriodYear, startPeriodMonth, periods, frequency } = formState;
        if (!startPeriodYear || !startPeriodMonth || !periods || periods <= 0) return '';
        
        const monthIncrement = frequency === Frequency.BIMESTRAL ? 2 : 1;
        const startDate = new Date(Number(startPeriodYear), Number(startPeriodMonth) - 1, 1);
        const totalMonthIncrement = (periods - 1) * monthIncrement;
        const endDate = new Date(startDate.setMonth(startDate.getMonth() + totalMonthIncrement));
        
        const endYear = endDate.getFullYear();
        const endMonth = (endDate.getMonth() + 1).toString().padStart(2, '0');
        const endMonthLabel = months.find(m => m.value === endMonth)?.label;

        return `${endMonthLabel} ${endYear}`;
    }, [formState.startPeriodYear, formState.startPeriodMonth, formState.periods, formState.frequency]);
    
    const paymentSchedule = useMemo(() => {
        return generatePeriods({
            ...formState,
            startPeriod: `${formState.startPeriodYear}-${formState.startPeriodMonth}`,
        } as PlannedExpense)
    }, [formState]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formState.conceptId) newErrors.conceptId = 'Debe seleccionar un concepto.';
        if (formState.amountPerPeriod <= 0) newErrors.amountPerPeriod = 'El monto debe ser mayor a 0.';
        if (formState.cutOffDay < 1 || formState.cutOffDay > 31) newErrors.cutOffDay = 'Día inválido (1-31).';
        if (formState.dueDay < 1 || formState.dueDay > 31) newErrors.dueDay = 'Día inválido (1-31).';
        if (formState.periods < 1) newErrors.periods = 'Debe haber al menos 1 periodo.';
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
            startPeriod: `${formState.startPeriodYear}-${formState.startPeriodMonth}`,
            payments,
        } as PlannedExpense);
    };
    
    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Concepto</label>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="relative" ref={iconPickerContainerRef}>
                                <button type="button" onClick={() => setIconPickerOpen(prev => !prev)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900">
                                    <IconDisplay icon={formState.icon} iconColor={formState.iconColor} className="w-6 h-6" />
                                </button>
                                {isIconPickerOpen && <IconPicker onSelect={handleIconSelect} onClose={() => setIconPickerOpen(false)} currentColor={formState.iconColor} />}
                            </div>
                            <select name="conceptId" value={formState.conceptId} onChange={handleChange} className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm">
                                <option value="">Seleccione un concepto</option>
                                {expenseConcepts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        {errors.conceptId && <p className="text-red-500 text-xs mt-1">{errors.conceptId}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Monto por Periodo</label>
                        <input type="number" name="amountPerPeriod" value={formState.amountPerPeriod || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" />
                        {errors.amountPerPeriod && <p className="text-red-500 text-xs mt-1">{errors.amountPerPeriod}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Día de Corte</label>
                        <input type="number" name="cutOffDay" min="1" max="31" value={formState.cutOffDay} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" />
                         {errors.cutOffDay && <p className="text-red-500 text-xs mt-1">{errors.cutOffDay}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Día Límite de Pago</label>
                        <input type="number" name="dueDay" min="1" max="31" value={formState.dueDay} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" />
                        {errors.dueDay && <p className="text-red-500 text-xs mt-1">{errors.dueDay}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Periodo Inicial</label>
                        <div className="flex gap-2 mt-1">
                            <select name="startPeriodMonth" value={formState.startPeriodMonth} onChange={handleChange} className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm">
                                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                            <select name="startPeriodYear" value={formState.startPeriodYear} onChange={handleChange} className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm">
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Número de Periodos</label>
                        <input type="number" name="periods" value={formState.periods} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" min="1"/>
                         {errors.periods && <p className="text-red-500 text-xs mt-1">{errors.periods}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Frecuencia</label>
                        <select name="frequency" value={formState.frequency} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm">
                            <option value={Frequency.MENSUAL}>Mensual</option>
                            <option value={Frequency.BIMESTRAL}>Bimestral</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Periodo Final (calculado)</label>
                        <input type="text" value={endPeriod} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900/50 shadow-sm" readOnly />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Recordar (días antes)</label>
                        <select name="reminderDays" value={formState.reminderDays} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm">
                            <option value="-1">No recordar</option>
                            <option value="0">El día del vencimiento</option>
                            <option value="1">1 día antes</option>
                            <option value="3">3 días antes</option>
                            <option value="5">5 días antes</option>
                            <option value="7">1 semana antes</option>
                        </select>
                    </div>
                    {formState.reminderDays > -1 && (
                        <div>
                            <label className="block text-sm font-medium">Hora del Recordatorio</label>
                            <input type="time" name="reminderTime" value={formState.reminderTime} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm"/>
                        </div>
                    )}
                </div>

                {paymentSchedule.length > 0 && (
                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="text-md font-semibold mb-2">Plan de Pagos</h4>
                        <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                            {paymentSchedule.map((period, index) => {
                                const paymentsInPeriod = payments.filter(p => p.period === period);
                                const paidInPeriod = paymentsInPeriod.reduce((sum, p) => sum + p.amount, 0);
                                const remainingInPeriod = formState.amountPerPeriod - paidInPeriod;
                                const isPeriodPaid = remainingInPeriod <= 0;
                                const [year, monthVal] = period.split('-').map(Number);
                                const periodLabel = `${months[monthVal - 1].label} ${year}`;
                                
                                return (
                                    <div key={period}>
                                        <div className={`text-sm p-2 rounded-md flex justify-between items-center ${isPeriodPaid ? 'bg-green-100 dark:bg-green-900/50' : 'bg-gray-100 dark:bg-gray-900/50'}`}>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{index + 1}. {periodLabel}</span>
                                            <div className='flex items-center gap-2'>
                                                <div className='text-right'>
                                                    <span className='font-semibold'>{formatCurrency(paidInPeriod)}</span>
                                                    <span className='text-xs text-gray-500'> / {formatCurrency(formState.amountPerPeriod)}</span>
                                                </div>
                                                {!isPeriodPaid ? (
                                                     <button type="button" onClick={() => setPaymentModalState({isOpen: true, period, remaining: remainingInPeriod})} className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold py-1 px-3 rounded-md">
                                                        Abonar
                                                    </button>
                                                ) : (
                                                    <span className="text-green-700 dark:text-green-300 font-semibold text-xs py-1 px-3">Completo</span>
                                                )}
                                                 {paymentsInPeriod.length > 0 && (
                                                    <button type="button" onClick={() => setExpandedPeriod(expandedPeriod === period ? null : period)} className="text-gray-500 p-1">
                                                        {expandedPeriod === period ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {expandedPeriod === period && (
                                            <div className="pl-6 pr-2 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-b-md">
                                                <h5 className="text-xs font-bold mb-1">Historial de Abonos:</h5>
                                                 {paymentsInPeriod.length > 0 ? (
                                                    <ul className="space-y-1">
                                                        {paymentsInPeriod.map(p => (
                                                            <li key={p.id} className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400 group">
                                                                <div>
                                                                    <span>{new Date(p.date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}: </span>
                                                                    <span className="font-semibold">{formatCurrency(p.amount)}</span>
                                                                </div>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => setPaymentToDelete(p)}
                                                                    className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 -m-1"
                                                                    aria-label="Eliminar abono"
                                                                >
                                                                    <DeleteIcon className="w-4 h-4"/>
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-xs text-gray-500">No hay abonos en este periodo.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Guardar</button>
                </div>
            </form>
            <PaymentModal
                isOpen={paymentModalState.isOpen}
                onClose={() => setPaymentModalState({ isOpen: false, period: '', remaining: 0 })}
                onSave={handleAddPayment}
                periodLabel={months[Number(paymentModalState.period.split('-')[1] || 1) - 1]?.label}
                remainingAmount={paymentModalState.remaining}
            />
             <ConfirmationModal
                isOpen={!!paymentToDelete}
                onClose={() => setPaymentToDelete(null)}
                onConfirm={handleConfirmDeletePayment}
                title="Confirmar Eliminación de Abono"
                message={`¿Estás seguro de que deseas eliminar el abono de ${formatCurrency(paymentToDelete?.amount || 0)} del ${paymentToDelete ? new Date(paymentToDelete.date).toLocaleDateString('es-MX') : ''}? Esta acción es irreversible.`}
            />
        </>
    );
};

const PlannedExpenseCard: React.FC<{
    expense: PlannedExpense;
    concept: Concept | undefined;
    onEdit: (expense: PlannedExpense) => void;
    onDelete: (id: string) => void;
}> = ({ expense, concept, onEdit, onDelete }) => {
    const totalDebt = expense.amountPerPeriod * expense.periods;
    const paidAmount = expense.payments.reduce((sum, p) => sum + p.amount, 0);
    const progress = totalDebt > 0 ? (paidAmount / totalDebt) * 100 : 100;

    const nextPeriodToPay = getNextPeriodToPay(expense);
    const statusInfo = getStatusInfo(expense, nextPeriodToPay);

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md group relative">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                        <IconDisplay icon={expense.icon} iconColor={expense.iconColor} className="w-6 h-6" />
                        <button onClick={() => onEdit(expense)} className="text-left hover:text-primary-600 dark:hover:text-primary-400 hover:underline">
                            {concept?.name || 'Gasto Desconocido'}
                        </button>
                         {(statusInfo.priority === Priority.ALTA || statusInfo.priority === Priority.MEDIA) && (
                            <WarningIcon 
                                title={statusInfo.text} 
                                className={`w-5 h-5 ${statusInfo.priority === Priority.ALTA ? 'text-red-500' : 'text-yellow-500'}`} 
                            />
                        )}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{expense.periods} {expense.frequency === Frequency.BIMESTRAL ? 'pagos bimestrales' : 'pagos mensuales'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="font-bold text-lg">{formatCurrency(expense.amountPerPeriod)}</p>
                </div>
            </div>
            <div className="mt-2">
                <div className="flex justify-between mb-1 text-sm">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(paidAmount)}</span>
                    <span className="text-gray-500 dark:text-gray-400">{formatCurrency(totalDebt)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
             <div className="absolute top-2 right-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(expense)} className="text-primary-600 p-1"><EditIcon className="w-5 h-5"/></button>
                <button onClick={() => onDelete(expense.id)} className="text-red-500 p-1 ml-1"><DeleteIcon className="w-5 h-5"/></button>
            </div>
        </div>
    );
};

export const PlannedExpenses: React.FC = () => {
    const { appData: data, setData } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PlannedExpense | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPaid, setShowPaid] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [successInfo, setSuccessInfo] = useState<{ title: string; message: string } | null>(null);
    
    const location = useLocation();
    const navigate = useNavigate();

    if (!data) {
        return <div>Cargando...</div>;
    }

    const { pendingExpenses, paidExpenses } = useMemo(() => {
        const pending: PlannedExpense[] = [];
        const paid: PlannedExpense[] = [];
        
        const filtered = data.plannedExpenses.filter(pe => {
            const conceptName = data.concepts.find(c => c.id === pe.conceptId)?.name || '';
            return conceptName.toLowerCase().includes(searchTerm.toLowerCase());
        });

        filtered.forEach(pe => {
            const totalDebt = pe.amountPerPeriod * pe.periods;
            const paidAmount = pe.payments.reduce((sum, p) => sum + p.amount, 0);
            if (totalDebt - paidAmount > 0.01) { // Use a small tolerance for floating point
                pending.push(pe);
            } else {
                paid.push(pe);
            }
        });
        return { pendingExpenses: pending, paidExpenses: paid };
    }, [data.plannedExpenses, data.concepts, searchTerm]);


    const handleOpenModal = useCallback((item: PlannedExpense | null = null) => {
        setEditingItem(item);
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = () => {
        setEditingItem(null);
        setIsModalOpen(false);
    };
    
    useEffect(() => {
        const expenseIdToOpen = location.state?.openExpenseId;
        if (expenseIdToOpen && data.plannedExpenses) {
            const expense = data.plannedExpenses.find(e => e.id === expenseIdToOpen);
            if (expense) {
                handleOpenModal(expense);
                navigate(location.pathname, { state: {}, replace: true });
            }
        }
    }, [location.state, data.plannedExpenses, handleOpenModal, navigate]);

    const handleSave = (item: PlannedExpense) => {
        let newPlannedExpenses;
        if (item.id) {
            newPlannedExpenses = data.plannedExpenses.map(pe => pe.id === item.id ? item : pe);
        } else {
            newPlannedExpenses = [...data.plannedExpenses, { ...item, id: generateSequentialId('GP', data.plannedExpenses) }];
        }
        setData({ ...data, plannedExpenses: newPlannedExpenses });
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };
    
    const confirmDelete = () => {
        if (!deleteId) return;
        setData({ ...data, plannedExpenses: data.plannedExpenses.filter(pe => pe.id !== deleteId) });
        setDeleteId(null);
    };
    
    const handleImport = (importedData: any[]) => {
        try {
            if (Array.isArray(importedData)) {
                const typedData = importedData.map(d => ({
                    ...d,
                    amountPerPeriod: Number(d.amountPerPeriod),
                    cutOffDay: Number(d.cutOffDay),
                    dueDay: Number(d.dueDay),
                    periods: Number(d.periods),
                    reminderDays: Number(d.reminderDays),
                    payments: JSON.parse(d.payments || '[]')
                })) as PlannedExpense[];
                setData({ ...data, plannedExpenses: typedData });
                setSuccessInfo({
                    title: 'Importación Exitosa',
                    message: `${typedData.length} gastos planificados importados con éxito.`
                });
            } else {
                 throw new Error("El archivo no es válido.");
            }
        } catch(error) {
            console.error("Error al importar gastos planificados", error);
            alert('Error: El archivo CSV no tiene el formato correcto. Asegúrese de que la columna "payments" sea un JSON válido.');
        }
    };
    
    const headers: CsvHeader<PlannedExpense>[] = [
        { key: 'id', label: 'ID' },
        { key: 'conceptId', label: 'ID Concepto' },
        { key: 'icon', label: 'Icono' },
        { key: 'iconColor', label: 'Icono Color' },
        { key: 'amountPerPeriod', label: 'Monto por Periodo' },
        { key: 'cutOffDay', label: 'Día de Corte' },
        { key: 'dueDay', label: 'Día de Vencimiento' },
        { key: 'startPeriod', label: 'Periodo Inicial (YYYY-MM)' },
        { key: 'frequency', label: 'Frecuencia' },
        { key: 'periods', label: 'Periodos' },
        { key: 'reminderDays', label: 'Días de Recordatorio' },
        { key: 'reminderTime', label: 'Hora de Recordatorio' },
        { key: 'payments', label: 'Pagos (JSON)', formatter: (payments: Payment[]) => JSON.stringify(payments) },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gastos Planificados</h1>
                <div className="w-full md:w-auto flex items-center gap-4 flex-wrap">
                    <input 
                        type="text"
                        placeholder="Buscar por concepto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-auto flex-grow px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm"
                    />
                    <CsvTools
                        entityName="Gastos Planificados"
                        items={data.plannedExpenses}
                        headers={headers}
                        onImport={handleImport}
                        onExportSuccess={() => setSuccessInfo({ title: 'Exportación Exitosa', message: 'Tus gastos planificados han sido exportados a un archivo CSV.' })}
                    />
                    <button onClick={() => handleOpenModal()} className="flex-shrink-0 flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">
                        <PlusIcon className="w-5 h-5" />
                        Añadir Gasto
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingExpenses.map(expense => (
                    <PlannedExpenseCard
                        key={expense.id}
                        expense={expense}
                        concept={data.concepts.find(c => c.id === expense.conceptId)}
                        onEdit={handleOpenModal}
                        onDelete={handleDelete}
                    />
                ))}
            </div>

            {paidExpenses.length > 0 && (
                <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <button onClick={() => setShowPaid(!showPaid)} className="flex items-center gap-2 text-lg font-bold text-gray-600 dark:text-gray-300">
                        {showPaid ? <ChevronUpIcon className="w-5 h-5"/> : <ChevronDownIcon className="w-5 h-5"/>}
                        Gastos Completados ({paidExpenses.length})
                    </button>
                    {showPaid && (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                            {paidExpenses.map(expense => (
                                <PlannedExpenseCard
                                    key={expense.id}
                                    expense={expense}
                                    concept={data.concepts.find(c => c.id === expense.conceptId)}
                                    onEdit={handleOpenModal}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? 'Editar Gasto Planificado' : 'Añadir Gasto Planificado'}>
                <PlannedExpenseForm
                    item={editingItem}
                    concepts={data.concepts}
                    movementTypes={data.movementTypes}
                    onSave={handleSave}
                    onCancel={handleCloseModal}
                    defaultReminderDays={data.notifications.defaultReminderDays}
                    defaultReminderTime={data.notifications.defaultReminderTime}
                    allPlannedExpenses={data.plannedExpenses}
                />
            </Modal>
             <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que quieres eliminar este gasto planificado? Todos sus pagos asociados también serán eliminados."
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
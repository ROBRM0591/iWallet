import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { Concept, MovementTypeName } from '../types';
import { PlusIcon, DeleteIcon } from '../components/Icons';

interface Calculator {
    id: string;
    conceptId: string;
    debtAmount: number;
    interestRate: number;
    monthlyPayment: number;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-2xl border border-white/30 dark:border-slate-700/80 shadow-2xl text-gray-900 dark:text-white ${className}`}>
        {children}
    </div>
);

const InputField: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    unit: string;
    isCurrency?: boolean;
}> = ({ label, value, onChange, unit, isCurrency = false }) => (
    <div className="relative border border-gray-300 dark:border-white/20 rounded-md px-3 py-2 shadow-sm focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500">
        <label className="absolute -top-2.5 left-2 -mt-px inline-block px-1 bg-white dark:bg-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
        <div className="flex items-center">
            {isCurrency && <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>}
            <input
                type="number"
                value={value || ''}
                onChange={(e) => onChange(Number(e.target.value))}
                className="block w-full border-0 p-0 text-gray-900 dark:text-white placeholder-gray-400 bg-transparent focus:ring-0 sm:text-sm"
            />
            {!isCurrency && <span className="text-gray-500 dark:text-gray-400 sm:text-sm">{unit}</span>}
        </div>
    </div>
);

const calculatePayoff = (principal: number, annualRate: number, payment: number) => {
    const rate = annualRate / 100 / 12;
    if (principal <= 0 || rate < 0 || payment <= 0) {
        return { months: 0, totalInterest: 0, totalPaid: 0, error: "Valores inválidos." };
    }
    if (payment <= principal * rate) {
        return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity, error: "Pago muy bajo." };
    }

    let balance = principal;
    let months = 0;
    let totalInterest = 0;
    while (balance > 0) {
        const interest = balance * rate;
        totalInterest += interest;
        const principalPaid = payment - interest;
        balance -= principalPaid;
        months++;
        if (months > 1200) { // Safety break > 100 years
             return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity, error: "Excede 100 años." };
        }
    }
    return { months, totalInterest, totalPaid: principal + totalInterest, error: null };
};


interface CalculatorCardProps {
    calculator: Calculator;
    concepts: Concept[];
    onUpdate: (id: string, field: keyof Calculator, value: string | number) => void;
    onDelete: (id: string) => void;
}

const CalculatorCard: React.FC<CalculatorCardProps> = ({ calculator, concepts, onUpdate, onDelete }) => {
    return (
        <GlassCard className="p-4 sm:p-6 relative">
            <button onClick={() => onDelete(calculator.id)} className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400">
                <DeleteIcon className="w-5 h-5" />
            </button>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Concepto de Deuda</label>
                    <select
                        value={calculator.conceptId}
                        onChange={(e) => onUpdate(calculator.id, 'conceptId', e.target.value)}
                        className="w-full rounded-md shadow-sm"
                    >
                        <option value="">Seleccione un concepto...</option>
                        {concepts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <InputField label="Monto de la Deuda" value={calculator.debtAmount} onChange={(val) => onUpdate(calculator.id, 'debtAmount', val)} unit="" isCurrency />
                <InputField label="Tasa de Interés Anual" value={calculator.interestRate} onChange={(val) => onUpdate(calculator.id, 'interestRate', val)} unit="%" />
                <InputField label="Pago Mensual" value={calculator.monthlyPayment} onChange={(val) => onUpdate(calculator.id, 'monthlyPayment', val)} unit="" isCurrency />
            </div>
        </GlassCard>
    )
};


export const DebtCalculator: React.FC = () => {
    const { appData } = useAuth();
    const [calculators, setCalculators] = useState<Calculator[]>([]);

    const expenseConcepts = useMemo(() => {
        if (!appData) return [];
        const movGastoId = appData.movementTypes.find(m => m.name === MovementTypeName.GASTO)?.id;
        return appData.concepts.filter(c => c.movementTypeId === movGastoId);
    }, [appData]);

    const summary = useMemo(() => {
        const totalDebt = calculators.reduce((sum, calc) => sum + Number(calc.debtAmount), 0);
        const totalMonthlyPayment = calculators.reduce((sum, calc) => sum + Number(calc.monthlyPayment), 0);
        
        if (totalDebt === 0) {
            return { totalDebt: 0, totalMonthlyPayment: 0, months: 0, totalInterest: 0, totalPaid: 0, error: null };
        }
        
        const weightedInterestRateSum = calculators.reduce((sum, calc) => sum + (Number(calc.debtAmount) * (Number(calc.interestRate) / 100)), 0);
        const weightedAverageAnnualRate = (weightedInterestRateSum / totalDebt) * 100;

        return {
            totalDebt,
            totalMonthlyPayment,
            ...calculatePayoff(totalDebt, weightedAverageAnnualRate, totalMonthlyPayment)
        };
    }, [calculators]);

    const handleAddCalculator = () => {
        setCalculators(prev => [
            ...prev,
            { id: uuidv4(), conceptId: '', debtAmount: 10000, interestRate: 25, monthlyPayment: 500 }
        ]);
    };

    const handleUpdate = (id: string, field: keyof Calculator, value: string | number) => {
        setCalculators(prev => prev.map(calc => calc.id === id ? { ...calc, [field]: value } : calc));
    };

    const handleDelete = (id: string) => {
        setCalculators(prev => prev.filter(calc => calc.id !== id));
    };
    
    const years = Math.floor(summary.months / 12);
    const remainingMonths = summary.months % 12;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Calculadora de Deudas</h1>
                <button onClick={handleAddCalculator} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition">
                    <PlusIcon className="w-5 h-5" />
                    Agregar Deuda
                </button>
            </div>
            
            <GlassCard className="bg-gradient-to-br from-primary-100 to-primary-200 dark:from-slate-900/70 dark:to-slate-800/70 p-4 sm:p-6 flex flex-col justify-center items-center mb-8">
                <h2 className="text-2xl font-bold mb-4">Resumen Total</h2>
                 {summary.error ? (
                    <p className="text-center text-yellow-500 dark:text-yellow-300">{summary.error}</p>
                ) : calculators.length === 0 ? (
                    <p className="text-center text-primary-700 dark:text-primary-200">Agrega una deuda para ver el resumen.</p>
                ) : (
                    <div className="w-full">
                        <div className="text-center mb-4">
                            <p className="text-lg text-primary-700 dark:text-primary-200">Tiempo para liquidar todas las deudas</p>
                            <p className="text-3xl sm:text-4xl font-bold">
                                {isFinite(summary.months) ? `${years} años y ${remainingMonths} meses` : 'Interminable'}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-primary-500/30">
                            <div className="text-center">
                                <p className="text-md text-primary-700 dark:text-primary-200">Deuda Total</p>
                                <p className="text-2xl font-semibold">{formatCurrency(summary.totalDebt)}</p>
                            </div>
                             <div className="text-center">
                                <p className="text-md text-primary-700 dark:text-primary-200">Pago Mensual Total</p>
                                <p className="text-2xl font-semibold">{formatCurrency(summary.totalMonthlyPayment)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-md text-primary-700 dark:text-primary-200">Interés Total</p>
                                <p className="text-2xl font-semibold">{isFinite(summary.totalInterest) ? formatCurrency(summary.totalInterest) : '---'}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-md text-primary-700 dark:text-primary-200">Pago Total</p>
                                <p className="text-2xl font-semibold">{isFinite(summary.totalPaid) ? formatCurrency(summary.totalPaid) : '---'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </GlassCard>

            {calculators.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {calculators.map((calc, index) => (
                        <CalculatorCard 
                            key={calc.id}
                            calculator={calc}
                            concepts={expenseConcepts}
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No has agregado ninguna deuda para calcular.</p>
                </div>
            )}
        </div>
    );
};
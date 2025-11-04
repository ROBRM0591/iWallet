import { AppData, Frequency, MovementTypeName } from './types';

const createPalette = (name: string, hex: string, shades: Record<string, string>) => ({ name, hex, shades });

export const COLOR_PALETTES = [
  createPalette('Blue', '#3b82f6', { '50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd', '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8', '800': '#1e40af', '900': '#1e3a8a', '950': '#172554' }),
  createPalette('Indigo', '#6366f1', { '50': '#eef2ff', '100': '#e0e7ff', '200': '#c7d2fe', '300': '#a5b4fc', '400': '#818cf8', '500': '#6366f1', '600': '#4f46e5', '700': '#4338ca', '800': '#3730a3', '900': '#312e81', '950': '#1e1b4b' }),
  createPalette('Purple', '#8b5cf6', { '50': '#f5f3ff', '100': '#ede9fe', '200': '#ddd6fe', '300': '#c4b5fd', '400': '#a78bfa', '500': '#8b5cf6', '600': '#7c3aed', '700': '#6d28d9', '800': '#5b21b6', '900': '#4c1d95', '950': '#2e1065' }),
  createPalette('Pink', '#ec4899', { '50': '#fdf2f8', '100': '#fce7f3', '200': '#fbcfe8', '300': '#f9a8d4', '400': '#f472b6', '500': '#ec4899', '600': '#db2777', '700': '#be185d', '800': '#9d174d', '900': '#831843', '950': '#500724' }),
  createPalette('Green', '#22c55e', { '50': '#f0fdf4', '100': '#dcfce7', '200': '#bbf7d0', '300': '#86efac', '400': '#4ade80', '500': '#22c55e', '600': '#16a34a', '700': '#15803d', '800': '#166534', '900': '#14532d', '950': '#052e16' }),
  createPalette('Teal', '#14b8a6', { '50': '#f0fdfa', '100': '#ccfbf1', '200': '#99f6e4', '300': '#5eead4', '400': '#2dd4bf', '500': '#14b8a6', '600': '#0d9488', '700': '#0f766e', '800': '#115e59', '900': '#134e4a', '950': '#042f2e' }),
  createPalette('Orange', '#f97316', { '50': '#fff7ed', '100': '#ffedd5', '200': '#fed7aa', '300': '#fdba74', '400': '#fb923c', '500': '#f97316', '600': '#ea580c', '700': '#c2410c', '800': '#9a3412', '900': '#7c2d12', '950': '#431407' }),
  createPalette('Amber', '#f59e0b', { '50': '#fffbeb', '100': '#fef3c7', '200': '#fde68a', '300': '#fcd34d', '400': '#fbbf24', '500': '#f59e0b', '600': '#d97706', '700': '#b45309', '800': '#92400e', '900': '#78350f', '950': '#451a03' }),
  createPalette('Cyan', '#06b6d4', { '50': '#ecfeff', '100': '#cffafe', '200': '#a5f3fd', '300': '#67e8f9', '400': '#22d3ee', '500': '#06b6d4', '600': '#0891b2', '700': '#0e7490', '800': '#155e75', '900': '#164e63', '950': '#083344' }),
];

export const BLANK_DATA: AppData = {
  categories: [],
  costTypes: [
    { id: 'TC-001', name: 'Fijo', movementTypeId: 'TM-001', icon: 'tag', iconColor: 'text-blue-500 dark:text-blue-400' },
    { id: 'TC-002', name: 'Variable', movementTypeId: 'TM-001', icon: 'tag', iconColor: 'text-purple-500 dark:text-purple-400' },
    { id: 'TC-003', name: 'Corriente', movementTypeId: 'TM-001', icon: 'tag', iconColor: 'text-teal-500 dark:text-teal-400' },
  ],
  movementTypes: [
    { id: 'TM-001', name: MovementTypeName.GASTO, icon: 'arrow-down', iconColor: 'text-red-500 dark:text-red-400' },
    { id: 'TM-002', name: MovementTypeName.INGRESO, icon: 'arrow-up', iconColor: 'text-green-500 dark:text-green-400' },
  ],
  concepts: [],
  dailyExpenses: [],
  incomes: [],
  plannedExpenses: [],
  savingsGoals: [],
  monthlyBudgets: [],
  notifications: {
    defaultReminderDays: 3,
    defaultReminderTime: '09:00',
  },
};

export const DEMO_DATA: AppData = {
  categories: [],
  costTypes: [
    { id: 'TC-001', name: 'Fijo', movementTypeId: 'TM-001', icon: 'tag', iconColor: 'text-blue-500 dark:text-blue-400' },
    { id: 'TC-002', name: 'Variable', movementTypeId: 'TM-001', icon: 'tag', iconColor: 'text-purple-500 dark:text-purple-400' },
    { id: 'TC-003', name: 'Corriente', movementTypeId: 'TM-001', icon: 'tag', iconColor: 'text-teal-500 dark:text-teal-400' },
  ],
  movementTypes: [
    { id: 'TM-001', name: MovementTypeName.GASTO, icon: 'arrow-down', iconColor: 'text-red-500 dark:text-red-400' },
    { id: 'TM-002', name: MovementTypeName.INGRESO, icon: 'arrow-up', iconColor: 'text-green-500 dark:text-green-400' },
  ],
  concepts: [],
  dailyExpenses: [],
  incomes: [],
  plannedExpenses: [],
  savingsGoals: [],
  monthlyBudgets: [],
  notifications: {
    defaultReminderDays: 3,
    defaultReminderTime: '09:00',
  },
};

export const INITIAL_DATA: AppData = BLANK_DATA;
export enum MovementTypeName {
    INGRESO = 'INGRESO',
    GASTO = 'GASTO',
}

export enum Frequency {
    MENSUAL = 'MENSUAL',
    BIMESTRAL = 'BIMESTRAL',
}

export enum Priority {
    BAJA = 'BAJA',
    MEDIA = 'MEDIA',
    ALTA = 'ALTA',
}

export interface MovementType {
    id: string;
    name: MovementTypeName;
}

export interface CostType {
    id: string;
    name: string;
    movementTypeId: string;
}

export interface Category {
    id: string;
    name: string;
    description?: string;
    movementTypeId: string;
    costTypeId: string;
    icon?: string;
    iconColor?: string;
}

export interface Concept {
    id: string;
    name: string;
    description?: string;
    categoryId: string;
    movementTypeId: string;
    costTypeId: string;
    icon?: string;
    iconColor?: string;
}

export interface DailyExpense {
    id: string;
    date: string; // ISO 8601 format
    amount: number;
    conceptId: string;
    notes?: string;
}

export interface Payment {
    id: string;
    date: string; // ISO 8601 format
    amount: number;
    period: string; // e.g. "2024-07"
}

export interface PlannedExpense {
    id: string;
    conceptId: string;
    amountPerPeriod: number;
    startPeriod: string; // YYYY-MM
    frequency: Frequency;
    periods: number;
    cutOffDay: number;
    dueDay: number;
    reminderDays: number;
    reminderTime: string; // HH:mm
    payments: Payment[];
    periodOverrides?: Record<string, number>;
    icon?: string;
    iconColor?: string;
}

export interface Income {
    id: string;
    date: string; // ISO 8601 format
    amount: number;
    description: string;
    notes?: string;
}

export interface MonthlyBudget {
    id: string;
    categoryId: string;
    amount: number;
    month: number; // 0 for January, 11 for December
    year: number;
}

export interface SavingsGoal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string; // ISO 8601 format
    icon?: string;
    iconColor?: string;
}

export interface AppData {
    movementTypes: MovementType[];
    costTypes: CostType[];
    categories: Category[];
    concepts: Concept[];
    dailyExpenses: DailyExpense[];
    plannedExpenses: PlannedExpense[];
    incomes: Income[];
    monthlyBudgets: MonthlyBudget[];
    savingsGoals: SavingsGoal[];
    notifications: {
        defaultReminderDays: number;
        defaultReminderTime: string;
    };
}

export type CatalogItem = Category | Concept | CostType | MovementType;
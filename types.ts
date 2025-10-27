export enum Frequency {
  MENSUAL = 'mensual',
  BIMESTRAL = 'bimestral',
}

export enum MovementTypeName {
  GASTO = 'Gasto',
  INGRESO = 'Ingreso',
}

export enum Priority {
  ALTA = 'alta',
  MEDIA = 'media',
  BAJA = 'baja',
}

export interface CatalogItem {
  id: string;
  name: string;
}

export interface Category extends CatalogItem {
  movementTypeId: string;
  costTypeId: string;
  description?: string;
}

export interface CostType extends CatalogItem {
  name: string;
  movementTypeId: string;
}

export interface MovementType extends CatalogItem {
  name: MovementTypeName;
}

export interface Concept extends CatalogItem {
  movementTypeId: string;
  categoryId?: string;
  costTypeId?: string;
  description?: string;
}

export interface BaseTransaction {
  id: string;
  amount: number;
  date: string; // ISO String
}

export interface DailyExpense extends BaseTransaction {
  conceptId: string;
}

export interface Income extends BaseTransaction {
  description: string;
}

export interface PlannedExpense {
  id:string;
  conceptId: string;
  icon?: string;
  iconColor?: string;
  amountPerPeriod: number;
  periodOverrides?: Record<string, number>; // { 'YYYY-MM': amount }
  cutOffDay: number;
  dueDay: number;
  startPeriod: string; // YYYY-MM
  frequency: Frequency;
  periods: number;
  reminderDays: number; // Days before due date to remind. -1 to disable.
  reminderTime?: string; // HH:mm
  payments: Payment[];
}

export interface Payment {
  id: string;
  amount: number;
  date: string; // ISO String
  period: string; // YYYY-MM
}

export interface SavingsGoal {
  id: string;
  name: string;
  icon?: string;
  iconColor?: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO String
}

export interface MonthlyBudget {
  id: string;
  categoryId: string;
  amount: number;
}

export interface NotificationSettings {
  defaultReminderDays: number; // Days before due date to remind. -1 to disable.
  defaultReminderTime: string; // HH:mm
}

export interface AppData {
  categories: Category[];
  costTypes: CostType[];
  movementTypes: MovementType[];
  concepts: Concept[];
  dailyExpenses: DailyExpense[];
  incomes: Income[];
  plannedExpenses: PlannedExpense[];
  savingsGoals: SavingsGoal[];
  monthlyBudgets: MonthlyBudget[];
  notifications: NotificationSettings;
}

export interface UserProfile {
  username: string;
  email: string;
  pinHash: string;
  securityAnswer1: string; // Date string
  securityAnswer2Hash: string; // Hash of 6-digit code
}

export interface LocalSession {
  userProfile: UserProfile | null;
  appData: AppData | null;
}
import { PlannedExpense, Frequency, Priority } from '../types';

export const generateSequentialId = (prefix: string, items: { id: string }[]): string => {
  const existingIds = items.map(item => {
    if (!item || typeof item.id !== 'string') return 0;
    const parts = item.id.split('-');
    if (parts.length === 2 && parts[0] === prefix) {
      return parseInt(parts[1], 10);
    }
    return 0;
  }).filter(num => !isNaN(num));

  const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
  const newIdNumber = maxId + 1;
  return `${prefix}-${newIdNumber.toString().padStart(3, '0')}`;
};

export const generatePeriods = (expense: PlannedExpense): string[] => {
    const periods: string[] = [];
    if (!expense.startPeriod || !expense.periods) return periods;

    const [startYear, startMonth] = expense.startPeriod.split('-').map(Number);
    const startDate = new Date(startYear, startMonth - 1, 1);
    const monthIncrement = expense.frequency === Frequency.BIMESTRAL ? 2 : 1;

    for (let i = 0; i < expense.periods; i++) {
        const periodDate = new Date(startDate);
        periodDate.setMonth(startDate.getMonth() + i * monthIncrement);
        const year = periodDate.getFullYear();
        const month = (periodDate.getMonth() + 1).toString().padStart(2, '0');
        periods.push(`${year}-${month}`);
    }
    return periods;
};

export const getNextPeriodToPay = (expense: PlannedExpense): { period: string; index: number } | null => {
    const allPeriods = generatePeriods(expense);
    const paymentsByPeriod = new Map<string, number>();

    expense.payments.forEach(p => {
        paymentsByPeriod.set(p.period, (paymentsByPeriod.get(p.period) || 0) + p.amount);
    });
    
    for (let i = 0; i < allPeriods.length; i++) {
        const period = allPeriods[i];
        const paidAmount = paymentsByPeriod.get(period) || 0;
        const amountForPeriod = expense.periodOverrides?.[period] ?? expense.amountPerPeriod;
        if (paidAmount < amountForPeriod) {
            return { period, index: i };
        }
    }

    return null;
};


export const getStatusInfo = (expense: PlannedExpense, nextPeriodInfo: { period: string; index: number } | null): { text: string; color: string; priority: Priority } => {
    if (!nextPeriodInfo) {
        return { 
            text: 'Pagado', 
            color: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200',
            priority: Priority.BAJA 
        };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [year, month] = nextPeriodInfo.period.split('-').map(Number);
    
    let dueMonth = month;
    let dueYear = year;
    if (expense.cutOffDay > expense.dueDay) {
        dueMonth += 1;
        if (dueMonth > 12) {
            dueMonth = 1;
            dueYear += 1;
        }
    }
    const dueDate = new Date(dueYear, dueMonth - 1, expense.dueDay);
    dueDate.setHours(0, 0, 0, 0);

    const daysDiff = (dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24);

    let priority: Priority;
    if (daysDiff < 0 || daysDiff <= 7) {
        priority = Priority.ALTA;
    } else if (daysDiff <= 15) {
        priority = Priority.MEDIA;
    } else {
        priority = Priority.BAJA;
    }

    if (dueDate < today) {
        return { 
            text: 'Vencido', 
            color: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200',
            priority: Priority.ALTA 
        };
    }

    const reminderDate = new Date(dueDate);
    reminderDate.setDate(dueDate.getDate() - expense.reminderDays);
    if (expense.reminderDays >= 0 && today >= reminderDate) {
        return { 
            text: 'Próximo a Vencer', 
            color: 'bg-yellow-100 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-200',
            priority
        };
    }

    return { 
        text: 'Al Corriente', 
        color: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
        priority
    };
};

export const toDateKey = (date: Date): string => {
    // Note: this function uses local timezone of the browser
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

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

    (expense.payments || []).forEach(p => {
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


export const getStatusInfo = (expense: PlannedExpense): { text: string; color: string; priority: Priority } => {
    const nextPeriodToPay = getNextPeriodToPay(expense);
    const paidInPeriod = nextPeriodToPay ? (expense.payments || []).filter(p => p.period === nextPeriodToPay.period).reduce((s, p) => s + Number(p.amount), 0) : 0;
    const amountForPeriod = nextPeriodToPay ? (Number(expense.periodOverrides?.[nextPeriodToPay.period] ?? expense.amountPerPeriod)) : 0;

    let text: string;
    if (!nextPeriodToPay || (amountForPeriod > 0 && paidInPeriod >= amountForPeriod)) {
        text = 'Pagado';
    } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [year, month] = nextPeriodToPay.period.split('-').map(Number);
        let dueMonth = month, dueYear = year;
        if (expense.cutOffDay > expense.dueDay) {
            dueMonth += 1;
            if (dueMonth > 12) { dueMonth = 1; dueYear += 1; }
        }
        const dueDate = new Date(dueYear, dueMonth - 1, expense.dueDay);
        dueDate.setHours(0, 0, 0, 0);
        const daysDiff = (dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24);

        if (dueDate < today) {
            text = paidInPeriod === 0 ? 'Vencido' : 'Urgente';
        } else if (daysDiff <= 15) {
            text = paidInPeriod === 0 ? 'Próximo' : 'Parcial';
        } else {
            text = 'Al Corriente';
        }
    }

    const statusStyles: { [key: string]: { color: string; priority: Priority } } = {
        'Vencido': { color: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200', priority: Priority.ALTA },
        'Urgente': { color: 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200', priority: Priority.ALTA },
        'Próximo': { color: 'bg-yellow-100 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-200', priority: Priority.MEDIA },
        'Parcial': { color: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200', priority: Priority.MEDIA },
        'Pagado': { color: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200', priority: Priority.BAJA },
        'Al Corriente': { color: 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200', priority: Priority.BAJA }
    };
    
    // Adjust priority for Próximo based on how soon it is
    if (text === 'Próximo') {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const [year, month] = nextPeriodToPay!.period.split('-').map(Number);
        const dueDate = new Date(year, month - 1, expense.dueDay); dueDate.setHours(0,0,0,0);
        const daysDiff = (dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
        if (daysDiff <= 7) {
            statusStyles['Próximo'].priority = Priority.ALTA;
        }
    }

    const { color, priority } = statusStyles[text] || statusStyles['Al Corriente'];
    
    return { text, color, priority };
};

export const toDateKey = (date: Date): string => {
    // Note: this function uses local timezone of the browser
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};
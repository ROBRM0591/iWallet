import React, { useMemo } from 'react';
import { ChevronDownIcon } from './Icons';

interface CalendarGridProps {
    currentDate: Date;
    onDateClick: (date: Date) => void;
    renderDay: (date: Date) => React.ReactNode;
    onPrevMonth: () => void;
    onNextMonth: () => void;
}

const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export const CalendarGrid: React.FC<CalendarGridProps> = ({ currentDate, onDateClick, renderDay, onPrevMonth, onNextMonth }) => {
    const firstDayOfMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), [currentDate]);
    const lastDayOfMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), [currentDate]);

    const startingDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    return (
        <div className="bg-white dark:bg-black/20 dark:backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/20 shadow-lg text-gray-900 dark:text-white p-4">
            <div className="flex justify-between items-center mb-4">
                <button onClick={onPrevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10" aria-label="Mes anterior">
                    <ChevronDownIcon className="w-6 h-6 transform rotate-90" />
                </button>
                <h2 className="text-xl font-bold" aria-live="polite">{months[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                <button onClick={onNextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10" aria-label="Mes siguiente">
                    <ChevronDownIcon className="w-6 h-6 transform -rotate-90" />
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => <div key={day} className="font-semibold text-gray-500 dark:text-gray-400 py-2" aria-hidden="true">{day}</div>)}
                {Array.from({ length: startingDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    return <div key={day} onClick={() => onDateClick(date)} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onDateClick(date)} aria-label={`Seleccionar día ${day}`}>{renderDay(date)}</div>;
                })}
            </div>
        </div>
    );
};
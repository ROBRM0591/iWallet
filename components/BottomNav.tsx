import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
    MoreIcon, DownloadIcon
} from './Icons';
import { useAuth } from '../contexts/AuthContext';
import { IconDisplay } from './IconDisplay';

export const BottomNav: React.FC = () => {
    const { userProfile } = useAuth();
    const [moreOpen, setMoreOpen] = useState(false);

    const getIcon = (section: string, defaultIcon: string) => userProfile?.sectionIcons?.[section] || defaultIcon;
    const getName = (section: string, defaultName: string) => userProfile?.sectionNames?.[section] || defaultName;


    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setMoreOpen(false);
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.more-menu-container')) {
                 setMoreOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const NavItem: React.FC<{ to: string, icon: React.ReactNode, label: string }> = ({ to, icon, label }) => (
        <NavLink
            to={to}
            onClick={() => { setMoreOpen(false); }}
            className={({ isActive }) =>
               `flex flex-col items-center w-full p-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-500 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                }`
            }
        >
            {icon}
            <span className="text-xs mt-1">{label}</span>
        </NavLink>
    );

    const MoreMenuItem: React.FC<{ to: string, icon: React.ReactNode, label: string }> = ({ to, icon, label }) => (
         <NavLink
            to={to}
            onClick={() => setMoreOpen(false)}
            className="flex items-center gap-4 w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg"
        >
            {icon}
            <span className="font-medium">{label}</span>
        </NavLink>
    );

    return (
        <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-black/30 backdrop-blur-lg shadow-lg z-40 border-t border-gray-200 dark:border-white/10 more-menu-container">
            {moreOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 p-2">
                     <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl p-2 z-50 space-y-1">
                        <MoreMenuItem to="/budget" icon={<IconDisplay icon={getIcon('budget', 'piggy-bank')} className="w-6 h-6"/>} label={getName('budget', "Presupuesto")} />
                        <MoreMenuItem to="/savings-goals" icon={<IconDisplay icon={getIcon('savingsGoals', 'savings-goal')} className="w-6 h-6"/>} label={getName('savingsGoals', "Metas Ahorro")} />
                        <MoreMenuItem to="/catalogs" icon={<IconDisplay icon={getIcon('catalogs', 'catalog')} className="w-6 h-6" />} label={getName('catalogs', "Catálogos")} />
                        <MoreMenuItem to="/reports" icon={<IconDisplay icon={getIcon('reports', 'reports')} className="w-6 h-6" />} label={getName('reports', "Reportes")} />
                        <MoreMenuItem to="/debt-calculator" icon={<IconDisplay icon={getIcon('debtCalculator', 'calculator')} className="w-6 h-6" />} label={getName('debtCalculator', "Calculadora")} />
                        <MoreMenuItem to="/data" icon={<DownloadIcon className="w-6 h-6" />} label="Datos" />
                        <MoreMenuItem to="/manual" icon={<IconDisplay icon={getIcon('manual', 'manual')} className="w-6 h-6" />} label={getName('manual', "Manual")} />
                        <MoreMenuItem to="/settings" icon={<IconDisplay icon={getIcon('settings', 'settings')} className="w-6 h-6" />} label={getName('settings', "Ajustes")} />
                    </div>
                </div>
            )}
            <nav className="grid grid-cols-5 gap-1 p-1">
                <NavItem to="/" icon={<IconDisplay icon={getIcon('dashboard', 'dashboard')} className="w-6 h-6"/>} label={getName('dashboard', "Dashboard")} />
                <NavItem to="/incomes" icon={<IconDisplay icon={getIcon('incomes', 'arrow-up')} className="w-6 h-6"/>} label={getName('incomes', "Ingresos")} />
                <NavItem to="/daily-expenses" icon={<IconDisplay icon={getIcon('dailyExpenses', 'shopping')} className="w-6 h-6"/>} label={getName('dailyExpenses', "Gastos")} />
                <NavItem to="/planned-expenses" icon={<IconDisplay icon={getIcon('plannedExpenses', 'planned-expense')} className="w-6 h-6"/>} label={getName('plannedExpenses', "Planif.")} />
                
                <div className="flex flex-col items-center w-full">
                    <button
                        onClick={() => setMoreOpen(v => !v)}
                        className={`flex flex-col items-center w-full p-2 rounded-md text-sm font-medium transition-colors ${
                            moreOpen
                                ? 'bg-primary-600 text-white'
                                : 'text-gray-500 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                    >
                        <MoreIcon className="w-6 h-6" />
                        <span className="text-xs mt-1">Más</span>
                    </button>
                </div>
            </nav>
        </footer>
    );
};
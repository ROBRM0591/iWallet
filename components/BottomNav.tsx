import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
    DashboardIcon, CatalogIcon, MoreIcon, PiggyBankIcon, CurrencyDollarIcon,
    PlannedExpenseIcon, SavingsGoalIcon, ReportsIcon, CalculatorIcon, ManualIcon,
    SettingsIcon, ChatBubbleLeftRightIcon
} from './Icons';

export const BottomNav: React.FC = () => {
    const [moreOpen, setMoreOpen] = useState(false);

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
                    ? 'bg-primary-500/80 text-white'
                    : 'text-gray-300 hover:bg-white/10'
                }`
            }
        >
            {icon}
            <span className="text-xs mt-1">{label}</span>
        </NavLink>
    );

    return (
        <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-lg shadow-lg z-40 border-t border-white/10">
            <nav className="grid grid-cols-4 gap-1 p-1">
                <NavItem to="/" icon={<DashboardIcon className="w-6 h-6"/>} label="Dashboard" />
                <NavItem to="/daily-expenses" icon={<CurrencyDollarIcon className="w-6 h-6"/>} label="Diarios" />
                <NavItem to="/planned-expenses" icon={<PlannedExpenseIcon className="w-6 h-6"/>} label="Planif." />
                <div className="relative flex justify-center more-menu-container">
                    <button onClick={() => setMoreOpen(v => !v)} className={`flex flex-col items-center w-full p-2 rounded-md text-sm font-medium transition-colors text-gray-300 hover:bg-white/10`}>
                        <MoreIcon className="w-6 h-6"/>
                        <span className="text-xs mt-1">Más</span>
                    </button>
                    {moreOpen && (
                        <div className="absolute bottom-full mb-2 w-48 bg-gray-800/80 backdrop-blur-lg border border-white/10 rounded-lg shadow-xl p-2 z-50 right-0">
                            <NavLink to="/budget" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-200 hover:bg-white/10"><PiggyBankIcon className="w-5 h-5" /> Presupuesto</NavLink>
                            <NavLink to="/savings-goals" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-200 hover:bg-white/10"><SavingsGoalIcon className="w-5 h-5" /> Metas Ahorro</NavLink>
                            <NavLink to="/catalogs" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-200 hover:bg-white/10"><CatalogIcon className="w-5 h-5" /> Catálogos</NavLink>
                            <NavLink to="/reports" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-200 hover:bg-white/10"><ReportsIcon className="w-5 h-5" /> Reportes</NavLink>
                            <NavLink to="/debt-calculator" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-200 hover:bg-white/10"><CalculatorIcon className="w-5 h-5" /> Calculadora</NavLink>
                            <NavLink to="/ai-assistant" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-200 hover:bg-white/10"><ChatBubbleLeftRightIcon className="w-5 h-5" /> Asistente AI</NavLink>
                            <NavLink to="/manual" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-200 hover:bg-white/10"><ManualIcon className="w-5 h-5" /> Manual</NavLink>
                            <NavLink to="/settings" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-200 hover:bg-white/10"><SettingsIcon className="w-5 h-5" /> Ajustes</NavLink>
                        </div>
                    )}
                </div>
            </nav>
        </footer>
    );
};
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { COLOR_PALETTES } from '../constants';
import { 
    SunIcon, MoonIcon, PaletteIcon, MoreIcon, ChevronDownIcon,
    RefreshIcon, DownloadIcon
} from './Icons';
import { IconDisplay } from './IconDisplay';
import { useAuth } from '../contexts/AuthContext';
// FIX: Import the now-exported UserProfile type.
import { UserProfile } from '../../contexts/AuthContext';

type Theme = 'light' | 'dark' | 'system';

interface HeaderProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    setPalette: (palette: typeof COLOR_PALETTES[0]) => void;
    refreshData: () => void;
    isRefreshing: boolean;
    appIcon: string;
}

export const Header: React.FC<HeaderProps> = ({ theme, setTheme, setPalette, refreshData, isRefreshing, appIcon }) => {
    const { logout, userProfile } = useAuth();
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);

    const getIcon = (section: string, defaultIcon: string) => userProfile?.sectionIcons?.[section] || defaultIcon;
    const getName = (section: string, defaultName: string) => userProfile?.sectionNames?.[section] || defaultName;

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        setIsDark(document.documentElement.classList.contains('dark')); // initial check
        return () => observer.disconnect();
    }, []);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setPaletteOpen(false);
                setMoreOpen(false);
                setUserMenuOpen(false);
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('header')) {
                setPaletteOpen(false);
                setMoreOpen(false);
                setUserMenuOpen(false);
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
               `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-500 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                }`
            }
        >
            {icon}
            <span>{label}</span>
        </NavLink>
    );

    return (
        <header 
            className="bg-white/80 dark:bg-black/30 backdrop-blur-lg shadow-lg fixed top-0 w-full z-40 border-b border-gray-200 dark:border-white/10"
        >
            <div className="container mx-auto px-2 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-4">
                        <IconDisplay icon={appIcon} className="h-8 w-8 text-primary-500 dark:text-primary-400" />
                        <span className="text-xl font-bold text-gray-800 dark:text-white hidden sm:inline">iWallet</span>
                    </div>

                    <div className="flex items-center">
                        <nav className="hidden md:flex items-center space-x-1">
                             <NavItem to="/" icon={<IconDisplay icon={getIcon('dashboard', 'dashboard')} className="w-5 h-5"/>} label={getName('dashboard', "Dashboard")} />
                             <NavItem to="/incomes" icon={<IconDisplay icon={getIcon('incomes', 'arrow-up')} className="w-5 h-5"/>} label={getName('incomes', "Ingresos")} />
                             <NavItem to="/daily-expenses" icon={<IconDisplay icon={getIcon('dailyExpenses', 'shopping')} className="w-5 h-5"/>} label={getName('dailyExpenses', "Gastos Diarios")} />
                             <NavItem to="/planned-expenses" icon={<IconDisplay icon={getIcon('plannedExpenses', 'planned-expense')} className="w-5 h-5"/>} label={getName('plannedExpenses', "Gastos Planif.")} />
                             <NavItem to="/budget" icon={<IconDisplay icon={getIcon('budget', 'piggy-bank')} className="w-5 h-5" />} label={getName('budget', "Presupuesto")} />
                             <NavItem to="/savings-goals" icon={<IconDisplay icon={getIcon('savingsGoals', 'savings-goal')} className="w-5 h-5"/>} label={getName('savingsGoals', "Metas Ahorro")} />
                             
                             <div className="relative">
                                <button onClick={() => setMoreOpen(v => !v)} className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10">
                                    <MoreIcon className="w-5 h-5" />
                                    <span>Más</span>
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {moreOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-lg shadow-xl p-2 z-50">
                                        <NavLink to="/catalogs" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10"><IconDisplay icon={getIcon('catalogs', 'catalog')} className="w-5 h-5" /> {getName('catalogs', "Catálogos")}</NavLink>
                                        <NavLink to="/reports" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10"><IconDisplay icon={getIcon('reports', 'reports')} className="w-5 h-5" /> {getName('reports', "Reportes")}</NavLink>
                                        <NavLink to="/debt-calculator" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10"><IconDisplay icon={getIcon('debtCalculator', 'calculator')} className="w-5 h-5" /> {getName('debtCalculator', "Calculadora")}</NavLink>
                                        <NavLink to="/data" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10"><DownloadIcon className="w-5 h-5" /> Datos</NavLink>
                                        <NavLink to="/manual" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10"><IconDisplay icon={getIcon('manual', 'manual')} className="w-5 h-5" /> {getName('manual', "Manual")}</NavLink>
                                        <NavLink to="/settings" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10"><IconDisplay icon={getIcon('settings', 'settings')} className="w-5 h-5" /> {getName('settings', "Ajustes")}</NavLink>
                                    </div>
                                )}
                             </div>
                        </nav>

                        <div className="lg:block mx-2 border-l border-gray-300 dark:border-white/20 h-8"></div>
                        
                        <div className="flex items-center space-x-2">
                             <button onClick={refreshData} disabled={isRefreshing} className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition disabled:cursor-not-allowed" aria-label="Actualizar datos">
                                <RefreshIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </button>
                            <div className="relative">
                                <button onClick={() => setPaletteOpen(v => !v)} className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition">
                                    <PaletteIcon className="w-5 h-5" />
                                </button>
                                {paletteOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-lg shadow-xl p-2 z-50">
                                        <div className="grid grid-cols-4 gap-2">
                                            {COLOR_PALETTES.map(p => (
                                                <button key={p.name} onClick={() => { setPalette(p); setPaletteOpen(false); }}
                                                    className="w-8 h-8 rounded-full border-2 border-transparent hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    style={{ backgroundColor: p.hex }}
                                                    aria-label={`Set theme to ${p.name}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition">
                                {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                            </button>

                             <div className="relative">
                                <button onClick={() => setUserMenuOpen(v => !v)} className="p-1 rounded-full text-gray-500 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition">
                                    <img src={userProfile?.avatar} alt="User Avatar" className="w-8 h-8 rounded-full object-cover"/>
                                </button>
                                {userMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-lg shadow-xl p-2 z-50">
                                        <div className="p-2 border-b border-gray-200 dark:border-white/10">
                                            <p className="font-bold text-gray-800 dark:text-white truncate">{userProfile?.username}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{userProfile?.email}</p>
                                        </div>
                                        <button 
                                            onClick={() => { logout(); setUserMenuOpen(false); }}
                                            className="w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 mt-1"
                                        >
                                            Bloquear Sesión
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
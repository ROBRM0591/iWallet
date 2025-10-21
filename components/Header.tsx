import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { COLOR_PALETTES } from '../constants';
import { 
    SunIcon, MoonIcon, PaletteIcon, DashboardIcon, CatalogIcon, WalletIcon, 
    PlannedExpenseIcon, SavingsGoalIcon, ReportsIcon, CalculatorIcon, ManualIcon,
    SettingsIcon, MoreIcon, ChevronDownIcon, PiggyBankIcon,
    RefreshIcon, CurrencyDollarIcon
} from './Icons';
import { IconDisplay } from './IconDisplay';

type Theme = 'light' | 'dark';

const RealTimeClock: React.FC = () => {
    const [time, setTime] = useState(new Date());

    React.useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const formattedDateTime = new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'full',
        timeStyle: 'medium',
    }).format(time);

    return (
        <div className="text-sm font-medium text-gray-600 dark:text-gray-300 capitalize px-2 whitespace-nowrap">
            {formattedDateTime}
        </div>
    );
};

interface HeaderProps {
    username: string;
    theme: Theme;
    toggleTheme: () => void;
    setPalette: (palette: typeof COLOR_PALETTES[0]) => void;
    refreshData: () => void;
    isRefreshing: boolean;
    onLogout: () => void;
    appIcon: string;
}

export const Header: React.FC<HeaderProps> = ({ username, theme, toggleTheme, setPalette, refreshData, isRefreshing, onLogout, appIcon }) => {
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    
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

    const NavItem: React.FC<{ to: string, icon: React.ReactNode, label: string, isMobile?: boolean }> = ({ to, icon, label, isMobile = false }) => (
        <NavLink
            to={to}
            onClick={() => { setMoreOpen(false); }}
            className={({ isActive }) =>
               `flex ${isMobile ? 'flex-col items-center w-full p-2' : 'items-center space-x-2 px-3 py-2'} rounded-md text-sm font-medium transition-colors ${
                isActive
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`
            }
        >
            {icon}
            <span className={isMobile ? 'text-xs mt-1' : ''}>{label}</span>
        </NavLink>
    );

    return (
        <header 
            className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg shadow-sm sticky top-0 z-40 transition-transform duration-300 ease-in-out md:transform md:-translate-y-[calc(100%-3.5rem)] md:hover:translate-y-0`}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-4">
                        <IconDisplay icon={appIcon} className="h-8 w-8 text-primary-600" />
                        <span className="text-xl font-bold text-gray-800 dark:text-white hidden sm:inline">iWallet</span>
                    </div>

                    <div className="flex items-center">
                        <nav className="hidden md:flex items-center space-x-1">
                             <NavItem to="/" icon={<DashboardIcon className="w-5 h-5"/>} label="Dashboard" />
                             <NavItem to="/daily-expenses" icon={<CurrencyDollarIcon className="w-5 h-5"/>} label="Gastos Diarios" />
                             <NavItem to="/budget" icon={<PiggyBankIcon className="w-5 h-5" />} label="Presupuesto" />
                             <NavItem to="/planned-expenses" icon={<PlannedExpenseIcon className="w-5 h-5"/>} label="Gastos Planif." />
                             <NavItem to="/savings-goals" icon={<SavingsGoalIcon className="w-5 h-5"/>} label="Metas Ahorro" />
                             
                             <div className="relative">
                                <button onClick={() => setMoreOpen(v => !v)} className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                                    <MoreIcon className="w-5 h-5" />
                                    <span>Más</span>
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {moreOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-2 z-50">
                                        <NavLink to="/catalogs" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><CatalogIcon className="w-5 h-5" /> Catálogos</NavLink>
                                        <NavLink to="/reports" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><ReportsIcon className="w-5 h-5" /> Reportes</NavLink>
                                        <NavLink to="/debt-calculator" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><CalculatorIcon className="w-5 h-5" /> Calculadora</NavLink>
                                        <NavLink to="/manual" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><ManualIcon className="w-5 h-5" /> Manual</NavLink>
                                        <NavLink to="/settings" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><SettingsIcon className="w-5 h-5" /> Ajustes</NavLink>
                                    </div>
                                )}
                             </div>
                        </nav>

                        <div className="hidden lg:block mx-2 border-l border-gray-200 dark:border-gray-600 h-8"></div>
                        
                        <div className="flex items-center space-x-2">
                             <button onClick={refreshData} disabled={isRefreshing} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:cursor-not-allowed" aria-label="Actualizar datos">
                                <RefreshIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </button>
                            <div className="relative">
                                <button onClick={() => setPaletteOpen(v => !v)} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                                    <PaletteIcon className="w-5 h-5" />
                                </button>
                                {paletteOpen && (
                                    <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-2 z-50">
                                        <div className="grid grid-cols-3 gap-2">
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

                            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                                {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                            </button>
                            
                             <div className="relative">
                                <button onClick={() => setUserMenuOpen(v => !v)} className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                                     <img src={`https://i.pravatar.cc/32?u=${username}`} alt="Avatar" className="w-8 h-8 rounded-full" />
                                     <span className="hidden lg:inline font-semibold text-sm">{username}</span>
                                     <ChevronDownIcon className={`w-4 h-4 transition-transform hidden lg:inline ${userMenuOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {userMenuOpen && (
                                     <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-2 z-50">
                                        <div className="p-2">
                                            <p className="font-bold text-sm">{username}</p>
                                            <p className="text-xs text-gray-500">Usuario Local</p>
                                        </div>
                                        <hr className="my-1 border-gray-200 dark:border-gray-700" />
                                        <button onClick={() => { onLogout(); setUserMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50">Cerrar Sesión</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
             {/* Mobile Navigation */}
            <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
                <div className="p-2 text-center border-b border-gray-200 dark:border-gray-700">
                    <RealTimeClock />
                </div>
                <nav className="grid grid-cols-5 gap-1 p-1">
                    <NavItem to="/" icon={<DashboardIcon className="w-6 h-6"/>} label="Dashboard" isMobile />
                    <NavItem to="/daily-expenses" icon={<CurrencyDollarIcon className="w-6 h-6"/>} label="Diarios" isMobile />
                    <NavItem to="/budget" icon={<PiggyBankIcon className="w-6 h-6" />} label="Presup." isMobile />
                    <NavItem to="/catalogs" icon={<CatalogIcon className="w-6 h-6"/>} label="Catálogos" isMobile />
                     <div className="relative flex justify-center">
                        <button onClick={() => setMoreOpen(v => !v)} className={`flex flex-col items-center w-full p-2 rounded-md text-sm font-medium transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700`}>
                            <MoreIcon className="w-6 h-6"/>
                            <span className="text-xs mt-1">Más</span>
                        </button>
                         {moreOpen && (
                             <div className="absolute top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-2 z-50 right-0">
                                 <NavLink to="/planned-expenses" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><PlannedExpenseIcon className="w-5 h-5" /> Gastos Planif.</NavLink>
                                 <NavLink to="/savings-goals" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><SavingsGoalIcon className="w-5 h-5" /> Metas Ahorro</NavLink>
                                 <NavLink to="/reports" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><ReportsIcon className="w-5 h-5" /> Reportes</NavLink>
                                 <NavLink to="/debt-calculator" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><CalculatorIcon className="w-5 h-5" /> Calculadora</NavLink>
                                 <NavLink to="/manual" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><ManualIcon className="w-5 h-5" /> Manual</NavLink>
                                 <NavLink to="/settings" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><SettingsIcon className="w-5 h-5" /> Ajustes</NavLink>
                             </div>
                         )}
                     </div>
                </nav>
            </div>
        </header>
    );
};
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { COLOR_PALETTES } from '../constants';
import { 
    SunIcon, MoonIcon, PaletteIcon, DashboardIcon, CatalogIcon, WalletIcon, 
    PlannedExpenseIcon, SavingsGoalIcon, ReportsIcon, CalculatorIcon, ManualIcon,
    SettingsIcon, MoreIcon, ChevronDownIcon, PiggyBankIcon,
    RefreshIcon, CurrencyDollarIcon, ChatBubbleLeftRightIcon
} from './Icons';
import { IconDisplay } from './IconDisplay';

type Theme = 'light' | 'dark';

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

    const NavItem: React.FC<{ to: string, icon: React.ReactNode, label: string }> = ({ to, icon, label }) => (
        <NavLink
            to={to}
            onClick={() => { setMoreOpen(false); }}
            className={({ isActive }) =>
               `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                    ? 'bg-primary-500/80 text-white'
                    : 'text-gray-300 hover:bg-white/10'
                }`
            }
        >
            {icon}
            <span>{label}</span>
        </NavLink>
    );

    return (
        <header 
            className="bg-black/30 backdrop-blur-lg shadow-lg fixed top-0 w-full z-40 border-b border-white/10"
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-4">
                        <IconDisplay icon={appIcon} className="h-8 w-8 text-primary-400" />
                        <span className="text-xl font-bold text-white hidden sm:inline">iWallet</span>
                    </div>

                    <div className="flex items-center">
                        <nav className="hidden md:flex items-center space-x-1">
                             <NavItem to="/" icon={<DashboardIcon className="w-5 h-5"/>} label="Dashboard" />
                             <NavItem to="/daily-expenses" icon={<CurrencyDollarIcon className="w-5 h-5"/>} label="Gastos Diarios" />
                             <NavItem to="/planned-expenses" icon={<PlannedExpenseIcon className="w-5 h-5"/>} label="Gastos Planif." />
                             <NavItem to="/budget" icon={<PiggyBankIcon className="w-5 h-5" />} label="Presupuesto" />
                             <NavItem to="/savings-goals" icon={<SavingsGoalIcon className="w-5 h-5"/>} label="Metas Ahorro" />
                             
                             <div className="relative">
                                <button onClick={() => setMoreOpen(v => !v)} className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-white/10">
                                    <MoreIcon className="w-5 h-5" />
                                    <span>Más</span>
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {moreOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800/80 backdrop-blur-lg border border-white/10 rounded-lg shadow-xl p-2 z-50">
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

                        <div className="hidden lg:block mx-2 border-l border-white/20 h-8"></div>
                        
                        <div className="flex items-center space-x-2">
                             <button onClick={refreshData} disabled={isRefreshing} className="p-2 rounded-full text-gray-300 hover:bg-white/10 transition disabled:cursor-not-allowed" aria-label="Actualizar datos">
                                <RefreshIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </button>
                            <div className="relative">
                                <button onClick={() => setPaletteOpen(v => !v)} className="p-2 rounded-full text-gray-300 hover:bg-white/10 transition">
                                    <PaletteIcon className="w-5 h-5" />
                                </button>
                                {paletteOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-40 bg-gray-800/80 backdrop-blur-lg border border-white/10 rounded-lg shadow-xl p-2 z-50">
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

                            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-300 hover:bg-white/10 transition">
                                {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                            </button>
                            
                             <div className="relative">
                                <button onClick={() => setUserMenuOpen(v => !v)} className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition">
                                     <img src={`https://i.pravatar.cc/32?u=${username}`} alt="Avatar" className="w-8 h-8 rounded-full" />
                                     <span className="hidden lg:inline font-semibold text-sm">{username}</span>
                                     <ChevronDownIcon className={`w-4 h-4 transition-transform hidden lg:inline ${userMenuOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {userMenuOpen && (
                                     <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800/80 backdrop-blur-lg border border-white/10 rounded-lg shadow-xl p-2 z-50">
                                        <div className="p-2">
                                            <p className="font-bold text-sm">{username}</p>
                                            <p className="text-xs text-gray-500">Usuario Local</p>
                                        </div>
                                        <hr className="my-1 border-white/20" />
                                        <button onClick={() => { onLogout(); setUserMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm rounded-md text-red-400 hover:bg-red-900/50">Cerrar Sesión</button>
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
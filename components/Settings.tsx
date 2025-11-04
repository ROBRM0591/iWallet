import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { COLOR_PALETTES } from '../constants';
import { ComputerDesktopIcon, SunIcon, MoonIcon, EditIcon, CloseIcon, CheckIcon } from './Icons';
import { IconDisplay, PREDEFINED_ICONS } from './IconDisplay';
import { IconPicker } from './IconPicker';
import { useLocalStorage } from '../hooks/useLocalStorage';

type Theme = 'light' | 'dark' | 'system';

interface OutletContextType {
  appIcon: string;
  setAppIcon: (icon: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  setPalette: (palette: typeof COLOR_PALETTES[0]) => void;
  installPrompt: any;
  handleInstallClick: () => void;
  isInstalled: boolean;
}

const SettingsSection: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="bg-white/90 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-6">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1 mb-4">{description}</p>
        <div className="space-y-4">{children}</div>
    </div>
);

const SectionItemEditor: React.FC<{ 
    section: string; 
    defaultIcon: string; 
    defaultName: string; 
    iconPickerPosition: 'left' | 'right';
}> = ({ section, defaultIcon, defaultName, iconPickerPosition }) => {
    const { userProfile, updateUserProfile } = useAuth();
    const [iconPickerAnchor, setIconPickerAnchor] = useState<HTMLButtonElement | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    
    const currentName = userProfile?.sectionNames?.[section] || defaultName;
    const [name, setName] = useState(currentName);
    
    useEffect(() => {
        setName(currentName);
    }, [currentName]);

    const currentIcon = userProfile?.sectionIcons?.[section] || defaultIcon;

    const handleIconSelect = (details: { icon: string; color: string; }) => {
        const newIcons = { ...userProfile?.sectionIcons, [section]: details.icon };
        updateUserProfile({ sectionIcons: newIcons });
        setIconPickerAnchor(null);
    };
    
    const handleNameSave = () => {
        if (name.trim()) {
            const newNames = { ...userProfile?.sectionNames, [section]: name };
            updateUserProfile({ sectionNames: newNames });
        } else {
            setName(currentName); // Revert if empty
        }
        setIsEditingName(false);
    };

    return (
        <div className="relative flex items-center justify-between p-3 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <button onClick={(e) => setIconPickerAnchor(iconPickerAnchor ? null : e.currentTarget)} className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10">
                        <IconDisplay icon={currentIcon} className="w-6 h-6" />
                    </button>
                    {iconPickerAnchor && <IconPicker anchorEl={iconPickerAnchor} onSelect={handleIconSelect} onClose={() => setIconPickerAnchor(null)} position={iconPickerPosition} />}
                </div>
                {isEditingName ? (
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        onBlur={handleNameSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                        className="bg-white dark:bg-gray-700 rounded-md px-2 py-1 text-sm w-32"
                        autoFocus
                    />
                ) : (
                    <span className="font-medium">{currentName}</span>
                )}
            </div>
             <button onClick={() => setIsEditingName(p => !p)} className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10">
                <EditIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

const SummaryCardEditor: React.FC<{ 
    card: string; 
    defaultIcon: string; 
    defaultName: string; 
    iconPickerPosition: 'left' | 'right';
}> = ({ card, defaultIcon, defaultName, iconPickerPosition }) => {
    const { userProfile, updateUserProfile } = useAuth();
    const [iconPickerAnchor, setIconPickerAnchor] = useState<HTMLButtonElement | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);

    const currentName = userProfile?.summaryCardNames?.[card] || defaultName;
    const [name, setName] = useState(currentName);
    
    useEffect(() => {
        setName(currentName);
    }, [currentName]);

    const currentIcon = userProfile?.summaryCardIcons?.[card] || defaultIcon;

    const handleIconSelect = (details: { icon: string; color: string; }) => {
        const newIcons = { ...userProfile?.summaryCardIcons, [card]: details.icon };
        updateUserProfile({ summaryCardIcons: newIcons });
        setIconPickerAnchor(null);
    };
    
    const handleNameSave = () => {
        if (name.trim()) {
            const newNames = { ...userProfile?.summaryCardNames, [card]: name };
            updateUserProfile({ summaryCardNames: newNames });
        } else {
            setName(currentName);
        }
        setIsEditingName(false);
    };

    return (
        <div className="relative flex items-center justify-between p-3 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-3">
                 <div className="relative">
                    <button onClick={(e) => setIconPickerAnchor(iconPickerAnchor ? null : e.currentTarget)} className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10">
                        <IconDisplay icon={currentIcon} className="w-6 h-6" />
                    </button>
                    {iconPickerAnchor && <IconPicker anchorEl={iconPickerAnchor} onSelect={handleIconSelect} onClose={() => setIconPickerAnchor(null)} position={iconPickerPosition} />}
                </div>
                {isEditingName ? (
                     <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        onBlur={handleNameSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                        className="bg-white dark:bg-gray-700 rounded-md px-2 py-1 text-sm w-32"
                        autoFocus
                    />
                ) : (
                    <span className="font-medium capitalize">{currentName}</span>
                )}
            </div>
             <button onClick={() => setIsEditingName(p => !p)} className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10">
                <EditIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

const CatalogSectionEditor: React.FC<{
    section: 'movementTypes' | 'costTypes' | 'categories' | 'concepts';
    defaultIcon: string;
    defaultColor: string;
    defaultName: string;
    iconPickerPosition: 'left' | 'right';
}> = ({ section, defaultIcon, defaultColor, defaultName, iconPickerPosition }) => {
    const { userProfile, updateUserProfile } = useAuth();
    const [iconPickerAnchor, setIconPickerAnchor] = useState<HTMLButtonElement | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);

    const currentName = userProfile?.catalogSectionNames?.[section] || defaultName;
    const [name, setName] = useState(currentName);
    
    useEffect(() => {
        setName(currentName);
    }, [currentName]);
    
    const currentSettings = userProfile?.catalogSectionIcons?.[section] || { icon: defaultIcon, color: defaultColor };

    const handleIconSelect = (details: { icon: string; color: string }) => {
        const newIcons = {
            ...userProfile?.catalogSectionIcons,
            [section]: { icon: details.icon, color: details.color }
        };
        updateUserProfile({ catalogSectionIcons: newIcons });
        setIconPickerAnchor(null);
    };
    
    const handleNameSave = () => {
        if (name.trim()) {
            const newNames = { ...userProfile?.catalogSectionNames, [section]: name };
            updateUserProfile({ catalogSectionNames: newNames });
        } else {
            setName(currentName);
        }
        setIsEditingName(false);
    };

    return (
        <div className="relative flex items-center justify-between p-3 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-3">
                 <div className="relative">
                    <button onClick={(e) => setIconPickerAnchor(iconPickerAnchor ? null : e.currentTarget)} className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10">
                        <IconDisplay icon={currentSettings.icon} iconColor={currentSettings.color} className="w-6 h-6" />
                    </button>
                    {iconPickerAnchor && <IconPicker anchorEl={iconPickerAnchor} onSelect={handleIconSelect} onClose={() => setIconPickerAnchor(null)} currentColor={currentSettings.color} position={iconPickerPosition} />}
                </div>
                 {isEditingName ? (
                     <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        onBlur={handleNameSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                        className="bg-white dark:bg-gray-700 rounded-md px-2 py-1 text-sm w-32"
                        autoFocus
                    />
                ) : (
                    <span className="font-medium">{currentName}</span>
                )}
            </div>
             <button onClick={() => setIsEditingName(p => !p)} className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10">
                <EditIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

const sectionEditorsConfig = [
    { section: "dashboard", defaultIcon: "dashboard", defaultName: "Dashboard", position: "left" as const },
    { section: "incomes", defaultIcon: "arrow-up", defaultName: "Ingresos", position: "right" as const },
    { section: "dailyExpenses", defaultIcon: "shopping", defaultName: "Gastos Diarios", position: "left" as const },
    { section: "plannedExpenses", defaultIcon: "planned-expense", defaultName: "Gastos Planificados", position: "right" as const },
    { section: "budget", defaultIcon: "piggy-bank", defaultName: "Presupuesto", position: "left" as const },
    { section: "savingsGoals", defaultIcon: "savings-goal", defaultName: "Metas de Ahorro", position: "right" as const },
    { section: "catalogs", defaultIcon: "catalog", defaultName: "Catálogos", position: "left" as const },
    { section: "reports", defaultIcon: "reports", defaultName: "Reportes", position: "right" as const },
    { section: "debtCalculator", defaultIcon: "calculator", defaultName: "Calculadora de Deuda", position: "left" as const },
    { section: "manual", defaultIcon: "manual", defaultName: "Manual de Usuario", position: "right" as const },
    { section: "settings", defaultIcon: "settings", defaultName: "Ajustes", position: "left" as const },
];

const summaryCardEditorsConfig = [
    { card: "income", defaultIcon: "trending-up", defaultName: "Ingresos", position: "left" as const },
    { card: "expenses", defaultIcon: "trending-down", defaultName: "Gastos", position: "right" as const },
    { card: "balance", defaultIcon: "wallet", defaultName: "Disponible", position: "left" as const },
    { card: "pending", defaultIcon: "clock", defaultName: "Pendiente", position: "right" as const },
];

const catalogSectionsConfig = [
    { section: "movementTypes", defaultIcon: "arrows-up-down", defaultColor: "text-gray-800 dark:text-white", defaultName: "Tipos de Movimiento", position: "left" as const },
    { section: "costTypes", defaultIcon: "tag", defaultColor: "text-gray-800 dark:text-white", defaultName: "Tipos de Costo", position: "right" as const },
    { section: "categories", defaultIcon: "list-bullet", defaultColor: "text-gray-800 dark:text-white", defaultName: "Categorías", position: "left" as const },
    { section: "concepts", defaultIcon: "clipboard", defaultColor: "text-gray-800 dark:text-white", defaultName: "Conceptos", position: "right" as const },
];

export const Settings: React.FC = () => {
    const { appIcon, setAppIcon, theme, setTheme, installPrompt, handleInstallClick, isInstalled } = useOutletContext<OutletContextType>();
    const { userProfile, updateUserProfile } = useAuth();
    const [iconPickerAnchor, setIconPickerAnchor] = useState<HTMLButtonElement | null>(null);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                if(event.target?.result) {
                    updateUserProfile({ avatar: event.target.result as string });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAppIconSelect = (details: { icon: string; color: string; }) => {
        setAppIcon(details.icon);
        setIconPickerAnchor(null);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Ajustes</h1>

            <SettingsSection
                title="Perfil y Apariencia"
                description="Personaliza tu perfil y cómo se ve la aplicación."
            >
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <img src={userProfile?.avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover"/>
                        <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-primary-600 text-white rounded-full p-1 cursor-pointer hover:bg-primary-700">
                            <EditIcon className="w-4 h-4"/>
                        </label>
                        <input id="avatar-upload" type="file" className="hidden" onChange={handleAvatarChange} accept="image/*"/>
                    </div>
                    <div>
                         <h3 className="text-lg font-bold">{userProfile?.username}</h3>
                         <p className="text-sm text-gray-500 dark:text-gray-400">{userProfile?.email}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="font-medium">Ícono de la Aplicación</span>
                     <div className="relative">
                        <button onClick={(e) => setIconPickerAnchor(iconPickerAnchor ? null : e.currentTarget)} className="flex items-center gap-2 p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10">
                            <IconDisplay icon={appIcon} className="w-6 h-6"/>
                            <EditIcon className="w-4 h-4 text-gray-500"/>
                        </button>
                        {iconPickerAnchor && <IconPicker anchorEl={iconPickerAnchor} onSelect={handleAppIconSelect} onClose={() => setIconPickerAnchor(null)} position="right" />}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="font-medium">Tema</span>
                    <div className="flex items-center gap-2 rounded-lg bg-gray-200 dark:bg-black/20 p-1">
                        <button onClick={() => setTheme('light')} className={`p-1.5 rounded-md ${theme === 'light' ? 'bg-primary-600 text-white' : ''}`}><SunIcon className="w-5 h-5"/></button>
                        <button onClick={() => setTheme('dark')} className={`p-1.5 rounded-md ${theme === 'dark' ? 'bg-primary-600 text-white' : ''}`}><MoonIcon className="w-5 h-5"/></button>
                        <button onClick={() => setTheme('system')} className={`p-1.5 rounded-md ${theme === 'system' ? 'bg-primary-600 text-white' : ''}`}><ComputerDesktopIcon className="w-5 h-5"/></button>
                    </div>
                </div>

                <div>
                    <h3 className="font-medium mb-2">Íconos y Nombres de Secciones del Menú</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {sectionEditorsConfig.map(config => (
                            <SectionItemEditor 
                                key={config.section}
                                section={config.section}
                                defaultIcon={config.defaultIcon}
                                defaultName={config.defaultName}
                                iconPickerPosition={config.position}
                            />
                        ))}
                    </div>
                </div>
                 <div>
                    <h3 className="font-medium mb-2">Íconos y Nombres de Tarjetas de Resumen</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {summaryCardEditorsConfig.map(config => (
                            <SummaryCardEditor 
                                key={config.card}
                                card={config.card}
                                defaultIcon={config.defaultIcon}
                                defaultName={config.defaultName}
                                iconPickerPosition={config.position}
                            />
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="font-medium mb-2">Íconos y Nombres de Catálogos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {catalogSectionsConfig.map(config => (
                             <CatalogSectionEditor 
                                key={config.section}
                                section={config.section as any}
                                defaultIcon={config.defaultIcon}
                                defaultColor={config.defaultColor}
                                defaultName={config.defaultName}
                                iconPickerPosition={config.position}
                            />
                        ))}
                    </div>
                </div>
            </SettingsSection>

            <SettingsSection
                title="Instalación de la App"
                description="Instala iWallet en tu dispositivo para un acceso más rápido y una experiencia similar a una aplicación nativa."
            >
                {isInstalled ? (
                    <p className="text-green-600 dark:text-green-400 font-semibold">¡La aplicación ya está instalada!</p>
                ) : installPrompt ? (
                    <button onClick={handleInstallClick} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition">
                        Instalar Aplicación
                    </button>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">La instalación no está disponible en este navegador o ya está instalada.</p>
                )}
            </SettingsSection>
        </div>
    );
};
import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AppData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { BLANK_DATA, COLOR_PALETTES } from '../constants';
import { WarningIcon, CheckCircleIcon, ComputerDesktopIcon, SunIcon, MoonIcon, DownloadIcon, CloseIcon } from './Icons';
import { IconDisplay } from './IconDisplay';
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

const ConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}> = ({ isOpen, onClose, onConfirm, title, message }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-2xl shadow-2xl w-full max-w-md m-4 transform transition-all text-center p-6 text-gray-900 dark:text-white">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50">
                    <WarningIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
                </div>
                <h3 className="text-lg leading-6 font-bold mt-4">{title}</h3>
                <div className="mt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
                </div>
                <div className="mt-6 flex justify-center gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => { onConfirm(); onClose(); }}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

const SuccessToast: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
}> = ({ isOpen, onClose, title, message }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    return (
        <div
            className={`fixed bottom-4 left-4 z-50 w-full max-w-sm transition-all duration-300 ease-in-out ${
                isOpen ? 'transform translate-y-0 opacity-100' : 'transform translate-y-4 opacity-0'
            }`}
        >
            {isOpen && (
                 <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-xl shadow-2xl p-4 flex items-start gap-4 text-gray-900 dark:text-white">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                       <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
                    </div>
                    <div className="flex-grow">
                        <p className="font-bold">{title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
                    </div>
                     <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">&times;</button>
                </div>
            )}
        </div>
    );
};

const SettingCard: React.FC<{ icon: string; title: string; children: React.ReactNode; className?: string; }> = ({ icon, title, children, className = '' }) => (
    <div className={`bg-white dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-gray-200/80 dark:border-white/20 p-6 text-gray-900 dark:text-white ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{icon}</span>
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
);

export const Settings: React.FC = () => {
    const { appData: data, setData } = useAuth();
    const { appIcon, setAppIcon, theme, setTheme, setPalette, installPrompt, handleInstallClick, isInstalled } = useOutletContext<OutletContextType>();
    
    const [activeSection, setActiveSection] = useState('appearance');
    const [notificationPermission, setNotificationPermission] = useState(() => 'Notification' in window ? Notification.permission : 'default');
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
    const [fileToImport, setFileToImport] = useState<File | null>(null);
    const [successInfo, setSuccessInfo] = useState<{ title: string; message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isIconPickerOpen, setIconPickerOpen] = useState(false);
    const iconPickerContainerRef = useRef<HTMLDivElement>(null);
    const [currentPalette, setCurrentPalette] = useLocalStorage('iwallet-palette', COLOR_PALETTES[2]);
    const [defaultIconColor, setDefaultIconColor] = useState('text-gray-800 dark:text-white');
    
    useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark') || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setDefaultIconColor(isDark ? 'text-white' : 'text-gray-800');
    }, [theme]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (iconPickerContainerRef.current && !iconPickerContainerRef.current.contains(event.target as Node)) {
                setIconPickerOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!data) {
        return <div>Cargando...</div>;
    }

    const sections = [
        { id: 'appearance', label: 'Apariencia', icon: '🎨' },
        { id: 'notifications', label: 'Notificaciones', icon: '🔔' },
        { id: 'data', label: 'Datos y Respaldo', icon: '💾' },
        { id: 'about', label: 'Acerca de', icon: 'ℹ️' }
    ];

    const handleNotificationRequest = () => {
        if (!("Notification" in window)) {
            alert("Este navegador no soporta notificaciones de escritorio.");
        } else if (Notification.permission === "granted") {
            new Notification("¡Notificaciones ya activadas!", { body: "Recibirás recordatorios de tus próximos pagos.", icon: "/assets/icons/icon-192x192.png" });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((permission) => {
                setNotificationPermission(permission);
                if (permission === "granted") {
                    new Notification("¡Notificaciones activadas!", { body: "Ahora recibirás recordatorios de tus próximos pagos.", icon: "/assets/icons/icon-192x192.png" });
                }
            });
        }
    };
    
    const handleDefaultReminderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setData({ ...data, notifications: { ...data.notifications, defaultReminderDays: Number(e.target.value) } });
    };
    
    const handleDefaultReminderTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData({ ...data, notifications: { ...data.notifications, defaultReminderTime: e.target.value } });
    };

    const handleExport = () => {
        try {
            const dataString = JSON.stringify(data, null, 2);
            const blob = new Blob([dataString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const today = new Date().toISOString().slice(0, 10);
            link.download = `iwallet-backup-${today}.iwallet`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setSuccessInfo({ title: 'Exportación Exitosa', message: 'Tus datos se han guardado en un archivo .iwallet.' });
        } catch (error) {
            console.error("Error al exportar los datos:", error);
            alert("Ocurrió un error al intentar exportar los datos.");
        }
    };

    const handleImportFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileToImport(file);
            setIsImportConfirmOpen(true);
        }
    };

    const executeImport = () => {
        if (!fileToImport) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsedData: AppData = JSON.parse(e.target?.result as string);
                const requiredKeys: (keyof AppData)[] = ['categories', 'concepts', 'dailyExpenses', 'incomes', 'plannedExpenses', 'savingsGoals', 'monthlyBudgets', 'notifications'];
                if (requiredKeys.every(key => key in parsedData)) {
                    setData(parsedData);
                    setSuccessInfo({ title: '¡Importación Exitosa!', message: 'Tus datos han sido restaurados.' });
                } else {
                    throw new Error('Archivo de respaldo inválido o corrupto.');
                }
            } catch (error) {
                alert(`Error al procesar el archivo: ${error instanceof Error ? error.message : 'Formato incorrecto.'}`);
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = '';
                setFileToImport(null);
            }
        };
        reader.readAsText(fileToImport);
    };
    
    const handleConfirmReset = () => {
        setData(BLANK_DATA);
        setSuccessInfo({ title: 'Datos Restablecidos', message: 'La aplicación ha sido restaurada a su estado inicial.' });
    };
    
    const renderContent = () => {
        switch (activeSection) {
            case 'appearance':
                return (
                    <div className="space-y-6">
                        <SettingCard icon="🌓" title="Tema">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <button onClick={() => setTheme('light')} className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${theme === 'light' ? 'border-primary-500 bg-primary-500/10 dark:bg-primary-500/20' : 'border-gray-300 dark:border-white/20 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                                    <SunIcon className="w-8 h-8 mb-2 text-yellow-400" />
                                    <p className="font-semibold text-gray-800 dark:text-white">Claro</p>
                                </button>
                                <button onClick={() => setTheme('dark')} className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${theme === 'dark' ? 'border-primary-500 bg-primary-500/10 dark:bg-primary-500/20' : 'border-gray-300 dark:border-white/20 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                                    <MoonIcon className="w-8 h-8 mb-2 text-indigo-400" />
                                    <p className="font-semibold text-gray-800 dark:text-white">Oscuro</p>
                                </button>
                                <button onClick={() => setTheme('system')} className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${theme === 'system' ? 'border-primary-500 bg-primary-500/10 dark:bg-primary-500/20' : 'border-gray-300 dark:border-white/20 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                                    <ComputerDesktopIcon className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                                    <p className="font-semibold text-gray-800 dark:text-white">Sistema</p>
                                </button>
                            </div>
                        </SettingCard>
                        <SettingCard icon="🎨" title="Color de Acento">
                            <div className="grid grid-cols-5 sm:grid-cols-9 gap-3">
                                {COLOR_PALETTES.map(p => (
                                    <button key={p.name} onClick={() => { setPalette(p); setCurrentPalette(p); }} className={`relative p-2 rounded-xl transition-all ${currentPalette.name === p.name ? 'ring-2 ring-offset-2 ring-primary-500 ring-offset-white dark:ring-offset-slate-800 scale-110' : 'hover:scale-105'}`}>
                                        <div className="w-full h-10 rounded-lg" style={{ backgroundColor: p.hex }} />
                                    </button>
                                ))}
                            </div>
                        </SettingCard>
                        <SettingCard icon="📱" title="Ícono de la App" className={isIconPickerOpen ? 'relative z-10' : ''}>
                            <div className="flex items-center gap-4">
                                <p className="font-medium">Ícono actual:</p>
                                <div className="relative" ref={iconPickerContainerRef}>
                                    <button onClick={() => setIconPickerOpen(p => !p)} className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-black/20 hover:bg-gray-200 dark:hover:bg-black/30 transition">
                                        <IconDisplay icon={appIcon} className="w-6 h-6 text-primary-500 dark:text-primary-400" />
                                        <span>Cambiar</span>
                                    </button>
                                    {isIconPickerOpen && <IconPicker onSelect={(details) => setAppIcon(details.icon)} onClose={() => setIconPickerOpen(false)} currentColor={defaultIconColor} />}
                                </div>
                            </div>
                        </SettingCard>
                         <SettingCard icon="📲" title="Acceso Directo">
                            <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    {isInstalled 
                                        ? "La aplicación ya está instalada en tu pantalla de inicio." 
                                        : "Instala iWallet en tu dispositivo para un acceso rápido y una experiencia de pantalla completa, como si fuera una aplicación nativa."
                                    }
                                </p>
                                <button 
                                    onClick={handleInstallClick} 
                                    disabled={!installPrompt || isInstalled}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                    {isInstalled ? 'Instalada' : 'Añadir a Pantalla de Inicio'}
                                </button>
                            </div>
                        </SettingCard>
                    </div>
                );
            case 'notifications':
                 return (
                    <div className="space-y-6">
                        <SettingCard icon="🔔" title="Notificaciones">
                             <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-lg">
                                <button onClick={handleNotificationRequest} disabled={notificationPermission === 'denied'} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed">
                                    {notificationPermission === 'granted' ? 'Permiso Concedido' : 'Solicitar Permiso'}
                                </button>
                                {notificationPermission === 'denied' && <p className="text-red-500 dark:text-red-400 text-sm mt-2">Las notificaciones están bloqueadas en la configuración de tu navegador.</p>}
                            </div>
                        </SettingCard>
                        <SettingCard icon="⏰" title="Recordatorios Predeterminados">
                            <div className="space-y-3 p-4 bg-gray-100 dark:bg-white/5 rounded-lg">
                                <div>
                                    <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Días antes del vencimiento</label>
                                    <select value={data.notifications.defaultReminderDays} onChange={handleDefaultReminderChange} className="w-full rounded-lg px-4 py-2">
                                        <option value="-1">No recordar</option>
                                        <option value="0">El mismo día</option>
                                        <option value="1">1 día antes</option>
                                        <option value="3">3 días antes</option>
                                        <option value="5">5 días antes</option>
                                        <option value="7">1 semana antes</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Hora del recordatorio</label>
                                    <input type="time" value={data.notifications.defaultReminderTime} onChange={handleDefaultReminderTimeChange} className="w-full rounded-lg px-4 py-2" />
                                </div>
                            </div>
                        </SettingCard>
                    </div>
                );
            case 'data':
                return (
                    <div className="space-y-6">
                        <SettingCard icon="📤" title="Exportar e Importar">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2">
                                    📥 Importar
                                </button>
                                <button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2">
                                    📤 Exportar
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleImportFileSelect} className="hidden" accept=".iwallet,application/json" />
                            </div>
                        </SettingCard>
                        <div className="bg-red-50 dark:bg-red-600/20 backdrop-blur-xl rounded-xl p-4 border border-red-400/30 dark:border-red-500/30">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl mt-1">⚠️</span>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 dark:text-white mb-1">Zona Peligrosa</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Esta acción eliminará todos tus datos de forma permanente.</p>
                                    <button onClick={() => setIsResetConfirmOpen(true)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">
                                        🗑️ Restablecer Datos
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'about':
                return (
                     <div className="space-y-6">
                        <SettingCard icon="📱" title="Información de la App">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-white/5 rounded-lg"><span className="text-gray-600 dark:text-gray-400">Versión</span><span className="font-semibold text-gray-800 dark:text-white">1.0.0</span></div>
                                <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-white/5 rounded-lg"><span className="text-gray-600 dark:text-gray-400">Base de datos</span><span className="font-semibold text-gray-800 dark:text-white">Local (Browser)</span></div>
                            </div>
                        </SettingCard>
                        <SettingCard icon="📜" title="Legal">
                            <div className="space-y-2">
                                <button className="w-full text-left p-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-all flex items-center justify-between"><span className="text-gray-800 dark:text-white">Términos de Servicio</span><span className="text-gray-500 dark:text-gray-400">→</span></button>
                                <button className="w-full text-left p-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-all flex items-center justify-between"><span className="text-gray-800 dark:text-white">Política de Privacidad</span><span className="text-gray-500 dark:text-gray-400">→</span></button>
                            </div>
                        </SettingCard>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Ajustes</h1>
                <p className="text-gray-600 dark:text-gray-300">Personaliza iWallet a tu gusto</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-gray-200/80 dark:border-white/20 p-2 sticky top-24">
                        <nav className="space-y-1">
                            {sections.map(section => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeSection === section.id ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'}`}>
                                    <span className="text-xl">{section.icon}</span>
                                    <span>{section.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
                <div className="lg:col-span-3">
                    {renderContent()}
                </div>
            </div>
            <ConfirmationModal
                isOpen={isResetConfirmOpen}
                onClose={() => setIsResetConfirmOpen(false)}
                onConfirm={handleConfirmReset}
                title="Restablecer Todos los Datos"
                message="¡Atención! Esta acción es irreversible y borrará TODOS tus datos. ¿Deseas continuar?"
            />
            <ConfirmationModal
                isOpen={isImportConfirmOpen}
                onClose={() => { setIsImportConfirmOpen(false); setFileToImport(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                onConfirm={executeImport}
                title="Confirmar Importación"
                message="¿Estás seguro? Esta acción sobrescribirá TODA tu información actual de forma irreversible."
            />
            <SuccessToast 
                isOpen={!!successInfo}
                onClose={() => setSuccessInfo(null)}
                title={successInfo?.title || ''}
                message={successInfo?.message || ''}
            />
        </div>
    );
};
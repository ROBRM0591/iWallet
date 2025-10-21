import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AppData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { BLANK_DATA } from '../constants';
import { WarningIcon, CheckCircleIcon } from './Icons';
import { IconDisplay } from './IconDisplay';
import { IconPicker } from './IconPicker';

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
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md m-4 transform transition-all text-center p-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50">
                    <WarningIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
                </div>
                <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white mt-4">{title}</h3>
                <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
                </div>
                <div className="mt-6 flex justify-center gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg transition"
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
                 <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 flex items-start gap-4 ring-1 ring-black ring-opacity-5">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                       <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
                    </div>
                    <div className="flex-grow">
                        <p className="font-bold text-gray-900 dark:text-white">{title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
                    </div>
                     <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">&times;</button>
                </div>
            )}
        </div>
    );
};

const FeatureCard: React.FC<{ title: string, description: string, children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mt-1 mb-4">{description}</p>
        {children}
    </div>
);

interface OutletContextType {
  appIcon: string;
  setAppIcon: (icon: string) => void;
}

export const Settings: React.FC = () => {
    const { appData: data, setData, userProfile } = useAuth();
    const { appIcon, setAppIcon } = useOutletContext<OutletContextType>();
    const [notificationPermission, setNotificationPermission] = useState(() => 
        'Notification' in window ? Notification.permission : 'default'
    );
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
    const [fileToImport, setFileToImport] = useState<File | null>(null);
    const [successInfo, setSuccessInfo] = useState<{ title: string; message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isIconPickerOpen, setIconPickerOpen] = useState(false);
    const iconPickerContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (iconPickerContainerRef.current && !iconPickerContainerRef.current.contains(event.target as Node)) {
                setIconPickerOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    if (!data) {
        return <div>Cargando...</div>;
    }

    const handleNotificationRequest = () => {
        if (!("Notification" in window)) {
            alert("Este navegador no soporta notificaciones de escritorio.");
        } else if (Notification.permission === "granted") {
            new Notification("¡Notificaciones ya activadas!", {
                body: "Recibirás recordatorios de tus próximos pagos.",
                icon: "https://picsum.photos/192/192"
            });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((permission) => {
                setNotificationPermission(permission);
                if (permission === "granted") {
                    new Notification("¡Notificaciones activadas!", {
                        body: "Ahora recibirás recordatorios de tus próximos pagos.",
                        icon: "https://picsum.photos/192/192"
                    });
                }
            });
        }
    };
    
    const handleDefaultReminderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const days = Number(e.target.value);
        setData({
            ...data,
            notifications: {
                ...data.notifications,
                defaultReminderDays: days,
            },
        });
    };
    
    const handleDefaultReminderTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData({
            ...data,
            notifications: {
                ...data.notifications,
                defaultReminderTime: e.target.value,
            },
        });
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
            setSuccessInfo({
                title: 'Exportación Exitosa',
                message: 'Tus datos se han guardado en un archivo .iwallet en tu carpeta de descargas.'
            });
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
            const content = e.target?.result as string;
            if (!content) {
                alert('El archivo está vacío.');
                return;
            }
            try {
                const parsedData: AppData = JSON.parse(content);
                const requiredKeys: (keyof AppData)[] = [
                    'categories', 'costTypes', 'movementTypes', 'concepts',
                    'dailyExpenses', 'incomes', 'plannedExpenses', 'savingsGoals',
                    'monthlyBudgets', 'notifications'
                ];
                
                const missingKeys = requiredKeys.filter(key => !(key in parsedData));
                if (missingKeys.length > 0) {
                    throw new Error(`Archivo de respaldo inválido. Faltan las siguientes claves: ${missingKeys.join(', ')}.`);
                }
    
                const arrayKeys: (keyof AppData)[] = [
                    'categories', 'costTypes', 'movementTypes', 'concepts',
                    'dailyExpenses', 'incomes', 'plannedExpenses', 'savingsGoals',
                    'monthlyBudgets'
                ];
    
                for (const key of arrayKeys) {
                    if (!Array.isArray(parsedData[key])) {
                        throw new Error(`Archivo de respaldo inválido. La clave '${key}' debería ser un arreglo (array).`);
                    }
                }
    
                if (typeof parsedData.notifications !== 'object' || parsedData.notifications === null) {
                    throw new Error(`Archivo de respaldo inválido. La clave 'notifications' debería ser un objeto.`);
                }
                setData(parsedData);
                setSuccessInfo({ title: '¡Importación Exitosa!', message: 'Tus datos han sido restaurados correctamente.' });
                
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
                console.error("Error al importar el archivo:", error);
                alert(`Error al procesar el archivo: ${errorMessage}`);
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                setFileToImport(null);
            }
        };
        reader.readAsText(fileToImport);
    };
    
    const handleConfirmReset = () => {
        setData(BLANK_DATA);
        setSuccessInfo({ title: 'Datos Restablecidos', message: 'La aplicación ha sido restaurada a su estado inicial.' });
    };

    const handleIconSelect = (details: { icon: string; color: string; }) => {
        setAppIcon(details.icon);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Ajustes</h1>
            <div className="space-y-8">
                 <FeatureCard
                    title="Personalizar Apariencia"
                    description="Elige un ícono para el logo de la aplicación. El color se cambia desde la paleta en el encabezado."
                >
                    <div className="flex items-center gap-4">
                        <p className="font-medium">Ícono actual:</p>
                        <div className="relative" ref={iconPickerContainerRef}>
                            <button onClick={() => setIconPickerOpen(prev => !prev)} className="flex items-center gap-2 p-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition">
                                <IconDisplay icon={appIcon} className="w-6 h-6 text-primary-600" />
                                <span>Cambiar</span>
                            </button>
                             {isIconPickerOpen && <IconPicker onSelect={handleIconSelect} onClose={() => setIconPickerOpen(false)} />}
                        </div>
                    </div>
                </FeatureCard>

                <FeatureCard
                    title="Notificaciones de Vencimiento"
                    description="Permite que la aplicación te envíe recordatorios cuando se acerque la fecha límite de un pago planificado."
                >
                    <button
                        onClick={handleNotificationRequest}
                        disabled={notificationPermission === 'denied'}
                        className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {notificationPermission === 'granted' ? 'Notificaciones Activadas' : 'Activar Notificaciones'}
                    </button>
                    {notificationPermission === 'denied' && (
                        <p className="text-red-500 text-sm mt-2">
                            Las notificaciones están bloqueadas. Para activarlas, ve a la configuración de tu navegador, busca los permisos de este sitio y cambia la opción de "Notificaciones" a "Permitir".
                        </p>
                    )}
                </FeatureCard>

                <FeatureCard
                    title="Recordatorio de Pagos Predeterminado"
                    description="Establece con cuántos días de anticipación y a qué hora quieres recibir recordatorios para tus gastos."
                >
                    <div className="flex items-center gap-4">
                        <select
                            value={data.notifications.defaultReminderDays}
                            onChange={handleDefaultReminderChange}
                            className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg py-2 px-4"
                        >
                            <option value="-1">No recordar</option>
                            <option value="0">El día del vencimiento</option>
                            <option value="1">1 día antes</option>
                            <option value="3">3 días antes</option>
                            <option value="5">5 días antes</option>
                            <option value="7">1 semana antes</option>
                        </select>
                        <input
                            type="time"
                            value={data.notifications.defaultReminderTime}
                            onChange={handleDefaultReminderTimeChange}
                            className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg py-2 px-4"
                        />
                    </div>
                </FeatureCard>

                <FeatureCard
                    title="Copia de Seguridad y Restauración"
                    description="Crea una copia de seguridad de tus datos para restaurarla en otro dispositivo o navegador. La información se gestiona localmente en tu navegador."
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <button 
                            onClick={handleExport}
                            className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg"
                        >
                            Exportar Datos
                        </button>
                        <input 
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImportFileSelect}
                            className="hidden"
                            accept=".iwallet,application/json"
                        />
                         <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg"
                        >
                            Importar Datos
                        </button>
                    </div>
                     <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">Sugerencia: Guarda el archivo exportado en un lugar seguro para tener un respaldo.</p>
                </FeatureCard>
                
                <FeatureCard
                    title="Restablecer Datos de la Aplicación"
                    description="Restaura la aplicación a su estado inicial. Borra todos los datos actuales (incluyendo catálogos) y deja la aplicación en blanco."
                >
                    <button
                        onClick={() => setIsResetConfirmOpen(true)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
                    >
                        Restablecer Datos Ahora
                    </button>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">¡Cuidado! Esta acción no se puede deshacer.</p>
                </FeatureCard>

                 <FeatureCard
                    title="Sincronización en la Nube (DEMO)"
                    description="Guarda tus datos de forma segura para acceder a ellos desde cualquier dispositivo."
                >
                     <div className="flex items-center gap-4">
                        <img src={`https://i.pravatar.cc/48?u=${userProfile?.email}`} alt="Avatar de usuario" className="w-12 h-12 rounded-full"/>
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-white">{userProfile?.username}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{userProfile?.email} (Perfil Local)</p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <button disabled className="bg-gray-300 dark:bg-gray-500 text-gray-500 dark:text-gray-300 font-bold py-2 px-4 rounded-lg cursor-not-allowed">
                            Activar Sincronización
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">Nota: Esta es una demostración. La funcionalidad completa requiere un servicio de backend.</p>
                </FeatureCard>
            </div>
             <ConfirmationModal
                isOpen={isResetConfirmOpen}
                onClose={() => setIsResetConfirmOpen(false)}
                onConfirm={handleConfirmReset}
                title="Restablecer Todos los Datos"
                message="¡Atención! Esta acción es irreversible y borrará TODOS tus datos (transacciones, presupuestos, metas y catálogos), dejando la aplicación en blanco. Tu perfil de usuario no será modificado. ¿Deseas continuar?"
            />
            <ConfirmationModal
                isOpen={isImportConfirmOpen}
                onClose={() => {
                    setIsImportConfirmOpen(false);
                    setFileToImport(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                onConfirm={executeImport}
                title="Confirmar Importación"
                message="¿Estás seguro de que quieres importar estos datos? Esta acción sobrescribirá TODA tu información actual de forma irreversible."
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
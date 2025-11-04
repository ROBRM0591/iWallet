import React, { useState, useRef, useEffect } from 'react';
import { useAuth, UserProfile } from '../contexts/AuthContext';
import { BLANK_DATA, DEMO_DATA } from '../constants';
import { AppData } from '../types';
import { WarningIcon, CheckCircleIcon, DownloadIcon, CloseIcon } from './Icons';
import { ConfirmationModal, SuccessToast } from './common/Portals';

const SettingsSection: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-slate-700/80 shadow-lg p-6">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1 mb-4">{description}</p>
        <div className="space-y-4">{children}</div>
    </div>
);


export const DataManagement: React.FC = () => {
    const { appData, setData, userProfile, deleteAccount } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
    const [restoredData, setRestoredData] = useState<{ profile: UserProfile, data: AppData } | null>(null);
    const [successInfo, setSuccessInfo] = useState<{ title: string; message: string } | null>(null);
    
    const handleBackup = () => {
        if (!appData || !userProfile) return;
        const dataToBackup = {
            profile: userProfile,
            data: appData
        };
        const blob = new Blob([JSON.stringify(dataToBackup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const today = new Date().toISOString().slice(0, 10);
        a.download = `iwallet-backup-${today}.iwallet`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSuccessInfo({ title: 'Respaldo Exitoso', message: 'Tus datos se han guardado. Guarda el archivo en un lugar seguro.' });
    };

    const handleRestoreFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsedData = JSON.parse(content);
                // Basic validation
                if (parsedData.profile && parsedData.data) {
                    setRestoredData(parsedData);
                    setIsRestoreConfirmOpen(true);
                } else {
                    alert('Archivo de respaldo inválido.');
                }
            } catch (error) {
                alert('Error al leer el archivo de respaldo.');
            }
        };
        reader.readAsText(file);
        // Reset file input
        if (event.target) event.target.value = '';
    };

    const handleConfirmRestore = () => {
        if (restoredData) {
            localStorage.setItem('userProfile', JSON.stringify(restoredData.profile));
            localStorage.setItem('appData', JSON.stringify(restoredData.data));
            window.location.reload(); 
        }
        setIsRestoreConfirmOpen(false);
        setRestoredData(null);
    };

    const handleSetData = (type: 'demo' | 'blank') => {
        const dataToSet = type === 'demo' ? DEMO_DATA : BLANK_DATA;
        setData(dataToSet);
        setSuccessInfo({ title: 'Datos Restaurados', message: `La aplicación ahora usa los datos de ${type === 'demo' ? 'demostración' : 'plantilla en blanco'}.` });
    };
    
    const handleConfirmReset = () => {
        deleteAccount();
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Gestión de Datos</h1>

            <SettingsSection
                title="Copia de Seguridad y Restauración"
                description="Guarda todos tus datos en un archivo para transferirlos o como respaldo, o restaura desde un archivo previo."
            >
                <input type="file" ref={fileInputRef} onChange={handleRestoreFileSelect} className="hidden" accept=".iwallet,application/json" />
                <button onClick={handleBackup} className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition">
                    <DownloadIcon className="w-5 h-5"/>
                    Crear Copia de Seguridad (.iwallet)
                </button>
                 <button onClick={() => fileInputRef.current?.click()} className="w-full md:w-auto flex items-center justify-center gap-2 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg transition">
                    Restaurar desde Copia de Seguridad
                </button>
            </SettingsSection>
            
            <SettingsSection
                title="Restablecer Datos"
                description="Estas acciones reemplazan tus datos actuales. La opción 'Restablecer Todo' es irreversible y borrará tu cuenta."
            >
                <div className="flex flex-wrap gap-4">
                    <button onClick={() => handleSetData('demo')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition">Cargar Datos de Demo</button>
                    <button onClick={() => handleSetData('blank')} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition">Reiniciar Datos</button>
                    <button onClick={() => setIsResetConfirmOpen(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition">Restablecer Todo</button>
                </div>
            </SettingsSection>

            <ConfirmationModal
                isOpen={isRestoreConfirmOpen}
                onClose={() => setIsRestoreConfirmOpen(false)}
                onConfirm={handleConfirmRestore}
                title="Confirmar Restauración"
                message="Restaurar desde un archivo reemplazará toda tu información actual, incluyendo tu perfil y datos financieros. Esta acción cerrará tu sesión actual. ¿Estás seguro?"
            />
            <ConfirmationModal
                isOpen={isResetConfirmOpen}
                onClose={() => setIsResetConfirmOpen(false)}
                onConfirm={handleConfirmReset}
                title="Restablecer Aplicación"
                message="¿Estás seguro de que quieres borrar todos tus datos? Esta acción no se puede deshacer y te llevará a la pantalla de configuración inicial."
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
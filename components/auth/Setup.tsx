import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BLANK_DATA, DEMO_DATA } from '../../constants';
import { AppData } from '../../types';
import { WalletIcon, EyeIcon, EyeSlashIcon } from '../Icons';

export const Setup: React.FC = () => {
    const [step, setStep] = useState(1);
    const [profileData, setProfileData] = useState({
        username: '',
        email: '',
        pin: '',
        confirmPin: '',
        securityAnswer1: '',
        securityAnswer2: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { setupAccount } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showPin, setShowPin] = useState(false);
    const [showConfirmPin, setShowConfirmPin] = useState(false);
    const [showSecurityAnswer2, setShowSecurityAnswer2] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateProfile = () => {
        const newErrors: Record<string, string> = {};
        if (!profileData.username.trim()) newErrors.username = 'El nombre de usuario es requerido.';
        if (!profileData.email.trim()) newErrors.email = 'El correo es requerido.';
        if (!/^\S+@\S+\.\S+$/.test(profileData.email)) newErrors.email = 'Formato de correo inválido.';
        if (!/^\d{4,6}$/.test(profileData.pin)) newErrors.pin = 'El PIN debe ser numérico de 4 a 6 dígitos.';
        if (profileData.pin !== profileData.confirmPin) newErrors.confirmPin = 'Los PIN no coinciden.';
        if (!profileData.securityAnswer1) newErrors.securityAnswer1 = 'La fecha es requerida.';
        if (!/^\d{6}$/.test(profileData.securityAnswer2)) newErrors.securityAnswer2 = 'El código secreto debe ser de 6 dígitos.';
        return newErrors;
    };

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validateProfile();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setErrors({});
        setStep(2);
    };

    const handleFinalSetup = async (initialData: AppData) => {
        try {
            await setupAccount({
                username: profileData.username,
                email: profileData.email,
                pin: profileData.pin,
                securityAnswer1: profileData.securityAnswer1,
                securityAnswer2: profileData.securityAnswer2,
            }, initialData);
            navigate('/');
        } catch (err) {
            setErrors({ general: 'Hubo un error al crear la cuenta. Inténtalo de nuevo.' });
            setStep(1);
        }
    };
    
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsedData: AppData = JSON.parse(content);
                // Simple validation
                if ('categories' in parsedData && 'concepts' in parsedData) {
                    handleFinalSetup(parsedData);
                } else {
                    throw new Error('Archivo de respaldo inválido.');
                }
            } catch (error) {
                setErrors({ general: 'El archivo seleccionado no es un respaldo válido.' });
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center items-center mb-6">
                    <WalletIcon className="h-12 w-12 text-primary-600" />
                    <h1 className="text-3xl font-bold ml-3 text-gray-800 dark:text-white">iWallet</h1>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                    {step === 1 ? (
                        <>
                            <h2 className="text-2xl font-bold text-center mb-1">Crea tu Cuenta Local</h2>
                            <p className="text-center text-gray-500 dark:text-gray-400 mb-6">Esta información se guarda solo en tu dispositivo.</p>
                            <form onSubmit={handleProfileSubmit} className="space-y-4">
                                <div>
                                    <input type="text" name="username" placeholder="Nombre de Usuario" value={profileData.username} onChange={handleChange} className="w-full px-4 py-2 rounded-md" />
                                    {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                                </div>
                                 <div>
                                    <input type="email" name="email" placeholder="Correo Electrónico" value={profileData.email} onChange={handleChange} className="w-full px-4 py-2 rounded-md" />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>
                                <div className="relative">
                                    <input type={showPin ? 'text' : 'password'} name="pin" placeholder="PIN (4-6 dígitos)" value={profileData.pin} onChange={handleChange} className="w-full px-4 py-2 rounded-md pr-10" />
                                    <button type="button" onClick={() => setShowPin(!showPin)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500" aria-label={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}>
                                        {showPin ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                                {errors.pin && <p className="text-red-500 text-xs">{errors.pin}</p>}
                                <div className="relative">
                                    <input type={showConfirmPin ? 'text' : 'password'} name="confirmPin" placeholder="Confirmar PIN" value={profileData.confirmPin} onChange={handleChange} className="w-full px-4 py-2 rounded-md pr-10" />
                                    <button type="button" onClick={() => setShowConfirmPin(!showConfirmPin)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500" aria-label={showConfirmPin ? 'Ocultar PIN' : 'Mostrar PIN'}>
                                        {showConfirmPin ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                                {errors.confirmPin && <p className="text-red-500 text-xs">{errors.confirmPin}</p>}
                                
                                <hr className="my-4 border-gray-200 dark:border-gray-600"/>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Preguntas de Seguridad (para recuperación)</p>
                                
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">¿En qué fecha inició el noviazgo con tu esposa?</label>
                                    <input type="date" name="securityAnswer1" value={profileData.securityAnswer1} onChange={handleChange} className="w-full px-4 py-2 rounded-md mt-1" />
                                     {errors.securityAnswer1 && <p className="text-red-500 text-xs mt-1">{errors.securityAnswer1}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">Ingresa tu código secreto (6 dígitos numéricos)</label>
                                    <div className="relative mt-1">
                                        <input type={showSecurityAnswer2 ? 'text' : 'password'} name="securityAnswer2" placeholder="Código Secreto" value={profileData.securityAnswer2} onChange={handleChange} className="w-full px-4 py-2 rounded-md pr-10" pattern="\d{6}" title="Debe ser un código de 6 dígitos."/>
                                        <button type="button" onClick={() => setShowSecurityAnswer2(!showSecurityAnswer2)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500" aria-label={showSecurityAnswer2 ? 'Ocultar código' : 'Mostrar código'}>
                                            {showSecurityAnswer2 ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {errors.securityAnswer2 && <p className="text-red-500 text-xs mt-1">{errors.securityAnswer2}</p>}
                                </div>

                                {errors.general && <p className="text-red-500 text-sm text-center">{errors.general}</p>}
                                <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition">Siguiente</button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-4">¡Un último paso!</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">¿Cómo quieres empezar? Puedes usar datos de demostración o importar un respaldo si ya has usado la app antes.</p>
                            {errors.general && <p className="text-red-500 text-sm text-center mb-4">{errors.general}</p>}
                            <div className="space-y-4">
                                <button onClick={() => handleFinalSetup(BLANK_DATA)} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition">
                                    Comenzar en Blanco
                                </button>
                                 <button onClick={() => handleFinalSetup(DEMO_DATA)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition">
                                    Comenzar con Datos de Ejemplo
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".iwallet,application/json" />
                                <button onClick={handleImportClick} className="w-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 text-gray-800 dark:text-gray-200 font-bold py-3 px-4 rounded-lg">
                                    Importar Respaldo (.iwallet)
                                </button>
                                <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:underline mt-4">
                                    Volver atrás
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { WalletIcon, EyeIcon, EyeSlashIcon } from '../Icons';

export const Login: React.FC = () => {
    const [pin, setPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { login, userProfile } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        const success = await login(pin);
        if (success) {
            navigate('/');
        } else {
            setError('PIN incorrecto. Inténtalo de nuevo.');
            setPin('');
        }
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col justify-center items-center min-h-screen p-4">
             <div className="flex justify-center items-center mb-6">
                <WalletIcon className="h-12 w-12 text-primary-400" />
                <h1 className="text-3xl font-bold ml-3 text-white">iWallet</h1>
            </div>

            <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-8 text-center text-white">
                 <img src={`https://i.pravatar.cc/80?u=${userProfile?.email}`} alt="Avatar" className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-primary-500/50" />
                 <h2 className="text-xl font-bold mb-2">¡Hola, {userProfile?.username}!</h2>
                 <p className="text-gray-300 mb-6">Ingresa tu PIN para continuar</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <input
                            type={showPin ? 'text' : 'password'}
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full px-4 py-3 rounded-md text-center text-2xl tracking-widest pr-12"
                            placeholder="••••"
                            maxLength={6}
                            autoFocus
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400"
                            aria-label={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                        >
                            {showPin ? <EyeSlashIcon className="h-6 w-6" /> : <EyeIcon className="h-6 w-6" />}
                        </button>
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:bg-primary-400">
                        {isLoading ? 'Verificando...' : 'Desbloquear'}
                    </button>
                </form>
                 <div className="mt-6">
                    <Link to="/recover" className="text-sm text-primary-400 hover:underline">
                        ¿Olvidaste tu PIN?
                    </Link>
                </div>
            </div>
        </div>
    );
};
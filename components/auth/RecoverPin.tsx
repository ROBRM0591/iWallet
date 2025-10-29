import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { WalletIcon, EyeIcon, EyeSlashIcon } from '../Icons';

export const RecoverPin: React.FC = () => {
    const [step, setStep] = useState(1);
    const [answers, setAnswers] = useState({ answer1: '', answer2: '' });
    const [newPin, setNewPin] = useState({ pin: '', confirmPin: '' });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { verifySecurityAnswers, recoverPin } = useAuth();
    const navigate = useNavigate();
    const [showAnswer2, setShowAnswer2] = useState(false);
    const [showNewPin, setShowNewPin] = useState(false);
    const [showConfirmPin, setShowConfirmPin] = useState(false);

    const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAnswers(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewPin(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleVerifyAnswers = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if(!answers.answer1 || !answers.answer2){
            setError('Ambas respuestas son requeridas.');
            return;
        }
        setIsLoading(true);
        const success = await verifySecurityAnswers(answers);
        if (success) {
            setStep(2);
        } else {
            setError('Una o más respuestas son incorrectas.');
        }
        setIsLoading(false);
    };

    const handleResetPin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!/^\d{4,6}$/.test(newPin.pin)) {
            setError('El PIN debe ser numérico y tener entre 4 y 6 dígitos.');
            return;
        }
        if (newPin.pin !== newPin.confirmPin) {
            setError('El nuevo PIN no coincide.');
            return;
        }

        setIsLoading(true);
        const success = await recoverPin(answers, newPin.pin);
        if (success) {
            alert('¡PIN actualizado con éxito! Serás redirigido para iniciar sesión.');
            navigate('/login');
        } else {
            setError('Ocurrió un error inesperado. Vuelve a intentarlo.');
            setStep(1);
        }
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col justify-center items-center min-h-screen p-4">
             <div className="flex justify-center items-center mb-6">
                <WalletIcon className="h-12 w-12 text-primary-500 dark:text-primary-400" />
                <h1 className="text-3xl font-bold ml-3 text-gray-900 dark:text-white">iWallet</h1>
            </div>
            <div className="w-full max-w-md bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white rounded-2xl shadow-xl p-8">
                {step === 1 ? (
                    <>
                        <h2 className="text-2xl font-bold text-center mb-2">Recuperar PIN</h2>
                        <p className="text-center text-gray-600 dark:text-gray-300 mb-6">Responde tus preguntas de seguridad.</p>
                        <form onSubmit={handleVerifyAnswers} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">¿En qué fecha inició el noviazgo con tu esposa?</label>
                                <input type="date" name="answer1" value={answers.answer1} onChange={handleAnswerChange} className="mt-1 w-full px-4 py-2 rounded-md" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ingresa tu código secreto (6 dígitos)</label>
                                <div className="relative mt-1">
                                    <input type={showAnswer2 ? 'text' : 'password'} name="answer2" value={answers.answer2} onChange={handleAnswerChange} className="w-full px-4 py-2 rounded-md pr-10" required pattern="\d{6}" />
                                    <button type="button" onClick={() => setShowAnswer2(!showAnswer2)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400" aria-label={showAnswer2 ? 'Ocultar código' : 'Mostrar código'}>
                                        {showAnswer2 ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                            {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}
                            <button type="submit" disabled={isLoading} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition">
                                {isLoading ? 'Verificando...' : 'Verificar Respuestas'}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-center mb-2">Establecer Nuevo PIN</h2>
                        <p className="text-center text-gray-600 dark:text-gray-300 mb-6">Tus respuestas fueron correctas. Ingresa tu nuevo PIN.</p>
                        <form onSubmit={handleResetPin} className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nuevo PIN (4-6 dígitos)</label>
                                <div className="relative">
                                    <input type={showNewPin ? 'text' : 'password'} name="pin" value={newPin.pin} onChange={handlePinChange} className="w-full px-4 py-2 rounded-md pr-10" required />
                                    <button type="button" onClick={() => setShowNewPin(!showNewPin)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400" aria-label={showNewPin ? 'Ocultar PIN' : 'Mostrar PIN'}>
                                        {showNewPin ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Nuevo PIN</label>
                                <div className="relative">
                                    <input type={showConfirmPin ? 'text' : 'password'} name="confirmPin" value={newPin.confirmPin} onChange={handlePinChange} className="w-full px-4 py-2 rounded-md pr-10" required />
                                    <button type="button" onClick={() => setShowConfirmPin(!showConfirmPin)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400" aria-label={showConfirmPin ? 'Ocultar PIN' : 'Mostrar PIN'}>
                                        {showConfirmPin ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                            {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}
                            <button type="submit" disabled={isLoading} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition">
                                {isLoading ? 'Guardando...' : 'Guardar Nuevo PIN'}
                            </button>
                        </form>
                    </>
                )}
                <div className="mt-6 text-center">
                    <Link to="/login" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                        Volver a Inicio de Sesión
                    </Link>
                </div>
            </div>
        </div>
    );
};
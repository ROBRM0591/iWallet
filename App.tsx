import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MainLayout } from './components/MainLayout';
import { WalletIcon } from './components/Icons';
import { Dashboard } from './components/Dashboard';
import { DailyExpenses } from './components/DailyExpenses';
import { Incomes } from './components/Incomes';
import { Catalogs } from './components/Catalogs';
import { Budget } from './components/Budget';
import { PlannedExpenses } from './components/PlannedExpenses';
import { SavingsGoals } from './components/SavingsGoals';
import { Reports } from './components/Reports';
import { DebtCalculator } from './components/DebtCalculator';
import { UserManual } from './components/UserManual';
import { Settings } from './components/Settings';
import { ChatHistory } from './components/ChatHistory';
import { Setup } from './components/auth/Setup';
import { Login } from './components/auth/Login';
import { RecoverPin } from './components/auth/RecoverPin';

const LoadingScreen: React.FC = () => (
    <div className="flex flex-col justify-center items-center h-screen bg-slate-50 dark:bg-slate-900">
        <WalletIcon className="h-16 w-16 text-primary-500 animate-pulse" />
        <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Cargando iWallet...</p>
    </div>
);

const AppRoutes: React.FC = () => {
    const { isLoading, userProfile, isAuthenticated } = useAuth();

    if (isLoading) {
        return <LoadingScreen />;
    }
    
    // Nuevo usuario, debe configurar su cuenta
    if (!userProfile) {
        return (
             <Routes>
                <Route path="/setup" element={<Setup />} />
                <Route path="*" element={<Navigate to="/setup" replace />} />
            </Routes>
        );
    }

    // Usuario existente, no autenticado
    if (!isAuthenticated) {
        return (
             <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/recover" element={<RecoverPin />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    // Usuario autenticado
    return (
        <Routes>
            <Route path="/" element={<MainLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="incomes" element={<Incomes />} />
                <Route path="daily-expenses" element={<DailyExpenses />} />
                <Route path="catalogs" element={<Catalogs />} />
                <Route path="budget" element={<Budget />} />
                <Route path="planned-expenses" element={<PlannedExpenses />} />
                <Route path="savings-goals" element={<SavingsGoals />} />
                <Route path="reports" element={<Reports />} />
                <Route path="debt-calculator" element={<DebtCalculator />} />
                <Route path="manual" element={<UserManual />} />
                <Route path="settings" element={<Settings />} />
                <Route path="ai-assistant" element={<ChatHistory />} />
            </Route>
            {/* Si un usuario autenticado intenta acceder a rutas públicas, redirigir a la página principal */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/recover" element={<Navigate to="/" replace />} />
            <Route path="/setup" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <HashRouter>
                <AppRoutes />
            </HashRouter>
        </AuthProvider>
    );
};

export default App;

import React, { useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { MainLayout } from './components/MainLayout';
import { Setup } from './components/auth/Setup';
import { Login } from './components/auth/Login';
import { RecoverPin } from './components/auth/RecoverPin';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
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


const LoadingScreen: React.FC = () => (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-900">
        <WalletIcon className="h-16 w-16 text-primary-500 animate-pulse" />
        <p className="mt-4 text-lg font-semibold text-gray-300">Cargando iWallet...</p>
    </div>
);

const AppRoutes: React.FC = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("AuthContext not found");
    }

    const { isLoading, isAuthenticated, userProfile } = context;

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
            <Route path="/setup" element={!userProfile ? <Setup /> : <Navigate to="/login" />} />
            <Route path="/recover" element={!isAuthenticated ? <RecoverPin /> : <Navigate to="/" />} />
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            >
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

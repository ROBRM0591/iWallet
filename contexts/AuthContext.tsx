import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { AppData } from '../types';
import { DEMO_DATA } from '../constants';

export interface UserProfile {
    username: string;
    email: string;
    avatar?: string;
}

interface AuthContextType {
  appData: AppData; // No longer nullable
  setData: (data: AppData) => void;
  isLoading: boolean;
  setupAccount: (profile: any, initialData: AppData) => Promise<void>;
  login: (pin: string) => Promise<boolean>;
  userProfile: UserProfile | null;
  verifySecurityAnswers: (answers: { answer1: string; answer2: string; }) => Promise<boolean>;
  recoverPin: (answers: { answer1: string; answer2:string; }, newPin: string) => Promise<boolean>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // By providing DEMO_DATA as the fallback, useLocalStorage ensures appData is never null.
  // It will either load existing data from localStorage or use DEMO_DATA.
  const [appData, setAppData] = useLocalStorage<AppData>('iwallet-data', DEMO_DATA);

  // Since useLocalStorage initializes synchronously, the loading state is no longer needed.
  // We keep it as `false` to avoid breaking components that might use it.
  const isLoading = false;

  // Dummy implementations for unused auth functions
  const setupAccount = async (profile: any, initialData: AppData) => { console.log('setupAccount called', profile, initialData); };
  const login = async (pin: string) => { console.log('login called with pin', pin); return true; };
  const userProfile = null;
  const verifySecurityAnswers = async (answers: any) => { console.log('verifySecurityAnswers called', answers); return true; };
  const recoverPin = async (answers: any, newPin: string) => { console.log('recoverPin called', answers, newPin); return true; };
  const isAuthenticated = !!appData;

  return (
    <AuthContext.Provider value={{ 
        appData,
        // FIX: Correctly provide `setData` by aliasing `setAppData` from the `useLocalStorage` hook.
        setData: setAppData, 
        isLoading,
        setupAccount,
        login,
        userProfile,
        verifySecurityAnswers,
        recoverPin,
        isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
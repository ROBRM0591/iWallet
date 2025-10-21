import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { AppData, UserProfile, LocalSession } from '../types';
import { hashString } from '../utils/crypto';
import { BLANK_DATA } from '../constants';

interface AuthContextType {
  isAuthenticated: boolean;
  userProfile: UserProfile | null;
  appData: AppData | null;
  isLoading: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  setupAccount: (profile: Omit<UserProfile, 'pinHash' | 'securityAnswer2Hash'> & { pin: string; securityAnswer2: string }, initialData: AppData) => Promise<void>;
  recoverPin: (answers: { answer1: string; answer2: string }, newPin: string) => Promise<boolean>;
  verifySecurityAnswers: (answers: { answer1: string; answer2: string }) => Promise<boolean>;
  setData: (data: AppData) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [localSession, setLocalSession] = useLocalStorage<LocalSession>('iwallet-session', { userProfile: null, appData: null });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const bootstrap = async () => {
        // To temporarily disable the login system for development/demo,
        // we check if a user profile exists. If not, we create a default one.
        // Then, we automatically set the user as authenticated.
        if (!localSession.userProfile) {
            const pinHash = await hashString('1234');
            const securityAnswer2Hash = await hashString('123456');
            const defaultProfile: UserProfile = {
                username: 'Usuario',
                email: 'usuario@iwallet.app',
                pinHash,
                securityAnswer1: '2024-01-01',
                securityAnswer2Hash,
            };
            setLocalSession({ userProfile: defaultProfile, appData: BLANK_DATA });
        } else if (!localSession.appData) {
            // If profile exists but data is missing, provide initial data.
            setLocalSession(prev => ({ ...prev, appData: BLANK_DATA }));
        }

        setIsAuthenticated(true);
        setIsLoading(false);
    };

    bootstrap();
  }, []);

  const login = async (pin: string): Promise<boolean> => {
    if (!localSession.userProfile) return false;

    const pinHash = await hashString(pin);
    if (pinHash === localSession.userProfile.pinHash) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    // With auto-login enabled, logout only works for the current session.
    // A page refresh will log the user back in automatically.
    setIsAuthenticated(false);
  };

  const setupAccount = async (profile: Omit<UserProfile, 'pinHash' | 'securityAnswer2Hash'> & { pin: string; securityAnswer2: string }, initialData: AppData) => {
    const pinHash = await hashString(profile.pin);
    const securityAnswer2Hash = await hashString(profile.securityAnswer2);
    
    const newUserProfile: UserProfile = {
        username: profile.username,
        email: profile.email,
        pinHash,
        securityAnswer1: profile.securityAnswer1,
        securityAnswer2Hash,
    };
    
    setLocalSession({ userProfile: newUserProfile, appData: initialData });
    setIsAuthenticated(true); // Automatically log in after setup
  };

    const verifySecurityAnswers = async (answers: { answer1: string; answer2: string }): Promise<boolean> => {
        if (!localSession.userProfile) return false;

        const answer2Hash = await hashString(answers.answer2);

        return (
            answers.answer1 === localSession.userProfile.securityAnswer1 &&
            answer2Hash === localSession.userProfile.securityAnswer2Hash
        );
    };

    const recoverPin = async (answers: { answer1: string; answer2: string }, newPin: string): Promise<boolean> => {
        const areAnswersCorrect = await verifySecurityAnswers(answers);
        if (areAnswersCorrect && localSession.userProfile) {
            const newPinHash = await hashString(newPin);
            const updatedProfile = { ...localSession.userProfile, pinHash: newPinHash };
            setLocalSession(prev => ({ ...prev, userProfile: updatedProfile }));
            return true;
        }
        return false;
    };

    const setData = (data: AppData) => {
        setLocalSession(prev => ({ ...prev, appData: data }));
    };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      userProfile: localSession.userProfile,
      appData: localSession.appData,
      isLoading,
      login,
      logout,
      setupAccount,
      recoverPin,
      verifySecurityAnswers,
      setData
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
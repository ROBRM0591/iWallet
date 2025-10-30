import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppData } from '../types';
import { DEMO_DATA } from '../constants';
import { hashString } from '../utils/crypto';

interface UserProfile {
    username: string;
    email: string;
    pinHash: string;
    securityAnswer1Hash: string;
    securityAnswer2Hash: string;
    avatar?: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    userProfile: UserProfile | null;
    appData: AppData | null;
    isLoading: boolean;
    setData: (data: AppData) => void;
    login: (pin: string) => Promise<boolean>;
    logout: () => void;
    setupAccount: (profile: any, initialData: AppData) => Promise<void>;
    verifySecurityAnswers: (answers: { answer1: string, answer2: string }) => Promise<boolean>;
    recoverPin: (answers: { answer1: string, answer2: string }, newPin: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [appData, setAppData] = useState<AppData | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const storedProfile = localStorage.getItem('userProfile');
            const storedData = localStorage.getItem('appData');

            if (storedProfile) {
                setUserProfile(JSON.parse(storedProfile));
            }
            
            if (storedData && storedData !== "undefined") {
                setAppData(JSON.parse(storedData));
            } else if (!storedProfile) {
                // If there's no profile (first time setup), we don't load any data yet
                setAppData(null);
            } else {
                // If there is a profile but no data, load demo data as a fallback
                setAppData(DEMO_DATA);
            }
            
        } catch (error) {
            console.error("Error al cargar datos del localStorage.", error);
            localStorage.removeItem('userProfile');
            localStorage.removeItem('appData');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (appData && !isLoading) {
            localStorage.setItem('appData', JSON.stringify(appData));
        }
    }, [appData, isLoading]);

    useEffect(() => {
        if (userProfile && !isLoading) {
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
        }
    }, [userProfile, isLoading]);


    const setData = (newData: AppData) => {
        setAppData(newData);
    };

    const login = async (pin: string): Promise<boolean> => {
        if (!userProfile) return false;
        const pinHash = await hashString(pin);
        if (pinHash === userProfile.pinHash) {
            setIsAuthenticated(true);
            return true;
        }
        return false;
    };
    
    const logout = () => {
        setIsAuthenticated(false);
    }
    
    const setupAccount = async (profile: any, initialData: AppData) => {
        const [pinHash, securityAnswer1Hash, securityAnswer2Hash] = await Promise.all([
            hashString(profile.pin),
            hashString(profile.securityAnswer1),
            hashString(profile.securityAnswer2)
        ]);
        
        const newUserProfile: UserProfile = {
            username: profile.username,
            email: profile.email,
            pinHash,
            securityAnswer1Hash,
            securityAnswer2Hash,
            avatar: `https://i.pravatar.cc/80?u=${profile.email}`
        };
        
        setUserProfile(newUserProfile);
        setAppData(initialData);
        setIsAuthenticated(true);
    };

    const verifySecurityAnswers = async (answers: { answer1: string, answer2: string }): Promise<boolean> => {
        if (!userProfile) return false;
        const [answer1Hash, answer2Hash] = await Promise.all([
            hashString(answers.answer1),
            hashString(answers.answer2)
        ]);
        return answer1Hash === userProfile.securityAnswer1Hash && answer2Hash === userProfile.securityAnswer2Hash;
    };
    
    const recoverPin = async (answers: { answer1: string, answer2: string }, newPin: string): Promise<boolean> => {
        const areAnswersValid = await verifySecurityAnswers(answers);
        if (areAnswersValid && userProfile) {
            const newPinHash = await hashString(newPin);
            setUserProfile({ ...userProfile, pinHash: newPinHash });
            return true;
        }
        return false;
    };


    const value: AuthContextType = { 
        appData, 
        setData, 
        isAuthenticated, 
        userProfile,
        isLoading,
        login,
        logout,
        setupAccount,
        verifySecurityAnswers,
        recoverPin
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};
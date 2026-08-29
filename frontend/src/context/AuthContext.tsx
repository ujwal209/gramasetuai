'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  type UserProfile,
  authSignUp,
  authVerifyOtp,
  authResendOtp,
  authLogin,
  authForgotPassword,
  authResetPassword,
  authGetMyProfile,
  authUpdateProfile,
  type GenericAuthMsg,
  type AuthResponse,
} from '../services/api';

export type AuthMode = 'login' | 'signup' | 'verify' | 'forgot' | 'reset' | 'onboarding';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  isInitialized: boolean;
  isAuthModalOpen: boolean;
  authModalMode: AuthMode;
  pendingEmail: string;
  openAuthModal: (mode?: AuthMode, email?: string) => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: AuthMode) => void;
  setPendingEmail: (email: string) => void;
  handleLogin: (identifier: string, pass: string) => Promise<AuthResponse>;
  handleSignUp: (name: string, email: string, handle: string, pass: string) => Promise<GenericAuthMsg>;
  handleVerifyOtp: (email: string, otp: string) => Promise<AuthResponse>;
  handleResendOtp: (email: string, type?: 'signup' | 'reset') => Promise<GenericAuthMsg>;
  handleForgotPassword: (email: string) => Promise<GenericAuthMsg>;
  handleResetPassword: (email: string, otp: string, newPass: string) => Promise<GenericAuthMsg>;
  handleUpdateProfile: (data: Partial<UserProfile>) => Promise<UserProfile>;
  handleLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('login');
  const [pendingEmail, setPendingEmail] = useState<string>('');

  // Hydrate user from localStorage on mount
  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('gramsetu_jwt_token') : null;
    if (savedToken) {
      setToken(savedToken);
      authGetMyProfile()
        .then((profile) => {
          setUser(profile);
        })
        .catch((err) => {
          console.warn('Session verification notice:', err);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('gramsetu_jwt_token');
          }
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
          setIsInitialized(true);
        });
    } else {
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  const openAuthModal = useCallback((mode: AuthMode = 'login', email: string = '') => {
    setAuthModalMode(mode);
    if (email) setPendingEmail(email);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const handleLogin = async (identifier: string, pass: string): Promise<AuthResponse> => {
    const res = await authLogin({ login_identifier: identifier, password: pass });
    if (typeof window !== 'undefined' && res.access_token) {
      localStorage.setItem('gramsetu_jwt_token', res.access_token);
    }
    setToken(res.access_token);
    setUser(res.user);
    setIsAuthModalOpen(false);
    return res;
  };

  const handleSignUp = async (name: string, email: string, handle: string, pass: string): Promise<GenericAuthMsg> => {
    const res = await authSignUp({ name, email, handle, password: pass });
    setPendingEmail(email);
    setAuthModalMode('verify');
    return res;
  };

  const handleVerifyOtp = async (email: string, otp: string): Promise<AuthResponse> => {
    const res = await authVerifyOtp({ email, otp });
    if (typeof window !== 'undefined' && res.access_token) {
      localStorage.setItem('gramsetu_jwt_token', res.access_token);
    }
    setToken(res.access_token);
    setUser(res.user);
    if (!res.user.primary_crop || !res.user.state) {
      setAuthModalMode('onboarding');
    } else {
      setIsAuthModalOpen(false);
    }
    return res;
  };

  const handleResendOtp = async (email: string, type: 'signup' | 'reset' = 'signup'): Promise<GenericAuthMsg> => {
    return await authResendOtp(email, type);
  };

  const handleForgotPassword = async (email: string): Promise<GenericAuthMsg> => {
    const res = await authForgotPassword(email);
    setPendingEmail(email);
    setAuthModalMode('reset');
    return res;
  };

  const handleResetPassword = async (email: string, otp: string, newPass: string): Promise<GenericAuthMsg> => {
    const res = await authResetPassword({ email, otp, new_password: newPass });
    setAuthModalMode('login');
    return res;
  };

  const handleUpdateProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const updated = await authUpdateProfile(data);
    setUser(updated);
    setIsAuthModalOpen(false);
    return updated;
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gramsetu_jwt_token');
    }
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isInitialized,
        isAuthModalOpen,
        authModalMode,
        pendingEmail,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
        setPendingEmail,
        handleLogin,
        handleSignUp,
        handleVerifyOtp,
        handleResendOtp,
        handleForgotPassword,
        handleResetPassword,
        handleUpdateProfile,
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

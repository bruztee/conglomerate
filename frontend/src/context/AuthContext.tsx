'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: string;
  referral_code?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  register: (email: string, password: string, referralCode?: string) => Promise<{ success: boolean; error?: any }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const response = await api.getMe();
    if (response.success && response.data) {
      setUser(response.data as User);
    } else {
      setUser(null);
      api.setAccessToken(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      
      if (token) {
        api.setAccessToken(token);
        await refreshUser();
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    
    if (response.success && response.data?.user) {
      setUser(response.data.user);
      return { success: true };
    }
    
    return { success: false, error: response.error };
  };

  const register = async (email: string, password: string, referralCode?: string) => {
    const response = await api.register(email, password, referralCode);
    
    if (response.success && response.data) {
      setUser(response.data as any as User);
      return { success: true };
    }
    
    return { success: false, error: response.error };
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

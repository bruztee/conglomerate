'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: string;
  referral_code?: string;
  full_name?: string | null;
  is_phone_verified?: boolean;
  phone?: string | null;
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
    try {
      const response = await api.me();
      if (response.success && response.data) {
        const data = response.data as any;
        if (data.user) {
          const userData = data.user as User;
          setUser(userData);
        } else {
          setUser(null);
          api.setAccessToken(null);
        }
      } else {
        setUser(null);
        api.setAccessToken(null);
      }
    } catch (error) {
      // Не очищаємо токен при помилці мережі - можливо тимчасова проблема
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      try {
        await refreshUser();
      } catch (error) {
        // Silent fail on init
      }
      
      // Тільки оновлюємо стан якщо компонент ще змонтований
      if (isMounted) {
        setLoading(false);
      }
    };

    initAuth();
    
    // Cleanup функція для запобігання race condition при швидких refresh
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    
    if (response.success && response.data?.user) {
      setUser(response.data.user);
      // Refresh user to get full data including phone verification status
      await refreshUser();
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
    // httpOnly cookie очищується сервером через Set-Cookie
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

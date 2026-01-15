'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: string;
  referral_code?: string;
  full_name?: string | null;
  phone_verified?: boolean;
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
        }
      } else {
        // Якщо api.me() повернув помилку, але це може бути через застарілий токен
        // api.request() вже спробував зробити refresh автоматично
        // Якщо ми тут - значить refresh теж не вдався
        if (response.error?.code === 'UNAUTHORIZED') {
          console.log('❌ Session expired, clearing user');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('refreshUser error:', error);
      // Не очищаємо user при network error - можливо тимчасова проблема
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
    
    if (response.success) {
      // НЕ встановлюємо user після register - email ще не верифікований
      // Register page покаже verification message
      return { success: true };
    }
    
    return { success: false, error: response.error };
  };

  const logout = async () => {
    setLoading(true);
    await api.logout();
    setUser(null);
    setLoading(false);
    // httpOnly cookie очищується сервером через Set-Cookie
    // Redirect на login після logout
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
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

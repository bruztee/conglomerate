'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';
import { mutate } from 'swr';

interface User {
  id: string;
  email: string;
  role: string;
  referral_code?: string;
  full_name?: string | null;
  phone_verified?: boolean;
  phone?: string | null;
  deposit_limits?: {
    min_deposit: number;
    max_deposit: number;
    user_max_deposit: number | null;
    global_max_deposit: number;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  register: (email: string, password: string, referralCode?: string) => Promise<{ success: boolean; error?: any }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

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
          console.log('Session expired, clearing user');
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
      } finally {
        // Mark as initialized regardless of result
        if (isMounted) {
          setInitialized(true);
        }
      }
    };

    initAuth();
    
    // Cleanup функція для запобігання race condition при швидких refresh
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    // НЕ викликаємо setLoading() - це trigger re-render LoginForm і губить error state
    // LoginForm має свій власний local loading state
    const response = await api.login(email, password);
    
    if (response.success && response.data?.user) {
      setUser(response.data.user);
      setInitialized(true); // Гарантуємо що initialized=true після успішного логіну
      return { success: true };
    }
    
    return { success: false, error: response.error };
  };

  const register = async (email: string, password: string, referralCode?: string) => {
    // НЕ викликаємо setLoading() - RegisterForm має свій local loading
    const response = await api.register(email, password, referralCode);
    
    if (response.success) {
      // НЕ встановлюємо user після register - email ще не верифікований
      return { success: true };
    }
    
    return { success: false, error: response.error };
  };

  const logout = async () => {
    setLoading(true);
    await api.logout();
    setUser(null);
    
    // Очистити весь SWR кеш
    mutate(() => true, undefined, { revalidate: false });
    
    setLoading(false);
    // httpOnly cookie очищується сервером через Set-Cookie
    // Redirect на login після logout
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, initialized, login, register, logout, refreshUser }}>
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
    }
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('access_token', token);
        document.cookie = `access_token=${token}; path=/; max-age=604800; samesite=strict`;
      } else {
        localStorage.removeItem('access_token');
        document.cookie = 'access_token=; path=/; max-age=0';
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || { code: 'UNKNOWN_ERROR', message: 'Unknown error' },
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  // Auth
  async register(email: string, password: string, referralCode?: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, referral_code: referralCode }),
    });
  }

  async login(email: string, password: string) {
    const response = await this.request<{ user: any; session: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data?.session) {
      this.setAccessToken(response.data.session.access_token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', response.data.session.refresh_token);
      }
    }

    return response;
  }

  async logout() {
    const response = await this.request('/api/auth/logout', {
      method: 'POST',
    });
    this.setAccessToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('refresh_token');
    }
    return response;
  }

  async refreshToken() {
    if (typeof window === 'undefined') return { success: false };
    
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return { success: false };

    const response = await this.request<{ session: any }>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (response.success && response.data?.session) {
      this.setAccessToken(response.data.session.access_token);
      localStorage.setItem('refresh_token', response.data.session.refresh_token);
    }

    return response;
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  async resendVerification(email: string) {
    return this.request('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async forgotPassword(email: string) {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(password: string, access_token: string) {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ password, access_token }),
    });
  }

  // Wallet
  async getWallet() {
    return this.request('/api/wallet');
  }

  async getTransactions(limit = 50, offset = 0) {
    return this.request(`/api/transactions?limit=${limit}&offset=${offset}`);
  }

  // Deposits
  async createDeposit(amount: number, provider = 'manual', paymentDetails = {}) {
    return this.request('/api/deposits', {
      method: 'POST',
      body: JSON.stringify({ amount, provider, payment_details: paymentDetails }),
    });
  }

  async getDeposits() {
    return this.request('/api/deposits');
  }

  // Withdrawals
  async createWithdrawal(amount: number, destination: any) {
    return this.request('/api/withdrawals', {
      method: 'POST',
      body: JSON.stringify({ amount, destination }),
    });
  }

  async getWithdrawals() {
    return this.request('/api/withdrawals');
  }

  // Investments
  async getInvestmentPlans() {
    return this.request('/api/investment-plans');
  }

  async createInvestment(planId: string, amount: number) {
    return this.request('/api/investments', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId, amount }),
    });
  }

  async getInvestments() {
    return this.request('/api/investments');
  }
}

export const api = new ApiClient(API_URL);

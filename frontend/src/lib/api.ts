const API_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? '') ||
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8787');

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
  private isRefreshing = false;
  private refreshPromise: Promise<ApiResponse> | null = null;
  
  // Cache & deduplication for me()
  private meCache: { data: ApiResponse; timestamp: number } | null = null;
  private mePromise: Promise<ApiResponse> | null = null;
  private readonly ME_CACHE_TTL = 60 * 1000; // 60 seconds

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // httpOnly cookie встановлюється сервером - не читаємо localStorage
  }

  setAccessToken(token: string | null) {
    // Deprecated: using httpOnly cookies
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // НЕ додаємо Authorization header - покладаємось тільки на httpOnly cookie
    // Cookie відправляється автоматично через credentials: 'include'

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include', // КРИТИЧНО: Відправляти httpOnly cookies автоматично
      });

      const data = await response.json();

      // AUTO-REFRESH: Якщо 401 і JWT expired - refresh tokens і retry
      if (
        response.status === 401 &&
        !endpoint.includes('/auth/refresh') &&
        !endpoint.includes('/auth/login') &&
        !endpoint.includes('/auth/register') &&
        !isRetry
      ) {
        console.log('JWT expired (401), attempting token refresh...');
        
        // Якщо вже йде refresh - чекаємо на нього
        if (this.isRefreshing && this.refreshPromise) {
          console.log('Waiting for ongoing refresh...');
          await this.refreshPromise;
        } else {
          // Стартуємо новий refresh
          this.isRefreshing = true;
          this.refreshPromise = this.refreshToken();
          
          const refreshResult = await this.refreshPromise;
          
          this.isRefreshing = false;
          this.refreshPromise = null;
          
          if (!refreshResult.success) {
            console.log('Token refresh failed - session expired');
            return {
              success: false,
              error: { code: 'SESSION_EXPIRED', message: 'Session expired' },
            };
          }
          
          console.log('Tokens refreshed successfully');
        }
        
        // Retry original request with new tokens
        console.log('Retrying original request...');
        return this.request<T>(endpoint, options, true);
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data || { code: 'UNKNOWN_ERROR', message: 'Unknown error' },
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
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, referral_code: referralCode }),
    });
  }

  async login(email: string, password: string) {
    const response = await this.request<{ user: any; session: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // ✅ httpOnly cookies (access_token + refresh_token) встановлюються СЕРВЕРОМ
    // НЕ зберігаємо нічого в localStorage - все через httpOnly cookies для безпеки
    
    // Clear cache to force fresh me() after login
    this.meCache = null;

    return response;
  }

  async logout() {
    const response = await this.request('/auth/logout', { method: 'POST' });
    // Clear cache
    this.meCache = null;
    
    // Manual cookie cleanup (httpOnly cookies should be cleared by server, but ensure all are gone)
    if (typeof document !== 'undefined') {
      // Clear all auth-related cookies
      const cookies = ['access_token', 'refresh_token', 'auth_flow'];
      cookies.forEach(name => {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
        document.cookie = `${name}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
      });
    }
    
    return response;
  }

  async me() {
    const now = Date.now();
    
    // Return cached data if fresh
    if (this.meCache && (now - this.meCache.timestamp) < this.ME_CACHE_TTL) {
      return this.meCache.data;
    }
    
    // Deduplicate concurrent requests
    if (this.mePromise) {
      return this.mePromise;
    }
    
    // Make fresh request
    this.mePromise = this.request('/auth/me', { method: 'GET' });
    
    try {
      const response = await this.mePromise;
      
      // Cache successful responses
      if (response.success) {
        this.meCache = { data: response, timestamp: now };
      } else {
        // Clear cache on error
        this.meCache = null;
      }
      
      return response;
    } finally {
      this.mePromise = null;
    }
  }

  async refreshToken() {
    // refresh_token читається з httpOnly cookie автоматично
    const response = await this.request<{ session: any }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({}), // Empty body - token читається з cookie на backend
    });

    // httpOnly cookies оновлюються СЕРВЕРОМ через Set-Cookie

    return response;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async resendVerification(email: string) {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(password: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async updateEmail(email: string) {
    return this.request('/auth/update-email', {
      method: 'PUT',
      body: JSON.stringify({ email }),
    });
  }

  async updatePhone(phone: string) {
    return this.request('/auth/update-phone', {
      method: 'PUT',
      body: JSON.stringify({ phone }),
    });
  }

  async updatePassword(password: string) {
    return this.request('/auth/update-password', {
      method: 'PUT',
      body: JSON.stringify({ password }),
    });
  }

  async setName(full_name: string) {
    return this.request('/auth/set-name', {
      method: 'POST',
      body: JSON.stringify({ full_name }),
    });
  }

  async sendPhoneOTP(phone: string) {
    return this.request('/auth/send-phone-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyPhoneOTP(phone: string, token: string) {
    return this.request('/auth/verify-phone-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, token }),
    });
  }

  // Wallet
  async getWallet() {
    return this.request('/wallet');
  }

  async getTransactions(limit = 50, offset = 0) {
    return this.request(`/transactions?limit=${limit}&offset=${offset}`);
  }

  // Deposits
  async createDeposit(amount: number, currency?: string, network?: string, paymentMethodId?: string, walletAddress?: string) {
    return this.request('/deposits', {
      method: 'POST',
      body: JSON.stringify({ 
        amount, 
        deposit_currency: currency,
        deposit_network: network,
        payment_method_id: paymentMethodId,
        payment_details: walletAddress ? { wallet_address: walletAddress } : {}
      }),
    });
  }

  async getDeposits() {
    return this.request('/deposits');
  }

  // Investments
  async getInvestmentPlans() {
    return this.request('/investment-plans');
  }

  async createInvestment(planId: string, amount: number) {
    return this.request('/investments', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId, amount }),
    });
  }

  async getInvestments() {
    return this.request('/investments');
  }

  // Withdrawals
  async getWithdrawals() {
    return this.request('/withdrawals');
  }

  async createWithdrawal(data: { 
    amount?: number; 
    close?: boolean; 
    destination: any; 
    selected_deposit_id?: string;
  }) {
    return this.request('/withdrawals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Referrals
  async getReferralStats(): Promise<ApiResponse> {
    return this.request('/referrals/stats', { method: 'GET' });
  }

  async setReferralCookie(refCode: string): Promise<ApiResponse> {
    return this.request(`/referrals/set-cookie?ref=${refCode}`, { method: 'POST' });
  }

  // Payment Methods (Public)
  async getActivePaymentMethods(): Promise<ApiResponse> {
    return this.request('/payment-methods/active', { method: 'GET' });
  }

  // ==================== ADMIN API ====================

  // Payment Methods (Admin)
  async adminGetPaymentMethods(): Promise<ApiResponse> {
    return this.request('/admin/payment-methods', { method: 'GET' });
  }

  async adminCreatePaymentMethod(data: { currency: string; network: string; wallet_address: string; is_active?: boolean; min_amount?: number }): Promise<ApiResponse> {
    return this.request('/admin/payment-methods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async adminUpdatePaymentMethod(id: string, data: { currency?: string; network?: string; wallet_address?: string; is_active?: boolean; min_amount?: number }): Promise<ApiResponse> {
    return this.request(`/admin/payment-methods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async adminDeletePaymentMethod(id: string): Promise<ApiResponse> {
    return this.request(`/admin/payment-methods/${id}`, { method: 'DELETE' });
  }

  // Users Management (Admin)
  async adminGetUsers(): Promise<ApiResponse> {
    return this.request('/admin/users', { method: 'GET' });
  }

  async adminUpdateUser(userId: string, data: { status?: string; monthly_percentage?: number; max_deposit?: number | null }): Promise<ApiResponse> {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async adminDeleteUser(userId: string): Promise<ApiResponse> {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async adminSendResetLink(userId: string, type: 'email' | 'phone'): Promise<ApiResponse> {
    return this.request(`/admin/users/${userId}/send-reset-link`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  // Deposits Management (Admin)
  async adminGetDeposits(status?: string): Promise<ApiResponse> {
    const url = status ? `/admin/deposits?status=${status}` : '/admin/deposits';
    return this.request(url, { method: 'GET' });
  }

  async adminApproveDeposit(depositId: string, admin_note?: string): Promise<ApiResponse> {
    return this.request(`/admin/deposits/${depositId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ admin_note }),
    });
  }

  async adminRejectDeposit(depositId: string, admin_note: string): Promise<ApiResponse> {
    return this.request(`/admin/deposits/${depositId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ admin_note }),
    });
  }

  // Withdrawals Management (Admin)
  async adminGetWithdrawals(status?: string): Promise<ApiResponse> {
    const url = status ? `/admin/withdrawals?status=${status}` : '/admin/withdrawals';
    return this.request(url, { method: 'GET' });
  }

  async adminApproveWithdrawal(withdrawalId: string, data: { admin_note?: string; network_fee?: number }): Promise<ApiResponse> {
    return this.request(`/admin/withdrawals/${withdrawalId}/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async adminRejectWithdrawal(withdrawalId: string, admin_note: string): Promise<ApiResponse> {
    return this.request(`/admin/withdrawals/${withdrawalId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ admin_note }),
    });
  }

  async adminMarkWithdrawalSent(withdrawalId: string, data: { tx_hash?: string; admin_note?: string }): Promise<ApiResponse> {
    return this.request(`/admin/withdrawals/${withdrawalId}/mark-sent`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Investments Management (Admin)
  async adminUpdateInvestment(investmentId: string, data: { rate_monthly?: number; status?: 'active' | 'closed'; locked_amount?: number }): Promise<ApiResponse> {
    return this.request(`/admin/investments/${investmentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Audit Log (Admin) - з обох таблиць auth + public
  async adminGetAuditLog(filters?: { action?: string; userId?: string; limit?: number }): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const url = `/admin/security/audit-logs${params.toString() ? `?${params}` : ''}`;
    return this.request(url, { method: 'GET' });
  }
}

export const api = new ApiClient(API_URL);

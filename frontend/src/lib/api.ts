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

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // httpOnly cookie встановлюється сервером - не читаємо localStorage
  }

  setAccessToken(token: string | null) {
    // DEPRECATED: Тепер НЕ використовується
    // httpOnly cookie встановлюється ТІЛЬКИ сервером через Set-Cookie header
    // Ця функція залишається для сумісності але нічого не робить
    console.log('⚠️ setAccessToken is deprecated - using httpOnly cookies only');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
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

    // ✅ httpOnly cookies (access_token + refresh_token) встановлюються СЕРВЕРОМ
    // НЕ зберігаємо нічого в localStorage - все через httpOnly cookies для безпеки

    return response;
  }

  async logout() {
    const response = await this.request('/api/auth/logout', { method: 'POST' });
    // httpOnly cookies очищуються СЕРВЕРОМ через Set-Cookie
    return response;
  }

  async me() {
    return this.request('/api/auth/me', { method: 'GET' });
  }

  async refreshToken() {
    // refresh_token читається з httpOnly cookie автоматично
    const response = await this.request<{ session: any }>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({}), // Empty body - token читається з cookie на backend
    });

    // httpOnly cookies оновлюються СЕРВЕРОМ через Set-Cookie

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

  async updateEmail(email: string) {
    return this.request('/api/auth/update-email', {
      method: 'PUT',
      body: JSON.stringify({ email }),
    });
  }

  async updatePhone(phone: string) {
    return this.request('/api/auth/update-phone', {
      method: 'PUT',
      body: JSON.stringify({ phone }),
    });
  }

  async updatePassword(password: string) {
    return this.request('/api/auth/update-password', {
      method: 'PUT',
      body: JSON.stringify({ password }),
    });
  }

  async setName(full_name: string) {
    return this.request('/api/auth/set-name', {
      method: 'POST',
      body: JSON.stringify({ full_name }),
    });
  }

  async sendPhoneOTP(phone: string) {
    return this.request('/api/auth/send-phone-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyPhoneOTP(phone: string, token: string) {
    return this.request('/api/auth/verify-phone-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, token }),
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

  // Withdrawals
  async getWithdrawals() {
    return this.request('/api/withdrawals');
  }

  async createWithdrawal(amount: number, method: string, details: any) {
    return this.request('/api/withdrawals', {
      method: 'POST',
      body: JSON.stringify({ amount, method, details }),
    });
  }

  // Referrals
  async getReferralStats(): Promise<ApiResponse> {
    return this.request('/api/referrals/stats', { method: 'GET' });
  }

  async setReferralCookie(refCode: string): Promise<ApiResponse> {
    return this.request(`/api/referrals/set-cookie?ref=${refCode}`, { method: 'POST' });
  }

  // ==================== ADMIN API ====================

  // Payment Methods (Admin)
  async adminGetPaymentMethods(): Promise<ApiResponse> {
    return this.request('/api/admin/payment-methods', { method: 'GET' });
  }

  async adminCreatePaymentMethod(data: { currency: string; network: string; wallet_address: string; is_active?: boolean; min_amount?: number }): Promise<ApiResponse> {
    return this.request('/api/admin/payment-methods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async adminUpdatePaymentMethod(id: string, data: { currency?: string; network?: string; wallet_address?: string; is_active?: boolean; min_amount?: number }): Promise<ApiResponse> {
    return this.request(`/api/admin/payment-methods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async adminDeletePaymentMethod(id: string): Promise<ApiResponse> {
    return this.request(`/api/admin/payment-methods/${id}`, { method: 'DELETE' });
  }

  // Users Management (Admin)
  async adminGetUsers(): Promise<ApiResponse> {
    return this.request('/api/admin/users', { method: 'GET' });
  }

  async adminUpdateUser(userId: string, data: { status?: string; monthly_percentage?: number }): Promise<ApiResponse> {
    return this.request(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async adminSendResetLink(userId: string, type: 'email' | 'phone'): Promise<ApiResponse> {
    return this.request(`/api/admin/users/${userId}/send-reset-link`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  // Deposits Management (Admin)
  async adminGetDeposits(status?: string): Promise<ApiResponse> {
    const url = status ? `/api/admin/deposits?status=${status}` : '/api/admin/deposits';
    return this.request(url, { method: 'GET' });
  }

  async adminApproveDeposit(depositId: string, admin_note?: string): Promise<ApiResponse> {
    return this.request(`/api/admin/deposits/${depositId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ admin_note }),
    });
  }

  async adminRejectDeposit(depositId: string, admin_note: string): Promise<ApiResponse> {
    return this.request(`/api/admin/deposits/${depositId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ admin_note }),
    });
  }

  // Withdrawals Management (Admin)
  async adminGetWithdrawals(status?: string): Promise<ApiResponse> {
    const url = status ? `/api/admin/withdrawals?status=${status}` : '/api/admin/withdrawals';
    return this.request(url, { method: 'GET' });
  }

  async adminApproveWithdrawal(withdrawalId: string, data: { admin_note?: string; network_fee?: number }): Promise<ApiResponse> {
    return this.request(`/api/admin/withdrawals/${withdrawalId}/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async adminRejectWithdrawal(withdrawalId: string, admin_note: string): Promise<ApiResponse> {
    return this.request(`/api/admin/withdrawals/${withdrawalId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ admin_note }),
    });
  }

  async adminMarkWithdrawalSent(withdrawalId: string, data: { tx_hash?: string; admin_note?: string }): Promise<ApiResponse> {
    return this.request(`/api/admin/withdrawals/${withdrawalId}/mark-sent`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Audit Log (Admin) - з обох таблиць auth + public
  async adminGetAuditLog(filters?: { action?: string; userId?: string; limit?: number }): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const url = `/api/admin/security/audit-logs${params.toString() ? `?${params}` : ''}`;
    return this.request(url, { method: 'GET' });
  }
}

export const api = new ApiClient(API_URL);

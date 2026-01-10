export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export interface Profile {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'support';
  status: 'active' | 'blocked' | 'pending';
  full_name?: string;
  phone?: string;
  referral_code: string;
  referred_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  account_id: string;
  type: 'deposit' | 'withdrawal' | 'interest' | 'adjustment' | 'fee' | 'refund' | 'referral_bonus';
  amount: number;
  direction: 'credit' | 'debit';
  status: 'posted' | 'void';
  ref_table?: string;
  ref_id?: string;
  idempotency_key?: string;
  description?: string;
  created_at: string;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  description?: string;
  daily_rate: number;
  min_amount: number;
  max_amount?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserInvestment {
  id: string;
  user_id: string;
  account_id: string;
  plan_id: string;
  principal: number;
  started_at: string;
  ended_at?: string;
  status: 'active' | 'closed';
  last_accrual_at: string;
  created_at: string;
}

export interface Deposit {
  id: string;
  user_id: string;
  account_id: string;
  provider: string;
  provider_ref?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  payment_details?: any;
  confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  account_id: string;
  amount: number;
  destination: any;
  status: 'requested' | 'approved' | 'sent' | 'rejected' | 'cancelled';
  admin_id?: string;
  admin_note?: string;
  risk_hold: boolean;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  actor_user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  meta?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface SessionData {
  user_id: string;
  email: string;
  role: string;
  session_id: string;
  created_at: number;
  expires_at: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

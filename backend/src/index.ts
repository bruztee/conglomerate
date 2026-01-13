import type { Env } from './types';
import { corsHeaders, errorResponse } from './utils/response';
import { handleRegister, handleLogin, handleLogout, handleMe, handleRefreshToken, handleResendVerification, handleForgotPassword, handleResetPassword, handleUpdateEmail, handleUpdatePhone, handleUpdatePassword, handleSetName, handleSendPhoneOTP, handleVerifyPhoneOTP } from './routes/auth';
import { handleGetWallet } from './routes/wallet';
import { handleCreateDeposit, handleGetDeposits, handleConfirmDeposit } from './routes/deposits';
import { handleCreateWithdrawal, handleGetWithdrawals, handleApproveWithdrawal } from './routes/withdrawals';
import { handleGetPlans, handleCreateInvestment, handleGetInvestments } from './routes/investments';
import { handleGetReferralStats, handleSetReferralCookie } from './routes/referrals';
import { handleGetActivePaymentMethods } from './routes/paymentMethods';
import { handleGetPaymentMethods, handleCreatePaymentMethod, handleUpdatePaymentMethod, handleDeletePaymentMethod } from './routes/admin/paymentMethods';
import { handleGetUsers, handleUpdateUser, handleSendResetLink } from './routes/admin/users';
import { handleGetDeposits as handleAdminGetDeposits, handleApproveDeposit, handleRejectDeposit } from './routes/admin/deposits';
import { handleGetWithdrawals as handleAdminGetWithdrawals, handleApproveWithdrawal as handleAdminApproveWithdrawal, handleRejectWithdrawal, handleMarkWithdrawalSent } from './routes/admin/withdrawals';
import { handleGetAuditLogs } from './routes/admin/security';

interface RouteHandler {
  (request: Request, env: Env, ...args: string[]): Promise<Response>;
}

interface Route {
  method: string;
  pattern: RegExp;
  handler: RouteHandler;
}

const routes: Route[] = [
  { method: 'POST', pattern: /^\/api\/auth\/register$/, handler: handleRegister },
  { method: 'POST', pattern: /^\/api\/auth\/login$/, handler: handleLogin },
  { method: 'POST', pattern: /^\/api\/auth\/logout$/, handler: handleLogout },
  { method: 'POST', pattern: /^\/api\/auth\/refresh$/, handler: handleRefreshToken },
  { method: 'POST', pattern: /^\/api\/auth\/resend-verification$/, handler: handleResendVerification },
  { method: 'POST', pattern: /^\/api\/auth\/forgot-password$/, handler: handleForgotPassword },
  { method: 'POST', pattern: /^\/api\/auth\/reset-password$/, handler: handleResetPassword },
  { method: 'PUT', pattern: /^\/api\/auth\/update-email$/, handler: handleUpdateEmail },
  { method: 'PUT', pattern: /^\/api\/auth\/update-phone$/, handler: handleUpdatePhone },
  { method: 'PUT', pattern: /^\/api\/auth\/update-password$/, handler: handleUpdatePassword },
  { method: 'POST', pattern: /^\/api\/auth\/set-name$/, handler: handleSetName },
  { method: 'POST', pattern: /^\/api\/auth\/send-phone-otp$/, handler: handleSendPhoneOTP },
  { method: 'POST', pattern: /^\/api\/auth\/verify-phone-otp$/, handler: handleVerifyPhoneOTP },
  { method: 'GET', pattern: /^\/api\/auth\/me$/, handler: handleMe },
  
  { method: 'GET', pattern: /^\/api\/wallet$/, handler: handleGetWallet },
  
  { method: 'POST', pattern: /^\/api\/deposits$/, handler: handleCreateDeposit },
  { method: 'GET', pattern: /^\/api\/deposits$/, handler: handleGetDeposits },
  { method: 'POST', pattern: /^\/api\/deposits\/([a-f0-9-]+)\/confirm$/, handler: handleConfirmDeposit },
  
  { method: 'POST', pattern: /^\/api\/withdrawals$/, handler: handleCreateWithdrawal },
  { method: 'GET', pattern: /^\/api\/withdrawals$/, handler: handleGetWithdrawals },
  { method: 'POST', pattern: /^\/api\/withdrawals\/([a-f0-9-]+)\/approve$/, handler: handleApproveWithdrawal },
  
  { method: 'GET', pattern: /^\/api\/investment-plans$/, handler: handleGetPlans },
  { method: 'POST', pattern: /^\/api\/investments$/, handler: handleCreateInvestment },
  { method: 'GET', pattern: /^\/api\/investments$/, handler: handleGetInvestments },
  
  { method: 'GET', pattern: /^\/api\/referrals\/stats$/, handler: handleGetReferralStats },
  { method: 'POST', pattern: /^\/api\/referrals\/set-cookie$/, handler: handleSetReferralCookie },
  
  // Public endpoint for active payment methods (for users)
  { method: 'GET', pattern: /^\/api\/payment-methods$/, handler: handleGetActivePaymentMethods },
  
  // Admin routes - Payment Methods
  { method: 'GET', pattern: /^\/api\/admin\/payment-methods$/, handler: handleGetPaymentMethods },
  { method: 'POST', pattern: /^\/api\/admin\/payment-methods$/, handler: handleCreatePaymentMethod },
  { method: 'PUT', pattern: /^\/api\/admin\/payment-methods\/([a-f0-9-]+)$/, handler: handleUpdatePaymentMethod },
  { method: 'DELETE', pattern: /^\/api\/admin\/payment-methods\/([a-f0-9-]+)$/, handler: handleDeletePaymentMethod },
  
  // Admin routes - Users Management
  { method: 'GET', pattern: /^\/api\/admin\/users$/, handler: handleGetUsers },
  { method: 'PUT', pattern: /^\/api\/admin\/users\/([a-f0-9-]+)$/, handler: handleUpdateUser },
  { method: 'POST', pattern: /^\/api\/admin\/users\/([a-f0-9-]+)\/send-reset-link$/, handler: handleSendResetLink },
  
  // Admin routes - Deposits Management
  { method: 'GET', pattern: /^\/api\/admin\/deposits$/, handler: handleAdminGetDeposits },
  { method: 'POST', pattern: /^\/api\/admin\/deposits\/([a-f0-9-]+)\/approve$/, handler: handleApproveDeposit },
  { method: 'POST', pattern: /^\/api\/admin\/deposits\/([a-f0-9-]+)\/reject$/, handler: handleRejectDeposit },
  
  // Admin routes - Withdrawals Management
  { method: 'GET', pattern: /^\/api\/admin\/withdrawals$/, handler: handleAdminGetWithdrawals },
  { method: 'POST', pattern: /^\/api\/admin\/withdrawals\/([a-f0-9-]+)\/approve$/, handler: handleAdminApproveWithdrawal },
  { method: 'POST', pattern: /^\/api\/admin\/withdrawals\/([a-f0-9-]+)\/reject$/, handler: handleRejectWithdrawal },
  { method: 'POST', pattern: /^\/api\/admin\/withdrawals\/([a-f0-9-]+)\/mark-sent$/, handler: handleMarkWithdrawalSent },
  
  // Security
  { method: 'GET', pattern: /^\/api\/admin\/security\/audit-logs$/, handler: handleGetAuditLogs },
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const headers = corsHeaders(origin);
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }
    
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    for (const route of routes) {
      if (route.method !== method) continue;
      
      const match = path.match(route.pattern);
      if (match) {
        try {
          const params = match.slice(1);
          const response = await route.handler(request, env, ...params);
          
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          
          return response;
        } catch (error) {
          console.error('Route handler error:', error);
          return errorResponse('SERVER_ERROR', 'Internal server error', 500, headers);
        }
      }
    }
    
    return errorResponse('NOT_FOUND', 'Route not found', 404, headers);
  },
};

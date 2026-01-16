import type { Env } from './types';
import { errorResponse } from './utils/response';
import { handleRegister, handleLogin, handleLogout, handleMe, handleRefreshToken, handleResendVerification, handleForgotPassword, handleResetPassword, handleUpdateEmail, handleUpdatePhone, handleUpdatePassword, handleSetName, handleSendPhoneOTP, handleVerifyPhoneOTP, handleVerifyEmail, handleSetSession } from './routes/auth';
import { handleGetWallet } from './routes/wallet';
import { handleCreateDeposit, handleGetDeposits, handleConfirmDeposit } from './routes/deposits';
import { handleCreateWithdrawal, handleGetWithdrawals, handleApproveWithdrawal } from './routes/withdrawals';
import { handleGetReferralStats, handleSetReferralCookie } from './routes/referrals';
import { handleGetActivePaymentMethods } from './routes/paymentMethods';
import { handleGetPaymentMethods, handleCreatePaymentMethod, handleUpdatePaymentMethod, handleDeletePaymentMethod } from './routes/admin/paymentMethods';
import { handleGetUsers, handleUpdateUser, handleSendResetLink, handleDeleteUser } from './routes/admin/users';
import { handleGetDeposits as handleAdminGetDeposits, handleApproveDeposit, handleRejectDeposit } from './routes/admin/deposits';
import { handleGetWithdrawals as handleAdminGetWithdrawals, handleApproveWithdrawal as handleAdminApproveWithdrawal, handleRejectWithdrawal, handleMarkWithdrawalSent } from './routes/admin/withdrawals';
import { handleGetAuditLogs } from './routes/admin/security';
import { handleGetInvestments } from './routes/investments';
import { handleUpdateInvestment } from './routes/admin/investments';

interface RouteHandler {
  (request: Request, env: Env, ...args: string[]): Promise<Response>;
}

interface Route {
  method: string;
  pattern: RegExp;
  handler: RouteHandler;
}

const routes: Route[] = [
  { method: 'POST', pattern: /^\/auth\/register$/, handler: handleRegister },
  { method: 'POST', pattern: /^\/auth\/login$/, handler: handleLogin },
  { method: 'POST', pattern: /^\/auth\/logout$/, handler: handleLogout },
  { method: 'POST', pattern: /^\/auth\/refresh$/, handler: handleRefreshToken },
  { method: 'POST', pattern: /^\/auth\/resend-verification$/, handler: handleResendVerification },
  { method: 'POST', pattern: /^\/auth\/forgot-password$/, handler: handleForgotPassword },
  { method: 'POST', pattern: /^\/auth\/reset-password$/, handler: handleResetPassword },
  { method: 'PUT', pattern: /^\/auth\/update-email$/, handler: handleUpdateEmail },
  { method: 'PUT', pattern: /^\/auth\/update-phone$/, handler: handleUpdatePhone },
  { method: 'PUT', pattern: /^\/auth\/update-password$/, handler: handleUpdatePassword },
  { method: 'POST', pattern: /^\/auth\/set-name$/, handler: handleSetName },
  { method: 'POST', pattern: /^\/auth\/send-phone-otp$/, handler: handleSendPhoneOTP },
  { method: 'POST', pattern: /^\/auth\/verify-phone-otp$/, handler: handleVerifyPhoneOTP },
  { method: 'POST', pattern: /^\/auth\/verify-email$/, handler: handleVerifyEmail },
  { method: 'POST', pattern: /^\/auth\/set-session$/, handler: handleSetSession },
  { method: 'GET', pattern: /^\/auth\/me$/, handler: handleMe },
  
  { method: 'GET', pattern: /^\/wallet$/, handler: handleGetWallet },
  { method: 'GET', pattern: /^\/investments$/, handler: handleGetInvestments },
  
  { method: 'POST', pattern: /^\/deposits$/, handler: handleCreateDeposit },
  { method: 'GET', pattern: /^\/deposits$/, handler: handleGetDeposits },
  { method: 'POST', pattern: /^\/deposits\/([a-f0-9-]+)\/confirm$/, handler: handleConfirmDeposit },
  
  { method: 'POST', pattern: /^\/withdrawals$/, handler: handleCreateWithdrawal },
  { method: 'GET', pattern: /^\/withdrawals$/, handler: handleGetWithdrawals },
  { method: 'POST', pattern: /^\/withdrawals\/([a-f0-9-]+)\/approve$/, handler: handleApproveWithdrawal },
  
  { method: 'GET', pattern: /^\/referrals\/stats$/, handler: handleGetReferralStats },
  { method: 'POST', pattern: /^\/referrals\/set-cookie$/, handler: handleSetReferralCookie },
  
  { method: 'GET', pattern: /^\/payment-methods\/active$/, handler: handleGetActivePaymentMethods },
  
  // Admin routes - Users Management
  { method: 'GET', pattern: /^\/admin\/users$/, handler: handleGetUsers },
  { method: 'PUT', pattern: /^\/admin\/users\/([a-f0-9-]+)$/, handler: handleUpdateUser },
  { method: 'DELETE', pattern: /^\/admin\/users\/([a-f0-9-]+)$/, handler: handleDeleteUser },
  { method: 'POST', pattern: /^\/admin\/users\/([a-f0-9-]+)\/send-reset-link$/, handler: handleSendResetLink },
  
  // Admin routes - Payment Methods
  { method: 'GET', pattern: /^\/admin\/payment-methods$/, handler: handleGetPaymentMethods },
  { method: 'POST', pattern: /^\/admin\/payment-methods$/, handler: handleCreatePaymentMethod },
  { method: 'PUT', pattern: /^\/admin\/payment-methods\/([a-f0-9-]+)$/, handler: handleUpdatePaymentMethod },
  { method: 'DELETE', pattern: /^\/admin\/payment-methods\/([a-f0-9-]+)$/, handler: handleDeletePaymentMethod },
  
  // Admin routes - Deposits Management
  { method: 'GET', pattern: /^\/admin\/deposits$/, handler: handleAdminGetDeposits },
  { method: 'POST', pattern: /^\/admin\/deposits\/([a-f0-9-]+)\/approve$/, handler: handleApproveDeposit },
  { method: 'POST', pattern: /^\/admin\/deposits\/([a-f0-9-]+)\/reject$/, handler: handleRejectDeposit },
  
  // Admin routes - Withdrawals Management
  { method: 'GET', pattern: /^\/admin\/withdrawals$/, handler: handleAdminGetWithdrawals },
  { method: 'POST', pattern: /^\/admin\/withdrawals\/([a-f0-9-]+)\/approve$/, handler: handleAdminApproveWithdrawal },
  { method: 'POST', pattern: /^\/admin\/withdrawals\/([a-f0-9-]+)\/reject$/, handler: handleRejectWithdrawal },
  { method: 'POST', pattern: /^\/admin\/withdrawals\/([a-f0-9-]+)\/mark-sent$/, handler: handleMarkWithdrawalSent },
  
  // Admin routes - Investments Management
  { method: 'PUT', pattern: /^\/admin\/investments\/([a-f0-9-]+)$/, handler: handleUpdateInvestment },
  
  // Security
  { method: 'GET', pattern: /^\/admin\/security\/audit-logs$/, handler: handleGetAuditLogs },
];

// CORS headers helper
function corsHeaders(origin?: string) {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://conglomerate-eight.vercel.app',
    'https://conglomerate-g.com',
    'https://www.conglomerate-g.com',
  ]
  
  const allowOrigin = origin && allowedOrigins.includes(origin) 
    ? origin 
    : allowedOrigins[1] // Default to production

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') || undefined;
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

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    // Cron job для нарахування процентів
    const { handleAccrueInterest } = await import('./routes/cron');
    ctx.waitUntil(handleAccrueInterest(env));
  },
};

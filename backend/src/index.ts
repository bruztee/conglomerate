import type { Env } from './types';
import { corsHeaders, errorResponse } from './utils/response';
import { handleRegister, handleLogin, handleLogout, handleMe, handleRefreshToken, handleResendVerification, handleForgotPassword, handleResetPassword } from './routes/auth';
import { handleGetWallet, handleGetTransactions } from './routes/wallet';
import { handleCreateDeposit, handleGetDeposits, handleConfirmDeposit } from './routes/deposits';
import { handleCreateWithdrawal, handleGetWithdrawals, handleApproveWithdrawal } from './routes/withdrawals';
import { handleGetPlans, handleCreateInvestment, handleGetInvestments } from './routes/investments';

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
  { method: 'GET', pattern: /^\/api\/auth\/me$/, handler: handleMe },
  
  { method: 'GET', pattern: /^\/api\/wallet$/, handler: handleGetWallet },
  { method: 'GET', pattern: /^\/api\/transactions$/, handler: handleGetTransactions },
  
  { method: 'POST', pattern: /^\/api\/deposits$/, handler: handleCreateDeposit },
  { method: 'GET', pattern: /^\/api\/deposits$/, handler: handleGetDeposits },
  { method: 'POST', pattern: /^\/api\/deposits\/([a-f0-9-]+)\/confirm$/, handler: handleConfirmDeposit },
  
  { method: 'POST', pattern: /^\/api\/withdrawals$/, handler: handleCreateWithdrawal },
  { method: 'GET', pattern: /^\/api\/withdrawals$/, handler: handleGetWithdrawals },
  { method: 'POST', pattern: /^\/api\/withdrawals\/([a-f0-9-]+)\/approve$/, handler: handleApproveWithdrawal },
  
  { method: 'GET', pattern: /^\/api\/investment-plans$/, handler: handleGetPlans },
  { method: 'POST', pattern: /^\/api\/investments$/, handler: handleCreateInvestment },
  { method: 'GET', pattern: /^\/api\/investments$/, handler: handleGetInvestments },
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

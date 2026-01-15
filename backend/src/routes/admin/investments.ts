import { Env } from '../../types';
import { requireAdmin } from '../../middleware/adminAuth';
import { jsonResponse, errorResponse } from '../../utils/response';
import { createServiceSupabaseClient } from '../../utils/supabase';
import { logAudit } from '../../utils/audit';

/**
 * PUT /admin/investments/:investmentId
 * Update investment - change rate, status, lock amount
 */
export async function handleUpdateInvestment(request: Request, env: Env, investmentId: string): Promise<Response> {
  const adminCheck = await requireAdmin(request, env);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const body = await request.json() as {
      rate_monthly?: number;
      status?: 'active' | 'closed';
      locked_amount?: number;
    };

    if (!body.rate_monthly && !body.status && body.locked_amount === undefined) {
      return errorResponse('VALIDATION_ERROR', 'At least one field must be provided', 400);
    }

    const supabase = createServiceSupabaseClient(env);

    // Get current investment
    const { data: investment, error: fetchError } = await supabase
      .from('investments')
      .select('*')
      .eq('id', investmentId)
      .single();

    if (fetchError || !investment) {
      return errorResponse('NOT_FOUND', 'Investment not found', 404);
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (body.rate_monthly !== undefined) {
      if (body.rate_monthly < 0 || body.rate_monthly > 100) {
        return errorResponse('VALIDATION_ERROR', 'Rate must be between 0 and 100', 400);
      }
      updateData.rate_monthly = body.rate_monthly;
    }
    
    if (body.status) {
      updateData.status = body.status;
      if (body.status === 'closed' && !investment.closed_at) {
        updateData.closed_at = new Date().toISOString();
      }
    }
    
    if (body.locked_amount !== undefined) {
      const principal = parseFloat(investment.principal || 0);
      const accruedInterest = parseFloat(investment.accrued_interest || 0);
      const totalValue = principal + accruedInterest;
      
      if (body.locked_amount < 0 || body.locked_amount > totalValue) {
        return errorResponse('VALIDATION_ERROR', `Locked amount must be between 0 and ${totalValue}`, 400);
      }
      updateData.locked_amount = body.locked_amount;
    }

    const { data: updatedInvestment, error: updateError } = await supabase
      .from('investments')
      .update(updateData)
      .eq('id', investmentId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update investment:', updateError);
      return errorResponse('DATABASE_ERROR', updateError.message, 500);
    }

    await logAudit(env, adminCheck.userId!, 'admin.investment.update', 'investments', investmentId, body, request);

    return jsonResponse({ investment: updatedInvestment });
  } catch (error: any) {
    console.error('Update investment error:', error);
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}

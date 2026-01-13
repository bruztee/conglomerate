"use client"

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function ReferralCookieHandlerContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    
    if (refCode) {
      console.log('🔗 Referral code detected:', refCode);
      
      // Відправити на backend щоб встановити httpOnly cookie
      api.setReferralCookie(refCode)
        .then(result => {
          if (result.success) {
            console.log('✅ Referral cookie set successfully');
          } else {
            console.error('❌ Failed to set referral cookie:', result.error);
          }
        })
        .catch(err => {
          console.error('❌ Error setting referral cookie:', err);
        });
    }
  }, [searchParams]);

  return null;
}

export default function ReferralCookieHandler() {
  return (
    <Suspense fallback={null}>
      <ReferralCookieHandlerContent />
    </Suspense>
  );
}

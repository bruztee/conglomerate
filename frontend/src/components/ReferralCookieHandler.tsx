"use client"

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function ReferralCookieHandlerContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    
    if (refCode) {
      api.setReferralCookie(refCode);
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

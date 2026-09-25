'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setClientAuthToken } from '@/lib/client';

// Landing point for every sign-in now that identity is TPC Auth's job: the /api/auth/tpc callback
// redirects here with a freshly minted Umami session token, this page stores it the same way the
// native login form used to, and sends the browser on to wherever it was headed.
export default function SsoPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    const next = params.get('next') || '/';

    if (token) {
      setClientAuthToken(token);
    }

    router.replace(next.startsWith('/') && !next.startsWith('//') ? next : '/');
  }, [params, router]);

  return null;
}

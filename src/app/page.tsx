
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F1F1F6]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B3BDA]"></div>
    </div>
  );
}

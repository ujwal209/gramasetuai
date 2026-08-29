'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';

const App = dynamic(() => import('@/App'), { ssr: false });

export default function HomePage() {
  const router = useRouter();
  const { user, token, loading, isInitialized } = useAuth();

  // If already authenticated, redirect straight to /dashboard
  useEffect(() => {
    if (isInitialized && !loading && user && token) {
      router.replace('/dashboard');
    }
  }, [isInitialized, loading, user, token, router]);

  if (isInitialized && !loading && user && token) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-3 font-mono">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#1e8c78] dark:text-[#5ec2ac]">
          AUTHENTICATED
        </span>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
          Redirecting to Citizen Dashboard...
        </p>
      </div>
    );
  }

  return <App />;
}

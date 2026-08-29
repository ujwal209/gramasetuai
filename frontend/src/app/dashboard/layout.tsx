'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { useAuth } from '@/context/AuthContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, loading, isInitialized } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load saved sidebar preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gramsetu_sidebar_collapsed');
      if (saved !== null) {
        setSidebarCollapsed(saved === 'true');
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleToggleCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('gramsetu_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Authentication & Onboarding Completion Guard for all /dashboard/* pages
  useEffect(() => {
    if (isInitialized && !loading) {
      if (!user || !token) {
        router.replace('/auth/login');
      } else if (!user.is_onboarded && (!user.survey_number || !user.landholding_acres || !user.primary_crop)) {
        // Enforce onboarding completion before accessing dashboard
        router.replace('/onboarding');
      }
    }
  }, [isInitialized, loading, user, token, router]);

  // Loading Screen while session is being verified
  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground">
            Authenticating Citizen Identity
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Verifying digital credentials with National Gazette &amp; Welfare Records.
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated, block view and show redirecting state
  if (!user || !token) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 space-y-3 text-center">
        <span className="badge-saas bg-destructive/10 text-destructive border-destructive/30">
          ACCESS RESTRICTED
        </span>
        <p className="text-xs font-bold text-muted-foreground">
          Redirecting to Citizen Login...
        </p>
      </div>
    );
  }

  // If authenticated but onboarding not completed, block dashboard view and show redirecting state
  if (!user.is_onboarded && (!user.survey_number || !user.landholding_acres || !user.primary_crop)) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 space-y-3 text-center">
        <span className="badge-saas bg-emerald-50 text-emerald-800 border-emerald-200">
          ONBOARDING REQUIRED
        </span>
        <h3 className="text-base font-bold text-foreground">
          Complete Your Farmer Onboarding
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          Please complete your agricultural profile to unlock your personalized subsidy dashboard and AI advisory.
        </p>
      </div>
    );
  }

  const isChatRoute = pathname.startsWith('/dashboard/nitirag/chat') || pathname === '/dashboard/nitirag';
  const isMessagesRoute = pathname.startsWith('/dashboard/chaupal/messages');
  const isFullscreenCanvas = isChatRoute || isMessagesRoute;

  return (
    <div className={`bg-white text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground ${isFullscreenCanvas ? 'h-screen h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-screen'}`}>
      {/* Persistent Non-Scrollable Sidebar (Hidden on Fullscreen Chat) */}
      {!isChatRoute && (
        <DashboardSidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      )}

      {/* Main Content Viewport */}
      <div
        className={`flex-1 min-h-0 flex flex-col transition-all duration-300 ease-in-out ${
          isChatRoute
            ? 'w-full h-screen min-h-screen overflow-hidden'
            : isMessagesRoute
            ? `${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} h-full max-h-full h-screen h-[100dvh] overflow-hidden`
            : `${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} min-h-screen`
        }`}
      >
        {/* Mobile Header Bar (Hidden on Fullscreen Chat and Messages) */}
        {!isFullscreenCanvas && (
          <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 p-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-800 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 cursor-pointer border border-slate-200"
              >
                ☰ Menu
              </button>
              <Link href="/dashboard" className="flex items-center">
                <img
                  src="/logo.png"
                  alt="GramSetu"
                  className="h-7 w-auto object-contain"
                />
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/profile"
                className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold"
              >
                @{user?.handle || 'citizen'}
              </Link>
            </div>
          </header>
        )}

        {/* Dynamic Subroute Canvas */}
        <main className={`flex-1 bg-white min-h-0 ${isFullscreenCanvas ? 'p-0 w-full h-full max-h-full overflow-hidden flex flex-col' : 'p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

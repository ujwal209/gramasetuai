'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthSplitLayout } from '@/components/AuthSplitLayout';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

export default function AuthLoginPage() {
  const router = useRouter();
  const { user, token, loading: authLoading, isInitialized, handleLogin } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tAuth = translations[language]?.auth || translations.en.auth;

  // Auto-redirect to dashboard only if fully authenticated
  useEffect(() => {
    if (isInitialized && !authLoading && user && token) {
      router.replace('/dashboard');
    }
  }, [isInitialized, authLoading, user, token, router]);

  if (isInitialized && !authLoading && user && token) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center space-y-3">
        <span className="badge-saas badge-saas-active">
          AUTHENTICATED
        </span>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
          Redirecting to Citizen Dashboard...
        </p>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await handleLogin(identifier, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials.';
      setError(msg);
      if (msg.includes('not verified')) {
        router.push(`/auth/verify-otp?email=${encodeURIComponent(identifier)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title={tAuth.loginTitle}
      subtitle={tAuth.loginSub}
      badgeText={tAuth.loginBadge}
      language={language}
      onLanguageChange={setLanguage}
      illustrationSrc="/loginillustration.png"
      illustrationAlt="Citizen Sign In"
      showcaseTitle="Discover Every Government Scheme You Qualify For"
      showcaseTagline="Deterministic rule evaluation matching your household with verified central and state welfare entitlements."
      showcasePoints={[
        '100% Deterministic Gazette Rule Matching',
        'Direct Benefit Transfer (DBT) Account Tracking',
        'Zero Middlemen, Bribery, or Intermediaries',
      ]}
    >
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3 sm:space-y-3.5">
        <div className="space-y-1">
          <label
            htmlFor="login-email"
            className="text-xs font-bold text-foreground block"
          >
            {tAuth.emailOrHandle}
          </label>
          <input
            id="login-email"
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="citizen@gmail.com or farmer_handle"
            className="input-sleek"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="text-xs font-bold text-foreground block"
            >
              {tAuth.password}
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs font-semibold text-primary hover:underline"
            >
              {tAuth.forgotPassword}
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-sleek pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary-sleek w-full h-10 text-xs font-bold shadow-sm cursor-pointer"
        >
          {loading ? tAuth.authenticating : tAuth.signInBtn}
        </button>
      </form>

      <div className="pt-3 text-center border-t border-border space-y-1">
        <p className="text-xs text-muted-foreground">
          {tAuth.newCitizen}{' '}
          <Link
            href="/auth/signup"
            className="text-primary font-bold hover:underline ml-1"
          >
            {tAuth.createAccountLink}
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}

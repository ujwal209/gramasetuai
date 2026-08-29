'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthSplitLayout } from '@/components/AuthSplitLayout';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const { handleResetPassword, pendingEmail } = useAuth();
  const { language, setLanguage } = useLanguage();

  const [email, setEmail] = useState(emailParam || pendingEmail || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const tAuth = translations[language]?.auth || translations.en.auth;

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  const onReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await handleResetPassword(email, otp, newPassword);
      setSuccess('Password updated successfully. Redirecting to sign in...');
      setTimeout(() => router.push('/auth/login'), 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Password reset failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title={tAuth.resetTitle}
      subtitle={`${tAuth.resetSub} (${email || 'your email'})`}
      badgeText={tAuth.resetBadge}
      language={language}
      onLanguageChange={setLanguage}
      illustrationSrc="/resetpassword.png"
      illustrationAlt="Secure Password Reset"
      showcaseTitle="Set New Secure Password"
      showcaseTagline="Choose a strong password to protect your citizen entitlements and demographic profile."
      showcasePoints={[
        'End-to-End Encrypted Session',
        'Automatic Verification & Update',
        'Direct Access to Welfare Dashboard',
      ]}
    >
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-xs font-semibold">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-xl text-primary text-xs font-semibold">
          {success}
        </div>
      )}

      <form onSubmit={onReset} className="space-y-2.5 sm:space-y-3">
        <div className="space-y-1">
          <label
            htmlFor="reset-email"
            className="text-xs font-bold text-foreground block"
          >
            {tAuth.email}
          </label>
          <input
            id="reset-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="citizen@gmail.com"
            className="input-sleek"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="reset-otp"
            className="text-xs font-bold text-foreground block"
          >
            {tAuth.otpCode}
          </label>
          <input
            id="reset-otp"
            type="text"
            required
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            className="input-sleek text-center font-mono font-bold text-base tracking-widest"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="reset-newpassword"
            className="text-xs font-bold text-foreground block"
          >
            {tAuth.newPassword}
          </label>
          <div className="relative">
            <input
              id="reset-newpassword"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={tAuth.passwordMin}
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
          disabled={loading || otp.length !== 6}
          className="btn-primary-sleek w-full h-10 text-xs font-bold shadow-sm cursor-pointer mt-1"
        >
          {loading ? tAuth.updatingPassword : tAuth.savePasswordBtn}
        </button>
      </form>

      <div className="pt-3 text-center border-t border-border flex items-center justify-between text-xs">
        <Link
          href="/auth/login"
          className="text-primary font-bold hover:underline"
        >
          {tAuth.backToSignIn}
        </Link>
        <Link
          href="/auth/forgot-password"
          className="text-muted-foreground hover:text-foreground"
        >
          {tAuth.resendCode}
        </Link>
      </div>
    </AuthSplitLayout>
  );
}

export default function AuthResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-white flex items-center justify-center p-6">
          <div className="text-xs font-bold text-muted-foreground">Loading Password Reset...</div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

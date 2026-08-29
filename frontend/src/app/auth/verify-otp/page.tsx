'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthSplitLayout } from '@/components/AuthSplitLayout';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const { handleVerifyOtp, handleResendOtp, pendingEmail } = useAuth();
  const { language, setLanguage } = useLanguage();

  const [email, setEmail] = useState(emailParam || pendingEmail || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const tAuth = translations[language]?.auth || translations.en.auth;

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timerSeconds]);

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await handleVerifyOtp(email, otp);
      setSuccess('Account verified successfully. Redirecting to dashboard...');
      setTimeout(() => router.push('/onboarding'), 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'OTP verification failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await handleResendOtp(email, 'signup');
      setSuccess(res.message);
      setTimerSeconds(60);
      setCanResend(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend verification code.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title={tAuth.verifyTitle}
      subtitle={tAuth.verifySub}
      badgeText={tAuth.verifyBadge}
      language={language}
      onLanguageChange={setLanguage}
      illustrationSrc="/verify.png"
      illustrationAlt="Verify Account OTP"
      showcaseTitle="Secure Multi-Stage Authentication"
      showcaseTagline="Ensuring citizen identity authenticity and protecting welfare claims from unauthorized interception."
      showcasePoints={[
        'Automated 6-Digit Verification Code',
        'Instant Account Activation & Verification',
        'Proactive Application SMS Dispatcher Integration',
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

      <form onSubmit={onVerify} className="space-y-3 sm:space-y-3.5">
        <div className="space-y-1">
          <label
            htmlFor="verify-email"
            className="text-xs font-bold text-foreground block"
          >
            {tAuth.email}
          </label>
          <input
            id="verify-email"
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
            htmlFor="verify-otp"
            className="text-xs font-bold text-foreground block"
          >
            {tAuth.otpCode}
          </label>
          <input
            id="verify-otp"
            type="text"
            required
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            className="input-sleek text-center text-lg tracking-widest font-mono font-bold"
          />
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="btn-primary-sleek w-full h-10 text-xs font-bold shadow-sm cursor-pointer"
        >
          {loading ? tAuth.verifying : tAuth.verifyBtn}
        </button>
      </form>

      <div className="pt-3 text-center border-t border-border flex items-center justify-between text-xs">
        <button
          type="button"
          disabled={!canResend || loading}
          onClick={onResend}
          className={`font-semibold cursor-pointer ${
            canResend ? 'text-primary hover:underline' : 'text-muted-foreground cursor-not-allowed'
          }`}
        >
          {canResend ? tAuth.resendCode : `${tAuth.resendIn} ${timerSeconds}s`}
        </button>

        <Link href="/auth/login" className="text-muted-foreground hover:text-foreground">
          {tAuth.backToSignIn}
        </Link>
      </div>
    </AuthSplitLayout>
  );
}

export default function AuthVerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-white flex items-center justify-center p-6">
          <div className="text-xs font-bold text-muted-foreground">Loading Verification...</div>
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthSplitLayout } from '@/components/AuthSplitLayout';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

export default function AuthForgotPasswordPage() {
  const router = useRouter();
  const { handleForgotPassword, setPendingEmail } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tAuth = translations[language]?.auth || translations.en.auth;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await handleForgotPassword(email);
      setPendingEmail(email);
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset code.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title={tAuth.forgotTitle}
      subtitle={tAuth.forgotSub}
      badgeText={tAuth.forgotBadge}
      language={language}
      onLanguageChange={setLanguage}
      illustrationSrc="/resetpassword.png"
      illustrationAlt="Reset Account Password"
      showcaseTitle="Secure Identity Protection"
      showcaseTagline="Regain access to your citizen profile and verified scheme applications with instant recovery."
      showcasePoints={[
        'Instant Password Reset Code Delivery',
        'Protected Citizen Profile & Benefit History',
        '24/7 Self-Service Account Recovery',
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
            htmlFor="forgot-email"
            className="text-xs font-bold text-foreground block"
          >
            {tAuth.email}
          </label>
          <input
            id="forgot-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="citizen@gmail.com"
            className="input-sleek"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary-sleek w-full h-10 text-xs font-bold shadow-sm cursor-pointer"
        >
          {loading ? tAuth.sendingCode : tAuth.sendRecoveryBtn}
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
          href="/auth/signup"
          className="text-muted-foreground hover:text-foreground"
        >
          {tAuth.registerNewLink}
        </Link>
      </div>
    </AuthSplitLayout>
  );
}

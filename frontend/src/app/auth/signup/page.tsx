'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthSplitLayout } from '@/components/AuthSplitLayout';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

export default function AuthSignUpPage() {
  const router = useRouter();
  const { user, token, loading: authLoading, isInitialized, handleSignUp, setPendingEmail } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tAuth = translations[language]?.auth || translations.en.auth;

  // Auto-redirect to dashboard only if fully authenticated
  useEffect(() => {
    if (isInitialized && !authLoading && user && token) {
      router.replace('/dashboard');
    }
  }, [isInitialized, authLoading, user, token, router]);

  // Dynamic Password Strength Evaluation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-border' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[0-9!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: tAuth.strengthWeak, color: 'bg-red-500', text: 'text-red-500' };
      case 2:
        return { score: 2, label: tAuth.strengthFair, color: 'bg-amber-500', text: 'text-amber-500' };
      case 3:
        return { score: 3, label: tAuth.strengthGood, color: 'bg-blue-500', text: 'text-blue-500' };
      case 4:
        return { score: 4, label: tAuth.strengthStrong, color: 'bg-emerald-500', text: 'text-emerald-500' };
      default:
        return { score: 0, label: tAuth.strengthWeak, color: 'bg-red-500', text: 'text-red-500' };
    }
  }, [password, tAuth]);

  // Real-time password match confirmation
  const isConfirmMatching = confirmPassword.length > 0 && password === confirmPassword;
  const isConfirmMismatch = confirmPassword.length > 0 && password !== confirmPassword;

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

    if (password.length < 6) {
      setError(tAuth.passwordMin);
      return;
    }

    if (password !== confirmPassword) {
      setError(tAuth.passwordsMismatch);
      return;
    }

    setLoading(true);
    try {
      await handleSignUp(name, email, handle, password);
      setPendingEmail(email);
      router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title={tAuth.signupTitle}
      subtitle={tAuth.signupSub}
      badgeText={tAuth.signupBadge}
      language={language}
      onLanguageChange={setLanguage}
      illustrationSrc="/signupillustration.png"
      illustrationAlt="Citizen Registration"
      showcaseTitle="Standardized 1-Page Application Dossiers"
      showcaseTagline="Compile verified citizen data into official, single-sheet printable A4 applications ready for local submission."
      showcasePoints={[
        'Instant Scheme Matching Across 100+ Programs',
        'Print-Ready Single Sheet A4 Application Dossier',
        'Official QR Verification for Rapid CSC Submission',
      ]}
    >
      {error && (
        <div className="p-2.5 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-2 sm:space-y-2.5">
        {/* Name and Handle in compact 2-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1">
            <label
              htmlFor="signup-name"
              className="text-[11px] font-bold text-foreground block"
            >
              {tAuth.fullName}
            </label>
            <input
              id="signup-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Gowda"
              className="input-sleek h-9"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="signup-handle"
              className="text-[11px] font-bold text-foreground block"
            >
              {tAuth.citizenHandle}
            </label>
            <input
              id="signup-handle"
              type="text"
              required
              value={handle}
              onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              placeholder="e.g. ramesh_farmer"
              className="input-sleek h-9"
            />
          </div>
        </div>

        {/* Email Address */}
        <div className="space-y-1">
          <label
            htmlFor="signup-email"
            className="text-[11px] font-bold text-foreground block"
          >
            {tAuth.email}
          </label>
          <input
            id="signup-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="citizen@gmail.com"
            className="input-sleek h-9"
          />
        </div>

        {/* Password & Confirm Password in 2-column grid with View Password Eye Icon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Password Field with View Eye Toggle */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="signup-password"
                className="text-[11px] font-bold text-foreground block"
              >
                {tAuth.password}
              </label>
              {password && (
                <span className={`text-[10px] font-bold ${passwordStrength.text}`}>
                  {passwordStrength.label}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tAuth.passwordMin}
                className="input-sleek h-9 pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  // Eye Off Icon
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  // Eye Icon
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Password Strength 4-Segment Bar */}
            {password && (
              <div className="grid grid-cols-4 gap-1 pt-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      step <= passwordStrength.score ? passwordStrength.color : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password Field with Match Indicator */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="signup-confirm-password"
                className="text-[11px] font-bold text-foreground block"
              >
                {tAuth.confirmPassword}
              </label>
              {isConfirmMatching && (
                <span className="text-[10px] font-bold text-primary">
                  {tAuth.passwordsMatch}
                </span>
              )}
              {isConfirmMismatch && (
                <span className="text-[10px] font-bold text-destructive">
                  {tAuth.passwordsMismatch}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={tAuth.confirmPassword}
                className={`input-sleek h-9 pr-9 ${
                  isConfirmMismatch ? 'border-destructive focus:border-destructive ring-destructive/20' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none p-1"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  // Eye Off Icon
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  // Eye Icon
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || (confirmPassword.length > 0 && password !== confirmPassword)}
          className="btn-primary-sleek w-full h-10 text-xs font-bold shadow-sm cursor-pointer mt-1"
        >
          {loading ? tAuth.creatingAccount : tAuth.continueVerifyBtn}
        </button>
      </form>

      <div className="pt-2 text-center border-t border-border space-y-1">
        <p className="text-xs text-muted-foreground">
          {tAuth.alreadyRegistered}{' '}
          <Link
            href="/auth/login"
            className="text-primary font-bold hover:underline ml-1"
          >
            {tAuth.signInLink}
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}

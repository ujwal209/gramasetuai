'use client';

import React from 'react';
import Link from 'next/link';
import { LanguageDropdown, type LanguageType } from '@/components/LanguageDropdown';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

interface AuthSplitLayoutProps {
  title: string;
  subtitle: string;
  badgeText?: string;
  illustrationSrc: string;
  illustrationAlt: string;
  showcaseTitle: string;
  showcaseTagline: string;
  showcasePoints: string[];
  language?: LanguageType;
  onLanguageChange?: (lang: LanguageType) => void;
  children: React.ReactNode;
}

export function AuthSplitLayout({
  title,
  subtitle,
  badgeText = 'CITIZEN ACCESS',
  illustrationSrc,
  illustrationAlt,
  showcaseTitle,
  showcaseTagline,
  showcasePoints,
  language: propLang,
  onLanguageChange: propOnChange,
  children,
}: AuthSplitLayoutProps) {
  const globalLang = useLanguage();
  const currentLang = propLang || globalLang.language;
  const handleLangChange = propOnChange || globalLang.setLanguage;

  const tAuth = translations[currentLang]?.auth || translations.en.auth;

  return (
    <div className="h-screen max-h-screen w-full bg-white text-foreground grid grid-cols-1 lg:grid-cols-12 overflow-hidden animate-sleek">
      {/* LEFT COLUMN: Clean Focused Form Side - Non-Scrollable on Desktop */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-8 lg:p-10 bg-white border-r border-border h-full max-h-screen overflow-y-auto lg:overflow-hidden">
        {/* Top Header: Brand Logo & Language Dropdown */}
        <div className="flex items-center justify-between shrink-0 gap-3">
          <Link href="/" className="flex items-center focus:outline-none">
            <img
              src="/logo.png"
              alt="GramSetu"
              className="h-9 sm:h-11 w-auto object-contain"
            />
          </Link>

          <div className="flex items-center gap-2">
            <LanguageDropdown value={currentLang} onChange={handleLangChange} />

            <Link
              href="/"
              className="lg:hidden text-xs font-bold text-muted-foreground hover:text-foreground transition px-2.5 py-1.5 rounded-lg border border-border bg-white"
            >
              {tAuth.backToHome}
            </Link>
          </div>
        </div>

        {/* Center: Main Form Content */}
        <div className="my-auto py-2 max-w-sm sm:max-w-md w-full mx-auto space-y-4 sm:space-y-5 text-left">
          <div className="space-y-1">
            <span className="badge-saas badge-saas-active">
              {badgeText}
            </span>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Form Children */}
          {children}
        </div>

        {/* Bottom: Reassuring Trust Label */}
        <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground shrink-0">
          <span>{tAuth.officialPlatform}</span>
          <span className="text-primary font-bold">{tAuth.zeroMiddlemen}</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Custom Artwork & Value Showcase */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 bg-slate-50/40 flex-col justify-between p-8 xl:p-12 h-full max-h-screen overflow-hidden relative">
        {/* Top: Language Dropdown & Back to Home Link */}
        <div className="flex items-center justify-end gap-3 shrink-0">
          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-lg border border-border bg-white text-xs font-bold text-foreground hover:bg-slate-100 transition shadow-2xs"
          >
            {tAuth.backToHome}
          </Link>
        </div>

        {/* Center: Large Artwork & Feature Card */}
        <div className="my-auto space-y-5 max-w-md xl:max-w-lg mx-auto w-full text-left">
          {/* Large Illustration View */}
          <div className="w-full h-64 sm:h-72 xl:h-80 flex items-center justify-center p-2">
            <img
              src={illustrationSrc}
              alt={illustrationAlt}
              loading="lazy"
              className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
            />
          </div>

          {/* Showcase Feature Card */}
          <div className="card-saas p-5 space-y-2.5 bg-white border border-border shadow-xs">
            <div className="space-y-0.5">
              <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                {showcaseTitle}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {showcaseTagline}
              </p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border">
              {showcasePoints.map((pt, pIdx) => (
                <div
                  key={pIdx}
                  className="flex items-center gap-2 text-xs text-foreground font-medium"
                >
                  <span className="text-primary font-bold">✓</span>
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: Statutory Guarantee Note */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border pt-3 shrink-0">
          <span>Official Gazette Rules Ground Truth</span>
          <span className="text-primary font-bold">Direct Benefit Transfer</span>
        </div>
      </div>
    </div>
  );
}

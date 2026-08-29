'use client';

import React from 'react';
import Link from 'next/link';
import { SCHEME_IMAGES } from '../services/api';
import { ThemeToggle } from '@/components/theme-toggle';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  badgeText?: string;
  children: React.ReactNode;
}

export function AuthLayout({
  title,
  subtitle,
  badgeText = 'Citizen Welfare & Farmer Platform',
  children,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-[#10b981] selection:text-[#ffffff] animate-sleek">
      {/* Top Header */}
      <header className="w-full bg-card border-b border-border py-4 px-6 sm:px-10 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-1.5 group">
          <span className="font-black text-xl tracking-tight text-foreground uppercase">
            Gram<span className="text-[#10b981] dark:text-[#34d399]">Setu</span>
          </span>
          <span className="badge-saas badge-saas-active text-[8px]">
            GOV.IN
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/"
            className="text-xs font-mono-code font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition"
          >
            [ Back to Portal ]
          </Link>
        </div>
      </header>

      {/* Main Center Layout */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="card-saas max-w-5xl w-full flex flex-col md:flex-row shadow-xl overflow-hidden text-left">
          {/* LEFT COLUMN: Clean Editorial Showcase */}
          <div className="hidden md:flex md:w-5/12 bg-muted relative flex-col justify-between p-8 sm:p-10 overflow-hidden">
            <img
              src={SCHEME_IMAGES['pm-kisan-001']}
              alt="GramSetu Agricultural Network"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30 pointer-events-none" />

            {/* Top Brand */}
            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-1.5 text-white font-black text-lg tracking-tight">
                <span>GRAMSETU</span>
                <span className="text-xs font-mono-code font-bold text-[#34d399]">.CIVIC</span>
              </div>
              <p className="text-[10px] uppercase font-mono-code font-bold tracking-widest text-[#a7f3d0]">
                National Welfare Intelligence
              </p>
            </div>

            {/* Middle Feature Highlights */}
            <div className="relative z-10 my-6 p-5 rounded-xl bg-black/75 border border-white/15 backdrop-blur-xs text-white space-y-3">
              <span className="text-[10px] font-mono-code font-bold tracking-wider uppercase text-[#34d399] block">
                [ PLATFORM GUARANTEES ]
              </span>

              <div className="space-y-2 text-xs text-slate-200 font-normal font-sans-sleek">
                <p>01 / 100% Deterministic Gazette Rule Matching</p>
                <p>02 / Zero Brokerage &amp; Direct DBT Integration</p>
                <p>03 / Single-Page CSC Application Dossiers</p>
              </div>
            </div>

            {/* Bottom Pillar Notes */}
            <div className="relative z-10 flex items-center justify-between text-[10px] font-mono-code text-slate-300 border-t border-white/10 pt-3 uppercase">
              <span>National Civic Framework</span>
              <span className="text-[#34d399]">Statutory Verified</span>
            </div>
          </div>

          {/* RIGHT COLUMN: Auth Content Form */}
          <div className="flex-1 p-6 sm:p-10 flex flex-col justify-center space-y-6 bg-card">
            <div className="space-y-1.5">
              <span className="badge-saas badge-saas-neutral">
                {badgeText}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {title}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed font-sans-sleek">
                {subtitle}
              </p>
            </div>

            {children}
          </div>
        </div>
      </main>

      {/* Bottom Footer Bar */}
      <footer className="w-full bg-card border-t border-border py-4 px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-muted-foreground font-mono-code">
        <span>GRAMSETU AI • ZERO-BROKERAGE WELFARE ACCESS</span>
        <span>DIRECT GOVERNMENT SCHEMES PORTAL</span>
      </footer>
    </div>
  );
}

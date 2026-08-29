'use client';

import React from 'react';
import { type LanguageType } from '@/components/LanguageDropdown';
import { translations } from '@/lib/translations';

interface FooterProps {
  language?: LanguageType;
  onTabChange?: (tab: string) => void;
}

export function Footer({ language = 'en', onTabChange }: FooterProps) {
  const t = translations[language]?.footer || translations.en.footer;

  return (
    <footer className="bg-card text-muted-foreground pt-12 pb-8 border-t border-border text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-4 text-left">
            <div className="flex items-center">
              <img
                src="/logo.png"
                alt="GramSetu"
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </div>

            <p className="text-muted-foreground leading-relaxed text-xs max-w-md font-normal">
              {t.mission}
            </p>

            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t.groundTruth}
            </span>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 text-left">
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground block">
              {t.quickAccess}
            </span>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onTabChange && onTabChange('schemes')}
                  className="text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  {t.schemesLink}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onTabChange && onTabChange('schemes')}
                  className="text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  {t.directoryLink}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onTabChange && onTabChange('applications')}
                  className="text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  {t.trackingLink}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onTabChange && onTabChange('kagazcheck')}
                  className="text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  {t.kagazcheckLink}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onTabChange && onTabChange('parchaa')}
                  className="text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  {t.parchaaLink}
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Standards */}
          <div className="space-y-3 text-left">
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground block">
              {t.policyHeading}
            </span>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-muted-foreground">
                  {t.slaPolicy}
                </span>
              </li>
              <li>
                <span className="text-muted-foreground">
                  {t.rtiPolicy}
                </span>
              </li>
              <li>
                <span className="text-muted-foreground">
                  {t.grievancePolicy}
                </span>
              </li>
              <li>
                <span className="text-muted-foreground">
                  {t.dbtPolicy}
                </span>
              </li>
              <li>
                <span className="text-muted-foreground">
                  {t.gazettePolicy}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-6 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} {t.copyright}
          </p>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>{t.groundTruth}</span>
            <span>•</span>
            <span>Zero Middlemen</span>
            <span>•</span>
            <span>Direct Benefit Transfer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

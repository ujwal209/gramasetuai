'use client';

import React from 'react';
import { type LanguageType } from '@/components/LanguageDropdown';
import { translations } from '@/lib/translations';

interface KisanChaupalSectionProps {
  language?: LanguageType;
  onJoinClick: () => void;
}

export function KisanChaupalSection({
  language = 'en',
  onJoinClick,
}: KisanChaupalSectionProps) {
  const t = translations[language]?.kisanChaupal || translations.en.kisanChaupal;

  const socialFeatures = [
    {
      title: t.feat1Title,
      description: t.feat1Desc,
      icon: (
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      title: t.feat2Title,
      description: t.feat2Desc,
      icon: (
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
    },
    {
      title: t.feat3Title,
      description: t.feat3Desc,
      icon: (
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      title: t.feat4Title,
      description: t.feat4Desc,
      icon: (
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
  ];

  return (
    <section className="p-6 sm:p-10 lg:p-12 card-saas border border-border bg-card text-left space-y-8 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column (6 cols): Large Social Media Illustration */}
        <div className="lg:col-span-6 w-full flex items-center justify-center">
          <div className="w-full h-80 sm:h-96 lg:h-[440px] flex items-center justify-center p-2">
            <img
              src="/kisanchaupal(social_media).png"
              alt="Kisan Chaupal"
              loading="lazy"
              className="w-full h-full object-contain transition-transform duration-300 hover:scale-102"
            />
          </div>
        </div>

        {/* Right Column (6 cols): Content, Features, and Action */}
        <div className="lg:col-span-6 space-y-6 w-full">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="badge-saas badge-saas-active">
                {t.badge1}
              </span>
              <span className="badge-saas badge-saas-contrast text-[10px]">
                {t.badge2}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight leading-tight">
              {t.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          {/* 4 Feature Grid Pills with Clean SVG Icons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {socialFeatures.map((feat, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1.5 hover:border-primary/40 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {feat.icon}
                  </div>
                  <h3 className="text-xs font-bold text-foreground">
                    {feat.title}
                  </h3>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed pl-9">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>

          {/* Social Proof & Join CTA Button */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-foreground">
                {t.verified}
              </span>
              <p className="text-[11px] text-muted-foreground">
                {t.verifiedSub}
              </p>
            </div>

            <button
              type="button"
              onClick={onJoinClick}
              className="btn-primary-sleek h-11 px-6 text-xs font-bold w-full sm:w-auto shrink-0 shadow-sm"
            >
              {t.cta} →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

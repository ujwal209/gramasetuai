'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { VaniBot } from '@/components/VaniBot';
import { SchemeDetailsModal } from '@/components/SchemeDetailsModal';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { dashboardTranslations } from '@/lib/dashboardTranslations';
import { type Scheme, type CitizenProfile } from '@/services/api';

export default function DashboardVaniBotPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);

  const t = dashboardTranslations[language]?.vani || dashboardTranslations.en.vani;

  const citizenProfile: CitizenProfile = {
    state: user?.state || 'Karnataka',
    category: user?.caste_category || 'General/OBC',
    gender: user?.gender || 'Male',
    income_level: 'Low',
    occupation: 'Small & Marginal Farmer',
    landholding_acres: user?.landholding_acres ?? 3.5,
    disability: false,
    bpl_card: true,
  };

  return (
    <div className="space-y-6 text-left animate-sleek max-w-5xl mx-auto pb-12 bg-white">
      {/* Header Banner with Sub-Navigation Links - Fully Localized & Pure White */}
      <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold font-mono">
              REGIONAL SPEECH &amp; DIALECT AI
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              6 INDIAN LANGUAGES
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.title}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            {t.subtitle}
          </p>

          {/* Sub-Navigation Tabs */}
          <div className="pt-2 flex items-center gap-2">
            <Link
              href="/dashboard/vanibot"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold transition shadow-xs"
            >
              {t.liveTab}
            </Link>
            <Link
              href="/dashboard/vanibot/history"
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
            >
              {t.archivesTab} →
            </Link>
          </div>
        </div>

        {/* Clean Floating Illustration */}
        <div className="w-full md:w-56 shrink-0 flex items-center justify-center">
          <img src="/vani.png" alt="Vani Voice AI" className="w-full h-auto object-contain max-h-48" />
        </div>
      </div>

      <VaniBot
        citizenProfile={citizenProfile}
        onOpenSchemeModal={(scheme: any) => setSelectedScheme(scheme)}
        onOpenKagazCheck={() => {
          router.push('/dashboard/kagazcheck');
        }}
        onOpenParchaa={() => {
          router.push('/dashboard/parchaa');
        }}
      />

      {selectedScheme && (
        <SchemeDetailsModal
          scheme={selectedScheme}
          profile={citizenProfile}
          onClose={() => setSelectedScheme(null)}
          onApply={() => {
            setSelectedScheme(null);
            router.push('/dashboard/parchaa');
          }}
        />
      )}
    </div>
  );
}

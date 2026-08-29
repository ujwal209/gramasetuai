'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { dashboardTranslations } from '@/lib/dashboardTranslations';
import { type Scheme, getPopularSchemes } from '@/services/api';

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const t = dashboardTranslations[language]?.overview || dashboardTranslations.en.overview;

  useEffect(() => {
    async function loadSchemes() {
      setLoading(true);
      try {
        const data = await getPopularSchemes();
        setSchemes(data);
      } catch (err) {
        console.error('Failed to load schemes:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSchemes();
  }, []);

  return (
    <div className="space-y-8 text-left animate-sleek max-w-7xl mx-auto pb-12 bg-white">
      {/* 1. HERO BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-xs flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="space-y-3.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold tracking-wide">
              VERIFIED CITIZEN DOSSIER
            </span>
            <span className="text-xs text-slate-500 font-mono">
              @{user?.handle || 'citizen'} • {user?.district || 'Mandya'}, {user?.state || 'Karnataka'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t.welcomeGreeting} {user?.name || 'Citizen Farmer'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            {t.welcomeSub}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/schemes"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Explore Matching Schemes →
            </Link>
            <Link
              href="/dashboard/chaupal"
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition cursor-pointer"
            >
              Open Kisan Chaupal
            </Link>
          </div>
        </div>

        {/* Hero Illustration */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 flex items-center justify-center">
          <img
            src="/dashboard/maindshboard.png"
            alt="GramSetu Dashboard"
            className="w-full h-auto object-contain max-h-52"
          />
        </div>
      </div>

      {/* 2. FEATURED HIGHLIGHT: KISAN CHAUPAL SOCIAL MEDIA & COMMUNITY (Illustration on Left) */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 bg-slate-50/60 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-8 group">
        {/* Highlight Illustration on Left */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 flex items-center justify-center order-2 lg:order-1">
          <img
            src="/kisanchaupal(social_media).png"
            alt="Kisan Chaupal Social Network"
            className="w-full h-auto object-contain max-h-56 group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Content Details on Right */}
        <div className="space-y-4 max-w-2xl order-1 lg:order-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 text-[10px] font-bold font-mono">
              FEATURED COMMUNITY
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              REAL-TIME FARMER NETWORK
            </span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Kisan Chaupal Social Media &amp; Marketplace
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1.5">
              Connect with progressive farmers across India. Share 24h stories, photo posts, crop advisory, trade produce at 0% commission, and chat directly in regional languages.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Link
              href="/dashboard/chaupal"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
            >
              Social Feed &amp; Stories →
            </Link>
            <Link
              href="/dashboard/chaupal/messages"
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition shadow-2xs"
            >
              Direct Messages
            </Link>
            <Link
              href="/dashboard/chaupal/marketplace"
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition shadow-2xs"
            >
              Krishi Marketplace
            </Link>
          </div>
        </div>
      </div>

      {/* 3. CORE PLATFORM ENGINES & WORKFLOWS */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Core Agricultural Services &amp; AI Engines
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic welfare matching, multilingual voice assistant, statutory legal intelligence, and direct marketplace.
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-400 font-mono">
            4 ACTIVE MODULES
          </span>
        </div>

        {/* 4-Card Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Scheme Discovery & Eligibility */}
          <Link
            href="/dashboard/schemes"
            className="p-5 rounded-3xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="space-y-3">
              <div className="w-full h-36 flex items-center justify-center">
                <img
                  src="/dashboard/Scheme Recommendation & Matching Feed.png"
                  alt="Scheme Discovery"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  WELFARE MATCHING
                </span>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-slate-700 transition">
                  Scheme Discovery
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  Deterministic rule matching against official Gazette guidelines for Central &amp; State subsidies.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-700 flex items-center justify-between pt-1 border-t border-slate-100">
              <span>Explore Schemes</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </Link>

          {/* Card 2: Vani Voice Assistant */}
          <Link
            href="/dashboard/vanibot"
            className="p-5 rounded-3xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="space-y-3">
              <div className="w-full h-36 flex items-center justify-center">
                <img
                  src="/vani.png"
                  alt="Vani Voice Bot"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  VOICE AI • 6 LANG
                </span>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-slate-700 transition">
                  Vani Voice Studio
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  Speak naturally in Kannada, Hindi, Telugu, Tamil, Marathi, or English with audio summaries.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-700 flex items-center justify-between pt-1 border-t border-slate-100">
              <span>Launch Voice Bot</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </Link>

          {/* Card 3: Krishi Mandi Marketplace */}
          <Link
            href="/dashboard/chaupal/marketplace"
            className="p-5 rounded-3xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="space-y-3">
              <div className="w-full h-36 flex items-center justify-center">
                <img
                  src="/dashboard/Document Vault & Verification Status Card.png"
                  alt="Krishi Marketplace"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  COMMERCE
                </span>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-slate-700 transition">
                  Krishi Marketplace
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  Direct farmer-to-farmer trade for grains, seeds, cattle, and tractor rentals with WhatsApp contacts.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-700 flex items-center justify-between pt-1 border-t border-slate-100">
              <span>Browse Marketplace</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </Link>

          {/* Card 4: Niti RAG Legal Advisory */}
          <Link
            href="/dashboard/nitirag"
            className="p-5 rounded-3xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="space-y-3">
              <div className="w-full h-36 flex items-center justify-center">
                <img
                  src="/nitirag.png"
                  alt="Niti RAG Legal AI"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  STATUTORY AI
                </span>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-slate-700 transition">
                  Niti Legal Advisor
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  Direct AI legal advisory cited from official Central &amp; State agricultural gazettes and circulars.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-700 flex items-center justify-between pt-1 border-t border-slate-100">
              <span>Legal Chat Advisor</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

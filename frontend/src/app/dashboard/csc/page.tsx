'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function CSCOperatorPage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  return (
    <div className="space-y-6 text-left animate-sleek max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-2 max-w-xl">
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
            VILLAGE KIOSK MODE
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            CSC Village Operator & Kiosk Queue Monitor
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Assisted mode for Village Level Entrepreneurs (VLE) to file applications for non-digital rural farmers with instant biometrics and digital tokens.
          </p>
        </div>

        <div className="w-full md:w-64 shrink-0 flex items-center justify-center">
          <img src="/cscoperator.png" alt="CSC Operator" className="w-full h-auto object-contain max-h-48" />
        </div>
      </div>

      {/* Analytics Widget Illustration */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Gram Panchayat Queue Analytics</h2>
            <p className="text-xs text-slate-500">Live docket metrics for {user?.district || 'Mandya'} CSC centers</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
            ● KIOSK ONLINE
          </span>
        </div>

        <div className="w-full flex items-center justify-center">
          <img
            src="/dashboard/CSC  Village Operator Analytics & Queue Monitor.png"
            alt="CSC Queue Monitor"
            className="w-full h-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
}

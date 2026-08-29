'use client';

import { ParchaaGenerator } from '@/components/ParchaaGenerator';

export default function DashboardParchaaPage() {
  return (
    <div className="space-y-6 text-left animate-sleek max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-2 max-w-xl">
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
            STATUTORY DOSSIER GENERATOR
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Parchaa Application Dossier &amp; Print System
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Generate structured physical and digital application dossiers with official QR verification for Gram Panchayat and CSC centers.
          </p>
        </div>

        <div className="w-full md:w-56 shrink-0 flex items-center justify-center">
          <img src="/parcha.png" alt="Parchaa Dossier" className="w-full h-auto object-contain max-h-48" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs p-4 sm:p-6">
        <ParchaaGenerator />
      </div>
    </div>
  );
}

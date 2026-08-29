'use client';

import { KagazCheckAuditor } from '@/components/KagazCheckAuditor';

export default function DashboardKagazCheckPage() {
  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-2 max-w-xl">
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
            STATUTORY DOCUMENT AUDIT
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            KagazCheck Document Auditor &amp; Vault
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Verify your land records (RTC/Pahani/7-12), Aadhaar DBT link, and bank passbooks before visiting the CSC with automated OCR validation.
          </p>
        </div>

        <div className="w-full md:w-56 shrink-0 flex items-center justify-center">
          <img src="/kagazcheck.png" alt="KagazCheck Document Auditor" className="w-full h-auto object-contain max-h-48" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs p-4 sm:p-6">
        <KagazCheckAuditor />
      </div>
    </div>
  );
}

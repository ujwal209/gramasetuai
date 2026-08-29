'use client';

import { MyApplicationsView } from '@/components/MyApplicationsView';

export default function DashboardApplicationsPage() {
  return (
    <div className="space-y-6 text-left animate-sleek max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-2 max-w-xl">
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
            STATUTORY STAGE TRACKER
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Applications &amp; Live Stage Tracker
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Track the live progress of your submitted Parchaa dossiers through Tehsil, Gram Panchayat verification, and DBT bank disbursements.
          </p>
        </div>

        <div className="w-full md:w-56 shrink-0 flex items-center justify-center">
          <img src="/smsdispatcher.png" alt="Application Tracker" className="w-full h-auto object-contain max-h-48" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs p-4 sm:p-6">
        <MyApplicationsView />
      </div>
    </div>
  );
}

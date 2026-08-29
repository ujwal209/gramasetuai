'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);

  return (
    <div className="space-y-6 text-left animate-sleek max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-2 max-w-xl">
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
            MULTI-CHANNEL BROADCAST
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            WhatsApp & SMS Dispatch Alerts
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Receive automated SMS and WhatsApp updates directly when your DBT subsidies are sanctioned or scheme deadlines approach.
          </p>
        </div>

        <div className="w-full md:w-56 shrink-0 flex items-center justify-center">
          <img src="/whatsappintegration.png" alt="WhatsApp Integration" className="w-full h-auto object-contain max-h-48" />
        </div>
      </div>

      {/* Channel Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* WhatsApp Channel */}
        <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-sm">
                WA
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">WhatsApp Official Bot</h3>
                <p className="text-[11px] text-slate-500">{user?.phone || '+91 98765 43210'}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setWhatsappEnabled(!whatsappEnabled)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${
                whatsappEnabled
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {whatsappEnabled ? '✓ CONNECTED' : 'DISABLED'}
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Directly receive digital PDFs of Parchaa submission receipts and weather advisories to your registered WhatsApp number.
          </p>
        </div>

        {/* SMS Dispatcher Channel */}
        <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center font-bold text-sm">
                SMS
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Govt NIC-SMS Gateway</h3>
                <p className="text-[11px] text-slate-500">Statutory SMS alerts</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSmsEnabled(!smsEnabled)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${
                smsEnabled
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {smsEnabled ? '✓ ACTIVE' : 'DISABLED'}
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Standard text alerts in your regional language for DBT subsidy approvals and application stage progression.
          </p>
        </div>
      </div>
    </div>
  );
}

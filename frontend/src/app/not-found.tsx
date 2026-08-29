'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Logo & 404 Badge */}
        <div className="flex flex-col items-center space-y-3">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="GramSetu" className="h-8 w-auto object-contain" />
            <span className="text-base font-bold text-slate-900 tracking-tight">
              GramSetu
            </span>
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>ERROR 404 • PAGE NOT FOUND</span>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Lost in the Fields?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            The page you are looking for might have been moved, removed, or is temporarily unavailable.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            ← Return to Dashboard
          </Link>
          <Link
            href="/dashboard/chaupal"
            className="w-full sm:w-auto px-6 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Open Kisan Chaupal
          </Link>
        </div>

        {/* Quick Links Grid */}
        <div className="pt-6 border-t border-slate-100 text-left space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 block text-center">
            Quick Navigation
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              href="/dashboard/schemes"
              className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition text-slate-700 font-semibold flex items-center justify-between"
            >
              <span>Scheme Discovery</span>
              <span className="text-slate-400">→</span>
            </Link>
            <Link
              href="/dashboard/vanibot"
              className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition text-slate-700 font-semibold flex items-center justify-between"
            >
              <span>Vani Voice Bot</span>
              <span className="text-slate-400">→</span>
            </Link>
            <Link
              href="/dashboard/nitirag"
              className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition text-slate-700 font-semibold flex items-center justify-between"
            >
              <span>Niti Legal AI</span>
              <span className="text-slate-400">→</span>
            </Link>
            <Link
              href="/dashboard/chaupal/marketplace"
              className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition text-slate-700 font-semibold flex items-center justify-between"
            >
              <span>Krishi Market</span>
              <span className="text-slate-400">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

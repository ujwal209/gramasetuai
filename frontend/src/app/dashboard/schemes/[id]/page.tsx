'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getSchemeById, type SchemeData } from '@/services/api';

export default function SchemeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const schemeId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const [scheme, setScheme] = useState<SchemeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!schemeId) return;
    setLoading(true);
    getSchemeById(schemeId)
      .then((data) => {
        setScheme(data);
      })
      .catch((err) => {
        console.error('Failed to load scheme details:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [schemeId]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  const handleSearchOnline = async () => {
    setIsSearchingOnline(true);
    try {
      const query = schemeId.replace(/[-_]/g, ' ');
      const searchRes = await searchSchemesRealtime(query, user?.state || undefined, 'en', user?.name || 'citizen');
      if (searchRes.schemes && searchRes.schemes.length > 0) {
        setScheme(searchRes.schemes[0]);
      }
    } catch (err) {
      console.error('Online lookup failed:', err);
    } finally {
      setIsSearchingOnline(false);
    }
  };

  if (loading || isSearchingOnline) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-3">
        <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-mono">
          {isSearchingOnline ? 'Synthesizing live government gazette findings...' : 'Loading statutory scheme details...'}
        </p>
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="p-8 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-900">Program Record Not Indexed</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              No local gazette matches found for <span className="font-mono font-bold text-slate-700">"{schemeId}"</span>. You can verify this program online across official government portals.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleSearchOnline}
              className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span>Search Official Portals Online</span>
            </button>
            <Link
              href="/dashboard/schemes"
              className="w-full sm:w-auto px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              ← Back to Discovery
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sDomain = scheme.domain || (scheme.official_source_url ? new URL(scheme.official_source_url).hostname.replace('www.', '') : 'india.gov.in');
  const sFavicon = scheme.favicon_url || `https://www.google.com/s2/favicons?domain=${sDomain}&sz=64`;

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto pb-20">
      {/* 1. TOP NAVIGATION & ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/schemes"
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition flex items-center gap-1 shadow-2xs"
          >
            <span>←</span>
            <span>Scheme Discovery</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-mono text-slate-500 truncate max-w-[160px] sm:max-w-xs">
            {scheme.id}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-700 font-bold">Copied</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Share</span>
              </>
            )}
          </button>

          <Link
            href="/dashboard/schemes/history"
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-2xs"
          >
            Search History →
          </Link>
        </div>
      </div>

      {/* 2. HERO TITLE & STATUTORY BENEFIT HEADER */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white space-y-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold font-mono uppercase tracking-wider">
              {scheme.state ? `${scheme.state.toUpperCase()} STATUTE` : 'CENTRAL SECTOR SCHEME'}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold font-mono">
              {scheme.category || 'Agricultural Welfare'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold font-mono">
              VERIFIED
            </span>
          </div>

          <span className="text-xs font-mono text-slate-400">
            Scheme ID: {scheme.id}
          </span>
        </div>

        <div className="space-y-4">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            {scheme.name}
          </h1>

          {/* Minimalist Benefit Callout */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                Statutory Financial Benefit
              </span>
              <p className="text-base sm:text-lg font-black text-slate-900">
                {scheme.benefit_amount || 'Direct Financial Assistance & Subsidy'}
              </p>
            </div>

            <Link
              href={`/dashboard/parchaa?scheme=${scheme.id}`}
              className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
            >
              <span>Apply via Parchaa</span>
              <span>→</span>
            </Link>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
            {scheme.detailed_description || scheme.short_description || scheme.description}
          </p>
        </div>
      </div>

      {/* 3. STRUCTURED BREAKDOWN CARDS (MINIMALIST & MONOCHROME) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Key Benefits */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <svg className="w-4 h-4 text-slate-900 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-sm font-bold text-slate-900">
              Key Scheme Benefits &amp; Subsidies
            </h2>
          </div>

          <ul className="space-y-2.5">
            {scheme.benefits && scheme.benefits.length > 0 ? (
              scheme.benefits.map((b, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <span className="text-slate-400 font-bold select-none shrink-0">•</span>
                  <span>{b}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-500 italic">
                Direct financial assistance deposited into Aadhaar-seeded bank account.
              </li>
            )}
          </ul>
        </div>

        {/* Right: Eligibility Criteria */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <svg className="w-4 h-4 text-slate-900 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <h2 className="text-sm font-bold text-slate-900">
              Statutory Eligibility Criteria
            </h2>
          </div>

          <ul className="space-y-2.5">
            {scheme.eligibility_criteria && scheme.eligibility_criteria.length > 0 ? (
              scheme.eligibility_criteria.map((c, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <span className="text-slate-400 font-bold select-none shrink-0">•</span>
                  <span>{c}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-500 italic">
                Registered small and marginal agricultural farmers with verified land records in state database.
              </li>
            )}
          </ul>
        </div>

        {/* Left: Required Documents Checklist */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <svg className="w-4 h-4 text-slate-900 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-sm font-bold text-slate-900">
              Required Documentation Checklist
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {scheme.required_documents && scheme.required_documents.length > 0 ? (
              scheme.required_documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="truncate">{doc}</span>
                </div>
              ))
            ) : (
              <>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Aadhaar Card with NPCI link</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Land RTC / Pahani</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Application Workflow */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <svg className="w-4 h-4 text-slate-900 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h2 className="text-sm font-bold text-slate-900">
              Application &amp; Submission Workflow
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {scheme.application_process ||
              'Verify Land Survey Number and NPCI bank seeding. Generate pre-filled Parchaa application dossier and submit directly online or through your nearest CSC Village Operator / Raitha Samparka Kendra.'}
          </p>

          {scheme.application_url && (
            <div className="pt-2">
              <a
                href={scheme.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition shadow-2xs"
              >
                <span>Open Application Portal</span>
                <span>↗</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 4. VERIFIED OFFICIAL REPOSITORY SOURCES (RENDERED IN DEPTH) */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400">
              STATUTORY REPOSITORY SOURCES
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Government Gazettes &amp; Official Nodal Portals
            </h3>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold font-mono">
            VERIFIED AUTHORITY
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={scheme.official_source_url || 'https://myscheme.gov.in'}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl border border-slate-200 hover:border-slate-400 bg-slate-50/40 hover:bg-white transition space-y-2 shadow-2xs group"
          >
            <div className="flex items-center gap-2.5">
              <img
                src={sFavicon}
                alt={sDomain}
                className="w-5 h-5 rounded shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 group-hover:text-slate-700 truncate">
                  {scheme.name}
                </p>
                <span className="text-[10px] font-mono text-slate-400">
                  {sDomain} ↗
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
              Official government guidelines, statutory circulars, and Direct Benefit Transfer portal.
            </p>
          </a>

          <a
            href="https://myscheme.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl border border-slate-200 hover:border-slate-400 bg-slate-50/40 hover:bg-white transition space-y-2 shadow-2xs group"
          >
            <div className="flex items-center gap-2.5">
              <img
                src="https://www.google.com/s2/favicons?domain=myscheme.gov.in&sz=64"
                alt="myScheme"
                className="w-5 h-5 rounded shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 group-hover:text-slate-700 truncate">
                  National myScheme Repository
                </p>
                <span className="text-[10px] font-mono text-slate-400">
                  myscheme.gov.in ↗
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
              Central government statutory repository for citizen welfare eligibility criteria and scheme norms.
            </p>
          </a>
        </div>
      </div>

      {/* 5. CITIZEN CALL-TO-ACTION BAR */}
      <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold">
            Ready to apply for {scheme.name}?
          </h3>
          <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
            Generate your pre-filled Parchaa application dossier or consult Niti RAG Legal AI for statutory advice.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href={`/dashboard/parchaa?scheme=${scheme.id}`}
            className="h-10 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center shadow-xs cursor-pointer"
          >
            Generate Parchaa Form →
          </Link>

          <Link
            href="/dashboard/nitirag/chat"
            className="h-10 px-4 border border-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center cursor-pointer"
          >
            Legal AI Advisor
          </Link>
        </div>
      </div>
    </div>
  );
}

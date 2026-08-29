'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CustomDropdown } from '@/components/CustomDropdown';
import {
  searchSchemesRealtime,
  getPopularSchemes,
  FALLBACK_VERIFIED_SCHEMES,
  type SchemeData,
  type SchemeMatchResult,
  type RealtimeSearchResponse,
} from '../services/api';

interface PopularSchemesProps {
  schemes?: SchemeData[];
  loading?: boolean;
  onViewDetails?: (scheme: SchemeData | SchemeMatchResult) => void;
  onSelectScheme?: (scheme: SchemeData | SchemeMatchResult) => void;
  onCheckEligibility?: () => void;
}

const INDIAN_STATES = [
  'All India (Central)',
  'Karnataka',
  'Maharashtra',
  'Uttar Pradesh',
  'Tamil Nadu',
  'Andhra Pradesh',
  'Telangana',
  'Rajasthan',
  'Punjab',
  'Madhya Pradesh',
  'Bihar',
  'Gujarat',
  'Odisha',
];

const SECTORS = [
  'All Sectors',
  'Agriculture & Direct Benefit Transfer',
  'Crop Insurance & Subsidies',
  'Solar Energy & Solar Pump Subsidies',
  'Credit Support & Kisan Loans',
  'Rural Housing & Infrastructure',
  'Social Welfare & Pension',
  'Women & Child Welfare',
  'Education & Scholarships',
];

const BENEFICIARY_CATEGORIES = [
  'All Citizens',
  'Small & Marginal Farmers (<2 Ha)',
  'All Landholding Farmers',
  'Women Farmers & Self Help Groups',
  'Scheduled Caste / Scheduled Tribe',
  'BPL / Antyodaya Ration Card Holders',
];

const ASSISTANCE_TYPES = [
  'All Assistance Types',
  'Direct Cash Transfer (DBT)',
  'Capital Subsidy & Machinery Grant',
  'Subsidized Loan / Interest Subvention',
  'Insurance Coverage & Compensation',
  'In-Kind Support / Free Seed & Fertilizer',
];

const QUICK_SUGGESTIONS = [
  'PM-KISAN ₹6,000 DBT',
  'KUSUM Solar Pump Subsidy',
  'Kisan Credit Card 4% Loan',
  'PMAY-G Rural Housing ₹1.2L',
  'Ayushman Bharat ₹5L Health',
  'Raitha Vidya Nidhi Scholarship',
];

const INITIAL_BATCH_SIZE = 6;
const BATCH_INCREMENT = 6;

export function PopularSchemes({
  schemes: initialSchemes,
  onCheckEligibility,
}: PopularSchemesProps) {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // Initialize with fallback immediately
  const [localSchemes, setLocalSchemes] = useState<SchemeData[]>(() => {
    if (initialSchemes && initialSchemes.length > 0) return initialSchemes;
    return FALLBACK_VERIFIED_SCHEMES;
  });

  // View Mode: 'list' (default master rows) vs 'grid' (cards)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All India (Central)');
  const [selectedSector, setSelectedSector] = useState('All Sectors');
  const [beneficiaryCategory, setBeneficiaryCategory] = useState('All Citizens');
  const [assistanceType, setAssistanceType] = useState('All Assistance Types');

  // Progressive "View More" Pagination State
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Real-time Search Result State
  const [realtimeResults, setRealtimeResults] = useState<RealtimeSearchResponse | null>(null);
  const [isSearchingRealtime, setIsSearchingRealtime] = useState(false);

  // Ref guards to prevent infinite re-render loops
  const hasFetchedRef = useRef(false);
  const lastSearchedQRef = useRef<string | null>(null);

  // Fetch verified schemes from backend once
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    if (!initialSchemes || initialSchemes.length === 0) {
      getPopularSchemes()
        .then((data) => {
          if (data && data.length > 0) {
            setLocalSchemes(data);
          }
        })
        .catch((err) => {
          console.warn('Using local fallback schemes:', err);
        });
    }
  }, [initialSchemes]);

  // Auto-run search once if query params are present in URL
  useEffect(() => {
    const qParam = searchParams.get('q');
    const stateParam = searchParams.get('state');
    if (qParam && qParam !== lastSearchedQRef.current) {
      lastSearchedQRef.current = qParam;
      setSearchQuery(qParam);
      if (stateParam) setSelectedState(stateParam);
      executeSearch(qParam, stateParam || undefined);
    }
  }, [searchParams]);

  // Reset visibleCount to initial batch size whenever filters change
  useEffect(() => {
    setVisibleCount(INITIAL_BATCH_SIZE);
  }, [searchQuery, selectedState, selectedSector, beneficiaryCategory, assistanceType]);

  const executeSearch = async (queryText: string, stateFilter?: string) => {
    if (!queryText.trim()) {
      setRealtimeResults(null);
      return;
    }

    setIsSearchingRealtime(true);
    try {
      const activeState =
        stateFilter ||
        (selectedState === 'All India (Central)' ? undefined : selectedState);
      const res = await searchSchemesRealtime(
        queryText,
        activeState,
        'en',
        user?.name || 'citizen'
      );
      setRealtimeResults(res);
      setVisibleCount(INITIAL_BATCH_SIZE);
    } catch (err) {
      console.error('Realtime search failed:', err);
    } finally {
      setIsSearchingRealtime(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleQuickSuggestionClick = (suggestionText: string) => {
    setSearchQuery(suggestionText);
    executeSearch(suggestionText);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setRealtimeResults(null);
    lastSearchedQRef.current = null;
    setVisibleCount(INITIAL_BATCH_SIZE);
  };

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + BATCH_INCREMENT);
      setIsLoadingMore(false);
    }, 150);
  };

  // Filter Local Schemes if no realtime search results are active
  const filteredLocalSchemes = (realtimeResults?.schemes && realtimeResults.schemes.length > 0)
    ? realtimeResults.schemes
    : localSchemes.filter((scheme) => {
        if (selectedState !== 'All India (Central)') {
          const matchState =
            !scheme.state ||
            scheme.state.toLowerCase() === 'all' ||
            scheme.state.toLowerCase() === 'central' ||
            scheme.state.toLowerCase().includes(selectedState.toLowerCase());
          if (!matchState) return false;
        }

        if (selectedSector !== 'All Sectors') {
          const cat = scheme.category?.toLowerCase() || '';
          if (selectedSector.includes('Agriculture') && !cat.includes('agri') && !cat.includes('farm')) return false;
          if (selectedSector.includes('Insurance') && !cat.includes('insur') && !cat.includes('crop')) return false;
          if (selectedSector.includes('Solar') && !cat.includes('solar') && !cat.includes('energy')) return false;
          if (selectedSector.includes('Credit') && !cat.includes('credit') && !cat.includes('loan')) return false;
          if (selectedSector.includes('Housing') && !cat.includes('hous') && !cat.includes('awas')) return false;
          if (selectedSector.includes('Women') && !cat.includes('women') && !cat.includes('mother')) return false;
          if (selectedSector.includes('Education') && !cat.includes('edu') && !cat.includes('scholar')) return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const nameMatch = scheme.name.toLowerCase().includes(q);
          const descMatch = (scheme.short_description || scheme.description || '').toLowerCase().includes(q);
          const catMatch = (scheme.category || '').toLowerCase().includes(q);
          return nameMatch || descMatch || catMatch;
        }

        return true;
      });

  // Calculate Progressive Display Slice
  const totalItems = filteredLocalSchemes.length;
  const displayedSchemes = filteredLocalSchemes.slice(0, visibleCount);
  const remainingCount = Math.max(0, totalItems - displayedSchemes.length);
  const hasMore = remainingCount > 0;

  const aiOverview = realtimeResults?.ai_overview;
  const sources = realtimeResults?.sources || [];

  return (
    <div className="space-y-6 text-left">
      {/* 1. DISCOVERY & SEARCH MATRIX */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold font-mono uppercase tracking-wider">
              OFFICIAL WELFARE DIRECTORY
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Government Schemes &amp; Direct Benefits
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/schemes/history"
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Search History Archives →</span>
            </Link>
          </div>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scheme name, benefit keyword (e.g. ₹6000, solar pump, drip loan)..."
              className="flex-1 h-11 px-4 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-800 transition shadow-2xs text-slate-900"
            />
            <button
              type="submit"
              disabled={isSearchingRealtime}
              className="h-11 px-5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
            >
              {isSearchingRealtime ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Search</span>
                </>
              )}
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="h-11 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0"
              >
                Reset
              </button>
            )}
          </div>

          {/* 4-Dropdown Filter Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <CustomDropdown
              label="State / Region"
              value={selectedState}
              onChange={(val) => setSelectedState(val)}
              options={INDIAN_STATES}
              searchable={true}
            />

            <CustomDropdown
              label="Sector"
              value={selectedSector}
              onChange={(val) => setSelectedSector(val)}
              options={SECTORS}
            />

            <CustomDropdown
              label="Beneficiary"
              value={beneficiaryCategory}
              onChange={(val) => setBeneficiaryCategory(val)}
              options={BENEFICIARY_CATEGORIES}
            />

            <CustomDropdown
              label="Assistance"
              value={assistanceType}
              onChange={(val) => setAssistanceType(val)}
              options={ASSISTANCE_TYPES}
            />
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider shrink-0 mr-1">
              POPULAR:
            </span>
            {QUICK_SUGGESTIONS.map((sugg, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickSuggestionClick(sugg)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] text-slate-700 whitespace-nowrap transition cursor-pointer font-medium"
              >
                {sugg}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* 2. REAL-TIME AI STATUTORY OVERVIEW */}
      {aiOverview && (
        <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold font-mono">
              AI STATUTORY OVERVIEW
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              SAVED IN DATABASE HISTORY
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              {typeof aiOverview === 'object' && aiOverview.headline
                ? aiOverview.headline
                : 'Verified Scheme Analysis & Legal Overview'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {typeof aiOverview === 'object' ? aiOverview.summary : aiOverview}
            </p>

            {typeof aiOverview === 'object' && aiOverview.key_takeaways && aiOverview.key_takeaways.length > 0 && (
              <ul className="space-y-1.5 pt-2">
                {aiOverview.key_takeaways.map((takeaway, tIdx) => (
                  <li key={tIdx} className="flex items-start gap-2 text-xs text-slate-800">
                    <span className="text-slate-400 font-bold select-none">•</span>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* 3. TAVILY VERIFIED SOURCES RENDERED IN DEPTH */}
      {sources.length > 0 && (
        <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                OFFICIAL GOVERNMENT SOURCES
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Official Government Portals &amp; Gazette Sources ({sources.length})
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold font-mono">
              LIVE VERIFIED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sources.map((src, sIdx) => (
              <div
                key={sIdx}
                className="p-4 rounded-xl bg-slate-50/60 border border-slate-200 hover:border-slate-400 hover:bg-white text-xs space-y-2.5 transition shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono gap-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <img
                        src={src.favicon_url || `https://www.google.com/s2/favicons?domain=${src.domain}&sz=64`}
                        alt={src.domain}
                        className="w-4 h-4 rounded shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="font-bold text-slate-800 truncate">{src.domain}</span>
                    </div>
                    <span className="text-slate-400 text-[10px]">Official</span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug">
                    {src.title}
                  </h4>

                  {src.snippet && (
                    <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed italic">
                      "{src.snippet}"
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 truncate">
                    {src.domain}
                  </span>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-slate-900 hover:underline inline-flex items-center gap-1 shrink-0"
                  >
                    <span>Open Portal</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MODERN SCHEMES DIRECTORY (LIST & GRID VIEW SWITCHER) */}
      <div className="space-y-4">
        {/* Controls Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800">
              {realtimeResults ? 'VERIFIED SEARCH MATCHES' : 'STATUTORY WELFARE DIRECTORY'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
              Showing {displayedSchemes.length} of {totalItems} Programs
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle: Row List vs Grid */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Executive List View"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="hidden sm:inline">List View</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Feature Grid View"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="hidden sm:inline">Grid View</span>
              </button>
            </div>

            {onCheckEligibility && (
              <button
                type="button"
                onClick={onCheckEligibility}
                className="text-[11px] font-bold text-slate-700 hover:underline cursor-pointer hidden md:inline"
              >
                [ Evaluate My Profile ]
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {totalItems === 0 ? (
          <div className="p-12 rounded-2xl border border-slate-200 bg-white text-center space-y-2 shadow-xs">
            <span className="text-xs font-bold uppercase text-slate-900 block">
              No matching welfare programs found
            </span>
            <p className="text-xs text-slate-500">
              Try adjusting your search terms, state filter, or sector criteria.
            </p>
          </div>
        ) : viewMode === 'list' ? (
          /* MODERN ROW LIST VIEW (High-End Master Table) */
          <div className="space-y-2.5">
            {displayedSchemes.map((s) => {
              const sId = 'id' in s ? s.id : (s as any).scheme_id;
              const sName = 'name' in s ? s.name : (s as any).scheme_name;
              const sDesc = s.short_description || s.description;
              const sState = s.state || 'Central';
              const sCategory = s.category || 'Welfare';
              const sBenefit = (s as any).benefit_amount || ((s.benefits && s.benefits[0]) ? s.benefits[0] : null);
              const docCount = s.required_documents?.length || 3;

              return (
                <div
                  key={sId}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50/40 transition shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  {/* Left: Scheme Information */}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                        {sState}
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-slate-400 truncate">
                        {sCategory}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        • {docCount} Docs Required
                      </span>
                    </div>

                    <Link
                      href={`/dashboard/schemes/${sId}`}
                      className="text-sm sm:text-base font-bold text-slate-900 hover:text-slate-700 block truncate group-hover:text-slate-900 transition"
                    >
                      {sName}
                    </Link>

                    <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">
                      {sDesc}
                    </p>
                  </div>

                  {/* Center: Benefit Pill */}
                  <div className="md:w-56 shrink-0 space-y-0.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                      Entitlement
                    </span>
                    <span className="inline-block px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 text-xs font-black truncate max-w-full">
                      {sBenefit || 'Direct Assistance'}
                    </span>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/dashboard/schemes/${sId}`}
                      className="h-9 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      <span>Details</span>
                      <span>→</span>
                    </Link>

                    <Link
                      href={`/dashboard/parchaa?scheme=${sId}`}
                      className="h-9 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center justify-center cursor-pointer shadow-2xs"
                      title="Generate Pre-filled Application Form"
                    >
                      Apply
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* MODERN FEATURE GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedSchemes.map((s) => {
              const sId = 'id' in s ? s.id : (s as any).scheme_id;
              const sName = 'name' in s ? s.name : (s as any).scheme_name;
              const sDesc = s.short_description || s.description;
              const sState = s.state || 'Central';
              const sCategory = s.category || 'Welfare';
              const sBenefit = (s as any).benefit_amount || ((s.benefits && s.benefits[0]) ? s.benefits[0] : null);

              return (
                <div
                  key={sId}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white flex flex-col justify-between space-y-4 transition shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-500 truncate">
                        {sCategory}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold shrink-0">
                        {sState}
                      </span>
                    </div>

                    <Link
                      href={`/dashboard/schemes/${sId}`}
                      className="font-bold text-sm text-slate-900 hover:text-slate-700 leading-snug line-clamp-2 block"
                    >
                      {sName}
                    </Link>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {sDesc}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">BENEFIT:</span>
                      <span className="font-bold text-slate-900 truncate pl-2">{sBenefit || 'Direct Transfer'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/schemes/${sId}`}
                        className="flex-1 h-9 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs"
                      >
                        <span>View Details</span>
                        <span>→</span>
                      </Link>

                      <Link
                        href={`/dashboard/parchaa?scheme=${sId}`}
                        className="h-9 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center justify-center"
                        title="Generate Parchaa Application Form"
                      >
                        Apply
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5. "VIEW MORE RESULTS" PROGRESSIVE PAGINATION BAR */}
        {totalItems > INITIAL_BATCH_SIZE && (
          <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col items-center justify-center gap-3 shadow-xs mt-6 text-center">
            {/* Progress status */}
            <div className="space-y-1.5 w-full max-w-sm flex flex-col items-center">
              <span className="text-xs font-mono font-semibold text-slate-500">
                Showing {displayedSchemes.length} of {totalItems} Statutory Programs
              </span>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-slate-900 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (displayedSchemes.length / totalItems) * 100)}%` }}
                />
              </div>
            </div>

            {hasMore ? (
              <button
                type="button"
                disabled={isLoadingMore}
                onClick={handleLoadMore}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Loading more programs...</span>
                  </>
                ) : (
                  <>
                    <span>View More Schemes ({remainingCount} Remaining)</span>
                    <span className="font-mono">↓</span>
                  </>
                )}
              </button>
            ) : (
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>All {totalItems} statutory welfare schemes displayed</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { dashboardTranslations } from '@/lib/dashboardTranslations';
import { MarkdownContent } from '@/components/MarkdownContent';
import {
  getVaniHistory,
  deleteVaniHistoryById,
  type VaniConversationRecord,
} from '@/services/api';

type TimeFilterType = 'all' | 'today' | 'week' | 'month';
type SortOrderType = 'newest' | 'oldest' | 'duration';

export default function VaniHistoryListPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = dashboardTranslations[language]?.vani || dashboardTranslations.en.vani;

  const [conversations, setConversations] = useState<VaniConversationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('all');
  const [sortOrder, setSortOrder] = useState<SortOrderType>('newest');
  
  // Track collapsed summaries (true = collapsed, false/undefined = expanded)
  const [collapsedSummaries, setCollapsedSummaries] = useState<Record<string, boolean>>({});
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getVaniHistory(user?.name || undefined);
      setConversations(data || []);
    } catch (err) {
      console.warn('Failed to load Vani history from MongoDB:', err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const toggleSummary = (id: string) => {
    setCollapsedSummaries((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleAllSummaries = (collapse: boolean) => {
    const nextState: Record<string, boolean> = {};
    conversations.forEach((c) => {
      nextState[c.id] = collapse;
    });
    setCollapsedSummaries(nextState);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this voice conversation record?')) return;

    try {
      await deleteVaniHistoryById(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      setActionNotice('Conversation record removed successfully.');
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleClearAll = async () => {
    if (!conversations.length) return;
    if (!confirm('Are you sure you want to delete ALL voice conversation archives from the database? This action cannot be undone.')) return;

    try {
      for (const c of conversations) {
        await deleteVaniHistoryById(c.id).catch(() => {});
      }
      setConversations([]);
      setActionNotice('All conversation archives cleared.');
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      console.error('Clear all failed:', err);
    }
  };

  // Comprehensive Search and Time Filter Pipeline
  const filteredAndSortedConversations = useMemo(() => {
    const now = new Date().getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneWeekMs = 7 * oneDayMs;
    const oneMonthMs = 30 * oneDayMs;

    const filtered = conversations.filter((c) => {
      // 1. Search Query Match across Title, Spoken Transcript, Gazette Response, Summary, and Schemes
      const queryLower = searchQuery.toLowerCase().trim();
      const matchesSearch =
        queryLower === '' ||
        c.title.toLowerCase().includes(queryLower) ||
        c.query_text.toLowerCase().includes(queryLower) ||
        c.response_text.toLowerCase().includes(queryLower) ||
        (c.ai_summary && c.ai_summary.toLowerCase().includes(queryLower)) ||
        (c.schemes_matched && c.schemes_matched.some((s) => (s.scheme_name || '').toLowerCase().includes(queryLower)));

      // 2. Dialect Language Match
      const matchesLang = selectedLang === 'all' || c.language === selectedLang;

      // 3. Time Filter Match
      let matchesTime = true;
      if (c.created_at) {
        const itemTime = new Date(c.created_at).getTime();
        const diff = now - itemTime;
        if (timeFilter === 'today') {
          matchesTime = diff <= oneDayMs;
        } else if (timeFilter === 'week') {
          matchesTime = diff <= oneWeekMs;
        } else if (timeFilter === 'month') {
          matchesTime = diff <= oneMonthMs;
        }
      }

      return matchesSearch && matchesLang && matchesTime;
    });

    // 4. Sort Order
    return filtered.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;

      if (sortOrder === 'newest') {
        return timeB - timeA;
      } else if (sortOrder === 'oldest') {
        return timeA - timeB;
      } else if (sortOrder === 'duration') {
        return (b.duration_seconds || 0) - (a.duration_seconds || 0);
      }
      return 0;
    });
  }, [conversations, searchQuery, selectedLang, timeFilter, sortOrder]);

  return (
    <div className="space-y-6 text-left animate-sleek max-w-5xl mx-auto pb-16 bg-white">
      {/* 1. TOP BANNER (Fully Localized, Pure White) */}
      <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold font-mono">
              VOICE CALL ARCHIVES &amp; AUDIT LOGS
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              MONGODB DATABASE
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.archivesTab}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            {t.subtitle}
          </p>

          {/* Sub-Navigation Tabs */}
          <div className="pt-2 flex items-center gap-2">
            <Link
              href="/dashboard/vanibot"
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
            >
              {t.liveTab}
            </Link>
            <Link
              href="/dashboard/vanibot/history"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold transition shadow-xs"
            >
              {t.archivesTab}
            </Link>
          </div>
        </div>

        {/* Clean Illustration - No Border Frame */}
        <div className="w-full md:w-56 shrink-0 flex items-center justify-center">
          <img src="/vani.png" alt="Vani Voice Assistant" className="w-full h-auto object-contain max-h-48" />
        </div>
      </div>

      {/* Action Notice Alert */}
      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between animate-sleek">
          <span>{actionNotice}</span>
          <button type="button" onClick={() => setActionNotice(null)} className="text-xs font-bold text-emerald-700 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. ADVANCED SEARCH, TIME FILTER & SORT CONTROLS */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
        {/* Main Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchArchivesPlaceholder}
            className="w-full h-11 pl-10 pr-10 text-xs rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 transition shadow-2xs"
          />
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-800"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Rows: Dialect + Time + Sort */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          {/* Dialect Filter */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            {['all', 'kn', 'hi', 'te', 'ta', 'mr', 'en'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setSelectedLang(code)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-xl transition uppercase cursor-pointer ${
                  selectedLang === code
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {code === 'all' ? t.allLanguages : code}
              </button>
            ))}
          </div>

          {/* Time Filter & Sort Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Time Filter Pills */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px]">
              {[
                { id: 'all', label: t.timeAll },
                { id: 'today', label: t.timeToday },
                { id: 'week', label: t.timeWeek },
                { id: 'month', label: t.timeMonth },
              ].map((tf) => (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setTimeFilter(tf.id as TimeFilterType)}
                  className={`px-2.5 py-0.5 font-bold rounded-lg transition cursor-pointer ${
                    timeFilter === tf.id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrderType)}
              aria-label="Sort archives by"
              className="h-7 px-2.5 text-[11px] font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="newest">{t.sortNewest}</option>
              <option value="oldest">{t.sortOldest}</option>
              <option value="duration">{t.sortDuration}</option>
            </select>
          </div>
        </div>

        {/* Global Toolbar: Summary Toggles & Clear All */}
        {conversations.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <span>{filteredAndSortedConversations.length} {t.matchingResults}</span>
              {searchQuery && (
                <span className="text-emerald-700 font-bold">
                  matching "{searchQuery}"
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleToggleAllSummaries(false)}
                className="font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                Expand All
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => handleToggleAllSummaries(true)}
                className="font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                Collapse All
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="font-bold text-destructive hover:opacity-80 transition cursor-pointer"
              >
                {t.clearAllArchives}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. CONVERSATION ARCHIVES LIST OR EMPTY STATE */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading your voice conversation history from database...</p>
        </div>
      ) : filteredAndSortedConversations.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">{t.noArchivesTitle}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || timeFilter !== 'all'
                ? `No conversation archives match your search and filter criteria.`
                : t.noArchivesSub}
            </p>
          </div>
          <Link
            href="/dashboard/vanibot"
            className="inline-block px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            {t.startVoiceCall}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedConversations.map((conv) => {
            const isSummaryCollapsed = collapsedSummaries[conv.id] === true;
            const dateFormatted = conv.created_at
              ? new Date(conv.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recent Call';

            return (
              <div
                key={conv.id}
                className="p-5 rounded-3xl border border-slate-200 bg-white shadow-xs hover:border-emerald-300 transition-all space-y-4"
              >
                {/* Card Top Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold font-mono uppercase">
                      {conv.language} DIALECT
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {dateFormatted}
                    </span>
                    {conv.duration_seconds && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {conv.duration_seconds}s
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {/* Summary Minimize / Expand Button */}
                    {conv.ai_summary && (
                      <button
                        type="button"
                        onClick={() => toggleSummary(conv.id)}
                        className="text-[11px] font-bold text-slate-600 hover:text-slate-900 transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isSummaryCollapsed ? t.expandSummary : t.minimizeSummary}</span>
                        <svg
                          className={`w-3.5 h-3.5 transition-transform ${isSummaryCollapsed ? '' : 'rotate-180'}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleDelete(conv.id, e)}
                      className="text-[11px] font-bold text-slate-400 hover:text-destructive transition cursor-pointer"
                      title="Delete this archive"
                    >
                      {t.deleteArchive}
                    </button>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="space-y-3">
                  <Link
                    href={`/dashboard/vanibot/history/${conv.id}`}
                    className="block group"
                  >
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-800 transition leading-snug">
                      {conv.title}
                    </h3>
                  </Link>

                  {/* Spoken Citizen Question */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                      {t.citizenSpokenQuery}
                    </span>
                    <p className="text-slate-800 font-medium italic">
                      "{conv.query_text}"
                    </p>
                  </div>

                  {/* AI Structured Summary (Collapsible) */}
                  {conv.ai_summary && !isSummaryCollapsed && (
                    <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/60 text-xs space-y-1.5 animate-sleek">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block font-mono">
                          {t.aiExecutiveSummary}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSummary(conv.id)}
                          className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          {t.minimizeSummary}
                        </button>
                      </div>
                      <div className="text-slate-800 text-xs leading-relaxed prose prose-sm max-w-none">
                        <MarkdownContent content={conv.ai_summary} />
                      </div>
                    </div>
                  )}

                  {/* Minimized Summary Teaser */}
                  {conv.ai_summary && isSummaryCollapsed && (
                    <div
                      onClick={() => toggleSummary(conv.id)}
                      className="p-2.5 rounded-xl bg-emerald-50/20 border border-emerald-100 text-xs text-slate-500 hover:bg-emerald-50/40 transition cursor-pointer flex items-center justify-between"
                    >
                      <span className="truncate text-[11px] italic">
                        {conv.ai_summary.slice(0, 100)}...
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 shrink-0 ml-2">
                        {t.expandSummary} ↓
                      </span>
                    </div>
                  )}

                  {/* Matched Scheme Tags */}
                  {conv.schemes_matched && conv.schemes_matched.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase mr-1 font-mono">
                        {t.identifiedSchemes}:
                      </span>
                      {conv.schemes_matched.map((sc, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-semibold text-slate-800 shadow-2xs"
                        >
                          {sc.scheme_name || 'Govt Scheme'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer with Audio Player and Detail Link */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Cloudinary Audio Playback */}
                  {conv.audio_url ? (
                    <div className="flex items-center gap-2">
                      <audio
                        controls
                        src={conv.audio_url}
                        className="h-8 max-w-[240px]"
                        preload="none"
                      />
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        Cloudinary MP3
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      Speech transcript archived
                    </span>
                  )}

                  {/* View Details Link (NO MODALS) */}
                  <Link
                    href={`/dashboard/vanibot/history/${conv.id}`}
                    className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs shrink-0"
                  >
                    <span>{t.details}</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

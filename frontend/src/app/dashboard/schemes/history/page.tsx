'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  getSchemeSearchHistory,
  deleteSchemeSearchHistoryItem,
  clearSchemeSearchHistory,
  type SchemeSearchHistoryItem,
  type SchemeData,
} from '@/services/api';
import { SchemeDetailsModal } from '@/components/SchemeDetailsModal';
import { toast } from 'sonner';

export default function SchemeSearchHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [history, setHistory] = useState<SchemeSearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [selectedScheme, setSelectedScheme] = useState<SchemeData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await getSchemeSearchHistory(user?.name || undefined);
      setHistory(res.history || []);
    } catch (err) {
      console.error('Failed to load search history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user?.name]);

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteSchemeSearchHistoryItem(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      toast.success('Search query removed from history');
    } catch (err) {
      console.error('Failed to delete search item:', err);
      toast.error('Failed to delete search item');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearSchemeSearchHistory(user?.name || undefined);
      setHistory([]);
      toast.success('Search history cleared');
    } catch (err) {
      console.error('Failed to clear search history:', err);
      toast.error('Failed to clear history');
    }
  };

  const handleReRun = (query: string, state?: string) => {
    const params = new URLSearchParams();
    params.set('q', query);
    if (state && state !== 'All India') params.set('state', state);
    router.push(`/dashboard/schemes?${params.toString()}`);
  };

  const filteredHistory = history.filter((item) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    const queryMatch = item.query.toLowerCase().includes(q);
    const stateMatch = (item.state || '').toLowerCase().includes(q);
    const headlineMatch = (item.ai_overview?.headline || '').toLowerCase().includes(q);
    return queryMatch || stateMatch || headlineMatch;
  });

  return (
    <div className="space-y-6 text-left animate-sleek max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/schemes"
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1 shadow-2xs"
            >
              <span>←</span>
              <span>Scheme Discovery</span>
            </Link>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold font-mono">
              DATABASE ARCHIVE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Recent Scheme Searches &amp; AI Overviews
          </h1>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
            History of real-time gazette discoveries, Tavily government portal verifications, and AI-synthesized subsidy overviews saved to your profile.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold transition shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            Clear All History
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search through past queries, states, or scheme names..."
            className="w-full h-11 pl-10 pr-4 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 transition shadow-2xs"
          />
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <span className="text-xs font-mono text-slate-400 shrink-0">
          {filteredHistory.length} Recorded
        </span>
      </div>

      {/* History Items List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 space-y-2">
          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Loading database search archives...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="p-12 rounded-2xl border border-slate-200 bg-white text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">No Search History Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Whenever you search for agricultural subsidies or government schemes, your verified discoveries will be automatically cataloged here.
            </p>
          </div>
          <Link
            href="/dashboard/schemes"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            <span>Start Scheme Discovery</span>
            <span>→</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => {
            const isExpanded = expandedItemId === item.id;
            const createdDate = new Date(item.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white transition space-y-4 shadow-xs"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                        {item.state || 'All India'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px] font-bold">
                        {item.schemes_count || item.schemes?.length || 0} Schemes Found
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {createdDate}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      "{item.query}"
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleReRun(item.query, item.state)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Re-Search</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                    >
                      {isExpanded ? 'Hide Details' : 'View Findings'}
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete this search"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* AI Overview Preview */}
                {item.ai_overview && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <h4 className="text-xs font-bold text-slate-900">
                        {item.ai_overview.headline || 'Statutory AI Overview'}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.ai_overview.summary}
                    </p>

                    {item.ai_overview.key_takeaways && item.ai_overview.key_takeaways.length > 0 && (
                      <ul className="space-y-1 pt-1">
                        {item.ai_overview.key_takeaways.map((t, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-700">
                            <span className="text-emerald-700 font-bold">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Expanded Details: Discovered Schemes & Tavily Sources */}
                {isExpanded && (
                  <div className="space-y-4 pt-2 animate-sleek">
                    {/* Discovered Schemes */}
                    {item.schemes && item.schemes.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                          Discovered Welfare Programs ({item.schemes.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {item.schemes.map((s, sIdx) => (
                            <div
                              key={s.id || sIdx}
                              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 transition space-y-2 shadow-2xs flex flex-col justify-between"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span className="font-bold text-emerald-800 truncate">{s.category}</span>
                                  <span className="text-slate-400">{s.state || 'Central'}</span>
                                </div>
                                <h5 className="text-xs font-bold text-slate-900 leading-snug">{s.name}</h5>
                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                  {s.short_description || s.detailed_description}
                                </p>
                              </div>

                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold text-slate-700">
                                  {s.benefit_amount || 'Govt Benefit'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedScheme(s)}
                                  className="text-[10px] font-bold text-emerald-800 hover:underline"
                                >
                                  View Details →
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tavily Verified Portal Sources */}
                    {item.sources && item.sources.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                          Verified Government Portals ({item.sources.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {item.sources.map((src, srcIdx) => (
                            <a
                              key={srcIdx}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-white text-xs transition flex items-center gap-2.5 shadow-2xs group"
                            >
                              <img
                                src={src.favicon_url || `https://www.google.com/s2/favicons?domain=${src.domain}&sz=64`}
                                alt={src.domain}
                                className="w-4 h-4 rounded shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-bold text-slate-800 truncate group-hover:text-blue-700">
                                  {src.title}
                                </p>
                                <span className="text-[10px] font-mono text-slate-400 truncate block">
                                  {src.domain} ↗
                                </span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Scheme Details Modal */}
      {selectedScheme && (
        <SchemeDetailsModal
          scheme={selectedScheme}
          profile={{
            state: user?.state || 'Karnataka',
            category: 'General/OBC',
            gender: 'Male',
            income_level: 'Low',
            occupation: 'Small & Marginal Farmer',
            landholding_acres: user?.landholding_acres ?? 3.5,
            disability: false,
            bpl_card: true,
          }}
          onClose={() => setSelectedScheme(null)}
          onApply={() => {
            setSelectedScheme(null);
            router.push('/dashboard/parchaa');
          }}
        />
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import {
  getNitiragDocuments,
  deleteNitiragDocument,
  createNitiragConversation,
  type NitiragDocumentRecord,
} from '@/services/api';

export default function NitiragDocumentsListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();

  const [documents, setDocuments] = useState<NitiragDocumentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await getNitiragDocuments();
      setDocuments(res.documents || []);
    } catch (err) {
      console.warn('Failed to load documents:', err);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const toggleSelectDoc = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedDocIds.length === filteredDocuments.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(filteredDocuments.map((d) => d.id));
    }
  };

  const handleStartChatWithSelected = async () => {
    try {
      const conv = await createNitiragConversation(
        selectedDocIds.length > 0
          ? `Consultation: ${selectedDocIds.length} Selected Gazettes`
          : 'New Legal Consultation',
        selectedDocIds,
        user?.name || 'citizen'
      );
      router.push(`/dashboard/nitirag/chat/${conv.id}`);
    } catch (err) {
      console.error('Failed to create consultation:', err);
      router.push('/dashboard/nitirag/chat');
    }
  };

  const handleDelete = async (id: string, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await deleteNitiragDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setSelectedDocIds((prev) => prev.filter((dId) => dId !== id));
      toast.success(`Document "${title}" removed from repository`);
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete document from database');
    }
  };

  const filteredDocuments = documents.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      d.title.toLowerCase().includes(q) ||
      d.state.toLowerCase().includes(q) ||
      d.department.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      (d.gazette_number && d.gazette_number.toLowerCase().includes(q));

    const matchesCat = selectedCategory === 'all' || d.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 text-left animate-sleek max-w-6xl mx-auto pb-16 bg-white">
      {/* 1. HEADER BANNER WITH SUB-NAV (Pure White, No Border Frame) */}
      <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold font-mono">
              GAZETTE REPOSITORY &amp; CRUD MANAGEMENT
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              OFFICIAL STATUTORY VAULT
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Official Statutory Gazettes &amp; Document Registry
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Manage official government gazettes, view extracted text passages, edit statutory classifications, and launch scoped AI legal consultations with any document or group of documents.
          </p>

          {/* Sub-Navigation Tabs */}
          <div className="pt-2 flex items-center gap-2">
            <Link
              href="/dashboard/nitirag/chat"
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
            >
              Legal Chat Advisor
            </Link>
            <Link
              href="/dashboard/nitirag/documents"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold transition shadow-xs"
            >
              Gazettes &amp; Documents
            </Link>
            <Link
              href="/dashboard/nitirag/upload"
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
            >
              + Upload New PDF
            </Link>
          </div>
        </div>

        <div className="w-full md:w-56 shrink-0 flex items-center justify-center">
          <img src="/nitirag.png" alt="Niti RAG Documents" className="w-full h-auto object-contain max-h-48" />
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

      {/* 2. SEARCH & MULTI-DOCUMENT CHAT LAUNCHER BAR */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, state, department, circular number, or keyword..."
              className="w-full h-10 pl-9 pr-3 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 transition shadow-2xs"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Action Button: Start Chat with Selected Documents */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleStartChatWithSelected}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs ${
                selectedDocIds.length > 0
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span>
                {selectedDocIds.length > 0
                  ? `Start AI Chat with Selected (${selectedDocIds.length})`
                  : 'Start General Consultation'}
              </span>
              <span>→</span>
            </button>

            <Link
              href="/dashboard/nitirag/upload"
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
            >
              + Upload
            </Link>
          </div>
        </div>

        {/* Category Pills & Selection Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {[
              { id: 'all', label: 'All Gazettes' },
              { id: 'welfare', label: 'Statutory Welfare' },
              { id: 'solar', label: 'Solar & Irrigation' },
              { id: 'crop', label: 'Crop Insurance' },
              { id: 'dbt', label: 'DBT Transfers' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              {selectedDocIds.length === filteredDocuments.length && filteredDocuments.length > 0
                ? 'Deselect All'
                : 'Select All'}
            </button>
            <span>•</span>
            <span>{filteredDocuments.length} Documents Available</span>
          </div>
        </div>
      </div>

      {/* 3. DOCUMENTS TABLE / CARDS LIST WITH FULL CRUD */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading statutory gazettes from database...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">No Gazette Documents Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No documents match "${searchQuery}". Try a different keyword or filter.`
                : 'Your statutory gazette repository is currently empty. Upload official PDFs to get started.'}
            </p>
          </div>
          <Link
            href="/dashboard/nitirag/upload"
            className="inline-block px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            + Upload First Gazette PDF
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocuments.map((doc) => {
            const isSelected = selectedDocIds.includes(doc.id);
            const dateFormatted = doc.created_at
              ? new Date(doc.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Recent Upload';

            return (
              <div
                key={doc.id}
                onClick={() => toggleSelectDoc(doc.id)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                }`}
              >
                {/* Left Area: Checkbox + Document Info */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Selection Checkbox */}
                  <div className="pt-1 shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectDoc(doc.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                    />
                  </div>

                  {/* Document Metadata */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold font-mono">
                        {doc.state.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {doc.gazette_number || 'CIRCULAR'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {dateFormatted}
                      </span>
                    </div>

                    <Link
                      href={`/dashboard/nitirag/documents/${doc.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="block group"
                    >
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition leading-snug truncate">
                        {doc.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-slate-500 font-medium truncate">
                      {doc.department} • {doc.category}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-0.5">
                      <span>{doc.total_pages} Pages</span>
                      <span>•</span>
                      <span className="text-emerald-800 font-bold">{doc.total_chunks} Knowledge Points</span>
                      <span>•</span>
                      <span>{(doc.file_size_bytes / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                </div>

                {/* Right Area: Action Buttons (CRUD) */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 self-end sm:self-center shrink-0"
                >
                  {/* View Details & PDF Extracted Text */}
                  <Link
                    href={`/dashboard/nitirag/documents/${doc.id}`}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                  >
                    <span>View &amp; Edit</span>
                    <span>→</span>
                  </Link>

                  {/* Open Raw Cloudinary PDF */}
                  <a
                    href={doc.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition"
                    title="Open Official PDF in New Tab"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(doc.id, doc.title, e)}
                    className="p-2 rounded-xl text-slate-400 hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
                    title="Delete document and vector embeddings"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

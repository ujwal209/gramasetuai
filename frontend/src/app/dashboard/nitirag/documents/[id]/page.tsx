'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CustomSelect, type SelectOption } from '@/components/ui/CustomSelect';
import {
  getNitiragDocumentById,
  updateNitiragDocument,
  deleteNitiragDocument,
  createNitiragConversation,
  type NitiragDocumentRecord,
  type NitiragChunkRecord,
} from '@/services/api';

const STATE_OPTIONS: SelectOption[] = [
  { value: 'All India (Central Government)', label: 'All India (Central Government)' },
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
  { value: 'Telangana', label: 'Telangana' },
  { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
  { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
  { value: 'Rajasthan', label: 'Rajasthan' },
  { value: 'Punjab', label: 'Punjab' },
  { value: 'Haryana', label: 'Haryana' },
  { value: 'Gujarat', label: 'Gujarat' },
  { value: 'Bihar', label: 'Bihar' },
  { value: 'West Bengal', label: 'West Bengal' },
  { value: 'Odisha', label: 'Odisha' },
];

const DEPARTMENT_OPTIONS: SelectOption[] = [
  { value: 'Agriculture & Farmers Welfare', label: 'Agriculture & Farmers Welfare' },
  { value: 'Horticulture & Sericulture', label: 'Horticulture & Sericulture' },
  { value: 'Revenue & Land Records', label: 'Revenue & Land Records' },
  { value: 'Rural Development & Panchayati Raj', label: 'Rural Development & Panchayati Raj' },
  { value: 'Water Resources & Irrigation', label: 'Water Resources & Irrigation' },
  { value: 'Animal Husbandry & Dairying', label: 'Animal Husbandry & Dairying' },
];

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'Statutory Welfare & Subsidies', label: 'Statutory Welfare & Subsidies' },
  { value: 'Solar Pumps & Micro-Irrigation', label: 'Solar Pumps & Micro-Irrigation' },
  { value: 'Crop Insurance & Disaster Relief', label: 'Crop Insurance & Disaster Relief' },
  { value: 'Direct Benefit Transfer (DBT)', label: 'Direct Benefit Transfer (DBT)' },
  { value: 'Land Dispute & Mutation Guidelines', label: 'Land Dispute & Mutation Guidelines' },
  { value: 'Credit & Kisan Credit Card (KCC)', label: 'Credit & Kisan Credit Card (KCC)' },
];

export default function NitiragDocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const docId = params.id as string;

  const [document, setDocument] = useState<NitiragDocumentRecord | null>(null);
  const [chunks, setChunks] = useState<NitiragChunkRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Edit form state
  const [title, setTitle] = useState('');
  const [stateScope, setStateScope] = useState('');
  const [department, setDepartment] = useState('');
  const [category, setCategory] = useState('');
  const [gazetteNumber, setGazetteNumber] = useState('');

  const [activeTab, setActiveTab] = useState<'pdf' | 'passages' | 'edit'>('pdf');

  useEffect(() => {
    async function loadData() {
      if (!docId) return;
      setLoading(true);
      try {
        const res = await getNitiragDocumentById(docId);
        setDocument(res.document);
        setChunks(res.chunks || []);

        setTitle(res.document.title);
        setStateScope(res.document.state);
        setDepartment(res.document.department);
        setCategory(res.document.category);
        setGazetteNumber(res.document.gazette_number || '');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Could not find document.';
        setErrorMessage(msg);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [docId]);

  const handleSaveUpdates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docId) return;
    setSaving(true);
    setErrorMessage(null);
    try {
      const updated = await updateNitiragDocument(docId, {
        title: title.trim(),
        state: stateScope,
        department,
        category,
        gazette_number: gazetteNumber.trim() || undefined,
      });
      setDocument(updated);
      setSuccessMessage('Gazette document details updated successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed.';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleStartChatWithThisDoc = async () => {
    if (!document) return;
    try {
      const conv = await createNitiragConversation(
        `Consultation: ${document.title.slice(0, 30)}`,
        [document.id],
        user?.name || 'citizen'
      );
      router.push(`/dashboard/nitirag/chat/${conv.id}`);
    } catch (err) {
      console.error('Chat launch failed:', err);
      router.push('/dashboard/nitirag/chat');
    }
  };

  const handleDelete = async () => {
    if (!document) return;
    if (!confirm(`Are you sure you want to delete "${document.title}" and its knowledge points from the database?`)) return;

    try {
      await deleteNitiragDocument(document.id);
      router.push('/dashboard/nitirag/documents');
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete document from database.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Loading statutory gazette and extracted passages from database...</p>
      </div>
    );
  }

  if (errorMessage || !document) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
        <h2 className="text-base font-bold text-slate-900">Document Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">{errorMessage || 'This gazette may have been removed.'}</p>
        <Link
          href="/dashboard/nitirag/documents"
          className="inline-block px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl transition"
        >
          ← Back to Gazette Registry
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-sleek max-w-5xl mx-auto pb-16 bg-white">
      {/* 1. TOP HEADER & ACTIONS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <Link
            href="/dashboard/nitirag/documents"
            className="text-xs font-bold text-slate-500 hover:text-slate-900 transition flex items-center gap-1.5 mb-1.5"
          >
            ← Back to Gazette Registry
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold font-mono">
              {document.state.toUpperCase()}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {document.gazette_number || 'CIRCULAR'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            {document.title}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {document.department} • {document.category} • {document.total_pages} Pages • {chunks.length} Knowledge Points
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleStartChatWithThisDoc}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span>Start AI Consultation</span>
            <span>→</span>
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 border border-destructive/20 rounded-xl transition cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Status Alerts */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between animate-sleek">
          <span>{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-xs font-bold text-emerald-700">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. SUB-VIEW TABS: PDF Viewer | Knowledge Points | Edit Metadata */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('pdf')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'pdf'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Official PDF Viewer
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('passages')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'passages'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Extracted Passages ({chunks.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'edit'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Edit Document Details
        </button>
      </div>

      {/* 3. TAB 1: PDF VIEWER CONTAINER */}
      {activeTab === 'pdf' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-700 font-medium">
              Permanent Cloud Storage File: <strong className="text-slate-900">{document.file_name}</strong>
            </span>
            <a
              href={document.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg transition flex items-center gap-1 shadow-2xs"
            >
              <span>Open in Fullscreen</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          <div className="w-full h-[650px] rounded-3xl border border-slate-200 bg-slate-100 overflow-hidden shadow-xs">
            <iframe
              src={document.pdf_url}
              title={document.title}
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}

      {/* 4. TAB 2: EXTRACTED PASSAGES CHUNKS */}
      {activeTab === 'passages' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 text-xs text-emerald-900">
            These statutory passages were parsed directly from the official PDF and are actively indexed for semantic AI legal retrieval.
          </div>

          <div className="space-y-3">
            {chunks.map((chk, i) => (
              <div
                key={chk.id || i}
                className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] font-mono border-b border-slate-100 pb-2">
                  <span className="font-bold text-emerald-800">
                    Passage #{chk.chunk_index + 1} • Page {chk.page_number}
                  </span>
                  <span className="text-slate-400">
                    {chk.text.length} characters
                  </span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-line">
                  {chk.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB 3: EDIT METADATA FORM (CRUD UPDATE) */}
      {activeTab === 'edit' && (
        <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Edit Gazette Classification &amp; Authority
            </h3>
            <p className="text-xs text-slate-500">
              Update statutory metadata to ensure accurate retrieval during legal consultations.
            </p>
          </div>

          <form onSubmit={handleSaveUpdates} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">
                Gazette Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomSelect
                label="State / Jurisdiction Scope"
                options={STATE_OPTIONS}
                value={stateScope}
                onChange={setStateScope}
                searchable={true}
              />

              <CustomSelect
                label="Government Department"
                options={DEPARTMENT_OPTIONS}
                value={department}
                onChange={setDepartment}
              />

              <CustomSelect
                label="Welfare Category"
                options={CATEGORY_OPTIONS}
                value={category}
                onChange={setCategory}
              />

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Official Gazette / Circular Number
                </label>
                <input
                  type="text"
                  value={gazetteNumber}
                  onChange={(e) => setGazetteNumber(e.target.value)}
                  className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {saving ? 'Saving Updates...' : 'Save Metadata Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { CustomSelect, type SelectOption } from '@/components/ui/CustomSelect';
import { toast } from 'sonner';
import {
  uploadGazettePdf,
  getNitiragDocuments,
  deleteNitiragDocument,
  type NitiragDocumentRecord,
} from '@/services/api';

const STATE_OPTIONS: SelectOption[] = [
  { value: 'All India (Central Government)', label: 'All India (Central Government)', sublabel: 'National Gazette & Ministry Directives' },
  { value: 'Karnataka', label: 'Karnataka', sublabel: 'Raitha Siri & State Department Orders' },
  { value: 'Maharashtra', label: 'Maharashtra', sublabel: 'MahaDBT & Agriculture Directives' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh', sublabel: 'Kisan Kalyan Mission & State Orders' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu', sublabel: 'Uzhavan & State Welfare Notifications' },
  { value: 'Telangana', label: 'Telangana', sublabel: 'Rythu Bandhu & State Resolutions' },
  { value: 'Andhra Pradesh', label: 'Andhra Pradesh', sublabel: 'YSR Rythu Bharosa Directives' },
  { value: 'Madhya Pradesh', label: 'Madhya Pradesh', sublabel: 'Kisan Kalyan Yojana Orders' },
  { value: 'Rajasthan', label: 'Rajasthan', sublabel: 'Krishi Sathi & State Gazette Rules' },
  { value: 'Punjab', label: 'Punjab', sublabel: 'State Agriculture & Canal Water Directives' },
  { value: 'Haryana', label: 'Haryana', sublabel: 'Meri Fasal Mera Byora Directives' },
  { value: 'Gujarat', label: 'Gujarat', sublabel: 'i-Khedut Portal & State Resolutions' },
  { value: 'Bihar', label: 'Bihar', sublabel: 'DBT Agriculture Bihar Directives' },
  { value: 'West Bengal', label: 'West Bengal', sublabel: 'Krishak Bandhu State Orders' },
  { value: 'Odisha', label: 'Odisha', sublabel: 'KALIA Scheme & State Gazettes' },
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

type IngestionStep = 'idle' | 'archiving' | 'analyzing' | 'structuring' | 'indexing' | 'completed' | 'error';

export default function NitiragUploadPage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [stateScope, setStateScope] = useState(user?.state || 'Karnataka');
  const [department, setDepartment] = useState('Agriculture & Farmers Welfare');
  const [category, setCategory] = useState('Statutory Welfare & Subsidies');
  const [gazetteNumber, setGazetteNumber] = useState('');

  const [ingestionStep, setIngestionStep] = useState<IngestionStep>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [documents, setDocuments] = useState<NitiragDocumentRecord[]>([]);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState('');

  const loadDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await getNitiragDocuments();
      setDocuments(res.documents || []);
    } catch (err) {
      console.warn('Failed to load documents:', err);
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setErrorMessage('Only official PDF gazettes and circulars are accepted.');
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
      if (!docTitle) {
        setDocTitle(file.name.replace('.pdf', '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setErrorMessage('Only official PDF documents are accepted.');
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
      if (!docTitle) {
        setDocTitle(file.name.replace('.pdf', '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a PDF gazette or notification to index.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIngestionStep('archiving');

    try {
      // Step 1 - Cloud Archiving
      setTimeout(() => {
        setIngestionStep('analyzing');
      }, 700);

      // Step 2 - Text Analysis
      setTimeout(() => {
        setIngestionStep('structuring');
      }, 1800);

      // Step 3 - Registry Indexing
      setTimeout(() => {
        setIngestionStep('indexing');
      }, 3200);

      const response = await uploadGazettePdf(selectedFile, {
        title: docTitle.trim() || selectedFile.name,
        state: stateScope,
        department,
        category,
        gazette_number: gazetteNumber.trim() || undefined,
        user_id: user?.name || 'citizen',
      });

      setIngestionStep('completed');
      setSuccessMessage(
        `Successfully indexed "${response.document.title}" with ${response.chunks_created} verified statutory knowledge points.`
      );

      // Reset form
      setSelectedFile(null);
      setDocTitle('');
      setGazetteNumber('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Reload document list
      loadDocuments();
    } catch (err: unknown) {
      setIngestionStep('error');
      const msg = err instanceof Error ? err.message : 'Document indexing failed. Please try again.';
      setErrorMessage(msg);
    }
  };

  const handleDelete = async (docId: string, title: string) => {
    try {
      await deleteNitiragDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast.success(`Document "${title}" removed from repository`);
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete document from repository');
    }
  };

  const filteredDocuments = documents.filter((d) => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return true;
    return (
      d.title.toLowerCase().includes(q) ||
      d.state.toLowerCase().includes(q) ||
      d.department.toLowerCase().includes(q) ||
      (d.gazette_number && d.gazette_number.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 text-left animate-sleek max-w-5xl mx-auto pb-16 bg-white">
      {/* 1. HEADER BANNER WITH SUB-NAV (Pure White Canvas, No Image Border Frame) */}
      <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold font-mono">
              OFFICIAL CIVIC REPOSITORY
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              STATUTORY WELFARE INTELLIGENCE
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Niti RAG Statutory Gazette Repository
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Upload official government gazettes, cabinet resolutions, and statutory subsidy circulars to empower instant AI-grounded legal guidance with verifiable citations.
          </p>

          {/* Sub-Navigation Tabs */}
          <div className="pt-2 flex items-center gap-2">
            <Link
              href="/dashboard/nitirag"
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
            >
              Legal Advisory AI
            </Link>
            <Link
              href="/dashboard/nitirag/upload"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold transition shadow-xs"
            >
              Upload Gazettes &amp; Repository
            </Link>
          </div>
        </div>

        {/* Floating Borderless Illustration */}
        <div className="w-full md:w-56 shrink-0 flex items-center justify-center">
          <img src="/nitirag.png" alt="Niti RAG Knowledge Base" className="w-full h-auto object-contain max-h-48" />
        </div>
      </div>

      {/* 2. REPOSITORY HEALTH & CITATION STRIP */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
          <div>
            <span className="font-bold text-slate-900">Legal Knowledge Base: </span>
            <span className="text-emerald-800 font-medium">Active &amp; Grounded in Official Gazette Rules</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-500 text-[11px] font-medium">
          <span>Verified State &amp; Central Registry</span>
          <span>•</span>
          <span>Zero Middlemen Directives</span>
        </div>
      </div>

      {/* 3. ALERTS & STATUS NOTICES */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between animate-sleek">
          <span>{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-xs font-bold text-emerald-700 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between animate-sleek">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-xs font-bold text-rose-700 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* 4. DOCUMENT UPLOAD & INGESTION FORM */}
      <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            Upload Official Gazette or Statutory Circular
          </h2>
          <p className="text-xs text-slate-500">
            Provide the official government notification (.pdf format) to ground AI advice in verified rules.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Dropzone Area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-8 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2.5 ${
              selectedFile
                ? 'border-emerald-500 bg-emerald-50/20'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/40 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>

            {selectedFile ? (
              <div>
                <p className="text-xs font-bold text-slate-900">{selectedFile.name}</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for Ingestion
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Click to select PDF or drag and drop here
                </p>
                <p className="text-[11px] text-slate-400">
                  Supports official PDF documents up to 50MB
                </p>
              </div>
            )}
          </div>

          {/* Form Metadata Fields with CUSTOM DROPDOWNS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-800">
                Document / Gazette Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g. PM-KUSUM Component B Solar Subsidy Rules 2025-26"
                className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 transition shadow-2xs"
              />
            </div>

            {/* Custom Dropdown: State */}
            <div>
              <CustomSelect
                label="State / Jurisdiction Scope"
                options={STATE_OPTIONS}
                value={stateScope}
                onChange={setStateScope}
                searchable={true}
                placeholder="Select State / Scope..."
              />
            </div>

            {/* Custom Dropdown: Department */}
            <div>
              <CustomSelect
                label="Government Department"
                options={DEPARTMENT_OPTIONS}
                value={department}
                onChange={setDepartment}
                placeholder="Select Department..."
              />
            </div>

            {/* Custom Dropdown: Category */}
            <div>
              <CustomSelect
                label="Welfare Category"
                options={CATEGORY_OPTIONS}
                value={category}
                onChange={setCategory}
                placeholder="Select Category..."
              />
            </div>

            {/* Gazette / Circular Number Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">
                Official Gazette / Circular Number (Optional)
              </label>
              <input
                type="text"
                value={gazetteNumber}
                onChange={(e) => setGazetteNumber(e.target.value)}
                placeholder="e.g. KA-AGRI-2025/381 or G.O. Ms. No. 44"
                className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 transition shadow-2xs"
              />
            </div>
          </div>

          {/* Stepper Status (Civic Terminology, No Technical Jargon) */}
          {ingestionStep !== 'idle' && ingestionStep !== 'error' && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-sleek">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                Statutory Ingestion &amp; Verification Progress
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                {/* Step 1 */}
                <div className={`p-3 rounded-xl border ${
                  ingestionStep === 'archiving'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}>
                  <div className="flex items-center gap-1.5">
                    {ingestionStep === 'archiving' ? (
                      <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>✓</span>
                    )}
                    <span>1. Document Archiving</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={`p-3 rounded-xl border ${
                  ingestionStep === 'analyzing'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                    : ingestionStep === 'structuring' || ingestionStep === 'indexing' || ingestionStep === 'completed'
                    ? 'border-slate-200 bg-white text-slate-600'
                    : 'border-slate-200/60 bg-slate-100/60 text-slate-400'
                }`}>
                  <div className="flex items-center gap-1.5">
                    {ingestionStep === 'analyzing' ? (
                      <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    ) : ingestionStep === 'structuring' || ingestionStep === 'indexing' || ingestionStep === 'completed' ? (
                      <span>✓</span>
                    ) : (
                      <span>○</span>
                    )}
                    <span>2. Gazette Text Analysis</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={`p-3 rounded-xl border ${
                  ingestionStep === 'structuring'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                    : ingestionStep === 'indexing' || ingestionStep === 'completed'
                    ? 'border-slate-200 bg-white text-slate-600'
                    : 'border-slate-200/60 bg-slate-100/60 text-slate-400'
                }`}>
                  <div className="flex items-center gap-1.5">
                    {ingestionStep === 'structuring' ? (
                      <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    ) : ingestionStep === 'indexing' || ingestionStep === 'completed' ? (
                      <span>✓</span>
                    ) : (
                      <span>○</span>
                    )}
                    <span>3. Rule Structuring</span>
                  </div>
                </div>

                {/* Step 4 */}
                <div className={`p-3 rounded-xl border ${
                  ingestionStep === 'indexing'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                    : ingestionStep === 'completed'
                    ? 'border-slate-200 bg-white text-slate-600'
                    : 'border-slate-200/60 bg-slate-100/60 text-slate-400'
                }`}>
                  <div className="flex items-center gap-1.5">
                    {ingestionStep === 'indexing' ? (
                      <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    ) : ingestionStep === 'completed' ? (
                      <span>✓</span>
                    ) : (
                      <span>○</span>
                    )}
                    <span>4. Registry Sync</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={!selectedFile || (ingestionStep !== 'idle' && ingestionStep !== 'completed' && ingestionStep !== 'error')}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-2"
            >
              {ingestionStep !== 'idle' && ingestionStep !== 'completed' && ingestionStep !== 'error' ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Gazette...</span>
                </>
              ) : (
                <>
                  <span>Index Gazette in Knowledge Base</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 5. INDEXED GAZETTE DOCUMENTS REPOSITORY */}
      <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Official Statutory Gazettes ({documents.length})
            </h2>
            <p className="text-xs text-slate-500">
              Verified legal circulars actively powering citizen advisory recommendations.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search indexed gazettes..."
              className="w-full h-8 pl-8 pr-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {loadingDocs ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-2">
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading statutory gazette registry...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-2">
            <p className="font-bold text-slate-700">No Gazette Documents in Index</p>
            <p>Upload a statutory PDF above to build your legal advisory knowledge base.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-all space-y-3 flex flex-col justify-between shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold font-mono">
                      {doc.state.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {doc.gazette_number || 'CIRCULAR'}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {doc.title}
                  </h3>

                  <p className="text-[11px] text-slate-500 font-medium">
                    {doc.department} • {doc.category}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400 pt-1">
                    <span>{doc.total_pages} Pages</span>
                    <span>•</span>
                    <span className="text-emerald-800 font-bold">{doc.total_chunks} Knowledge Points</span>
                    <span>•</span>
                    <span className="text-slate-400">Verified Directive</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={doc.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-xs font-bold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition flex items-center gap-1.5"
                  >
                    <span>View Official PDF</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id, doc.title)}
                    className="text-[11px] font-bold text-slate-400 hover:text-destructive transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

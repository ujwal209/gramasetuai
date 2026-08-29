'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { CustomDropdown } from '@/components/CustomDropdown';
import { toast } from 'sonner';
import {
  getPopularSchemes,
  analyzeBatchDocuments,
  getKagazAuditHistory,
  deleteKagazAuditById,
  clearKagazAuditHistory,
  fetchSupportedDocumentTypes,
  type SchemeData,
  type CitizenProfile,
  type KagazBatchAuditReport,
  type DocumentTypeSpecification,
} from '@/services/api';

interface KagazCheckAuditorProps {
  initialSchemeId?: string;
  onSelectScheme?: (schemeId: string) => void;
}

export function KagazCheckAuditor({ initialSchemeId }: KagazCheckAuditorProps) {
  const { user } = useAuth();

  // Active View Tab: 'audit' (New Audit Workspace) vs 'history' (Recent Checks from MongoDB)
  const [activeTab, setActiveTab] = useState<'audit' | 'history'>('audit');

  // Dynamic Schemes List from API
  const [schemes, setSchemes] = useState<SchemeData[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>(initialSchemeId || 'pm-kisan-001');

  // Multi-Document Staging State
  const [stagedFiles, setStagedFiles] = useState<Array<{ file: File; previewUrl: string; id: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Camera Capture State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Audit Progress & Result State
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [currentReport, setCurrentReport] = useState<KagazBatchAuditReport | null>(null);

  // Audit History State from MongoDB Atlas
  const [historyList, setHistoryList] = useState<KagazBatchAuditReport[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  // Supported Document Types Metadata
  const [supportedDocs, setSupportedDocs] = useState<DocumentTypeSpecification[]>([]);

  // 1. Fetch Schemes and Document Types on mount
  useEffect(() => {
    getPopularSchemes()
      .then((data) => {
        if (data && data.length > 0) setSchemes(data);
      })
      .catch((err) => console.warn('Could not fetch schemes list:', err));

    fetchSupportedDocumentTypes()
      .then((docs) => setSupportedDocs(docs || []))
      .catch((err) => console.warn('Could not fetch doc types:', err));

    loadHistory();
  }, []);

  // Sync initialSchemeId
  useEffect(() => {
    if (initialSchemeId) {
      setSelectedSchemeId(initialSchemeId);
    }
  }, [initialSchemeId]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await getKagazAuditHistory(user?.name || 'citizen', 30);
      if (res && res.history) {
        setHistoryList(res.history);
      }
    } catch (err) {
      console.warn('Could not load audit history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const selectedScheme = schemes.find((s) => s.id === selectedSchemeId);

  // Camera Handler
  const startCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access failed:', err);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(file);
        setStagedFiles((prev) => [...prev, { file, previewUrl, id: Math.random().toString(36).substring(2) }]);
      }
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  // File Upload Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        id: Math.random().toString(36).substring(2),
      }));
      setStagedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeStagedFile = (id: string) => {
    setStagedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const clearStagedFiles = () => {
    setStagedFiles([]);
    setCurrentReport(null);
    setAuditError(null);
  };

  // Execute Batch Multi-Document Audit
  const runBatchAudit = async () => {
    if (stagedFiles.length === 0) {
      setAuditError('Please upload or capture at least one document to audit.');
      return;
    }

    setIsAuditing(true);
    setAuditError(null);
    setCurrentReport(null);

    const files = stagedFiles.map((s) => s.file);
    const fileNames = stagedFiles.map((s) => s.file.name);

    const citizenProfile: CitizenProfile = {
      state: user?.state || 'Karnataka',
      category: 'General/OBC',
      gender: 'Male',
      income_level: 'Low',
      occupation: 'Small & Marginal Farmer',
      landholding_acres: user?.landholding_acres ?? 3.5,
      disability: false,
      bpl_card: true,
    };

    const isCustom = selectedSchemeId.startsWith('custom:');
    const customSchemeName = isCustom ? selectedSchemeId.replace(/^custom:/, '').trim() : undefined;
    const activeSchemeId = isCustom ? undefined : (selectedSchemeId === 'general' ? undefined : selectedSchemeId);
    const activeSchemeName = isCustom ? customSchemeName : (selectedScheme?.name || undefined);

    try {
      const report = await analyzeBatchDocuments(
        files,
        fileNames,
        activeSchemeId,
        activeSchemeName,
        citizenProfile,
        user?.name || 'citizen'
      );
      setCurrentReport(report);
      loadHistory(); // Refresh history
    } catch (err: any) {
      console.error('Batch audit failed:', err);
      setAuditError(err?.response?.data?.detail || 'Failed to complete document audit. Please check your files.');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleDeleteHistory = async (auditId: string) => {
    try {
      await deleteKagazAuditById(auditId);
      setHistoryList((prev) => prev.filter((item) => item.audit_id !== auditId));
      if (currentReport?.audit_id === auditId) {
        setCurrentReport(null);
      }
      toast.success('Document audit record deleted');
    } catch (err) {
      console.error('Failed to delete audit item:', err);
      toast.error('Failed to delete audit record');
    }
  };

  const handleClearAllHistory = async () => {
    try {
      await clearKagazAuditHistory(user?.name || 'citizen');
      setHistoryList([]);
      setCurrentReport(null);
      toast.success('All document audit history cleared');
    } catch (err) {
      console.error('Failed to clear history:', err);
      toast.error('Failed to clear audit history');
    }
  };

  // Scheme Dropdown Options
  const schemeOptions = [
    { value: 'general', label: 'General Document Audit (No specific scheme)', subLabel: 'Cross-verify identity and land title' },
    ...schemes.map((s) => ({
      value: s.id,
      label: s.name,
      subLabel: `${s.state || 'Central'} • ${s.benefit_amount || 'Direct Benefit'}`,
    })),
  ];

  const filteredHistory = historyList.filter((item) => {
    if (!historySearch) return true;
    const q = historySearch.toLowerCase();
    return (
      (item.scheme_name || '').toLowerCase().includes(q) ||
      (item.audit_id || '').toLowerCase().includes(q) ||
      (item.ai_executive_summary || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 text-left">
      {/* 1. TOP TAB WORKSPACE SWITCHER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-slate-100/80 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Multi-Document Auditor</span>
            {stagedFiles.length > 0 && (
              <span className="px-1.5 py-0.2 bg-slate-900 text-white rounded-full text-[10px]">
                {stagedFiles.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              loadHistory();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Recent Audits &amp; Vault</span>
            {historyList.length > 0 && (
              <span className="px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded-full text-[10px]">
                {historyList.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 px-2 text-xs font-mono text-slate-500">
          <span>Statutory Document Validation &amp; Digital Vault</span>
        </div>
      </div>

      {activeTab === 'audit' ? (
        /* ------------------------------------------------------------- */
        /* TAB 1: MULTI-DOCUMENT AUDIT WORKSPACE                        */
        /* ------------------------------------------------------------- */
        <div className="space-y-6">
          {/* Target Scheme Selection */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold font-mono uppercase tracking-wider">
                  STEP 1: SELECT STATUTORY TARGET SCHEME
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Choose Welfare Scheme or Enter Custom Scheme
                </h2>
              </div>

              {/* Toggle between Catalog Dropdown and Custom Input */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedSchemeId.startsWith('custom:')) setSelectedSchemeId('pm-kisan-001');
                  }}
                  className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    !selectedSchemeId.startsWith('custom:')
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Verified Catalog (25+)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedSchemeId.startsWith('custom:')) setSelectedSchemeId('custom:');
                  }}
                  className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    selectedSchemeId.startsWith('custom:')
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  + Custom Scheme
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              KagazCheck automatically evaluates your documents against the specific statutory rules, land limits, and Aadhaar DBT seeding requirements of this scheme.
            </p>

            {selectedSchemeId.startsWith('custom:') ? (
              /* Direct Custom Scheme Input Mode */
              <div className="space-y-2 max-w-2xl">
                <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-500">
                  Enter Custom Scheme Name or Government Program
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedSchemeId.replace(/^custom:/, '')}
                    onChange={(e) => setSelectedSchemeId(`custom:${e.target.value}`)}
                    placeholder="e.g. Karnataka Ganga Kalyana Scheme, UP Kisan Karj Mafi, PM Vishwakarma..."
                    className="flex-1 h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-800 transition shadow-2xs text-slate-900"
                    autoFocus
                  />
                  {selectedSchemeId !== 'custom:' && (
                    <button
                      type="button"
                      onClick={() => setSelectedSchemeId('pm-kisan-001')}
                      className="h-10 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Statutory document requirements will be discovered and verified automatically.</span>
                </div>
              </div>
            ) : (
              /* Comprehensive Catalog Dropdown with Custom Search */
              <div className="max-w-2xl space-y-1.5">
                <CustomDropdown
                  label="Target Government Welfare Program (25+ Programs Available)"
                  value={selectedSchemeId}
                  onChange={(val) => {
                    if (!schemes.some((s) => s.id === val) && val !== 'general') {
                      setSelectedSchemeId(`custom:${val}`);
                    } else {
                      setSelectedSchemeId(val);
                    }
                  }}
                  options={schemeOptions}
                  searchable={true}
                  allowCustom={true}
                  placeholder="Select scheme or type to add custom program..."
                />
                <span className="text-[10px] text-slate-400 font-mono block">
                  Tip: Type in the search box to add any custom central or state scheme.
                </span>
              </div>
            )}

            {/* Scheme Required Documents Checklist Preview */}
            {selectedScheme && !selectedSchemeId.startsWith('custom:') && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                  STATUTORY REQUIRED DOCUMENTS FOR {selectedScheme.name}:
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedScheme.required_documents?.map((doc, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                    >
                      <span className="text-slate-400 font-bold">•</span>
                      <span>{doc}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Document Staging & Camera Station */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold font-mono uppercase tracking-wider">
                  STEP 2: UPLOAD OR CAPTURE MULTIPLE DOCUMENTS
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Upload Scans, Photos, or PDFs (Stored in Secure Digital Vault)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Select Files</span>
                </button>

                <button
                  type="button"
                  onClick={cameraActive ? stopCamera : startCamera}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{cameraActive ? 'Close Camera' : 'Use Camera'}</span>
                </button>
              </div>
            </div>

            {/* Hidden Multi-file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Live Camera Viewfinder */}
            {cameraActive && (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="relative aspect-video max-h-80 bg-black rounded-xl overflow-hidden flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border-2 border-dashed border-white/30 pointer-events-none m-6 rounded-lg" />
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <span>Capture Document</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Staged Documents Preview Tray */}
            {stagedFiles.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-10 rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50 text-center space-y-3 transition cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400 shadow-2xs">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    Click to select or drag &amp; drop multiple documents (Aadhaar, Land RTC, Passbook, etc.)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Supports PNG, JPG, JPEG, WebP, and digital PDFs up to 15MB each
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {stagedFiles.length} Document{stagedFiles.length > 1 ? 's' : ''} Staged for Audit
                  </span>
                  <button
                    type="button"
                    onClick={clearStagedFiles}
                    className="text-[11px] font-mono text-slate-500 hover:text-red-600 transition cursor-pointer"
                  >
                    [ Clear All ]
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {stagedFiles.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition flex flex-col justify-between space-y-2.5 shadow-2xs group relative"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-mono font-bold">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeStagedFile(item.id)}
                          className="w-5 h-5 rounded-md bg-slate-200 hover:bg-red-100 hover:text-red-700 text-slate-600 text-xs flex items-center justify-center transition cursor-pointer"
                          title="Remove file"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="aspect-4/3 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                        {item.file.type === 'application/pdf' ? (
                          <div className="text-center p-2 space-y-1">
                            <span className="text-lg">📄</span>
                            <p className="text-[10px] font-mono text-slate-600 font-bold truncate max-w-[120px]">
                              {item.file.name}
                            </p>
                          </div>
                        ) : (
                          <img src={item.previewUrl} alt={item.file.name} className="w-full h-full object-cover" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {item.file.name}
                        </p>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {(item.file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Audit Run Button */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Target: <span className="font-bold text-slate-800">{selectedScheme?.name || 'General Welfare Audit'}</span>
                  </span>

                  <button
                    type="button"
                    disabled={isAuditing}
                    onClick={runBatchAudit}
                    className="h-11 px-6 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    {isAuditing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Validating Statutory Documents...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Run Statutory Audit ({stagedFiles.length} Documents) →</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Audit Error Message */}
          {auditError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 space-y-1">
              <span className="font-bold">Audit Error</span>
              <p>{auditError}</p>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* COMPLETE AUDIT REPORT VISUALIZATION                          */}
          {/* ------------------------------------------------------------- */}
          {currentReport && (
            <div className="space-y-6">
              {/* Executive Readiness Score Header */}
              <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white space-y-5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-0.5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold font-mono uppercase tracking-wider">
                      STATUTORY AUDIT REPORT • ID: {currentReport.audit_id}
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900">
                      {currentReport.scheme_name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(currentReport.created_at).toLocaleDateString()} • {currentReport.execution_time_ms}ms
                    </span>
                  </div>
                </div>

                {/* Score & Verdict Banner */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center font-black shadow-xs shrink-0">
                      <span className="text-xl leading-none">{currentReport.overall_readiness_pct}%</span>
                      <span className="text-[9px] font-mono text-slate-400 uppercase mt-0.5">Score</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-bold font-mono">
                          VERDICT: {currentReport.verdict.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 max-w-xl leading-relaxed">
                        {currentReport.ai_executive_summary}
                      </p>
                    </div>
                  </div>

                  {/* Parchaa Form Action */}
                  <div className="shrink-0 flex items-center gap-2">
                    <Link
                      href={`/dashboard/parchaa?scheme=${currentReport.scheme_id || 'pm-kisan-001'}`}
                      className="h-10 px-5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>Proceed to Parchaa Form</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>

                {/* Cross-Document Consistency Matrix */}
                {currentReport.cross_document_matches && currentReport.cross_document_matches.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                      CROSS-DOCUMENT RECONCILIATION &amp; VALIDATIONS:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {currentReport.cross_document_matches.map((item, mIdx) => (
                        <div
                          key={mIdx}
                          className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900">{item.parameter}</span>
                            <span
                              className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold ${
                                item.status === 'MATCHED'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {item.details}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Required Documents Checklist */}
                {currentReport.required_documents_checklist && currentReport.required_documents_checklist.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                      STATUTORY DOCUMENT CHECKLIST:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentReport.required_documents_checklist.map((chk, cIdx) => (
                        <div
                          key={cIdx}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs font-semibold ${
                            chk.is_present
                              ? 'bg-slate-50 border-slate-200 text-slate-800'
                              : 'bg-red-50/50 border-red-200 text-red-800'
                          }`}
                        >
                          <span className="truncate">{chk.document_requirement}</span>
                          <span className="text-[10px] font-mono shrink-0">
                            {chk.is_present ? '✓ Verified' : '✕ Missing'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actionable Recommendations */}
                {currentReport.actionable_recommendations && currentReport.actionable_recommendations.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                      CITIZEN REMEDIATION GUIDANCE:
                    </span>
                    <ul className="space-y-1.5">
                      {currentReport.actionable_recommendations.map((rec, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                          <span className="text-emerald-700 font-bold select-none">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Uploaded Documents & Digital Vault Grid */}
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                  Audited Documents &amp; Verified Scans ({currentReport.documents.length})
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentReport.documents.map((doc, dIdx) => (
                    <div
                      key={doc.doc_id || dIdx}
                      className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="space-y-0.5 min-w-0">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-mono font-bold uppercase">
                            {doc.detected_type.replace(/_/g, ' ')}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {doc.file_name}
                          </h4>
                        </div>

                        {doc.cloudinary_url && (
                          <a
                            href={doc.cloudinary_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-[10px] font-bold font-mono text-slate-700 transition flex items-center gap-1 shadow-2xs shrink-0"
                          >
                            <span>View Scan</span>
                            <span>↗</span>
                          </a>
                        )}
                      </div>

                      {/* Extracted Fields Table */}
                      {doc.extracted_fields && Object.keys(doc.extracted_fields).length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                            Extracted Statutory Fields:
                          </span>
                          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            {Object.entries(doc.extracted_fields).map(([k, v]) => (
                              <div key={k} className="truncate">
                                <span className="text-[10px] text-slate-400 block uppercase font-mono truncate">{k}:</span>
                                <span className="font-bold text-slate-800 truncate block">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Validation Issues / Checklist */}
                      {doc.issues && doc.issues.length > 0 ? (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1 text-xs text-amber-800">
                          <span className="font-bold text-[10px] uppercase font-mono">Issues Detected:</span>
                          <ul className="space-y-0.5">
                            {doc.issues.map((iss, iIdx) => (
                              <li key={iIdx} className="text-[11px]">• {iss}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          <span>All deterministic checksums &amp; formats verified</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* TAB 2: RECENT AUDITS HISTORY (FROM SECURE VAULT)              */
        /* ------------------------------------------------------------- */
        <div className="space-y-5">
          <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold font-mono uppercase tracking-wider">
                  SECURE AUDIT VAULT
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Citizen Document Audit History
                </h2>
              </div>

              {historyList.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllHistory}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-red-50 hover:text-red-700 text-slate-600 text-xs font-semibold transition cursor-pointer"
                >
                  Clear All History
                </button>
              )}
            </div>

            {/* Filter Search */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search audit by scheme name, ID, or keywords..."
                className="flex-1 h-10 px-3.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-800 transition shadow-2xs text-slate-900"
              />
              <button
                type="button"
                onClick={loadHistory}
                className="h-10 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* History List */}
          {isLoadingHistory ? (
            <div className="p-12 rounded-2xl border border-slate-200 bg-white text-center space-y-2">
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-mono">Loading saved audit history...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-12 rounded-2xl border border-slate-200 bg-white text-center space-y-2 shadow-xs">
              <span className="text-xs font-bold uppercase text-slate-900 block">
                No past audit records found
              </span>
              <p className="text-xs text-slate-500">
                Run a document audit from the "Multi-Document Auditor" tab to save reports here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <div
                  key={item.audit_id}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-slate-400 bg-white transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-mono font-bold">
                        {item.overall_readiness_pct}% Ready
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-semibold">
                        {item.documents_count} Document{item.documents_count > 1 ? 's' : ''}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(item.created_at).toLocaleDateString()} • ID: {item.audit_id}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {item.scheme_name}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">
                      {item.ai_executive_summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentReport(item);
                        setActiveTab('audit');
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }}
                      className="h-9 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <span>View Report</span>
                      <span>→</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteHistory(item.audit_id)}
                      className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-red-50 hover:text-red-700 text-slate-500 text-xs flex items-center justify-center transition cursor-pointer shadow-2xs"
                      title="Delete audit record"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

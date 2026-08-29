'use client';

import { useState, useEffect } from 'react';
import { CustomDropdown } from '@/components/CustomDropdown';
import {
  generateParchaa,
  fetchParchaaPreview,
  type CitizenProfile,
  type SchemeData,
  type SchemeMatchResult,
  type ParchaaResponse,
  type ParchaaDocumentItem,
  type ParchaaRequest,
} from '../services/api';

interface ParchaaGeneratorProps {
  initialScheme?: SchemeData | SchemeMatchResult | { id: string; name: string } | null;
  citizenProfile?: CitizenProfile;
  availableSchemes?: SchemeData[];
  documentReadiness?: ParchaaDocumentItem[];
  language?: string;
  onExploreSchemes?: () => void;
  onOpenKagazCheck?: (schemeId?: string) => void;
}

export function ParchaaGenerator({
  initialScheme = null,
  citizenProfile,
  availableSchemes = [],
  documentReadiness = [],
  language = 'en',
  onOpenKagazCheck,
}: ParchaaGeneratorProps) {
  // Scheme Selection State
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>(() => {
    if (!initialScheme) return 'pm-kisan-001';
    if ('id' in initialScheme && initialScheme.id) return initialScheme.id;
    if ('scheme_id' in initialScheme && (initialScheme as SchemeMatchResult).scheme_id) {
      return (initialScheme as SchemeMatchResult).scheme_id;
    }
    return 'pm-kisan-001';
  });

  const [selectedLanguage, setSelectedLanguage] = useState<string>(language);
  const [loading, setLoading] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [parchaaData, setParchaaData] = useState<ParchaaResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initial scheme if prop updates
  useEffect(() => {
    if (initialScheme) {
      if ('id' in initialScheme && initialScheme.id) {
        setSelectedSchemeId(initialScheme.id);
      } else if ('scheme_id' in initialScheme && (initialScheme as SchemeMatchResult).scheme_id) {
        setSelectedSchemeId((initialScheme as SchemeMatchResult).scheme_id);
      }
    }
  }, [initialScheme]);

  // Load preview whenever scheme or language changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setErrorMessage(null);

    const payload: ParchaaRequest = {
      scheme_id: selectedSchemeId,
      citizen_profile: citizenProfile,
      language: selectedLanguage,
      verified_documents: documentReadiness,
      output_format: 'json',
    };

    fetchParchaaPreview(payload)
      .then((data) => {
        if (isMounted) {
          setParchaaData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load Parchaa preview:', err);
          setErrorMessage('Failed to generate application dossier preview.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSchemeId, selectedLanguage, citizenProfile, documentReadiness]);

  // Direct PDF Download Handler
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    setErrorMessage(null);

    try {
      const payload: ParchaaRequest = {
        scheme_id: selectedSchemeId,
        citizen_profile: citizenProfile,
        language: selectedLanguage,
        verified_documents: documentReadiness,
        output_format: 'pdf',
      };

      const pdfBlob = await generateParchaa(payload);
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `GramSetu_Parchaa_${selectedSchemeId}_${selectedLanguage}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err: unknown) {
      let msg = 'Failed to generate PDF. Please try again.';
      if (err instanceof Error) msg = err.message;
      setErrorMessage(msg);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrintParchaa = () => {
    window.print();
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="badge-saas badge-saas-active text-[8px]">
            VERIFIED
          </span>
        );
      case 'missing':
        return (
          <span className="badge-saas badge-saas-neutral text-[8px]">
            REQUIRED
          </span>
        );
      default:
        return (
          <span className="badge-saas badge-saas-neutral text-[8px]">
            PENDING
          </span>
        );
    }
  };

  const languageOptions = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'kn', label: 'ಕನ್ನಡ' },
  ];

  const schemeDropdownOptions = [
    { value: 'pm-kisan-001', label: 'PM-KISAN (Income Support)' },
    { value: 'pmay-g-002', label: 'PMAY-G (Rural Housing)' },
    { value: 'pmmvy-003', label: 'PMMVY (Maternity Support)' },
    { value: 'pm-jay-004', label: 'Ayushman Bharat (PM-JAY)' },
    { value: 'raitha-vidya-005', label: 'Raitha Vidya Nidhi' },
    ...availableSchemes.map((s) => ({
      value: s.id,
      label: s.name,
    })),
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left animate-sleek">
      {/* 1. HEADER BANNER */}
      <div className="p-6 card-saas space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="space-y-1">
            <span className="badge-saas badge-saas-active">
              OFFICIAL APPLICATION DOSSIER ENGINE
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mt-1">
              Single-Page Parchaa Generator
            </h2>
            <p className="text-xs text-muted-foreground font-sans-sleek">
              Generate a verified, physical-ready application dossier containing checklist tables, applicant attributes, and QR validation.
            </p>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg border border-border">
            {languageOptions.map((l) => (
              <button
                key={l.code}
                onClick={() => setSelectedLanguage(l.code)}
                className={`px-3 py-1 text-xs font-mono-code font-bold rounded-md transition cursor-pointer ${
                  selectedLanguage === l.code
                    ? 'bg-foreground text-background shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Target Scheme & Actions */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 card-saas space-y-4">
            <CustomDropdown
              label="SELECT SCHEME"
              value={selectedSchemeId}
              onChange={(val) => setSelectedSchemeId(val)}
              options={schemeDropdownOptions}
              searchable={true}
            />

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf || loading}
                className="w-full btn-primary-sleek"
              >
                {downloadingPdf ? 'Generating PDF...' : 'Download Official PDF'}
              </button>

              <button
                type="button"
                onClick={handlePrintParchaa}
                disabled={loading}
                className="w-full btn-outline-sleek"
              >
                Print Parchaa Dossier
              </button>

              {onOpenKagazCheck && (
                <button
                  type="button"
                  onClick={() => onOpenKagazCheck(selectedSchemeId)}
                  className="w-full py-1 text-center font-mono-code text-[11px] font-bold uppercase text-[#10b981] dark:text-[#34d399] hover:underline cursor-pointer"
                >
                  [ Audit Supporting Documents ]
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Physical A4 Parchaa Preview */}
        <div className="lg:col-span-8 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono-code">
              ERROR // {errorMessage}
            </div>
          )}

          {loading ? (
            <div className="p-16 card-saas text-center text-xs font-mono-code text-muted-foreground uppercase">
              Compiling statutory dossier...
            </div>
          ) : parchaaData ? (
            <div className="p-6 sm:p-8 card-saas bg-card text-foreground space-y-6 shadow-sm border border-border">
              {/* Document Header */}
              <div className="border-b border-border pb-4 flex items-center justify-between">
                <div>
                  <span className="badge-saas badge-saas-active text-[8px]">
                    OFFICIAL APPLICATION DOSSIER
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-foreground mt-1">
                    {parchaaData.scheme_name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-sans-sleek">
                    {parchaaData.nodal_agency || 'Ministry of Agriculture & Farmers Welfare'}
                  </p>
                </div>

                <div className="text-right font-mono-code text-[10px] text-muted-foreground space-y-0.5">
                  <span className="block font-bold text-foreground">
                    REF: {parchaaData.application_reference || 'GS-2026-APP'}
                  </span>
                  <span className="block">DATE: {new Date().toLocaleDateString()}</span>
                </div>
              </div>

              {/* Applicant Data Grid */}
              <div className="space-y-2">
                <span className="font-mono-code text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  APPLICANT PROFILE:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono-code">
                  <div className="p-2.5 bg-muted/40 rounded-lg border border-border">
                    <span className="text-[9px] text-muted-foreground block">NAME</span>
                    <span className="font-bold text-foreground truncate block">{parchaaData.applicant_name || 'Ramesh Gowda'}</span>
                  </div>
                  <div className="p-2.5 bg-muted/40 rounded-lg border border-border">
                    <span className="text-[9px] text-muted-foreground block">STATE</span>
                    <span className="font-bold text-foreground truncate block">{citizenProfile?.state || 'Karnataka'}</span>
                  </div>
                  <div className="p-2.5 bg-muted/40 rounded-lg border border-border">
                    <span className="text-[9px] text-muted-foreground block">LANDHOLDING</span>
                    <span className="font-bold text-foreground">{citizenProfile?.landholding || 3.5} Acres</span>
                  </div>
                  <div className="p-2.5 bg-muted/40 rounded-lg border border-border">
                    <span className="text-[9px] text-muted-foreground block">AADHAAR NPCI</span>
                    <span className="font-bold text-[#10b981] dark:text-[#34d399]">LINKED</span>
                  </div>
                </div>
              </div>

              {/* Required Documents Table */}
              <div className="space-y-2">
                <span className="font-mono-code text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  STATUTORY DOCUMENT CHECKLIST:
                </span>
                <div className="rounded-xl border border-border divide-y divide-border overflow-hidden text-xs">
                  {parchaaData.document_checklist?.map((doc, idx) => (
                    <div key={idx} className="p-3 bg-muted/20 flex items-center justify-between">
                      <div>
                        <span className="font-sans-sleek font-semibold text-foreground block">{doc.name}</span>
                        {doc.notes && (
                          <span className="text-[10px] text-muted-foreground font-sans-sleek">{doc.notes}</span>
                        )}
                      </div>
                      {renderStatusBadge(doc.status)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submission Instructions */}
              <div className="space-y-2">
                <span className="font-mono-code text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  CSC / SEVA KENDRA SUBMISSION INSTRUCTIONS:
                </span>
                <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-1.5 text-xs font-sans-sleek text-muted-foreground">
                  <p>1. Present this compiled Parchaa dossier along with physical photocopies to your nearest Common Service Centre (CSC) or Gram Panchayat.</p>
                  <p>2. Ensure biometric authentication or OTP verification matches the Aadhaar NPCI-seeded bank account.</p>
                  <p>3. Direct Benefit Transfer disbursements will initiate to the verified savings account.</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

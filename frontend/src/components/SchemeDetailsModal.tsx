'use client';

import { useEffect } from 'react';
import {
  type SchemeData,
  type SchemeMatchResult,
} from '../services/api';
import { SourceFavicon } from './SourceFavicon';

interface SchemeDetailsModalProps {
  scheme: SchemeData | SchemeMatchResult | null;
  profile?: any;
  onClose: () => void;
  onApply?: (scheme: SchemeData | SchemeMatchResult) => void;
  onStartApplication?: (scheme: SchemeData | SchemeMatchResult) => void;
  onAuditDocuments?: (scheme: SchemeData | SchemeMatchResult) => void;
  onGenerateParchaa?: (scheme: SchemeData | SchemeMatchResult) => void;
}

export function SchemeDetailsModal({
  scheme,
  onClose,
  onAuditDocuments,
  onGenerateParchaa,
}: SchemeDetailsModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!scheme) return null;

  const isMatched = 'match_score' in scheme;
  const matchResult = isMatched ? (scheme as SchemeMatchResult) : null;
  const isEligible = matchResult?.eligible_status ?? false;

  const schemeName = 'name' in scheme ? scheme.name : scheme.scheme_name;
  const detailedDesc = scheme.detailed_description || scheme.short_description;
  const benefits = scheme.benefits || [];
  const requiredDocs = scheme.required_documents || [];
  const category = ('category' in scheme && scheme.category) ? scheme.category : 'Central & State Welfare';
  const state = ('state' in scheme && scheme.state) ? scheme.state : 'Central Government';
  const ministry = ('ministry' in scheme && (scheme as any).ministry) ? (scheme as any).ministry : null;
  const benefitAmount = ('benefit_amount' in scheme && (scheme as any).benefit_amount)
    ? (scheme as any).benefit_amount
    : (benefits.length > 0 ? benefits[0] : 'Direct Benefit Transfer');
  const sourceUrl = scheme.official_source_url;

  const domain = sourceUrl
    ? new URL(sourceUrl).hostname.replace('www.', '')
    : 'myscheme.gov.in';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-sleek">
      <div className="bg-card w-full max-w-3xl border border-border corner-accent shadow-2xl overflow-hidden flex flex-col text-left">
        {/* Header */}
        <div className="p-6 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="badge-sleek badge-sleek-active text-[9px]">
                {category}
              </span>
              <span className="badge-sleek badge-sleek-neutral text-[9px]">
                {state}
              </span>
              {isMatched && (
                <span
                  className={`badge-sleek text-[9px] ${
                    isEligible
                      ? 'badge-sleek-contrast'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {isEligible ? '100% ELIGIBLE' : `${matchResult?.match_score}% MATCH`}
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-mono-code font-bold uppercase text-muted-foreground hover:text-foreground border border-border cursor-pointer"
            >
              [ Close ]
            </button>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {schemeName}
            </h2>
            {ministry && (
              <p className="text-xs text-muted-foreground font-medium">
                {ministry}
              </p>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[65vh] space-y-6">
          {/* Benefit Snapshot */}
          <div className="p-4 bg-muted/40 border border-border flex items-center justify-between gap-4">
            <div>
              <span className="font-mono-code text-[10px] text-muted-foreground uppercase block">
                STATUTORY BENEFIT ENTITLEMENT
              </span>
              <p className="text-sm font-bold text-foreground font-mono-code mt-0.5">
                {benefitAmount}
              </p>
            </div>

            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline-sleek text-xs gap-1.5"
              >
                <SourceFavicon url={sourceUrl} domain={domain} className="w-3.5 h-3.5 rounded-none" />
                <span>Visit Portal</span>
              </a>
            )}
          </div>

          {/* Scheme Description */}
          <div className="space-y-2">
            <span className="font-mono-code text-[10px] font-bold uppercase tracking-wider text-muted-foreground block border-b border-border pb-1">
              SCHEME PROVISIONS &amp; OBJECTIVES
            </span>
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans-sleek whitespace-pre-line">
              {detailedDesc}
            </p>
          </div>

          {/* Direct Benefits List */}
          {benefits.length > 0 && (
            <div className="space-y-2">
              <span className="font-mono-code text-[10px] font-bold uppercase tracking-wider text-muted-foreground block border-b border-border pb-1">
                KEY STATUTORY BENEFITS
              </span>
              <ul className="space-y-1.5 pl-1">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-foreground leading-relaxed font-sans-sleek">
                    <span className="font-mono-code text-muted-foreground select-none shrink-0">—</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Required Documents */}
          {requiredDocs.length > 0 && (
            <div className="space-y-2">
              <span className="font-mono-code text-[10px] font-bold uppercase tracking-wider text-muted-foreground block border-b border-border pb-1">
                REQUIRED STATUTORY DOCUMENTS
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {requiredDocs.map((doc, i) => (
                  <div key={i} className="p-2.5 bg-muted/30 border border-border text-xs flex items-center justify-between">
                    <span className="font-semibold text-foreground font-sans-sleek">{doc}</span>
                    <span className="font-mono-code text-[9px] text-muted-foreground uppercase">[ MANDATORY ]</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-border bg-card flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-mono-code text-muted-foreground">
            GAZETTE DOMAIN: {domain}
          </div>

          <div className="flex items-center gap-2">
            {onAuditDocuments && (
              <button
                type="button"
                onClick={() => onAuditDocuments(scheme)}
                className="btn-outline-sleek text-xs"
              >
                Audit Documents
              </button>
            )}

            {onGenerateParchaa && (
              <button
                type="button"
                onClick={() => onGenerateParchaa(scheme)}
                className="btn-primary-sleek text-xs"
              >
                Generate Application Parchaa
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

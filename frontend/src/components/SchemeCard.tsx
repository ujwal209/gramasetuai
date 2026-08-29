'use client';

import {
  type SchemeData,
  type SchemeMatchResult,
} from '../services/api';
import { SchemeImage } from './SchemeImage';

interface SchemeCardProps {
  scheme: SchemeData | SchemeMatchResult;
  onViewDetails: (scheme: SchemeData | SchemeMatchResult) => void;
  onCheckEligibility?: () => void;
  isMatchedView?: boolean;
}

export function SchemeCard({
  scheme,
  onViewDetails,
  onCheckEligibility,
  isMatchedView = false,
}: SchemeCardProps) {
  const matchResult = isMatchedView ? (scheme as SchemeMatchResult) : null;
  const isEligible = matchResult?.eligible_status ?? false;
  const matchScore = matchResult?.match_score ?? null;

  const schemeId = 'id' in scheme ? scheme.id : scheme.scheme_id;
  const schemeName = 'name' in scheme ? scheme.name : scheme.scheme_name;
  const shortDesc = scheme.short_description;
  const benefits = scheme.benefits || [];
  const category = ('category' in scheme && scheme.category) ? scheme.category : 'General Welfare';
  const state = ('state' in scheme && scheme.state) ? scheme.state : 'Central Government';
  const sourceUrl = scheme.official_source_url;

  const domain = sourceUrl ? new URL(sourceUrl).hostname.replace('www.', '') : 'india.gov.in';
  const benefitAmount = ('benefit_amount' in scheme && (scheme as any).benefit_amount)
    ? (scheme as any).benefit_amount
    : (benefits.length > 0 ? benefits[0] : null);

  return (
    <div
      className={`p-0 overflow-hidden card-saas flex flex-col justify-between transition-all duration-200 text-left ${
        isMatchedView && isEligible
          ? 'border-[#10b981]/50 ring-1 ring-[#10b981]/20 shadow-sm'
          : ''
      }`}
    >
      <div>
        {/* Photography Banner */}
        <div className="relative h-44 w-full overflow-hidden bg-muted rounded-t-[0.875rem]">
          <SchemeImage
            schemeId={schemeId}
            category={category}
            alt={schemeName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* Overlaid Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-1.5">
              <span className="badge-saas bg-black/70 text-white border-white/30 text-[8px]">
                {state}
              </span>
              <span className="badge-saas bg-black/70 text-white border-white/30 text-[8px]">
                {category.split('&')[0]}
              </span>
            </div>

            {matchScore !== null && (
              <div>
                {isEligible ? (
                  <span className="badge-saas badge-saas-active text-[8px]">
                    100% ELIGIBLE
                  </span>
                ) : (
                  <span className="badge-saas bg-black/70 text-white border-white/30 text-[8px]">
                    {matchScore}% MATCH
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="absolute bottom-3 left-3 right-3 text-white">
            <h3 className="font-bold text-sm leading-tight text-white line-clamp-1">
              {schemeName}
            </h3>
          </div>
        </div>

        {/* Card Body Details */}
        <div className="p-5 space-y-3">
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-sans-sleek">
            {shortDesc}
          </p>

          <div className="flex items-center justify-between text-xs font-mono-code border-t border-border pt-3">
            <span className="text-[10px] text-muted-foreground uppercase">
              GAZETTE: {domain}
            </span>
            {benefitAmount && (
              <span className="font-bold text-foreground text-[11px]">
                {benefitAmount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-5 pt-0 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onViewDetails(scheme)}
          className="flex-1 btn-primary-sleek text-[11px] h-9"
        >
          View Statute Details
        </button>

        {onCheckEligibility && (
          <button
            type="button"
            onClick={onCheckEligibility}
            className="btn-outline-sleek text-[11px] h-9 px-3"
          >
            Check
          </button>
        )}
      </div>
    </div>
  );
}

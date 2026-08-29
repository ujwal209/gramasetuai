'use client';

import { useState } from 'react';
import { SchemeCard } from './SchemeCard';
import type { EligibilityMatchResponse, SchemeData, SchemeMatchResult } from '../services/api';

interface MatchResultsProps {
  matchData: EligibilityMatchResponse;
  onViewDetails: (scheme: SchemeData | SchemeMatchResult) => void;
  onEditProfile: () => void;
}

export function MatchResults({
  matchData,
  onViewDetails,
  onEditProfile,
}: MatchResultsProps) {
  const [filter, setFilter] = useState<'all' | 'eligible' | 'partial'>('all');

  const { results, eligible_schemes_count, total_schemes_evaluated } =
    matchData;

  const filteredResults = results.filter((r) => {
    if (filter === 'eligible') return r.eligible_status;
    if (filter === 'partial') return !r.eligible_status;
    return true;
  });

  return (
    <div className="space-y-6 text-left animate-sleek">
      {/* Result Headline Banner */}
      <div className="p-6 card-saas space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <span className="badge-saas badge-saas-active">
              STATUTORY EVALUATION COMPLETE
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Citizen Scheme Matches
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans-sleek">
              <span className="font-bold text-[#10b981] dark:text-[#34d399] font-mono-code">
                {eligible_schemes_count} of {total_schemes_evaluated} statutory schemes
              </span>{' '}
              fully matched your profile attributes.
            </p>
          </div>

          <button
            onClick={onEditProfile}
            className="btn-outline-sleek text-xs py-1.5 px-3.5 self-start sm:self-auto h-8"
          >
            Modify Profile
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 pt-1">
          {[
            { id: 'all', label: `All (${results.length})` },
            { id: 'eligible', label: `Eligible (${eligible_schemes_count})` },
            { id: 'partial', label: `Non-Matched (${results.length - eligible_schemes_count})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                filter === tab.id
                  ? 'bg-foreground text-background font-bold shadow-2xs'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredResults.map((result) => (
          <SchemeCard
            key={result.scheme_id}
            scheme={result}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { DocumentChecklist } from './DocumentChecklist';

export interface ApplicationRecord {
  id: string;
  schemeId: string;
  schemeName: string;
  category: string;
  status: 'Not Started' | 'Preparing' | 'Documents Required' | 'Ready to Apply' | 'Submitted';
  documentsTotal: number;
  documentsReady: number;
  lastUpdated: string;
  nextAction: string;
  officialUrl: string;
  requiredDocuments: string[];
}

interface MyApplicationsViewProps {
  applications: ApplicationRecord[];
  onExploreSchemes: () => void;
  onOpenKagazCheck?: (schemeId?: string) => void;
  onGenerateParchaa?: (schemeId: string) => void;
}

export function MyApplicationsView({
  applications,
  onExploreSchemes,
  onOpenKagazCheck,
  onGenerateParchaa,
}: MyApplicationsViewProps) {
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(
    applications[0] || null
  );

  return (
    <div className="space-y-6 text-left animate-sleek">
      {/* Header Banner */}
      <div className="p-6 card-saas flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="badge-saas badge-saas-active">
            STATUTORY APPLICATION TRACKER
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Your Welfare Application Dossiers
          </h2>
          <p className="text-xs text-muted-foreground font-sans-sleek">
            Track certificate readiness and submission progress across Central and State ministries.
          </p>
        </div>

        <button
          type="button"
          onClick={onExploreSchemes}
          className="btn-primary-sleek text-xs py-2 px-4 shrink-0"
        >
          Find More Schemes
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Applications List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="font-mono-code text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              SAVED APPLICATIONS ({applications.length})
            </span>
          </div>

          <div className="space-y-2">
            {applications.map((app) => {
              const isSelected = selectedApp?.id === app.id;
              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`p-4 card-saas cursor-pointer space-y-2 transition ${
                    isSelected ? 'border-foreground font-bold shadow-xs' : 'hover:border-foreground/50'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono-code text-[10px]">
                    <span className="text-muted-foreground uppercase">{app.category}</span>
                    <span className="badge-saas badge-saas-neutral text-[8px]">
                      {app.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-foreground leading-snug font-sans-sleek">
                    {app.schemeName}
                  </h4>

                  <div className="flex items-center justify-between text-xs font-mono-code border-t border-border/60 pt-2 text-muted-foreground">
                    <span>
                      {app.documentsReady}/{app.documentsTotal} Docs
                    </span>
                    <span className="text-[10px] uppercase">
                      Updated: {app.lastUpdated}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Application Dossier Details (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {selectedApp ? (
            <div className="space-y-5">
              <div className="p-6 card-saas space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <span className="font-mono-code text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
                      ACTIVE DOSSIER
                    </span>
                    <h3 className="text-lg font-black text-foreground">
                      {selectedApp.schemeName}
                    </h3>
                  </div>

                  <span className="badge-saas badge-saas-contrast text-[9px]">
                    {selectedApp.status}
                  </span>
                </div>

                <div className="p-3.5 bg-muted/40 rounded-xl border border-border space-y-1 text-xs font-sans-sleek">
                  <span className="font-mono-code text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Next Recommended Step:
                  </span>
                  <p className="font-semibold text-foreground">
                    {selectedApp.nextAction}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  {onGenerateParchaa && (
                    <button
                      type="button"
                      onClick={() => onGenerateParchaa(selectedApp.schemeId)}
                      className="btn-primary-sleek text-xs py-1.5 px-4 h-9"
                    >
                      Generate Application Parchaa
                    </button>
                  )}

                  {onOpenKagazCheck && (
                    <button
                      type="button"
                      onClick={() => onOpenKagazCheck(selectedApp.schemeId)}
                      className="btn-outline-sleek text-xs py-1.5 px-4 h-9"
                    >
                      Audit Documents
                    </button>
                  )}
                </div>
              </div>

              {/* Checklist */}
              <DocumentChecklist
                schemeName={selectedApp.schemeName}
                documents={selectedApp.requiredDocuments}
                onOpenKagazCheck={() => onOpenKagazCheck && onOpenKagazCheck(selectedApp.schemeId)}
              />
            </div>
          ) : (
            <div className="p-12 card-saas text-center text-xs font-mono-code text-muted-foreground uppercase">
              Select an application dossier from the left panel to inspect details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

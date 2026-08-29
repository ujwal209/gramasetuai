'use client';

import { useState, useEffect } from 'react';

interface DocumentItem {
  id: string;
  name: string;
  required: boolean;
  status: 'ready' | 'missing' | 'uploading';
  fileName?: string;
}

interface DocumentChecklistProps {
  schemeName?: string;
  documents?: string[];
  onOpenKagazCheck?: () => void;
}

export function DocumentChecklist({
  schemeName = 'Application Documents',
  documents = ['Aadhaar Card', 'Land Records (Khata/ROR)', 'Bank Passbook', 'Ration Card'],
  onOpenKagazCheck,
}: DocumentChecklistProps) {
  const [docList, setDocList] = useState<DocumentItem[]>(() =>
    documents.map((doc, idx) => ({
      id: `doc-${idx}`,
      name: doc,
      required: true,
      status: idx === 0 ? 'ready' : 'missing',
      fileName: idx === 0 ? 'Aadhaar_Verified.pdf' : undefined,
    }))
  );

  useEffect(() => {
    setDocList(
      documents.map((doc, idx) => ({
        id: `doc-${idx}`,
        name: doc,
        required: true,
        status: idx === 0 ? 'ready' : 'missing',
        fileName: idx === 0 ? 'Aadhaar_Verified.pdf' : undefined,
      }))
    );
  }, [documents]);

  const readyCount = docList.filter((d) => d.status === 'ready').length;
  const totalCount = docList.length;
  const progressPercent = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;

  const toggleDocStatus = (id: string) => {
    setDocList((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            status: d.status === 'ready' ? 'missing' : 'ready',
            fileName: d.status === 'ready' ? undefined : `${d.name.replace(/\s+/g, '_')}_Document.pdf`,
          };
        }
        return d;
      })
    );
  };

  return (
    <div className="p-6 card-saas space-y-5 text-left animate-sleek">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <span className="badge-saas badge-saas-neutral">
            STATUTORY REQUIREMENTS
          </span>
          <h3 className="text-base sm:text-lg font-bold text-foreground mt-1.5">
            {schemeName} Checklist
          </h3>
        </div>

        <div className="text-right font-mono-code text-xs">
          <span className="font-bold text-foreground">
            {readyCount} / {totalCount} READY ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* Itemized List */}
      <div className="space-y-2">
        {docList.map((doc) => (
          <div
            key={doc.id}
            onClick={() => toggleDocStatus(doc.id)}
            className="p-3.5 rounded-xl bg-muted/30 border border-border flex items-center justify-between gap-3 text-xs cursor-pointer hover:border-foreground/40 transition"
          >
            <div>
              <span className="font-semibold text-foreground block font-sans-sleek">{doc.name}</span>
              {doc.fileName && (
                <span className="font-mono-code text-[10px] text-muted-foreground">
                  FILE: {doc.fileName}
                </span>
              )}
            </div>

            <span
              className={`badge-saas ${
                doc.status === 'ready'
                  ? 'badge-saas-active'
                  : 'badge-saas-neutral'
              }`}
            >
              {doc.status === 'ready' ? 'READY' : 'MISSING'}
            </span>
          </div>
        ))}
      </div>

      {onOpenKagazCheck && (
        <div className="pt-2 border-t border-border flex justify-end">
          <button
            type="button"
            onClick={onOpenKagazCheck}
            className="btn-primary-sleek text-xs py-1.5 px-4 h-9"
          >
            Launch KagazCheck Auditor
          </button>
        </div>
      )}
    </div>
  );
}

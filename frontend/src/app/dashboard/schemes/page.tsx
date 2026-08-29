'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PopularSchemes } from '@/components/PopularSchemes';
import { SchemeDetailsModal } from '@/components/SchemeDetailsModal';
import { useAuth } from '@/context/AuthContext';
import { type Scheme, type CitizenProfile } from '@/services/api';

export default function DashboardSchemesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);

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

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-2 max-w-xl">
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
            STATUTORY ELIGIBILITY ENGINE
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Scheme Discovery &amp; Eligibility Evaluation
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Deterministic matching against central and state agricultural gazettes tailored for your {user?.landholding_acres || '3.5'} acre parcel in {user?.district || 'Mandya'}.
          </p>
        </div>

        <div className="w-full md:w-56 shrink-0 flex items-center justify-center">
          <img src="/schemediscovery.png" alt="Scheme Discovery" className="w-full h-auto object-contain max-h-48" />
        </div>
      </div>

      <PopularSchemes
        onViewDetails={(scheme) => setSelectedScheme(scheme as any)}
        onSelectScheme={(scheme) => setSelectedScheme(scheme as any)}
      />

      {selectedScheme && (
        <SchemeDetailsModal
          scheme={selectedScheme}
          profile={citizenProfile}
          onClose={() => setSelectedScheme(null)}
          onApply={(scheme) => {
            setSelectedScheme(null);
            router.push('/dashboard/parchaa');
          }}
        />
      )}
    </div>
  );
}

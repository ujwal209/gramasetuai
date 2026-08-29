'use client';

import { useState, type FormEvent } from 'react';
import { CustomDropdown } from '@/components/CustomDropdown';
import type { CitizenProfile } from '../services/api';

interface ProfileFormProps {
  initialProfile: CitizenProfile;
  onSubmit: (profile: CitizenProfile) => void;
  loading: boolean;
}

export function ProfileForm({ initialProfile, onSubmit, loading }: ProfileFormProps) {
  const [profile, setProfile] = useState<CitizenProfile>(initialProfile);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(profile);
  };

  const loadPreset = (preset: 'farmer_karnataka' | 'rural_mother' | 'youth_artisan') => {
    if (preset === 'farmer_karnataka') {
      const p: CitizenProfile = {
        age: 42,
        income: 180000,
        state: 'Karnataka',
        district: 'Mandya',
        gender: 'male',
        occupation: 'farmer',
        landholding: 2.5,
        category: 'OBC',
        bpl: true,
      };
      setProfile(p);
      onSubmit(p);
    } else if (preset === 'rural_mother') {
      const p: CitizenProfile = {
        age: 25,
        income: 240000,
        state: 'Uttar Pradesh',
        district: 'Varanasi',
        gender: 'female',
        occupation: 'homemaker',
        landholding: 0,
        category: 'General',
        bpl: false,
      };
      setProfile(p);
      onSubmit(p);
    } else {
      const p: CitizenProfile = {
        age: 22,
        income: 90000,
        state: 'Rajasthan',
        district: 'Jaipur',
        gender: 'male',
        occupation: 'artisan',
        landholding: 0,
        category: 'SC',
        bpl: true,
      };
      setProfile(p);
      onSubmit(p);
    }
  };

  return (
    <div className="p-6 sm:p-8 bg-card border border-border corner-accent space-y-6 text-left shadow-xs animate-sleek">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="space-y-1">
          <span className="badge-sleek badge-sleek-active">
            CITIZEN ELIGIBILITY EVALUATOR
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Deterministic Scheme Matcher
          </h2>
          <p className="text-xs text-muted-foreground font-sans-sleek">
            Provide citizen demographic and land attributes to evaluate 100% verified statutory welfare rules.
          </p>
        </div>

        {/* Quick Demo Personas */}
        <div className="space-y-1 text-left sm:text-right">
          <span className="font-mono-code text-[10px] font-bold text-muted-foreground uppercase block">
            DEMO PROFILES:
          </span>
          <div className="flex flex-wrap gap-1 justify-start sm:justify-end">
            <button
              type="button"
              onClick={() => loadPreset('farmer_karnataka')}
              className="px-2 py-1 bg-muted/60 hover:bg-muted border border-border text-[10px] font-mono-code font-bold uppercase transition cursor-pointer"
            >
              [ KA Farmer ]
            </button>
            <button
              type="button"
              onClick={() => loadPreset('rural_mother')}
              className="px-2 py-1 bg-muted/60 hover:bg-muted border border-border text-[10px] font-mono-code font-bold uppercase transition cursor-pointer"
            >
              [ UP Mother ]
            </button>
            <button
              type="button"
              onClick={() => loadPreset('youth_artisan')}
              className="px-2 py-1 bg-muted/60 hover:bg-muted border border-border text-[10px] font-mono-code font-bold uppercase transition cursor-pointer"
            >
              [ Artisan ]
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Demographics */}
        <div className="space-y-3">
          <span className="font-mono-code text-[10px] font-bold uppercase tracking-widest text-muted-foreground block border-b border-border pb-1.5">
            01 // DEMOGRAPHIC ATTRIBUTES
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono-code font-bold uppercase text-muted-foreground block">
                Age
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={profile.age ?? ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    age: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="42"
                className="input-sleek font-mono-code"
              />
            </div>

            <CustomDropdown
              label="Gender"
              value={profile.gender ?? ''}
              onChange={(val) => setProfile({ ...profile, gender: val || undefined })}
              options={[
                { value: '', label: 'Select Gender...' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'transgender', label: 'Transgender' },
              ]}
            />

            <CustomDropdown
              label="State / Region"
              value={profile.state ?? ''}
              onChange={(val) => setProfile({ ...profile, state: val || undefined })}
              options={[
                { value: '', label: 'Select State...' },
                { value: 'Karnataka', label: 'Karnataka' },
                { value: 'Maharashtra', label: 'Maharashtra' },
                { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
                { value: 'Tamil Nadu', label: 'Tamil Nadu' },
                { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
                { value: 'Telangana', label: 'Telangana' },
                { value: 'Rajasthan', label: 'Rajasthan' },
                { value: 'Punjab', label: 'Punjab' },
                { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
                { value: 'Bihar', label: 'Bihar' },
                { value: 'Gujarat', label: 'Gujarat' },
              ]}
              searchable={true}
            />
          </div>
        </div>

        {/* Section 2: Economics & Landholding */}
        <div className="space-y-3">
          <span className="font-mono-code text-[10px] font-bold uppercase tracking-widest text-muted-foreground block border-b border-border pb-1.5">
            02 // OCCUPATION &amp; FARM CRITERIA
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono-code font-bold uppercase text-muted-foreground block">
                Primary Occupation
              </label>
              <input
                type="text"
                value={profile.occupation ?? ''}
                onChange={(e) =>
                  setProfile({ ...profile, occupation: e.target.value || undefined })
                }
                placeholder="e.g. farmer, artisan, student"
                className="input-sleek"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono-code font-bold uppercase text-muted-foreground block">
                Annual Household Income (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={profile.income ?? ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    income: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="180000"
                className="input-sleek font-mono-code"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono-code font-bold uppercase text-muted-foreground block">
                Agricultural Landholding (Acres)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={profile.landholding ?? ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    landholding: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="2.5 (0 if landless)"
                className="input-sleek font-mono-code"
              />
            </div>

            <CustomDropdown
              label="Social Category"
              value={profile.category ?? ''}
              onChange={(val) => setProfile({ ...profile, category: val || undefined })}
              options={[
                { value: '', label: 'Select Category...' },
                { value: 'General', label: 'General' },
                { value: 'OBC', label: 'OBC (Other Backward Classes)' },
                { value: 'SC', label: 'SC (Scheduled Caste)' },
                { value: 'ST', label: 'ST (Scheduled Tribe)' },
              ]}
            />
          </div>

          <div className="pt-2">
            <label className="block text-[10px] font-mono-code font-bold uppercase text-muted-foreground mb-1.5">
              Ration Card Status:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProfile({ ...profile, bpl: true })}
                className={`p-2 text-xs font-mono-code text-left border cursor-pointer ${
                  profile.bpl === true
                    ? 'bg-foreground text-background border-foreground font-bold'
                    : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                [ YES — BPL / Antyodaya ]
              </button>
              <button
                type="button"
                onClick={() => setProfile({ ...profile, bpl: false })}
                className={`p-2 text-xs font-mono-code text-left border cursor-pointer ${
                  profile.bpl === false
                    ? 'bg-foreground text-background border-foreground font-bold'
                    : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                [ NO — Non-BPL / General ]
              </button>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-border">
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary-sleek h-11 text-xs"
          >
            {loading ? 'Evaluating Gazette Rules...' : 'Find My Eligible Schemes'}
          </button>
        </div>
      </form>
    </div>
  );
}

'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { CustomDropdown } from '@/components/CustomDropdown';
import { useAuth } from '../context/AuthContext';
import type { CitizenProfile } from '../services/api';

interface MyProfileViewProps {
  profile: CitizenProfile;
  onSaveProfile: (profile: CitizenProfile) => void;
  onFindSchemes: (profile: CitizenProfile) => void;
}

export function MyProfileView({
  profile: initialProfile,
  onSaveProfile,
}: MyProfileViewProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CitizenProfile>(initialProfile);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    onSaveProfile(profile);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left py-2 animate-sleek">
      {/* Top Banner */}
      {user && (
        <div className="p-6 bg-card border border-border corner-accent space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-foreground text-background font-mono-code font-bold text-xl flex items-center justify-center border border-foreground">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-foreground">
                    {user.name}
                  </h2>
                  <span className="badge-sleek badge-sleek-active text-[8px]">
                    VERIFIED
                  </span>
                </div>
                <p className="font-mono-code text-xs text-muted-foreground">
                  @{user.handle} • {user.district || 'Mandya'}, {user.state || 'Karnataka'}
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/krishi-map"
              className="btn-outline-sleek text-xs py-1.5 px-3"
            >
              [ Open Krishi GIS Map ]
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono-code">
            <div className="p-2.5 bg-muted/40 border border-border">
              <span className="text-[9px] text-muted-foreground block">LANDHOLDING</span>
              <span className="font-bold text-foreground">{user.landholding_acres || 3.5} Acres</span>
            </div>
            <div className="p-2.5 bg-muted/40 border border-border">
              <span className="text-[9px] text-muted-foreground block">PRIMARY CROPS</span>
              <span className="font-bold text-foreground truncate block">{user.primary_crop || 'Paddy'}</span>
            </div>
            <div className="p-2.5 bg-muted/40 border border-border">
              <span className="text-[9px] text-muted-foreground block">METHODOLOGY</span>
              <span className="font-bold text-foreground truncate block">{user.farming_type || 'Drip'}</span>
            </div>
            <div className="p-2.5 bg-muted/40 border border-border">
              <span className="text-[9px] text-muted-foreground block">DBT STATUS</span>
              <span className="font-bold text-[#15803d] dark:text-[#34d399]">NPCI ACTIVE</span>
            </div>
          </div>
        </div>
      )}

      {savedSuccess && (
        <div className="p-3 bg-[#c5fcee]/30 border border-[#2dd4bf]/40 text-[#15803d] dark:text-[#34d399] text-xs font-mono-code">
          STATUS // Profile parameters saved successfully.
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Details */}
        <div className="p-6 bg-card border border-border corner-accent space-y-4">
          <span className="font-mono-code text-[10px] font-bold uppercase tracking-widest text-muted-foreground block border-b border-border pb-2">
            01 // PERSONAL ATTRIBUTES
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono-code font-bold uppercase text-muted-foreground block">
                Age (Years)
              </label>
              <input
                type="number"
                value={profile.age ?? ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    age: e.target.value ? parseInt(e.target.value, 10) : undefined,
                  })
                }
                placeholder="42"
                className="input-sleek font-mono-code"
              />
            </div>

            <CustomDropdown
              label="Gender"
              value={profile.gender || ''}
              onChange={(val) => setProfile({ ...profile, gender: val })}
              options={[
                { value: '', label: 'Select Gender...' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'transgender', label: 'Transgender' },
              ]}
            />

            <CustomDropdown
              label="Social Category"
              value={profile.category || ''}
              onChange={(val) => setProfile({ ...profile, category: val })}
              options={[
                { value: '', label: 'Select Category...' },
                { value: 'General', label: 'General' },
                { value: 'OBC', label: 'OBC (Other Backward Classes)' },
                { value: 'SC', label: 'SC (Scheduled Caste)' },
                { value: 'ST', label: 'ST (Scheduled Tribe)' },
              ]}
            />
          </div>
        </div>

        {/* Socioeconomic Details */}
        <div className="p-6 bg-card border border-border corner-accent space-y-4">
          <span className="font-mono-code text-[10px] font-bold uppercase tracking-widest text-muted-foreground block border-b border-border pb-2">
            02 // SOCIOECONOMIC &amp; AGRICULTURAL CRITERIA
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CustomDropdown
              label="Occupation"
              value={profile.occupation || ''}
              onChange={(val) => setProfile({ ...profile, occupation: val })}
              options={[
                { value: '', label: 'Select Occupation...' },
                { value: 'farmer', label: 'Farmer / Agriculturalist' },
                { value: 'agricultural_labourer', label: 'Agricultural Labourer' },
                { value: 'artisan', label: 'Artisan / Weaver' },
                { value: 'self_employed', label: 'Self-Employed / MSME' },
                { value: 'student', label: 'Student' },
                { value: 'unemployed', label: 'Unemployed' },
              ]}
            />

            <CustomDropdown
              label="State of Residence"
              value={profile.state || ''}
              onChange={(val) => setProfile({ ...profile, state: val })}
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

            <div className="space-y-1">
              <label className="text-[10px] font-mono-code font-bold uppercase text-muted-foreground block">
                Annual Family Income (₹)
              </label>
              <input
                type="number"
                value={profile.income ?? ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    income: e.target.value ? parseInt(e.target.value, 10) : undefined,
                  })
                }
                placeholder="75000"
                className="input-sleek font-mono-code"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono-code font-bold uppercase text-muted-foreground block">
                Landholding (Acres)
              </label>
              <input
                type="number"
                step="0.1"
                value={profile.landholding ?? ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    landholding: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="2.5"
                className="input-sleek font-mono-code"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="bpl-check"
              checked={profile.bpl || false}
              onChange={(e) => setProfile({ ...profile, bpl: e.target.checked })}
              className="h-4 w-4 border-border"
            />
            <label htmlFor="bpl-check" className="text-xs font-mono-code text-foreground cursor-pointer">
              Hold official Below Poverty Line (BPL) / Antyodaya Ration Card
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="btn-primary-sleek h-11 px-6 text-xs"
          >
            Save Profile Parameters
          </button>
        </div>
      </form>
    </div>
  );
}

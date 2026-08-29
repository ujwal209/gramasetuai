'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { dashboardTranslations } from '@/lib/dashboardTranslations';
import { FarmLocationPicker } from '@/components/FarmLocationPicker';

export default function ProfileDossierPage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const t = dashboardTranslations[language]?.profile || dashboardTranslations.en.profile;

  const secondaryCropsList = user?.secondary_crops
    ? user.secondary_crops.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const machineryList = user?.machinery_owned
    ? user.machinery_owned.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const landImages = user?.land_images || [];
  const documentImages = user?.document_images || [];

  return (
    <div className="space-y-6 text-left animate-sleek max-w-6xl mx-auto pb-12">
      {/* 1. HERO DOSSIER HEADER */}
      <div className="p-6 sm:p-7 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-emerald-300 overflow-hidden bg-slate-100 flex items-center justify-center shadow-xs">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-black text-slate-700">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'F'}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {user?.name || 'Citizen Farmer'}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                ✓ Verified Citizen
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              @{user?.handle || 'citizen'} • {user?.email}
            </p>
            <p className="text-xs text-slate-600 font-medium">
              {user?.village || 'Village'}, {user?.district || 'District'}, {user?.state || 'State'}
            </p>
          </div>
        </div>

        {/* Action Button linking to separate edit page */}
        <Link
          href="/dashboard/profile/edit"
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span>{t.editProfileBtn}</span>
        </Link>
      </div>

      {/* 2. SECTION 1: CITIZEN DEMOGRAPHICS & INCLUSIONS */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{t.personalTitle}</h2>
            <p className="text-xs text-slate-500">{t.personalDesc}</p>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400">01 / 06</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Full Name</span>
            <span className="font-bold text-slate-900">{user?.name || '—'}</span>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mobile / WhatsApp</span>
            <span className="font-bold text-slate-900">{user?.phone || '—'}</span>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Gender & Age</span>
            <span className="font-bold text-slate-900">{user?.gender || 'Male'} • {user?.age ? `${user.age} Yrs` : '42 Yrs'}</span>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Annual Income</span>
            <span className="font-bold text-slate-900 font-mono">₹{user?.annual_income?.toLocaleString('en-IN') || '1,80,000'}</span>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Social Category</span>
            <span className="font-bold text-slate-900">{user?.caste_category || 'General'}</span>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1 sm:col-span-2 lg:col-span-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Special Welfare Category</span>
            <span className="font-bold text-slate-900">{user?.special_category || 'Small / Marginal Farmer'}</span>
          </div>
        </div>
      </div>

      {/* 3. SECTION 2: STATUTORY WELFARE & DBT LINKAGE STATUS */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{t.dbtTitle}</h2>
            <p className="text-xs text-slate-500">{t.dbtDesc}</p>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400">02 / 06</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-900">Aadhaar NPCI DBT Bank</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Subsidies bank account link</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
              user?.aadhaar_dbt_linked !== false ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'
            }`}>
              {user?.aadhaar_dbt_linked !== false ? '✓ SEEDED' : 'PENDING'}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-900">PM-KISAN Samman Nidhi</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Annual ₹6,000 farmer benefit</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
              user?.pm_kisan_registered !== false ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'
            }`}>
              {user?.pm_kisan_registered !== false ? '✓ ACTIVE' : 'PENDING'}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-900">Kisan Credit Card (KCC)</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Crop loan credit facility</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
              user?.kcc_card_active ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'
            }`}>
              {user?.kcc_card_active ? '✓ ACTIVE' : 'NOT LINKED'}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-900">PMFBY Crop Insurance</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Seasonal crop damage cover</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
              user?.crop_insurance_active ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'
            }`}>
              {user?.crop_insurance_active ? '✓ ENROLLED' : 'NOT ENROLLED'}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3 sm:col-span-2 lg:col-span-2">
            <div>
              <p className="text-xs font-bold text-slate-900">Soil Health Card (SHC)</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Tested NPK nutrient report for field plot</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
              user?.soil_health_card_issued !== false ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'
            }`}>
              {user?.soil_health_card_issued !== false ? '✓ ISSUED' : 'PENDING'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. SECTION 3: LANDHOLDING, SOIL & WATER INFRASTRUCTURE */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{t.landTitle}</h2>
            <p className="text-xs text-slate-500">{t.landDesc}</p>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400">03 / 06</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Survey / Khasra</span>
            <span className="font-bold text-slate-900">{user?.survey_number || '142/3B'}</span>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Area</span>
            <span className="font-bold text-slate-900 font-mono">{user?.landholding_acres || 3.5} Acres</span>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Irrigated Area</span>
            <span className="font-bold text-slate-900 font-mono">{user?.irrigated_acres || 2.0} Acres</span>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Soil Type</span>
            <span className="font-bold text-slate-900">{user?.soil_type || 'Red Loamy'}</span>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Water Source</span>
            <span className="font-bold text-slate-900">{user?.water_source || 'Borewell & Drip'}</span>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ownership</span>
            <span className="font-bold text-slate-900">{user?.ownership_status || 'Owner Cultivator'}</span>
          </div>
        </div>
      </div>

      {/* 5. SECTION 4: CROPPING SYSTEM, MACHINERY & LIVESTOCK */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{t.cropsTitle}</h2>
            <p className="text-xs text-slate-500">{t.cropsDesc}</p>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400">04 / 06</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Primary Crop Grown</span>
            <p className="text-sm font-bold text-slate-900">{user?.primary_crop || 'Paddy (Rice / ಭತ್ತ / धान)'}</p>
            <p className="text-[11px] text-slate-500">Method: {user?.farming_type || 'Micro-Drip & Fertigation'}</p>
          </div>

          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Livestock & Dairy Assets</span>
            <p className="text-sm font-bold text-slate-900">{user?.livestock_details || '2 Desi Cows, 1 Buffalo'}</p>
            <p className="text-[11px] text-slate-500">Bio: {user?.bio || 'Committed to organic management.'}</p>
          </div>

          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Secondary & Intercrops</span>
            {secondaryCropsList.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {secondaryCropsList.map((c, i) => (
                  <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[11px] font-semibold text-slate-800 shadow-2xs">
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">None specified</p>
            )}
          </div>

          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Farm Machinery Owned</span>
            {machineryList.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {machineryList.map((m, i) => (
                  <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[11px] font-semibold text-slate-800 shadow-2xs">
                    {m}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">None specified</p>
            )}
          </div>
        </div>
      </div>

      {/* 6. SECTION 5: CADASTRAL GPS MAP & VERIFIED ADDRESS */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{t.mapTitle}</h2>
            <p className="text-xs text-slate-500">{t.mapDesc}</p>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400">05 / 06</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 border border-slate-200 rounded-xl overflow-hidden h-[300px] shadow-xs">
            <FarmLocationPicker
              initialLatitude={user?.latitude ?? 12.5244}
              initialLongitude={user?.longitude ?? 76.8973}
              initialLocationName={user?.farm_location_name || 'Mandya, Karnataka'}
            />
          </div>

          <div className="lg:col-span-4 space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Farm Name / Area</span>
              <p className="font-bold text-slate-900">{user?.farm_location_name || 'Mandya Agricultural Basin'}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Village</span>
                <p className="font-semibold text-slate-900">{user?.village || 'Keragodu'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">District</span>
                <p className="font-semibold text-slate-900">{user?.district || 'Mandya'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">State</span>
                <p className="font-semibold text-slate-900">{user?.state || 'Karnataka'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PIN Code</span>
                <p className="font-semibold text-slate-900 font-mono">{user?.pincode || '571446'}</p>
              </div>
            </div>
            <div className="pt-1 border-t border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GPS Coordinates</span>
              <p className="font-mono text-emerald-800 font-bold text-[11px]">
                {user?.latitude ? `${user.latitude.toFixed(4)}°N` : '12.5244°N'},{' '}
                {user?.longitude ? `${user.longitude.toFixed(4)}°E` : '76.8973°E'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 7. SECTION 6: LAND & DOCUMENT PHOTO GALLERY */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{t.mediaTitle}</h2>
            <p className="text-xs text-slate-500">{t.mediaDesc}</p>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400">06 / 06</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Field Photos */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-900 block">Field & Parcel Snapshots</span>
            {landImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {landImages.map((img, idx) => (
                  <a
                    key={idx}
                    href={img}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg overflow-hidden border border-slate-200 h-20 bg-white hover:opacity-90 transition"
                  >
                    <img src={img} alt={`Field ${idx + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3">{t.noLandPhotos}</p>
            )}
          </div>

          {/* Document Scans */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-900 block">Pahani / RTC / 7-12 Records</span>
            {documentImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {documentImages.map((img, idx) => (
                  <a
                    key={idx}
                    href={img}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg overflow-hidden border border-slate-200 h-20 bg-white hover:opacity-90 transition"
                  >
                    <img src={img} alt={`Document ${idx + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3">{t.noDocPhotos}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

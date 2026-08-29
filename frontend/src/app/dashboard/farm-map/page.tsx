'use client';

import { useState } from 'react';
import { FarmLocationPicker, type FarmLocationData } from '@/components/FarmLocationPicker';
import { useAuth } from '@/context/AuthContext';

export default function DashboardFarmMapPage() {
  const { user, handleUpdateProfile } = useAuth();
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);

  const handleFarmLocationSave = async (loc: FarmLocationData) => {
    setSavingLocation(true);
    setLocationSuccess(null);
    try {
      await handleUpdateProfile({
        latitude: loc.latitude,
        longitude: loc.longitude,
        farm_location_name: loc.locationName,
        state: loc.state || user?.state || 'Karnataka',
        district: loc.district || user?.district || 'Mandya',
        village: loc.village || user?.village || 'Keragodu',
        pincode: loc.pincode || user?.pincode || '',
      });
      setLocationSuccess('Farm coordinates and location updated in database!');
      setTimeout(() => setLocationSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to update farm location:', err);
    } finally {
      setSavingLocation(false);
    }
  };

  return (
    <div className="space-y-6 text-left animate-sleek max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-2 max-w-xl">
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
            CADASTRAL GIS &amp; CLIMATE LINKER
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Farm Geolocation &amp; Cadastral Coordinate GIS
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Pinpoint your agricultural parcel or search any Indian village to ensure deterministic statutory eligibility matching for solar pumps and rainfall subsidies.
          </p>
        </div>

        <div className="w-full md:w-56 shrink-0 flex items-center justify-center">
          <img src="/climategislinker.png" alt="Climate GIS Linker" className="w-full h-auto object-contain max-h-48" />
        </div>
      </div>

      {locationSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold">
          {locationSuccess}
        </div>
      )}

      <div className="p-5 sm:p-6 border border-slate-200 bg-white rounded-2xl space-y-4 shadow-xs">
        <div className="w-full h-[400px]">
          <FarmLocationPicker
            initialLatitude={user?.latitude ?? 12.5244}
            initialLongitude={user?.longitude ?? 76.8973}
            initialLocationName={user?.farm_location_name || 'Mandya, Karnataka'}
            onLocationSelected={handleFarmLocationSave}
          />
        </div>
        {savingLocation && (
          <div className="text-xs font-mono text-slate-500 uppercase text-center pt-2">
            Saving parcel coordinates to database...
          </div>
        )}
      </div>
    </div>
  );
}

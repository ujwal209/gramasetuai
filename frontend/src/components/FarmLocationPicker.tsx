'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  searchDetailedIndianLocations,
  type DetailedIndianLocation,
} from '@/lib/suggestions';

export interface FarmLocationData {
  latitude: number;
  longitude: number;
  locationName: string;
  state?: string;
  district?: string;
  village?: string;
  pincode?: string;
}

interface FarmLocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  initialLatitude?: number;
  initialLongitude?: number;
  initialLocationName?: string;
  onLocationSelect?: (location: FarmLocationData) => void;
  onLocationSelected?: (location: FarmLocationData) => void;
}

export function FarmLocationPicker({
  initialLat,
  initialLng,
  initialLatitude = 12.5244,
  initialLongitude = 76.8973,
  initialLocationName = 'Mandya, Karnataka',
  onLocationSelect,
  onLocationSelected,
}: FarmLocationPickerProps) {
  const defaultLat = initialLat ?? initialLatitude;
  const defaultLng = initialLng ?? initialLongitude;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: defaultLat,
    lng: defaultLng,
  });
  const [locationName, setLocationName] = useState<string>(initialLocationName);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<DetailedIndianLocation[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [locatingUser, setLocatingUser] = useState<boolean>(false);
  const [geocoding, setGeocoding] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const notifyLocationChange = useCallback(
    (locData: FarmLocationData) => {
      if (onLocationSelect) onLocationSelect(locData);
      if (onLocationSelected) onLocationSelected(locData);
    },
    [onLocationSelect, onLocationSelected]
  );

  // Reverse Geocode
  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      setGeocoding(true);
      setGeoError(null);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`
        );
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const state = addr.state || '';
          const district =
            addr.state_district || addr.county || addr.district || addr.city || '';
          const village =
            addr.village ||
            addr.suburb ||
            addr.town ||
            addr.hamlet ||
            addr.neighbourhood ||
            addr.locality ||
            '';
          const pincode = addr.postcode || '';

          const parts = [village, district, state].filter(Boolean);
          const formattedName = parts.length > 0 ? parts.join(', ') : `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;

          setLocationName(formattedName);
          notifyLocationChange({
            latitude: lat,
            longitude: lng,
            locationName: formattedName,
            state,
            district,
            village,
            pincode,
          });
        } else {
          const fallback = `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
          setLocationName(fallback);
          notifyLocationChange({
            latitude: lat,
            longitude: lng,
            locationName: fallback,
          });
        }
      } catch (err) {
        console.warn('Reverse geocode error:', err);
        const fallback = `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
        setLocationName(fallback);
        notifyLocationChange({
          latitude: lat,
          longitude: lng,
          locationName: fallback,
        });
      } finally {
        setGeocoding(false);
      }
    },
    [notifyLocationChange]
  );

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined') return;
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const L = await import('leaflet');

      if (!isMounted || !mapContainerRef.current) return;

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="background-color: #065f46; border: 2px solid #a7f3d0; color: #ffffff; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); text-align: center; white-space: nowrap;">FARM PLOT</div>`,
        iconSize: [84, 26],
        iconAnchor: [42, 13],
      });

      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 13,
        zoomControl: false,
      });
      mapInstanceRef.current = map;

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([coords.lat, coords.lng], {
        icon: customIcon,
        draggable: true,
      }).addTo(map);
      markerRef.current = marker;

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setCoords({ lat: position.lat, lng: position.lng });
        reverseGeocode(position.lat, position.lng);
      });

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        setCoords({ lat, lng });
        marker.setLatLng([lat, lng]);
        reverseGeocode(lat, lng);
      });
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coords.lat, coords.lng, reverseGeocode]);

  // Click outside search
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Live Location Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchDetailedIndianLocations(searchQuery);
        setSearchResults(results);
        setShowDropdown(results.length > 0);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle Location Selection from Search Dropdown
  const handleSelectSearchResult = (loc: DetailedIndianLocation) => {
    setCoords({ lat: loc.latitude, lng: loc.longitude });
    setLocationName(loc.locationName);
    setSearchQuery('');
    setShowDropdown(false);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([loc.latitude, loc.longitude], 15, { duration: 1.2 });
      markerRef.current.setLatLng([loc.latitude, loc.longitude]);
    }

    notifyLocationChange({
      latitude: loc.latitude,
      longitude: loc.longitude,
      locationName: loc.locationName,
      state: loc.state,
      district: loc.district,
      village: loc.village,
      pincode: loc.pincode,
    });
  };

  // GPS Locate Current Farm
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your device.');
      return;
    }

    setLocatingUser(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setCoords({ lat, lng });

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.5 });
          markerRef.current.setLatLng([lat, lng]);
        }

        reverseGeocode(lat, lng);
        setLocatingUser(false);
      },
      (err) => {
        setGeoError(
          err.code === 1
            ? 'Location access denied. Please click on the map to choose your farm plot.'
            : 'Unable to retrieve location. Please search or tap on the map.'
        );
        setLocatingUser(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="w-full h-full flex flex-col space-y-2 text-left">
      {/* Top Search & GPS Control Bar */}
      <div className="flex items-center gap-2 relative z-30">
        <div ref={searchContainerRef} className="relative flex-1">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
              placeholder="Search any Indian village, taluk, district, or 6-digit PIN code..."
              className="w-full h-9 pl-8 pr-8 text-xs rounded-xl border border-slate-200 bg-white text-foreground focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 shadow-xs"
            />
            {/* Search Icon */}
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Spinner or Clear */}
            {isSearching ? (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            ) : null}
          </div>

          {/* Detailed Search Results Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl bg-white border border-slate-200 shadow-xl py-1 animate-sleek max-h-60 overflow-y-auto">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                Found {searchResults.length} Locations in India
              </div>
              {searchResults.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleSelectSearchResult(loc)}
                  className="w-full px-3 py-2 text-left text-xs transition cursor-pointer hover:bg-emerald-50/50 flex items-center justify-between border-b border-slate-100 last:border-0"
                >
                  <div className="truncate pr-2">
                    <p className="font-bold text-slate-900 truncate">{loc.title}</p>
                    <p className="text-[11px] text-slate-500 truncate">{loc.subtitle}</p>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100 shrink-0">
                    {loc.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* GPS Locate Button */}
        <button
          type="button"
          disabled={locatingUser}
          onClick={handleUseCurrentLocation}
          className="h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
          title="Auto-detect current GPS location"
        >
          {locatingUser ? (
            <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-3.5 h-3.5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
          <span className="hidden sm:inline">Locate Farm</span>
        </button>
      </div>

      {geoError && (
        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
          {geoError}
        </div>
      )}

      {/* Main Map Box */}
      <div className="relative flex-1 w-full min-h-[300px] rounded-xl overflow-hidden border border-slate-200 shadow-xs">
        <div ref={mapContainerRef} className="w-full h-full min-h-[300px]" />

        {geocoding && (
          <div className="absolute top-2.5 left-2.5 z-20 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-xs border border-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1.5 shadow-xs">
            <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span>Resolving Village Cadastre...</span>
          </div>
        )}

        {/* Floating coordinates indicator */}
        <div className="absolute bottom-2.5 left-2.5 z-20 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-xs border border-slate-200 text-slate-800 text-[11px] font-bold font-mono shadow-xs">
          {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
        </div>
      </div>
    </div>
  );
}

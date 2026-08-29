'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FarmLocationPicker, type FarmLocationData } from '@/components/FarmLocationPicker';
import { LanguageDropdown } from '@/components/LanguageDropdown';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { translations } from '@/lib/translations';
import { CustomSelect, type SelectOption } from '@/components/ui/CustomSelect';
import { CustomCheckbox } from '@/components/ui/CustomCheckbox';
import { AutoSuggestInput } from '@/components/ui/AutoSuggestInput';
import { MultiTagAutoSuggest } from '@/components/ui/MultiTagAutoSuggest';
import {
  POPULAR_INDIAN_CROPS,
  POPULAR_FARM_MACHINERY,
  POPULAR_FARMING_TECHNIQUES,
} from '@/lib/suggestions';

type OnboardingStep = 1 | 2 | 3 | 4;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, token, loading: authLoading, isInitialized, handleUpdateProfile } = useAuth();
  const { language, setLanguage } = useLanguage();

  const tOnboard = translations[language]?.onboarding || translations.en.onboarding;

  // Authentication guard
  useEffect(() => {
    if (isInitialized && !authLoading && (!user || !token)) {
      router.replace('/auth/login');
    }
  }, [isInitialized, authLoading, user, token, router]);

  const [activeStep, setActiveStep] = useState<OnboardingStep>(1);

  // Step 1: Citizen Identity & Schemes
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [gender, setGender] = useState(user?.gender || 'Male');
  const [age, setAge] = useState(user?.age ? String(user.age) : '42');
  const [casteCategory, setCasteCategory] = useState(user?.caste_category || 'General');
  const [specialCategory, setSpecialCategory] = useState(user?.special_category || 'Small / Marginal Farmer');
  const [annualIncome, setAnnualIncome] = useState(user?.annual_income ? String(user.annual_income) : '180000');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Statutory Schemes & DBT Checkboxes
  const [aadhaarDbtLinked, setAadhaarDbtLinked] = useState<boolean>(user?.aadhaar_dbt_linked ?? true);
  const [pmKisanRegistered, setPmKisanRegistered] = useState<boolean>(user?.pm_kisan_registered ?? true);
  const [kccCardActive, setKccCardActive] = useState<boolean>(user?.kcc_card_active ?? false);
  const [cropInsuranceActive, setCropInsuranceActive] = useState<boolean>(user?.crop_insurance_active ?? false);
  const [soilHealthCardIssued, setSoilHealthCardIssued] = useState<boolean>(user?.soil_health_card_issued ?? true);

  // Step 2: Landholding & Irrigation
  const [surveyNumber, setSurveyNumber] = useState(user?.survey_number || '');
  const [landholding, setLandholding] = useState(
    user?.landholding_acres ? String(user.landholding_acres) : ''
  );
  const [irrigatedAcres, setIrrigatedAcres] = useState(
    user?.irrigated_acres ? String(user.irrigated_acres) : ''
  );
  const [soilType, setSoilType] = useState(user?.soil_type || 'Red Loamy');
  const [waterSource, setWaterSource] = useState(user?.water_source || 'Borewell & Drip System');
  const [ownershipStatus, setOwnershipStatus] = useState(user?.ownership_status || 'Owner Cultivator');

  // Step 3: Crops, Livestock & Machinery
  const [primaryCrop, setPrimaryCrop] = useState(user?.primary_crop || '');
  const [secondaryCropsList, setSecondaryCropsList] = useState<string[]>(
    user?.secondary_crops ? user.secondary_crops.split(',').map((s) => s.trim()).filter(Boolean) : []
  );
  const [farmingType, setFarmingType] = useState(user?.farming_type || 'Micro-Drip & Fertigation System');
  const [machineryList, setMachineryList] = useState<string[]>(
    user?.machinery_owned ? user.machinery_owned.split(',').map((s) => s.trim()).filter(Boolean) : []
  );
  const [livestockDetails, setLivestockDetails] = useState(user?.livestock_details || '');
  const [bio, setBio] = useState(user?.bio || '');

  // Step 4: Map & Media Uploads
  const [state, setState] = useState(user?.state || '');
  const [district, setDistrict] = useState(user?.district || '');
  const [village, setVillage] = useState(user?.village || '');
  const [pincode, setPincode] = useState(user?.pincode || '');
  const [latitude, setLatitude] = useState<number | undefined>(user?.latitude ?? 12.5244);
  const [longitude, setLongitude] = useState<number | undefined>(user?.longitude ?? 76.8973);
  const [farmLocationName, setFarmLocationName] = useState<string>(
    user?.farm_location_name || ''
  );
  const [landImages, setLandImages] = useState<string[]>(user?.land_images || []);
  const [documentImages, setDocumentImages] = useState<string[]>(user?.document_images || []);
  const [uploadingLandImg, setUploadingLandImg] = useState(false);
  const [uploadingDocImg, setUploadingDocImg] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // File input refs
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const landImgInputRef = useRef<HTMLInputElement | null>(null);
  const docImgInputRef = useRef<HTMLInputElement | null>(null);

  // Pre-fill user data when loaded
  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.phone) setPhone(user.phone);
      if (user.gender) setGender(user.gender);
      if (user.age) setAge(String(user.age));
      if (user.avatar_url) setAvatarUrl(user.avatar_url);
      if (user.survey_number) setSurveyNumber(user.survey_number);
      if (user.landholding_acres) setLandholding(String(user.landholding_acres));
      if (user.irrigated_acres) setIrrigatedAcres(String(user.irrigated_acres));
      if (user.soil_type) setSoilType(user.soil_type);
      if (user.water_source) setWaterSource(user.water_source);
      if (user.ownership_status) setOwnershipStatus(user.ownership_status);
      if (user.primary_crop) setPrimaryCrop(user.primary_crop);
      if (user.secondary_crops) {
        setSecondaryCropsList(user.secondary_crops.split(',').map((s) => s.trim()).filter(Boolean));
      }
      if (user.farming_type) setFarmingType(user.farming_type);
      if (user.machinery_owned) {
        setMachineryList(user.machinery_owned.split(',').map((s) => s.trim()).filter(Boolean));
      }
      if (user.livestock_details) setLivestockDetails(user.livestock_details);
      if (user.annual_income) setAnnualIncome(String(user.annual_income));
      if (user.caste_category) setCasteCategory(user.caste_category);
      if (user.special_category) setSpecialCategory(user.special_category);
      if (user.aadhaar_dbt_linked !== undefined && user.aadhaar_dbt_linked !== null)
        setAadhaarDbtLinked(user.aadhaar_dbt_linked);
      if (user.pm_kisan_registered !== undefined && user.pm_kisan_registered !== null)
        setPmKisanRegistered(user.pm_kisan_registered);
      if (user.kcc_card_active !== undefined && user.kcc_card_active !== null)
        setKccCardActive(user.kcc_card_active);
      if (user.crop_insurance_active !== undefined && user.crop_insurance_active !== null)
        setCropInsuranceActive(user.crop_insurance_active);
      if (user.soil_health_card_issued !== undefined && user.soil_health_card_issued !== null)
        setSoilHealthCardIssued(user.soil_health_card_issued);
      if (user.bio) setBio(user.bio);
      if (user.state) setState(user.state);
      if (user.district) setDistrict(user.district);
      if (user.village) setVillage(user.village);
      if (user.pincode) setPincode(user.pincode);
      if (user.latitude) setLatitude(user.latitude);
      if (user.longitude) setLongitude(user.longitude);
      if (user.farm_location_name) setFarmLocationName(user.farm_location_name);
      if (user.land_images && user.land_images.length > 0) setLandImages(user.land_images);
      if (user.document_images && user.document_images.length > 0) setDocumentImages(user.document_images);
    }
  }, [user]);

  // Dynamic Real-Time Completeness Score Calculation across all 16 fields
  const completenessPercent = useMemo(() => {
    let filled = 0;
    const totalFields = 16;

    // Step 1 Fields
    if (name && name.trim().length > 1) filled++;
    if (phone && phone.trim().length >= 10) filled++;
    if (gender) filled++;
    if (age && parseInt(age) > 0) filled++;
    if (casteCategory) filled++;
    if (specialCategory) filled++;
    if (annualIncome && parseFloat(annualIncome) > 0) filled++;

    // Step 2 Fields
    if (surveyNumber && surveyNumber.trim().length > 0) filled++;
    if (landholding && parseFloat(landholding) > 0) filled++;
    if (soilType) filled++;
    if (waterSource) filled++;
    if (ownershipStatus) filled++;

    // Step 3 Fields
    if (primaryCrop && primaryCrop.trim().length > 1) filled++;
    if (secondaryCropsList.length > 0 || machineryList.length > 0) filled++;

    // Step 4 Fields
    if (farmLocationName && farmLocationName.trim().length > 1) filled++;
    if (state && district) filled++;

    return Math.min(100, Math.round((filled / totalFields) * 100));
  }, [
    name,
    phone,
    gender,
    age,
    casteCategory,
    specialCategory,
    annualIncome,
    surveyNumber,
    landholding,
    soilType,
    waterSource,
    ownershipStatus,
    primaryCrop,
    secondaryCropsList,
    machineryList,
    farmLocationName,
    state,
    district,
  ]);

  // Handle Location Picked from Map
  const handleLocationPicked = (loc: FarmLocationData) => {
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setFarmLocationName(loc.locationName);

    if (loc.state) setState(loc.state);
    if (loc.district) setDistrict(loc.district);
    if (loc.village) setVillage(loc.village);
    if (loc.pincode) setPincode(loc.pincode);
  };

  // Upload Avatar
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      setError(null);
      const res = await uploadToCloudinary(file, 'farmer_avatars');
      setAvatarUrl(res.secure_url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Avatar upload failed';
      setError(`Profile picture upload failed: ${msg}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Upload Land Images
  const handleLandImgChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingLandImg(true);
      setError(null);
      const uploadPromises = Array.from(files).map((f) =>
        uploadToCloudinary(f, 'farm_parcels')
      );
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map((r) => r.secure_url);
      setLandImages((prev) => [...prev, ...newUrls]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Land image upload failed';
      setError(`Land photo upload failed: ${msg}`);
    } finally {
      setUploadingLandImg(false);
    }
  };

  // Upload Land Record Document Image
  const handleDocImgChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingDocImg(true);
      setError(null);
      const uploadPromises = Array.from(files).map((f) =>
        uploadToCloudinary(f, 'farmer_documents')
      );
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map((r) => r.secure_url);
      setDocumentImages((prev) => [...prev, ...newUrls]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Document upload failed';
      setError(`Document upload failed: ${msg}`);
    } finally {
      setUploadingDocImg(false);
    }
  };

  // Submit Final Profile Update & Mark is_onboarded = true
  const handleSaveAndProceed = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await handleUpdateProfile({
        name,
        phone,
        gender,
        age: parseInt(age) || 42,
        caste_category: casteCategory,
        special_category: specialCategory,
        annual_income: parseFloat(annualIncome) || 180000,
        aadhaar_dbt_linked: aadhaarDbtLinked,
        pm_kisan_registered: pmKisanRegistered,
        kcc_card_active: kccCardActive,
        crop_insurance_active: cropInsuranceActive,
        soil_health_card_issued: soilHealthCardIssued,
        avatar_url: avatarUrl,
        survey_number: surveyNumber,
        landholding_acres: parseFloat(landholding) || 3.5,
        irrigated_acres: parseFloat(irrigatedAcres) || 2.0,
        soil_type: soilType,
        water_source: waterSource,
        ownership_status: ownershipStatus,
        primary_crop: primaryCrop || 'Paddy (Rice)',
        secondary_crops: secondaryCropsList.join(', '),
        farming_type: farmingType,
        machinery_owned: machineryList.join(', '),
        livestock_details: livestockDetails,
        bio,
        land_images: landImages,
        document_images: documentImages,
        state: state || 'Karnataka',
        district: district || 'Mandya',
        village: village || 'Local Village',
        pincode: pincode || '571446',
        latitude,
        longitude,
        farm_location_name: farmLocationName || 'Mandya, Karnataka',
        is_onboarded: true,
      });

      setSuccess(tOnboard.profileSavedSuccess);
      setTimeout(() => {
        router.push('/dashboard');
      }, 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Custom Options Mappings
  const genderOptions: SelectOption[] = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
  ];

  const casteOptions: SelectOption[] = [
    { value: 'General', label: tOnboard.casteGeneral },
    { value: 'OBC', label: tOnboard.casteOBC },
    { value: 'SC', label: tOnboard.casteSC },
    { value: 'ST', label: tOnboard.casteST },
    { value: 'Minorities', label: tOnboard.casteMinority },
  ];

  const specialOptions: SelectOption[] = [
    { value: 'Small / Marginal Farmer', label: tOnboard.specialSmallFarmer },
    { value: 'BPL Card Holder', label: tOnboard.specialBPL },
    { value: 'Woman Head of Household', label: tOnboard.specialWomanHead },
    { value: 'Differently Abled (Divyangjan)', label: tOnboard.specialDivyang },
    { value: 'None', label: tOnboard.specialNone },
  ];

  const soilOptions: SelectOption[] = [
    { value: 'Red Loamy', label: tOnboard.soilRedLoamy },
    { value: 'Black Cotton', label: tOnboard.soilBlackCotton },
    { value: 'Alluvial', label: tOnboard.soilAlluvial },
    { value: 'Laterite', label: tOnboard.soilLaterite },
    { value: 'Sandy Loam', label: tOnboard.soilSandy },
    { value: 'Clay', label: tOnboard.soilClay },
  ];

  const waterOptions: SelectOption[] = [
    { value: 'Borewell & Drip System', label: tOnboard.waterBorewell },
    { value: 'Canal / Lift Irrigation', label: tOnboard.waterCanal },
    { value: 'Solar Water Pump', label: tOnboard.waterSolar },
    { value: 'Open Well', label: tOnboard.waterOpenWell },
    { value: 'Rainfed (Barani)', label: tOnboard.waterRainfed },
    { value: 'River / Stream', label: tOnboard.waterRiver },
  ];

  const ownershipOptions: SelectOption[] = [
    { value: 'Owner Cultivator', label: tOnboard.ownerCultivator },
    { value: 'Tenant Farmer', label: tOnboard.tenantFarmer },
    { value: 'Sharecropper', label: tOnboard.sharecropper },
    { value: 'Joint Family Title', label: tOnboard.jointFamily },
  ];

  const stepsList = [
    { num: 1, label: tOnboard.step1Tab, sub: tOnboard.step1Sub, badge: 'DEMOGRAPHICS' },
    { num: 2, label: tOnboard.step2Tab, sub: tOnboard.step2Sub, badge: 'LAND & SOIL' },
    { num: 3, label: tOnboard.step3Tab, sub: tOnboard.step3Sub, badge: 'AGRICULTURE' },
    { num: 4, label: tOnboard.step4Tab, sub: tOnboard.step4Sub, badge: 'GIS & MEDIA' },
  ];

  return (
    <div className="h-screen max-h-screen w-full bg-white text-foreground flex flex-col overflow-hidden animate-sleek">
      {/* 1. TOP NAVBAR (52px) */}
      <header className="h-13 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between shrink-0 z-50 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="GramSetu"
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Desktop Navbar Stepper Breadcrumbs with very subtle light green */}
        <nav aria-label="Onboarding Progress" className="hidden md:flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
          {stepsList.map((st) => {
            const isActive = activeStep === st.num;
            const isCompleted = activeStep > st.num;
            return (
              <button
                key={st.num}
                type="button"
                onClick={() => setActiveStep(st.num as OnboardingStep)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs font-bold'
                    : isCompleted
                    ? 'text-slate-700 hover:text-slate-900 font-medium'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : isCompleted
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : st.num}
                </span>
                <span>{st.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageDropdown value={language} onChange={setLanguage} />
          {user?.is_onboarded && (
            <Link
              href="/dashboard"
              className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50"
            >
              Dashboard →
            </Link>
          )}
        </div>
      </header>

      {/* MOBILE PROGRESS STEPPER HEADER (< lg) */}
      <div className="lg:hidden bg-slate-50 border-b border-slate-200 px-3 py-2 shrink-0 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            Step {activeStep} of 4: {stepsList[activeStep - 1].label}
          </span>
          <span className="text-[10px] font-semibold text-slate-500 font-mono">
            {completenessPercent}% Complete
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {stepsList.map((st) => (
            <button
              key={st.num}
              type="button"
              onClick={() => setActiveStep(st.num as OnboardingStep)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                activeStep === st.num
                  ? 'bg-emerald-500'
                  : activeStep > st.num
                  ? 'bg-emerald-300'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 2. SPLIT SCREEN WORKSPACE (Non-Scrollable Layout on Desktop & Mobile App Feel) */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden min-h-0">
        {/* ================= LEFT SIDEBAR (Hidden on Mobile, 4 Cols on Desktop) ================= */}
        <aside className="hidden lg:flex lg:col-span-4 border-r border-slate-200 bg-slate-50/50 p-4 sm:p-5 flex-col justify-between overflow-hidden h-full min-h-0">
          <div className="space-y-4">
            {/* Farmer Profile Summary Card */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
              <div className="relative group shrink-0">
                <div className="w-14 h-14 rounded-full border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shadow-xs">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-foreground truncate">{name || 'Citizen Farmer'}</h2>
                  <span className="text-[9px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                    Dossier
                  </span>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground truncate">@{user?.handle || 'citizen'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{village || 'Village'}, {district || 'District'}</p>
              </div>
            </div>

            {/* Step Navigation Tabs with Subtle Pastel Highlighting */}
            <div className="space-y-2">
              {stepsList.map((st) => {
                const isActive = activeStep === st.num;
                const isCompleted = activeStep > st.num;
                return (
                  <button
                    key={st.num}
                    type="button"
                    onClick={() => setActiveStep(st.num as OnboardingStep)}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-200/50 shadow-xs'
                        : isCompleted
                        ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : isCompleted
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isCompleted ? '✓' : st.num}
                      </div>
                      <div className="truncate">
                        <p
                          className={`text-xs font-bold truncate ${
                            isActive
                              ? 'text-slate-900'
                              : isCompleted
                              ? 'text-slate-700'
                              : 'text-slate-400'
                          }`}
                        >
                          {st.label}
                        </p>
                        <p
                          className={`text-[10px] truncate ${
                            isActive ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {st.sub}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ml-1 ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : isCompleted
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-slate-50 text-slate-400'
                      }`}
                    >
                      {st.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Dynamic Completeness & Trust Badge */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                <span className="text-foreground">Profile Completeness</span>
                <span className="text-emerald-700 font-mono font-bold">{completenessPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${completenessPercent}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-xl text-[11px] text-slate-700">
              <p className="font-bold text-slate-800">
                Official Rules Evaluation
              </p>
              <p className="text-slate-500 text-[10px] mt-0.5">
                Deterministic matching against Gazette rules with zero intermediaries.
              </p>
            </div>
          </div>
        </aside>

        {/* ================= RIGHT MAIN WORKSPACE (12 Cols Mobile, 8 Cols Desktop) ================= */}
        <main className="col-span-12 lg:col-span-8 bg-white flex flex-col justify-between p-3.5 sm:p-6 lg:p-7 overflow-hidden h-full min-h-0">
          {/* Header of Active Step */}
          <div className="border-b border-slate-200 pb-2.5 shrink-0 flex items-center justify-between">
            <div>
              <h1 className="text-sm sm:text-base font-black text-foreground tracking-tight">
                {activeStep === 1 && tOnboard.step1Title}
                {activeStep === 2 && tOnboard.step2Title}
                {activeStep === 3 && tOnboard.step3Title}
                {activeStep === 4 && tOnboard.step4Title}
              </h1>
              <p className="text-[11px] text-muted-foreground truncate">
                {activeStep === 1 && tOnboard.step1Desc}
                {activeStep === 2 && tOnboard.step2Desc}
                {activeStep === 3 && tOnboard.step3Desc}
                {activeStep === 4 && tOnboard.step4Desc}
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold tracking-wide shrink-0">
              STEP {activeStep} OF 4 • {stepsList[activeStep - 1].badge}
            </span>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-2 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-xs font-semibold shrink-0 mt-1.5">
              {error}
            </div>
          )}
          {success && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold shrink-0 mt-1.5">
              {success}
            </div>
          )}

          {/* Scrollable Form Viewport */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 sm:pr-2 py-2.5 pb-8 space-y-4">
            {/* ================= STEP 1: IDENTITY & SCHEMES ================= */}
            {activeStep === 1 && (
              <div className="space-y-4 animate-sleek">
                {/* Dedicated Prominent Farmer Profile Picture Upload Box */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border border-slate-200 overflow-hidden bg-white flex items-center justify-center shadow-xs">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Farmer Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg
                          className="w-10 h-10 text-muted-foreground"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      )}
                    </div>
                    {uploadingAvatar && (
                      <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center text-white text-[9px] font-bold">
                        Uploading...
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <div>
                      <h3 className="text-xs font-bold text-foreground">
                        Farmer Profile Photo
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Upload your photo for farmer card identification and scheme passbook.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={uploadingAvatar}
                        onClick={() => avatarInputRef.current?.click()}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-100 transition cursor-pointer shadow-xs"
                      >
                        {uploadingAvatar
                          ? 'Uploading...'
                          : avatarUrl
                          ? 'Change Photo'
                          : 'Upload Photo'}
                      </button>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 transition cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2-Col Grid of Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground block">
                      {tOnboard.fullName}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Gowda"
                      className="input-sleek h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground block">
                      {tOnboard.mobileContact}
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="input-sleek h-9"
                    />
                  </div>

                  <CustomSelect
                    label="Gender"
                    options={genderOptions}
                    value={gender}
                    onChange={setGender}
                  />

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground block">
                      Age (Years)
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="42"
                      className="input-sleek h-9"
                    />
                  </div>

                  <CustomSelect
                    label={tOnboard.casteCategory}
                    options={casteOptions}
                    value={casteCategory}
                    onChange={setCasteCategory}
                  />

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground block">
                      {tOnboard.annualIncome}
                    </label>
                    <input
                      type="number"
                      value={annualIncome}
                      onChange={(e) => setAnnualIncome(e.target.value)}
                      placeholder="180000"
                      className="input-sleek h-9"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <CustomSelect
                      label={tOnboard.specialCategory}
                      options={specialOptions}
                      value={specialCategory}
                      onChange={setSpecialCategory}
                    />
                  </div>
                </div>

                {/* Statutory Schemes & DBT Checklist with Soft Pastel Green */}
                <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-2.5">
                  <div>
                    <span className="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                      Statutory Welfare & DBT Linkage Status
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      Select all verified welfare linkages for automated scheme qualification
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <CustomCheckbox
                      checked={aadhaarDbtLinked}
                      onChange={setAadhaarDbtLinked}
                      label="Aadhaar NPCI DBT Bank Seeded"
                      sublabel="Bank account is active for direct government subsidies"
                    />
                    <CustomCheckbox
                      checked={pmKisanRegistered}
                      onChange={setPmKisanRegistered}
                      label="PM-KISAN Registered"
                      sublabel="Receiving annual central farmer installment"
                    />
                    <CustomCheckbox
                      checked={kccCardActive}
                      onChange={setKccCardActive}
                      label="Kisan Credit Card (KCC)"
                      sublabel="Active crop loan credit facility from bank"
                    />
                    <CustomCheckbox
                      checked={cropInsuranceActive}
                      onChange={setCropInsuranceActive}
                      label="PMFBY Crop Insurance"
                      sublabel="Crops insured against drought & unseasonal rains"
                    />
                    <div className="md:col-span-2">
                      <CustomCheckbox
                        checked={soilHealthCardIssued}
                        onChange={setSoilHealthCardIssued}
                        label="Soil Health Card (SHC) Issued"
                        sublabel="Tested soil NPK micro-nutrient report available for farm land"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 2: LAND & SOIL ================= */}
            {activeStep === 2 && (
              <div className="space-y-4 animate-sleek">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground block">
                      {tOnboard.surveyNumber}
                    </label>
                    <input
                      type="text"
                      required
                      value={surveyNumber}
                      onChange={(e) => setSurveyNumber(e.target.value)}
                      placeholder="e.g. 142/3B"
                      className="input-sleek h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground block">
                      {tOnboard.totalLandholding}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      required
                      value={landholding}
                      onChange={(e) => setLandholding(e.target.value)}
                      placeholder="3.5"
                      className="input-sleek h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground block">
                      {tOnboard.irrigatedArea}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={irrigatedAcres}
                      onChange={(e) => setIrrigatedAcres(e.target.value)}
                      placeholder="2.0"
                      className="input-sleek h-9"
                    />
                  </div>

                  <CustomSelect
                    label={tOnboard.soilType}
                    options={soilOptions}
                    value={soilType}
                    onChange={setSoilType}
                    searchable
                  />

                  <CustomSelect
                    label={tOnboard.waterSource}
                    options={waterOptions}
                    value={waterSource}
                    onChange={setWaterSource}
                    searchable
                  />

                  <CustomSelect
                    label={tOnboard.ownershipStructure}
                    options={ownershipOptions}
                    value={ownershipStatus}
                    onChange={setOwnershipStatus}
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs text-muted-foreground">
                  <p className="font-bold text-slate-800">Agricultural Subsidies Qualification</p>
                  <p className="text-[11px]">
                    Farmers with landholding under 5 Acres qualify as Small & Marginal Farmers for up to 90% subsidy on Drip Irrigation (PMKSY) and Solar Water Pumps (PM-KUSUM).
                  </p>
                </div>
              </div>
            )}

            {/* ================= STEP 3: CROPS & MACHINERY ================= */}
            {activeStep === 3 && (
              <div className="space-y-4 animate-sleek">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <AutoSuggestInput
                    label={tOnboard.primaryCrop}
                    value={primaryCrop}
                    onChange={setPrimaryCrop}
                    suggestions={POPULAR_INDIAN_CROPS}
                    placeholder="Search primary crop e.g. Paddy, Cotton..."
                    required
                  />

                  <AutoSuggestInput
                    label={tOnboard.farmingMethods}
                    value={farmingType}
                    onChange={setFarmingType}
                    suggestions={POPULAR_FARMING_TECHNIQUES}
                    placeholder="e.g. Micro-Drip, Organic Farming..."
                  />

                  <div className="sm:col-span-2">
                    <MultiTagAutoSuggest
                      label="Secondary & Intercrops Grown"
                      sublabel="Search or type custom crop and press Enter"
                      tags={secondaryCropsList}
                      onChange={setSecondaryCropsList}
                      suggestions={POPULAR_INDIAN_CROPS}
                      quickSuggestions={['Ragi (Finger Millet / ರಾಗಿ)', 'Groundnut (ಕಡಲೆಕಾಯಿ / मूंगಫಲಿ)', 'Tur / Arhar Dal (ತೊಗರಿ ಬೇಳೆ / अरहर)', 'Mustard (ಸಾಸಿವೆ / सरसों)', 'Soybean (ಸೋಯಾಬೀನ್ / सोयाबीन)']}
                      placeholder="Type crop name (e.g. Tomato, Ginger) and click + Add..."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <MultiTagAutoSuggest
                      label="Farm Machinery & Equipment Owned"
                      sublabel="Search equipment catalog or type custom machinery"
                      tags={machineryList}
                      onChange={setMachineryList}
                      suggestions={POPULAR_FARM_MACHINERY}
                      quickSuggestions={['Tractor (4WD / 2WD 45HP+)', 'Power Tiller / Rotary Weeder', 'Micro Drip Irrigation System', 'Solar Water Pump (PM-KUSUM)', 'Battery / Boom Power Sprayer']}
                      placeholder="Type equipment (e.g. Rotavator, Drone) and click + Add..."
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-bold text-foreground block">
                      {tOnboard.livestockAssets}
                    </label>
                    <input
                      type="text"
                      value={livestockDetails}
                      onChange={(e) => setLivestockDetails(e.target.value)}
                      placeholder="e.g. 2 Desi Cows, 1 Buffalo, 10 Goats"
                      className="input-sleek h-9"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-bold text-foreground block">
                      {tOnboard.farmerBio}
                    </label>
                    <textarea
                      rows={2}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Brief note about your farming setup..."
                      className="input-sleek h-auto py-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 4: MAP & MEDIA (Spacious, Roomy Map & Detailed Search) ================= */}
            {activeStep === 4 && (
              <div className="space-y-4 animate-sleek">
                {/* Large, Spacious Farm Location Picker Map Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-foreground">{tOnboard.interactiveMapTitle}</span>
                    <span className="text-slate-600 font-mono text-[10px]">
                      {latitude?.toFixed(4)}°N, {longitude?.toFixed(4)}°E
                    </span>
                  </div>

                  <div className="w-full h-[330px] sm:h-[370px] rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-slate-50">
                    <FarmLocationPicker
                      initialLatitude={latitude}
                      initialLongitude={longitude}
                      initialLocationName={farmLocationName}
                      onLocationSelected={handleLocationPicked}
                    />
                  </div>
                </div>

                {/* Auto-Synchronized Address Fields */}
                <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground block">
                      {tOnboard.farmLocationName}
                    </label>
                    <input
                      type="text"
                      required
                      value={farmLocationName}
                      onChange={(e) => setFarmLocationName(e.target.value)}
                      placeholder="e.g. Keragodu, Mandya, Karnataka"
                      className="input-sleek h-9 bg-white text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-foreground block">{tOnboard.state}</label>
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="input-sleek h-8 bg-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-foreground block">{tOnboard.district}</label>
                      <input
                        type="text"
                        required
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="input-sleek h-8 bg-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-foreground block">{tOnboard.village}</label>
                      <input
                        type="text"
                        required
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                        className="input-sleek h-8 bg-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-foreground block">{tOnboard.pincode}</label>
                      <input
                        type="text"
                        required
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="input-sleek h-8 bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Cloudinary Media Upload Rows */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Land Photos */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-foreground">{tOnboard.landPhotosTitle}</h3>
                        <p className="text-[10px] text-muted-foreground">Field and crop pictures</p>
                      </div>
                      <input
                        ref={landImgInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleLandImgChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={uploadingLandImg}
                        onClick={() => landImgInputRef.current?.click()}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 text-slate-800 hover:bg-slate-100 transition cursor-pointer bg-white shadow-xs"
                      >
                        {uploadingLandImg ? tOnboard.uploadingPhoto : tOnboard.addFieldPhotosBtn}
                      </button>
                    </div>

                    {landImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {landImages.map((img, idx) => (
                          <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200 h-16 bg-white">
                            <img src={img} alt="Field" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setLandImages(landImages.filter((_, i) => i !== idx))}
                              className="absolute top-0.5 right-0.5 bg-destructive text-white rounded-full p-0.5 text-[8px]"
                              aria-label="Delete image"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Document Photos */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-foreground">{tOnboard.docPhotoTitle}</h3>
                        <p className="text-[10px] text-muted-foreground">Pahani / RTC / 7-12 photo</p>
                      </div>
                      <input
                        ref={docImgInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleDocImgChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={uploadingDocImg}
                        onClick={() => docImgInputRef.current?.click()}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 text-slate-800 hover:bg-slate-100 transition cursor-pointer bg-white shadow-xs"
                      >
                        {uploadingDocImg ? tOnboard.uploadingPhoto : tOnboard.uploadDocBtn}
                      </button>
                    </div>

                    {documentImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {documentImages.map((img, idx) => (
                          <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200 h-16 bg-white">
                            <img src={img} alt="Document" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setDocumentImages(documentImages.filter((_, i) => i !== idx))}
                              className="absolute top-0.5 right-0.5 bg-destructive text-white rounded-full p-0.5 text-[8px]"
                              aria-label="Delete document"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Footer (Sticky at bottom of card) */}
          <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            {activeStep > 1 ? (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev - 1) as OnboardingStep)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-slate-50 transition cursor-pointer"
              >
                {tOnboard.prevStep}
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {activeStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep((prev) => (prev + 1) as OnboardingStep)}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  {tOnboard.continueToStep} {activeStep + 1} →
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveAndProceed()}
                  className="px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-md cursor-pointer"
                >
                  {saving ? tOnboard.savingProfile : tOnboard.completeAndEnter}
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

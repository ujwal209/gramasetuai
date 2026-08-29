'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { dashboardTranslations } from '@/lib/dashboardTranslations';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { CustomSelect, type SelectOption } from '@/components/ui/CustomSelect';
import { CustomCheckbox } from '@/components/ui/CustomCheckbox';
import { AutoSuggestInput } from '@/components/ui/AutoSuggestInput';
import { MultiTagAutoSuggest } from '@/components/ui/MultiTagAutoSuggest';
import { FarmLocationPicker, type FarmLocationData } from '@/components/FarmLocationPicker';
import {
  POPULAR_INDIAN_CROPS,
  POPULAR_FARM_MACHINERY,
  POPULAR_FARMING_TECHNIQUES,
  fetchIndianLocations,
} from '@/lib/suggestions';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, handleUpdateProfile } = useAuth();
  const { language } = useLanguage();

  const t = dashboardTranslations[language]?.editProfile || dashboardTranslations.en.editProfile;
  const tOnboard = dashboardTranslations[language]?.profile || dashboardTranslations.en.profile;

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
  const [surveyNumber, setSurveyNumber] = useState(user?.survey_number || '142/3B');
  const [landholding, setLandholding] = useState(
    user?.landholding_acres ? String(user.landholding_acres) : '3.5'
  );
  const [irrigatedAcres, setIrrigatedAcres] = useState(
    user?.irrigated_acres ? String(user.irrigated_acres) : '2.0'
  );
  const [soilType, setSoilType] = useState(user?.soil_type || 'Red Loamy');
  const [waterSource, setWaterSource] = useState(user?.water_source || 'Borewell & Drip System');
  const [ownershipStatus, setOwnershipStatus] = useState(user?.ownership_status || 'Owner Cultivator');

  // Step 3: Crops, Livestock & Machinery
  const [primaryCrop, setPrimaryCrop] = useState(user?.primary_crop || 'Paddy (Rice / ಭತ್ತ / धान)');
  const [secondaryCropsList, setSecondaryCropsList] = useState<string[]>(
    user?.secondary_crops ? user.secondary_crops.split(',').map((s) => s.trim()).filter(Boolean) : []
  );
  const [farmingType, setFarmingType] = useState(user?.farming_type || 'Micro-Drip & Fertigation System');
  const [machineryList, setMachineryList] = useState<string[]>(
    user?.machinery_owned ? user.machinery_owned.split(',').map((s) => s.trim()).filter(Boolean) : []
  );
  const [livestockDetails, setLivestockDetails] = useState(user?.livestock_details || '2 Desi Cows, 1 Buffalo');
  const [bio, setBio] = useState(user?.bio || '');

  // Step 4: Map & Media Uploads
  const [state, setState] = useState(user?.state || 'Karnataka');
  const [district, setDistrict] = useState(user?.district || 'Mandya');
  const [village, setVillage] = useState(user?.village || 'Keragodu');
  const [pincode, setPincode] = useState(user?.pincode || '571446');
  const [latitude, setLatitude] = useState<number | undefined>(user?.latitude ?? 12.5244);
  const [longitude, setLongitude] = useState<number | undefined>(user?.longitude ?? 76.8973);
  const [farmLocationName, setFarmLocationName] = useState<string>(
    user?.farm_location_name || 'Mandya Agricultural Basin, Karnataka'
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

  // Save Full Profile
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        primary_crop: primaryCrop,
        secondary_crops: secondaryCropsList.join(', '),
        farming_type: farmingType,
        machinery_owned: machineryList.join(', '),
        livestock_details: livestockDetails,
        bio,
        land_images: landImages,
        document_images: documentImages,
        state,
        district,
        village,
        pincode,
        latitude,
        longitude,
        farm_location_name: farmLocationName,
        is_onboarded: true,
      });

      setSuccess(t.successMessage);
      setTimeout(() => {
        router.push('/dashboard/profile');
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const genderOptions: SelectOption[] = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
  ];

  const casteOptions: SelectOption[] = [
    { value: 'General', label: 'General / Open Merit' },
    { value: 'OBC', label: 'Other Backward Classes (OBC)' },
    { value: 'SC', label: 'Scheduled Castes (SC)' },
    { value: 'ST', label: 'Scheduled Tribes (ST)' },
    { value: 'Minorities', label: 'Religious & Linguistic Minorities' },
  ];

  const specialOptions: SelectOption[] = [
    { value: 'Small / Marginal Farmer', label: 'Small & Marginal Farmer (< 5 Acres)' },
    { value: 'BPL Card Holder', label: 'BPL / Antyodaya Ration Card Holder' },
    { value: 'Woman Head of Household', label: 'Woman Head of Household' },
    { value: 'Differently Abled (Divyangjan)', label: 'Differently Abled (Divyangjan)' },
    { value: 'None', label: 'None / General Cultivator' },
  ];

  const soilOptions: SelectOption[] = [
    { value: 'Red Loamy', label: 'Red Loamy Soil' },
    { value: 'Black Cotton', label: 'Black Cotton Soil (Regur)' },
    { value: 'Alluvial', label: 'Alluvial Soil' },
    { value: 'Laterite', label: 'Laterite Soil' },
    { value: 'Sandy Loam', label: 'Sandy Loam Soil' },
    { value: 'Clay', label: 'Clay Soil' },
  ];

  const waterOptions: SelectOption[] = [
    { value: 'Borewell & Drip System', label: 'Borewell & Drip Irrigation' },
    { value: 'Canal / Lift Irrigation', label: 'Canal / Lift Irrigation' },
    { value: 'Solar Water Pump', label: 'Solar Water Pump (PM-KUSUM)' },
    { value: 'Open Well', label: 'Open Well / Farm Pond' },
    { value: 'Rainfed (Barani)', label: 'Rainfed (Barani Agriculture)' },
    { value: 'River / Stream', label: 'River / Stream Lift' },
  ];

  const ownershipOptions: SelectOption[] = [
    { value: 'Owner Cultivator', label: 'Owner Cultivator' },
    { value: 'Tenant Farmer', label: 'Tenant Farmer' },
    { value: 'Sharecropper', label: 'Sharecropper (Bataidar)' },
    { value: 'Joint Family Title', label: 'Joint Family Title' },
  ];

  return (
    <div className="space-y-6 text-left animate-sleek max-w-6xl mx-auto pb-12">
      {/* 1. TOP HEADER WITH BACK LINK */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <Link
            href="/dashboard/profile"
            className="text-xs font-bold text-slate-500 hover:text-slate-900 transition flex items-center gap-1.5 mb-1"
          >
            {t.backBtn}
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.title}
          </h1>
          <p className="text-xs text-slate-500">{t.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/profile"
            className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
          >
            {t.cancelBtn}
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {saving ? t.saving : t.saveBtn}
          </button>
        </div>
      </div>

      {/* FEEDBACK ALERTS */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-xs font-semibold">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold">
          {success}
        </div>
      )}

      {/* 2. FORM BODY */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture Uploader */}
        <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Farmer Avatar & Photo</h2>

          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-full border-2 border-emerald-300 overflow-hidden bg-white flex items-center justify-center shadow-xs">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
                <p className="text-xs font-bold text-slate-900">Profile Picture</p>
                <p className="text-[11px] text-slate-500">Upload portrait photo for citizen identity cards.</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
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
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 transition cursor-pointer shadow-xs"
                >
                  {avatarUrl ? 'Change Photo' : 'Upload Photo'}
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
        </div>

        {/* Section 1: Demographics */}
        <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">{tOnboard.personalTitle}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground block">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-sleek h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground block">Mobile / WhatsApp</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
              <label className="text-[11px] font-bold text-foreground block">Age (Years)</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="input-sleek h-9"
              />
            </div>

            <CustomSelect
              label="Social Category"
              options={casteOptions}
              value={casteCategory}
              onChange={setCasteCategory}
            />

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground block">Annual Income (₹)</label>
              <input
                type="number"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(e.target.value)}
                className="input-sleek h-9"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <CustomSelect
                label="Special Welfare Category"
                options={specialOptions}
                value={specialCategory}
                onChange={setSpecialCategory}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Statutory Welfare Checkboxes */}
        <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">{tOnboard.dbtTitle}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <CustomCheckbox
              checked={aadhaarDbtLinked}
              onChange={setAadhaarDbtLinked}
              label="Aadhaar NPCI DBT Bank Seeded"
              sublabel="Active for direct central & state bank subsidies"
            />
            <CustomCheckbox
              checked={pmKisanRegistered}
              onChange={setPmKisanRegistered}
              label="PM-KISAN Samman Nidhi Registered"
              sublabel="Receiving annual ₹6,000 direct installments"
            />
            <CustomCheckbox
              checked={kccCardActive}
              onChange={setKccCardActive}
              label="Kisan Credit Card (KCC)"
              sublabel="Active crop loan credit facility with bank"
            />
            <CustomCheckbox
              checked={cropInsuranceActive}
              onChange={setCropInsuranceActive}
              label="PMFBY Crop Insurance"
              sublabel="Enrolled in seasonal crop insurance policy"
            />
            <div className="md:col-span-2">
              <CustomCheckbox
                checked={soilHealthCardIssued}
                onChange={setSoilHealthCardIssued}
                label="Soil Health Card (SHC) Issued"
                sublabel="Tested soil NPK micro-nutrient report available"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Land & Soil */}
        <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">{tOnboard.landTitle}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground block">Survey / Khasra Number</label>
              <input
                type="text"
                required
                value={surveyNumber}
                onChange={(e) => setSurveyNumber(e.target.value)}
                className="input-sleek h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground block">Total Landholding (Acres)</label>
              <input
                type="number"
                step="0.1"
                required
                value={landholding}
                onChange={(e) => setLandholding(e.target.value)}
                className="input-sleek h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground block">Irrigated Area (Acres)</label>
              <input
                type="number"
                step="0.1"
                value={irrigatedAcres}
                onChange={(e) => setIrrigatedAcres(e.target.value)}
                className="input-sleek h-9"
              />
            </div>

            <CustomSelect
              label="Soil Classification"
              options={soilOptions}
              value={soilType}
              onChange={setSoilType}
              searchable
            />

            <CustomSelect
              label="Water & Irrigation Source"
              options={waterOptions}
              value={waterSource}
              onChange={setWaterSource}
              searchable
            />

            <CustomSelect
              label="Land Ownership Structure"
              options={ownershipOptions}
              value={ownershipStatus}
              onChange={setOwnershipStatus}
            />
          </div>
        </div>

        {/* Section 4: Crops, Machinery & Livestock */}
        <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">{tOnboard.cropsTitle}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AutoSuggestInput
              label="Primary Kharif Crop"
              value={primaryCrop}
              onChange={setPrimaryCrop}
              suggestions={POPULAR_INDIAN_CROPS}
              required
            />

            <AutoSuggestInput
              label="Farming Techniques & Methodology"
              value={farmingType}
              onChange={setFarmingType}
              suggestions={POPULAR_FARMING_TECHNIQUES}
            />

            <div className="sm:col-span-2">
              <MultiTagAutoSuggest
                label="Secondary & Intercrops Grown"
                sublabel="Type custom crop or select from suggestions"
                tags={secondaryCropsList}
                onChange={setSecondaryCropsList}
                suggestions={POPULAR_INDIAN_CROPS}
                quickSuggestions={['Ragi (Finger Millet / ರಾಗಿ)', 'Groundnut (ಕಡಲೆಕಾಯಿ / मूंगಫಲಿ)', 'Tur / Arhar Dal (ತೊಗರಿ ಬೇಳೆ / अरहर)', 'Mustard (ಸಾಸಿವೆ / सरसों)']}
                placeholder="Type crop name and click + Add..."
              />
            </div>

            <div className="sm:col-span-2">
              <MultiTagAutoSuggest
                label="Farm Machinery & Equipment Owned"
                sublabel="Type custom machinery or select from suggestions"
                tags={machineryList}
                onChange={setMachineryList}
                suggestions={POPULAR_FARM_MACHINERY}
                quickSuggestions={['Tractor (4WD / 2WD 45HP+)', 'Power Tiller / Rotary Weeder', 'Micro Drip Irrigation System', 'Solar Water Pump (PM-KUSUM)']}
                placeholder="Type equipment name and click + Add..."
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-foreground block">Livestock & Dairy Assets</label>
              <input
                type="text"
                value={livestockDetails}
                onChange={(e) => setLivestockDetails(e.target.value)}
                className="input-sleek h-9"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-foreground block">Farmer Bio & Setup Notes</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="input-sleek h-auto py-2"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Cadastral GPS Map & Address */}
        <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">{tOnboard.mapTitle}</h2>

          <div className="space-y-3">
            <div className="w-full h-[320px] rounded-xl overflow-hidden border border-slate-200 shadow-xs">
              <FarmLocationPicker
                initialLatitude={latitude}
                initialLongitude={longitude}
                initialLocationName={farmLocationName}
                onLocationSelected={handleLocationPicked}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
              <div className="lg:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-foreground block">Farm Location Name</label>
                <input
                  type="text"
                  required
                  value={farmLocationName}
                  onChange={(e) => setFarmLocationName(e.target.value)}
                  className="input-sleek h-8 bg-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-foreground block">State</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="input-sleek h-8 bg-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-foreground block">District</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="input-sleek h-8 bg-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-foreground block">Village</label>
                <input
                  type="text"
                  required
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="input-sleek h-8 bg-white text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Land & Document Photos */}
        <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">{tOnboard.mediaTitle}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Field Photos */}
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Field & Crop Pictures</p>
                  <p className="text-[10px] text-slate-500">Upload parcel photos</p>
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
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 text-slate-800 hover:bg-slate-100 transition cursor-pointer bg-white"
                >
                  {uploadingLandImg ? 'Uploading...' : '+ Add Field Photos'}
                </button>
              </div>

              {landImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {landImages.map((img, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200 h-16 bg-white">
                      <img src={img} alt="Field" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setLandImages(landImages.filter((_, i) => i !== idx))}
                        className="absolute top-0.5 right-0.5 bg-destructive text-white rounded-full p-0.5 text-[8px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Document Photos */}
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Pahani / RTC / 7-12 Scans</p>
                  <p className="text-[10px] text-slate-500">Upload land documents</p>
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
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 text-slate-800 hover:bg-slate-100 transition cursor-pointer bg-white"
                >
                  {uploadingDocImg ? 'Uploading...' : '+ Add Documents'}
                </button>
              </div>

              {documentImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {documentImages.map((img, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200 h-16 bg-white">
                      <img src={img} alt="Document" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setDocumentImages(documentImages.filter((_, i) => i !== idx))}
                        className="absolute top-0.5 right-0.5 bg-destructive text-white rounded-full p-0.5 text-[8px]"
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

        {/* BOTTOM ACTION BAR */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Link
            href="/dashboard/profile"
            className="px-5 py-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
          >
            {t.cancelBtn}
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-md cursor-pointer disabled:opacity-50"
          >
            {saving ? t.saving : t.saveBtn}
          </button>
        </div>
      </form>
    </div>
  );
}

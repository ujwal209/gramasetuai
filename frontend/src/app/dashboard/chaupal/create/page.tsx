'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { createChaupalPost, createChaupalStory, createChaupalMarketplaceItem } from '@/services/api';
import { ChaupalBottomNav } from '@/components/ChaupalBottomNav';
import { CustomDropdown } from '@/components/CustomDropdown';
import { CustomDatePicker } from '@/components/CustomDatePicker';

export default function ChaupalCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Active Tab: 'post' | 'marketplace' | 'story'
  const [activeTab, setActiveTab] = useState<'post' | 'marketplace' | 'story'>('post');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'marketplace' || tabParam === 'story' || tabParam === 'post') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Media files & preview
  const [stagedFiles, setStagedFiles] = useState<Array<{ file: File; previewUrl: string; id: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form Fields for Post (Extended)
  const [postCaption, setPostCaption] = useState('');
  const [postTopic, setPostTopic] = useState('Harvest & Yield Report');
  const [postCropTag, setPostCropTag] = useState('Sugarcane');
  const [postFarmingStage, setPostFarmingStage] = useState('Harvesting & Threshing');
  const [postFarmingPractice, setPostFarmingPractice] = useState('Natural & Organic (Desi Cow / ZBNF)');
  const [postObservedYield, setPostObservedYield] = useState('');
  const [postLocation, setPostLocation] = useState(
    user?.village ? `${user.village}, ${user.district || 'Karnataka'}` : 'Mandya, Karnataka'
  );

  // Form Fields for Marketplace Listing (Extended)
  const [mktTitle, setMktTitle] = useState('');
  const [mktCategory, setMktCategory] = useState('Crops & Grains');
  const [mktVariety, setMktVariety] = useState('');
  const [mktGrade, setMktGrade] = useState('Grade A Standard APMC Mandi Grade');
  const [mktPrice, setMktPrice] = useState('');
  const [mktUnit, setMktUnit] = useState('Quintal');
  const [mktQuantity, setMktQuantity] = useState('');
  const [mktMinOrder, setMktMinOrder] = useState('1 Unit');
  const [mktMoisture, setMktMoisture] = useState('');
  const [mktPackaging, setMktPackaging] = useState('50kg Jute Bags');
  const [mktDeliveryMode, setMktDeliveryMode] = useState('Farm Gate Pickup (Buyer arranges transport)');
  const [mktNegotiation, setMktNegotiation] = useState('Negotiable / Mandi Spot Rate');
  const [mktPaymentTerms, setMktPaymentTerms] = useState('Instant UPI / Bank Transfer');
  const [mktHarvestDate, setMktHarvestDate] = useState(new Date().toISOString().split('T')[0]);
  const [mktPhone, setMktPhone] = useState(user?.phone || '+91 98450 12345');
  const [mktDescription, setMktDescription] = useState('');
  const [mktOrganic, setMktOrganic] = useState(false);

  // Loading & Error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newItems = Array.from(e.target.files).map((f) => ({
        file: f,
        previewUrl: URL.createObjectURL(f),
        id: Math.random().toString(36).substring(2),
      }));
      if (activeTab === 'story') {
        setStagedFiles([newItems[0]]);
      } else {
        setStagedFiles((prev) => [...prev, ...newItems]);
      }
    }
  };

  const removeFile = (id: string) => {
    setStagedFiles((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (stagedFiles.length === 0 && activeTab !== 'post') {
      setErrorMsg('Please select at least one photo.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload media to Cloudinary
      const uploadedUrls: string[] = [];
      for (const item of stagedFiles) {
        const uploadRes = await uploadToCloudinary(item.file, 'chaupal_media');
        uploadedUrls.push(uploadRes.secure_url);
      }

      const defaultAvatar = user?.avatar_url || '/logo.png';
      const authorName = user?.name || 'Citizen Farmer';
      const authorHandle = user?.handle || 'citizen_farmer';
      const villageStr = `${user?.village || 'Mandya'}, ${user?.district || 'Karnataka'}`;

      if (activeTab === 'post') {
        if (!postCaption && uploadedUrls.length === 0) {
          setErrorMsg('Please write a caption or select a photo.');
          setIsSubmitting(false);
          return;
        }

        await createChaupalPost({
          caption: postCaption,
          media_urls: uploadedUrls,
          topic: postTopic,
          crop_tag: postCropTag,
          farming_stage: postFarmingStage,
          farming_practice: postFarmingPractice,
          observed_yield: postObservedYield,
          location: postLocation,
          name: authorName,
          username: authorHandle,
          avatar_url: defaultAvatar,
          village: villageStr,
        });

        router.push('/dashboard/chaupal');
      } else if (activeTab === 'story') {
        if (uploadedUrls.length === 0) {
          setErrorMsg('Story requires an image.');
          setIsSubmitting(false);
          return;
        }

        await createChaupalStory({
          media_url: uploadedUrls[0],
          caption: postCaption,
          name: authorName,
          username: authorHandle,
          avatar_url: defaultAvatar,
          village: villageStr,
        });

        router.push('/dashboard/chaupal');
      } else if (activeTab === 'marketplace') {
        if (!mktTitle || !mktPrice) {
          setErrorMsg('Please provide product title and price.');
          setIsSubmitting(false);
          return;
        }

        await createChaupalMarketplaceItem({
          title: mktTitle,
          category: mktCategory,
          price: parseFloat(mktPrice),
          unit: mktUnit,
          quantity_available: mktQuantity || '1 Lot',
          min_order: mktMinOrder,
          variety: mktVariety,
          grade: mktGrade,
          moisture_content: mktMoisture,
          packaging_type: mktPackaging,
          delivery_mode: mktDeliveryMode,
          negotiation_terms: mktNegotiation,
          payment_terms: mktPaymentTerms,
          harvest_date: mktHarvestDate,
          location: postLocation,
          phone: mktPhone,
          description: mktDescription,
          images: uploadedUrls.length > 0 ? uploadedUrls : ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80'],
          organic_certified: mktOrganic,
          name: authorName,
          username: authorHandle,
          avatar_url: defaultAvatar,
          village: villageStr,
        });

        router.push('/dashboard/chaupal/marketplace');
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setErrorMsg(err?.message || 'Failed to publish. Please check your photos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cropCategories = [
    'Sugarcane',
    'Paddy / Rice',
    'Tomato',
    'Cotton',
    'Turmeric',
    'Maize',
    'Wheat',
    'Banana',
    'Arecanut',
    'Coconut',
    'Dairy & Cattle',
    'Horticulture',
    'Solar Energy',
    'Other',
  ];

  const postTopics = [
    'Harvest & Yield Report',
    'Pest, Disease & Weed Remedy',
    'Mandi Rates & Market Advice',
    'Irrigation & Water Conservation',
    'Fertilizer & Soil Health',
    'Organic Farming Experience',
    'Govt Scheme / Subsidy Query',
    'Farm Machinery & Tools',
    'General Farming Discussion',
  ];

  const farmingStages = [
    'Land Preparation & Soil Tillage',
    'Sowing / Nursery & Transplantation',
    'Vegetative Growth & Weeding',
    'Flowering & Pod / Fruit Setting',
    'Harvesting & Threshing',
    'Post-Harvest Storage & APMC Transport',
  ];

  const farmingPractices = [
    'Natural & Organic (Desi Cow / ZBNF)',
    'Micro-Drip Fertigation',
    'Integrated Pest Management (IPM)',
    'Polyhouse / High-Tech Farming',
    'Rainfed / Conventional Farming',
  ];

  const marketCategories = [
    'Crops & Grains',
    'Fruits & Vegetables',
    'Commercial & Cash Crops',
    'Livestock & Dairy',
    'Farm Machinery & Rental',
    'Seeds, Fertilizers & Bio-Inputs',
    'Farm Land & Polyhouse Lease',
  ];

  const qualityGrades = [
    'Grade A+ Premium / Export Quality',
    'Grade A Standard APMC Mandi Grade',
    'Grade B Fair Average Quality (FAQ)',
    'Organic / PGS-India Certified',
    'Fresh Harvest (Harvested < 24 hrs)',
    'Sun-Dried / Moisture Tested',
  ];

  const units = ['Quintal', 'Kg', 'Ton', 'Crate (25kg)', '50kg Bag', 'Animal / Head', 'Hour (Rental)', 'Day', 'Acre'];

  const packagingTypes = [
    '50kg Jute Bags',
    'Corrugated Boxes',
    'Plastic Crates',
    'Woven PP Bags',
    'Loose Bulk Load / Tractor Trolley',
    'Customized Packaging Available',
  ];

  const deliveryModes = [
    'Farm Gate Pickup (Buyer arranges transport)',
    'Farmer Arranged Local Delivery (Within 50km)',
    'Statewide Mandi Freight Available',
    'All-India Transport Assistance',
  ];

  const negotiationOptions = [
    'Fixed Price (Non-negotiable)',
    'Negotiable / Mandi Spot Rate',
    'Bulk Volume Discount on > 50 Quintals',
    'Seasonal Contract Farming Rate',
  ];

  const paymentTermsOptions = [
    'Instant UPI / Bank Transfer',
    'Cash on Gate Delivery & Weighment',
    '50% Advance + 50% on Dispatch',
    'Mandi Escrow Trade',
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-left pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <Link href="/dashboard/chaupal" className="text-xs text-slate-500 hover:text-slate-900 font-mono">
            ← Back to Kisan Chaupal Feed
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Publish to Farmer Community
          </h1>
        </div>

        <Link
          href="/dashboard/chaupal/marketplace"
          className="text-xs font-bold text-emerald-700 hover:underline"
        >
          View Marketplace Bazar →
        </Link>
      </div>

      {/* INLINE TOP SELECTION CARDS (ZERO MODALS) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Choice 1: Community Post */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('post');
            setStagedFiles([]);
          }}
          className={`p-4 rounded-2xl border-2 text-left transition flex items-start gap-3 cursor-pointer ${
            activeTab === 'post'
              ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-400 text-slate-800'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${activeTab === 'post' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-bold block">Kisan Community Post</span>
            <span className={`text-[11px] block ${activeTab === 'post' ? 'text-slate-300' : 'text-slate-500'}`}>
              Share harvest, advice &amp; ask queries
            </span>
          </div>
        </button>

        {/* Choice 2: Marketplace Listing */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('marketplace');
            setStagedFiles([]);
          }}
          className={`p-4 rounded-2xl border-2 text-left transition flex items-start gap-3 cursor-pointer ${
            activeTab === 'marketplace'
              ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-400 text-slate-800'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${activeTab === 'marketplace' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-bold block">Sell on Marketplace</span>
            <span className={`text-[11px] block ${activeTab === 'marketplace' ? 'text-slate-300' : 'text-slate-500'}`}>
              List crops, cattle, seeds or equipment
            </span>
          </div>
        </button>

        {/* Choice 3: 24h Story */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('story');
            setStagedFiles([]);
          }}
          className={`p-4 rounded-2xl border-2 text-left transition flex items-start gap-3 cursor-pointer ${
            activeTab === 'story'
              ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-400 text-slate-800'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${activeTab === 'story' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-bold block">24h Field Story</span>
            <span className={`text-[11px] block ${activeTab === 'story' ? 'text-slate-300' : 'text-slate-500'}`}>
              Photo update that vanishes after 24h
            </span>
          </div>
        </button>
      </div>

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-6">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        {/* Media Dropzone */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider font-mono text-slate-600">
            {activeTab === 'story' ? 'Select Story Photo' : 'Upload Photos / Field Media'}
          </label>

          {stagedFiles.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100/70 transition flex flex-col items-center justify-center text-center space-y-2 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-xs font-bold text-slate-800">
                Click to browse or drag and drop photos
              </p>
              <p className="text-[11px] text-slate-400">
                PNG, JPG, JPEG, WebP up to 15MB each
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {stagedFiles.map((item) => (
                  <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                    <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(item.id)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-black text-white text-xs flex items-center justify-center cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {activeTab !== 'story' && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  + Add More Photos
                </button>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple={activeTab !== 'story'}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Form Fields: Feed Post & Story */}
        {(activeTab === 'post' || activeTab === 'story') && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-500">
                Caption &amp; Agricultural Field Observations *
              </label>
              <textarea
                rows={4}
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
                placeholder="Describe your harvest yield, irrigation setup, pest control remedy, or APMC mandi price tips..."
                className="w-full p-3.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-800 transition"
              />
            </div>

            {activeTab === 'post' && (
              <div className="space-y-4">
                {/* Topic & Crop Category Custom Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CustomDropdown
                    label="Discussion Topic / Category"
                    value={postTopic}
                    onChange={setPostTopic}
                    options={postTopics}
                  />

                  <CustomDropdown
                    label="Primary Crop / Farming Domain"
                    value={postCropTag}
                    onChange={setPostCropTag}
                    options={cropCategories}
                  />
                </div>

                {/* Cultivation Stage & Farming Practice Custom Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CustomDropdown
                    label="Stage of Cultivation"
                    value={postFarmingStage}
                    onChange={setPostFarmingStage}
                    options={farmingStages}
                  />

                  <CustomDropdown
                    label="Farming Method / Practice"
                    value={postFarmingPractice}
                    onChange={setPostFarmingPractice}
                    options={farmingPractices}
                  />
                </div>

                {/* Observed Yield & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-500">
                      Estimated / Observed Yield
                    </label>
                    <input
                      type="text"
                      value={postObservedYield}
                      onChange={(e) => setPostObservedYield(e.target.value)}
                      placeholder="e.g. 42 Quintals / Acre or 30 Tons"
                      className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-500">
                      Farm / Village Location
                    </label>
                    <input
                      type="text"
                      value={postLocation}
                      onChange={(e) => setPostLocation(e.target.value)}
                      placeholder="e.g. Mandya APMC Hub, Karnataka"
                      className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form Fields: Extended Marketplace Listing */}
        {activeTab === 'marketplace' && (
          <div className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-500">
                Produce / Listing Title *
              </label>
              <input
                type="text"
                value={mktTitle}
                onChange={(e) => setMktTitle(e.target.value)}
                placeholder="e.g. Organic Sona Masoori Paddy (50 Quintals) or 45HP Tractor Rental"
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-800"
                required
              />
            </div>

            {/* Category & Variety Custom Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomDropdown
                label="Produce Category *"
                value={mktCategory}
                onChange={setMktCategory}
                options={marketCategories}
              />

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-500">
                  Variety / Seed Hybrid Name
                </label>
                <input
                  type="text"
                  value={mktVariety}
                  onChange={(e) => setMktVariety(e.target.value)}
                  placeholder="e.g. Sona Masoori, BPT 5204, G9, Sharbati"
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-800"
                />
              </div>
            </div>

            {/* Quality Grade Custom Dropdown & Custom Calendar DatePicker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomDropdown
                label="Quality Grade Standard"
                value={mktGrade}
                onChange={setMktGrade}
                options={qualityGrades}
              />

              <CustomDatePicker
                label="Available From / Harvest Date"
                value={mktHarvestDate}
                onChange={setMktHarvestDate}
              />
            </div>

            {/* Price, Unit Custom Dropdown, and Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-500">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  value={mktPrice}
                  onChange={(e) => setMktPrice(e.target.value)}
                  placeholder="2450"
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  required
                />
              </div>

              <CustomDropdown
                label="Per Unit"
                value={mktUnit}
                onChange={setMktUnit}
                options={units}
              />

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-500">
                  Total Stock Available
                </label>
                <input
                  type="text"
                  value={mktQuantity}
                  onChange={(e) => setMktQuantity(e.target.value)}
                  placeholder="e.g. 100 Quintals"
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            {/* Moisture Content & Packaging Custom Dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-500">
                  Moisture Content %
                </label>
                <input
                  type="text"
                  value={mktMoisture}
                  onChange={(e) => setMktMoisture(e.target.value)}
                  placeholder="e.g. 11% - 13% Moisture"
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <CustomDropdown
                label="Packaging Type"
                value={mktPackaging}
                onChange={setMktPackaging}
                options={packagingTypes}
              />
            </div>

            {/* Delivery Mode Custom Dropdown & Minimum Order */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomDropdown
                label="Delivery &amp; Logistics Mode"
                value={mktDeliveryMode}
                onChange={setMktDeliveryMode}
                options={deliveryModes}
              />

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-500">
                  Minimum Order Quantity
                </label>
                <input
                  type="text"
                  value={mktMinOrder}
                  onChange={(e) => setMktMinOrder(e.target.value)}
                  placeholder="e.g. 5 Quintals or 1 Unit"
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            {/* Negotiation Terms & Payment Terms Custom Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomDropdown
                label="Pricing &amp; Negotiation Mode"
                value={mktNegotiation}
                onChange={setMktNegotiation}
                options={negotiationOptions}
              />

              <CustomDropdown
                label="Accepted Payment Terms"
                value={mktPaymentTerms}
                onChange={setMktPaymentTerms}
                options={paymentTermsOptions}
              />
            </div>

            {/* Contact Phone & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-500">
                  Contact Phone / WhatsApp *
                </label>
                <input
                  type="text"
                  value={mktPhone}
                  onChange={(e) => setMktPhone(e.target.value)}
                  placeholder="+91 98450 12345"
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-500">
                  Mandi Hub / Village Location
                </label>
                <input
                  type="text"
                  value={postLocation}
                  onChange={(e) => setPostLocation(e.target.value)}
                  placeholder="e.g. Mandya APMC Yard, Karnataka"
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            {/* Detailed Description */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-500">
                Detailed Quality Specs &amp; Farming Notes
              </label>
              <textarea
                rows={3}
                value={mktDescription}
                onChange={(e) => setMktDescription(e.target.value)}
                placeholder="Mention crop quality, oil content, color, foreign matter %, machine hours, or delivery schedule..."
                className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            {/* Organic Certification Checkbox */}
            <label className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 cursor-pointer">
              <input
                type="checkbox"
                checked={mktOrganic}
                onChange={(e) => setMktOrganic(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span className="text-xs font-bold text-emerald-900">
                Certified Chemical-Free / Organic Produce (PKVY / PGS-India)
              </span>
            </label>
          </div>
        )}

        {/* Submit Action */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            {stagedFiles.length} photo{stagedFiles.length !== 1 ? 's' : ''} selected
          </span>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 px-8 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Publishing update...</span>
              </>
            ) : (
              <span>
                {activeTab === 'post'
                  ? 'Publish Feed Post →'
                  : activeTab === 'story'
                  ? 'Publish 24h Story →'
                  : 'List on Krishi Marketplace →'}
              </span>
            )}
          </button>
        </div>
      </form>

      {/* Instagram-Style Bottom Navigation Bar */}
      <ChaupalBottomNav />
    </div>
  );
}

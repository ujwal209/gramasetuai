'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { createChaupalPost } from '@/services/api';
import { ChaupalBottomNav } from '@/components/ChaupalBottomNav';
import { CustomDropdown } from '@/components/CustomDropdown';

export default function NewPostPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [caption, setCaption] = useState('');
  const [topic, setTopic] = useState('Harvest & Yield Report');
  const [cropTag, setCropTag] = useState('Sugarcane');
  const [farmingStage, setFarmingStage] = useState('Harvesting & Threshing');
  const [farmingPractice, setFarmingPractice] = useState('Natural & Organic (Desi Cow / ZBNF)');
  const [observedYield, setObservedYield] = useState('');
  const [location, setLocation] = useState(
    user?.village ? `${user.village}, ${user.district || 'Karnataka'}` : 'Mandya, Karnataka'
  );

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const updatedFiles = [...selectedFiles, ...newFiles].slice(0, 4);
      setSelectedFiles(updatedFiles);
      setPreviewUrls(updatedFiles.map((file) => URL.createObjectURL(file)));
    }
  };

  const handleRemovePhoto = (index: number) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    setPreviewUrls(updated.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() && selectedFiles.length === 0) {
      setErrorMsg('Please enter a caption or attach at least one photo.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Upload photos in background
      const uploadedMediaUrls: string[] = [];
      for (const file of selectedFiles) {
        const uploadRes = await uploadToCloudinary(file, 'chaupal_feed_media');
        uploadedMediaUrls.push(uploadRes.secure_url);
      }

      await createChaupalPost({
        caption: caption.trim(),
        media_urls: uploadedMediaUrls,
        topic: topic,
        crop_tag: cropTag,
        farming_stage: farmingStage,
        farming_practice: farmingPractice,
        observed_yield: observedYield.trim(),
        location: location.trim(),
        user_id: user?.name || 'citizen_farmer',
        username: user?.handle || 'citizen_farmer',
        name: user?.name || 'Citizen Farmer',
        avatar_url: user?.avatar_url || '/logo.png',
        village: location.trim(),
      });

      router.push('/dashboard/chaupal');
    } catch (err: any) {
      console.error('Post creation failed:', err);
      setErrorMsg('Failed to publish post. Please verify your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
    'PM-KUSUM Solar',
    'General Agriculture',
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

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left pb-24">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Create Kisan Community Post
          </h1>
          <p className="text-xs text-slate-500">
            Share crop updates, harvest yield reports, pest remedies, or field questions with all farmers.
          </p>
        </div>
        <Link
          href="/dashboard/chaupal"
          className="text-xs font-bold text-slate-500 hover:text-slate-900 font-mono"
        >
          Cancel
        </Link>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        {/* Caption */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider font-mono text-slate-600">
            Post Caption &amp; Field Observations *
          </label>
          <textarea
            rows={4}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What's happening on your farm today? Share yield numbers, pest management tips, weather observations, or ask questions to fellow farmers. Use #hashtags..."
            className="w-full p-4 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:border-slate-900 transition leading-relaxed resize-none bg-slate-50 focus:bg-white"
          />
        </div>

        {/* Topic & Crop Category Custom Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CustomDropdown
            label="Discussion Topic / Category"
            value={topic}
            onChange={setTopic}
            options={postTopics}
          />

          <CustomDropdown
            label="Primary Crop / Farming Domain"
            value={cropTag}
            onChange={setCropTag}
            options={cropCategories}
          />
        </div>

        {/* Cultivation Stage & Farming Practice Custom Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CustomDropdown
            label="Stage of Cultivation"
            value={farmingStage}
            onChange={setFarmingStage}
            options={farmingStages}
          />

          <CustomDropdown
            label="Farming Method / Practice"
            value={farmingPractice}
            onChange={setFarmingPractice}
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
              value={observedYield}
              onChange={(e) => setObservedYield(e.target.value)}
              placeholder="e.g. 42 Quintals / Acre or 30 Tons"
              className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-500">
              Farm / Village Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Mandya APMC Hub, Karnataka"
              className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900 transition"
            />
          </div>
        </div>

        {/* Media Upload Area */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold uppercase tracking-wider font-mono text-slate-600">
            Photos / Field Images (Up to 4)
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {previewUrls.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-slate-800 rounded-2xl p-8 text-center cursor-pointer transition bg-slate-50/50 hover:bg-slate-50 group space-y-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-500 shadow-2xs group-hover:scale-105 transition">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Click to select crop or farm photos from your device
                </p>
                <p className="text-[11px] text-slate-400">PNG, JPG, JPEG, WebP up to 15MB each</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 shadow-2xs group">
                    <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white text-xs font-bold flex items-center justify-center hover:bg-rose-600 transition cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {previewUrls.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  + Add more photos
                </button>
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            {selectedFiles.length} photo{selectedFiles.length !== 1 ? 's' : ''} attached
          </span>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/chaupal"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Discard
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-7 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Publishing update...</span>
                </>
              ) : (
                <span>Publish Post →</span>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Instagram Bottom Nav */}
      <ChaupalBottomNav />
    </div>
  );
}

'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { createChaupalStory } from '@/services/api';
import { ChaupalBottomNav } from '@/components/ChaupalBottomNav';

export default function NewStoryPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [storyPreview, setStoryPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setStoryFile(file);
      setStoryPreview(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyFile) {
      setErrorMsg('Please select a photo for your story.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const uploadRes = await uploadToCloudinary(storyFile, 'chaupal_stories');

      await createChaupalStory({
        media_url: uploadRes.secure_url,
        caption: caption.trim(),
        user_id: user?.name || 'citizen_farmer',
        username: user?.handle || 'citizen_farmer',
        name: user?.name || 'Citizen Farmer',
        avatar_url: user?.avatar_url || '/logo.png',
        village: `${user?.village || 'Karnataka'}, India`,
      });

      router.push('/dashboard/chaupal');
    } catch (err) {
      console.error('Story upload failed:', err);
      setErrorMsg('Failed to publish story. Please check your image file and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 text-left pb-24">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Add 24h Story
          </h1>
          <p className="text-xs text-slate-500">
            Share quick snapshots of your field, daily weather, or mandi activity. Visible for 24 hours.
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Photo Selection Preview */}
        {!storyPreview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-slate-800 rounded-3xl aspect-4/3 flex flex-col items-center justify-center p-8 text-center cursor-pointer transition bg-slate-50/50 hover:bg-slate-50 space-y-3 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs group-hover:scale-105 transition">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Click to select a photo for your story
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Vertical aspect ratio recommended</p>
            </div>
          </div>
        ) : (
          <div className="relative aspect-4/3 sm:aspect-9/16 max-h-[460px] rounded-3xl overflow-hidden bg-slate-900 mx-auto shadow-md">
            <img src={storyPreview} alt="Story preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => {
                setStoryFile(null);
                setStoryPreview(null);
              }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white text-xs font-bold flex items-center justify-center hover:bg-rose-600 transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Story Caption */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider font-mono text-slate-600">
            Story Caption (Optional)
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a quick update on your field..."
            className="w-full h-11 px-4 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 transition"
          />
        </div>

        {/* Submit Bar */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            href="/dashboard/chaupal"
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Discard
          </Link>

          <button
            type="submit"
            disabled={!storyFile || isSubmitting}
            className="px-7 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Publishing story...</span>
              </>
            ) : (
              <span>Share to Your 24h Story →</span>
            )}
          </button>
        </div>
      </form>

      {/* Instagram Bottom Nav */}
      <ChaupalBottomNav />
    </div>
  );
}

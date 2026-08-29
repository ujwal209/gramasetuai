'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getChaupalExploreFeed, type ChaupalPost } from '@/services/api';
import { ChaupalBottomNav } from '@/components/ChaupalBottomNav';

export default function ChaupalExplorePage() {
  const [posts, setPosts] = useState<ChaupalPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'All',
    'Trending',
    'Govt Advisory',
    'Sugarcane',
    'Paddy',
    'PM-KUSUM Solar',
    'Organic',
    'Dairy',
  ];

  useEffect(() => {
    loadExplorePosts();
  }, [selectedCategory]);

  const loadExplorePosts = async () => {
    setIsLoading(true);
    try {
      const res = await getChaupalExploreFeed({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        query: searchQuery.trim() || undefined,
      });
      if (res && res.posts) {
        setPosts(res.posts);
      }
    } catch (err) {
      console.warn('Error loading explore feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadExplorePosts();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left pb-24">
      {/* 1. Header & Search Bar */}
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Explore Community
          </h1>
          <p className="text-xs text-slate-500">
            Discover top agricultural yields, farming innovations, and verified advisories across India.
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tags, crops, locations, or government schemes..."
            className="w-full h-11 pl-10 pr-24 text-xs rounded-2xl bg-white border border-slate-200 shadow-2xs focus:outline-none focus:border-slate-800 transition"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat === 'All' ? 'All Top Ranked' : cat === 'Trending' ? 'Trending' : `#${cat}`}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Instagram Explore 3-Column Grid (Direct Link to Post - No Modal) */}
      {isLoading ? (
        <div className="p-16 rounded-3xl border border-slate-200 bg-white text-center space-y-3 shadow-xs">
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Ranking explore items by engagement algorithm...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="p-16 rounded-3xl border border-slate-200 bg-white text-center space-y-3 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">No posts found in this category</h3>
          <p className="text-xs text-slate-500">Try searching for other crop types or schemes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-2 sm:gap-3">
          {posts.map((post, idx) => {
            const hasMedia = post.media_urls && post.media_urls.length > 0;
            const imageUrl = hasMedia
              ? post.media_urls[0]
              : 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&auto=format&fit=crop&q=80';

            const isLarge = idx % 7 === 0;

            return (
              <Link
                key={post.id}
                href={`/dashboard/chaupal/post/${post.id}`}
                className={`relative group overflow-hidden rounded-2xl bg-slate-900 cursor-pointer aspect-square ${
                  isLarge ? 'sm:col-span-2 sm:row-span-2' : 'col-span-1'
                }`}
              >
                <img
                  src={imageUrl}
                  alt={post.caption}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />

                {/* Tag Badge */}
                {post.crop_tag && (
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold font-mono">
                      {post.crop_tag}
                    </span>
                  </div>
                )}

                {/* Hover Overlay with Likes and Comments count */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col justify-between p-4 text-white">
                  <div className="flex items-center justify-end gap-1 text-[11px] font-mono">
                    {post.author.is_official && (
                      <span className="bg-amber-500 text-black px-1.5 py-0.5 rounded text-[9px] font-bold">
                        OFFICIAL
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold line-clamp-2 drop-shadow-md">
                      {post.caption}
                    </p>
                    <div className="flex items-center gap-4 pt-1 text-xs font-bold font-mono">
                      <span>Likes: {post.likes_count || 0}</span>
                      <span>Comments: {post.comments?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Instagram Bottom Navigation */}
      <ChaupalBottomNav />
    </div>
  );
}

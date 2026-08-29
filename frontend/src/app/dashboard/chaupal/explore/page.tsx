'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  getChaupalExploreFeed,
  searchPlatformUsers,
  toggleChaupalFollow,
  type ChaupalPost,
  type SearchedFarmerAccount,
} from '@/services/api';
import { ChaupalBottomNav } from '@/components/ChaupalBottomNav';
import { toast } from 'sonner';

export default function ChaupalExplorePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ChaupalPost[]>([]);
  const [searchedAccounts, setSearchedAccounts] = useState<SearchedFarmerAccount[]>([]);
  const [suggestedAccounts, setSuggestedAccounts] = useState<SearchedFarmerAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'accounts'>('posts');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [followedMap, setFollowedMap] = useState<Record<string, boolean>>({});

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Close autocomplete on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsAutocompleteOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Load explore posts on category change
  useEffect(() => {
    if (activeTab === 'posts') {
      loadExplorePosts();
    }
  }, [selectedCategory, activeTab]);

  // Load initial accounts for suggestions
  useEffect(() => {
    loadInitialAccounts();
  }, [user?.handle]);

  const loadInitialAccounts = async () => {
    try {
      const res = await searchPlatformUsers('', user?.handle || 'citizen_farmer');
      if (res && res.users) {
        setSuggestedAccounts(res.users);
        const map: Record<string, boolean> = {};
        res.users.forEach((u) => {
          if (u.is_following) map[u.username] = true;
        });
        setFollowedMap((prev) => ({ ...prev, ...map }));
      }
    } catch (err) {
      console.warn('Error loading initial accounts:', err);
    }
  };

  const loadExplorePosts = async (overrideQuery?: string) => {
    setIsLoading(true);
    try {
      const q = overrideQuery !== undefined ? overrideQuery : searchQuery.trim();
      const res = await getChaupalExploreFeed({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        query: q || undefined,
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

  // Live Autocomplete & Account Search on Query Change
  const handleQueryChange = (val: string) => {
    setSearchQuery(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!val.trim()) {
      setSearchedAccounts(suggestedAccounts);
      setIsAutocompleteOpen(false);
      return;
    }

    setIsAutocompleteOpen(true);
    setIsSearchingUsers(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchPlatformUsers(val.trim(), user?.handle || 'citizen_farmer');
        if (res && res.users) {
          setSearchedAccounts(res.users);
          const map: Record<string, boolean> = {};
          res.users.forEach((u) => {
            if (u.is_following) map[u.username] = true;
          });
          setFollowedMap((prev) => ({ ...prev, ...map }));
        }
      } catch (err) {
        console.warn('Error searching accounts:', err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 200);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAutocompleteOpen(false);
    if (activeTab === 'posts') {
      loadExplorePosts();
    } else {
      performAccountSearch(searchQuery);
    }
  };

  const performAccountSearch = async (q: string) => {
    setIsLoading(true);
    try {
      const res = await searchPlatformUsers(q.trim(), user?.handle || 'citizen_farmer');
      if (res && res.users) {
        setSearchedAccounts(res.users);
      }
    } catch (err) {
      console.warn('Error searching accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFollow = async (targetHandle: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const currentlyFollowing = followedMap[targetHandle] || false;
    const nextState = !currentlyFollowing;

    setFollowedMap((prev) => ({ ...prev, [targetHandle]: nextState }));

    try {
      const res = await toggleChaupalFollow(
        user?.handle || 'citizen_farmer',
        targetHandle,
        nextState ? 'follow' : 'unfollow'
      );
      if (res && res.success) {
        toast.success(nextState ? `Following @${targetHandle}` : `Unfollowed @${targetHandle}`);
      }
    } catch (err) {
      setFollowedMap((prev) => ({ ...prev, [targetHandle]: currentlyFollowing }));
      toast.error('Could not update follow status');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left pb-24">
      {/* 1. Header & Live Search Bar */}
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Explore Community
          </h1>
          <p className="text-xs text-slate-500">
            Search farmers, agricultural experts, crop yields, and verified advisories across India.
          </p>
        </div>

        {/* View Mode Switcher (Posts vs Accounts) */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('posts');
              setIsAutocompleteOpen(false);
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'posts'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Explore Posts &amp; Topics
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('accounts');
              setIsAutocompleteOpen(false);
              performAccountSearch(searchQuery);
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'accounts'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>Search Accounts &amp; Farmers</span>
            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-md font-mono">
              Live
            </span>
          </button>
        </div>

        {/* Search Input Container with Auto-Complete Dropdown */}
        <div ref={searchContainerRef} className="relative max-w-2xl">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim()) setIsAutocompleteOpen(true);
              }}
              placeholder={
                activeTab === 'accounts'
                  ? 'Search farmer accounts by @handle, name, village, or crop specialty...'
                  : 'Search tags, crops, locations, or farmer @accounts...'
              }
              className="w-full h-12 pl-11 pr-28 text-sm sm:text-xs rounded-2xl bg-white border border-slate-200 shadow-xs focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsAutocompleteOpen(false);
                  loadExplorePosts('');
                }}
                className="absolute right-20 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}

            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* LIVE AUTOCOMPLETE & AUTO-SUGGESTIONS DROPDOWN */}
          {isAutocompleteOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {/* Header Bar */}
              <div className="px-4 py-2 bg-slate-50 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  {isSearchingUsers ? 'Searching Accounts...' : 'Farmer & Account Matches'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {searchedAccounts.length} found
                </span>
              </div>

              {/* Suggestions List */}
              {searchedAccounts.length === 0 && !isSearchingUsers ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No accounts found matching &quot;{searchQuery}&quot;
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {searchedAccounts.slice(0, 5).map((acc) => {
                    const isFollowing = followedMap[acc.username] || false;

                    return (
                      <div
                        key={acc.username}
                        className="px-4 py-2.5 hover:bg-slate-50 transition flex items-center justify-between gap-3 group"
                      >
                        <Link
                          href={`/dashboard/chaupal/profile/${acc.username}`}
                          onClick={() => setIsAutocompleteOpen(false)}
                          className="flex items-center gap-3 min-w-0 flex-1"
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0">
                            <img
                              src={acc.avatar_url || '/logo.png'}
                              alt={acc.name}
                              onError={(e) => {
                                e.currentTarget.src = '/logo.png';
                              }}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700">
                                {acc.name}
                              </span>
                              {acc.is_verified && (
                                <svg
                                  className="w-3.5 h-3.5 text-blue-500 shrink-0"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono truncate">
                                @{acc.username}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">
                              {acc.badge} • {acc.village}
                            </p>
                          </div>
                        </Link>

                        {/* 1-Click Follow Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleFollow(acc.username, e)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                            isFollowing
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              : 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs'
                          }`}
                        >
                          {isFollowing ? '✓ Following' : '+ Follow'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Search Posts Action Footer */}
              <div
                onClick={() => {
                  setIsAutocompleteOpen(false);
                  loadExplorePosts();
                }}
                className="px-4 py-2.5 bg-slate-50/80 hover:bg-slate-100 transition flex items-center justify-between text-xs text-slate-700 font-semibold cursor-pointer"
              >
                <span>Search all posts &amp; topics for &quot;{searchQuery}&quot;</span>
                <span className="text-[10px] font-mono text-slate-400">Press Enter ↵</span>
              </div>
            </div>
          )}
        </div>

        {/* Category Pills (Visible when in Posts tab) */}
        {activeTab === 'posts' && (
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
        )}
      </div>

      {/* 2. TAB CONTENT: ACCOUNTS DISCOVERY GRID */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
              {searchedAccounts.length} Verified Farmer Accounts
            </span>
          </div>

          {isLoading ? (
            <div className="p-16 rounded-3xl border border-slate-200 bg-white text-center space-y-3 shadow-xs">
              <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-mono">Searching registered accounts...</p>
            </div>
          ) : searchedAccounts.length === 0 ? (
            <div className="p-16 rounded-3xl border border-slate-200 bg-white text-center space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900">No accounts found</h3>
              <p className="text-xs text-slate-500">
                Try searching for a different name, village, or crop specialty.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {searchedAccounts.map((acc) => {
                const isFollowing = followedMap[acc.username] || false;

                return (
                  <div
                    key={acc.username}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition space-y-3 flex flex-col justify-between"
                  >
                    <Link
                      href={`/dashboard/chaupal/profile/${acc.username}`}
                      className="flex items-start gap-3 group"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200 group-hover:border-slate-900 transition shrink-0">
                        <img
                          src={acc.avatar_url || '/logo.png'}
                          alt={acc.name}
                          onError={(e) => {
                            e.currentTarget.src = '/logo.png';
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700">
                            {acc.name}
                          </h4>
                          {acc.is_verified && (
                            <svg
                              className="w-3.5 h-3.5 text-blue-500 shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono truncate">
                          @{acc.username}
                        </p>
                        <p className="text-[11px] text-slate-600 font-medium truncate pt-0.5">
                          {acc.badge}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {acc.village} • {acc.followers_count.toLocaleString()} followers
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => handleToggleFollow(acc.username, e)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isFollowing
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs'
                        }`}
                      >
                        {isFollowing ? '✓ Following' : '+ Follow'}
                      </button>

                      <Link
                        href={`/dashboard/chaupal/messages/${acc.username}`}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
                      >
                        Message
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. TAB CONTENT: INSTAGRAM EXPLORE 3-COLUMN GRID FOR POSTS */}
      {activeTab === 'posts' && (
        <>
          {isLoading ? (
            <div className="p-16 rounded-3xl border border-slate-200 bg-white text-center space-y-3 shadow-xs">
              <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-mono">
                Ranking explore items by engagement algorithm...
              </p>
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
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80';
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
        </>
      )}

      {/* Instagram Bottom Navigation */}
      <ChaupalBottomNav />
    </div>
  );
}

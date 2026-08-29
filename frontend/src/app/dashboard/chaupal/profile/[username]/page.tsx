'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  getChaupalFarmerProfile,
  toggleChaupalFollow,
  updateChaupalMyProfile,
  getChaupalFollowers,
  getChaupalFollowing,
  type ChaupalFarmerProfile,
  type ChaupalFollowUser,
} from '@/services/api';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { ChaupalBottomNav } from '@/components/ChaupalBottomNav';

export default function FarmerSocialProfilePage() {
  const params = useParams();
  const router = useRouter();
  const routeUsername = (params?.username as string) || 'me';
  const { user, updateUser } = useAuth();

  const currentHandle = user?.handle || 'citizen_farmer';
  const effectiveUsername =
    routeUsername === 'me' ? currentHandle : routeUsername;

  const isOwnProfile =
    effectiveUsername === currentHandle ||
    effectiveUsername === user?.username ||
    routeUsername === 'me';

  const [profile, setProfile] = useState<ChaupalFarmerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'marketplace' | 'followers' | 'following' | 'about' | 'edit'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  // In-Page Followers / Following list
  const [followListUsers, setFollowListUsers] = useState<ChaupalFollowUser[]>([]);
  const [isFollowListLoading, setIsFollowListLoading] = useState(false);
  const [followSearchQuery, setFollowSearchQuery] = useState('');

  // In-Page Edit Profile State
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editVillage, setEditVillage] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadProfile();
  }, [effectiveUsername]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const res = await getChaupalFarmerProfile(effectiveUsername, currentHandle);
      if (res && res.profile) {
        setProfile(res.profile);
        setIsFollowing(res.profile.is_following || false);
        setFollowersCount(res.profile.followers_count);
        setEditName(res.profile.name);
        setEditBio(res.profile.bio);
        setEditVillage(res.profile.village.split(',')[0]?.trim() || '');
        setEditDistrict(res.profile.village.split(',')[1]?.trim() || '');
        setEditAvatarPreview(res.profile.avatar_url);
      }
    } catch (err) {
      console.warn('Error loading farmer profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile) return;
    try {
      const res = await toggleChaupalFollow(profile.username, currentHandle);
      if (res && res.success) {
        setIsFollowing(res.following);
        setFollowersCount(res.followers_count);
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
    }
  };

  const handleOpenFollowTab = async (type: 'followers' | 'following') => {
    setActiveTab(type);
    setFollowSearchQuery('');
    setIsFollowListLoading(true);
    try {
      if (type === 'followers') {
        const res = await getChaupalFollowers(effectiveUsername, currentHandle);
        if (res && res.followers) setFollowListUsers(res.followers);
      } else {
        const res = await getChaupalFollowing(effectiveUsername, currentHandle);
        if (res && res.following) setFollowListUsers(res.following);
      }
    } catch (err) {
      console.warn(`Error loading ${type} list:`, err);
    } finally {
      setIsFollowListLoading(false);
    }
  };

  const handleToggleFollowInList = async (targetUsername: string) => {
    try {
      const res = await toggleChaupalFollow(targetUsername, currentHandle);
      if (res && res.success) {
        setFollowListUsers((prev) =>
          prev.map((u) =>
            u.username === targetUsername ? { ...u, is_following: res.following } : u
          )
        );
      }
    } catch (err) {
      console.error('Toggle follow in list error:', err);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditAvatarFile(file);
      setEditAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      let finalAvatarUrl = profile?.avatar_url || '/logo.png';
      if (editAvatarFile) {
        const uploadRes = await uploadToCloudinary(editAvatarFile, 'user_avatars');
        finalAvatarUrl = uploadRes.secure_url;
      }

      const res = await updateChaupalMyProfile({
        username: currentHandle,
        name: editName.trim(),
        bio: editBio.trim(),
        village: editVillage.trim(),
        district: editDistrict.trim(),
        avatar_url: finalAvatarUrl,
      });

      if (res && res.success) {
        if (updateUser) {
          updateUser({
            name: editName.trim(),
            village: editVillage.trim(),
            district: editDistrict.trim(),
            avatar_url: finalAvatarUrl,
          });
        }
        setActiveTab('posts');
        loadProfile();
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-16 text-center space-y-3">
        <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-mono">Loading farmer profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto p-12 text-center space-y-4 bg-white rounded-3xl border border-slate-200 shadow-xs mt-8">
        <h2 className="text-sm font-bold text-slate-900">Profile Not Found</h2>
        <p className="text-xs text-slate-500">The farmer handle @{effectiveUsername} does not exist.</p>
        <Link
          href="/dashboard/chaupal"
          className="inline-block px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
        >
          Back to Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left pb-24">
      {/* 1. Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Banner Cover */}
        <div className="h-36 sm:h-48 w-full bg-slate-900 overflow-hidden relative">
          <img
            src={profile.banner_url || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&auto=format&fit=crop&q=80'}
            alt="Profile Banner"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&auto=format&fit=crop&q=80';
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Profile Info Row */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white bg-slate-100 shadow-md">
                <img
                  src={profile.avatar_url || '/logo.png'}
                  alt={profile.name}
                  onError={(e) => {
                    e.currentTarget.src = '/logo.png';
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
              {profile.is_verified && (
                <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-white text-[11px] font-bold">
                  ✓
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {isOwnProfile ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab(activeTab === 'edit' ? 'posts' : 'edit')}
                    className={`h-10 px-5 rounded-xl border text-xs font-bold transition flex items-center justify-center shadow-2xs cursor-pointer ${
                      activeTab === 'edit'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    {activeTab === 'edit' ? 'Close Edit' : 'Edit Profile'}
                  </button>
                  <Link
                    href="/dashboard/chaupal/post/new"
                    className="h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center shadow-xs"
                  >
                    + New Post
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleFollowToggle}
                    className={`h-10 px-6 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                      isFollowing
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                        : profile.is_official
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isFollowing ? 'Following' : profile.is_official ? 'Follow Portal' : 'Follow'}
                  </button>

                  {!profile.is_official && (
                    <Link
                      href={`/dashboard/chaupal/messages?user=${profile.username}`}
                      className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition flex items-center justify-center shadow-2xs"
                    >
                      Message
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {profile.name}
                </h1>
                {profile.is_official && (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold font-mono">
                    OFFICIAL PORTAL
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                @{profile.username} • {profile.village}
              </p>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed max-w-2xl whitespace-pre-wrap">
              {profile.bio}
            </p>

            {/* Real Stats Counters (In-page tab triggers) */}
            <div className="flex items-center gap-6 pt-2 text-xs border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className="cursor-pointer hover:underline text-left group"
              >
                <span className="font-black text-slate-900 mr-1.5 group-hover:text-emerald-700">{profile.posts_count}</span>
                <span className="text-slate-500">Posts</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenFollowTab('followers')}
                className="cursor-pointer hover:underline text-left group"
              >
                <span className="font-black text-slate-900 mr-1.5 group-hover:text-emerald-700">{followersCount}</span>
                <span className={`text-slate-500 ${activeTab === 'followers' ? 'font-bold text-slate-900 underline' : ''}`}>Followers</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenFollowTab('following')}
                className="cursor-pointer hover:underline text-left group"
              >
                <span className="font-black text-slate-900 mr-1.5 group-hover:text-emerald-700">{profile.following_count}</span>
                <span className={`text-slate-500 ${activeTab === 'following' ? 'font-bold text-slate-900 underline' : ''}`}>Following</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('marketplace')}
                className="cursor-pointer hover:underline text-left group"
              >
                <span className="font-black text-slate-900 mr-1.5 group-hover:text-emerald-700">{profile.marketplace_count}</span>
                <span className="text-slate-500">Market Listings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-slate-200 bg-slate-50/50 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 px-4 text-xs font-bold transition border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'posts'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Posts ({profile.posts?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('marketplace')}
            className={`flex-1 py-3 px-4 text-xs font-bold transition border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'marketplace'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Marketplace ({profile.marketplace_items?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => handleOpenFollowTab('followers')}
            className={`flex-1 py-3 px-4 text-xs font-bold transition border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'followers'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Followers ({followersCount})
          </button>
          <button
            type="button"
            onClick={() => handleOpenFollowTab('following')}
            className={`flex-1 py-3 px-4 text-xs font-bold transition border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'following'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Following ({profile.following_count})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`flex-1 py-3 px-4 text-xs font-bold transition border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'about'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Farm Details
          </button>
        </div>
      </div>

      {/* 2. IN-PAGE TAB CONTENTS (ZERO MODALS) */}

      {/* A. POSTS GRID */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {profile.posts && profile.posts.length === 0 ? (
            <div className="p-16 rounded-3xl border border-slate-200 bg-white text-center space-y-3">
              <h3 className="text-sm font-bold text-slate-900">No posts shared yet</h3>
              <p className="text-xs text-slate-500">Updates and harvest photos will appear here.</p>
              {isOwnProfile && (
                <Link
                  href="/dashboard/chaupal/post/new"
                  className="inline-block px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
                >
                  + Create Post
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {profile.posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/dashboard/chaupal/post/${post.id}`}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 group cursor-pointer shadow-2xs"
                >
                  <img
                    src={post.media_urls && post.media_urls.length > 0 ? post.media_urls[0] : '/logo.png'}
                    alt={post.caption}
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4 text-white text-xs font-bold font-mono">
                    <span>Likes: {post.likes_count || 0}</span>
                    <span>Comments: {post.comments?.length || 0}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* B. MARKETPLACE ITEMS */}
      {activeTab === 'marketplace' && (
        <div className="space-y-4">
          {profile.marketplace_items && profile.marketplace_items.length === 0 ? (
            <div className="p-16 rounded-3xl border border-slate-200 bg-white text-center space-y-3">
              <h3 className="text-sm font-bold text-slate-900">No marketplace listings</h3>
              <p className="text-xs text-slate-500">Produce and machinery listings will appear here.</p>
              {isOwnProfile && (
                <Link
                  href="/dashboard/chaupal/create?tab=marketplace"
                  className="inline-block px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
                >
                  + Sell Produce
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.marketplace_items.map((item) => (
                <Link
                  key={item.id}
                  href={`/dashboard/chaupal/marketplace/${item.id}`}
                  className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs flex gap-3.5 hover:border-slate-400 transition"
                >
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80';
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 block">
                      {item.category}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs font-black text-slate-900 font-mono">
                      ₹{item.price.toLocaleString()} / {item.unit}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {item.location}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* C. IN-PAGE FOLLOWERS & FOLLOWING LIST */}
      {(activeTab === 'followers' || activeTab === 'following') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 capitalize">
                {profile.name}&apos;s {activeTab}
              </h3>
              <p className="text-xs text-slate-500">
                {activeTab === 'followers'
                  ? `Farmers and organizations following @${profile.username}`
                  : `Farmers and organizations followed by @${profile.username}`}
              </p>
            </div>

            {/* Search Filter */}
            <div className="relative w-56">
              <input
                type="text"
                value={followSearchQuery}
                onChange={(e) => setFollowSearchQuery(e.target.value)}
                placeholder="Search list..."
                className="w-full h-9 pl-8 pr-3 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-slate-800 transition"
              />
              <svg
                className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {isFollowListLoading ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-mono">Loading {activeTab}...</p>
              </div>
            ) : (
              (() => {
                const filteredUsers = followListUsers.filter(
                  (u) =>
                    u.name.toLowerCase().includes(followSearchQuery.toLowerCase()) ||
                    u.username.toLowerCase().includes(followSearchQuery.toLowerCase()) ||
                    u.village.toLowerCase().includes(followSearchQuery.toLowerCase())
                );

                if (filteredUsers.length === 0) {
                  return (
                    <div className="py-12 text-center space-y-1">
                      <p className="text-xs font-bold text-slate-700">
                        {followSearchQuery
                          ? 'No matches found'
                          : activeTab === 'followers'
                          ? 'No followers yet'
                          : 'Not following anyone yet'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {activeTab === 'followers'
                          ? 'When other farmers follow this account, they will appear here.'
                          : 'Accounts followed by this farmer will appear here.'}
                      </p>
                    </div>
                  );
                }

                return filteredUsers.map((u) => {
                  const isSelf = u.username === currentHandle;

                  return (
                    <div
                      key={u.username}
                      className="py-3 flex items-center justify-between gap-3 group"
                    >
                      <Link
                        href={`/dashboard/chaupal/profile/${u.username}`}
                        className="flex items-center gap-3 min-w-0 flex-1"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                          <img
                            src={u.avatar_url || '/logo.png'}
                            alt={u.name}
                            onError={(e) => {
                              e.currentTarget.src = '/logo.png';
                            }}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 truncate">
                              {u.name}
                            </p>
                            {u.is_official ? (
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[9px] font-bold font-mono">
                                OFFICIAL
                              </span>
                            ) : u.is_verified ? (
                              <span className="text-emerald-600 text-[11px] font-bold">✓</span>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            @{u.username} • {u.village}
                          </p>
                        </div>
                      </Link>

                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => handleToggleFollowInList(u.username)}
                          className={`h-8 px-3.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-2xs ${
                            u.is_following
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                              : u.is_official
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          {u.is_following ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  );
                });
              })()
            )}
          </div>
        </div>
      )}

      {/* D. IN-PAGE EDIT PROFILE SECTION */}
      {activeTab === 'edit' && isOwnProfile && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Edit Farmer Profile</h3>
              <p className="text-xs text-slate-500">Update your public bio, name, village, and photo</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('posts')}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 font-mono"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
            {/* Avatar Upload */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 shrink-0">
                <img
                  src={editAvatarPreview || profile.avatar_url || '/logo.png'}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="px-4 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-800 transition cursor-pointer"
                >
                  Change Photo
                </button>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">PNG, JPG up to 5MB</p>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider font-mono text-slate-600">
                Full Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900"
                required
              />
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider font-mono text-slate-600">
                Bio / Farmer Description
              </label>
              <textarea
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell other farmers about your crops, farming methods, or produce for sale..."
                className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 resize-none"
              />
            </div>

            {/* Village & District */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider font-mono text-slate-600">
                  Village / Town
                </label>
                <input
                  type="text"
                  value={editVillage}
                  onChange={(e) => setEditVillage(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider font-mono text-slate-600">
                  District / State
                </label>
                <input
                  type="text"
                  value={editDistrict}
                  onChange={(e) => setEditDistrict(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* E. ABOUT / FARM DETAILS */}
      {activeTab === 'about' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">About Farmer &amp; Holding</h3>
            <p className="text-xs text-slate-500">Verified agricultural credentials and background</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Primary Cultivated Crops
              </span>
              <span className="text-xs font-bold text-slate-900">
                {profile.primary_crops && profile.primary_crops.length > 0
                  ? profile.primary_crops.join(', ')
                  : 'Sugarcane, Paddy, Vegetables'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Total Land Holding
              </span>
              <span className="text-xs font-bold text-slate-900 font-mono">
                {profile.landholding_acres || 4.5} Acres
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Location &amp; District Hub
              </span>
              <span className="text-xs font-bold text-slate-900">
                {profile.village}, {profile.state}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Verification Status
              </span>
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                ✓ Registered Citizen Farmer
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Instagram Bottom Nav */}
      <ChaupalBottomNav />
    </div>
  );
}

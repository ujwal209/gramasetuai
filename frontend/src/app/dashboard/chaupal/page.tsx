'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  getChaupalStories,
  getChaupalPosts,
  toggleChaupalPostLike,
  addChaupalPostComment,
  createChaupalStory,
  updateChaupalStory,
  deleteChaupalStory,
  updateChaupalPost,
  deleteChaupalPost,
  replyToChaupalStory,
  getChaupalMarketplace,
  getChaupalTrending,
  getChaupalSuggestions,
  toggleChaupalFollow,
  type ChaupalPost,
  type ChaupalStoryGroup,
  type ChaupalMarketplaceItem,
} from '@/services/api';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { ChaupalBottomNav } from '@/components/ChaupalBottomNav';
import { toast } from 'sonner';

export default function KisanChaupalFeedPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Banner Dismiss State
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  // Dynamic API State
  const [storyGroups, setStoryGroups] = useState<ChaupalStoryGroup[]>([]);
  const [posts, setPosts] = useState<ChaupalPost[]>([]);
  const [marketplaceHighlights, setMarketplaceHighlights] = useState<ChaupalMarketplaceItem[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<Array<{ tag: string; count: string; desc: string }>>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<Array<{
    username: string;
    name: string;
    avatar_url: string;
    badge: string;
    village: string;
    is_verified?: boolean;
    is_official?: boolean;
  }>>([]);
  const [followedMap, setFollowedMap] = useState<Record<string, boolean>>({});
  const [isSuggestedDismissed, setIsSuggestedDismissed] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [activeCropFilter, setActiveCropFilter] = useState('All');

  // Post Action Menu & Edit State
  const [postMenuOpenId, setPostMenuOpenId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<ChaupalPost | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editCropTag, setEditCropTag] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [isSavingPostEdit, setIsSavingPostEdit] = useState(false);

  // Fully Responsive Story Viewer State with Dynamic Aesthetic Backdrop
  const [activeStoryGroupIndex, setActiveStoryGroupIndex] = useState<number | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const [storyReplyText, setStoryReplyText] = useState('');
  const [storyReplySent, setStoryReplySent] = useState(false);
  const [isEditingStory, setIsEditingStory] = useState(false);
  const [editStoryCaption, setEditStoryCaption] = useState('');
  const storyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Comment & Nested Reply State per Post
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<Record<string, { commentId: string; username: string } | null>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // Heart Animation State
  const [likedAnimationPostId, setLikedAnimationPostId] = useState<string | null>(null);

  // Load Banner Dismissal from localStorage
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('chaupal_banner_dismissed');
      if (dismissed === 'true') setIsBannerVisible(false);
    } catch {}
  }, []);

  const handleDismissBanner = () => {
    setIsBannerVisible(false);
    try {
      localStorage.setItem('chaupal_banner_dismissed', 'true');
    } catch {}
  };

  // Load Feed & Suggestions Data Dynamically
  useEffect(() => {
    loadFeed();
  }, [activeCropFilter]);

  const loadFeed = async () => {
    setIsLoading(true);
    try {
      const [storiesRes, postsRes, mktRes, trendsRes, suggestRes] = await Promise.all([
        getChaupalStories(),
        getChaupalPosts({ tag: activeCropFilter === 'All' ? undefined : activeCropFilter }),
        getChaupalMarketplace({ limit: 3 }),
        getChaupalTrending(),
        getChaupalSuggestions(user?.handle || 'citizen_farmer'),
      ]);

      if (storiesRes && storiesRes.story_groups) setStoryGroups(storiesRes.story_groups);
      if (postsRes && postsRes.posts) setPosts(postsRes.posts);
      if (mktRes && mktRes.items) setMarketplaceHighlights(mktRes.items);
      if (trendsRes && trendsRes.trends) setTrendingTopics(trendsRes.trends);
      if (suggestRes && suggestRes.suggestions) {
        const myHandle = user?.handle || 'citizen_farmer';
        const filtered = suggestRes.suggestions.filter(
          (s: any) => s.username !== myHandle && s.username !== user?.username && s.username !== user?.id
        );
        setSuggestedUsers(filtered);
      }
    } catch (err) {
      console.warn('Error loading Chaupal feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Story Progress Timer with Pause-on-Hold & Escape Key Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveStoryGroupIndex(null);
      if (e.key === 'ArrowRight') handleNextStory();
      if (e.key === 'ArrowLeft') handlePrevStory();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStoryGroupIndex, activeStoryIndex, storyGroups]);

  useEffect(() => {
    if (activeStoryGroupIndex === null || isStoryPaused) {
      if (storyTimerRef.current) clearInterval(storyTimerRef.current);
      return;
    }

    setStoryProgress(0);
    const interval = 50; // ms
    const totalDuration = 5000; // 5s per story
    const step = (interval / totalDuration) * 100;

    storyTimerRef.current = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          handleNextStory();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (storyTimerRef.current) clearInterval(storyTimerRef.current);
    };
  }, [activeStoryGroupIndex, activeStoryIndex, isStoryPaused, storyGroups]);

  const handleNextStory = () => {
    if (activeStoryGroupIndex === null) return;
    const currentGroup = storyGroups[activeStoryGroupIndex];
    if (!currentGroup) return;

    if (activeStoryIndex < currentGroup.stories.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
      setStoryProgress(0);
    } else if (activeStoryGroupIndex < storyGroups.length - 1) {
      setActiveStoryGroupIndex((prev) => prev + 1);
      setActiveStoryIndex(0);
      setStoryProgress(0);
    } else {
      setActiveStoryGroupIndex(null);
    }
  };

  const handlePrevStory = () => {
    if (activeStoryGroupIndex === null) return;
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
      setStoryProgress(0);
    } else if (activeStoryGroupIndex > 0) {
      setActiveStoryGroupIndex((prev) => prev - 1);
      const prevGroup = storyGroups[activeStoryGroupIndex - 1];
      setActiveStoryIndex(prevGroup.stories.length - 1);
      setStoryProgress(0);
    }
  };

  const handleSendStoryReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyReplyText.trim() || activeStoryGroupIndex === null) return;
    const currentGroup = storyGroups[activeStoryGroupIndex];
    const currentStory = currentGroup?.stories[activeStoryIndex];
    if (!currentStory) return;

    if (currentGroup.username === 'gramsetu_official' || currentGroup.is_official) {
      return;
    }

    try {
      await replyToChaupalStory(currentStory.id, {
        text: storyReplyText.trim(),
        username: user?.handle || 'citizen_farmer',
        name: user?.name || 'Citizen Farmer',
        avatar_url: user?.avatar_url || '/logo.png',
      });
      setStoryReplyText('');
      setStoryReplySent(true);
      setTimeout(() => setStoryReplySent(false), 2500);
    } catch (err) {
      console.error('Story reply error:', err);
    }
  };

  // Follow / Unfollow Toggle
  const handleToggleFollow = async (username: string) => {
    try {
      const res = await toggleChaupalFollow(username, user?.handle || 'citizen_farmer');
      if (res && res.success) {
        setFollowedMap((prev) => ({ ...prev, [username]: res.following }));
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
    }
  };

  // Like & Double Tap Handler
  const handleLike = async (postId: string) => {
    try {
      const res = await toggleChaupalPostLike(postId, user?.handle || 'citizen_farmer');
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const isLiked = p.likes_users?.includes(user?.handle || 'citizen_farmer');
            const newUsers = isLiked
              ? p.likes_users.filter((u) => u !== (user?.handle || 'citizen_farmer'))
              : [...(p.likes_users || []), user?.handle || 'citizen_farmer'];
            return {
              ...p,
              likes_count: isLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1,
              likes_users: newUsers,
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleDoubleTap = (postId: string) => {
    setLikedAnimationPostId(postId);
    setTimeout(() => setLikedAnimationPostId(null), 900);
    handleLike(postId);
  };

  // Comment & Nested Reply Handler
  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const replyContext = replyingTo[postId];

    try {
      const res = await addChaupalPostComment(postId, {
        text,
        parent_comment_id: replyContext?.commentId,
        reply_to_username: replyContext?.username,
        username: user?.handle || 'citizen_farmer',
        name: user?.name || 'Citizen Farmer',
        avatar_url: user?.avatar_url || '/logo.png',
      });

      if (res && res.comment) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === postId) {
              return { ...p, comments: [...(p.comments || []), res.comment] };
            }
            return p;
          })
        );
        setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
        setReplyingTo((prev) => ({ ...prev, [postId]: null }));
        setExpandedComments((prev) => ({ ...prev, [postId]: true }));
      }
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  const shareToWhatsApp = (post: ChaupalPost) => {
    const text = `Check out this post from ${post.author.name} (@${post.author.username}) on Kisan Chaupal:\n\n"${post.caption}"\n\nLocation: ${post.location}\nView on GramSetu: https://gramsetu.in/dashboard/chaupal/post/${post.id}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleOpenEditPost = (post: ChaupalPost) => {
    setEditingPost(post);
    setEditCaption(post.caption || '');
    setEditCropTag(post.crop_tag || '');
    setEditTopic(post.topic || '');
    setEditLocation(post.location || '');
    setPostMenuOpenId(null);
  };

  const handleSavePostEdit = async () => {
    if (!editingPost) return;
    setIsSavingPostEdit(true);
    try {
      const res = await updateChaupalPost(editingPost.id, {
        caption: editCaption,
        crop_tag: editCropTag,
        topic: editTopic,
        location: editLocation,
      });
      if (res && res.post) {
        setPosts((prev) => prev.map((p) => (p.id === editingPost.id ? res.post : p)));
        setEditingPost(null);
      }
    } catch (err) {
      console.error('Failed to update post:', err);
    } finally {
      setIsSavingPostEdit(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    setPostMenuOpenId(null);
    try {
      await deleteChaupalPost(postId, user?.handle || undefined);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success('Post removed from feed');
    } catch (err) {
      console.error('Failed to delete post:', err);
      toast.error('Failed to delete post');
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      await deleteChaupalStory(storyId, user?.handle || undefined);
      setStoryGroups((prev) =>
        prev
          .map((g) => ({
            ...g,
            stories: g.stories.filter((s) => s.id !== storyId),
          }))
          .filter((g) => g.stories.length > 0)
      );
      setActiveStoryGroupIndex(null);
      toast.success('24h Story deleted');
    } catch (err) {
      console.error('Failed to delete story:', err);
      toast.error('Failed to delete story');
    }
  };

  const handleSaveStoryEdit = async (storyId: string) => {
    if (!editStoryCaption.trim()) return;
    try {
      const res = await updateChaupalStory(storyId, { caption: editStoryCaption });
      if (res && res.story) {
        setStoryGroups((prev) =>
          prev.map((g) => ({
            ...g,
            stories: g.stories.map((s) => (s.id === storyId ? { ...s, caption: editStoryCaption } : s)),
          }))
        );
        setIsEditingStory(false);
      }
    } catch (err) {
      console.error('Failed to update story caption:', err);
    }
  };

  const cropFilters = ['All', 'Sugarcane', 'Paddy', 'Tomato', 'Cotton', 'Solar', 'Organic', 'Dairy'];

  const activeGroup = activeStoryGroupIndex !== null ? storyGroups[activeStoryGroupIndex] : null;
  const activeStory = activeGroup ? activeGroup.stories[activeStoryIndex] : null;
  const isViewingOfficialStory = activeGroup?.username === 'gramsetu_official' || activeGroup?.is_official;

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left pb-24">
      {/* 1. DISMISSIBLE TOP HERO BANNER */}
      {isBannerVisible && (
        <div className="relative p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row items-center justify-between gap-5 transition-all">
          <button
            type="button"
            onClick={handleDismissBanner}
            title="Dismiss Banner"
            className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center text-xs font-bold transition cursor-pointer"
          >
            ✕
          </button>

          <div className="space-y-2 max-w-xl pr-6">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider font-mono">
                FARMER SOCIAL NETWORK &amp; DIRECT BAZAR
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Kisan Chaupal Community Feed
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Connect with farmers across India. Share field updates, daily mandi prices, crop innovations, and direct trade.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Link
              href="/dashboard/chaupal/messages"
              className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>Direct Messages</span>
            </Link>
            <Link
              href="/dashboard/chaupal/post/new"
              className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>+ New Post</span>
            </Link>
          </div>
        </div>
      )}

      {/* 2. DYNAMIC 24H STORIES TRAY */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2 overflow-hidden">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">
            Active Stories ({storyGroups.length})
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Tap circle to view
          </span>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none pt-1">
          {/* Add Your Story Button */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <Link
              href="/dashboard/chaupal/story/new"
              className="relative w-16 h-16 rounded-full p-0.5 border-2 border-dashed border-slate-300 hover:border-slate-800 transition flex items-center justify-center bg-slate-50 group cursor-pointer"
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="You" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-slate-600">{user?.name ? user.name.charAt(0) : 'Me'}</span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-white text-[11px] font-bold">
                +
              </div>
            </Link>
            <span className="text-[11px] font-medium text-slate-700 max-w-[70px] truncate">
              Your Story
            </span>
          </div>

          {/* Active Stories */}
          {storyGroups.map((group, gIdx) => {
            const isOfficial = group.username === 'gramsetu_official' || group.is_official;

            return (
              <button
                key={group.username}
                type="button"
                onClick={() => {
                  setActiveStoryGroupIndex(gIdx);
                  setActiveStoryIndex(0);
                }}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
              >
                <div
                  className={`w-16 h-16 rounded-full p-0.75 transition transform group-hover:scale-105 shadow-2xs ${
                    isOfficial
                      ? 'bg-gradient-to-tr from-amber-400 via-amber-600 to-emerald-600 ring-2 ring-amber-400/40'
                      : 'bg-gradient-to-tr from-amber-500 via-rose-500 to-emerald-500'
                  }`}
                >
                  <div className="w-full h-full rounded-full p-0.5 bg-white">
                    <img
                      src={group.avatar_url || '/logo.png'}
                      alt={group.name}
                      className="w-full h-full rounded-full object-cover bg-white"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-0.5 max-w-[78px]">
                  <span className={`text-[11px] font-medium truncate text-center ${isOfficial ? 'text-emerald-800 font-bold' : 'text-slate-800'}`}>
                    {isOfficial ? 'GramSetu' : group.name.split(' ')[0]}
                  </span>
                  {isOfficial && <span className="text-[10px] text-amber-600">✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SUGGESTED FARMERS CAROUSEL */}
      {!isSuggestedDismissed && suggestedUsers.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3 relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 tracking-tight">
              Suggested Farmers to Follow
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase">
                Registered on Platform
              </span>
              <button
                type="button"
                onClick={() => setIsSuggestedDismissed(true)}
                className="w-6 h-6 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                title="Dismiss Suggestions"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {suggestedUsers.map((su) => {
              const isFollowing = followedMap[su.username] || false;

              return (
                <div
                  key={su.username}
                  className="w-36 sm:w-40 shrink-0 p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 text-center flex flex-col items-center justify-between space-y-2.5 hover:border-slate-300 transition"
                >
                  <Link
                    href={`/dashboard/chaupal/profile/${su.username}`}
                    className="flex flex-col items-center group space-y-1.5"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200 group-hover:border-slate-800 transition">
                      <img
                        src={su.avatar_url || '/logo.png'}
                        alt={su.name}
                        onError={(e) => {
                          e.currentTarget.src = '/logo.png';
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700">
                        {su.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        @{su.username}
                      </p>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleToggleFollow(su.username)}
                    className={`w-full py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isFollowing
                        ? 'bg-slate-200 text-slate-800'
                        : su.is_official
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. MAIN FEED + SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* POSTS FEED */}
        <div className="lg:col-span-2 space-y-5">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {cropFilters.map((crop) => (
              <button
                key={crop}
                type="button"
                onClick={() => setActiveCropFilter(crop)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeCropFilter === crop
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {crop === 'All' ? 'All Updates' : `#${crop}`}
              </button>
            ))}
          </div>

          {/* Dynamic Posts */}
          {isLoading ? (
            <div className="p-16 rounded-2xl border border-slate-200 bg-white text-center space-y-3 shadow-xs">
              <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-mono">Fetching Kisan Chaupal updates...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-12 rounded-2xl border border-slate-200 bg-white text-center space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900">No updates in this filter</h3>
              <p className="text-xs text-slate-500">Be the first farmer to share a harvest update or advisory.</p>
              <Link
                href="/dashboard/chaupal/post/new"
                className="inline-block px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                + Create Post
              </Link>
            </div>
          ) : (
            posts.map((post) => {
              const isLiked = post.likes_users?.includes(user?.handle || 'citizen_farmer');
              const areCommentsOpen = expandedComments[post.id] || false;
              const activeReply = replyingTo[post.id];
              const isOfficial = post.author.username === 'gramsetu_official' || (post.author as any).is_official;

              const parentComments = (post.comments || []).filter((c) => !c.parent_id);
              const repliesMap: Record<string, typeof post.comments> = {};
              (post.comments || []).forEach((c) => {
                if (c.parent_id) {
                  repliesMap[c.parent_id] = [...(repliesMap[c.parent_id] || []), c];
                }
              });

              return (
                <article
                  key={post.id}
                  className="rounded-3xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden transition hover:border-slate-300"
                >
                  {/* Post Header */}
                  <div className="p-4 flex items-center justify-between border-b border-slate-100">
                    <Link
                      href={`/dashboard/chaupal/profile/${post.author.username}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-emerald-500 to-amber-500">
                        <img
                          src={post.author.avatar_url || '/logo.png'}
                          alt={post.author.name}
                          onError={(e) => {
                            e.currentTarget.src = '/logo.png';
                          }}
                          className="w-full h-full rounded-full object-cover bg-white"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
                            {post.author.name}
                          </span>
                          {post.author.is_verified && (
                            <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                          @{post.author.username} • {post.location || post.author.village}
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2">
                      {!isOfficial && (
                        <Link
                          href={`/dashboard/chaupal/messages?user=${post.author.username}`}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center gap-1 transition"
                        >
                          <span>Message</span>
                        </Link>
                      )}

                      {post.crop_tag && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-800 hidden sm:inline">
                          {post.crop_tag}
                        </span>
                      )}

                      {/* 3-Dots Action Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setPostMenuOpenId(postMenuOpenId === post.id ? null : post.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                          title="Post Options"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>

                        {postMenuOpenId === post.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 z-40 text-xs animate-sleek">
                            {(post.author.username === (user?.handle || 'citizen_farmer') || post.author.user_id === user?.id || (user as any)?.is_official) && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditPost(post)}
                                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 text-slate-800 font-semibold flex items-center gap-2 cursor-pointer"
                                >
                                  <span>✏️</span>
                                  <span>Edit Post</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePost(post.id)}
                                  className="w-full px-3.5 py-2 text-left hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2 cursor-pointer"
                                >
                                  <span>🗑️</span>
                                  <span>Delete Post</span>
                                </button>
                                <div className="border-t border-slate-100 my-1" />
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/dashboard/chaupal/post/${post.id}`);
                                setPostMenuOpenId(null);
                                alert('Post link copied to clipboard!');
                              }}
                              className="w-full px-3.5 py-2 text-left hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2 cursor-pointer"
                            >
                              <span>📋</span>
                              <span>Copy Link</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                shareToWhatsApp(post);
                                setPostMenuOpenId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left hover:bg-slate-50 text-emerald-700 font-medium flex items-center gap-2 cursor-pointer"
                            >
                              <span>💬</span>
                              <span>Share to WhatsApp</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Post Media (Double Tap to Like) */}
                  {post.media_urls && post.media_urls.length > 0 && (
                    <Link
                      href={`/dashboard/chaupal/post/${post.id}`}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        handleDoubleTap(post.id);
                      }}
                      className="relative bg-slate-900 aspect-4/3 sm:aspect-16/10 flex items-center justify-center overflow-hidden select-none cursor-pointer group block"
                    >
                      <img
                        src={post.media_urls[0]}
                        alt={post.caption}
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80';
                        }}
                        className="w-full h-full object-cover"
                      />

                      {likedAnimationPostId === post.id && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping">
                          <svg className="w-20 h-20 text-white fill-rose-500 drop-shadow-lg" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        </div>
                      )}
                    </Link>
                  )}

                  {/* Post Action Buttons */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Like Button */}
                        <button
                          type="button"
                          onClick={() => handleLike(post.id)}
                          className="flex items-center gap-1.5 text-xs font-bold transition group cursor-pointer"
                        >
                          <svg
                            className={`w-6 h-6 transition transform group-active:scale-125 ${
                              isLiked ? 'text-rose-600 fill-rose-600' : 'text-slate-800 fill-none'
                            }`}
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span className={isLiked ? 'text-rose-600' : 'text-slate-800'}>
                            {post.likes_count || 0}
                          </span>
                        </button>

                        {/* Comment Button */}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                          }
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-slate-900 transition cursor-pointer"
                        >
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>{post.comments?.length || 0}</span>
                        </button>

                        {/* Share via WhatsApp */}
                        <button
                          type="button"
                          onClick={() => shareToWhatsApp(post)}
                          className="text-xs font-bold text-slate-800 hover:text-emerald-700 transition flex items-center gap-1 cursor-pointer"
                          title="Share"
                        >
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </button>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Caption & Hashtags */}
                    <div className="space-y-1 text-xs text-slate-800 leading-relaxed">
                      <p>
                        <Link href={`/dashboard/chaupal/profile/${post.author.username}`} className="font-bold hover:underline mr-1.5">
                          {post.author.username}
                        </Link>
                        {post.caption}
                      </p>

                      {post.hashtags && post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {post.hashtags.map((ht, idx) => (
                            <span key={idx} className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer">
                              {ht}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* NESTED COMMENTS SECTION */}
                    {post.comments && post.comments.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-3">
                        {!areCommentsOpen && post.comments.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setExpandedComments((prev) => ({ ...prev, [post.id]: true }))}
                            className="text-[11px] text-slate-500 font-semibold hover:text-slate-800 cursor-pointer"
                          >
                            View all {post.comments.length} comments &amp; replies...
                          </button>
                        )}

                        <div className="space-y-2.5">
                          {(areCommentsOpen ? parentComments : parentComments.slice(-2)).map((c) => {
                            const subReplies = repliesMap[c.id] || [];

                            return (
                              <div key={c.id} className="space-y-1.5">
                                <div className="flex items-start justify-between gap-2 text-xs leading-relaxed group/comment">
                                  <div className="flex items-start gap-2 flex-1">
                                    <Link href={`/dashboard/chaupal/profile/${c.username}`} className="shrink-0">
                                      <img
                                        src={c.avatar_url || '/logo.png'}
                                        alt={c.name}
                                        onError={(e) => {
                                          e.currentTarget.src = '/logo.png';
                                        }}
                                        className="w-5 h-5 rounded-full object-cover mt-0.5 hover:ring-1 hover:ring-slate-400"
                                      />
                                    </Link>
                                    <div>
                                      <p>
                                        <Link
                                          href={`/dashboard/chaupal/profile/${c.username}`}
                                          className="font-bold text-slate-900 mr-1 hover:text-emerald-700 hover:underline"
                                        >
                                          {c.username}
                                        </Link>
                                        <span className="text-slate-700">{c.text}</span>
                                      </p>
                                      <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-400 font-mono">
                                        <span>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        <button
                                          type="button"
                                          onClick={() => setReplyingTo((prev) => ({ ...prev, [post.id]: { commentId: c.id, username: c.username } }))}
                                          className="font-bold text-emerald-700 hover:underline cursor-pointer"
                                        >
                                          Reply
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {subReplies.length > 0 && (
                                  <div className="ml-6 sm:ml-8 pl-3 border-l-2 border-slate-200 space-y-2 pt-1">
                                    {subReplies.map((sub) => (
                                      <div key={sub.id} className="flex items-start gap-2 text-xs leading-relaxed">
                                        <Link href={`/dashboard/chaupal/profile/${sub.username}`} className="shrink-0">
                                          <img
                                            src={sub.avatar_url || '/logo.png'}
                                            alt={sub.name}
                                            onError={(e) => {
                                              e.currentTarget.src = '/logo.png';
                                            }}
                                            className="w-4 h-4 rounded-full object-cover mt-0.5 hover:ring-1 hover:ring-slate-400"
                                          />
                                        </Link>
                                        <div>
                                          <p>
                                            <Link
                                              href={`/dashboard/chaupal/profile/${sub.username}`}
                                              className="font-bold text-slate-900 mr-1 hover:text-emerald-700 hover:underline"
                                            >
                                              {sub.username}
                                            </Link>
                                            {sub.reply_to_username && (
                                              <Link
                                                href={`/dashboard/chaupal/profile/${sub.reply_to_username}`}
                                                className="text-emerald-700 font-semibold mr-1 hover:underline"
                                              >
                                                @{sub.reply_to_username}
                                              </Link>
                                            )}
                                            <span className="text-slate-700">{sub.text}</span>
                                          </p>
                                          <div className="flex items-center gap-3 mt-0.5 text-[9px] text-slate-400 font-mono">
                                            <span>{new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <button
                                              type="button"
                                              onClick={() => setReplyingTo((prev) => ({ ...prev, [post.id]: { commentId: c.id, username: sub.username } }))}
                                              className="font-bold text-emerald-700 hover:underline cursor-pointer"
                                            >
                                              Reply
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Add Comment Input Bar with Reply Context */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      {activeReply && (
                        <div className="flex items-center justify-between text-[11px] bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 text-emerald-900">
                          <span>Replying to <strong>@{activeReply.username}</strong></span>
                          <button
                            type="button"
                            onClick={() => setReplyingTo((prev) => ({ ...prev, [post.id]: null }))}
                            className="text-slate-500 hover:text-slate-900 font-bold"
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={commentInputs[post.id] || ''}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddComment(post.id);
                          }}
                          placeholder={activeReply ? `Reply to @${activeReply.username}...` : 'Add a comment...'}
                          className="flex-1 h-9 px-3 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-slate-800 transition"
                        />
                        <button
                          type="submit"
                          onClick={() => handleAddComment(post.id)}
                          disabled={!commentInputs[post.id]?.trim()}
                          className="h-9 px-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* SIDEBAR: MARKETPLACE & TRENDING */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">
                  DIRECT FARM BAZAR
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Krishi Mandi Highlights
                </h3>
              </div>
              <Link
                href="/dashboard/chaupal/marketplace"
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {marketplaceHighlights.map((item) => (
                <Link
                  key={item.id}
                  href={`/dashboard/chaupal/marketplace/${item.id}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200 group"
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                    <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700">
                      {item.title}
                    </h4>
                    <p className="text-xs font-bold text-emerald-700 font-mono">
                      ₹{item.price.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">/ {item.unit}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {item.location}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <Link
              href="/dashboard/chaupal/create"
              className="block w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold text-center transition shadow-2xs"
            >
              + List Your Produce for Free
            </Link>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">
              COMMUNITY TRENDS
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Trending in Agriculture
            </h3>

            <div className="space-y-2.5 pt-1">
              {trendingTopics.map((tr, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveCropFilter(tr.tag.replace('#', '').split('_')[0])}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer space-y-0.5"
                >
                  <p className="text-xs font-bold text-slate-900">{tr.tag}</p>
                  <p className="text-[11px] text-slate-500">{tr.desc}</p>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">{tr.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. GORGEOUS INSTAGRAM STORY VIEWER */}
      {activeStoryGroupIndex !== null && activeGroup && activeStory && (
        <div
          className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-0 sm:p-4 touch-none select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveStoryGroupIndex(null);
          }}
          onTouchStart={(e) => {
            touchStartYRef.current = e.touches[0].clientY;
            setIsStoryPaused(true);
          }}
          onTouchEnd={(e) => {
            if (touchStartYRef.current !== null) {
              const touchEndY = e.changedTouches[0].clientY;
              if (touchEndY - touchStartYRef.current > 80) {
                setActiveStoryGroupIndex(null);
              }
            }
            touchStartYRef.current = null;
            setIsStoryPaused(false);
          }}
        >
          {/* Dynamic Ambient Background Blur */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-2xl z-0 overflow-hidden">
            <img
              src={activeStory.media_url}
              alt="Backdrop blur"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80';
              }}
              className="w-full h-full object-cover blur-3xl opacity-40 scale-150 saturate-200 transform transition-all duration-700"
            />
            <div className="absolute inset-0 bg-radial from-transparent via-slate-950/70 to-black/95" />
          </div>

          {/* Desktop Left Nav Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevStory();
            }}
            className="hidden md:flex absolute left-8 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md text-white items-center justify-center transition border border-white/20 shadow-lg cursor-pointer"
            title="Previous Story"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Main Story Container */}
          <div
            onMouseDown={() => setIsStoryPaused(true)}
            onMouseUp={() => setIsStoryPaused(false)}
            className="relative z-10 w-full h-[100dvh] sm:h-[88vh] sm:max-h-[780px] sm:max-w-sm md:max-w-md bg-black sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-white/15 sm:border-white/25"
          >
            {/* Top Progress Bars & Header Bar */}
            <div className="p-4 sm:p-3.5 space-y-2.5 z-30 bg-gradient-to-b from-black/90 via-black/50 to-transparent backdrop-blur-xs">
              <div className="flex items-center gap-1.5">
                {activeGroup.stories.map((_, sIdx) => (
                  <div key={sIdx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-75"
                      style={{
                        width:
                          sIdx < activeStoryIndex
                            ? '100%'
                            : sIdx === activeStoryIndex
                            ? `${storyProgress}%`
                            : '0%',
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Story Author Bar */}
              <div className="flex items-center justify-between text-white pt-1">
                <Link
                  href={`/dashboard/chaupal/profile/${activeGroup.username}`}
                  onClick={() => setActiveStoryGroupIndex(null)}
                  className="flex items-center gap-2.5 group cursor-pointer min-w-0"
                >
                  <div className={`w-9 h-9 rounded-full p-0.5 shrink-0 ${isViewingOfficialStory ? 'bg-gradient-to-tr from-amber-400 to-emerald-600' : 'bg-gradient-to-tr from-amber-500 to-emerald-500'}`}>
                    <img
                      src={activeGroup.avatar_url || '/logo.png'}
                      alt={activeGroup.name}
                      onError={(e) => {
                        e.currentTarget.src = '/logo.png';
                      }}
                      className="w-full h-full rounded-full object-cover bg-white"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold leading-tight truncate group-hover:underline">
                        {activeGroup.name}
                      </p>
                      {isViewingOfficialStory && (
                        <span className="text-[10px] text-amber-400 font-bold">✓</span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/70 font-mono truncate">
                      {activeGroup.village}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Delete own story button */}
                  {(activeGroup.username === (user?.handle || 'citizen_farmer') || (user as any)?.is_official) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteStory(activeStory.id)}
                      className="h-8 px-2.5 rounded-full bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                      title="Delete Story"
                    >
                      <span>🗑️</span>
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveStoryGroupIndex(null)}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white font-black text-sm flex items-center justify-center transition cursor-pointer ring-1 ring-white/40 shrink-0"
                    title="Close Story (ESC)"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Story Media */}
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
              <img
                src={activeStory.media_url}
                alt="Story content"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80';
                }}
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 flex">
                <div onClick={handlePrevStory} className="w-1/3 h-full cursor-pointer" />
                <div onClick={handleNextStory} className="w-2/3 h-full cursor-pointer" />
              </div>
            </div>

            {/* Bottom Story Controls */}
            <div className="p-4 sm:p-5 z-30 bg-gradient-to-t from-black/95 via-black/70 to-transparent text-white space-y-2 pb-8 sm:pb-5 backdrop-blur-xs">
              {isEditingStory ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editStoryCaption}
                    onChange={(e) => setEditStoryCaption(e.target.value)}
                    placeholder="Edit caption..."
                    className="flex-1 h-9 px-3 text-xs rounded-xl bg-white/20 border border-white/30 text-white placeholder:text-white/60 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveStoryEdit(activeStory.id)}
                    className="h-9 px-3 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingStory(false)}
                    className="h-9 px-2.5 bg-white/20 text-white text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  {activeStory.caption && (
                    <p className="text-xs sm:text-sm font-medium leading-relaxed drop-shadow-md">
                      {activeStory.caption}
                    </p>
                  )}
                  {(activeGroup.username === (user?.handle || 'citizen_farmer') || (user as any)?.is_official) && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditStoryCaption(activeStory.caption || '');
                        setIsEditingStory(true);
                      }}
                      className="px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-[10px] text-white font-mono shrink-0 cursor-pointer"
                    >
                      ✏️ Edit
                    </button>
                  )}
                </div>
              )}

              {isViewingOfficialStory ? (
                <div className="py-2 px-3 rounded-full bg-white/15 border border-white/25 text-center text-[11px] font-semibold text-amber-300">
                  Official Portal Broadcast • Direct Replies Disabled
                </div>
              ) : (
                <form onSubmit={handleSendStoryReply} className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={storyReplyText}
                    onChange={(e) => setStoryReplyText(e.target.value)}
                    placeholder={`Reply to @${activeGroup.username}...`}
                    className="flex-1 h-10 px-4 text-xs rounded-full bg-white/20 border border-white/30 text-white placeholder:text-white/60 focus:bg-white/30 focus:outline-none transition"
                  />
                  <button
                    type="submit"
                    disabled={!storyReplyText.trim()}
                    className="h-10 px-4 rounded-full bg-white text-slate-900 text-xs font-bold disabled:opacity-40 transition cursor-pointer shrink-0"
                  >
                    Send
                  </button>
                </form>
              )}

              {storyReplySent && (
                <p className="text-[11px] text-emerald-400 text-center font-bold">
                  Sent to farmer's direct inbox!
                </p>
              )}
            </div>
          </div>

          {/* Desktop Right Nav Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNextStory();
            }}
            className="hidden md:flex absolute right-8 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md text-white items-center justify-center transition border border-white/20 shadow-lg cursor-pointer"
            title="Next Story"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* 6. EDIT POST MODAL */}
      {editingPost && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl animate-sleek">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">✏️ Edit Post</h3>
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Caption &amp; Hashtags</label>
                <textarea
                  rows={4}
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-slate-900"
                  placeholder="Share your crop update or advisory..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Crop Tag</label>
                  <input
                    type="text"
                    value={editCropTag}
                    onChange={(e) => setEditCropTag(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-slate-900"
                    placeholder="e.g. Sugarcane, Tomato"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Topic</label>
                  <input
                    type="text"
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-slate-900"
                    placeholder="e.g. Organic, Harvest"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Location</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-slate-900"
                  placeholder="e.g. Mandya, Karnataka"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingPostEdit || !editCaption.trim()}
                onClick={handleSavePostEdit}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                {isSavingPostEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instagram-Style Bottom Navigation Bar */}
      <ChaupalBottomNav />
    </div>
  );
}

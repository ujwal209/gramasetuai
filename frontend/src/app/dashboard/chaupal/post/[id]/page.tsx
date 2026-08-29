'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  getChaupalPost,
  toggleChaupalPostLike,
  addChaupalPostComment,
  type ChaupalPost,
} from '@/services/api';
import { ChaupalBottomNav } from '@/components/ChaupalBottomNav';

export default function SinglePostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const postId = params?.id as string;

  const [post, setPost] = useState<ChaupalPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; username: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (postId) loadPost();
  }, [postId]);

  const loadPost = async () => {
    setIsLoading(true);
    try {
      const res = await getChaupalPost(postId);
      if (res && res.post) setPost(res.post);
    } catch (err) {
      console.warn('Error loading post:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    try {
      const res = await toggleChaupalPostLike(post.id, user?.handle || 'citizen_farmer');
      const isLiked = post.likes_users?.includes(user?.handle || 'citizen_farmer');
      const newUsers = isLiked
        ? (post.likes_users || []).filter((u) => u !== (user?.handle || 'citizen_farmer'))
        : [...(post.likes_users || []), user?.handle || 'citizen_farmer'];

      setPost({
        ...post,
        likes_count: isLiked ? Math.max(0, post.likes_count - 1) : post.likes_count + 1,
        likes_users: newUsers,
      });
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !post) return;

    setIsSubmitting(true);
    try {
      const res = await addChaupalPostComment(post.id, {
        text: commentText.trim(),
        parent_comment_id: replyingTo?.commentId,
        reply_to_username: replyingTo?.username,
        username: user?.handle || 'citizen_farmer',
        name: user?.name || 'Citizen Farmer',
        avatar_url: user?.avatar_url || '/logo.png',
      });

      if (res && res.comment) {
        setPost({
          ...post,
          comments: [...(post.comments || []), res.comment],
        });
        setCommentText('');
        setReplyingTo(null);
      }
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const shareToWhatsApp = () => {
    if (!post) return;
    const text = `Check out this post from ${post.author.name} (@${post.author.username}) on Kisan Chaupal:\n\n"${post.caption}"\n\nView on GramSetu: https://gramsetu.in/dashboard/chaupal/post/${post.id}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-16 text-center space-y-3">
        <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-mono">Loading post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-md mx-auto p-12 text-center space-y-4 bg-white rounded-3xl border border-slate-200 shadow-xs mt-8">
        <h2 className="text-sm font-bold text-slate-900">Post Not Found</h2>
        <p className="text-xs text-slate-500">This post may have been removed or the link is expired.</p>
        <Link
          href="/dashboard/chaupal"
          className="inline-block px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
        >
          Back to Community Feed
        </Link>
      </div>
    );
  }

  const isLiked = post.likes_users?.includes(user?.handle || 'citizen_farmer');
  const isOfficial = post.author.username === 'gramsetu_official' || (post.author as any).is_official;

  const parentComments = (post.comments || []).filter((c) => !c.parent_id);
  const repliesMap: Record<string, typeof post.comments> = {};
  (post.comments || []).forEach((c) => {
    if (c.parent_id) {
      repliesMap[c.parent_id] = [...(repliesMap[c.parent_id] || []), c];
    }
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <Link
          href="/dashboard/chaupal"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 font-mono"
        >
          <span>← Back to Feed</span>
        </Link>
        <span className="text-[10px] font-mono text-slate-400">
          {new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      {/* Main Post Card */}
      <article className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Post Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100">
          <Link
            href={`/dashboard/chaupal/profile/${post.author.username}`}
            className="flex items-center gap-3 group"
          >
            <div className={`w-10 h-10 rounded-full p-0.5 ${isOfficial ? 'bg-gradient-to-tr from-amber-400 to-emerald-600' : 'bg-gradient-to-tr from-emerald-500 to-amber-500'}`}>
              <img
                src={post.author.avatar_url || '/logo.png'}
                alt={post.author.name}
                className="w-full h-full rounded-full object-cover bg-white"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
                  {post.author.name}
                </span>
                {post.author.is_verified && (
                  <span className="text-emerald-600 text-xs font-bold">✓</span>
                )}
                {isOfficial && (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold font-mono">
                    OFFICIAL PORTAL
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                @{post.author.username} • {post.location || post.author.village}
              </p>
            </div>
          </Link>

          {!isOfficial && (
            <Link
              href={`/dashboard/chaupal/messages?user=${post.author.username}`}
              className="px-3 py-1 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-700 transition"
            >
              Message
            </Link>
          )}
        </div>

        {/* Media */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="bg-slate-950 aspect-4/3 sm:aspect-16/10 flex items-center justify-center overflow-hidden">
            <img
              src={post.media_urls[0]}
              alt={post.caption}
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80';
              }}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Actions & Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleLike}
                className="flex items-center gap-1.5 text-xs font-bold transition cursor-pointer"
              >
                <svg
                  className={`w-6 h-6 ${isLiked ? 'text-rose-600 fill-rose-600' : 'text-slate-800 fill-none'}`}
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

              <button
                type="button"
                onClick={shareToWhatsApp}
                className="text-xs font-bold text-slate-800 hover:text-emerald-700 transition flex items-center gap-1 cursor-pointer"
                title="Share"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Share</span>
              </button>
            </div>

            {post.crop_tag && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                {post.crop_tag}
              </span>
            )}
          </div>

          {/* Caption */}
          <div className="text-xs sm:text-sm text-slate-800 leading-relaxed space-y-2">
            <p>{post.caption}</p>
            {post.hashtags && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {post.hashtags.map((h, idx) => (
                  <span key={idx} className="text-emerald-700 font-bold text-xs">
                    {h}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Nested Comments Section */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
              Comments &amp; Discussion ({post.comments?.length || 0})
            </h3>

            <div className="space-y-3">
              {parentComments.map((c) => {
                const subReplies = repliesMap[c.id] || [];

                return (
                  <div key={c.id} className="space-y-2">
                    <div className="flex items-start gap-2.5 text-xs leading-relaxed">
                      <Link href={`/dashboard/chaupal/profile/${c.username}`} className="shrink-0">
                        <img
                          src={c.avatar_url || '/logo.png'}
                          alt={c.name}
                          onError={(e) => {
                            e.currentTarget.src = '/logo.png';
                          }}
                          className="w-6 h-6 rounded-full object-cover mt-0.5 hover:ring-1 hover:ring-slate-400"
                        />
                      </Link>
                      <div className="flex-1">
                        <p>
                          <Link
                            href={`/dashboard/chaupal/profile/${c.username}`}
                            className="font-bold text-slate-900 mr-1.5 hover:text-emerald-700 hover:underline"
                          >
                            {c.username}
                          </Link>
                          <span className="text-slate-700">{c.text}</span>
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 font-mono">
                          <span>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <button
                            type="button"
                            onClick={() => setReplyingTo({ commentId: c.id, username: c.username })}
                            className="font-bold text-emerald-700 hover:underline cursor-pointer"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Sub-replies */}
                    {subReplies.length > 0 && (
                      <div className="ml-8 pl-3 border-l-2 border-slate-200 space-y-2">
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
                                  onClick={() => setReplyingTo({ commentId: c.id, username: sub.username })}
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

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-100 space-y-2">
              {replyingTo && (
                <div className="flex items-center justify-between text-[11px] bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 text-emerald-900">
                  <span>Replying to <strong>@{replyingTo.username}</strong></span>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="text-slate-500 hover:text-slate-900 font-bold"
                  >
                    ✕ Cancel
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : 'Add a comment...'}
                  className="flex-1 h-10 px-4 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-slate-900 transition"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || isSubmitting}
                  className="h-10 px-5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      </article>

      {/* Instagram Bottom Nav */}
      <ChaupalBottomNav />
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  getChaupalNotifications,
  markChaupalNotificationsRead,
  deleteChaupalNotification,
  toggleChaupalFollow,
  type ChaupalNotification,
} from '@/services/api';
import {
  Bell,
  UserPlus,
  MessageCircle,
  Heart,
  Sparkles,
  CheckCheck,
  Trash2,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<ChaupalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'messages' | 'follows' | 'activity'>('all');
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadNotifications();
  }, [user?.handle]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await getChaupalNotifications(user?.handle || 'citizen_farmer', 50);
      if (res && res.success) {
        const notifs = res.notifications || [];
        setNotifications(notifs);
        setUnreadCount(res.unread_count || 0);

        const initialFollowMap: Record<string, boolean> = {};
        notifs.forEach((n) => {
          if (n.actor_handle && typeof n.is_following === 'boolean') {
            const h = n.actor_handle.toLowerCase().replace(/^@/, '').trim();
            initialFollowMap[h] = n.is_following;
          }
        });
        setFollowingMap((prev) => ({ ...initialFollowMap, ...prev }));
      }
    } catch (err: any) {
      console.warn('Error loading notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markChaupalNotificationsRead(user?.handle || 'citizen_farmer');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All activity marked as read');
    } catch (err: any) {
      console.error('Error marking read:', err);
      toast.error(err?.response?.data?.detail || 'Failed to mark all read');
    }
  };

  const handleNotificationClick = async (notif: ChaupalNotification) => {
    if (!notif.is_read) {
      try {
        await markChaupalNotificationsRead(user?.handle || 'citizen_farmer', notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Error marking single notification read:', err);
      }
    }
    if (notif.action_url) {
      router.push(notif.action_url);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    try {
      await deleteChaupalNotification(notifId);
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      toast.success('Notification removed');
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      toast.error(err?.response?.data?.detail || 'Failed to remove notification');
    }
  };

  const handleFollowBack = async (e: React.MouseEvent, rawHandle: string) => {
    e.stopPropagation();
    const handle = rawHandle.toLowerCase().replace(/^@/, '').trim();
    const willFollow = !followingMap[handle];
    setFollowingMap((prev) => ({ ...prev, [handle]: willFollow }));
    try {
      const res = await toggleChaupalFollow(handle, {
        username: user?.handle || 'citizen_farmer',
        name: user?.name || 'Citizen Farmer',
        avatar_url: user?.avatar_url || '/logo.png',
      });
      if (res && res.success) {
        setFollowingMap((prev) => ({ ...prev, [handle]: res.following }));
        toast.success(res.message || (res.following ? `Now following @${handle}` : `Unfollowed @${handle}`));
      }
    } catch (err: any) {
      setFollowingMap((prev) => ({ ...prev, [handle]: !willFollow }));
      const errorMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to update follow';
      toast.error(errorMsg);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.is_read;
    if (activeTab === 'messages') return n.type === 'message' || n.type === 'story_reply';
    if (activeTab === 'follows') return n.type === 'follow';
    if (activeTab === 'activity') return n.type === 'like' || n.type === 'comment' || n.type === 'marketplace';
    return true;
  });

  const getTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const getBadgeIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return (
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <UserPlus className="w-3 h-3" />
          </span>
        );
      case 'message':
      case 'story_reply':
        return (
          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <MessageCircle className="w-3 h-3" />
          </span>
        );
      case 'like':
        return (
          <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs">
            <Heart className="w-3 h-3 fill-current" />
          </span>
        );
      default:
        return (
          <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-3 h-3" />
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto pb-24 animate-in fade-in duration-200">
      {/* 1. Header Bar */}
      <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Activity &amp; Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Real-time updates on followers, direct messages, crop queries, and discussions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Mark all as read</span>
            </button>
          )}

          <Link
            href="/dashboard/chaupal/messages"
            className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>Direct Messages</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. Filter Navigation Pills */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/70 rounded-2xl w-fit max-w-full overflow-x-auto border border-slate-200/60">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer shrink-0 ${
            activeTab === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('unread')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer shrink-0 ${
            activeTab === 'unread'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Unread ({unreadCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('follows')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer shrink-0 ${
            activeTab === 'follows'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Followers
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('messages')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer shrink-0 ${
            activeTab === 'messages'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Messages
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer shrink-0 ${
            activeTab === 'activity'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Likes &amp; Comments
        </button>
      </div>

      {/* 3. Stream List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="p-16 rounded-3xl border border-slate-200 bg-white text-center space-y-3 shadow-xs">
            <div className="w-7 h-7 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-mono">Syncing activity feed...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-14 rounded-3xl border border-slate-200 bg-white text-center space-y-2 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-lg">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No activity yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeTab === 'unread'
                ? "You're all caught up! No unread notifications at the moment."
                : 'When other farmers connect or interact with your updates, you will see notifications here.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-4 group shadow-2xs ${
                notif.is_read
                  ? 'bg-white border-slate-200/80 hover:bg-slate-50/70 text-slate-800'
                  : 'bg-emerald-500/[0.04] border-emerald-300/60 hover:bg-emerald-500/[0.07] text-slate-900 ring-1 ring-emerald-500/10'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* Actor Avatar with Action Badge */}
                <div className="relative shrink-0">
                  <img
                    src={notif.actor_avatar || '/logo.png'}
                    alt={notif.actor_name}
                    onError={(e) => {
                      e.currentTarget.src = '/logo.png';
                    }}
                    className="w-12 h-12 rounded-full object-cover ring-1 ring-slate-200 bg-white shadow-2xs"
                  />
                  <div className="absolute -bottom-1 -right-1">
                    {getBadgeIcon(notif.type)}
                  </div>
                </div>

                {/* Content Details */}
                <div className="space-y-0.5 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-slate-800 leading-snug break-words">
                    <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition">
                      @{notif.actor_handle}
                    </span>{' '}
                    {notif.type === 'follow' ? (
                      <span className="text-slate-600">started following your farm updates &amp; harvests.</span>
                    ) : notif.type === 'message' ? (
                      <span>
                        <span className="text-slate-600">sent you a direct message: </span>
                        <span className="italic text-slate-900 font-medium font-sans">"{notif.text}"</span>
                      </span>
                    ) : notif.type === 'story_reply' ? (
                      <span>
                        <span className="text-slate-600">replied to your 24h story: </span>
                        <span className="italic text-slate-900 font-medium font-sans">"{notif.text}"</span>
                      </span>
                    ) : notif.type === 'like' ? (
                      <span className="text-slate-600">liked your post.</span>
                    ) : (
                      <span className="text-slate-600">{notif.text}</span>
                    )}
                  </p>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {getTimeAgo(notif.created_at)}
                    </span>
                    {!notif.is_read && (
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wider">
                        New
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons (IG Style) */}
              <div className="flex items-center gap-2 shrink-0">
                {notif.type === 'follow' && (
                  (() => {
                    const actorKey = notif.actor_handle?.toLowerCase().replace(/^@/, '').trim() || '';
                    const isFollowingActor = followingMap[actorKey] ?? notif.is_following ?? false;
                    return (
                      <button
                        type="button"
                        onClick={(e) => handleFollowBack(e, notif.actor_handle)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 shadow-2xs ${
                          isFollowingActor
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isFollowingActor ? 'Following ✓' : 'Follow Back'}
                      </button>
                    );
                  })()
                )}

                {(notif.type === 'message' || notif.type === 'story_reply') && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/chaupal/messages?user=${notif.actor_handle}`);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all duration-150 cursor-pointer shadow-2xs active:scale-95"
                  >
                    Reply
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => handleDeleteNotification(e, notif.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="Remove Notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

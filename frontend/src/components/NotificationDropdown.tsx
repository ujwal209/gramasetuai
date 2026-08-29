'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Heart,
  Bell,
  UserPlus,
  MessageCircle,
  Check,
  CheckCheck,
  Trash2,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface NotificationDropdownProps {
  variant?: 'navbar' | 'mobile_header' | 'sidebar';
}

export function NotificationDropdown({ variant = 'navbar' }: NotificationDropdownProps) {
  const router = useRouter();
  const { user } = useAuth();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<ChaupalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'follows' | 'messages' | 'activity'>('all');
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await getChaupalNotifications(user?.handle || 'citizen_farmer', 30);
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
    } catch (err) {
      console.warn('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, [user?.handle]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markChaupalNotificationsRead(user?.handle || 'citizen_farmer');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err: any) {
      console.error('Failed to mark all read:', err);
      toast.error(err?.response?.data?.detail || 'Failed to mark notifications read');
    }
  };

  const handleItemClick = async (notif: ChaupalNotification) => {
    if (!notif.is_read) {
      try {
        await markChaupalNotificationsRead(user?.handle || 'citizen_farmer', notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    }
    setIsOpen(false);
    if (notif.action_url) {
      router.push(notif.action_url);
    }
  };

  const handleFollowToggle = async (e: React.MouseEvent, rawHandle: string, name: string) => {
    e.stopPropagation();
    e.preventDefault();
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

  const handleDeleteItem = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await deleteChaupalNotification(notifId);
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      toast.success('Notification removed');
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'now';
      if (diffMins < 60) return `${diffMins}m`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d`;
    } catch {
      return '';
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'follows') return n.type === 'follow';
    if (activeFilter === 'messages') return n.type === 'message' || n.type === 'story_reply';
    if (activeFilter === 'activity') return n.type === 'like' || n.type === 'comment' || n.type === 'marketplace';
    return true;
  });

  const getBadgeIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return (
          <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] shadow-xs">
            <UserPlus className="w-2.5 h-2.5" />
          </span>
        );
      case 'message':
      case 'story_reply':
        return (
          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] shadow-xs">
            <MessageCircle className="w-2.5 h-2.5" />
          </span>
        );
      case 'like':
        return (
          <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px] shadow-xs">
            <Heart className="w-2.5 h-2.5 fill-current" />
          </span>
        );
      default:
        return (
          <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] shadow-xs">
            <Sparkles className="w-2.5 h-2.5" />
          </span>
        );
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      {/* Top Navbar Trigger */}
      <button
        type="button"
        onClick={handleToggleOpen}
        className={`relative p-2 rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 active:scale-95'
        }`}
        title="Activity & Notifications"
        aria-label="Activity & Notifications"
      >
        <Heart
          className={`w-5 h-5 transition-transform duration-200 ${
            unreadCount > 0
              ? 'fill-rose-500 text-rose-500 scale-105'
              : isOpen
              ? 'fill-current'
              : 'hover:scale-105'
          }`}
        />

        {/* Unread dot / badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* High-End Responsive Popover (IG Style) */}
      {isOpen && (
        <>
          {/* Mobile Overlay Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-950/20 backdrop-blur-xs z-40 sm:hidden transition-opacity animate-in fade-in"
          />

          {/* Popover Card */}
          <div className="fixed top-14 left-2 right-2 sm:absolute sm:top-full sm:left-auto sm:right-0 sm:mt-2.5 w-auto sm:w-[400px] bg-white/98 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.18)] z-50 overflow-hidden flex flex-col max-h-[calc(100dvh-75px)] sm:max-h-[520px] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white/90 shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-bold text-slate-900 tracking-tight">
                Activity
              </h3>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">All caught up</span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100/80 bg-slate-50/50">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('follows')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeFilter === 'follows'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              Follows
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('messages')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeFilter === 'messages'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              Messages
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('activity')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeFilter === 'activity'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              Interactions
            </button>
          </div>

          {/* Notifications Scroll Stream */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100/70 overscroll-contain">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-2">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Bell className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">No activity to show</h4>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                  {activeFilter === 'all'
                    ? 'When other farmers connect, comment, or message you, notifications will appear here in real time.'
                    : 'No notifications matching this filter.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3 px-4 hover:bg-slate-50/80 transition-colors duration-150 cursor-pointer flex items-center justify-between gap-3 group relative ${
                    !notif.is_read ? 'bg-emerald-500/[0.04]' : 'bg-white'
                  }`}
                >
                  {/* Left: Avatar with Status + Body */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <img
                        src={notif.actor_avatar || '/logo.png'}
                        alt={notif.actor_name}
                        onError={(e) => {
                          e.currentTarget.src = '/logo.png';
                        }}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200/80 bg-white"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5">
                        {getBadgeIcon(notif.type)}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 text-xs leading-snug space-y-0.5">
                      <p className="text-slate-800 break-words line-clamp-2">
                        <span className="font-bold text-slate-900 hover:underline">
                          @{notif.actor_handle}
                        </span>{' '}
                        {notif.type === 'follow' ? (
                          <span className="text-slate-600">started following you.</span>
                        ) : notif.type === 'message' ? (
                          <span className="text-slate-600">
                            sent a message: <span className="italic text-slate-900 font-medium">"{notif.text}"</span>
                          </span>
                        ) : notif.type === 'story_reply' ? (
                          <span className="text-slate-600">
                            replied to story: <span className="italic text-slate-900 font-medium">"{notif.text}"</span>
                          </span>
                        ) : notif.type === 'like' ? (
                          <span className="text-slate-600">liked your farm update.</span>
                        ) : (
                          <span className="text-slate-600">{notif.text}</span>
                        )}
                      </p>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {getTimeAgo(notif.created_at)}
                        </span>
                        {!notif.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        )}
                      </div>
                    </div>
                  </div>

                    {/* Follow Back Button (IG Style) */}
                    {notif.type === 'follow' && (
                      (() => {
                        const actorKey = notif.actor_handle?.toLowerCase().replace(/^@/, '').trim() || '';
                        const isFollowingActor = followingMap[actorKey] ?? notif.is_following ?? false;
                        if (isFollowingActor) {
                          return (
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-semibold text-slate-500 bg-slate-100/90 border border-slate-200/80 shrink-0 select-none flex items-center gap-1">
                              <span>✓</span>
                              <span>Following</span>
                            </span>
                          );
                        }
                        return (
                          <button
                            type="button"
                            onClick={(e) => handleFollowToggle(e, notif.actor_handle, notif.actor_name)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition-all duration-150 cursor-pointer shadow-xs shrink-0"
                          >
                            Follow Back
                          </button>
                        );
                      })()
                    )}

                    {/* Reply to DM Button */}
                    {(notif.type === 'message' || notif.type === 'story_reply') && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          router.push(`/dashboard/chaupal/messages?user=${notif.actor_handle}`);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all duration-150 cursor-pointer shadow-2xs active:scale-95"
                      >
                        Reply
                      </button>
                    )}

                    {/* Delete item button */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(e, notif.id)}
                      className="p-1 rounded-md text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Dismiss notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 px-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between shrink-0">
            <Link
              href="/dashboard/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition flex items-center gap-1"
            >
              <span>View full activity hub</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/dashboard/chaupal/messages"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              Direct Messages
            </Link>
          </div>
        </div>
      </>
    )}
  </div>
);
}

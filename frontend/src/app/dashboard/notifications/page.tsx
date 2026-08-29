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

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<ChaupalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'messages' | 'follows' | 'activity'>('all');
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  // Dispatch preferences state
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [user?.handle]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await getChaupalNotifications(user?.handle || 'citizen_farmer');
      if (res && res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unread_count || 0);
      }
    } catch (err) {
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
    } catch (err) {
      console.error('Error marking read:', err);
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
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleFollowBack = async (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    try {
      const res = await toggleChaupalFollow(handle, {
        username: user?.handle || 'citizen_farmer',
        name: user?.name || 'Citizen Farmer',
      });
      if (res && res.success) {
        setFollowingMap((prev) => ({ ...prev, [handle]: res.following }));
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <span className="p-1.5 rounded-full bg-blue-100 text-blue-700 text-xs">👥</span>;
      case 'message':
      case 'story_reply':
        return <span className="p-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs">💬</span>;
      case 'like':
        return <span className="p-1.5 rounded-full bg-rose-100 text-rose-700 text-xs">❤️</span>;
      case 'comment':
        return <span className="p-1.5 rounded-full bg-amber-100 text-amber-700 text-xs">💭</span>;
      case 'marketplace':
        return <span className="p-1.5 rounded-full bg-purple-100 text-purple-700 text-xs">🌾</span>;
      default:
        return <span className="p-1.5 rounded-full bg-slate-100 text-slate-700 text-xs">🔔</span>;
    }
  };

  return (
    <div className="space-y-6 text-left animate-sleek max-w-5xl mx-auto pb-16">
      {/* 1. HEADER BANNER */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold font-mono uppercase">
              NOTIFICATIONS &amp; DIRECT ALERTS
            </span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Citizen Notification Center
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Real-time notifications for direct messages, new farmer followers, crop discussions, and statutory dispatch alerts.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>✓ Mark All Read</span>
            </button>
          )}
          <Link
            href="/dashboard/chaupal/messages"
            className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>Open Inbox →</span>
          </Link>
        </div>
      </div>

      {/* 2. TABS & FILTER */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white font-bold shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unread')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'unread'
                ? 'bg-slate-900 text-white font-bold shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('messages')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'messages'
                ? 'bg-slate-900 text-white font-bold shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            💬 Messages
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('follows')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'follows'
                ? 'bg-slate-900 text-white font-bold shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            👥 Followers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'activity'
                ? 'bg-slate-900 text-white font-bold shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ❤️ Likes &amp; Comments
          </button>
        </div>
      </div>

      {/* 3. LIVE NOTIFICATIONS LIST */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="p-16 rounded-2xl border border-slate-200 bg-white text-center space-y-3 shadow-xs">
            <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-mono">Syncing notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 rounded-2xl border border-slate-200 bg-white text-center space-y-2 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">No Notifications</h3>
            <p className="text-xs text-slate-500">
              {activeTab === 'unread' ? 'You are all caught up!' : 'No activity under this filter.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3.5 group shadow-2xs ${
                notif.is_read
                  ? 'bg-white border-slate-200/80 hover:bg-slate-50/70 text-slate-800'
                  : 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50/70 text-slate-900'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                {/* Actor Avatar with Type Badge */}
                <div className="relative shrink-0">
                  <img
                    src={notif.actor_avatar || '/logo.png'}
                    alt={notif.actor_name}
                    onError={(e) => {
                      e.currentTarget.src = '/logo.png';
                    }}
                    className="w-11 h-11 rounded-full object-cover border border-slate-200 bg-white"
                  />
                  <div className="absolute -bottom-1 -right-1">
                    {getNotificationIcon(notif.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
                      {notif.actor_name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      @{notif.actor_handle}
                    </span>
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    )}
                  </div>

                  {/* Message snippet or event text */}
                  <p className="text-xs text-slate-700 leading-relaxed break-words">
                    {notif.type === 'message' ? (
                      <span>
                        <span className="font-semibold text-slate-900">sent you a direct message: </span>
                        <span className="italic text-slate-600 font-serif">{notif.text}</span>
                      </span>
                    ) : notif.type === 'story_reply' ? (
                      <span>
                        <span className="font-semibold text-slate-900">replied to your story: </span>
                        <span className="italic text-slate-600 font-serif">{notif.text}</span>
                      </span>
                    ) : (
                      <span>{notif.text}</span>
                    )}
                  </p>

                  <span className="text-[10px] text-slate-400 font-mono block">
                    {getTimeAgo(notif.created_at)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 pt-1">
                {notif.type === 'follow' && (
                  <button
                    type="button"
                    onClick={(e) => handleFollowBack(e, notif.actor_handle)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs ${
                      followingMap[notif.actor_handle]
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    }`}
                  >
                    {followingMap[notif.actor_handle] ? 'Following ✓' : 'Follow Back +'}
                  </button>
                )}

                {notif.type === 'message' && (
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/chaupal/messages?user=${notif.actor_handle}`)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer shadow-2xs hidden sm:inline-block"
                  >
                    Reply →
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => handleDeleteNotification(e, notif.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="Remove Notification"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. MULTI-CHANNEL DISPATCH PREFERENCES */}
      <div className="pt-4 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono px-1">
          Automated Broadcast Channels
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* WhatsApp Channel */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-sm">
                  WA
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">WhatsApp Official Bot</h4>
                  <p className="text-[11px] text-slate-500">{user?.phone || '+91 98765 43210'}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                  whatsappEnabled
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {whatsappEnabled ? '✓ CONNECTED' : 'DISABLED'}
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Directly receive digital PDFs of Parchaa receipts and DBT subsidy confirmation alerts via official WhatsApp bot.
            </p>
          </div>

          {/* SMS Dispatcher Channel */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center font-bold text-sm">
                  SMS
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Govt NIC-SMS Gateway</h4>
                  <p className="text-[11px] text-slate-500">Statutory SMS alerts</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSmsEnabled(!smsEnabled)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                  smsEnabled
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {smsEnabled ? '✓ ACTIVE' : 'DISABLED'}
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Standard text alerts in your regional language for DBT subsidy approvals and application stage progression.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

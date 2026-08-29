'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  getChaupalConversations,
  getChaupalChatHistory,
  sendChaupalDirectMessage,
  searchChaupalMessageableUsers,
  sendChaupalTypingStatus,
  getChaupalTypingStatus,
  getChaupalFarmerProfile,
  toggleChaupalArchiveChat,
  getChaupalArchivedChats,
  toggleChaupalBlockUser,
  getChaupalBlockedUsers,
  clearChaupalChatHistory,
  reactToChaupalMessage,
} from '@/services/api';
import { uploadToCloudinary, uploadAudioToCloudinary } from '@/lib/cloudinary';
import { ChaupalBottomNav } from '@/components/ChaupalBottomNav';

// Voice Note Audio Player Component
function VoiceNotePlayer({ voiceUrl, isMe }: { voiceUrl: string; isMe: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-2xl ${
        isMe ? 'bg-emerald-700/60 text-white' : 'bg-slate-100 text-slate-900'
      }`}
    >
      <audio
        ref={audioRef}
        src={voiceUrl}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration || 0);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />

      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 shadow-xs ${
          isMe ? 'bg-white text-emerald-700 hover:bg-emerald-50' : 'bg-emerald-600 text-white hover:bg-emerald-700'
        }`}
      >
        {isPlaying ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Waveform Visualization Bars */}
      <div className="flex-1 flex items-center gap-1 h-6">
        {[40, 70, 90, 60, 100, 75, 45, 85, 95, 60, 80, 50, 65, 40].map((h, i) => {
          const progress = duration > 0 ? currentTime / duration : 0;
          const barProgress = (i + 1) / 14;
          const isActive = progress >= barProgress || (isPlaying && Math.random() > 0.4);

          return (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                isActive
                  ? isMe
                    ? 'bg-white'
                    : 'bg-emerald-600'
                  : isMe
                  ? 'bg-emerald-400/50'
                  : 'bg-slate-300'
              }`}
              style={{ height: `${Math.max(20, (h * (isPlaying ? 1.2 : 1)) % 100)}%` }}
            />
          );
        })}
      </div>

      <div className={`text-[10px] font-mono shrink-0 ${isMe ? 'text-emerald-100' : 'text-slate-500'}`}>
        <span>{formatTime(currentTime > 0 ? currentTime : duration)}</span>
      </div>
    </div>
  );
}

// Emoji Categories
const EMOJI_CATEGORIES = [
  {
    name: 'Farming & Nature',
    emojis: ['🌾', '🚜', '🌱', '🌽', '🍅', '🥭', '🍌', '🥔', '🧅', '🥥', '🌿', '🌻', '🐄', '🐂', '🐐', '🐓', '☀️', '🌧️', '💧', '🪴'],
  },
  {
    name: 'Reactions & Expressions',
    emojis: ['😊', '😂', '😃', '😍', '😎', '🤗', '🤔', '😅', '🤝', '👍', '🙏', '🔥', '👏', '🎉', '💯', '💚', '🇮🇳', '❤️', '👌', '✨'],
  },
  {
    name: 'Trade & Mandi Deals',
    emojis: ['📦', '💰', '💳', '🚚', '⚖️', '🏷️', '📄', '📞', '📍', '🛒', '⏱️', '📊', '🤝', '✅', '❌'],
  },
];

// WhatsApp-style Date Header Formatting Helper
function formatMessageDateSeparator(dateString: string): string {
  if (!dateString) return 'Today';
  const msgDate = new Date(dateString);
  if (isNaN(msgDate.getTime())) return 'Today';

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday =
    msgDate.getDate() === today.getDate() &&
    msgDate.getMonth() === today.getMonth() &&
    msgDate.getFullYear() === today.getFullYear();

  if (isToday) return 'Today';

  const isYesterday =
    msgDate.getDate() === yesterday.getDate() &&
    msgDate.getMonth() === yesterday.getMonth() &&
    msgDate.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  return msgDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: msgDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

// WhatsApp-style Conversation List Timestamp Helper
function formatConversationListTime(dateString: string): string {
  if (!dateString) return '';
  const msgDate = new Date(dateString);
  if (isNaN(msgDate.getTime())) return '';

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday =
    msgDate.getDate() === today.getDate() &&
    msgDate.getMonth() === today.getMonth() &&
    msgDate.getFullYear() === today.getFullYear();

  if (isToday) {
    return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const isYesterday =
    msgDate.getDate() === yesterday.getDate() &&
    msgDate.getMonth() === yesterday.getMonth() &&
    msgDate.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  return msgDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function ChaupalMessagesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const currentHandle = user?.handle || 'citizen_farmer';
  const targetUserParam = searchParams.get('user') || searchParams.get('to') || searchParams.get('handle');

  // State
  const [conversations, setConversations] = useState<Array<any>>([]);
  const [archivedHandles, setArchivedHandles] = useState<string[]>([]);
  const [blockedHandles, setBlockedHandles] = useState<string[]>([]);
  const [activeUser, setActiveUser] = useState<{ handle: string; name: string; avatar: string } | null>(null);
  const [messages, setMessages] = useState<Array<any>>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'inbox' | 'archived' | 'directory'>('inbox');
  const [isSending, setIsSending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  // In-Chat Search
  const [inChatSearchOpen, setInChatSearchOpen] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');

  // Replying / Quoting message state
  const [replyingToMessage, setReplyingToMessage] = useState<any | null>(null);

  // In-Sidebar Farmer Search
  const [directoryUsers, setDirectoryUsers] = useState<Array<any>>([]);
  const [isSearchingDirectory, setIsSearchingDirectory] = useState(false);

  // Options & Dropdowns
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [expandedImageId, setExpandedImageId] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  // Voice Note Recording State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chatMenuRef = useRef<HTMLDivElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (chatMenuRef.current && !chatMenuRef.current.contains(e.target as Node)) {
        setIsChatMenuOpen(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Detect scroll position to show "scroll to bottom" button
  const handleMessagesScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight > 180) {
      setShowScrollBottom(true);
    } else {
      setShowScrollBottom(false);
    }
  };

  const scrollToBottom = () => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  // 1. Initial Load & Handle `?user=...` parameter directly from profile click
  useEffect(() => {
    const initializeChat = async () => {
      // Load archive and blocked lists
      try {
        const [archRes, blkRes] = await Promise.all([
          getChaupalArchivedChats(currentHandle),
          getChaupalBlockedUsers(currentHandle),
        ]);
        if (archRes?.archived_handles) setArchivedHandles(archRes.archived_handles);
        if (blkRes?.blocked_handles) setBlockedHandles(blkRes.blocked_handles);
      } catch (err) {
        console.warn('Error loading chat preferences:', err);
      }

      // If a target user was passed via URL parameter:
      if (targetUserParam && targetUserParam !== currentHandle) {
        try {
          const profileRes = await getChaupalFarmerProfile(targetUserParam, currentHandle);
          if (profileRes && profileRes.profile) {
            setActiveUser({
              handle: profileRes.profile.username,
              name: profileRes.profile.name,
              avatar: profileRes.profile.avatar_url || '/logo.png',
            });
            loadMessagesForActiveUser(profileRes.profile.username);
          } else {
            setActiveUser({
              handle: targetUserParam,
              name: targetUserParam,
              avatar: '/logo.png',
            });
            loadMessagesForActiveUser(targetUserParam);
          }
        } catch {
          setActiveUser({
            handle: targetUserParam,
            name: targetUserParam,
            avatar: '/logo.png',
          });
          loadMessagesForActiveUser(targetUserParam);
        }
      }

      // Load conversations
      loadConversationsList();
    };

    initializeChat();
    const interval = setInterval(loadConversationsList, 4000);
    return () => clearInterval(interval);
  }, [currentHandle, targetUserParam]);

  // 2. Load active chat history & poll for new messages & typing status
  useEffect(() => {
    if (!activeUser) return;
    loadMessagesForActiveUser(activeUser.handle);

    const msgInterval = setInterval(() => {
      loadMessagesForActiveUser(activeUser.handle);
    }, 2000);

    const typingInterval = setInterval(async () => {
      try {
        const res = await getChaupalTypingStatus(activeUser.handle, currentHandle);
        if (res && typeof res.is_typing === 'boolean') {
          setIsOtherTyping(res.is_typing);
        }
      } catch {}
    }, 1800);

    return () => {
      clearInterval(msgInterval);
      clearInterval(typingInterval);
    };
  }, [activeUser, currentHandle]);

  // 3. Search directory of farmers inline in sidebar
  useEffect(() => {
    if (sidebarTab !== 'directory' && !searchQuery.trim()) return;

    const fetchFarmers = async () => {
      setIsSearchingDirectory(true);
      try {
        const res = await searchChaupalMessageableUsers(searchQuery.trim(), currentHandle);
        if (res && res.users) {
          setDirectoryUsers(res.users);
        }
      } catch (err) {
        console.warn('Error searching farmers directory:', err);
      } finally {
        setIsSearchingDirectory(false);
      }
    };

    const debounceTimer = setTimeout(fetchFarmers, 250);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, sidebarTab, currentHandle]);

  const loadConversationsList = async () => {
    try {
      const res = await getChaupalConversations(currentHandle);
      if (res && res.conversations) {
        const filtered = res.conversations.filter(
          (c) => c.other_handle !== 'gramsetu_official' && c.other_handle !== 'gramsetu_gov'
        );
        setConversations(filtered);

        // On desktop only: if no user is active and no query param, select the first conversation
        if (typeof window !== 'undefined' && window.innerWidth >= 640) {
          if (!activeUser && !targetUserParam && filtered.length > 0) {
            const firstNonArchived = filtered.find((c) => !archivedHandles.includes(c.other_handle)) || filtered[0];
            setActiveUser({
              handle: firstNonArchived.other_handle,
              name: firstNonArchived.other_name,
              avatar: firstNonArchived.other_avatar,
            });
          }
        }
      }
    } catch (err) {
      console.warn('Error loading conversations:', err);
    }
  };

  const loadMessagesForActiveUser = async (handle: string) => {
    try {
      const res = await getChaupalChatHistory(handle, currentHandle);
      if (res && res.messages) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.warn('Error loading messages:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!activeUser) return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    sendChaupalTypingStatus(activeUser.handle, currentHandle, true);

    typingTimerRef.current = setTimeout(() => {
      sendChaupalTypingStatus(activeUser.handle, currentHandle, false);
    }, 2500);
  };

  const handleAddEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeUser) return;
    if (blockedHandles.includes(activeUser.handle)) return;

    const textToSend = inputText.trim();
    const quotedPayload = replyingToMessage
      ? {
          reply_to: {
            id: replyingToMessage.id,
            sender_name: replyingToMessage.sender_name,
            text: replyingToMessage.text || (replyingToMessage.voice_url ? 'Voice message' : 'Photo attachment'),
          },
        }
      : {};

    setInputText('');
    setReplyingToMessage(null);
    setIsSending(true);

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    sendChaupalTypingStatus(activeUser.handle, currentHandle, false);

    try {
      const res = await sendChaupalDirectMessage(activeUser.handle, {
        text: textToSend,
        sender_handle: currentHandle,
        sender_name: user?.name || 'Citizen Farmer',
        sender_avatar: user?.avatar_url || '/logo.png',
        ...quotedPayload,
      });

      if (res && res.message) {
        setMessages((prev) => [...prev, res.message]);
        loadConversationsList();
        setTimeout(() => {
          chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 60);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !activeUser) return;
    if (blockedHandles.includes(activeUser.handle)) return;
    const file = e.target.files[0];
    setIsUploadingImage(true);

    try {
      const uploadRes = await uploadToCloudinary(file, 'chaupal_chat_images');
      const res = await sendChaupalDirectMessage(activeUser.handle, {
        text: 'Sent a photo',
        image_url: uploadRes.secure_url,
        sender_handle: currentHandle,
        sender_name: user?.name || 'Citizen Farmer',
        sender_avatar: user?.avatar_url || '/logo.png',
      });

      if (res && res.message) {
        setMessages((prev) => [...prev, res.message]);
        loadConversationsList();
        setTimeout(() => {
          chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 60);
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Photo upload failed. Please try again.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- Voice Note Recording Handlers ---
  const startRecording = async () => {
    if (!activeUser || blockedHandles.includes(activeUser.handle)) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecordingVoice(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Microphone permission is required to record voice notes.');
    }
  };

  const stopAndCancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  const stopAndSendRecording = async () => {
    if (!activeUser || !mediaRecorderRef.current) return;

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    const durationSec = recordingSeconds;
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
    setIsUploadingVoice(true);

    mediaRecorderRef.current.onstop = async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());

        const uploadRes = await uploadAudioToCloudinary(audioBlob, 'chaupal_voice_notes');
        const res = await sendChaupalDirectMessage(activeUser.handle, {
          text: 'Voice note',
          voice_url: uploadRes.secure_url,
          voice_duration: durationSec,
          sender_handle: currentHandle,
          sender_name: user?.name || 'Citizen Farmer',
          sender_avatar: user?.avatar_url || '/logo.png',
        });

        if (res && res.message) {
          setMessages((prev) => [...prev, res.message]);
          loadConversationsList();
          setTimeout(() => {
            chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 60);
        }
      } catch (err) {
        console.error('Failed to send voice note:', err);
        alert('Failed to send voice note. Please try again.');
      } finally {
        setIsUploadingVoice(false);
      }
    };

    mediaRecorderRef.current.stop();
  };

  // --- Archive & Block Handlers ---
  const handleToggleArchive = async () => {
    if (!activeUser) return;
    try {
      const res = await toggleChaupalArchiveChat(activeUser.handle, currentHandle);
      if (res && res.success) {
        setArchivedHandles((prev) =>
          res.is_archived
            ? [...prev, activeUser.handle]
            : prev.filter((h) => h !== activeUser.handle)
        );
        setIsChatMenuOpen(false);
      }
    } catch (err) {
      console.error('Archive error:', err);
    }
  };

  const handleToggleBlock = async () => {
    if (!activeUser) return;
    try {
      const res = await toggleChaupalBlockUser(activeUser.handle, currentHandle);
      if (res && res.success) {
        setBlockedHandles((prev) =>
          res.is_blocked
            ? [...prev, activeUser.handle]
            : prev.filter((h) => h !== activeUser.handle)
        );
        setIsChatMenuOpen(false);
      }
    } catch (err) {
      console.error('Block error:', err);
    }
  };

  const handleClearHistory = async () => {
    if (!activeUser) return;
    if (!confirm(`Are you sure you want to clear chat history with ${activeUser.name}?`)) return;
    try {
      const res = await clearChaupalChatHistory(activeUser.handle, currentHandle);
      if (res && res.success) {
        setMessages([]);
        loadConversationsList();
        setIsChatMenuOpen(false);
      }
    } catch (err) {
      console.error('Clear history error:', err);
    }
  };

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    try {
      const res = await reactToChaupalMessage(messageId, emoji, currentHandle);
      if (res && res.success) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions: res.reactions } : m))
        );
      }
    } catch (err) {
      console.error('Reaction error:', err);
    }
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const handleSelectFarmer = (farmer: any) => {
    setActiveUser({
      handle: farmer.username,
      name: farmer.name,
      avatar: farmer.avatar_url || '/logo.png',
    });
    setSidebarTab('inbox');
    setSearchQuery('');
  };

  const activeConversations = conversations.filter(
    (c) => !archivedHandles.includes(c.other_handle)
  );

  const archivedConversations = conversations.filter(
    (c) => archivedHandles.includes(c.other_handle)
  );

  const filteredConversations = (
    sidebarTab === 'archived' ? archivedConversations : activeConversations
  ).filter(
    (c) =>
      c.other_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.other_handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isCurrentActiveBlocked = activeUser ? blockedHandles.includes(activeUser.handle) : false;
  const isCurrentActiveArchived = activeUser ? archivedHandles.includes(activeUser.handle) : false;

  // Filter messages if in-chat search query is active
  const displayedMessages = inChatSearchQuery.trim()
    ? messages.filter(
        (m) =>
          m.text?.toLowerCase().includes(inChatSearchQuery.toLowerCase()) ||
          m.sender_name?.toLowerCase().includes(inChatSearchQuery.toLowerCase())
      )
    : messages;

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col overflow-hidden min-h-0 text-left bg-[#f8fafc] select-none">
      {/* Copied Toast */}
      {copiedToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg animate-in fade-in zoom-in-95 duration-150">
          Message text copied!
        </div>
      )}

      {/* Full-Width Edge-to-Edge Split Screen */}
      <div className="w-full h-full max-h-full flex-1 min-h-0 flex overflow-hidden">
        {/* LEFT COLUMN: CONVERSATIONS & DIRECTORY */}
        <div
          className={`w-full sm:w-80 md:w-92 border-r border-slate-200 bg-white flex flex-col shrink-0 min-h-0 h-full max-h-full ${
            activeUser ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {/* Header & Tabs */}
          <div className="p-3 border-b border-slate-100 bg-white space-y-2.5 shrink-0">
            {/* Mobile Top Bar */}
            <div className="sm:hidden flex items-center justify-between pb-1">
              <Link
                href="/dashboard/chaupal"
                className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 font-mono"
              >
                <span>← Kisan Feed</span>
              </Link>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                @{currentHandle}
              </span>
            </div>

            {/* Tab Switcher: Chats vs Archived vs Find Farmers */}
            <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setSidebarTab('inbox')}
                className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer truncate px-1 ${
                  sidebarTab === 'inbox'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chats ({activeConversations.length})
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('archived')}
                className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer truncate px-1 ${
                  sidebarTab === 'archived'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Archive ({archivedConversations.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setSidebarTab('directory');
                }}
                className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer truncate px-1 ${
                  sidebarTab === 'directory'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Directory
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  sidebarTab === 'directory'
                    ? 'Search farmers by name or village...'
                    : sidebarTab === 'archived'
                    ? 'Search archived chats...'
                    : 'Search active conversations...'
                }
                className="w-full h-9 pl-9 pr-3 text-xs rounded-xl bg-slate-100/80 border border-transparent focus:bg-white focus:border-slate-800 transition focus:outline-none placeholder:text-slate-400 text-slate-800"
              />
              <svg
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 pb-24 sm:pb-0 overscroll-contain">
            {sidebarTab === 'inbox' || sidebarTab === 'archived' ? (
              // 1. Conversations List (Active or Archived)
              filteredConversations.length === 0 ? (
                <div className="p-8 text-center space-y-2 text-slate-400">
                  <p className="text-xs font-bold text-slate-700">
                    {sidebarTab === 'archived' ? 'No archived chats' : 'No active conversations'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {sidebarTab === 'archived'
                      ? 'Archived chats will appear here for reference.'
                      : 'Switch to Directory to start a new chat with registered farmers.'}
                  </p>
                  {sidebarTab === 'inbox' && (
                    <button
                      type="button"
                      onClick={() => setSidebarTab('directory')}
                      className="mt-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-xs transition"
                    >
                      Browse Farmers Directory →
                    </button>
                  )}
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isActive = activeUser?.handle === c.other_handle;
                  const isBlocked = blockedHandles.includes(c.other_handle);

                  return (
                    <button
                      key={c.other_handle}
                      type="button"
                      onClick={() => {
                        setActiveUser({
                          handle: c.other_handle,
                          name: c.other_name,
                          avatar: c.other_avatar,
                        });
                      }}
                      className={`w-full p-3.5 flex items-start gap-3 transition text-left cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50/70 border-r-4 border-emerald-600'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-slate-200 bg-slate-100 relative">
                        <img
                          src={c.other_avatar || '/logo.png'}
                          alt={c.other_name}
                          onError={(e) => {
                            e.currentTarget.src = '/logo.png';
                          }}
                          className="w-full h-full object-cover"
                        />
                        {isBlocked ? (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[9px] font-bold text-white">
                            🚫
                          </div>
                        ) : (
                          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-bold truncate text-slate-900">
                              {c.other_name}
                            </span>
                            {isBlocked && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[8px] font-bold">
                                Blocked
                              </span>
                            )}
                          </div>
                          {/* WhatsApp-Style List Timestamp (e.g. 10:45 AM, Yesterday, 28 Aug) */}
                          <span className="text-[10px] font-mono shrink-0 text-slate-400">
                            {formatConversationListTime(c.last_message_time)}
                          </span>
                        </div>

                        <p className="text-[11px] truncate text-slate-500">
                          {c.last_message || 'Photo / Voice note'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )
            ) : (
              // 2. Farmer Directory Search
              isSearchingDirectory ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 font-mono">Searching registered farmers...</p>
                </div>
              ) : directoryUsers.length === 0 ? (
                <div className="p-8 text-center space-y-1 text-slate-400">
                  <p className="text-xs font-bold text-slate-700">No farmers found</p>
                  <p className="text-[11px] text-slate-400">Try searching another village or name.</p>
                </div>
              ) : (
                directoryUsers.map((u) => (
                  <button
                    key={u.username}
                    type="button"
                    onClick={() => handleSelectFarmer(u)}
                    className="w-full p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
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
                        <p className="text-xs font-bold text-slate-900 truncate">{u.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">
                          @{u.username} • {u.village}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl shrink-0 transition">
                      Chat →
                    </span>
                  </button>
                ))
              )
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE CHAT VIEW */}
        {activeUser ? (
          <div className="flex-1 min-h-0 flex flex-col bg-[#f0f2f5] overflow-hidden relative h-full max-h-full">
            {/* Chat Header */}
            <div className="p-3 sm:px-6 border-b border-slate-200/80 flex items-center justify-between bg-white shadow-2xs shrink-0 z-10">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveUser(null)}
                  className="sm:hidden p-1.5 -ml-1.5 rounded-xl hover:bg-slate-100 text-slate-700 cursor-pointer"
                  title="Back to conversations"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <Link
                  href={`/dashboard/chaupal/profile/${activeUser.handle}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100 relative shrink-0">
                    <img
                      src={activeUser.avatar || '/logo.png'}
                      alt={activeUser.name}
                      onError={(e) => {
                        e.currentTarget.src = '/logo.png';
                      }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                        {activeUser.name}
                      </h2>
                      {isCurrentActiveArchived && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[9px] font-mono font-bold border border-slate-200">
                          Archived
                        </span>
                      )}
                      {isCurrentActiveBlocked && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[9px] font-mono font-bold border border-rose-200">
                          Blocked
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {isOtherTyping ? (
                        <span className="text-emerald-600 font-bold animate-pulse">Typing...</span>
                      ) : (
                        `@${activeUser.handle}`
                      )}
                    </p>
                  </div>
                </Link>
              </div>

              {/* Chat Actions & Search & Three-Dot Dropdown Menu */}
              <div className="flex items-center gap-2 relative" ref={chatMenuRef}>
                {/* Search in chat toggle */}
                <button
                  type="button"
                  onClick={() => setInChatSearchOpen((prev) => !prev)}
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                    inChatSearchOpen ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                  title="Search inside conversation"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>

                <Link
                  href={`/dashboard/chaupal/profile/${activeUser.handle}`}
                  className="hidden sm:inline-flex px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-700 transition shadow-2xs"
                >
                  Profile
                </Link>

                <button
                  type="button"
                  onClick={() => setIsChatMenuOpen((prev) => !prev)}
                  className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition cursor-pointer"
                  title="Chat Settings"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isChatMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 z-50 text-xs font-semibold animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={handleToggleArchive}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      <span>{isCurrentActiveArchived ? 'Unarchive Chat' : 'Archive Chat'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleBlock}
                      className={`w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer ${
                        isCurrentActiveBlocked ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <span>{isCurrentActiveBlocked ? 'Unblock Farmer' : 'Block Farmer'}</span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={handleClearHistory}
                      className="w-full px-4 py-2 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2.5 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Clear Chat History</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* In-Chat Search Bar */}
            {inChatSearchOpen && (
              <div className="p-2.5 bg-white border-b border-slate-200 flex items-center gap-2 shrink-0 animate-in slide-in-from-top-2 duration-150">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inChatSearchQuery}
                    onChange={(e) => setInChatSearchQuery(e.target.value)}
                    placeholder="Search in this conversation..."
                    className="w-full h-8 pl-8 pr-3 text-xs rounded-xl bg-slate-100 border border-transparent focus:bg-white focus:border-slate-800 transition focus:outline-none"
                    autoFocus
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
                <button
                  type="button"
                  onClick={() => {
                    setInChatSearchQuery('');
                    setInChatSearchOpen(false);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 px-2 py-1 cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

            {/* Messages Scroll Area with WhatsApp-Style Date Badges */}
            <div
              ref={messagesContainerRef}
              onScroll={handleMessagesScroll}
              className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 space-y-2.5 overscroll-contain"
            >
              {displayedMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-2xs">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    {inChatSearchQuery ? 'No matching messages found' : 'No messages yet'}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    {inChatSearchQuery
                      ? 'Try searching another word or phrase.'
                      : `Say hello to ${activeUser.name} to discuss crops, Mandi prices, or trade produce.`}
                  </p>
                </div>
              ) : (
                displayedMessages.map((m, index) => {
                  const isMe = m.sender_handle === currentHandle;
                  const isExpanded = expandedImageId === m.id;
                  const isHovered = hoveredMessageId === m.id;
                  const reactions = m.reactions || {};
                  const reactionEntries = Object.entries(reactions);

                  // WhatsApp-Style Date Separators: Compare with previous message date
                  const prevMessage = index > 0 ? displayedMessages[index - 1] : null;
                  const currentDateSeparator = formatMessageDateSeparator(m.created_at);
                  const prevDateSeparator = prevMessage ? formatMessageDateSeparator(prevMessage.created_at) : null;
                  const showDateSeparator = !prevMessage || currentDateSeparator !== prevDateSeparator;

                  return (
                    <React.Fragment key={m.id || Math.random()}>
                      {/* WhatsApp Sticky Date Header Badge */}
                      {showDateSeparator && (
                        <div className="flex justify-center my-4 sticky top-2 z-10 select-none">
                          <span className="px-3.5 py-1 rounded-xl bg-white/95 backdrop-blur-md text-[11px] font-bold text-slate-700 shadow-2xs border border-slate-200/90 uppercase tracking-wider font-mono">
                            {currentDateSeparator}
                          </span>
                        </div>
                      )}

                      <div
                        onMouseEnter={() => setHoveredMessageId(m.id)}
                        onMouseLeave={() => setHoveredMessageId(null)}
                        onDoubleClick={() => handleReactToMessage(m.id, '❤️')}
                        className={`flex flex-col relative group ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        {/* Floating Quick Actions & Reactions Toolbar on Hover */}
                        {isHovered && !isCurrentActiveBlocked && (
                          <div
                            className={`absolute -top-7 z-10 flex items-center gap-1 bg-white border border-slate-200 rounded-full px-2 py-0.5 shadow-md animate-in fade-in zoom-in-95 duration-100 ${
                              isMe ? 'right-2' : 'left-2'
                            }`}
                          >
                            {['👍', '❤️', '🌾', '😂', '🙏'].map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleReactToMessage(m.id, emoji)}
                                className="text-xs hover:scale-125 transition cursor-pointer p-0.5"
                              >
                                {emoji}
                              </button>
                            ))}

                            <div className="w-[1px] h-3 bg-slate-200 mx-0.5" />

                            {/* Reply Action */}
                            <button
                              type="button"
                              onClick={() => setReplyingToMessage(m)}
                              className="p-1 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition cursor-pointer"
                              title="Reply to message"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2m0 0l-4-4m4 4l4-4" />
                              </svg>
                            </button>

                            {/* Copy Action */}
                            {m.text && (
                              <button
                                type="button"
                                onClick={() => handleCopyMessage(m.text)}
                                className="p-1 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition cursor-pointer"
                                title="Copy text"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}

                        <div
                          className={`max-w-[85%] sm:max-w-md rounded-2xl p-3 shadow-xs relative ${
                            isMe
                              ? 'bg-emerald-600 text-white rounded-tr-xs'
                              : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                          }`}
                        >
                          {/* WhatsApp Quoted Reply Preview */}
                          {m.reply_to && (
                            <div
                              className={`mb-2 p-2 rounded-xl text-xs border-l-3 ${
                                isMe
                                  ? 'bg-emerald-700/60 border-white/80 text-white'
                                  : 'bg-slate-100 border-emerald-600 text-slate-700'
                              }`}
                            >
                              <span className="font-bold text-[10px] block opacity-90">
                                {m.reply_to.sender_name}
                              </span>
                              <p className="truncate text-[11px] opacity-80">{m.reply_to.text}</p>
                            </div>
                          )}

                          {/* Attached Photo */}
                          {m.image_url && (
                            <div
                              onClick={() => setExpandedImageId(isExpanded ? null : m.id)}
                              className={`mb-2 rounded-xl overflow-hidden cursor-pointer bg-black/10 transition-all ${
                                isExpanded ? 'max-h-96' : 'max-h-56'
                              }`}
                            >
                              <img
                                src={m.image_url}
                                alt="Attachment"
                                className="w-full h-full object-cover hover:opacity-95 transition"
                              />
                            </div>
                          )}

                          {/* Attached Voice Note */}
                          {m.voice_url ? (
                            <VoiceNotePlayer voiceUrl={m.voice_url} isMe={isMe} />
                          ) : (
                            m.text && (
                              <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                                {m.text}
                              </p>
                            )
                          )}

                          {/* Timestamp & WhatsApp-Style Double Blue / White Ticks */}
                          <div
                            className={`text-[9px] font-mono mt-1 flex items-center justify-end gap-1 ${
                              isMe ? 'text-emerald-100' : 'text-slate-400'
                            }`}
                          >
                            <span>
                              {m.created_at
                                ? new Date(m.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                            {isMe && (
                              <span
                                className={`font-bold text-[10px] ${m.read ? 'text-cyan-300' : 'text-emerald-200'}`}
                                title={m.read ? 'Read by recipient' : 'Delivered'}
                              >
                                ✓✓
                              </span>
                            )}
                          </div>

                          {/* Reaction Badges */}
                          {reactionEntries.length > 0 && (
                            <div
                              className={`absolute -bottom-2.5 flex items-center gap-1 bg-white border border-slate-200 rounded-full px-1.5 py-0.5 shadow-xs ${
                                isMe ? 'right-2' : 'left-2'
                              }`}
                            >
                              {reactionEntries.map(([handle, emo]) => (
                                <span key={handle} className="text-[11px]" title={`Reacted by @${handle}`}>
                                  {emo as string}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}

              {/* Typing Bubble */}
              {isOtherTyping && (
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3.5 py-2 rounded-2xl w-fit shadow-2xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                </div>
              )}

              <div ref={chatScrollRef} />
            </div>

            {/* Floating Scroll to Bottom Button */}
            {showScrollBottom && (
              <button
                type="button"
                onClick={scrollToBottom}
                className="absolute bottom-20 right-6 w-9 h-9 rounded-full bg-white text-slate-800 border border-slate-200 shadow-md flex items-center justify-center hover:bg-slate-50 transition cursor-pointer z-20 hover:scale-105"
                title="Scroll to latest messages"
              >
                <svg className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            )}

            {/* Blocked State Notice vs Voice Bar vs Input Form */}
            {isCurrentActiveBlocked ? (
              <div className="p-4 bg-rose-50 border-t border-rose-200 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-rose-600 font-bold text-xs">🚫</span>
                  <span className="text-xs font-semibold text-rose-800">
                    You have blocked this farmer. You cannot send or receive messages.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleBlock}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs shrink-0"
                >
                  Unblock Farmer
                </button>
              </div>
            ) : isRecordingVoice ? (
              <div className="p-3 bg-rose-50 border-t border-rose-200 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
                  <span className="text-xs font-bold text-rose-800 font-mono">
                    Recording audio... 0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={stopAndCancelRecording}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-100 text-xs font-bold text-rose-700 transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={stopAndSendRecording}
                    className="px-4 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                  >
                    Send Audio →
                  </button>
                </div>
              </div>
            ) : (
              /* Normal Input Form with WhatsApp-style Reply Quote & Floating Emoji Picker */
              <div className="relative bg-white border-t border-slate-200/80 shrink-0" ref={emojiPickerRef}>
                {/* Quoted Message Banner (WhatsApp-style) */}
                {replyingToMessage && (
                  <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-150">
                    <div className="border-l-3 border-emerald-600 pl-2.5 min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-emerald-800 block">
                        Replying to {replyingToMessage.sender_name}
                      </span>
                      <p className="text-xs text-slate-500 truncate">
                        {replyingToMessage.text || (replyingToMessage.voice_url ? 'Voice message' : 'Photo')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingToMessage(null)}
                      className="w-6 h-6 rounded-full hover:bg-slate-200 flex items-center justify-center text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Custom Emoji Picker Popover */}
                {isEmojiPickerOpen && (
                  <div className="absolute bottom-full left-3 mb-2 w-72 sm:w-80 bg-white rounded-3xl border border-slate-200 shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-900">Select Emoji</span>
                      <button
                        type="button"
                        onClick={() => setIsEmojiPickerOpen(false)}
                        className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {EMOJI_CATEGORIES.map((cat) => (
                        <div key={cat.name} className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 block">
                            {cat.name}
                          </span>
                          <div className="grid grid-cols-7 gap-1">
                            {cat.emojis.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleAddEmoji(emoji)}
                                className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-base transition hover:scale-125 cursor-pointer"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="p-2.5 sm:p-3 flex items-center gap-2">
                  {/* Photo Upload */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {/* Emoji Picker Button */}
                  <button
                    type="button"
                    onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center transition cursor-pointer shrink-0 ${
                      isEmojiPickerOpen ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                    }`}
                    title="Insert Emoji"
                  >
                    <span className="text-base">😊</span>
                  </button>

                  <button
                    type="button"
                    disabled={isUploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer shrink-0"
                    title="Send Photo"
                  >
                    {isUploadingImage ? (
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>

                  {/* Voice Note Button */}
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={isUploadingVoice}
                    className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer shrink-0"
                    title="Record Voice Note"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>

                  {/* Text Input */}
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder={`Message ${activeUser.name}...`}
                    className="flex-1 h-9 px-3.5 text-xs sm:text-sm rounded-xl bg-slate-100/80 border border-transparent focus:bg-white focus:border-slate-800 transition focus:outline-none placeholder:text-slate-400 text-slate-800"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer shrink-0 shadow-xs gap-1.5"
                  >
                    {isSending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Send</span>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 bg-[#f8fafc]">
            <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-sm">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Your Agricultural Conversations</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Select a conversation from the left or search the farmer directory to discuss farm yields, pricing, and crop guidance.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Nav on Mobile ONLY when NO active chat is open */}
      {!activeUser && (
        <div className="sm:hidden">
          <ChaupalBottomNav />
        </div>
      )}
    </div>
  );
}

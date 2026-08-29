'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { MarkdownContent } from '@/components/MarkdownContent';
import {
  getNitiragConversations,
  getNitiragConversationById,
  createNitiragConversation,
  updateNitiragConversation,
  deleteNitiragConversation,
  summarizeAndForkNitiragConversation,
  executeNitiragChatTurn,
  getNitiragDocuments,
  type NitiragConversationRecord,
  type NitiragDocumentRecord,
  type ChatMessageRecord,
  type NitiragCitation,
} from '@/services/api';

interface NitiragChatViewProps {
  conversationId?: string;
}

const PROMPT_SUGGESTIONS = [
  {
    category: 'Solar & Energy Subsidies',
    title: 'PM-KUSUM Component B Solar Subsidy',
    query: 'What is the 90% capital subsidy eligibility criteria for small farmers under PM-KUSUM Component B solar pump installations?',
  },
  {
    category: 'Irrigation & Water Rights',
    title: 'PMKSY Micro-Irrigation Guidelines',
    query: 'How do small & marginal farmers qualify for 90% drip and sprinkler irrigation subsidies under PMKSY?',
  },
  {
    category: 'Land & Revenue Records',
    title: 'RTC Land Mutation & Dispute Resolution',
    query: 'What is the statutory legal procedure for RTC agricultural land mutation, survey number succession, and dispute resolution?',
  },
  {
    category: 'Direct Benefit Transfers',
    title: 'Raitha Siri Millet & Crop Compensation',
    query: 'What are the DBT eligibility norms and document requirements for Raitha Siri millet cultivation and PMFBY crop loss claims?',
  },
];

export function NitiragChatView({ conversationId }: NitiragChatViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [conversations, setConversations] = useState<NitiragConversationRecord[]>([]);
  const [activeConv, setActiveConv] = useState<NitiragConversationRecord | null>(null);
  const [documents, setDocuments] = useState<NitiragDocumentRecord[]>([]);

  const [inputText, setInputText] = useState('');
  const [loadingTurn, setLoadingTurn] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'active' | 'archived'>('active');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [isDocPickerOpen, setIsDocPickerOpen] = useState(false);
  const [expandedSourcesMsgId, setExpandedSourcesMsgId] = useState<string | null>(null);
  const [enableWebSearch, setEnableWebSearch] = useState<boolean>(false);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [likedMessages, setLikedMessages] = useState<Record<string, 'liked' | 'disliked'>>({});

  // Load initial data on mount
  const loadInitialData = async () => {
    try {
      const [convs, docs] = await Promise.all([
        getNitiragConversations(user?.name || undefined),
        getNitiragDocuments(),
      ]);
      setConversations(convs || []);
      setDocuments(docs.documents || []);

      if (conversationId) {
        loadConversation(conversationId);
      } else if (convs && convs.length > 0) {
        const firstActive = convs.find((c) => !c.is_archived) || convs[0];
        loadConversation(firstActive.id);
      } else {
        handleCreateNewChat();
      }
    } catch (err) {
      console.warn('Initialization notice:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [conversationId]);

  const loadConversation = async (id: string) => {
    setLoadingSession(true);
    try {
      const conv = await getNitiragConversationById(id);
      setActiveConv(conv);
      setEnableWebSearch(conv.enable_web_search || false);
    } catch (err) {
      console.error('Failed to load conversation session:', err);
    } finally {
      setLoadingSession(false);
    }
  };

  const handleCreateNewChat = async (selectedDocIds: string[] = []) => {
    try {
      const newConv = await createNitiragConversation(
        selectedDocIds.length > 0
          ? `Consultation (${selectedDocIds.length} Gazettes)`
          : 'New Legal Consultation',
        selectedDocIds,
        enableWebSearch,
        user?.name || 'citizen'
      );
      setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
      setActiveConv(newConv);
      setIsMobileSidebarOpen(false);
      router.push(`/dashboard/nitirag/chat/${newConv.id}`);
    } catch (err) {
      console.error('Failed to create new chat session:', err);
    }
  };

  const handleToggleArchive = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await updateNitiragConversation(id, { is_archived: !currentStatus });
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, is_archived: !currentStatus } : c)));
      if (activeConv?.id === id) {
        setActiveConv({ ...activeConv, is_archived: !currentStatus });
      }
    } catch (err) {
      console.error('Failed to update archive status:', err);
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to permanently remove this consultation history?')) return;

    try {
      await deleteNitiragConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);

      if (activeConv?.id === id) {
        if (remaining.length > 0) {
          router.push(`/dashboard/nitirag/chat/${remaining[0].id}`);
        } else {
          handleCreateNewChat();
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleSaveTitleEdit = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editTitleValue.trim()) return;

    try {
      await updateNitiragConversation(id, { title: editTitleValue.trim() });
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: editTitleValue.trim() } : c))
      );
      if (activeConv?.id === id) {
        setActiveConv({ ...activeConv, title: editTitleValue.trim() });
      }
      setEditingTitleId(null);
    } catch (err) {
      console.error('Title update failed:', err);
    }
  };

  const handleSummarizeAndFork = async () => {
    if (!activeConv) return;
    setIsSummarizing(true);
    try {
      const forkedConv = await summarizeAndForkNitiragConversation(
        activeConv.id,
        user?.name || 'citizen'
      );
      setConversations((prev) => [
        forkedConv,
        ...prev.map((c) => (c.id === activeConv.id ? { ...c, is_archived: true } : c)),
      ]);
      setActiveConv(forkedConv);
      router.push(`/dashboard/nitirag/chat/${forkedConv.id}`);
    } catch (err) {
      console.error('Summarize and fork error:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const toggleDocSelection = (docId: string) => {
    if (!activeConv) return;
    const current = activeConv.selected_document_ids || [];
    const next = current.includes(docId)
      ? current.filter((id) => id !== docId)
      : [...current, docId];

    const nextTitles = documents
      .filter((d) => next.includes(d.id))
      .map((d) => d.title);

    setActiveConv({
      ...activeConv,
      selected_document_ids: next,
      selected_document_titles: nextTitles,
    });
  };

  const handleCopy = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2500);
  };

  const handleFeedback = (msgId: string, type: 'liked' | 'disliked') => {
    setLikedMessages((prev) => ({ ...prev, [msgId]: type }));
  };

  const triggerChatWithQuery = async (queryText: string) => {
    const query = queryText.trim();
    if (!query || loadingTurn) return;

    setInputText('');
    setLoadingTurn(true);

    const tempUserMsg: ChatMessageRecord = {
      id: `temp-${Date.now()}`,
      role: 'user',
      text: query,
      citations: [],
      created_at: new Date().toISOString(),
    };

    if (activeConv) {
      setActiveConv({
        ...activeConv,
        messages: [...activeConv.messages, tempUserMsg],
      });
    }

    try {
      const updatedConv = await executeNitiragChatTurn({
        conversation_id: activeConv?.id,
        query,
        selected_document_ids: activeConv?.selected_document_ids || [],
        enable_web_search: enableWebSearch,
        language: language,
        state: user?.state || undefined,
        user_id: user?.name || 'citizen',
      });

      setActiveConv(updatedConv);

      if (!conversationId || conversationId !== updatedConv.id) {
        router.replace(`/dashboard/nitirag/chat/${updatedConv.id}`);
      }
    } catch (err) {
      console.error('Chat turn error:', err);
    } finally {
      setLoadingTurn(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerChatWithQuery(inputText);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages, loadingTurn]);

  const selectedCount = activeConv?.selected_document_ids?.length || 0;
  const turnCount = activeConv?.messages ? Math.floor(activeConv.messages.length / 2) : 0;
  const isContextNearLimit = turnCount >= 6;
  const isFreshConversation = !activeConv || activeConv.messages.length <= 1;

  const filteredConversations = conversations
    .filter((c) => (sidebarTab === 'active' ? !c.is_archived : c.is_archived))
    .filter((c) =>
      sidebarSearch.trim() === ''
        ? true
        : c.title.toLowerCase().includes(sidebarSearch.toLowerCase())
    );

  return (
    <div className="flex h-screen w-full bg-white text-slate-900 overflow-hidden text-left antialiased relative">
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* 1. DEDICATED LEFT CHAT SIDEBAR */}
      <aside
        className={`w-72 sm:w-80 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 transition-all duration-200 z-50 md:z-10 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:border-r-0 md:overflow-hidden'
        } ${
          isMobileSidebarOpen
            ? 'fixed inset-y-0 left-0 translate-x-0 bg-white shadow-2xl'
            : 'fixed md:static inset-y-0 left-0'
        }`}
      >
        {/* Top: New Consultation Button & Search */}
        <div className="p-3.5 space-y-2.5 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => handleCreateNewChat()}
              className="flex-1 h-10 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-between shadow-xs cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Consultation</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">AI</span>
            </button>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Filter */}
          <div className="relative">
            <input
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Search past consultations..."
              className="w-full h-8.5 pl-8 pr-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 transition shadow-2xs"
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Tab Filter: Active vs Archived */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSidebarTab('active')}
              className={`flex-1 py-1 rounded-md text-center transition cursor-pointer ${
                sidebarTab === 'active'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab('archived')}
              className={`flex-1 py-1 rounded-md text-center transition cursor-pointer ${
                sidebarTab === 'archived'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Archived
            </button>
          </div>
        </div>

        {/* Middle: Conversations List with Full CRUD */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0 bg-white">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              {sidebarTab === 'active' ? 'No active sessions.' : 'No archived sessions.'}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = activeConv?.id === conv.id;
              const isEditingThis = editingTitleId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    if (activeConv?.id !== conv.id) {
                      router.push(`/dashboard/nitirag/chat/${conv.id}`);
                      setIsMobileSidebarOpen(false);
                    }
                  }}
                  className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 group ${
                    isActive
                      ? 'border-slate-300 bg-slate-50 text-slate-900 font-semibold shadow-2xs'
                      : 'border-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div className="truncate flex-1 min-w-0">
                    {isEditingThis ? (
                      <form onSubmit={(e) => handleSaveTitleEdit(conv.id, e)} className="flex items-center gap-1">
                        <input
                          type="text"
                          autoFocus
                          value={editTitleValue}
                          onChange={(e) => setEditTitleValue(e.target.value)}
                          className="w-full h-6 px-1.5 text-xs rounded border border-emerald-500 bg-white focus:outline-none"
                        />
                        <button type="submit" className="text-xs text-emerald-800 font-bold">Save</button>
                      </form>
                    ) : (
                      <>
                        <p className="text-xs truncate leading-snug">{conv.title}</p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {conv.messages?.length || 0} turns
                          {conv.selected_document_ids?.length > 0 && ` • Scoped (${conv.selected_document_ids.length})`}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Actions on hover */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTitleId(conv.id);
                        setEditTitleValue(conv.title);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer"
                      title="Rename"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleToggleArchive(conv.id, !!conv.is_archived, e)}
                      className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer"
                      title={conv.is_archived ? 'Restore to Active' : 'Archive session'}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="p-1 rounded text-slate-400 hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
                      title="Delete session"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Status */}
        <div className="p-3 border-t border-slate-100 bg-white text-[11px] text-slate-400 font-mono flex items-center justify-between shrink-0">
          <span>{documents.length} Gazettes Indexed</span>
          <span>Turn {turnCount} / 8</span>
        </div>
      </aside>

      {/* 2. MAIN CHAT VIEWPORT */}
      <section className="flex-1 flex flex-col justify-between bg-white overflow-hidden relative min-h-0">
        {/* Modern Minimalist Top Header Navbar */}
        <header className="h-14 px-4 sm:px-6 border-b border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0 z-20">
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle */}
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 768) {
                  setIsMobileSidebarOpen(!isMobileSidebarOpen);
                } else {
                  setIsSidebarOpen(!isSidebarOpen);
                }
              }}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-2xs"
              title="Toggle Consultations Sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Back to Dashboard */}
            <Link
              href="/dashboard"
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition flex items-center gap-1 shadow-2xs"
              title="Return to Main Dashboard"
            >
              <span>←</span>
              <span>Dashboard</span>
            </Link>

            <span className="text-slate-200 hidden sm:inline">|</span>

            {/* Brand Logo & Clean Title */}
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="GramSetu"
                className="h-6 w-auto object-contain"
              />
              <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                Niti RAG Legal AI
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold font-mono hidden sm:inline">
                OFFICIAL GAZETTES
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Document Scope Filter Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDocPickerOpen(!isDocPickerOpen)}
                className={`h-8 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  selectedCount > 0
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">
                  {selectedCount > 0 ? `Scoped (${selectedCount})` : 'All Gazettes'}
                </span>
                <span className="sm:hidden">
                  {selectedCount > 0 ? `${selectedCount} Docs` : 'All'}
                </span>
                <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Scoping Dropdown */}
              {isDocPickerOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 w-72 sm:w-80 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-1.5 animate-sleek max-h-64 overflow-y-auto">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 px-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                      Filter Gazette Scope
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeConv) {
                          setActiveConv({
                            ...activeConv,
                            selected_document_ids: [],
                            selected_document_titles: [],
                          });
                        }
                      }}
                      className="text-[10px] font-bold text-emerald-800 hover:underline"
                    >
                      Select All
                    </button>
                  </div>

                  {documents.map((doc) => {
                    const isChecked = (activeConv?.selected_document_ids || []).includes(doc.id);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => toggleDocSelection(doc.id)}
                        className={`p-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-2 ${
                          isChecked ? 'bg-emerald-50 text-emerald-950 font-semibold border border-emerald-200' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 rounded text-emerald-700"
                        />
                        <span className="truncate flex-1 text-xs">{doc.title}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Context Limit & Summarize Fork */}
            {isContextNearLimit && (
              <button
                type="button"
                disabled={isSummarizing}
                onClick={handleSummarizeAndFork}
                className="h-8 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
                title="Summarize key findings and start fresh consultation"
              >
                {isSummarizing ? <span>Summarizing...</span> : <span>Summarize &amp; Fork →</span>}
              </button>
            )}

            <Link
              href="/dashboard/nitirag/documents"
              className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition hidden lg:inline-flex items-center"
            >
              Gazettes &amp; Vault
            </Link>
            <Link
              href="/dashboard/nitirag/upload"
              className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition hidden md:inline-flex items-center"
            >
              + Upload PDF
            </Link>
          </div>
        </header>

        {/* 3. CENTER VIEWPORT */}
        {isFreshConversation ? (
          /* COMPLETELY NON-SCROLLABLE NEW CHAT VIEWPORT */
          <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-8 py-4 overflow-hidden bg-white">
            <div className="max-w-3xl w-full text-center space-y-6 animate-sleek">
              {/* Brand Header */}
              <div className="space-y-3">
                <div className="w-14 h-14 mx-auto flex items-center justify-center">
                  <img
                    src="/logo.png"
                    alt="GramSetu"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold font-mono">
                    NATIONAL STATUTORY REPOSITORY AI
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    GramSetu Niti RAG Statutory Advisor
                  </h2>
                  <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed font-medium">
                    Statutory AI guidance grounded in official Central &amp; State Government Agricultural Gazettes, PM-KUSUM solar rules, and land dispute regulations.
                  </p>
                </div>
              </div>

              {/* 4 Interactive Prompt Suggestions Cards */}
              <div className="space-y-2 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono px-1">
                  Recommended Statutory Inquiries
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PROMPT_SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => triggerChatWithQuery(item.query)}
                      className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-slate-50/50 text-left transition space-y-1 shadow-2xs group cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="font-bold text-emerald-800 group-hover:text-emerald-900">
                          {item.category}
                        </span>
                        <span className="opacity-0 group-hover:opacity-100 transition text-emerald-700 font-bold">
                          Ask →
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {item.query}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ACTIVE MESSAGE STREAM */
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-6 space-y-8 overscroll-contain min-h-0 bg-white">
            <div className="max-w-4xl mx-auto w-full space-y-8">
              {loadingSession ? (
                <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                  <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Loading consultation history...</p>
                </div>
              ) : (
                activeConv.messages.map((msg, i) => (
                  <div key={msg.id || i} className="w-full space-y-3">
                    {msg.role === 'user' ? (
                      /* USER MESSAGE: Clean Minimalist Pill */
                      <div className="flex justify-end">
                        <div className="max-w-[85%] sm:max-w-[75%] px-5 py-3 rounded-2xl bg-slate-100 text-slate-900 text-sm leading-relaxed font-normal shadow-2xs">
                          {msg.text}
                        </div>
                      </div>
                    ) : (
                      /* ASSISTANT MESSAGE: Flat, Clean, Minimalist */
                      <div className="w-full space-y-3 pt-2">
                        {/* Header Badge */}
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center text-[10px] font-black shrink-0">
                            GS
                          </div>
                          <span className="text-xs font-bold text-slate-900">
                            GramSetu Statutory Advisor
                          </span>
                        </div>

                        {/* Markdown Text Stream */}
                        <div className="prose prose-base max-w-none text-slate-800 leading-relaxed pl-8">
                          <MarkdownContent content={msg.text} />
                        </div>

                        {/* Minimalist Citation Chips */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="pl-8 space-y-2 pt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                                Grounded Gazette Excerpts ({msg.citations.length})
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedSourcesMsgId(
                                    expandedSourcesMsgId === msg.id ? null : msg.id
                                  )
                                }
                                className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer font-mono flex items-center gap-1"
                              >
                                <span>{expandedSourcesMsgId === msg.id ? 'Hide Passages' : 'Inspect Passages'}</span>
                                <span>→</span>
                              </button>
                            </div>

                            {/* Minimalist Citation Pills */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {msg.citations.slice(0, 4).map((c, cIdx) => (
                                <div
                                  key={cIdx}
                                  className="p-3 rounded-xl border border-slate-200/90 hover:border-emerald-400 bg-slate-50/40 hover:bg-slate-50 text-xs space-y-1.5 transition shadow-2xs"
                                >
                                  <div className="flex items-center justify-between text-[10px] font-mono gap-1">
                                    <div className="flex items-center gap-1.5 truncate">
                                      {c.favicon_url && (
                                        <img
                                          src={c.favicon_url}
                                          alt="portal"
                                          className="w-3.5 h-3.5 rounded shrink-0"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                          }}
                                        />
                                      )}
                                      <span className="font-bold text-slate-900 truncate">
                                        {c.document_title}
                                      </span>
                                    </div>
                                    <span className="text-emerald-700 font-bold shrink-0">
                                      {Math.round(c.relevance_score * 100)}% Match
                                    </span>
                                  </div>

                                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight">
                                    "{c.chunk_text}"
                                  </p>

                                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] font-mono">
                                    <span className="text-slate-400">Page {c.page_number}</span>
                                    {c.pdf_url && (
                                      <a
                                        href={c.pdf_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-bold text-emerald-700 hover:underline"
                                      >
                                        {c.source_type === 'web_search' ? 'Open Portal ↗' : 'View PDF Page ↗'}
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Detailed Passages Panel */}
                            {expandedSourcesMsgId === msg.id && (
                              <div className="mt-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 animate-sleek">
                                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">
                                  Full Statutory Passages &amp; Context
                                </span>
                                {msg.citations.map((c, idx) => (
                                  <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                                    <p className="font-bold text-slate-800 text-[11px]">
                                      {c.document_title} (Page {c.page_number})
                                    </p>
                                    <p className="text-[11px] text-slate-600 leading-relaxed italic">
                                      "{c.chunk_text}"
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Minimalist Message Actions Toolbar */}
                        <div className="pl-8 pt-1 flex items-center justify-between text-slate-400">
                          <div className="flex items-center gap-1">
                            {/* Copy Icon */}
                            <button
                              type="button"
                              onClick={() => handleCopy(msg.text, msg.id)}
                              className="p-1.5 rounded-lg hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1 text-xs"
                              title="Copy response"
                            >
                              {copiedMessageId === msg.id ? (
                                <>
                                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="text-[11px] text-emerald-600 font-bold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-[11px]">Copy</span>
                                </>
                              )}
                            </button>

                            {/* Regenerate Icon */}
                            <button
                              type="button"
                              onClick={() => {
                                const lastUser = activeConv.messages
                                  .slice(0, i)
                                  .reverse()
                                  .find((m) => m.role === 'user');
                                if (lastUser) triggerChatWithQuery(lastUser.text);
                              }}
                              className="p-1.5 rounded-lg hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1 text-xs"
                              title="Regenerate answer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span className="text-[11px]">Regenerate</span>
                            </button>
                          </div>

                          {/* Thumbs Up / Down Icons */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleFeedback(msg.id, 'liked')}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                likedMessages[msg.id] === 'liked'
                                  ? 'text-emerald-700 bg-emerald-50 font-bold'
                                  : 'hover:text-slate-700 hover:bg-slate-100'
                              }`}
                              title="Helpful response"
                            >
                              <svg className="w-3.5 h-3.5" fill={likedMessages[msg.id] === 'liked' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                              </svg>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleFeedback(msg.id, 'disliked')}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                likedMessages[msg.id] === 'disliked'
                                  ? 'text-rose-700 bg-rose-50 font-bold'
                                  : 'hover:text-slate-700 hover:bg-slate-100'
                              }`}
                              title="Not helpful"
                            >
                              <svg className="w-3.5 h-3.5" fill={likedMessages[msg.id] === 'disliked' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76 1.004M10 14v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              {loadingTurn && (
                <div className="flex items-center gap-2.5 py-3 pl-8 text-xs text-slate-500 animate-sleek">
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing statutory guidance from gazette records...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* 4. PINNED BOTTOM INPUT BAR */}
        <div className="p-4 sm:px-8 pb-5 border-t border-slate-100 bg-white shrink-0 z-20">
          <div className="max-w-4xl mx-auto w-full space-y-2">
            <form onSubmit={handleSendMessage} className="relative flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask statutory legal question (e.g. PM-KUSUM 90% subsidy qualification, RTC land mutation rules)..."
                className="w-full h-12 pl-4 pr-24 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 transition shadow-2xs"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || loadingTurn}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <span>Send</span>
                <span>→</span>
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400 px-1">
              <button
                type="button"
                onClick={() => setEnableWebSearch(!enableWebSearch)}
                className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  enableWebSearch
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span>Live Web Search: {enableWebSearch ? 'ENABLED' : 'OFF'}</span>
              </button>

              <span>
                GramSetu Niti RAG • Grounded in Official Gazette Directives
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { dashboardTranslations } from '@/lib/dashboardTranslations';
import { MarkdownContent } from '@/components/MarkdownContent';
import { toast } from 'sonner';
import {
  getVaniHistoryById,
  deleteVaniHistoryById,
  type VaniConversationRecord,
} from '@/services/api';

export default function VaniHistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = dashboardTranslations[language]?.vani || dashboardTranslations.en.vani;

  const convId = params.id as string;
  const [conversation, setConversation] = useState<VaniConversationRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetail() {
      if (!convId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getVaniHistoryById(convId);
        setConversation(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Could not find conversation record';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [convId]);

  const handleDelete = async () => {
    try {
      await deleteVaniHistoryById(convId);
      toast.success('Voice consultation record deleted');
      router.push('/dashboard/vanibot/history');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete voice record');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Retrieving full voice session breakdown from database...</p>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500 font-bold">
          !
        </div>
        <h2 className="text-base font-bold text-slate-900">{t.noArchivesTitle}</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">{error || 'This conversation may have been deleted.'}</p>
        <Link
          href="/dashboard/vanibot/history"
          className="inline-block px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl transition"
        >
          {t.backToArchives}
        </Link>
      </div>
    );
  }

  const dateFormatted = conversation.created_at
    ? new Date(conversation.created_at).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recent Session';

  return (
    <div className="space-y-6 text-left animate-sleek max-w-4xl mx-auto pb-16 bg-white">
      {/* 1. TOP HEADER BAR (Fully Localized, Zero Emoticons) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <Link
            href="/dashboard/vanibot/history"
            className="text-xs font-bold text-slate-500 hover:text-slate-900 transition flex items-center gap-1.5 mb-1.5"
          >
            {t.backToArchives}
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {conversation.title}
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {dateFormatted} • {conversation.language.toUpperCase()} DIALECT
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDelete}
            className="px-3.5 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/10 border border-destructive/20 rounded-xl transition cursor-pointer"
          >
            {t.deleteArchive}
          </button>
          <Link
            href="/dashboard/vanibot"
            className="px-4 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition shadow-xs"
          >
            {t.startVoiceCall}
          </Link>
        </div>
      </div>

      {/* 2. AUDIO PLAYBACK PLAYER CARD */}
      {conversation.audio_url && (
        <div className="p-5 sm:p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Cloudinary Audio Playback</h3>
                <p className="text-[10px] text-slate-500 font-mono">Synthesized regional voice MP3</p>
              </div>
            </div>
            <a
              href={conversation.audio_url}
              download="vani_advisory.mp3"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-slate-700 hover:text-emerald-800 transition"
            >
              {t.downloadMp3}
            </a>
          </div>

          <div className="pt-2">
            <audio
              controls
              src={conversation.audio_url}
              className="w-full h-10"
              preload="auto"
            />
          </div>
        </div>
      )}

      {/* 3. AI EXECUTIVE SUMMARY */}
      {conversation.ai_summary && (
        <div className="p-5 sm:p-6 rounded-3xl border border-emerald-200/80 bg-emerald-50/30 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold">
              ✓
            </span>
            <h2 className="text-sm font-bold text-emerald-900 uppercase tracking-wide font-mono">
              {t.aiExecutiveSummary}
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-slate-800 leading-relaxed prose prose-sm max-w-none pl-7">
            <MarkdownContent content={conversation.ai_summary} />
          </div>
        </div>
      )}

      {/* 4. TURN-BY-TURN TRANSCRIPT */}
      <div className="p-5 sm:p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">{t.citizenSpokenQuery} &amp; {t.gazetteGuidance}</h2>
          <span className="text-[10px] font-mono font-bold text-slate-400">TURN BY TURN</span>
        </div>

        <div className="space-y-4">
          {/* User Turn */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-800">
                {t.citizenSpokenQuery} ({conversation.language.toUpperCase()})
              </span>
              <span className="text-slate-400 font-mono text-[10px]">SPEECH INPUT</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 leading-relaxed">
              "{conversation.query_text}"
            </div>
          </div>

          {/* Vani Turn */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-emerald-800">
                {t.gazetteGuidance}
              </span>
              <span className="text-emerald-700 font-mono text-[10px]">GAZETTE GROUNDED</span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/20 border border-emerald-200/60 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
              {conversation.response_text}
            </div>
          </div>
        </div>
      </div>

      {/* 5. MATCHED SCHEMES */}
      {conversation.schemes_matched && conversation.schemes_matched.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">{t.identifiedSchemes}</h2>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              {conversation.schemes_matched.length} IDENTIFIED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {conversation.schemes_matched.map((scheme, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">
                      Welfare Scheme
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      Qualified
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">
                    {scheme.scheme_name || 'Government Welfare Program'}
                  </h4>
                  {scheme.benefit_amount && (
                    <p className="text-[11px] font-bold text-emerald-800 font-mono mt-0.5">
                      {scheme.benefit_amount}
                    </p>
                  )}
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Link
                    href="/dashboard/parchaa"
                    className="flex-1 py-1.5 text-center text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition cursor-pointer shadow-2xs"
                  >
                    {t.applyParchaa}
                  </Link>
                  <Link
                    href="/dashboard/schemes"
                    className="px-3 py-1.5 text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition"
                  >
                    {t.details}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. CITIZEN ACTION CHECKLIST */}
      <div className="p-5 sm:p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900">{t.nextStepsTitle}</h2>
        <div className="space-y-2 text-xs text-slate-700">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-emerald-700 font-bold">1.</span>
            <p>{t.step1}</p>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-emerald-700 font-bold">2.</span>
            <p>{t.step2}</p>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-emerald-700 font-bold">3.</span>
            <p>{t.step3}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MarkdownContent } from './MarkdownContent';
import { useLanguage } from '@/context/LanguageContext';
import { dashboardTranslations } from '@/lib/dashboardTranslations';
import { LanguageType } from '@/components/LanguageDropdown';
import {
  transcribeAudio,
  respondVani,
  saveVaniConversation,
  type CitizenProfile,
  type SchemeData,
  type SchemeMatchResult,
  type VaniSchemeCard,
  type VaniActionLink,
  type VaniSourceCitation,
} from '../services/api';
import { uploadAudioToCloudinary } from '@/lib/cloudinary';

export type VaniState = 'idle' | 'listening' | 'processing' | 'thinking' | 'speaking';

export interface VaniBotProps {
  citizenProfile?: CitizenProfile;
  onOpenSchemeModal?: (scheme: SchemeData | SchemeMatchResult | { scheme_id: string; scheme_name: string }) => void;
  onOpenKagazCheck?: (schemeId?: string) => void;
  onOpenParchaa?: (schemeId: string) => void;
}

interface VaniTurn {
  id: string;
  query: string;
  language: string;
  replyText: string;
  audioBase64?: string | null;
  audioUrl?: string | null;
  schemeCards: VaniSchemeCard[];
  actionLinks: VaniActionLink[];
  sourceCitations: VaniSourceCitation[];
  timestamp: string;
}

const REGIONAL_LANGUAGES: Array<{ code: LanguageType; name: string; label: string }> = [
  { code: 'kn', name: 'ಕನ್ನಡ', label: 'Kannada' },
  { code: 'hi', name: 'हिन्दी', label: 'Hindi' },
  { code: 'en', name: 'English', label: 'English' },
  { code: 'te', name: 'తెలుగు', label: 'Telugu' },
  { code: 'ta', name: 'தமிழ்', label: 'Tamil' },
  { code: 'mr', name: 'मराठी', label: 'Marathi' },
];

const SUGGESTED_QUERIES: Record<LanguageType, string[]> = {
  kn: [
    'ಪಿಎಂ ಕಿಸಾನ್ ₹6,000 ಹಣ ಪಡೆಯುವುದು ಹೇಗೆ?',
    'ಕುಸುಮ್ ಸೋಲಾರ್ ಪಂಪ್ ಸಬ್ಸಿಡಿ ಮಾಹಿತಿ ತಿಳಿಸಿ',
    'ರೈತ ಸಿರಿ ಯೋಜನೆಯ ಅರ್ಹತೆಗಳು ಮತ್ತು ದಾಖಲೆಗಳು',
    'ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ (KCC) ಲೋನ್ ಪ್ರಕ್ರಿಯೆ',
  ],
  hi: [
    'पीएम किसान ₹6,000 की किस्त कैसे प्राप्त करें?',
    'पीएम कुसुम सोलर पंप 60% सब्सिडी योजना',
    'किसान क्रेडिट कार्ड (KCC) लोन कैसे लें?',
    'पीएम आवास योजना ग्रामीण की पात्रता क्या है?',
  ],
  en: [
    'How do I apply for PM-KISAN ₹6,000 annual DBT?',
    'PM KUSUM Solar Pump subsidy eligibility & process',
    'Kisan Credit Card (KCC) collateral-free crop loan',
    'PMAY-G Rural Housing financial subsidy guidelines',
  ],
  te: [
    'పీఎం కిసాన్ ₹6,000 సహాయం ఎలా పొందాలి?',
    'పీఎం కుసుమ్ సోలార్ పంప్ సబ్సిడీ వివరాలు',
    'రైతు భరోసా పథకం అర్హతలు ఏమిటి?',
    'కిసాన్ క్రెడిట్ కార్డు దరఖాస్తు విధానం',
  ],
  ta: [
    'பிஎம் கிசான் ₹6,000 உதவித்தொகை பெறுவது எப்படி?',
    'குசும் சோலார் பம்ப் மானியம் தகுதி விவரங்கள்',
    'உழவர் கடன் அட்டை (KCC) விண்ணப்பிப்பது எப்படி?',
    'கலைஞர் மகளிர் உரிமைத் திட்டம் தகுதி என்ன?',
  ],
  mr: [
    'पीएम किसान ₹6,000 हप्ता कसा मिळवावा?',
    'पीएम कुसुम सौर कृषी पंप योजना अनुदान',
    'किसान क्रेडिट कार्ड (KCC) अर्ज प्रक्रिया',
    'नमो शेतकरी महासन्मान निधी योजना माहिती',
  ],
};

const VANI_STORAGE_SESSION_KEY = 'gramsetu_vani_latest_turn';

export function VaniBot({
  citizenProfile,
  onOpenSchemeModal,
  onOpenKagazCheck,
  onOpenParchaa,
}: VaniBotProps) {
  const { language, setLanguage } = useLanguage();
  const t = dashboardTranslations[language]?.vani || dashboardTranslations.en.vani;

  const [sessionId] = useState<string>(() => `vani_session_${Date.now()}`);
  const [textInput, setTextInput] = useState('');
  const [vaniState, setVaniState] = useState<VaniState>('idle');
  const [activeQueryInProgress, setActiveQueryInProgress] = useState<string>('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [savedArchiveId, setSavedArchiveId] = useState<string | null>(null);

  const [activeTurn, setActiveTurn] = useState<VaniTurn | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Restore latest conversation on browser refresh so state does not vanish
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VANI_STORAGE_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as VaniTurn;
        if (parsed && parsed.query) {
          setActiveTurn(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not restore previous Vani session:', e);
    }
  }, []);

  // Recording Timer
  useEffect(() => {
    if (vaniState === 'listening') {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [vaniState]);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
    };
  }, []);

  const togglePlayAudio = (audioB64?: string | null, audioUrl?: string | null) => {
    if (!audioB64 && !audioUrl) return;

    if (activeAudioRef.current && isPlayingAudio) {
      activeAudioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    try {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }

      const src = audioUrl || `data:audio/wav;base64,${audioB64}`;
      const audio = new Audio(src);
      activeAudioRef.current = audio;
      setIsPlayingAudio(true);

      audio.onended = () => {
        setIsPlayingAudio(false);
        activeAudioRef.current = null;
      };

      audio.onerror = () => {
        setIsPlayingAudio(false);
        activeAudioRef.current = null;
      };

      audio.play().catch(() => {
        setIsPlayingAudio(false);
      });
    } catch {
      setIsPlayingAudio(false);
    }
  };

  const handleSubmitQuery = async (queryText: string) => {
    const cleanQuery = queryText.trim();
    if (!cleanQuery) return;

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      setIsPlayingAudio(false);
    }

    setErrorNotice(null);
    setSavedArchiveId(null);
    setTextInput('');
    setActiveQueryInProgress(cleanQuery);
    setVaniState('thinking');

    try {
      const response = await respondVani({
        query: cleanQuery,
        language: language,
        session_id: sessionId,
        citizen_profile: citizenProfile,
        include_audio: true,
      });

      let cloudAudioUrl: string | undefined = undefined;

      // Upload MP3 to Cloudinary & Persist to MongoDB
      if (response.reply_audio_base64) {
        try {
          const uploadRes = await uploadAudioToCloudinary(response.reply_audio_base64);
          cloudAudioUrl = uploadRes.secure_url;
        } catch (uploadErr) {
          console.warn('Cloudinary upload notice:', uploadErr);
        }
      }

      try {
        const savedRec = await saveVaniConversation({
          session_id: sessionId,
          language: response.language || language,
          query_text: cleanQuery,
          response_text: response.reply_text,
          ai_summary: response.ai_summary || response.reply_text,
          audio_url: cloudAudioUrl,
          schemes_matched: response.scheme_cards || [],
          detected_intent: response.intent || 'agri_scheme_inquiry',
          duration_seconds: 14,
        });
        setSavedArchiveId(savedRec.id);
      } catch (dbErr) {
        console.warn('Database save notice:', dbErr);
      }

      const newTurn: VaniTurn = {
        id: `turn_${Date.now()}`,
        query: cleanQuery,
        language: response.language || language,
        replyText: response.reply_text,
        audioBase64: response.reply_audio_base64,
        audioUrl: cloudAudioUrl,
        schemeCards: response.scheme_cards || [],
        actionLinks: response.action_links || [],
        sourceCitations: response.source_citations || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setActiveTurn(newTurn);
      setVaniState('idle');
      setActiveQueryInProgress('');

      // Persist latest turn in localStorage so on refresh it never vanishes
      try {
        localStorage.setItem(VANI_STORAGE_SESSION_KEY, JSON.stringify(newTurn));
      } catch (e) {
        console.warn('Could not cache session locally:', e);
      }

      if (response.reply_audio_base64) {
        togglePlayAudio(response.reply_audio_base64, cloudAudioUrl);
      }
    } catch (err: unknown) {
      let msg = 'Failed to retrieve statutory records from official government gazettes.';
      if (err instanceof Error) msg = err.message;
      setErrorNotice(msg);
      setVaniState('idle');
      setActiveQueryInProgress('');
    }
  };

  const handleStartRecording = async () => {
    setErrorNotice(null);
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      setIsPlayingAudio(false);
    }

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

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());

        if (audioBlob.size < 500) {
          setVaniState('idle');
          return;
        }

        setVaniState('processing');
        setActiveQueryInProgress(t.transcribing);
        try {
          const sttRes = await transcribeAudio(audioBlob, language);
          if (sttRes && sttRes.transcript && sttRes.transcript.trim()) {
            await handleSubmitQuery(sttRes.transcript);
          } else {
            setErrorNotice('Could not recognize speech clearly. Please speak closer to the microphone.');
            setVaniState('idle');
            setActiveQueryInProgress('');
          }
        } catch (sttErr: unknown) {
          let msg = 'Voice recognition service unavailable.';
          if (sttErr instanceof Error) msg = sttErr.message;
          setErrorNotice(msg);
          setVaniState('idle');
          setActiveQueryInProgress('');
        }
      };

      mediaRecorder.start();
      setVaniState('listening');
    } catch {
      setErrorNotice('Microphone access denied. Please allow microphone permissions in your browser.');
      setVaniState('idle');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const currentSuggestions = SUGGESTED_QUERIES[language] || SUGGESTED_QUERIES.en;

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left animate-sleek">
      {/* 1. CIVIC VOICE CONTROL STATION (Pure White, Synced Language Selector) */}
      <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-5">
        {/* Dialect Selector Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0 mr-2 font-mono">
              {t.dialect}
            </span>
            {REGIONAL_LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={`px-3 py-1 text-xs font-semibold rounded-xl transition whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{lang.name}</span>
                  <span className="text-[9px] opacity-70 ml-1 font-mono">[{lang.code.toUpperCase()}]</span>
                </button>
              );
            })}
          </div>

          <div className="shrink-0 self-end sm:self-auto">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold font-mono">
              {vaniState === 'listening' && 'RECORDING ACTIVE'}
              {vaniState === 'processing' && 'TRANSCRIBING'}
              {vaniState === 'thinking' && 'GAZETTE AI'}
              {vaniState === 'speaking' && 'VOICE PLAYBACK'}
              {vaniState === 'idle' && t.readyStatus}
            </span>
          </div>
        </div>

        {/* MODERN TACTILE VOICE ORB */}
        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          <button
            type="button"
            onClick={vaniState === 'listening' ? handleStopRecording : handleStartRecording}
            className={`relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full transition-all duration-300 shadow-md cursor-pointer ${
              vaniState === 'listening'
                ? 'bg-rose-600 text-white scale-105 shadow-rose-200'
                : vaniState === 'processing' || vaniState === 'thinking'
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white hover:scale-105 shadow-emerald-100'
            }`}
            title="Click to Record Spoken Voice Query"
          >
            {/* Live Ripple Rings during recording */}
            {vaniState === 'listening' && (
              <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-30 pointer-events-none" />
            )}

            {/* Microphone Vector SVG */}
            {vaniState === 'listening' ? (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            ) : vaniState === 'processing' || vaniState === 'thinking' ? (
              <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-8 h-8 sm:w-9 sm:h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* Status Label */}
          <div className="text-center space-y-1">
            <p className="text-xs font-bold text-slate-800">
              {vaniState === 'listening'
                ? `${t.listening} (${recordingSeconds}s)`
                : vaniState === 'processing'
                ? t.transcribing
                : vaniState === 'thinking'
                ? t.synthesizing
                : t.tapToSpeak}
            </p>
            <p className="text-[11px] text-slate-400">
              {vaniState === 'idle' && `${REGIONAL_LANGUAGES.find((l) => l.code === language)?.label} STT & TTS`}
            </p>
          </div>
        </div>

        {/* Text Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmitQuery(textInput);
          }}
          className="space-y-3 pt-2 border-t border-slate-100"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={t.typePlaceholder}
              disabled={vaniState === 'listening' || vaniState === 'processing' || vaniState === 'thinking'}
              className="flex-1 h-10 px-4 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 transition"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || vaniState !== 'idle'}
              className="h-10 px-5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition disabled:opacity-40 cursor-pointer shrink-0"
            >
              {t.askBtn}
            </button>
          </div>

          {/* Preset Prompts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0 mr-1 font-mono">
              {t.suggestedLabel}
            </span>
            {currentSuggestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSubmitQuery(q)}
                className="px-3 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] text-slate-700 whitespace-nowrap transition cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* 2. ERROR NOTICE */}
      {errorNotice && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold">
          {errorNotice}
        </div>
      )}

      {/* 3. ACTIVE CONSULTATION TURN VIEW */}
      {activeTurn && (
        <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-6 animate-sleek">
          {/* Header of the Turn */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold font-mono">
                {activeTurn.language.toUpperCase()} RESPONSE
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {activeTurn.timestamp}
              </span>
              {savedArchiveId && (
                <span className="text-[10px] text-emerald-700 font-bold">
                  ✓ {t.savedToDb}
                </span>
              )}
            </div>

            {/* Audio Playback Controls */}
            {(activeTurn.audioBase64 || activeTurn.audioUrl) && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => togglePlayAudio(activeTurn.audioBase64, activeTurn.audioUrl)}
                  className="px-3 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isPlayingAudio ? (
                    <>
                      <div className="w-2.5 h-2.5 bg-rose-600 rounded-xs animate-pulse" />
                      <span>{t.pauseVoice}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-emerald-700" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <span>{t.replayVoice}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Spoken Citizen Question */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
              {t.citizenSpokenQuery}
            </span>
            <p className="text-slate-900 font-semibold italic text-sm">
              "{activeTurn.query}"
            </p>
          </div>

          {/* Gazette Grounded AI Answer */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block font-mono">
              {t.gazetteGuidance}
            </span>
            <div className="text-xs sm:text-sm text-slate-800 leading-relaxed prose prose-sm max-w-none">
              <MarkdownContent content={activeTurn.replyText} />
            </div>
          </div>

          {/* VERIFIED SOURCE CITATIONS WITH REAL FAVICONS */}
          {activeTurn.sourceCitations && activeTurn.sourceCitations.length > 0 && (
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                {t.verifiedSources}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeTurn.sourceCitations.map((citation, i) => {
                  const domain = citation.domain || (citation.url ? new URL(citation.url).hostname : 'gov.in');
                  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

                  return (
                    <a
                      key={i}
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 transition flex items-center justify-between gap-3 shadow-2xs group"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <img
                          src={faviconUrl}
                          alt={domain}
                          className="w-4 h-4 rounded-xs shrink-0 object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="truncate">
                          <p className="text-[11px] font-bold text-slate-900 group-hover:text-emerald-800 transition truncate">
                            {citation.title || domain}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">
                            {domain}
                          </p>
                        </div>
                      </div>
                      <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matched Scheme Cards */}
          {activeTurn.schemeCards && activeTurn.schemeCards.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                {t.identifiedSchemes}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeTurn.schemeCards.map((scheme, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase text-slate-400 font-mono">
                          {scheme.category || 'WELFARE'}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          Qualified
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">
                        {scheme.scheme_name}
                      </h4>
                      {scheme.benefit_amount && (
                        <p className="text-[11px] font-bold text-emerald-700 font-mono mt-0.5">
                          {scheme.benefit_amount}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenParchaa && onOpenParchaa(scheme.scheme_id)}
                        className="flex-1 py-1.5 text-center text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition cursor-pointer shadow-2xs"
                      >
                        {t.applyParchaa}
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenSchemeModal && onOpenSchemeModal(scheme)}
                        className="px-3 py-1.5 text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition cursor-pointer"
                      >
                        {t.details}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

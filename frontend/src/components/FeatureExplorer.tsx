'use client';

import React, { useState } from 'react';
import { type LanguageType } from '@/components/LanguageDropdown';
import { translations } from '@/lib/translations';

export interface ToolItem {
  id: string;
  categoryKey: 'eligibility' | 'voice_docs' | 'farm_gis' | 'governance';
  categoryLabel: string;
  title: string;
  tagline: string;
  badge: string;
  summary: string;
  capabilities: string[];
  deliverable: string;
  illustration: string;
  route: string;
  actionText: string;
  isMessaging?: boolean;
}

export const PLATFORM_TOOLS: ToolItem[] = [
  // 1. ELIGIBILITY & RULES
  {
    id: 'scheme-matcher',
    categoryKey: 'eligibility',
    categoryLabel: 'Eligibility and Rules',
    title: 'Scheme Discovery & Eligibility Engine',
    tagline: 'Rule-Based Welfare & Subsidy Qualification',
    badge: 'STATUTORY MATCHING',
    summary:
      'Evaluates citizen demographic and financial criteria—including annual household income, landholding acreage, caste category, and district location—against verified central and state government guidelines.',
    capabilities: [
      'Multi-scheme cross matching (PM-KISAN, PM-KUSUM, Ayushman Bharat, PMAY, Gruha Lakshmi).',
      'Itemized qualification breakdown with specific eligibility pass and disqualification reasons.',
      'Benefit value quantification (direct cash transfers, percentage subsidies, asset grants).',
      'Multi-sector filtering across Agriculture, Healthcare, Housing, and Social Welfare.'
    ],
    deliverable: '100% verified qualification report matching official state and central gazettes.',
    illustration: '/schemediscovery.png',
    route: '/dashboard/schemes',
    actionText: 'Check Scheme Eligibility'
  },
  {
    id: 'gazette-rag',
    categoryKey: 'eligibility',
    categoryLabel: 'Eligibility and Rules',
    title: 'Gazette & Policy Intelligence Guide',
    tagline: 'Statutory Knowledge Base & Official Circular Citations',
    badge: 'GAZETTE CITATIONS',
    summary:
      'Comprehensive knowledge repository indexed directly on official central and state government gazette notifications, departmental orders, and policy amendments, providing verifiable legal citations.',
    capabilities: [
      'Direct statutory citations to official government orders and gazette notifications.',
      'Clear entitlement rules preventing arbitrary rejection by desk officers.',
      'Real-time updates reflecting revised income thresholds and operational guidelines.',
      'Transparent legal audit trail for every scheme qualification rule.'
    ],
    deliverable: 'Direct clause references from verified Ministry and Department notifications.',
    illustration: '/nitirag.png',
    route: '/dashboard/schemes',
    actionText: 'View Policy Guidelines'
  },

  // 2. VOICE INTERFACE & DOCUMENT AUDIT
  {
    id: 'vanibot-voice',
    categoryKey: 'voice_docs',
    categoryLabel: 'Voice and Documents',
    title: 'VaniBot Multilingual Voice Studio',
    tagline: 'Regional Dialect Voice Queries in 6 Indian Languages',
    badge: 'VOICE IN AND OUT',
    summary:
      'Conversational voice interface allowing citizens to speak natural queries in Kannada, Hindi, Telugu, Tamil, Marathi, or English, delivering synthesized audio explanations of complex government schemes.',
    capabilities: [
      'Bidirectional speech-to-text and text-to-speech audio streaming.',
      'Translates complex legislative circulars and deadlines into conversational regional dialects.',
      'High accessibility for rural citizens with limited textual literacy.',
      'Real-time question answering with natural phonetic speech synthesis.'
    ],
    deliverable: 'Instant audio explanations in Kannada, Hindi, Telugu, Tamil, Marathi, and English.',
    illustration: '/vani.png',
    route: '/dashboard/vanibot',
    actionText: 'Launch Voice Studio'
  },
  {
    id: 'kagazcheck-audit',
    categoryKey: 'voice_docs',
    categoryLabel: 'Voice and Documents',
    title: 'KagazCheck Document Readiness Auditor',
    tagline: 'Pre-Submission Document Quality & Completeness Verification',
    badge: 'PRE-SUBMISSION AUDIT',
    summary:
      'Scans and audits citizen certificates—including Aadhaar, Land Records (RTC, Pahani, 7-12), Bank Passbooks, and Ration Cards—prior to CSC or Seva Kendra submission to eliminate procedural rejections.',
    capabilities: [
      'Image legibility, blurriness, glare, and document boundary audit.',
      'Aadhaar-to-bank account seeding and demographic consistency check.',
      'Itemized Readiness Score with explicit missing document alerts.',
      'Pre-checks statutory document compliance for each target scheme.'
    ],
    deliverable: 'Itemized document verification report with pre-submission pass scoring.',
    illustration: '/kagazcheck.png',
    route: '/dashboard/kagazcheck',
    actionText: 'Audit Documents'
  },
  {
    id: 'parchaa-dossier',
    categoryKey: 'voice_docs',
    categoryLabel: 'Voice and Documents',
    title: 'Parchaa Single-Page Dossier Generator',
    tagline: 'Standardized A4 Physical Application Form',
    badge: 'PRINT READY A4',
    summary:
      'Compiles verified citizen profile data, matched scheme entitlements, and statutory self-declarations into a standardized, single-sheet printable A4 dossier ready for Gram Panchayat or CSC submission.',
    capabilities: [
      'Standardized single-page physical format optimized for official submission.',
      'Pre-filled statutory checklists and applicant declaration blocks.',
      'Machine-verifiable QR token for rapid verification by desk officers.',
      'Instant PDF export and 1-click browser print integration.'
    ],
    deliverable: 'Single-sheet physical A4 filing dossier with embedded verification QR token.',
    illustration: '/parcha.png',
    route: '/dashboard/parchaa',
    actionText: 'Generate Dossier'
  },
  {
    id: 'messaging-bot',
    categoryKey: 'voice_docs',
    categoryLabel: 'Voice and Documents',
    title: 'Zero-Install WhatsApp & Telegram Bot',
    tagline: 'Conversational Welfare Access on Popular Messaging Channels',
    badge: 'WHATSAPP AND TELEGRAM',
    summary:
      'Enables citizens to interact with GramSetu directly inside WhatsApp and Telegram, accepting voice notes and certificate photographs to return scheme evaluations and printable Parchaa PDFs.',
    capabilities: [
      'Accepts voice notes and certificate photos directly inside chat.',
      'Delivers instant eligibility assessments and Parchaa PDF dossiers to chat.',
      'Minimal data consumption on standard smartphones without app installation.',
      'Continuous synchronization with the main web citizen portal.'
    ],
    deliverable: 'Conversational eligibility checks and PDF dossiers delivered directly inside chat.',
    illustration: '/whatsappintegration.png',
    route: '/dashboard/vanibot',
    actionText: 'Open Messaging Bot',
    isMessaging: true
  },

  // 3. GIS MAPPING & AGRI-COMMUNITY
  {
    id: 'farm-gis',
    categoryKey: 'farm_gis',
    categoryLabel: 'GIS and Agriculture',
    title: 'Krishi OpenStreetMap & Mandi Radar',
    tagline: 'Interactive OSM Map, APMC Mandis, Soil Labs & Parcel Calculator',
    badge: 'OPENSTREETMAP GIS',
    summary:
      'Real-time interactive OpenStreetMap agricultural navigation engine displaying live APMC Mandi commodity rates, Custom Hiring Centers, Soil Testing Labs, WDRA Cold Storages, and exact land parcel area measurement.',
    capabilities: [
      'Live APMC Mandi price radar with travel distance (km) and transport cost estimates.',
      'Custom Hiring Centers (CHCs) with tractor, harvester, and drone rental rates.',
      'Interactive farm boundary drawing tool to measure acreage, guntas, and perimeter.',
      'OpenStreetMap Nominatim village search across Karnataka and Indian districts.'
    ],
    deliverable: 'Interactive agricultural GIS radar with price comparison and farm parcel calculations.',
    illustration: '/climategislinker.png',
    route: '/dashboard/krishi-map',
    actionText: 'Launch Krishi Map'
  },
  {
    id: 'kisan-chaupal',
    categoryKey: 'farm_gis',
    categoryLabel: 'GIS and Agriculture',
    title: 'KisanChaupal Rural Community Exchange',
    tagline: 'Voice-First Farmer Network, Equipment Sharing & Cluster Alerts',
    badge: 'COMMUNITY NETWORK',
    summary:
      'Voice-enabled agricultural community board connecting local farmers, agronomists, and extension officers for localized advisory, crop alerts, and farm machinery pooling.',
    capabilities: [
      'Voice-first discussion threads in regional dialects for farming inquiries.',
      'Hyper-local pest attack, weather anomaly, and crop damage cluster alerts.',
      'Peer-to-peer tractor, harvester, and farming equipment rental pool.',
      'Verified advisory channel for Krishi Vigyan Kendra scientists.'
    ],
    deliverable: 'Community network for localized pest advisories and equipment sharing.',
    illustration: '/kisanchaupal(social_media).png',
    route: '/dashboard',
    actionText: 'Enter KisanChaupal'
  },

  // 4. LIFECYCLE TRACKING & ADVOCACY
  {
    id: 'app-tracker',
    categoryKey: 'governance',
    categoryLabel: 'Tracking and Advocacy',
    title: 'Application Lifecycle Tracker & SMS Dispatcher',
    tagline: 'Multi-Stage Status Monitoring & Proactive SMS Alerts',
    badge: 'LIFECYCLE TRACKING',
    summary:
      'Tracks submitted government application acknowledgement numbers across central and state departmental portals, providing real-time status updates and stage progression alerts.',
    capabilities: [
      'Multi-portal tracking using official acknowledgement reference numbers.',
      'Automated SMS and dashboard notifications as files advance through approval desks.',
      'Full visibility into pending review stages (Intake, Verification, Sanction, DBT).',
      'Central archive tracking all family welfare submissions in one dashboard.'
    ],
    deliverable: 'Real-time multi-stage tracking dashboard with automated SMS notifications.',
    illustration: '/smsdispatcher.png',
    route: '/dashboard/applications',
    actionText: 'Track Applications'
  },
  {
    id: 'delay-escalation',
    categoryKey: 'governance',
    categoryLabel: 'Tracking and Advocacy',
    title: 'Citizen Charter Delay Escalation & RTI Drafter',
    tagline: 'Statutory Deadline Monitoring & Grievance Petitioning',
    badge: 'RTI ESCALATION',
    summary:
      'Compares file processing duration against official Citizen Charter timelines, automatically drafting formal Right to Information (RTI) petitions and grievance complaints when deadlines lapse.',
    capabilities: [
      'Automated monitoring of statutory Citizen Charter disposal windows.',
      'Ready-to-file Section 6(1) RTI petitions addressed to Public Information Officers.',
      'Formal escalation grievance drafts for District Collectors and Lokayukta desks.',
      'Enforces legal administrative accountability for delayed citizen benefits.'
    ],
    deliverable: 'Pre-formatted Section 6(1) RTI petition ready for physical or online filing.',
    illustration: '/smsdispatcher.png',
    route: '/dashboard/applications',
    actionText: 'Draft RTI Escalation'
  },
  {
    id: 'csc-bulk-mode',
    categoryKey: 'governance',
    categoryLabel: 'Tracking and Advocacy',
    title: 'Village Camp & CSC Operator Bulk Mode',
    tagline: 'High-Throughput Queue Processing for Field Officers & CSCs',
    badge: 'OPERATOR MODE',
    summary:
      'Specialized batch workflow interface designed for Common Service Centre (CSC) operators, Gram Panchayat secretaries, and field animators handling high-volume citizen queues.',
    capabilities: [
      'Rapid queue intake with bulk demographic and land data processing.',
      'Offline document scanning buffer with background cloud synchronization.',
      '1-click batch dossier generation and printing for village welfare camps.',
      'Operator telemetry and camp throughput reporting.'
    ],
    deliverable: 'High-speed batch intake pipeline with 1-click bulk dossier generation.',
    illustration: '/cscoperator.png',
    route: '/dashboard',
    actionText: 'Open Operator Mode'
  }
];

interface FeatureExplorerProps {
  language?: LanguageType;
  onSelectAction: (route: string) => void;
}

export function FeatureExplorer({
  language = 'en',
  onSelectAction,
}: FeatureExplorerProps) {
  const t = translations[language]?.explorer || translations.en.explorer;
  const categories = t.categories;

  const [activeCategory, setActiveCategory] = useState<'eligibility' | 'voice_docs' | 'farm_gis' | 'governance'>('eligibility');
  const [selectedToolId, setSelectedToolId] = useState<string>('scheme-matcher');

  const categoryTools = PLATFORM_TOOLS.filter((t) => t.categoryKey === activeCategory);

  const activeTool =
    categoryTools.find((t) => t.id === selectedToolId) || categoryTools[0];

  const handleCategorySwitch = (catKey: 'eligibility' | 'voice_docs' | 'farm_gis' | 'governance') => {
    setActiveCategory(catKey);
    const firstToolInCat = PLATFORM_TOOLS.find((t) => t.categoryKey === catKey);
    if (firstToolInCat) {
      setSelectedToolId(firstToolInCat.id);
    }
  };

  return (
    <div className="space-y-6 text-left w-full">
      {/* 1. SECTION HEADER */}
      <div className="border-b border-border pb-4 space-y-1.5">
        <span className="badge-saas badge-saas-active">
          {t.badge}
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          {t.title}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
          {t.subtitle}
        </p>
      </div>

      {/* 2. CATEGORY SELECTOR PILLS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 w-full">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => handleCategorySwitch(cat.key as any)}
              className={`p-3 sm:p-4 rounded-xl text-left transition cursor-pointer flex flex-col justify-between border ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-foreground border-border hover:bg-muted'
              }`}
            >
              <span className="text-xs sm:text-sm font-bold block truncate">
                {cat.label}
              </span>
              <span
                className={`text-[10px] mt-1 line-clamp-1 ${
                  isActive ? 'text-primary-foreground/80 font-medium' : 'text-muted-foreground'
                }`}
              >
                {cat.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. MAIN STOREFRONT WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch w-full">
        {/* Left Side (5 cols): Tools in this category */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="p-3 bg-muted/40 rounded-xl border border-border flex items-center justify-between">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              {categories.find((c) => c.key === activeCategory)?.label}
            </span>
            <span className="badge-saas badge-saas-neutral text-[9px]">
              {categoryTools.length} {t.availableModules}
            </span>
          </div>

          <div className="space-y-2">
            {categoryTools.map((tool) => {
              const isSelected = activeTool.id === tool.id;
              return (
                <div
                  key={tool.id}
                  onClick={() => setSelectedToolId(tool.id)}
                  className={`p-3.5 sm:p-4 rounded-xl border transition cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-card border-primary ring-1 ring-primary shadow-sm'
                      : 'bg-card border-border hover:border-foreground/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {tool.title}
                    </h3>
                    <span className="badge-saas badge-saas-neutral text-[9px] shrink-0">
                      {tool.badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {tool.tagline}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side (7 cols): Selected Tool In-Depth Visual Stage */}
        <div className="lg:col-span-7 card-saas p-5 sm:p-7 space-y-6 flex flex-col justify-between animate-sleek">
          {/* Header Info */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="badge-saas badge-saas-active">
                {activeTool.categoryLabel}
              </span>
              <span className="badge-saas badge-saas-contrast text-[9px]">
                {activeTool.badge}
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {activeTool.title}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-primary mt-0.5">
                {activeTool.tagline}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {activeTool.summary}
            </p>
          </div>

          {/* Dedicated Custom Illustration Showcase - Large & Clean */}
          <div className="w-full h-72 sm:h-84 lg:h-96 flex items-center justify-center p-2">
            <img
              src={activeTool.illustration}
              alt={activeTool.title}
              loading="lazy"
              className="w-full h-full object-contain transition-transform duration-300 hover:scale-102"
            />
          </div>

          {/* Messaging Channel Logos Block (when WhatsApp/Telegram tool is selected) */}
          {activeTool.isMessaging && (
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                {t.integratedChannels}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* WhatsApp Logo Box */}
                <div className="p-3 rounded-lg bg-card border border-border flex items-center gap-3 shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm0 18.15c-1.49 0-2.95-.4-4.22-1.15l-.3-.18-3.13.82.83-3.05-.2-.31a8.16 8.16 0 01-1.25-4.38c0-4.54 3.7-8.24 8.27-8.24 2.21 0 4.28.86 5.84 2.42a8.2 8.2 0 012.42 5.83c0 4.54-3.7 8.24-8.26 8.24zm4.53-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.06 0 1.21.89 2.39 1.01 2.55.12.17 1.74 2.66 4.22 3.73.59.25 1.05.41 1.41.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.12-.23-.19-.48-.31z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">WhatsApp Assistant</h4>
                    <p className="text-[11px] text-muted-foreground">Send voice notes and receive instant Parchaa PDF</p>
                  </div>
                </div>

                {/* Telegram Logo Box */}
                <div className="p-3 rounded-lg bg-card border border-border flex items-center gap-3 shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-[#0088cc]/10 text-[#0088cc] flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Telegram Bot</h4>
                    <p className="text-[11px] text-muted-foreground">High-speed regional channel with zero file size limits</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Capabilities Checklist */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground block">
              {t.coreCapabilities}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeTool.capabilities.map((point, pIdx) => (
                <div
                  key={pIdx}
                  className="p-3 rounded-xl bg-card border border-border flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed"
                >
                  <span className="text-primary font-bold shrink-0">✓</span>
                  <span className="text-foreground">{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Statutory Deliverable & Launch Action */}
          <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                {t.statutoryDeliverable}
              </span>
              <p className="text-xs font-semibold text-foreground">
                {activeTool.deliverable}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSelectAction(activeTool.route)}
              className="btn-primary-sleek h-10 px-6 text-xs font-bold w-full sm:w-auto shrink-0"
            >
              {activeTool.actionText} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

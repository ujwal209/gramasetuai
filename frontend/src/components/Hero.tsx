'use client';

import { useState } from 'react';
import { SCHEME_IMAGES } from '../services/api';

interface HeroProps {
  onFindSchemes: () => void;
  onExploreSchemes: () => void;
  onOpenVaniBot?: () => void;
}

export function Hero({ onFindSchemes, onExploreSchemes, onOpenVaniBot }: HeroProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const showcaseItems = [
    {
      id: 'pm-kisan-001',
      title: 'PM-KISAN Samman Nidhi',
      subtitle: '₹6,000 / yr Direct Income Support to Landholding Farmers',
      category: 'Agriculture & DBT',
      image: SCHEME_IMAGES['pm-kisan-001'],
      stat: '100% Match',
      nodal: 'pmkisan.gov.in',
    },
    {
      id: 'pmay-g-002',
      title: 'Pradhan Mantri Awas Yojana - Gramin',
      subtitle: '₹1.20 Lakh Housing Subsidy + 95 Days MGNREGA Wages',
      category: 'Rural Housing',
      image: SCHEME_IMAGES['pmay-g-002'],
      stat: 'BPL Entitlement',
      nodal: 'pmayg.nic.in',
    },
    {
      id: 'pm-jay-004',
      title: 'Ayushman Bharat (PM-JAY)',
      subtitle: '₹5,00,000 Annual Cashless Hospitalization Coverage',
      category: 'Healthcare Access',
      image: SCHEME_IMAGES['pm-jay-004'],
      stat: 'Cashless Network',
      nodal: 'nha.gov.in',
    },
    {
      id: 'raitha-vidya-005',
      title: 'Karnataka Raitha Vidya Nidhi',
      subtitle: '₹2,000 – ₹11,000 Higher Education Student Scholarships',
      category: 'Higher Education',
      image: SCHEME_IMAGES['raitha-vidya-005'],
      stat: 'Farmer Children Aid',
      nodal: 'karnataka.gov.in',
    },
  ];

  const currentShowcase = showcaseItems[activeSlide];

  return (
    <section className="relative pt-12 sm:pt-20 pb-16 border-b border-border animate-sleek">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Premium SaaS Copy & Actions */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2">
              <span className="badge-saas badge-saas-active">
                STATUTORY CIVIC INTELLIGENCE ENGINE
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl font-black text-foreground tracking-tight leading-[1.06]">
                Direct Citizen <br />
                <span className="text-[#10b981] dark:text-[#34d399]">
                  Welfare Discovery.
                </span>
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-xl font-normal font-sans-sleek">
                Discover government welfare schemes with zero intermediaries. Evaluate statutory eligibility deterministically, audit certificates via vision AI, and compile your single-page application Parchaa.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onFindSchemes}
                className="btn-primary-sleek"
              >
                Evaluate Eligibility
              </button>

              {onOpenVaniBot && (
                <button
                  type="button"
                  onClick={onOpenVaniBot}
                  className="btn-outline-sleek"
                >
                  Voice Assistant
                </button>
              )}

              <button
                type="button"
                onClick={onExploreSchemes}
                className="px-4 py-2.5 text-xs font-mono-code font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground cursor-pointer transition"
              >
                Directory
              </button>
            </div>

            {/* Verification Stats */}
            <div className="pt-6 border-t border-border grid grid-cols-3 gap-4">
              <div>
                <span className="font-mono-code font-black text-2xl text-foreground">100%</span>
                <p className="text-[10px] text-muted-foreground font-mono-code uppercase tracking-wider mt-0.5">Statutory Rules</p>
              </div>
              <div>
                <span className="font-mono-code font-black text-2xl text-[#10b981] dark:text-[#34d399]">ZERO</span>
                <p className="text-[10px] text-muted-foreground font-mono-code uppercase tracking-wider mt-0.5">Intermediaries</p>
              </div>
              <div>
                <span className="font-mono-code font-black text-2xl text-foreground">A4</span>
                <p className="text-[10px] text-muted-foreground font-mono-code uppercase tracking-wider mt-0.5">Single Parchaa</p>
              </div>
            </div>
          </div>

          {/* Right Column: Photography Showcase Card */}
          <div className="lg:col-span-6">
            <div className="p-0 overflow-hidden card-saas text-left shadow-lg">
              {/* Image Container with Overlay */}
              <div className="relative h-72 sm:h-80 w-full overflow-hidden bg-muted rounded-t-2xl">
                {!imageErrors[currentShowcase.id] ? (
                  <img
                    src={currentShowcase.image}
                    alt={currentShowcase.title}
                    loading="lazy"
                    decoding="async"
                    onError={() => setImageErrors((prev) => ({ ...prev, [currentShowcase.id]: true }))}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center p-6 text-center">
                    <div className="space-y-1">
                      <span className="text-xs font-mono-code font-bold text-muted-foreground uppercase">{currentShowcase.category}</span>
                      <h3 className="text-base font-bold text-foreground">{currentShowcase.title}</h3>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

                {/* Overlaid Badges */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <span className="badge-saas bg-black/70 text-white border-white/30 text-[9px]">
                    {currentShowcase.category}
                  </span>

                  <span className="badge-saas badge-saas-contrast text-[9px]">
                    {currentShowcase.stat}
                  </span>
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                  <h3 className="text-lg font-black tracking-tight text-white">
                    {currentShowcase.title}
                  </h3>
                  <p className="text-xs text-slate-200 line-clamp-1 font-sans-sleek">
                    {currentShowcase.subtitle}
                  </p>
                </div>
              </div>

              {/* Card Footer Details */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-border pb-3 font-mono-code">
                  <span className="text-[10px] text-muted-foreground uppercase">
                    PORTAL: {currentShowcase.nodal}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-[#10b981] dark:text-[#34d399]">
                    VERIFIED GAZETTE
                  </span>
                </div>

                {/* Interactive Switcher Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {showcaseItems.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSlide(idx)}
                      className={`p-2.5 text-left rounded-xl transition cursor-pointer border ${
                        activeSlide === idx
                          ? 'border-foreground bg-muted font-bold'
                          : 'border-border bg-card hover:bg-muted/40'
                      }`}
                    >
                      <p className="text-[10px] font-bold text-foreground truncate">
                        {item.title.split('(')[0]}
                      </p>
                      <span className="text-[8px] font-mono-code text-muted-foreground block truncate uppercase">
                        {item.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

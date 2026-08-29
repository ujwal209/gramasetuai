'use client';

import React, { useState, useEffect, useRef } from 'react';
import { type LanguageType } from '@/components/LanguageDropdown';
import { translations } from '@/lib/translations';

interface ShowcaseSliderProps {
  language?: LanguageType;
  onSelectAction?: (tab: string, featureId?: string) => void;
}

const SLIDE_DURATION_MS = 5500; // 5.5 seconds per slide

const SLIDE_IMAGES = [
  '/schemediscovery.png',
  '/vani.png',
  '/kagazcheck.png',
  '/parcha.png',
  '/climategislinker.png',
  '/smsdispatcher.png',
];

export function ShowcaseSlider({
  language = 'en',
  onSelectAction,
}: ShowcaseSliderProps) {
  const t = translations[language]?.slider || translations.en.slider;
  const slides = t.slides;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Automatic Smooth Progress Bar & Slide Advancement
  useEffect(() => {
    if (isPaused) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const stepMs = 50;
    const increment = (stepMs / SLIDE_DURATION_MS) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev + increment >= 100) {
          setCurrentIndex((curr) => (curr + 1) % slides.length);
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPaused, slides.length, currentIndex]);

  const handleSelectSlide = (idx: number) => {
    setCurrentIndex(idx);
    setProgress(0);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    setProgress(0);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setProgress(0);
  };

  const currentSlide = slides[currentIndex] || slides[0];
  const currentImage = SLIDE_IMAGES[currentIndex] || SLIDE_IMAGES[0];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="card-saas overflow-hidden shadow-xs border border-border bg-card text-left transition-all duration-300 space-y-0 w-full"
    >
      {/* 1. TOP PROGRESS TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-b border-border bg-muted/30">
        {slides.map((slide, idx) => {
          const isActive = currentIndex === idx;
          return (
            <button
              key={slide.id}
              onClick={() => handleSelectSlide(idx)}
              className={`relative p-3 sm:p-4 text-left transition cursor-pointer flex flex-col justify-between border-r border-border last:border-r-0 ${
                isActive ? 'bg-card' : 'hover:bg-muted/60'
              }`}
            >
              {/* Active Animated Progress Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-border/60 overflow-hidden">
                {isActive && (
                  <div
                    className="h-full bg-primary transition-all ease-linear"
                    style={{ width: `${progress}%` }}
                  />
                )}
                {!isActive && idx < currentIndex && (
                  <div className="h-full bg-primary/30 w-full" />
                )}
              </div>

              <div className="space-y-0.5 pt-1">
                <span
                  className={`text-xs font-bold block truncate ${
                    isActive ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {slide.tabLabel}
                </span>
                <span className="text-[10px] text-muted-foreground line-clamp-1 hidden sm:block">
                  {slide.tabSubtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. MAIN 2-COLUMN HERO SHOWCASE BODY */}
      <div
        key={currentSlide.id}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-10 lg:p-12 items-center w-full animate-sleek"
      >
        {/* Left Column (6 cols): Copy, Badges, Value Proposition */}
        <div className="lg:col-span-6 space-y-5 w-full">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-saas badge-saas-active">
              {currentSlide.category}
            </span>
            <span className="badge-saas badge-saas-contrast text-[10px]">
              {currentSlide.benefit}
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight leading-tight">
              {currentSlide.title}
            </h1>
            <p className="text-sm sm:text-base font-semibold text-primary">
              {currentSlide.tagline}
            </p>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentSlide.description}
          </p>

          {/* Key Specs Pills */}
          <div className="pt-2 flex flex-wrap gap-2">
            {currentSlide.keySpecs.map((spec, sIdx) => (
              <span
                key={sIdx}
                className="px-3 py-1.5 rounded-lg bg-muted text-xs font-semibold text-foreground border border-border"
              >
                ✓ {spec}
              </span>
            ))}
          </div>

          {/* Action CTA & Safety Guarantee */}
          <div className="pt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectAction && onSelectAction(currentSlide.actionTab, currentSlide.id)}
              className="btn-primary-sleek h-11 px-6 text-xs font-bold w-full sm:w-auto shadow-sm"
            >
              {currentSlide.actionLabel} →
            </button>
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block">
              {t.freeAssistance}
            </span>
          </div>
        </div>

        {/* Right Column (6 cols): Large Unconstrained Custom Illustration */}
        <div className="lg:col-span-6 w-full flex items-center justify-center">
          <div className="w-full h-80 sm:h-96 lg:h-[440px] flex items-center justify-center p-2">
            <img
              src={currentImage}
              alt={currentSlide.title}
              loading="lazy"
              className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
            />
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SLIDER CONTROLS STRIP */}
      <div className="p-3 sm:p-4 bg-muted/20 border-t border-border flex items-center justify-between gap-3 w-full">
        {/* Slide Counter & Pause Notice */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground tracking-wide">
            {t.featureCount} {currentIndex + 1} of {slides.length}
          </span>
          {isPaused && (
            <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">
              {t.pausedOnHover}
            </span>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="px-3.5 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted text-xs font-bold transition cursor-pointer"
            aria-label="Previous slide"
          >
            {t.previous}
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="px-3.5 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted text-xs font-bold transition cursor-pointer"
            aria-label="Next slide"
          >
            {t.next}
          </button>
        </div>
      </div>
    </div>
  );
}

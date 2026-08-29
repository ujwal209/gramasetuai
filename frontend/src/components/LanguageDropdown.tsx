'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export type LanguageType = 'en' | 'hi' | 'kn' | 'te' | 'ta' | 'mr';

export interface LanguageOption {
  code: LanguageType;
  label: string;
  native: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
];

interface LanguageDropdownProps {
  value?: LanguageType;
  onChange?: (lang: LanguageType) => void;
  className?: string;
}

export function LanguageDropdown({
  value,
  onChange,
  className = '',
}: LanguageDropdownProps) {
  const globalLang = useLanguage();
  const activeValue = value || globalLang.language;
  const handleSelect = onChange || globalLang.setLanguage;

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === activeValue) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-2.5 sm:px-3 rounded-lg border border-border bg-white text-foreground text-xs font-semibold hover:border-foreground/40 transition cursor-pointer flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="font-bold text-primary">{selectedOption.native}</span>
        <span className="text-[10px] text-muted-foreground uppercase">{selectedOption.code.toUpperCase()}</span>
        <svg
          className={`w-3 h-3 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-xl dropdown-solid z-50 py-1.5 focus:outline-none animate-sleek bg-white border border-border shadow-lg">
          <div className="px-3 py-1.5 border-b border-border/70 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Select Language
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === activeValue;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    handleSelect(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'text-foreground hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{lang.native}</span>
                    <span className={`text-[10px] ${isSelected ? 'opacity-85' : 'text-muted-foreground'}`}>
                      ({lang.label})
                    </span>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

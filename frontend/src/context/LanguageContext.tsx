'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LanguageType } from '@/components/LanguageDropdown';
import { translations, TranslationSchema } from '@/lib/translations';

interface LanguageContextType {
  language: LanguageType;
  setLanguage: (lang: LanguageType) => void;
  t: TranslationSchema;
  isReady: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'gramsetu_active_language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageType>('en');
  const [isReady, setIsReady] = useState(false);

  // Initialize and load persisted language from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageType | null;
      if (stored && ['en', 'kn', 'hi', 'te', 'ta', 'mr'].includes(stored)) {
        setLanguageState(stored);
      }
    } catch (e) {
      console.warn('Could not read persistent language:', e);
    } finally {
      setIsReady(true);
    }
  }, []);

  // Update state and save to localStorage
  const setLanguage = useCallback((newLang: LanguageType) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    } catch (e) {
      console.warn('Could not persist language to localStorage:', e);
    }
  }, []);

  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isReady }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      language: 'en',
      setLanguage: () => {},
      t: translations.en,
      isReady: true,
    };
  }
  return context;
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LanguageDropdown } from '@/components/LanguageDropdown';
import { ShowcaseSlider } from './components/ShowcaseSlider';
import { KisanChaupalSection } from './components/KisanChaupalSection';
import { FeatureExplorer } from './components/FeatureExplorer';
import { Footer } from './components/Footer';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';

export default function App() {
  const router = useRouter();
  const { user, token, handleLogout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleFeatureClick = (route: string) => {
    setMobileMenuOpen(false);
    if (user && token) {
      router.push(route);
    } else {
      router.push(`/auth/login`);
    }
  };

  return (
    <div className="min-h-screen bg-white text-foreground flex flex-col justify-between selection:bg-primary selection:text-primary-foreground animate-sleek w-full relative">
      {/* 1. TOP STICKY SOLID NAVBAR */}
      <header className="sticky top-0 z-50 w-full navbar-solid shadow-xs border-b border-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
            {/* Brand Logo - Standalone Large Image */}
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center focus:outline-none shrink-0 py-1"
            >
              <img
                src="/logo.png"
                alt="GramSetu"
                className="h-10 sm:h-12 md:h-14 w-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation Links - Dynamic Multilingual */}
            <nav className="hidden lg:flex items-center gap-2 xl:gap-3">
              <a
                href="#showcase"
                className="px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition"
              >
                {t.nav.overview}
              </a>
              <a
                href="#kisan-chaupal"
                className="px-3.5 py-2 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition"
              >
                {t.nav.kisanChaupal}
              </a>
              <a
                href="#tools"
                className="px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition"
              >
                {t.nav.features}
              </a>
              <a
                href="#how-it-works"
                className="px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition"
              >
                {t.nav.howItWorks}
              </a>
            </nav>

            {/* Right Action Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <LanguageDropdown value={language} onChange={setLanguage} />

              {/* Desktop Auth Controls */}
              {user ? (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href="/dashboard"
                    className="btn-primary-sleek h-9 px-4 text-xs font-bold"
                  >
                    {t.nav.dashboard}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="btn-outline-sleek h-9 px-3.5 text-xs font-bold"
                  >
                    {t.nav.logout}
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {t.nav.signIn}
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="btn-primary-sleek h-9 px-4 text-xs font-bold"
                  >
                    {t.nav.register}
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg border border-border bg-white text-foreground text-xs font-bold uppercase transition hover:bg-slate-50 focus:outline-none"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? t.nav.close : t.nav.menu}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown / Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-white p-4 space-y-4 animate-sleek shadow-xl">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block px-1">
                {t.nav.navigation}
              </span>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href="#showcase"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg bg-slate-50 text-xs font-semibold text-foreground hover:bg-slate-100 block text-center"
                >
                  {t.nav.overview}
                </a>
                <a
                  href="#kisan-chaupal"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg bg-primary/10 text-primary text-xs font-bold block text-center"
                >
                  {t.nav.kisanChaupal}
                </a>
                <a
                  href="#tools"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg bg-slate-50 text-xs font-semibold text-foreground hover:bg-slate-100 block text-center"
                >
                  {t.nav.features}
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg bg-slate-50 text-xs font-semibold text-foreground hover:bg-slate-100 block text-center"
                >
                  {t.nav.howItWorks}
                </a>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block px-1">
                {t.nav.citizenTools}
              </span>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleFeatureClick('/dashboard/schemes')}
                  className="p-2 rounded-lg bg-slate-50 text-left text-xs font-medium text-foreground hover:bg-slate-100"
                >
                  {t.nav.schemes}
                </button>
                <button
                  onClick={() => handleFeatureClick('/dashboard/vanibot')}
                  className="p-2 rounded-lg bg-slate-50 text-left text-xs font-medium text-foreground hover:bg-slate-100"
                >
                  {t.nav.voiceAssistant}
                </button>
                <button
                  onClick={() => handleFeatureClick('/dashboard/kagazcheck')}
                  className="p-2 rounded-lg bg-slate-50 text-left text-xs font-medium text-foreground hover:bg-slate-100"
                >
                  {t.nav.documentCheck}
                </button>
                <button
                  onClick={() => handleFeatureClick('/dashboard/parchaa')}
                  className="p-2 rounded-lg bg-slate-50 text-left text-xs font-medium text-foreground hover:bg-slate-100"
                >
                  {t.nav.applicationForm}
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex items-center gap-2">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 btn-primary-sleek h-9 text-xs font-bold text-center justify-center"
                  >
                    {t.nav.dashboard}
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="btn-outline-sleek h-9 px-4 text-xs font-bold"
                  >
                    {t.nav.logout}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 btn-outline-sleek h-9 text-xs font-bold text-center justify-center"
                  >
                    {t.nav.signIn}
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 btn-primary-sleek h-9 text-xs font-bold text-center justify-center"
                  >
                    {t.nav.register}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. MAIN LANDING CONTENT */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-12 sm:space-y-16">
        {/* Showcase Hero Slider with Large Custom Illustrations */}
        <section id="showcase" className="w-full">
          <ShowcaseSlider
            language={language}
            onSelectAction={(tab) => {
              if (tab === 'vanibot') handleFeatureClick('/dashboard/vanibot');
              else if (tab === 'kagazcheck') handleFeatureClick('/dashboard/kagazcheck');
              else if (tab === 'parchaa') handleFeatureClick('/dashboard/parchaa');
              else if (tab === 'farm-map') handleFeatureClick('/dashboard/farm-map');
              else if (tab === 'applications') handleFeatureClick('/dashboard/applications');
              else handleFeatureClick('/dashboard/schemes');
            }}
          />
        </section>

        {/* 4 Key Platform Benchmarks */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-left">
          <div className="p-4 sm:p-5 card-saas space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              {t.benchmarks.accuracyTitle}
            </span>
            <p className="text-xl sm:text-3xl font-black text-foreground">{t.benchmarks.accuracyValue}</p>
            <p className="text-xs text-muted-foreground">{t.benchmarks.accuracySub}</p>
          </div>

          <div className="p-4 sm:p-5 card-saas space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              {t.benchmarks.advocacyTitle}
            </span>
            <p className="text-xl sm:text-3xl font-black text-primary">{t.benchmarks.advocacyValue}</p>
            <p className="text-xs text-muted-foreground">{t.benchmarks.advocacySub}</p>
          </div>

          <div className="p-4 sm:p-5 card-saas space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              {t.benchmarks.inclusionTitle}
            </span>
            <p className="text-xl sm:text-3xl font-black text-foreground">{t.benchmarks.inclusionValue}</p>
            <p className="text-xs text-muted-foreground">{t.benchmarks.inclusionSub}</p>
          </div>

          <div className="p-4 sm:p-5 card-saas space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              {t.benchmarks.speedTitle}
            </span>
            <p className="text-xl sm:text-3xl font-black text-foreground">{t.benchmarks.speedValue}</p>
            <p className="text-xs text-muted-foreground">{t.benchmarks.speedSub}</p>
          </div>
        </section>

        {/* Dedicated Kisan Chaupal Social Media Section */}
        <div id="kisan-chaupal" className="w-full">
          <KisanChaupalSection
            language={language}
            onJoinClick={() => handleFeatureClick('/dashboard')}
          />
        </div>

        {/* Bridge Hero Showcase Section */}
        <section className="p-6 sm:p-10 card-saas grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border border-border">
          <div className="lg:col-span-6 space-y-4 text-left">
            <span className="badge-saas badge-saas-active">
              {t.bridge.badge}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight leading-tight">
              {t.bridge.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.bridge.description}
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-slate-50 text-xs font-semibold text-foreground border border-border">
                ✓ {t.bridge.bullet1}
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-50 text-xs font-semibold text-foreground border border-border">
                ✓ {t.bridge.bullet2}
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-50 text-xs font-semibold text-foreground border border-border">
                ✓ {t.bridge.bullet3}
              </span>
            </div>
          </div>

          <div className="lg:col-span-6 flex items-center justify-center p-2">
            <img
              src="/bridge_illustration.png"
              alt="GramSetu Bridge"
              className="w-full max-h-80 lg:max-h-96 object-contain"
            />
          </div>
        </section>

        {/* DEDICATED PLATFORM SUITE SECTION */}
        <section id="tools" className="w-full">
          <FeatureExplorer
            language={language}
            onSelectAction={(route) => handleFeatureClick(route)}
          />
        </section>

        {/* SECTION: 4-STEP STATUTORY WORKFLOW */}
        <section id="how-it-works" className="p-5 sm:p-8 card-saas space-y-6 text-left">
          <div className="border-b border-border pb-3">
            <span className="badge-saas badge-saas-active">
              {t.workflow.badge}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-foreground mt-1 tracking-tight">
              {t.workflow.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {t.workflow.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary font-mono">PHASE 01</span>
                <span className="badge-saas badge-saas-neutral text-[8px]">PROFILE & GIS</span>
              </div>
              <h4 className="font-bold text-sm text-foreground">{t.workflow.phase1Title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t.workflow.phase1Desc}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary font-mono">PHASE 02</span>
                <span className="badge-saas badge-saas-neutral text-[8px]">RULES MATCH</span>
              </div>
              <h4 className="font-bold text-sm text-foreground">{t.workflow.phase2Title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t.workflow.phase2Desc}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary font-mono">PHASE 03</span>
                <span className="badge-saas badge-saas-neutral text-[8px]">PAPER AUDIT</span>
              </div>
              <h4 className="font-bold text-sm text-foreground">{t.workflow.phase3Title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t.workflow.phase3Desc}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary font-mono">PHASE 04</span>
                <span className="badge-saas badge-saas-neutral text-[8px]">PRINT & SUBMIT</span>
              </div>
              <h4 className="font-bold text-sm text-foreground">{t.workflow.phase4Title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t.workflow.phase4Desc}
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: CTA BANNER */}
        <section className="p-6 sm:p-10 card-saas text-center space-y-5 bg-primary text-primary-foreground border-primary w-full shadow-md">
          <div className="max-w-2xl mx-auto space-y-2.5">
            <span className="badge-saas bg-white text-primary font-bold text-xs">
              {t.cta.badge}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              {t.cta.title}
            </h2>
            <p className="text-sm opacity-95 leading-relaxed">
              {t.cta.subtitle}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-xl bg-white text-primary font-bold text-xs uppercase tracking-wider hover:opacity-90 transition shadow-lg w-full sm:w-auto text-center"
              >
                {t.cta.goToDashboard} →
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/signup"
                  className="px-6 py-3 rounded-xl bg-white text-primary font-bold text-xs uppercase tracking-wider hover:opacity-90 transition shadow-lg cursor-pointer w-full sm:w-auto text-center"
                >
                  {t.cta.createAccount}
                </Link>
                <Link
                  href="/auth/login"
                  className="px-6 py-3 rounded-xl bg-primary/20 border border-white/40 text-white font-bold text-xs uppercase tracking-wider hover:bg-primary/30 transition cursor-pointer w-full sm:w-auto text-center"
                >
                  {t.cta.signIn}
                </Link>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer
        language={language}
        onTabChange={(tab) => handleFeatureClick(`/dashboard/${tab}`)}
      />
    </div>
  );
}

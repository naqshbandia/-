/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Sun,
  Moon,
  SunMoon,
  Home,
  Globe,
  Check,
  ChevronDown,
  RotateCw,
} from 'lucide-react';
import {
  AppLanguage,
  DEFAULT_LANGUAGE,
  LANGUAGE_OPTIONS,
  UI_STRINGS,
  getDir,
} from '../data/translations';
import { DisplayModePreference } from '../utils/displayModeService';

interface Props {
  onToggleMenu: () => void;
  onToggleSearch: () => void;
  isSearchOpen: boolean;
  isDark: boolean;
  displayMode?: DisplayModePreference;
  onToggleTheme: () => void;
  isDashboard?: boolean;
  onGoHome?: () => void;
  lang?: AppLanguage;
  onChangeLang?: (lang: AppLanguage) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<Props> = ({
  onToggleMenu,
  onToggleSearch,
  isSearchOpen,
  isDark,
  displayMode = 'auto',
  onToggleTheme,
  isDashboard = true,
  onGoHome,
  lang = DEFAULT_LANGUAGE,
  onChangeLang,
  onRefresh,
  isRefreshing = false,
}) => {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const t = UI_STRINGS[lang];
  const dir = getDir(lang);
  const currentLangOption =
    LANGUAGE_OPTIONS.find((opt) => opt.code === lang) || LANGUAGE_OPTIONS[0];

  useEffect(() => {
    if (!isLangMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLangMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isLangMenuOpen]);

  return (
    <header
      className={`sticky top-0 z-30 shadow-xs border-b select-none transition-colors duration-200 ${
        isDark
          ? 'bg-[var(--kdf-dark-surface,#062214)] text-amber-100 border-[var(--kdf-accent,#d4af37)]/40'
          : 'bg-white/95 backdrop-blur-xs text-[var(--kdf-primary,#064326)] border-emerald-900/10'
      }`}
    >
      {/* Sleek single compact line matching Islamic Smart Dashboard */}
      <div
        className="w-full max-w-5xl mx-auto px-2.5 sm:px-3 h-12 flex items-center justify-between gap-1"
        dir={dir}
      >
        {/* Start: Three-line hamburger menu button */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <button
            onClick={onToggleMenu}
            className={`min-w-[34px] min-h-[36px] sm:min-w-[38px] sm:min-h-[38px] rounded-lg active:scale-95 transition-all flex items-center justify-center cursor-pointer ${
              isDark
                ? 'text-[#d4af37] hover:text-white hover:bg-[#d4af37]/15'
                : 'text-[#064326] hover:bg-emerald-50'
            }`}
            title={t.headerMenuTitle}
            aria-label={t.headerMenuTitle}
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {!isDashboard && onGoHome && (
            <button
              onClick={onGoHome}
              className={`min-w-[34px] min-h-[36px] sm:min-w-[38px] sm:min-h-[38px] rounded-lg active:scale-95 transition-all flex items-center justify-center cursor-pointer ${
                isDark
                  ? 'text-emerald-300 hover:text-white hover:bg-emerald-900/40'
                  : 'text-[#064326] hover:bg-emerald-50'
              }`}
              title={t.headerHomeTitle}
              aria-label={t.headerHomeTitle}
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>

        {/* Center: App Name with Official Emblem Logo */}
        <button
          onClick={onGoHome}
          className="flex items-center justify-center text-center px-1 sm:px-1.5 flex-1 gap-1 sm:gap-2 min-w-0 cursor-pointer"
          title={t.headerHomeTitle}
        >
          <img
            src={`${import.meta.env.BASE_URL}kdf-logo-v4.webp?v=6`}
            alt={t.appName}
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl shadow-xs object-cover shrink-0"
          />
          <h1 className="text-[13px] sm:text-lg font-extrabold font-lalezar tracking-wide truncate">
            {t.appName}
          </h1>
        </button>

        {/* End: Language Switcher, View Mode, Theme Switcher, and Search button */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {/* Top-Bar Language Switcher (Default Urdu, switchable to 14 languages) */}
          {onChangeLang && (
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setIsLangMenuOpen((prev) => !prev)}
                className={`h-8 sm:h-9 px-1.5 sm:px-2 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-1 border text-[10.5px] sm:text-[11px] font-bold cursor-pointer ${
                  isLangMenuOpen
                    ? 'bg-[#064326] text-white border-[#d4af37]'
                    : isDark
                    ? 'bg-[#0b2e1b] border-[#d4af37]/45 text-[#d4af37] hover:bg-[#124127]'
                    : 'bg-[#f4f7f6] border-[#064326]/20 text-[#064326] hover:bg-emerald-50'
                }`}
                title={t.headerLanguageLabel}
                aria-label={t.headerLanguageLabel}
                aria-expanded={isLangMenuOpen}
              >
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap leading-none">
                  {currentLangOption.shortLabel}
                </span>
                <ChevronDown
                  className={`w-3 h-3 shrink-0 opacity-75 transition-transform duration-150 ${
                    isLangMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isLangMenuOpen && (
                <div
                  className={`absolute top-full end-0 mt-1.5 w-56 rounded-2xl border-2 border-[#d4af37] shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 ${
                    isDark
                      ? 'bg-[#081b11] text-emerald-50'
                      : 'bg-white text-[#11261b]'
                  }`}
                >
                  <div
                    className={`px-3 py-1.5 text-[10.5px] font-bold border-b border-[#d4af37]/25 ${
                      isDark ? 'bg-[#062214] text-[#d4af37]' : 'bg-[#ebf2ee] text-[#064326]'
                    }`}
                  >
                    {t.headerLanguageLabel}
                  </div>
                  <div className="p-1 space-y-0.5 max-h-[65vh] overflow-y-auto">
                    {LANGUAGE_OPTIONS.map((option) => {
                      const isActive = lang === option.code;
                      return (
                        <button
                          key={option.code}
                          type="button"
                          onClick={() => {
                            onChangeLang(option.code);
                            setIsLangMenuOpen(false);
                          }}
                          className={`w-full px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-[#064326] text-white'
                              : isDark
                              ? 'hover:bg-[#103321] text-emerald-50'
                              : 'hover:bg-emerald-50 text-[#11261b]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 min-w-0 flex-1">
                            <span className="truncate">{option.nativeLabel}</span>
                            <span
                              className={`text-[10px] font-sans font-medium shrink-0 ${
                                isActive ? 'text-emerald-200' : 'opacity-60'
                              }`}
                            >
                              {option.englishHint}
                            </span>
                          </div>
                          {isActive && (
                            <Check className="w-3.5 h-3.5 text-[#00ff99] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onToggleTheme}
            className={`h-8 sm:h-9 px-1.5 sm:px-2 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-1 border text-[10px] font-bold cursor-pointer ${
              isDark
                ? 'bg-[#0b2e1b] border-[#d4af37]/40 text-[#d4af37] hover:text-white hover:bg-[#124127]'
                : 'bg-[#f4f7f6] border-[#064326]/20 text-[#064326] hover:bg-emerald-50'
            }`}
            title={
              displayMode === 'auto'
                ? 'آٹو موڈ (دھوپ میں نارمل، رات/کمرے میں ڈارک)'
                : isDark
                ? t.headerThemeLight
                : t.headerThemeDark
            }
            aria-label={t.headerThemeDark}
          >
            {displayMode === 'auto' ? (
              <>
                <SunMoon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden xs:inline whitespace-nowrap">آٹو</span>
              </>
            ) : isDark ? (
              <Moon className="w-4 h-4 text-[#d4af37]" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </button>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`min-w-[32px] min-h-[34px] sm:min-w-[36px] sm:min-h-[38px] rounded-lg transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
                isDark
                  ? 'text-[#d4af37] hover:text-white hover:bg-[#d4af37]/15'
                  : 'text-[#064326] hover:bg-emerald-50'
              } ${isRefreshing ? 'opacity-70' : ''}`}
              title={t.refreshBtn}
              aria-label={t.refreshBtn}
            >
              <RotateCw className={`w-4 h-4 sm:w-[18px] sm:h-[18px] ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}

          <button
            onClick={onToggleSearch}
            className={`min-w-[32px] min-h-[34px] sm:min-w-[36px] sm:min-h-[38px] rounded-lg transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
              isSearchOpen
                ? 'bg-[#064326] text-white shadow-xs'
                : isDark
                ? 'text-[#d4af37] hover:text-white hover:bg-[#d4af37]/15'
                : 'text-[#064326] hover:bg-emerald-50'
            }`}
            title={t.headerSearchTitle}
            aria-label={t.headerSearchTitle}
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

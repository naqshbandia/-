/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Menu, Search, Sun, Moon, Home } from 'lucide-react';
import { ANDROID_APP_NAME_URDU } from '../data/appConfig';

interface Props {
  onToggleMenu: () => void;
  onToggleSearch: () => void;
  isSearchOpen: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
  isDashboard?: boolean;
  onGoHome?: () => void;
}

export const Header: React.FC<Props> = ({
  onToggleMenu,
  onToggleSearch,
  isSearchOpen,
  isDark,
  onToggleTheme,
  isDashboard = true,
  onGoHome,
}) => {
  return (
    <header
      className={`sticky top-0 z-30 shadow-xs border-b select-none transition-colors duration-200 ${
        isDark
          ? 'bg-[#062214] text-amber-100 border-[#d4af37]/40'
          : 'bg-white text-[#064326] border-emerald-900/10'
      }`}
    >
      {/* Sleek single compact line matching Islamic Smart Dashboard */}
      <div className="w-full max-w-5xl mx-auto px-3 h-12 flex items-center justify-between" dir="rtl">
        {/* Right: Three-line hamburger menu button */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMenu}
            className={`min-w-[40px] min-h-[40px] rounded-lg active:scale-95 transition-all flex items-center justify-center cursor-pointer ${
              isDark
                ? 'text-[#d4af37] hover:text-white hover:bg-[#d4af37]/15'
                : 'text-[#064326] hover:bg-emerald-50'
            }`}
            title="مینو (Menu)"
            aria-label="تین لائن مینو"
          >
            <Menu className="w-6 h-6" />
          </button>

          {!isDashboard && onGoHome && (
            <button
              onClick={onGoHome}
              className={`min-w-[40px] min-h-[40px] rounded-lg active:scale-95 transition-all flex items-center justify-center cursor-pointer ${
                isDark
                  ? 'text-emerald-300 hover:text-white hover:bg-emerald-900/40'
                  : 'text-[#064326] hover:bg-emerald-50'
              }`}
              title="ہوم ڈیش بورڈ"
              aria-label="ہوم ڈیش بورڈ"
            >
              <Home className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Center: App Name with Official Emblem Logo */}
        <button
          onClick={onGoHome}
          className="flex items-center justify-center text-center px-2 flex-1 gap-2 min-w-0 cursor-pointer"
          title="ہوم اسکرین"
        >
          <img
            src={`${import.meta.env.BASE_URL}app-logo.webp`}
            alt="خانقاہ دارالفلاح لوگو"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-xs border border-[#d4af37]/80 object-cover shrink-0"
          />
          <h1 className="text-base sm:text-lg font-extrabold font-lalezar tracking-wide truncate">
            {ANDROID_APP_NAME_URDU}
          </h1>
        </button>

        {/* Left: Theme Switcher and Search button */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleTheme}
            className={`min-w-[40px] min-h-[40px] rounded-lg active:scale-95 transition-all flex items-center justify-center cursor-pointer ${
              isDark
                ? 'text-[#d4af37] hover:text-white hover:bg-[#d4af37]/15'
                : 'text-[#064326] hover:bg-emerald-50'
            }`}
            title={isDark ? 'نارمل (لائٹ) تھیم لگائیں' : 'ڈارک تھیم لگائیں'}
            aria-label="تھیم تبدیل کریں"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-amber-300" />
            ) : (
              <Moon className="w-5 h-5 text-[#064326]" />
            )}
          </button>

          <button
            onClick={onToggleSearch}
            className={`min-w-[40px] min-h-[40px] rounded-lg transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
              isSearchOpen
                ? 'bg-[#064326] text-white shadow-xs'
                : isDark
                ? 'text-[#d4af37] hover:text-white hover:bg-[#d4af37]/15'
                : 'text-[#064326] hover:bg-emerald-50'
            }`}
            title="تلاش (Search)"
            aria-label="سرچ کا آپشن"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

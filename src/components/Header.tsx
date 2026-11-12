/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Menu, Search, Sun, Moon } from 'lucide-react';
import { ANDROID_APP_NAME_URDU } from '../data/appConfig';

interface Props {
  onToggleMenu: () => void;
  onToggleSearch: () => void;
  isSearchOpen: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<Props> = ({
  onToggleMenu,
  onToggleSearch,
  isSearchOpen,
  isDark,
  onToggleTheme,
}) => {
  return (
    <header
      className={`sticky top-0 z-30 shadow-md border-b-2 border-[#b08d43] select-none transition-colors duration-200 ${
        isDark ? 'bg-[#3d2e21] text-amber-100' : 'bg-[#f5eedc] text-[#3d2e21]'
      }`}
    >
      {/* Sleek single compact line right above the website */}
      <div className="w-full px-3 h-12 flex items-center justify-between" dir="rtl">
        {/* Right: Three-line hamburger menu button */}
        <button
          onClick={onToggleMenu}
          className={`p-1.5 rounded-lg active:scale-95 transition-all flex items-center justify-center ${
            isDark
              ? 'text-[#d4af37] hover:text-white hover:bg-[#b08d43]/20'
              : 'text-[#8c6d2b] hover:text-[#3d2e21] hover:bg-[#b08d43]/20'
          }`}
          title="مینو (Menu)"
          aria-label="تین لائن مینو"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Center: App Name in beautiful Lalezar font */}
        <div className="flex items-center justify-center text-center px-2 flex-1">
          <h1 className="text-xl font-bold font-lalezar tracking-wide truncate">
            {ANDROID_APP_NAME_URDU}
          </h1>
        </div>

        {/* Left: Theme Switcher and Search button */}
        <div className="flex items-center gap-1.5">
          {/* Theme Switcher (نارمل / ڈارک تھیم) */}
          <button
            onClick={onToggleTheme}
            className={`p-1.5 rounded-lg active:scale-95 transition-all flex items-center justify-center ${
              isDark
                ? 'text-[#d4af37] hover:text-white hover:bg-[#b08d43]/20'
                : 'text-[#8c6d2b] hover:text-[#3d2e21] hover:bg-[#b08d43]/20'
            }`}
            title={isDark ? 'نارمل (لائٹ) تھیم لگائیں' : 'ڈارک تھیم لگائیں'}
            aria-label="تھیم تبدیل کریں"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5 text-[#8c6d2b]" />}
          </button>

          {/* Search Button */}
          <button
            onClick={onToggleSearch}
            className={`p-1.5 rounded-lg transition-all active:scale-95 flex items-center justify-center ${
              isSearchOpen
                ? 'bg-[#b08d43] text-white shadow-sm'
                : isDark
                ? 'text-[#d4af37] hover:text-white hover:bg-[#b08d43]/20'
                : 'text-[#8c6d2b] hover:text-[#3d2e21] hover:bg-[#b08d43]/20'
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

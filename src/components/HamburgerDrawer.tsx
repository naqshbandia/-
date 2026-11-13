/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  X, 
  Home, 
  UserCheck, 
  Headphones, 
  HeartHandshake, 
  PhoneCall, 
  Globe, 
  Info, 
  MessageCircle, 
  Youtube, 
  Facebook, 
  ChevronLeft,
  Sun,
  Moon,
  RotateCw,
  Smartphone,
  Download
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenIntroKhanqah: () => void;
  onOpenIntroSheikh: () => void;
  onOpenAllBayanat: () => void;
  onOpenIslahiBayanat: () => void;
  onOpenWhatsAppGroups?: () => void;
  onOpenContact: () => void;
  onOpenWebsite: () => void;
  onOpenAbout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onRefreshBlogger?: () => void;
  isRefreshingBlogger?: boolean;
}

export const HamburgerDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenIntroKhanqah,
  onOpenIntroSheikh,
  onOpenAllBayanat,
  onOpenIslahiBayanat,
  onOpenWhatsAppGroups,
  onOpenContact,
  onOpenWebsite,
  onOpenAbout,
  isDark,
  onToggleTheme,
  onRefreshBlogger,
  isRefreshingBlogger = false,
}) => {
  const { isInstalled, install, isInstallable } = usePWAInstall();
  const [showInstallHelp, setShowInstallHelp] = React.useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none" dir="rtl">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-[90vw] flex">
        <div 
          className={`w-80 sm:w-88 border-l-2 border-[#b08d43] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-250 transition-colors ${
            isDark
              ? 'bg-gradient-to-b from-[#2a1b11] via-[#20150d] to-[#170e08] text-amber-100'
              : 'bg-gradient-to-b from-[#fdfaf3] via-[#f7f0e1] to-[#eedfc6] text-[#2c1f15]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header */}
          <div>
            <div
              className={`border-b border-[#b08d43]/50 p-4 flex items-center justify-between ${
                isDark ? 'bg-[#382618]' : 'bg-[#f0e3cc]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <img
                  src={`${import.meta.env.BASE_URL}app-logo.webp`}
                  alt="خانقاہ دارالفلاح لوگو"
                  className="w-10 h-10 rounded-full shadow-md border-2 border-[#d4af37] object-cover shrink-0"
                />
                <div>
                  <h3 className="text-lg font-bold font-lalezar leading-tight">
                    خانقاہ دارالفلاح
                  </h3>
                  <p className="text-[10px] text-[#b08d43] font-sans font-semibold tracking-wide">
                    KHANQAH DAR-UL-FALAH
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-amber-400 hover:text-white hover:bg-[#b08d43]/20 transition-colors"
                title="بند کریں"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Theme Toggle in Drawer */}
            <div className="px-3 pt-3">
              <button
                onClick={onToggleTheme}
                className={`w-full flex items-center justify-between p-2 rounded-xl border border-[#b08d43]/40 font-lalezar text-xs transition-all ${
                  isDark
                    ? 'bg-[#1e140d] text-amber-200 hover:bg-[#2c1d13]'
                    : 'bg-white text-[#3d2e21] shadow-xs hover:bg-amber-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#8c6d2b]" />}
                  <span>تھیم: {isDark ? 'ڈارک موڈ آن ہے' : 'نارمل موڈ آن ہے'}</span>
                </div>
                <span className="text-[10px] text-[#b08d43] font-sans underline">
                  {isDark ? 'Normal' : 'Dark'}
                </span>
              </button>
            </div>

            {/* Quick Refresh Blogger Feed Button */}
            {onRefreshBlogger && (
              <div className="px-3 pt-2">
                <button
                  onClick={onRefreshBlogger}
                  disabled={isRefreshingBlogger}
                  className={`w-full flex items-center justify-between p-2 rounded-xl border border-[#b08d43]/30 font-lalezar text-xs transition-all ${
                    isDark
                      ? 'bg-[#1e140d]/60 text-amber-200/90 hover:bg-[#2c1d13]'
                      : 'bg-amber-50/80 text-[#3d2e21] hover:bg-amber-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <RotateCw className={`w-3.5 h-3.5 text-[#b08d43] ${isRefreshingBlogger ? 'animate-spin' : ''}`} />
                    <span>بلاگر پوسٹس و لائبریری اپ ڈیٹ کریں</span>
                  </div>
                  <span className="text-[10px] text-[#b08d43] font-sans">
                    {isRefreshingBlogger ? 'لوڈ جاری...' : 'Refresh'}
                  </span>
                </button>
              </div>
            )}

            {/* Install App to Mobile Button */}
            {!isInstalled && (
              <div className="px-3 pt-2 space-y-1.5">
                <button
                  onClick={async () => {
                    if (isInstallable) {
                      await install();
                      onClose();
                    } else {
                      setShowInstallHelp((prev) => !prev);
                    }
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-900 text-white font-lalezar text-xs border border-emerald-500/50 shadow-md active:scale-95 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-300" />
                    <span>موبائل میں ایپ انسٹال کریں</span>
                  </div>
                  <span className="text-[10px] bg-[#25D366] text-white px-2 py-0.5 rounded-full font-sans font-bold flex items-center gap-1">
                    <Download className="w-2.5 h-2.5" />
                    Install
                  </span>
                </button>
                {showInstallHelp && (
                  <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-[11px] text-emerald-100 leading-relaxed">
                    کروم براؤزر کے اوپر دائیں کونے میں <strong>تین نقطوں (⋮)</strong> پر کلک کر کے <strong>&quot;Add to Home screen&quot;</strong> یا <strong>&quot;Install app&quot;</strong> منتخب کریں۔
                  </div>
                )}
              </div>
            )}

            {/* Menu Items (Reduced font size to prevent overflow on mobile) */}
            <div className="px-3 py-2 space-y-1 font-lalezar overflow-hidden">
              {/* 1. خانقاہ دارالفلاح کا تعارف */}
              <button
                onClick={() => {
                  onClose();
                  onOpenIntroKhanqah();
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl transition-all group text-right overflow-hidden ${
                  isDark ? 'hover:bg-[#3d2e21] text-amber-100' : 'hover:bg-amber-100/70 text-[#2c1f15]'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                  <span className="w-6.5 h-6.5 shrink-0 rounded-lg bg-[#b08d43]/20 text-[#b08d43] flex items-center justify-center group-hover:bg-[#b08d43] group-hover:text-white transition-colors">
                    <Home className="w-3.5 h-3.5" />
                  </span>
                  <span className="truncate text-xs sm:text-[13px]">1. خانقاہ دارالفلاح کا تعارف</span>
                </div>
                <ChevronLeft className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 shrink-0" />
              </button>

              {/* 2. تعارف شیخ مولانا محمد جمشید صاحب */}
              <button
                onClick={() => {
                  onClose();
                  onOpenIntroSheikh();
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl transition-all group text-right overflow-hidden ${
                  isDark ? 'hover:bg-[#3d2e21] text-amber-100' : 'hover:bg-amber-100/70 text-[#2c1f15]'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                  <span className="w-6.5 h-6.5 shrink-0 rounded-lg bg-[#b08d43]/20 text-[#b08d43] flex items-center justify-center group-hover:bg-[#b08d43] group-hover:text-white transition-colors">
                    <UserCheck className="w-3.5 h-3.5" />
                  </span>
                  <span className="truncate text-[11.5px] sm:text-xs tracking-tight">2. تعارف شیخ مولانا محمد جمشید صاحب</span>
                </div>
                <ChevronLeft className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 shrink-0" />
              </button>

              {/* 3. تمام بیانات */}
              <button
                onClick={() => {
                  onClose();
                  onOpenAllBayanat();
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl transition-all group text-right overflow-hidden ${
                  isDark ? 'hover:bg-[#3d2e21] text-amber-100' : 'hover:bg-amber-100/70 text-[#2c1f15]'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                  <span className="w-6.5 h-6.5 shrink-0 rounded-lg bg-[#b08d43]/20 text-[#b08d43] flex items-center justify-center group-hover:bg-[#b08d43] group-hover:text-white transition-colors">
                    <Headphones className="w-3.5 h-3.5" />
                  </span>
                  <span className="truncate text-xs sm:text-[13px]">3. تمام بیانات (آڈیو لائبریری)</span>
                </div>
                <ChevronLeft className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 shrink-0" />
              </button>

              {/* 4. اصلاحی بیانات */}
              <button
                onClick={() => {
                  onClose();
                  onOpenIslahiBayanat();
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl transition-all group text-right overflow-hidden ${
                  isDark ? 'hover:bg-[#3d2e21] text-amber-100' : 'hover:bg-amber-100/70 text-[#2c1f15]'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                  <span className="w-6.5 h-6.5 shrink-0 rounded-lg bg-[#b08d43]/20 text-[#b08d43] flex items-center justify-center group-hover:bg-[#b08d43] group-hover:text-white transition-colors">
                    <HeartHandshake className="w-3.5 h-3.5" />
                  </span>
                  <span className="truncate text-xs sm:text-[13px]">4. اصلاحی بیانات و مجالس</span>
                </div>
                <ChevronLeft className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 shrink-0" />
              </button>

              {/* 5. واٹس ایپ گروپس و چینل */}
              <button
                onClick={() => {
                  onClose();
                  if (onOpenWhatsAppGroups) {
                    onOpenWhatsAppGroups();
                  } else {
                    onOpenContact();
                  }
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl transition-all group text-right border overflow-hidden ${
                  isDark 
                    ? 'border-emerald-600/40 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-100' 
                    : 'border-emerald-600/30 bg-emerald-50 hover:bg-emerald-100/70 text-emerald-950'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                  <span className="w-6.5 h-6.5 shrink-0 rounded-lg bg-[#25D366] text-white flex items-center justify-center group-hover:scale-105 shadow-xs transition-transform">
                    <MessageCircle className="w-3.5 h-3.5 fill-white" />
                  </span>
                  <span className="truncate text-xs sm:text-[13px]">5. واٹس ایپ گروپس و چینل</span>
                </div>
                <span className="text-[9.5px] font-sans font-bold bg-[#25D366] text-white px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                  4 گروپس + چینل
                </span>
              </button>

              {/* 6. رابطہ کریں */}
              <button
                onClick={() => {
                  onClose();
                  onOpenContact();
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl transition-all group text-right overflow-hidden ${
                  isDark ? 'hover:bg-[#3d2e21] text-amber-100' : 'hover:bg-amber-100/70 text-[#2c1f15]'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                  <span className="w-6.5 h-6.5 shrink-0 rounded-lg bg-[#b08d43]/20 text-[#b08d43] flex items-center justify-center group-hover:bg-[#b08d43] group-hover:text-white transition-colors">
                    <PhoneCall className="w-3.5 h-3.5" />
                  </span>
                  <span className="truncate text-xs sm:text-[13px]">6. رابطہ کریں (Contact Us)</span>
                </div>
                <ChevronLeft className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 shrink-0" />
              </button>

              {/* 7. ویب سائٹ کھولیں */}
              <button
                onClick={() => {
                  onClose();
                  onOpenWebsite();
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl transition-all group text-right overflow-hidden ${
                  isDark ? 'hover:bg-[#3d2e21] text-amber-100' : 'hover:bg-amber-100/70 text-[#2c1f15]'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                  <span className="w-6.5 h-6.5 shrink-0 rounded-lg bg-[#b08d43]/20 text-[#b08d43] flex items-center justify-center group-hover:bg-[#b08d43] group-hover:text-white transition-colors">
                    <Globe className="w-3.5 h-3.5" />
                  </span>
                  <span className="truncate text-xs sm:text-[13px]">7. ویب سائٹ کھولیں (Homepage)</span>
                </div>
                <ChevronLeft className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 shrink-0" />
              </button>

              {/* 8. ایپلیکیشن کے بارے میں */}
              <button
                onClick={() => {
                  onClose();
                  onOpenAbout();
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl transition-all group text-right overflow-hidden ${
                  isDark ? 'hover:bg-[#3d2e21] text-amber-100' : 'hover:bg-amber-100/70 text-[#2c1f15]'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                  <span className="w-6.5 h-6.5 shrink-0 rounded-lg bg-[#b08d43]/20 text-[#b08d43] flex items-center justify-center group-hover:bg-[#b08d43] group-hover:text-white transition-colors">
                    <Info className="w-3.5 h-3.5" />
                  </span>
                  <span className="truncate text-xs sm:text-[13px]">8. ایپلیکیشن کے بارے میں</span>
                </div>
                <ChevronLeft className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 shrink-0" />
              </button>
            </div>
          </div>

          {/* Bottom Social Media Links */}
          <div
            className={`p-3 border-t border-[#b08d43]/30 space-y-2 ${
              isDark ? 'bg-[#181009]' : 'bg-[#efe4cc]'
            }`}
          >
            <div className="flex items-center justify-center gap-5 pt-1">
              <button
                onClick={() => {
                  onClose();
                  if (onOpenWhatsAppGroups) {
                    onOpenWhatsAppGroups();
                  } else {
                    window.open('https://whatsapp.com/channel/0029VaHFtAKDDmFU33nD360K', '_blank');
                  }
                }}
                className="text-[#25D366] hover:scale-110 transition-transform p-1.5"
                title="تمام واٹس ایپ گروپس اور چینل"
              >
                <MessageCircle className="w-5 h-5 fill-[#25D366]" />
              </button>
              <a
                href="https://youtube.com/@peermolanamuhammadjamshedn1391"
                target="_blank"
                rel="noreferrer"
                className="text-[#FF0000] hover:scale-110 transition-transform p-1.5"
                title="یوٹیوب"
              >
                <Youtube className="w-5 h-5 fill-[#FF0000]" />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=100068373408345"
                target="_blank"
                rel="noreferrer"
                className="text-[#1877F2] hover:scale-110 transition-transform p-1.5"
                title="فیس بک"
              >
                <Facebook className="w-5 h-5 fill-[#1877F2]" />
              </a>
            </div>
            <p className="text-[10px] text-gray-500 text-center font-sans">
              Khanqah Darul Falah © 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

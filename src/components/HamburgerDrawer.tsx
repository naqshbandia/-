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
  Download,
  BookOpen,
  Bell,
  FileText,
  ShieldCheck,
  Landmark,
  Palette,
  Check,
  BellOff,
  SunMoon,
} from 'lucide-react';
import {
  OFFICIAL_APK_URL,
  URDU_BOOKS_URL,
  NEWS_UPDATES_URL,
  DEVELOPER_WHATSAPP_URL,
} from '../data/appConfig';
import {
  AppLanguage,
  DEFAULT_LANGUAGE,
  UI_STRINGS,
  getDir,
  getDonationLabels,
  getAutoSilentLabels,
} from '../data/translations';
import { ISLAMIC_THEMES, IslamicThemePalette } from '../utils/themeService';
import { DisplayModePreference } from '../utils/displayModeService';
import { recordApkDownloadClick } from '../utils/installStatsService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGoHome?: () => void;
  onOpenIntroKhanqah: () => void;
  onOpenIntroSheikh: () => void;
  onOpenAllBayanat: () => void;
  onOpenIslahiBayanat: () => void;
  onOpenBooks?: () => void;
  onOpenNews?: () => void;
  onOpenUrl?: (url: string) => void;
  onOpenWhatsAppGroups?: () => void;
  onOpenDonations?: () => void;
  onOpenAutoSilent?: () => void;
  onOpenContact: () => void;
  onOpenWebsite: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  onOpenAbout: () => void;
  isDark: boolean;
  displayMode?: DisplayModePreference;
  onSelectDisplayMode?: (mode: DisplayModePreference) => void;
  onToggleTheme: () => void;
  onRefreshBlogger?: () => void;
  isRefreshingBlogger?: boolean;
  lang?: AppLanguage;
  themeOverride?: string;
  remoteTheme?: IslamicThemePalette;
  onChangeThemeOverride?: (id: string) => void;
}

export const HamburgerDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  onGoHome,
  onOpenIntroKhanqah,
  onOpenIntroSheikh,
  onOpenAllBayanat,
  onOpenIslahiBayanat,
  onOpenBooks,
  onOpenNews,
  onOpenUrl,
  onOpenWhatsAppGroups,
  onOpenDonations,
  onOpenAutoSilent,
  onOpenContact,
  onOpenWebsite,
  onOpenTerms,
  onOpenPrivacy,
  onOpenAbout,
  isDark,
  displayMode = 'auto',
  onSelectDisplayMode,
  onToggleTheme,
  onRefreshBlogger,
  isRefreshingBlogger = false,
  lang = DEFAULT_LANGUAGE,
  themeOverride = 'auto',
  remoteTheme = ISLAMIC_THEMES[0],
  onChangeThemeOverride,
}) => {
  if (!isOpen) return null;
  const t = UI_STRINGS[lang];
  const donationLabels = getDonationLabels(lang);
  const autoSilentLabels = getAutoSilentLabels(lang);
  const dir = getDir(lang);

  const rowClass = `w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group cursor-pointer ${
    dir === 'ltr' ? 'text-left' : 'text-right'
  } ${
    isDark
      ? 'hover:bg-[#103321] text-emerald-50 border border-transparent hover:border-[#d4af37]/30'
      : 'hover:bg-emerald-50 text-[#11261b] border border-transparent hover:border-emerald-900/10'
  }`;

  const iconBoxClass =
    'w-8 h-8 shrink-0 rounded-lg bg-[#064326]/10 dark:bg-[#d4af37]/15 text-[#064326] dark:text-[#d4af37] flex items-center justify-center group-hover:bg-[#064326] group-hover:text-white transition-colors';

  const sectionLabelClass =
    'px-3 pt-3 pb-1 text-[11px] font-bold tracking-wide text-[#8c6514] dark:text-[#d4af37]/90';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none" dir={dir}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className={`absolute inset-y-0 ${dir === 'ltr' ? 'left-0' : 'right-0'} max-w-[90vw] flex`}>
        <div
          className={`w-80 sm:w-88 ${
            dir === 'ltr'
              ? 'border-r-2 animate-in slide-in-from-left'
              : 'border-l-2 animate-in slide-in-from-right'
          } border-[#d4af37] shadow-2xl flex flex-col justify-between duration-200 transition-colors overflow-hidden ${
            isDark
              ? 'bg-[#081910] text-emerald-50'
              : 'bg-white text-[#11261b]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header */}
          <div className="bg-[#064326] text-white p-4 border-b border-[#d4af37]/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <img
                src={`${import.meta.env.BASE_URL}kdf-logo-v4.webp?v=6`}
                alt={t.appName}
                className="w-10 h-10 rounded-xl shadow-md object-cover shrink-0"
              />
              <div>
                <h3 className="text-lg font-extrabold font-lalezar leading-tight">
                  {t.appName}
                </h3>
                <p className="text-[10px] text-[#d4af37] font-sans font-semibold tracking-wide">
                  KHANQAH DAR-UL-FALAH
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#d4af37] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={t.drawerCloseTitle}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Listed Menu */}
          <div className="flex-1 overflow-y-auto px-2 pb-4 divide-y divide-emerald-950/10 dark:divide-white/10">
            {/* Quick Controls Bar */}
            <div className="py-2.5 px-1 space-y-2">
              {/* 3-Way Smart Display Mode Selector (Auto / Light Normal / Dark) */}
              <div
                className={`p-1.5 rounded-xl border space-y-1.5 ${
                  isDark ? 'bg-[#0b2316] border-[#d4af37]/30' : 'bg-[#f4f7f6] border-emerald-900/15'
                }`}
              >
                <div className="flex items-center justify-between px-1 text-[10.5px] font-bold">
                  <span className="text-[#064326] dark:text-[#d4af37] flex items-center gap-1">
                    <SunMoon className="w-3.5 h-3.5" />
                    <span>اسکرین موڈ (روشنی / کمرہ)</span>
                  </span>
                  <span className="text-[9.5px] opacity-75">
                    {isDark ? 'ڈارک فعال' : 'نارمل فعال'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'auto' as const, label: 'آٹو', icon: SunMoon },
                    { id: 'light' as const, label: 'نارمل', icon: Sun },
                    { id: 'dark' as const, label: 'ڈارک', icon: Moon },
                  ].map((opt) => {
                    const IconComp = opt.icon;
                    const active = displayMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          onSelectDisplayMode
                            ? onSelectDisplayMode(opt.id)
                            : onToggleTheme()
                        }
                        className={`py-1.5 px-1 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                          active
                            ? 'bg-[#064326] text-white border-[#d4af37] shadow-2xs'
                            : isDark
                            ? 'bg-white/5 text-emerald-100 border-transparent hover:border-[#d4af37]/40'
                            : 'bg-white text-[#064326] border-emerald-900/10 hover:bg-emerald-50'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5 shrink-0" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {onRefreshBlogger && (
                <button
                  onClick={onRefreshBlogger}
                  disabled={isRefreshingBlogger}
                  className={`w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[#0e291b] border-[#d4af37]/30 text-emerald-200 hover:bg-[#143a27]'
                      : 'bg-[#f4f7f6] border-emerald-900/15 text-[#064326] hover:bg-emerald-50'
                  }`}
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isRefreshingBlogger ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingBlogger ? t.refreshingBtn : t.drawerUpdate}</span>
                </button>
              )}

              {/* Direct Official APK Download Button */}
              <a
                href={OFFICIAL_APK_URL}
                download="khanqah-Darul-falah.apk"
                onClick={() => recordApkDownloadClick()}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[var(--kdf-primary,#064326)] hover:opacity-95 text-white font-lalezar text-xs border border-[var(--kdf-accent,#d4af37)]/60 shadow-sm active:scale-95 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#d4af37]" />
                  <span>{t.drawerDownloadApk}</span>
                </div>
                <span className="text-[10px] bg-[#d4af37] text-[#051a0f] px-2 py-0.5 rounded font-sans font-bold">
                  APK
                </span>
              </a>

              {/* Islamic Background Color Style Selector */}
              {onChangeThemeOverride && (
                <div
                  className={`p-2 rounded-xl border space-y-1.5 ${
                    isDark
                      ? 'bg-[#0b2316] border-[#d4af37]/30'
                      : 'bg-[#f4f7f6] border-emerald-900/15'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 text-[#064326] dark:text-[#d4af37]">
                      <Palette className="w-3.5 h-3.5" />
                      <span>اسلامک بیک گراؤنڈ رنگ</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onChangeThemeOverride('auto')}
                      className={`px-2 py-0.5 rounded-md text-[10px] border transition-colors cursor-pointer ${
                        themeOverride === 'auto'
                          ? 'bg-[#064326] text-white border-[#d4af37]'
                          : 'border-emerald-700/25 opacity-75 hover:opacity-100'
                      }`}
                    >
                      آٹو (آفیشل)
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {ISLAMIC_THEMES.map((themeItem) => {
                      const isSelected =
                        themeOverride === themeItem.id ||
                        (themeOverride === 'auto' && remoteTheme.id === themeItem.id);
                      return (
                        <button
                          key={themeItem.id}
                          type="button"
                          onClick={() => onChangeThemeOverride(themeItem.id)}
                          title={themeItem.nameUrdu}
                          className={`h-7 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#d4af37] scale-105 shadow-xs'
                              : 'border-white/40 dark:border-black/40 opacity-85 hover:opacity-100'
                          }`}
                          style={{
                            background: `linear-gradient(135deg, ${themeItem.primary} 55%, ${themeItem.lightBg} 55%)`,
                          }}
                        >
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Section 1 */}
            <div className="pb-2">
              <div className={sectionLabelClass}>{t.drawerSec1}</div>
              <div className="space-y-0.5 font-lalezar text-xs sm:text-[13px]">
                {onGoHome && (
                  <button
                    onClick={() => {
                      onClose();
                      onGoHome();
                    }}
                    className={rowClass}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={iconBoxClass}><Home className="w-4 h-4" /></span>
                      <span className="font-bold truncate">{t.drawerItemHome}</span>
                    </div>
                    <ChevronLeft className={`w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
                  </button>
                )}

                <button
                  onClick={() => {
                    onClose();
                    onOpenAllBayanat();
                  }}
                  className={rowClass}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={iconBoxClass}><Headphones className="w-4 h-4" /></span>
                    <span className="font-bold truncate">{t.drawerItemAllBayanat}</span>
                  </div>
                  <ChevronLeft className={`w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenIslahiBayanat();
                  }}
                  className={rowClass}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={iconBoxClass}><HeartHandshake className="w-4 h-4" /></span>
                    <span className="font-bold truncate">{t.drawerItemGoldAudio}</span>
                  </div>
                  <ChevronLeft className={`w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
                </button>

                {(onOpenBooks || onOpenUrl) && (
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenBooks) {
                        onOpenBooks();
                      } else if (onOpenUrl) {
                        onOpenUrl(URDU_BOOKS_URL);
                      }
                    }}
                    className={rowClass}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={iconBoxClass}><BookOpen className="w-4 h-4" /></span>
                      <span className="font-bold truncate">{t.drawerItemBooks}</span>
                    </div>
                    <ChevronLeft className={`w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
                  </button>
                )}

                {(onOpenNews || onOpenUrl) && (
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenNews) {
                        onOpenNews();
                      } else if (onOpenUrl) {
                        onOpenUrl(NEWS_UPDATES_URL);
                      }
                    }}
                    className={rowClass}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={iconBoxClass}><Bell className="w-4 h-4" /></span>
                      <span className="font-bold truncate">{t.drawerItemNews}</span>
                    </div>
                    <ChevronLeft className={`w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
                  </button>
                )}

                <button
                  onClick={() => {
                    onClose();
                    onOpenWebsite();
                  }}
                  className={rowClass}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={iconBoxClass}><Globe className="w-4 h-4" /></span>
                    <span className="font-bold truncate">{t.drawerItemWebsite}</span>
                  </div>
                  <ChevronLeft className={`w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
                </button>

                {onOpenDonations && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenDonations();
                    }}
                    className={rowClass}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={iconBoxClass}><HeartHandshake className="w-4 h-4 text-rose-500" /></span>
                      <span className="font-bold truncate">{donationLabels.drawerLabel}</span>
                    </div>
                    <ChevronLeft className={`w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
                  </button>
                )}

                {onOpenAutoSilent && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAutoSilent();
                    }}
                    className={rowClass}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={iconBoxClass}><BellOff className="w-4 h-4 text-[#00c975] dark:text-[#00ff99]" /></span>
                      <span className="font-bold truncate">{autoSilentLabels.drawerLabel}</span>
                    </div>
                    <ChevronLeft className={`w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            {/* Section 2 */}
            <div className="pb-2">
              <div className={sectionLabelClass}>{t.drawerSec2}</div>
              <div className="space-y-0.5 font-lalezar text-xs sm:text-[13px]">
                <button
                  onClick={() => {
                    onClose();
                    onOpenIntroKhanqah();
                  }}
                  className={rowClass}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={iconBoxClass}><Landmark className="w-4 h-4" /></span>
                    <span className="font-bold truncate">{t.drawerItemIntroKhanqah}</span>
                  </div>
                  <ChevronLeft className={`w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenIntroSheikh();
                  }}
                  className={rowClass}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={iconBoxClass}><UserCheck className="w-4 h-4" /></span>
                    <span className="font-bold truncate">{t.drawerItemIntroSheikh}</span>
                  </div>
                  <ChevronLeft className={`w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
                </button>

                {onOpenTerms && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenTerms();
                    }}
                    className={rowClass}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={iconBoxClass}><FileText className="w-4 h-4" /></span>
                      <span className="font-bold truncate">{t.drawerItemTerms}</span>
                    </div>
                    <ChevronLeft className={`w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
                  </button>
                )}

                {onOpenPrivacy && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPrivacy();
                    }}
                    className={rowClass}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={iconBoxClass}><ShieldCheck className="w-4 h-4" /></span>
                      <span className="font-bold truncate">{t.drawerItemPrivacy}</span>
                    </div>
                    <ChevronLeft className={`w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            {/* Section 3 */}
            <div className="pb-1">
              <div className={sectionLabelClass}>{t.drawerSec3}</div>
              <div className="space-y-0.5 font-lalezar text-xs sm:text-[13px]">
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenWhatsAppGroups) {
                      onOpenWhatsAppGroups();
                    } else {
                      onOpenContact();
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group border cursor-pointer ${
                    dir === 'ltr' ? 'text-left' : 'text-right'
                  } ${
                    isDark
                      ? 'border-emerald-600/40 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-100'
                      : 'border-emerald-600/25 bg-emerald-50 hover:bg-emerald-100 text-emerald-950'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 shrink-0 rounded-lg bg-[#25D366] text-white flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 fill-white" />
                    </span>
                    <span className="font-bold truncate">{t.drawerItemWaGroups}</span>
                  </div>
                  <span className="text-[10px] font-sans font-bold bg-[#25D366] text-white px-2 py-0.5 rounded shrink-0">
                    {t.drawerJoinTag}
                  </span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenContact();
                  }}
                  className={rowClass}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={iconBoxClass}><PhoneCall className="w-4 h-4" /></span>
                    <span className="font-bold truncate">{t.drawerItemContact}</span>
                  </div>
                  <ChevronLeft className={`w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenAbout();
                  }}
                  className={rowClass}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={iconBoxClass}><Info className="w-4 h-4" /></span>
                    <span className="font-bold truncate">{t.drawerItemAbout}</span>
                  </div>
                  <ChevronLeft className={`w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Social Media Links */}
          <div
            className={`p-3 border-t border-[#d4af37]/30 space-y-1.5 shrink-0 ${
              isDark ? 'bg-[#05120b]' : 'bg-[#f4f7f6]'
            }`}
          >
            <div className="flex items-center justify-center gap-5">
              <button
                onClick={() => {
                  onClose();
                  if (onOpenWhatsAppGroups) {
                    onOpenWhatsAppGroups();
                  } else {
                    onOpenContact();
                  }
                }}
                className="text-[#25D366] hover:scale-110 transition-transform p-1.5 cursor-pointer"
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
            <div className="text-[10px] text-center space-y-1">
              <p className="opacity-75 font-sans" dir="ltr">
                Khanqah Darul Falah © 2026 ·{' '}
                <a
                  href={DEVELOPER_WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[#064326] dark:text-[#00ff99] underline decoration-[#d4af37]/70 underline-offset-2 hover:text-[#25D366]"
                  title="واٹس ایپ پر رابطہ کریں"
                >
                  Developed by Abu-HamadGrfx
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

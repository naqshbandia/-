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
} from 'lucide-react';
import {
  OFFICIAL_APK_URL,
  URDU_BOOKS_URL,
  NEWS_UPDATES_URL,
  DEVELOPER_WHATSAPP_URL,
} from '../data/appConfig';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGoHome?: () => void;
  onOpenIntroKhanqah: () => void;
  onOpenIntroSheikh: () => void;
  onOpenAllBayanat: () => void;
  onOpenIslahiBayanat: () => void;
  onOpenUrl?: (url: string) => void;
  onOpenWhatsAppGroups?: () => void;
  onOpenContact: () => void;
  onOpenWebsite: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  onOpenAbout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onRefreshBlogger?: () => void;
  isRefreshingBlogger?: boolean;
}

export const HamburgerDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  onGoHome,
  onOpenIntroKhanqah,
  onOpenIntroSheikh,
  onOpenAllBayanat,
  onOpenIslahiBayanat,
  onOpenUrl,
  onOpenWhatsAppGroups,
  onOpenContact,
  onOpenWebsite,
  onOpenTerms,
  onOpenPrivacy,
  onOpenAbout,
  isDark,
  onToggleTheme,
  onRefreshBlogger,
  isRefreshingBlogger = false,
}) => {
  if (!isOpen) return null;

  const rowClass = `w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group text-right cursor-pointer ${
    isDark
      ? 'hover:bg-[#103321] text-emerald-50 border border-transparent hover:border-[#d4af37]/30'
      : 'hover:bg-emerald-50 text-[#11261b] border border-transparent hover:border-emerald-900/10'
  }`;

  const iconBoxClass =
    'w-8 h-8 shrink-0 rounded-lg bg-[#064326]/10 dark:bg-[#d4af37]/15 text-[#064326] dark:text-[#d4af37] flex items-center justify-center group-hover:bg-[#064326] group-hover:text-white transition-colors';

  const sectionLabelClass =
    'px-3 pt-3 pb-1 text-[11px] font-bold tracking-wide text-[#8c6514] dark:text-[#d4af37]/90';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none" dir="rtl">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-[90vw] flex">
        <div
          className={`w-80 sm:w-88 border-l-2 border-[#d4af37] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 transition-colors overflow-hidden ${
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
                src={`${import.meta.env.BASE_URL}app-logo.webp`}
                alt="خانقاہ دارالفلاح لوگو"
                className="w-10 h-10 rounded-full shadow-md border-2 border-[#d4af37] object-cover shrink-0"
              />
              <div>
                <h3 className="text-lg font-extrabold font-lalezar leading-tight">
                  خانقاہ دارالفلاح
                </h3>
                <p className="text-[10px] text-[#d4af37] font-sans font-semibold tracking-wide">
                  KHANQAH DAR-UL-FALAH
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#d4af37] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="بند کریں"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Listed Menu */}
          <div className="flex-1 overflow-y-auto px-2 pb-4 divide-y divide-emerald-950/10 dark:divide-white/10">
            {/* Quick Controls Bar */}
            <div className="py-2.5 px-1 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onToggleTheme}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[#0e291b] border-[#d4af37]/30 text-amber-200 hover:bg-[#143a27]'
                      : 'bg-[#f4f7f6] border-emerald-900/15 text-[#064326] hover:bg-emerald-50'
                  }`}
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-[#064326]" />}
                  <span>{isDark ? 'لائٹ تھیم' : 'ڈارک تھیم'}</span>
                </button>

                {onRefreshBlogger && (
                  <button
                    onClick={onRefreshBlogger}
                    disabled={isRefreshingBlogger}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isDark
                        ? 'bg-[#0e291b] border-[#d4af37]/30 text-emerald-200 hover:bg-[#143a27]'
                        : 'bg-[#f4f7f6] border-emerald-900/15 text-[#064326] hover:bg-emerald-50'
                    }`}
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isRefreshingBlogger ? 'animate-spin' : ''}`} />
                    <span>{isRefreshingBlogger ? 'تازہ جاری...' : 'اپ ڈیٹ'}</span>
                  </button>
                )}
              </div>

              {/* Direct Official APK Download Button */}
              <a
                href={OFFICIAL_APK_URL}
                download="khanqah-Darul-falah.apk"
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#064326] hover:bg-[#095c34] text-white font-lalezar text-xs border border-[#d4af37]/60 shadow-sm active:scale-95 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#d4af37]" />
                  <span>اینڈرائڈ APK ایپ ڈاؤنلوڈ کریں</span>
                </div>
                <span className="text-[10px] bg-[#d4af37] text-[#051a0f] px-2 py-0.5 rounded font-sans font-bold">
                  APK
                </span>
              </a>
            </div>

            {/* Section 1: صفحات و لائبریری */}
            <div className="pb-2">
              <div className={sectionLabelClass}>صفحات و آڈیو لائبریری</div>
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
                      <span className="font-bold truncate">1. ہوم ڈیش بورڈ</span>
                    </div>
                    <ChevronLeft className="w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0" />
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
                    <span className="font-bold truncate">2. تمام بیانات (فولڈر وائز)</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0" />
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
                    <span className="font-bold truncate">3. گولڈ آڈیو پیج و مجالس</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0" />
                </button>

                {onOpenUrl && (
                  <>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenUrl(URDU_BOOKS_URL);
                      }}
                      className={rowClass}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={iconBoxClass}><BookOpen className="w-4 h-4" /></span>
                        <span className="font-bold truncate">4. اسلامی اردو کتب لائبریری</span>
                      </div>
                      <ChevronLeft className="w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0" />
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenUrl(NEWS_UPDATES_URL);
                      }}
                      className={rowClass}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={iconBoxClass}><Bell className="w-4 h-4" /></span>
                        <span className="font-bold truncate">5. خبریں اور اعلانات</span>
                      </div>
                      <ChevronLeft className="w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0" />
                    </button>
                  </>
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
                    <span className="font-bold truncate">6. آفیشل ویب سائٹ (بلاگر)</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0" />
                </button>
              </div>
            </div>

            {/* Section 2: تعارف و شرائط */}
            <div className="pb-2">
              <div className={sectionLabelClass}>تعارف و پالیسیاں</div>
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
                    <span className="font-bold truncate">7. خانقاہ دارالفلاح کا تعارف</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0" />
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
                    <span className="font-bold truncate">8. تعارف شیخ مولانا محمد جمشید صاحب</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0" />
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
                      <span className="font-bold truncate">9. شرائط و ضوابط (Terms)</span>
                    </div>
                    <ChevronLeft className="w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0" />
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
                      <span className="font-bold truncate">10. پرائیویسی پالیسی (Privacy)</span>
                    </div>
                    <ChevronLeft className="w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0" />
                  </button>
                )}
              </div>
            </div>

            {/* Section 3: رابطہ و ایپ */}
            <div className="pb-1">
              <div className={sectionLabelClass}>رابطہ و کمیونٹی</div>
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
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group text-right border cursor-pointer ${
                    isDark
                      ? 'border-emerald-600/40 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-100'
                      : 'border-emerald-600/25 bg-emerald-50 hover:bg-emerald-100 text-emerald-950'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 shrink-0 rounded-lg bg-[#25D366] text-white flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 fill-white" />
                    </span>
                    <span className="font-bold truncate">واٹس ایپ گروپس و چینل</span>
                  </div>
                  <span className="text-[10px] font-sans font-bold bg-[#25D366] text-white px-2 py-0.5 rounded shrink-0">
                    جوائن
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
                    <span className="font-bold truncate">رابطہ کریں (Contact Us)</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0" />
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
                    <span className="font-bold truncate">ایپلیکیشن کے بارے میں</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0" />
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

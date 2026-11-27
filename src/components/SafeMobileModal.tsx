import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  ExternalLink,
  Search,
  Share2,
  MessageCircle,
  Lock,
} from 'lucide-react';
import { BaseModal } from './Modals';
import { OFFICIAL_APK_URL } from '../data/appConfig';
import { AppLanguage, DEFAULT_LANGUAGE, getDir } from '../data/translations';
import {
  SafeMobileStatus,
  getAndroidBridge,
  getNativeSafeMobileStatus,
} from '../utils/nativeAutoSilent';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  lang?: AppLanguage;
  onNotify?: (msg: string) => void;
}

const PRIMARY_FAMILY_DNS = 'family.adguard-dns.com';
const BACKUP_FAMILY_DNS = 'family-filter-dns.cleanbrowsing.org';
const GOOGLE_SAFESEARCH_URL = 'https://www.google.com/safesearch';

export const SafeMobileModal: React.FC<Props> = ({
  isOpen,
  onClose,
  isDark = true,
  lang = DEFAULT_LANGUAGE,
  onNotify,
}) => {
  const dir = getDir(lang);
  const [status, setStatus] = useState<SafeMobileStatus>(() =>
    getNativeSafeMobileStatus()
  );
  const [copiedHost, setCopiedHost] = useState<string | null>(null);

  const refreshStatus = useCallback(() => {
    setStatus(getNativeSafeMobileStatus());
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    refreshStatus();
    const handleFocus = () => refreshStatus();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshStatus();
    };
    window.addEventListener('kdf-native-resume', handleFocus);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('kdf-native-resume', handleFocus);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isOpen, refreshStatus]);

  const isFamilyFilterKnown = useMemo(() => {
    const s = (status.privateDnsServer || '').toLowerCase();
    return (
      status.privateDnsActive &&
      (s.includes('family') || s.includes('cleanbrowsing') || s.includes('adguard') || s.length > 0)
    );
  }, [status]);

  const copyText = async (val: string, msg: string) => {
    try {
      await navigator.clipboard?.writeText(val);
      setCopiedHost(val);
      window.setTimeout(() => setCopiedHost(null), 2800);
      onNotify?.(msg);
    } catch {
      onNotify?.(`یہ کوڈ نوٹ کر لیں: ${val}`);
    }
  };

  const handleOpenPrivateDns = async (host = PRIMARY_FAMILY_DNS) => {
    try {
      await navigator.clipboard?.writeText(host);
      setCopiedHost(host);
      window.setTimeout(() => setCopiedHost(null), 3500);
    } catch {
      // Clipboard may still be populated on native side
    }

    const bridge = getAndroidBridge();
    if (bridge && typeof bridge.openPrivateDnsSettings === 'function') {
      bridge.openPrivateDnsSettings(host);
      return;
    }

    onNotify?.(
      `${host} کاپی ہو گیا! موبائل کی Settings ← Network & Internet ← Private DNS میں پیسٹ کر کے Save کریں۔`
    );
  };

  const handleOpenExternal = (url: string, label: string) => {
    const bridge = getAndroidBridge();
    if (bridge && typeof bridge.openExternalUrl === 'function') {
      bridge.openExternalUrl(url);
      onNotify?.(label);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareText = useMemo(
    () =>
      [
        '🛡️ *پاک موبائل سیفٹی — فحاشی و گندے اشتہارات سے بچاؤ (صدقۂ جاریہ)*',
        '',
        'اپنے اور اپنے بچوں کے موبائل میں فحش ویب سائٹس، گندے اشتہارات اور غلط سرچ نتائج مستقل بند کرنے کے لیے خانقاہ دارالفلاح ایپ میں *"پاک موبائل سیفٹی"* کھول کر Private DNS آن کریں:',
        `کوڈ: ${PRIMARY_FAMILY_DNS}`,
        '',
        '📲 *خانقاہ دارالفلاح آفیشل ایپ ڈاؤنلوڈ لنک:*',
        OFFICIAL_APK_URL,
      ].join('\n'),
    []
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="🛡️ پاک موبائل سیفٹی (گندے ایڈز و فحش بلاک)"
      isDark={isDark}
      lang={lang}
      compact
    >
      <div className="space-y-3 text-xs" dir={dir}>
        {/* Live System Status Card */}
        <div
          className={`p-3 rounded-2xl border-2 space-y-2 shadow-sm ${
            isFamilyFilterKnown
              ? isDark
                ? 'bg-[#062918] border-[#00c853]/70 text-emerald-50'
                : 'bg-emerald-50 border-[#00a144] text-[#05331c]'
              : isDark
              ? 'bg-gradient-to-b from-[#0b2316] to-[#08170f] border-[#d4af37]/75 text-emerald-50'
              : 'bg-gradient-to-b from-amber-50 to-white border-[#d4af37] text-[#11261b]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {isFamilyFilterKnown ? (
                <ShieldCheck className="w-5 h-5 text-[#00e676] shrink-0" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-[#d4af37] shrink-0" />
              )}
              <div className="min-w-0">
                <div className="font-extrabold text-xs sm:text-[13px] truncate">
                  {status.isNative
                    ? isFamilyFilterKnown
                      ? 'پورے موبائل کا پاک فلٹر آن ہے ✅'
                      : 'موبائل کا سسٹم فلٹر ابھی آن نہیں ہے'
                    : 'فحاشی، گندے ایڈز اور غلط سرچ بلاک سیٹنگ'}
                </div>
                {isFamilyFilterKnown && status.privateDnsServer && (
                  <div className="text-[10.5px] font-mono opacity-85 truncate" dir="ltr">
                    Active DNS: {status.privateDnsServer}
                  </div>
                )}
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                isFamilyFilterKnown
                  ? 'bg-[#00c853] text-[#042110]'
                  : 'bg-[#d4af37] text-[#051a0f]'
              }`}
            >
              {isFamilyFilterKnown ? 'محفوظ ✓' : 'سیٹ کریں'}
            </span>
          </div>

          <p className="text-[11px] leading-relaxed opacity-90">
            اینڈرائیڈ سیکیورٹی قوانین کی وجہ سے کوئی بھی ایپ صارف کی اجازت کے بغیر فون کی سسٹم سیٹنگ خود نہیں بدل سکتی، لیکن نیچے دیا گیا <strong>1 کلک طریقہ</strong> آن کرنے کے بعد{' '}
            <strong>پورے موبائل (کروم، براؤزرز، سرچ اور ایپس)</strong> میں فحش ویب سائٹس، گندے ویڈیوز اور نامناسب اشتہارات مستقل طور پر خودکار بند ہو جاتے ہیں۔
          </p>
        </div>

        {/* Step 1: System-Wide Private DNS (Strongest Zero-Battery Protection) */}
        <div
          className={`p-3 rounded-2xl border-2 border-[#d4af37]/60 space-y-2.5 ${
            isDark ? 'bg-[#08180f] text-emerald-50' : 'bg-white text-[#11261b]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-extrabold text-xs sm:text-[13px] text-[#064326] dark:text-[#d4af37]">
              <Lock className="w-4 h-4 shrink-0" />
              <span>1. پورے موبائل کی مکمل حفاظت (Private DNS)</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-[#064326] dark:text-[#00ff99] font-bold">
              بغیر VPN
            </span>
          </div>

          <ul className="text-[11px] space-y-1 opacity-90 list-disc ps-4">
            <li>تمام فحش ویب سائٹس (18+ / Adult Sites) فوری بند</li>
            <li>گندے اور فحش اشتہارات (Bad Ads) اور پاپ اپس بند</li>
            <li>Google، Bing اور YouTube سرچ پر محفوظ نتائج خودکار لاک</li>
          </ul>

          {/* DNS Hostname Copy Row */}
          <div
            className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
              isDark
                ? 'bg-[#041009] border-[#d4af37]/35'
                : 'bg-[#f4f9f6] border-emerald-900/15'
            }`}
            dir="ltr"
          >
            <code className="text-xs font-extrabold text-[#064326] dark:text-[#00ff99] select-all truncate">
              {PRIMARY_FAMILY_DNS}
            </code>
            <button
              type="button"
              onClick={() =>
                copyText(
                  PRIMARY_FAMILY_DNS,
                  `${PRIMARY_FAMILY_DNS} کاپی ہو گیا! اب Private DNS میں پیسٹ کریں`
                )
              }
              className="px-2.5 py-1 rounded-lg bg-[#064326] text-white text-[10.5px] font-bold flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
            >
              {copiedHost === PRIMARY_FAMILY_DNS ? (
                <>
                  <Check className="w-3 h-3 text-[#00ff99]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-[#d4af37]" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleOpenPrivateDns(PRIMARY_FAMILY_DNS)}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f0cf65] to-[#b08d43] hover:brightness-105 text-[#051a0f] font-extrabold text-xs border border-white/50 shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>⚡ 1 کلک میں کوڈ کاپی کر کے Private DNS سیٹنگ کھولیں</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </button>

          <div
            className={`p-2.5 rounded-xl border text-[10.5px] leading-relaxed space-y-1 ${
              isDark
                ? 'bg-[#0d2417] border-[#d4af37]/30 text-emerald-100'
                : 'bg-amber-50/70 border-[#d4af37]/50 text-[#11261b]'
            }`}
          >
            <div className="font-extrabold text-[#8c6514] dark:text-[#f7e7a9]">
              📋 صرف 10 سیکنڈ کا آسان طریقہ:
            </div>
            <div>
              <strong>1.</strong> اوپر بٹن دبا کر کھلنے والی سیٹنگ میں <strong>More connections</strong> (یا <strong>Network &amp; Internet</strong> / اوپر سرچ 🔍) میں <strong>Private DNS</strong> کھولیں۔
            </div>
            <div>
              <strong>2.</strong> تیسرا آپشن <strong>Private DNS provider hostname</strong> منتخب کریں۔
            </div>
            <div>
              <strong>3.</strong> وہاں <strong>{PRIMARY_FAMILY_DNS}</strong> پیسٹ کر کے <strong>Save</strong> کر دیں (بیک اپ کوڈ:{' '}
              <button
                type="button"
                onClick={() => copyText(BACKUP_FAMILY_DNS, `${BACKUP_FAMILY_DNS} کاپی ہو گیا`)}
                className="underline font-mono text-[#064326] dark:text-[#00ff99] cursor-pointer"
                dir="ltr"
              >
                {BACKUP_FAMILY_DNS}
              </button>
              )۔
            </div>
          </div>
        </div>

        {/* Step 2: Google SafeSearch Lock */}
        <div
          className={`p-3 rounded-2xl border border-[#d4af37]/45 space-y-2 ${
            isDark ? 'bg-[#08180f]' : 'bg-white'
          }`}
        >
          <div className="flex items-center gap-1.5 font-extrabold text-xs text-[#064326] dark:text-[#d4af37]">
            <Search className="w-4 h-4 shrink-0" />
            <span>2. Google سرچ فلٹر (SafeSearch)</span>
          </div>
          <p className="text-[10.5px] opacity-85 leading-relaxed">
            کروم اور گوگل سرچ میں فحش تصاویر اور گندے صفحات ہمیشہ کے لیے چھپانے کے لیے نیچے بٹن دبا کر <strong>Filter (فلٹر)</strong> منتخب کریں۔
          </p>
          <button
            type="button"
            onClick={() =>
              handleOpenExternal(
                GOOGLE_SAFESEARCH_URL,
                'Google SafeSearch صفحہ کھولا جا رہا ہے — وہاں Filter منتخب کریں'
              )
            }
            className="w-full py-2 px-2.5 rounded-xl bg-[#064326] hover:bg-[#095c34] text-white font-bold text-[11px] border border-[#d4af37]/60 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Search className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
            <span>SafeSearch آن کریں</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </button>
        </div>

        {/* Share Sadaqah Jariyah Card */}
        <div
          className={`p-3 rounded-2xl border border-[#d4af37]/50 space-y-2 text-center ${
            isDark ? 'bg-[#08180f]' : 'bg-[#f8fbf9]'
          }`}
        >
          <p className="text-[11px] font-bold text-[#064326] dark:text-[#d4af37]">
            🤲 اپنے گھر والوں اور دوستوں کے موبائل پاک و محفوظ بنانے کے لیے شیئر کریں
          </p>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#1faa4e] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <MessageCircle className="w-4 h-4 fill-white shrink-0" />
            <span>واٹس ایپ پر شیئر کریں</span>
            <Share2 className="w-3.5 h-3.5 shrink-0" />
          </a>
        </div>
      </div>
    </BaseModal>
  );
};

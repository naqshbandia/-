import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  BellOff,
  ChevronLeft,
  ChevronRight,
  Check,
  MessageCircle,
  Share2,
  FileDown,
  Image as ImageIcon,
  Play,
  Pause,
  Printer,
  Settings,
  Copy,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { BaseModal } from './Modals';
import {
  downloadAutoSilentGuideJpg,
  downloadAutoSilentGuidePdf,
} from '../utils/autoSilentJpg';
import {
  AppLanguage,
  DEFAULT_LANGUAGE,
  getDir,
} from '../data/translations';
import {
  JamaatKey,
  JamaatScheduleItem,
  PrayerCache,
  formatTo12Hour,
} from '../utils/prayerEngine';
import {
  AutoSilentSlot,
  NativeAutoSilentStatus,
  buildDefaultAutoSilentSlots,
  getAndroidBridge,
  getNativeAutoSilentStatus,
  loadAutoSilentConfig,
  saveAndSyncAutoSilentConfig,
} from '../utils/nativeAutoSilent';

export type { AutoSilentSlot };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  lang?: AppLanguage;
  officialSchedule?: Record<JamaatKey, JamaatScheduleItem>;
  prayerData?: PrayerCache | null;
  onNotify?: (msg: string) => void;
}

export const AutoSilentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  isDark = true,
  lang = DEFAULT_LANGUAGE,
  officialSchedule,
  prayerData,
  onNotify,
}) => {
  const dir = getDir(lang);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isExportingJpg, setIsExportingJpg] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showDndSettingsTip, setShowDndSettingsTip] = useState(false);
  const [copiedSchedule, setCopiedSchedule] = useState(false);
  const [isTestingSilent, setIsTestingSilent] = useState(false);
  const [showScheduleEditor, setShowScheduleEditor] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const totalSlides = 4;

  const [config, setConfig] = useState(() =>
    loadAutoSilentConfig(officialSchedule, prayerData)
  );
  const [nativeStatus, setNativeStatus] = useState<NativeAutoSilentStatus>(() =>
    getNativeAutoSilentStatus()
  );

  const refreshNativeAndSync = useCallback(() => {
    const status = getNativeAutoSilentStatus();
    setNativeStatus(status);
    if (status.isNative && status.dndGranted) {
      const latest = loadAutoSilentConfig(officialSchedule, prayerData);
      setConfig(latest);
      saveAndSyncAutoSilentConfig(latest);
      setNativeStatus(getNativeAutoSilentStatus());
    }
  }, [officialSchedule, prayerData]);

  // Reload config & native permission status whenever modal opens or user returns from Android Settings
  useEffect(() => {
    if (!isOpen) return;
    const latest = loadAutoSilentConfig(officialSchedule, prayerData);
    setConfig(latest);
    saveAndSyncAutoSilentConfig(latest);
    setNativeStatus(getNativeAutoSilentStatus());

    const handleResume = () => {
      refreshNativeAndSync();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshNativeAndSync();
      }
    };
    window.addEventListener('kdf-native-resume', handleResume);
    window.addEventListener('focus', handleResume);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('kdf-native-resume', handleResume);
      window.removeEventListener('focus', handleResume);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isOpen, officialSchedule, prayerData, refreshNativeAndSync]);

  // Automatic smooth slide transition (pauses when modal closes or user pauses)
  useEffect(() => {
    if (!isOpen || !isAutoPlaying) return;
    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [isOpen, isAutoPlaying]);

  const slots = config.slots;

  const handleToggleMaster = () => {
    const next = {
      ...config,
      masterEnabled: !config.masterEnabled,
    };
    setConfig(next);
    const { nativeResult } = saveAndSyncAutoSilentConfig(next);
    setNativeStatus(getNativeAutoSilentStatus());
    if (next.masterEnabled) {
      if (nativeResult === 'NO_PERMISSION') {
        getAndroidBridge()?.requestDndPermission?.();
      } else {
        onNotify?.('خودکار نماز آٹو سائلنٹ آن کر دیا گیا!');
      }
    } else {
      onNotify?.('آٹو سائلنٹ شیڈول عارضی طور پر بند کر دیا گیا۔');
    }
  };

  const handleToggleSlot = (key: JamaatKey) => {
    const nextSlots = config.slots.map((s) =>
      s.key === key ? { ...s, enabled: !s.enabled } : s
    );
    const next = { ...config, customized: true, slots: nextSlots };
    setConfig(next);
    saveAndSyncAutoSilentConfig(next);
    setNativeStatus(getNativeAutoSilentStatus());
  };

  const handleChangeSlotTime = (
    key: JamaatKey,
    field: 'start' | 'end',
    value: string
  ) => {
    if (!value) return;
    const nextSlots = config.slots.map((s) =>
      s.key === key ? { ...s, [field]: value } : s
    );
    setConfig({ ...config, customized: true, slots: nextSlots });
  };

  const handleSaveCustomSlots = () => {
    const next = { ...config, masterEnabled: true, customized: true };
    setConfig(next);
    const { nativeResult } = saveAndSyncAutoSilentConfig(next);
    setNativeStatus(getNativeAutoSilentStatus());
    if (nativeStatus.isNative && nativeResult === 'NO_PERMISSION') {
      onNotify?.('براہ کرم پہلے Do Not Disturb کی اجازت (Allow) آن کریں۔');
      getAndroidBridge()?.requestDndPermission?.();
    } else {
      onNotify?.('تمام نمازوں کا آٹو سائلنٹ شیڈول محفوظ و فعال ہو گیا!');
    }
  };

  const handleResetDefaultSlots = () => {
    const defaults = buildDefaultAutoSilentSlots(officialSchedule, prayerData);
    const next = {
      masterEnabled: true,
      customized: false,
      slots: defaults,
    };
    setConfig(next);
    saveAndSyncAutoSilentConfig(next);
    setNativeStatus(getNativeAutoSilentStatus());
    onNotify?.('اوقات مسجد کے تازہ ترین جماعت شیڈول کے مطابق ری سیٹ ہو گئے!');
  };

  const handleAllowDndPermission = () => {
    const bridge = getAndroidBridge();
    if (bridge && typeof bridge.requestDndPermission === 'function') {
      bridge.requestDndPermission();
      onNotify?.("کھلنے والی فہرست میں 'Khanqah Darul Falah' کو آن (Allow) کر کے بیک آئیں۔");
    } else {
      handleOpenMobileDndSettings();
    }
  };

  const handleTestSilentToggle = () => {
    const bridge = getAndroidBridge();
    if (!bridge || typeof bridge.setSilentNow !== 'function') return;
    const nextSilent = !isTestingSilent;
    const ok = bridge.setSilentNow(nextSilent);
    if (ok) {
      setIsTestingSilent(nextSilent);
      onNotify?.(
        nextSilent
          ? 'ٹیسٹ: آپ کا موبائل اس وقت سائلنٹ (DND) کر دیا گیا ہے!'
          : 'ٹیسٹ: موبائل واپس نارمل موڈ پر بحال کر دیا گیا ہے!'
      );
    } else {
      handleAllowDndPermission();
    }
  };

  const handleDownloadHtmlGuide = async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}khanqah-auto-silent.html?_t=${Date.now()}`);
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'khanqah-auto-silent.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onNotify?.('آٹو سائلنٹ HTML فائل ڈاؤنلوڈ ہو گئی!');
    } catch {
      onNotify?.('HTML فائل ڈاؤنلوڈ کرنے میں دشواری پیش آئی۔');
    }
  };

  const handleDownloadJpgGuide = async () => {
    setIsExportingJpg(true);
    try {
      await downloadAutoSilentGuideJpg(slots);
      onNotify?.('پرنٹ کے قابل A4 JPG اشتہار ڈاؤنلوڈ ہو گیا — گیلری یا پرنٹ کے لیے تیار ہے!');
    } catch {
      onNotify?.('JPG تصویر بنانے میں دشواری پیش آئی۔');
    } finally {
      setIsExportingJpg(false);
    }
  };

  const handleDownloadPdfGuide = async () => {
    setIsExportingPdf(true);
    try {
      await downloadAutoSilentGuidePdf(slots);
      onNotify?.('مسجد پرنٹ کے لیے A4 PDF اشتہار ڈاؤنلوڈ ہو گیا!');
    } catch {
      onNotify?.('PDF اشتہار بنانے میں دشواری پیش آئی۔');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const whatsappShareUrl = useMemo(() => {
    const lines = [
      '🔕 *نماز آٹو سائلنٹ موڈ — صدقۂ جاریہ*',
      '',
      'مسجد میں نماز کے دوران موبائل کی گھنٹی بجنے سے بچنے کے لیے درج ذیل اوقات پر موبائل آٹو سائلنٹ سیٹ کر لیں:',
      '',
      ...slots
        .filter((s) => s.enabled)
        .map((s) => `• ${s.labelUrdu}: ${formatTo12Hour(s.start)} تا ${formatTo12Hour(s.end)}`),
      '',
      '📌 *اہم نوٹ:* اگر آپ کی مسجد کے امام صاحب کسی نماز کی جماعت کا وقت تبدیل فرمائیں، تو آپ بھی اپنے شیڈول میں اس نماز کا وقت ضرور تبدیل کر لیں۔',
      '',
      '🤲 خانقاہ دارالفلاح اینڈرائڈ ایپ انسٹال کریں اور صرف ایک کلک پر نمازوں میں خودکار سائلنٹ موڈ آن کریں۔',
    ].join('\n');
    return `https://wa.me/?text=${encodeURIComponent(lines)}`;
  }, [slots]);

  const goPrev = () => {
    setIsAutoPlaying(false);
    setCurrentSlide((s) => (s === 0 ? totalSlides - 1 : s - 1));
  };
  const goNext = () => {
    setIsAutoPlaying(false);
    setCurrentSlide((s) => (s + 1) % totalSlides);
  };

  const buildSchedulePlainText = () =>
    slots
      .filter((s) => s.enabled)
      .map((s) => `${s.labelUrdu}: ${formatTo12Hour(s.start)} تا ${formatTo12Hour(s.end)}`)
      .join('\n');

  const handleCopyScheduleTimes = async () => {
    const text = buildSchedulePlainText();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSchedule(true);
      window.setTimeout(() => setCopiedSchedule(false), 3000);
      onNotify?.('تمام 6 نمازوں کے آٹو سائلنٹ اوقات کاپی ہو گئے!');
    } catch {
      onNotify?.('اوقات دیکھ کر موبائل سیٹنگ میں درج کریں۔');
    }
  };

  const handleOpenMobileDndSettings = async () => {
    try {
      await navigator.clipboard?.writeText(buildSchedulePlainText());
    } catch {
      // Ignore clipboard unavailability
    }

    setShowDndSettingsTip(true);

    let invokedNativeBridge = false;
    try {
      const bridge = getAndroidBridge();
      if (bridge && typeof bridge.openDndSettings === 'function') {
        bridge.openDndSettings();
        invokedNativeBridge = true;
      } else if (bridge && typeof bridge.openSoundSettings === 'function') {
        bridge.openSoundSettings();
        invokedNativeBridge = true;
      }
    } catch {
      // Ignore bridge errors
    }

    const isAndroid = /Android/i.test(navigator.userAgent || '');
    if (!invokedNativeBridge && isAndroid) {
      try {
        const intentLink = document.createElement('a');
        intentLink.href = 'intent:#Intent;action=android.settings.ZEN_MODE_SETTINGS;end';
        intentLink.style.display = 'none';
        document.body.appendChild(intentLink);
        intentLink.click();
        document.body.removeChild(intentLink);
      } catch {
        // Ignore blocked Intent URI
      }
    }

    onNotify?.(
      invokedNativeBridge
        ? 'موبائل کی Do Not Disturb سیٹنگ کھولی جا رہی ہے...'
        : 'اوقات کاپی ہو گئے! اگر سیٹنگ خود نہ کھلے تو اوپر سے 🌙 Do Not Disturb بٹن 2 سیکنڈ دبا کر رکھیں۔'
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="🔕 نماز آٹو سائلنٹ موڈ (خودکار خاموشی)"
      isDark={isDark}
      lang={lang}
      compact
    >
      <div className="space-y-2.5 text-xs" dir={dir}>
        {/* NATIVE AUTOMATIC SILENT CONTROL PANEL */}
        <div
          className={`p-3 rounded-2xl border-2 border-[#d4af37]/80 space-y-2.5 shadow-sm ${
            isDark
              ? 'bg-gradient-to-b from-[#062a18] to-[#081b11] text-emerald-50'
              : 'bg-gradient-to-b from-[#f0faf4] to-white text-[#11261b]'
          }`}
        >
          {nativeStatus.isNative ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <ShieldCheck
                    className={`w-4 h-4 shrink-0 ${
                      nativeStatus.dndGranted ? 'text-[#00e676]' : 'text-[#d4af37]'
                    }`}
                  />
                  <span className="font-extrabold text-xs sm:text-[13px] truncate">
                    {nativeStatus.dndGranted
                      ? config.masterEnabled
                        ? 'آٹو سائلنٹ سسٹم فعال ہے ✅'
                        : 'آٹو سائلنٹ عارضی طور پر بند ہے'
                      : 'ایک بار خودکار سائلنٹ کی اجازت دیں'}
                  </span>
                </div>

                {nativeStatus.dndGranted && (
                  <button
                    type="button"
                    onClick={handleToggleMaster}
                    className={`px-2.5 py-1 rounded-full text-[10.5px] font-extrabold border cursor-pointer transition-all shrink-0 ${
                      config.masterEnabled
                        ? 'bg-[#00c853] text-[#042110] border-white/60'
                        : 'bg-slate-600 text-white border-slate-400'
                    }`}
                  >
                    {config.masterEnabled ? 'آن ہے (ON)' : 'آف ہے (OFF)'}
                  </button>
                )}
              </div>

              {!nativeStatus.dndGranted ? (
                <div className="space-y-2">
                  <p className="text-[11px] leading-relaxed opacity-90">
                    صرف ایک بار نیچے <strong>اجازت دیں (Allow)</strong> بٹن دبا کر کھلنے والی فہرست میں{' '}
                    <strong>Khanqah Darul Falah</strong> کو آن کر دیں — اس کے بعد آپ کے موبائل میں{' '}
                    <strong>تمام 6 نمازوں میں خودکار سائلنٹ موڈ</strong> روزانہ خود چلے گا!
                  </p>
                  <button
                    type="button"
                    onClick={handleAllowDndPermission}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f0cf65] to-[#b08d43] hover:brightness-105 text-[#051a0f] font-extrabold text-xs border border-white/50 shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>1 کلک میں اجازت دیں (Allow Auto-Silent)</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] leading-relaxed opacity-90">
                    ہر نماز کے وقت آپ کا موبائل خودکار طور پر خاموش ہو جائے گا اور نماز کے بعد خودکار نارمل (آواز والی) حالت پر واپس آ جائے گا۔
                  </p>

                  {!nativeStatus.exactAlarmGranted && (
                    <button
                      type="button"
                      onClick={() => getAndroidBridge()?.requestExactAlarmPermission?.()}
                      className="w-full py-1.5 px-2.5 rounded-xl bg-amber-500/20 border border-[#d4af37] text-[#8c6514] dark:text-[#f7e7a9] font-bold text-[11px] cursor-pointer"
                    >
                      ⏱️ عین وقت پر خاموشی کے لیے Alarms اجازت آن کریں
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={handleTestSilentToggle}
                      className={`py-2 px-2 rounded-xl border font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all ${
                        isTestingSilent
                          ? 'bg-[#d4af37] text-[#051a0f] border-[#d4af37]'
                          : 'bg-[#064326] text-white border-[#d4af37]/60 hover:bg-[#095c34]'
                      }`}
                    >
                      {isTestingSilent ? (
                        <>
                          <Volume2 className="w-3.5 h-3.5 shrink-0" />
                          <span>واپس نارمل کریں</span>
                        </>
                      ) : (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-[#f7e7a9] shrink-0" />
                          <span>فوری ٹیسٹ (سائلنٹ)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowScheduleEditor((p) => !p)}
                      className={`py-2 px-2 rounded-xl border font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all ${
                        isDark
                          ? 'bg-[#0d281a] text-[#f3d97d] border-[#d4af37]/50'
                          : 'bg-white text-[#064326] border-[#064326]/30'
                      }`}
                    >
                      <Settings className="w-3.5 h-3.5 shrink-0" />
                      <span>{showScheduleEditor ? 'اوقات چھپائیں' : 'اوقات تبدیل کریں'}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Browser / PWA fallback buttons */
            <div className="space-y-2 text-center">
              <p className="font-bold text-[#064326] dark:text-[#d4af37] text-xs">
                مسجد میں نماز کے دوران موبائل کی گھنٹی سے مکمل نجات
              </p>
              <p className="text-[11px] opacity-90 leading-relaxed">
                آفیشل <strong>Android APK</strong> ایپ میں 1 کلک خودکار سائلنٹ سسٹم کام کرتا ہے؛ یا اپنے موبائل کی DND سیٹنگ میں یہ اوقات محفوظ کر لیں۔
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={handleOpenMobileDndSettings}
                  className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#064326] to-[#0a6137] hover:opacity-95 text-white font-bold text-[11.5px] border border-[#d4af37]/80 shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-[#f7e7a9] shrink-0" />
                  <span>موبائل Do Not Disturb سیٹنگ</span>
                  <ExternalLink className="w-3 h-3 opacity-80 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={handleCopyScheduleTimes}
                  className={`py-2 px-3 rounded-xl border font-bold text-[11.5px] flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer ${
                    copiedSchedule
                      ? 'bg-[#d4af37] text-[#051a0f] border-[#d4af37]'
                      : isDark
                      ? 'bg-[#0d281a] hover:bg-[#133825] text-[#f3d97d] border-[#d4af37]/50'
                      : 'bg-white hover:bg-emerald-50 text-[#064326] border-[#064326]/30'
                  }`}
                >
                  {copiedSchedule ? (
                    <>
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>6 اوقات کاپی ہو گئے ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 shrink-0" />
                      <span>6 نمازوں کے اوقات کاپی کریں</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {showDndSettingsTip && (
            <div
              className={`p-2 rounded-xl border text-[10.5px] leading-relaxed text-start ${
                isDark
                  ? 'bg-[#0d2619] border-[#d4af37]/45 text-emerald-100'
                  : 'bg-amber-50 border-[#d4af37]/60 text-[#11261b]'
              }`}
            >
              <div className="font-bold text-[#8c6514] dark:text-[#f7e7a9] mb-0.5">
                ⚡ آسان شارٹ کٹ (ہر اینڈرائڈ موبائل کے لیے):
              </div>
              <p>
                ویب ایپ/کروم میں اگر فون کی سیٹنگ خود نہ کھلے تو{' '}
                <strong>موبائل کی اسکرین اوپر سے نیچے کھینچیں</strong> اور{' '}
                <strong>🌙 Do Not Disturb</strong> بٹن کو{' '}
                <strong>2 سیکنڈ دبا کر رکھیں (Long Press)</strong>۔
              </p>
            </div>
          )}
        </div>

        {/* 6-Prayer Customizable Auto-Silent Schedule Table */}
        {showScheduleEditor && (
          <div
            className={`p-2.5 rounded-2xl border border-[#d4af37]/45 space-y-2 ${
              isDark ? 'bg-[#08180f] text-emerald-50' : 'bg-white text-[#11261b]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-[11.5px] text-[#064326] dark:text-[#d4af37]">
                🕌 تمام 6 نمازوں کے خودکار سائلنٹ اوقات
              </span>
              <button
                type="button"
                onClick={handleResetDefaultSlots}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8c6514] dark:text-[#f7e7a9] hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>مسجد اوقات ری سیٹ</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {slots.map((slot) => (
                <div
                  key={slot.key}
                  className={`p-2 rounded-xl border flex flex-wrap items-center justify-between gap-1.5 transition-opacity ${
                    slot.enabled ? 'opacity-100' : 'opacity-50'
                  } ${
                    isDark
                      ? 'bg-[#0c2317] border-[#d4af37]/25'
                      : 'bg-[#f6faf7] border-emerald-900/15'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-[115px]">
                    <button
                      type="button"
                      onClick={() => handleToggleSlot(slot.key)}
                      className={`px-2 py-0.5 rounded-full text-[9.5px] font-extrabold cursor-pointer ${
                        slot.enabled
                          ? 'bg-[#00c853] text-[#042110]'
                          : 'bg-slate-500 text-white'
                      }`}
                    >
                      {slot.enabled ? 'ON' : 'OFF'}
                    </button>
                    <span className="font-bold text-[11px]">{slot.labelUrdu}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[10.5px]" dir="ltr">
                    <input
                      type="time"
                      value={slot.start}
                      onChange={(e) => handleChangeSlotTime(slot.key, 'start', e.target.value)}
                      className={`px-1.5 py-0.5 rounded-lg border text-[10.5px] font-bold tabular-nums ${
                        isDark
                          ? 'bg-[#06140c] border-[#d4af37]/40 text-emerald-100'
                          : 'bg-white border-emerald-900/20 text-[#064326]'
                      }`}
                    />
                    <span className="opacity-65">→</span>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={(e) => handleChangeSlotTime(slot.key, 'end', e.target.value)}
                      className={`px-1.5 py-0.5 rounded-lg border text-[10.5px] font-bold tabular-nums ${
                        isDark
                          ? 'bg-[#06140c] border-[#d4af37]/40 text-emerald-100'
                          : 'bg-white border-emerald-900/20 text-[#064326]'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSaveCustomSlots}
              className="w-full py-2 px-3 rounded-xl bg-[#064326] hover:bg-[#095c34] text-white font-extrabold text-[11.5px] border border-[#d4af37] shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              ✓ شیڈول محفوظ اور خودکار سائلنٹ اپڈیٹ کریں
            </button>
          </div>
        )}

        {/* Step Number Pills (1, 2, 3, 4) */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { idx: 0, label: '1️⃣ سیٹنگز' },
            { idx: 1, label: '2️⃣ شیڈول' },
            { idx: 2, label: '3️⃣ 6 نمازیں' },
            { idx: 3, label: '4️⃣ محفوظ' },
          ].map((step) => (
            <button
              key={step.idx}
              type="button"
              onClick={() => {
                setIsAutoPlaying(false);
                setCurrentSlide(step.idx);
              }}
              className={`py-1.5 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                currentSlide === step.idx
                  ? 'bg-[#d4af37] text-[#051a0f] border-white shadow-sm'
                  : isDark
                  ? 'bg-[#08180f] text-emerald-100 border-[#d4af37]/30 hover:border-[#d4af37]'
                  : 'bg-white text-[#064326] border-emerald-900/15 hover:bg-emerald-50'
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>

        {/* Swipeable / Sliding Visual Phone Screenshot Carousel */}
        <div
          className={`rounded-2xl border border-[#d4af37]/50 overflow-hidden ${
            isDark ? 'bg-[#06130c]' : 'bg-[#eef4f0]'
          }`}
          onTouchStart={(e) => {
            touchStartX.current = e.changedTouches[0].screenX;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const diff = e.changedTouches[0].screenX - touchStartX.current;
            touchStartX.current = null;
            if (diff < -40) goNext();
            else if (diff > 40) goPrev();
          }}
        >
          <div className="overflow-hidden" dir="ltr">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {/* Slide 1: Settings -> Sound -> Do Not Disturb */}
              <div className="w-full shrink-0 p-3 space-y-2.5" dir={dir}>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#064326] dark:text-[#d4af37] text-xs sm:text-sm">
                    مرحلہ 1: Do Not Disturb کھولیں
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-[#d4af37] text-[#051a0f] font-extrabold text-[10.5px]">
                    تصویر 1 / 4
                  </span>
                </div>

                <div
                  className="max-w-[280px] mx-auto rounded-2xl bg-[#0f172a] border-2 border-slate-600 p-2.5 text-slate-100 shadow-lg font-sans"
                  dir="ltr"
                >
                  <div className="w-14 h-1 bg-slate-600 rounded-full mx-auto mb-2" />
                  <div className="flex justify-between text-[9.5px] text-slate-400 border-b border-white/10 pb-1 mb-2">
                    <span>05:30 AM</span>
                    <span>⚙ Settings › Sound</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 flex justify-between items-center">
                      <span>🔊 Volume &amp; Ringtone</span>
                      <span className="opacity-50">›</span>
                    </div>
                    <div className="px-2.5 py-2 rounded-lg bg-[#064326] border border-[#d4af37] flex justify-between items-center shadow-md">
                      <div>
                        <div className="font-bold text-white">🌙 Do Not Disturb</div>
                        <div className="text-[9.5px] text-emerald-200">خاموشی اور اوقاتِ کار سیٹنگ</div>
                      </div>
                      <span className="text-[#d4af37] font-bold">👈</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 flex justify-between items-center">
                      <span>📅 Schedules / Auto Start</span>
                      <span className="opacity-50">›</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed px-2.5 py-1.5 rounded-lg border-r-3 border-[#d4af37] bg-black/5 dark:bg-white/5">
                  موبائل کی <strong>Settings</strong> میں جا کر <strong>Sound &amp; Vibration</strong> کھولیں اور <strong>Do Not Disturb</strong> (یا Samsung میں Modes &amp; Routines) پر کلک کریں۔
                </p>
              </div>

              {/* Slide 2: Add Schedule & Auto Start / Start-End */}
              <div className="w-full shrink-0 p-3 space-y-2.5" dir={dir}>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#064326] dark:text-[#d4af37] text-xs sm:text-sm">
                    مرحلہ 2: Start اور End ٹائم بنائیں
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-[#d4af37] text-[#051a0f] font-extrabold text-[10.5px]">
                    تصویر 2 / 4
                  </span>
                </div>

                <div
                  className="max-w-[280px] mx-auto rounded-2xl bg-[#0f172a] border-2 border-slate-600 p-2.5 text-slate-100 shadow-lg font-sans"
                  dir="ltr"
                >
                  <div className="w-14 h-1 bg-slate-600 rounded-full mx-auto mb-2" />
                  <div className="flex justify-between text-[9.5px] text-slate-400 border-b border-white/10 pb-1 mb-2">
                    <span>Schedules</span>
                    <span className="text-[#00ff99]">Auto Start ✓</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="px-2.5 py-1.5 rounded-lg bg-[#064326] border border-[#d4af37] flex justify-between items-center">
                      <div>
                        <div className="font-bold">🕌 Fajr Prayer (فجر)</div>
                        <div className="text-[9.5px] text-emerald-200">
                          Start: {formatTo12Hour(slots[0]?.start || '05:50')} · End: {formatTo12Hour(slots[0]?.end || '06:20')}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#00e676] text-[#051a0f] font-bold text-[9px]">ON</span>
                    </div>
                    <div className="flex justify-center gap-1 py-1">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <span
                          key={i}
                          className="w-5 h-5 rounded-full bg-[#064326] border border-[#d4af37] text-[9px] font-bold flex items-center justify-center"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                    <div className="py-1.5 rounded-lg bg-[#064326] border border-[#d4af37] text-center font-bold text-[10.5px]">
                      ✓ Save Schedule (روزانہ خودکار آن)
                    </div>
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed px-2.5 py-1.5 rounded-lg border-r-3 border-[#d4af37] bg-black/5 dark:bg-white/5">
                  <strong>+ Add Schedule</strong> دبا کر نماز کا نام لکھیں، <strong>Start Time</strong> اور <strong>End Time</strong> منتخب کر کے ہفتے کے ساتوں دن آن کریں اور <strong>Save</strong> کریں۔
                </p>
              </div>

              {/* Slide 3: All 6 Prayer Schedules Preview */}
              <div className="w-full shrink-0 p-3 space-y-2.5" dir={dir}>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#064326] dark:text-[#d4af37] text-xs sm:text-sm">
                    مرحلہ 3: پانچ نمازوں و جمعہ کے 6 شیڈول
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-[#d4af37] text-[#051a0f] font-extrabold text-[10.5px]">
                    تصویر 3 / 4
                  </span>
                </div>

                <div
                  className="max-w-[290px] mx-auto rounded-2xl bg-[#0f172a] border-2 border-slate-600 p-2 text-slate-100 shadow-lg font-sans"
                  dir="ltr"
                >
                  <div className="flex justify-between text-[9px] text-slate-400 border-b border-white/10 pb-1 mb-1.5">
                    <span>Prayer Auto-Silent List</span>
                    <span className="text-[#00ff99]">{slots.filter((s) => s.enabled).length} / 6 Active</span>
                  </div>
                  <div className="space-y-1">
                    {slots.map((s) => (
                      <div
                        key={s.key}
                        className={`px-2 py-1 rounded-lg bg-slate-800/90 flex items-center justify-between text-[10px] ${
                          s.enabled ? 'opacity-100' : 'opacity-45'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold truncate">{s.labelUrdu}</div>
                          <div className="text-[9px] text-emerald-300 tabular-nums">
                            {formatTo12Hour(s.start)} → {formatTo12Hour(s.end)}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold ${
                            s.enabled ? 'bg-[#00e676] text-[#051a0f]' : 'bg-slate-600 text-slate-200'
                          }`}
                        >
                          {s.enabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed px-2.5 py-1.5 rounded-lg border-r-3 border-[#d4af37] bg-black/5 dark:bg-white/5">
                  اسی طرح فجر، ظہر، عصر، مغرب، عشاء (روزانہ) اور جمعہ (صرف جمعہ کے دن) کے <strong>6 شیڈول</strong> خودکار طور پر آپ کے موبائل میں چلیں گے۔
                </p>
              </div>

              {/* Slide 4: Calls Mute & Final Confirmation */}
              <div className="w-full shrink-0 p-3 space-y-2.5" dir={dir}>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#064326] dark:text-[#d4af37] text-xs sm:text-sm">
                    مرحلہ 4: کالز بند رکھیں اور محفوظ کریں
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-[#d4af37] text-[#051a0f] font-extrabold text-[10.5px]">
                    تصویر 4 / 4
                  </span>
                </div>

                <div
                  className="max-w-[280px] mx-auto rounded-2xl bg-[#0f172a] border-2 border-slate-600 p-2.5 text-slate-100 shadow-lg font-sans"
                  dir="ltr"
                >
                  <div className="w-14 h-1 bg-slate-600 rounded-full mx-auto mb-2" />
                  <div className="space-y-1.5 text-[11px]">
                    <div className="px-2.5 py-2 rounded-lg bg-[#064326] border border-[#d4af37] flex justify-between items-center">
                      <div>
                        <div className="font-bold">📵 Calls &amp; Messages</div>
                        <div className="text-[9.5px] text-emerald-200">Allow None (نماز میں گھنٹی بند)</div>
                      </div>
                      <Check className="w-4 h-4 text-[#00ff99]" />
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 flex justify-between items-center">
                      <div>
                        <div className="font-bold">🔔 Notifications &amp; Media</div>
                        <div className="text-[9.5px] text-slate-300">Muted automatically</div>
                      </div>
                      <Check className="w-4 h-4 text-[#00ff99]" />
                    </div>
                    <div className="py-1.5 rounded-lg bg-[#d4af37] text-[#051a0f] text-center font-extrabold text-[10.5px]">
                      ✨ سیٹنگ مکمل! اب نماز سکون سے ادا کریں
                    </div>
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed px-2.5 py-1.5 rounded-lg border-r-3 border-[#d4af37] bg-black/5 dark:bg-white/5">
                  نماز کے دوران تمام کالز اور نوٹیفیکیشن خاموش رہیں گے اور نماز کے بعد موبائل خود بخود واپس نارمل آواز پر آ جائے گا۔
                </p>
              </div>
            </div>
          </div>

          {/* Slider Controls with Auto-Play Toggle */}
          <div
            className={`px-3 py-2 flex items-center justify-between gap-2 border-t border-[#d4af37]/30 ${
              isDark ? 'bg-[#08180f]' : 'bg-white'
            }`}
          >
            <button
              type="button"
              onClick={goPrev}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#064326] text-white text-[11px] font-bold border border-[#d4af37]/50 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              <span>پچھلا</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAutoPlaying((p) => !p)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10.5px] font-bold cursor-pointer transition-colors ${
                isAutoPlaying
                  ? 'bg-[#d4af37] text-[#051a0f] border-[#d4af37]'
                  : isDark
                  ? 'bg-white/10 text-emerald-100 border-[#d4af37]/40'
                  : 'bg-emerald-50 text-[#064326] border-emerald-800/25'
              }`}
              title={isAutoPlaying ? 'خودکار سلائیڈ روکیں' : 'خودکار سلائیڈ چلائیں'}
            >
              {isAutoPlaying ? (
                <>
                  <Pause className="w-3 h-3" />
                  <span>خودکار ({currentSlide + 1}/{totalSlides})</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  <span>چلائیں ({currentSlide + 1}/{totalSlides})</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#064326] text-white text-[11px] font-bold border border-[#d4af37]/50 cursor-pointer"
            >
              <span>اگلا</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Action Buttons: WhatsApp Share + A4 JPG, A4 PDF & HTML Download */}
        <div
          className={`p-3 rounded-2xl border border-[#d4af37]/45 space-y-2 ${
            isDark ? 'bg-[#08180f]' : 'bg-[#f8fbf9]'
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noreferrer"
              className="sm:col-span-2 py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#1faa4e] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>واٹس ایپ صدقۂ جاریہ شیئر</span>
              <Share2 className="w-3 h-3" />
            </a>

            <button
              type="button"
              onClick={handleDownloadJpgGuide}
              disabled={isExportingJpg}
              className="py-2 px-3 rounded-xl bg-[#0b4f2e] hover:bg-[#0e663b] text-white border border-[#d4af37]/60 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all disabled:opacity-60"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>{isExportingJpg ? 'JPG بن رہی ہے...' : 'A4 پرنٹ JPG ڈاؤنلوڈ'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdfGuide}
              disabled={isExportingPdf}
              className="py-2 px-3 rounded-xl bg-[#d4af37] hover:bg-[#c5a028] text-[#051a0f] border border-[#d4af37] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all disabled:opacity-60"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'PDF بن رہی ہے...' : 'مسجد پرنٹ A4 PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtmlGuide}
              className={`sm:col-span-2 py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all ${
                isDark
                  ? 'bg-white/10 hover:bg-white/15 border-[#d4af37]/40 text-[#d4af37]'
                  : 'bg-white hover:bg-emerald-50 border-[#064326]/25 text-[#064326]'
              }`}
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>HTML گائیڈ ڈاؤنلوڈ کریں</span>
            </button>
          </div>
        </div>

        {/* Android Brand Quick Tips */}
        <div
          className={`p-2.5 rounded-xl border text-[10.5px] leading-relaxed ${
            isDark
              ? 'bg-[#08150e] border-[#d4af37]/25 text-emerald-100/85'
              : 'bg-amber-50/70 border-[#d4af37]/35 text-[#11261b]'
          }`}
        >
          <div className="font-bold text-[#8c6514] dark:text-[#d4af37] mb-0.5 flex items-center gap-1">
            <BellOff className="w-3 h-3" />
            <span>مختلف موبائلز میں سیٹنگ کا نام:</span>
          </div>
          <div>• <b>Samsung:</b> Settings → Modes &amp; Routines / Do Not Disturb</div>
          <div>• <b>Xiaomi / Redmi / Poco:</b> Settings → Sound → Do Not Disturb → Schedule</div>
          <div>• <b>Oppo / Vivo / Infinix / Tecno:</b> Settings → Sound → Do Not Disturb → Schedules</div>
        </div>

        {/* Important Imam Namaz Time Update Note */}
        <div
          className={`p-2.5 rounded-xl border-2 text-center space-y-1 ${
            isDark
              ? 'bg-[#1a1608] border-[#d4af37]/70 text-amber-100'
              : 'bg-amber-50 border-[#d4af37] text-[#11261b]'
          }`}
        >
          <div className="font-bold text-[#92400e] dark:text-[#fde68a] text-[11.5px]">
            📌 اہم نوٹ: مسجد کے اوقاتِ نماز کی تبدیلی کا خیال رکھیں
          </div>
          <p className="text-[10.5px] leading-relaxed opacity-95">
            اگر آپ کی مسجد کے امام صاحب کسی نماز کی جماعت کا وقت تبدیل فرمائیں، تو آپ بھی اپنے موبائل کے آٹو سائلنٹ شیڈول میں اس نماز کا وقت ضرور تبدیل کر لیں تاکہ ہر نماز میں موبائل بروقت خاموش رہے۔
          </p>
        </div>
      </div>
    </BaseModal>
  );
};

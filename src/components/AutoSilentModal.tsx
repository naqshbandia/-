import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Check,
  MessageCircle,
  Share2,
  FileDown,
  Image as ImageIcon,
  Printer,
  Settings,
  Copy,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Volume2,
  VolumeX,
  Vibrate,
} from 'lucide-react';
import { OFFICIAL_APK_URL } from '../data/appConfig';
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
  PrayerSilentMode,
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
  const [isExportingJpg, setIsExportingJpg] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showDndSettingsTip, setShowDndSettingsTip] = useState(false);
  const [copiedSchedule, setCopiedSchedule] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [isTestingSilent, setIsTestingSilent] = useState<boolean>(() =>
    getNativeAutoSilentStatus().currentlySilent
  );
  const [showScheduleEditor, setShowScheduleEditor] = useState(true);

  const [config, setConfig] = useState(() =>
    loadAutoSilentConfig(officialSchedule, prayerData)
  );
  const [nativeStatus, setNativeStatus] = useState<NativeAutoSilentStatus>(() =>
    getNativeAutoSilentStatus()
  );

  const refreshNativeAndSync = useCallback(() => {
    const status = getNativeAutoSilentStatus();
    setNativeStatus(status);
    setIsTestingSilent(status.currentlySilent);
    if (status.isNative && status.dndGranted) {
      const latest = loadAutoSilentConfig(officialSchedule, prayerData);
      setConfig(latest);
      saveAndSyncAutoSilentConfig(latest);
      const updated = getNativeAutoSilentStatus();
      setNativeStatus(updated);
      setIsTestingSilent(updated.currentlySilent);
    }
  }, [officialSchedule, prayerData]);

  // Reload config & native permission status whenever modal opens or user returns from Android Settings
  useEffect(() => {
    if (!isOpen) return;
    const latest = loadAutoSilentConfig(officialSchedule, prayerData);
    setConfig(latest);
    saveAndSyncAutoSilentConfig(latest);
    const updated = getNativeAutoSilentStatus();
    setNativeStatus(updated);
    setIsTestingSilent(updated.currentlySilent);

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

  const handleSelectSilentMode = (mode: PrayerSilentMode) => {
    const next = {
      ...config,
      silentMode: mode,
    };
    setConfig(next);
    saveAndSyncAutoSilentConfig(next);
    setNativeStatus(getNativeAutoSilentStatus());
    onNotify?.(
      mode === 'vibrate'
        ? 'وائبریشن موڈ منتخب ہو گیا — نماز کے وقت موبائل صرف وائبریٹ کرے گا اور بعد میں خودکار نارمل ہو جائے گا!'
        : 'مکمل سائلنٹ (DND) منتخب ہو گیا — نماز کے وقت فون بالکل خاموش ہو کر بعد میں نارمل ہو جائے گا!'
    );
  };

  const handleResetDefaultSlots = () => {
    const defaults = buildDefaultAutoSilentSlots(officialSchedule, prayerData);
    const next = {
      masterEnabled: true,
      customized: false,
      silentMode: config.silentMode || 'silent',
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
    const status = getNativeAutoSilentStatus();
    const nextSilent = !status.currentlySilent;
    const ok = bridge.setSilentNow(nextSilent);
    if (ok) {
      window.setTimeout(() => {
        const refreshed = getNativeAutoSilentStatus();
        setNativeStatus(refreshed);
        setIsTestingSilent(refreshed.currentlySilent);
      }, 280);
      setIsTestingSilent(nextSilent);
      onNotify?.(
        nextSilent
          ? config.silentMode === 'vibrate'
            ? 'ٹیسٹ: آپ کا موبائل اس وقت وائبریشن موڈ پر کر دیا گیا ہے!'
            : 'ٹیسٹ: آپ کا موبائل اس وقت سائلنٹ (DND) کر دیا گیا ہے!'
          : 'موبائل واپس نارمل موڈ پر بحال کر دیا گیا ہے!'
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

  const appShareMessage = useMemo(() => {
    return [
      '🔕 *نماز آٹو سائلنٹ موڈ — خانقاہ دارالفلاح ایپ (صدقۂ جاریہ)*',
      '',
      'مسجد میں نماز کے دوران موبائل کی گھنٹی سے بچنے کے لیے نیچے دیے گئے لنک سے خانقاہ دارالفلاح ایپ انسٹال کریں، اور ایپ کھول کر *"آٹو سائلنٹ موڈ"* میں اپنی نمازوں کا وقت آن کر لیں — موبائل خودکار خاموش ہو کر وقت پر خود کھل جائے گا:',
      '',
      '📲 *ایپ ڈاؤنلوڈ لنک (APK):*',
      OFFICIAL_APK_URL,
      '',
      '📌 *نوٹ:* اگر مسجد کے امام صاحب وقتِ جماعت تبدیل کریں تو آپ بھی ایپ میں وقت اپڈیٹ کر لیں۔',
      '🤲 ثواب کی نیت سے اپنے دوست احباب کے ساتھ ضرور شیئر کریں!',
    ].join('\n');
  }, []);

  const whatsappShareUrl = useMemo(
    () => `https://wa.me/?text=${encodeURIComponent(appShareMessage)}`,
    [appShareMessage]
  );

  const triggerWhatsAppShare = () => {
    const a = document.createElement('a');
    a.href = whatsappShareUrl;
    a.target = '_blank';
    a.rel = 'noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleNativeShareWithFriends = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'خانقاہ دارالفلاح — نماز آٹو سائلنٹ موڈ',
          text: appShareMessage,
          url: OFFICIAL_APK_URL,
        });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    triggerWhatsAppShare();
  };

  const handleCopyInviteMessage = async () => {
    try {
      await navigator.clipboard.writeText(appShareMessage);
      setCopiedInvite(true);
      window.setTimeout(() => setCopiedInvite(false), 3000);
      onNotify?.('دوستوں کو شیئر کرنے کا پیغام اور لنک کاپی ہو گیا!');
    } catch {
      triggerWhatsAppShare();
    }
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
                    ہر نماز کے وقت موبائل خودکار طور پر آپ کے منتخب کردہ موڈ (سائلنٹ یا وائبریشن) پر چلا جائے گا اور نماز کے بعد خودکار واپس <strong>🔊 نارمل موڈ</strong> پر آ جائے گا۔
                  </p>

                  {/* Mode Selector: Total Silent (DND) vs Vibrate Mode -> Normal */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelectSilentMode('silent')}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        (config.silentMode || 'silent') === 'silent'
                          ? 'bg-[#064326] text-white border-[#d4af37] shadow-xs'
                          : isDark
                          ? 'bg-black/25 text-emerald-100/80 border-[#d4af37]/25 hover:border-[#d4af37]/60'
                          : 'bg-white text-[#064326] border-emerald-900/20 hover:bg-emerald-50'
                      }`}
                    >
                      <VolumeX className="w-3.5 h-3.5 shrink-0 text-[#d4af37]" />
                      <span>مکمل سائلنٹ (DND)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectSilentMode('vibrate')}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        config.silentMode === 'vibrate'
                          ? 'bg-[#064326] text-white border-[#d4af37] shadow-xs'
                          : isDark
                          ? 'bg-black/25 text-emerald-100/80 border-[#d4af37]/25 hover:border-[#d4af37]/60'
                          : 'bg-white text-[#064326] border-emerald-900/20 hover:bg-emerald-50'
                      }`}
                    >
                      <Vibrate className="w-3.5 h-3.5 shrink-0 text-[#00ff99]" />
                      <span>وائبریشن موڈ (Vibrate)</span>
                    </button>
                  </div>

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
                      ) : config.silentMode === 'vibrate' ? (
                        <>
                          <Vibrate className="w-3.5 h-3.5 text-[#00ff99] shrink-0" />
                          <span>فوری ٹیسٹ (وائبریشن)</span>
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

                  <button
                    type="button"
                    onClick={() => {
                      getAndroidBridge()?.openAppBatterySettings?.();
                      onNotify?.("Battery Saver کو 'No restrictions' پر رکھیں تاکہ وقتِ ختم پر DND خودکار کھل جائے۔");
                    }}
                    className={`w-full py-1.5 px-2.5 rounded-xl border text-[10.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      isDark
                        ? 'bg-black/25 border-[#d4af37]/30 text-emerald-100/90 hover:border-[#d4af37]'
                        : 'bg-white border-[#064326]/20 text-[#064326] hover:bg-emerald-50'
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                    <span>بیٹری سیور / بیک گراؤنڈ اجازت (No Restrictions)</span>
                  </button>
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

        {/* 6-Prayer Customizable Auto-Silent Schedule Table (Larger & Clearer) */}
        {showScheduleEditor && (
          <div
            className={`p-3.5 rounded-2xl border-2 border-[#d4af37]/55 space-y-3 shadow-sm ${
              isDark ? 'bg-[#08180f] text-emerald-50' : 'bg-white text-[#11261b]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#d4af37]/25">
              <span className="font-extrabold text-sm text-[#064326] dark:text-[#d4af37]">
                🕌 تمام 6 نمازوں کے خودکار سائلنٹ اوقات
              </span>
              <button
                type="button"
                onClick={handleResetDefaultSlots}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8c6514] dark:text-[#f7e7a9] hover:underline cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>مسجد اوقات ری سیٹ</span>
              </button>
            </div>

            <div className="space-y-2">
              {slots.map((slot) => (
                <div
                  key={slot.key}
                  className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-2 transition-opacity ${
                    slot.enabled ? 'opacity-100' : 'opacity-50'
                  } ${
                    isDark
                      ? 'bg-[#0c2317] border-[#d4af37]/30'
                      : 'bg-[#f6faf7] border-emerald-900/15'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-[130px]">
                    <button
                      type="button"
                      onClick={() => handleToggleSlot(slot.key)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold cursor-pointer shadow-xs ${
                        slot.enabled
                          ? 'bg-[#00c853] text-[#042110]'
                          : 'bg-slate-500 text-white'
                      }`}
                    >
                      {slot.enabled ? 'ON' : 'OFF'}
                    </button>
                    <span className="font-extrabold text-xs sm:text-sm">{slot.labelUrdu}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs sm:text-sm" dir="ltr">
                    <input
                      type="time"
                      value={slot.start}
                      onChange={(e) => handleChangeSlotTime(slot.key, 'start', e.target.value)}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs sm:text-[13px] font-extrabold tabular-nums ${
                        isDark
                          ? 'bg-[#06140c] border-[#d4af37]/45 text-emerald-100'
                          : 'bg-white border-emerald-900/25 text-[#064326]'
                      }`}
                    />
                    <span className="opacity-70 font-bold">→</span>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={(e) => handleChangeSlotTime(slot.key, 'end', e.target.value)}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs sm:text-[13px] font-extrabold tabular-nums ${
                        isDark
                          ? 'bg-[#06140c] border-[#d4af37]/45 text-emerald-100'
                          : 'bg-white border-emerald-900/25 text-[#064326]'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSaveCustomSlots}
              className="w-full py-2.5 px-3 rounded-xl bg-[#064326] hover:bg-[#095c34] text-white font-extrabold text-xs sm:text-sm border border-[#d4af37] shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              ✓ شیڈول محفوظ اور خودکار سائلنٹ اپڈیٹ کریں
            </button>
          </div>
        )}

        {/* Important Imam Namaz Time Update Note — Directly Below Schedule */}
        <div
          className={`p-3 rounded-2xl border-2 text-center space-y-1.5 ${
            isDark
              ? 'bg-[#1a1608] border-[#d4af37]/75 text-amber-100'
              : 'bg-amber-50 border-[#d4af37] text-[#11261b]'
          }`}
        >
          <div className="font-extrabold text-[#92400e] dark:text-[#fde68a] text-xs sm:text-[13px]">
            📌 اہم نوٹ: مسجد کے امام صاحب کے وقت کی تبدیلی کا خیال رکھیں
          </div>
          <p className="text-[11.5px] sm:text-xs leading-relaxed opacity-95">
            اگر آپ کی مسجد کے امام صاحب کسی نماز کی جماعت کا وقت تبدیل فرمائیں، تو آپ بھی اپنے موبائل میں اس نماز کا وقت ضرور تبدیل کر لیں تاکہ ہر نماز میں موبائل بروقت خاموش رہے۔
          </p>
        </div>

        {/* Sadaqah Jariyah: Share App & Auto-Silent Mode with Friends */}
        <div
          className={`p-3 rounded-2xl border-2 border-[#d4af37]/50 space-y-2.5 ${
            isDark ? 'bg-[#08180f]' : 'bg-[#f8fbf9]'
          }`}
        >
          <div className="text-center space-y-0.5">
            <p className="font-extrabold text-xs sm:text-[13px] text-[#064326] dark:text-[#d4af37]">
              🤲 دوستوں کے ساتھ شیئر کریں — صدقۂ جاریہ
            </p>
            <p className="text-[11px] opacity-85 leading-relaxed">
              اپنے دوست احباب کو یہ ایپ شیئر کریں؛ وہ ایپ انسٹال کر کے اس آٹو سائلنٹ موڈ میں نماز کا وقت سیٹ کریں گے تو آپ کو بھی ثواب ملے گا۔
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#1faa4e] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white shrink-0" />
              <span>واٹس ایپ پر شیئر کریں</span>
            </a>

            <button
              type="button"
              onClick={handleNativeShareWithFriends}
              className="py-2.5 px-3 rounded-xl bg-[#064326] hover:bg-[#095c34] text-white font-extrabold text-xs border border-[#d4af37]/70 flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#d4af37] shrink-0" />
              <span>دوستوں کو ایپ شیئر کریں</span>
            </button>

            <button
              type="button"
              onClick={handleCopyInviteMessage}
              className={`sm:col-span-2 py-2 px-3 rounded-xl border font-bold text-[11.5px] flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer ${
                copiedInvite
                  ? 'bg-[#d4af37] text-[#051a0f] border-[#d4af37]'
                  : isDark
                  ? 'bg-[#0d281a] hover:bg-[#133825] text-[#f3d97d] border-[#d4af37]/40'
                  : 'bg-white hover:bg-emerald-50 text-[#064326] border-[#064326]/25'
              }`}
            >
              {copiedInvite ? (
                <>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>ایپ لنک اور پیغام کاپی ہو گیا ✓</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                  <span>ایپ ڈاؤنلوڈ لنک و پیغام کاپی کریں</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-1 border-t border-[#d4af37]/20 grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={handleDownloadJpgGuide}
              disabled={isExportingJpg}
              className="py-1.5 px-2 rounded-lg bg-[#0b4f2e] hover:bg-[#0e663b] text-white border border-[#d4af37]/50 font-bold text-[10.5px] flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all disabled:opacity-60"
            >
              <ImageIcon className="w-3 h-3 text-[#d4af37] shrink-0" />
              <span>{isExportingJpg ? '...' : 'A4 JPG'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdfGuide}
              disabled={isExportingPdf}
              className="py-1.5 px-2 rounded-lg bg-[#d4af37] hover:bg-[#c5a028] text-[#051a0f] font-bold text-[10.5px] flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all disabled:opacity-60"
            >
              <Printer className="w-3 h-3 shrink-0" />
              <span>{isExportingPdf ? '...' : 'A4 PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtmlGuide}
              className={`py-1.5 px-2 rounded-lg border font-bold text-[10.5px] flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all ${
                isDark
                  ? 'bg-white/10 hover:bg-white/15 border-[#d4af37]/40 text-[#d4af37]'
                  : 'bg-white hover:bg-emerald-50 border-[#064326]/25 text-[#064326]'
              }`}
            >
              <FileDown className="w-3 h-3 shrink-0" />
              <span>HTML</span>
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

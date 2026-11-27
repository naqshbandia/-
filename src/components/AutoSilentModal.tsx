import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Share2,
  ExternalLink,
  ShieldCheck,
  VolumeX,
} from 'lucide-react';
import { OFFICIAL_APK_URL } from '../data/appConfig';
import { BaseModal } from './Modals';
import {
  AppLanguage,
  DEFAULT_LANGUAGE,
  getDir,
} from '../data/translations';
import {
  JamaatKey,
  JamaatScheduleItem,
  PrayerCache,
} from '../utils/prayerEngine';
import {
  AutoSilentSlot,
  NativeAutoSilentStatus,
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

const BATTERY_OPT_SESSION_KEY = 'kdf_battery_opt_prompted_v1';

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

  const [config, setConfig] = useState(() =>
    loadAutoSilentConfig(officialSchedule, prayerData)
  );
  const [nativeStatus, setNativeStatus] = useState<NativeAutoSilentStatus>(() =>
    getNativeAutoSilentStatus()
  );

  const maybePromptBatteryExemptionOnce = useCallback((status: NativeAutoSilentStatus) => {
    if (!status.isNative || !status.dndGranted || status.batteryOptIgnored) return;
    try {
      if (sessionStorage.getItem(BATTERY_OPT_SESSION_KEY) === '1') return;
      sessionStorage.setItem(BATTERY_OPT_SESSION_KEY, '1');
    } catch {
      // Ignore storage errors
    }
    const bridge = getAndroidBridge();
    bridge?.requestBatteryOptimizationExemption?.();
  }, []);

  const refreshNativeAndSync = useCallback(() => {
    const status = getNativeAutoSilentStatus();
    setNativeStatus(status);
    if (status.isNative && status.dndGranted) {
      const latest = loadAutoSilentConfig(officialSchedule, prayerData);
      setConfig(latest);
      saveAndSyncAutoSilentConfig(latest);
      const updated = getNativeAutoSilentStatus();
      setNativeStatus(updated);
      maybePromptBatteryExemptionOnce(updated);
    }
  }, [officialSchedule, prayerData, maybePromptBatteryExemptionOnce]);

  useEffect(() => {
    if (!isOpen) return;
    const latest = loadAutoSilentConfig(officialSchedule, prayerData);
    setConfig(latest);
    saveAndSyncAutoSilentConfig(latest);
    const updated = getNativeAutoSilentStatus();
    setNativeStatus(updated);
    maybePromptBatteryExemptionOnce(updated);

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
  }, [isOpen, officialSchedule, prayerData, refreshNativeAndSync, maybePromptBatteryExemptionOnce]);

  const slots = config.slots;

  const handleToggleMaster = () => {
    const next = {
      ...config,
      silentMode: 'silent' as const,
      masterEnabled: !config.masterEnabled,
    };
    setConfig(next);
    const { nativeResult } = saveAndSyncAutoSilentConfig(next);
    const updated = getNativeAutoSilentStatus();
    setNativeStatus(updated);
    if (next.masterEnabled) {
      if (nativeResult === 'NO_PERMISSION') {
        getAndroidBridge()?.requestDndPermission?.();
      } else {
        maybePromptBatteryExemptionOnce(updated);
        onNotify?.('خودکار نماز ڈونٹ ڈسٹرب (آٹو سائلنٹ) آن کر دیا گیا!');
      }
    } else {
      onNotify?.('آٹو سائلنٹ شیڈول عارضی طور پر بند کر دیا گیا۔');
    }
  };

  const handleToggleSlot = (key: JamaatKey) => {
    const nextSlots = config.slots.map((s) =>
      s.key === key ? { ...s, enabled: !s.enabled } : s
    );
    const next = {
      ...config,
      silentMode: 'silent' as const,
      customized: true,
      slots: nextSlots,
    };
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
    const next = {
      ...config,
      silentMode: 'silent' as const,
      customized: true,
      slots: nextSlots,
    };
    setConfig(next);
    saveAndSyncAutoSilentConfig(next);
    setNativeStatus(getNativeAutoSilentStatus());
  };

  const handleSaveCustomSlots = () => {
    const next = {
      ...config,
      masterEnabled: true,
      silentMode: 'silent' as const,
      customized: true,
    };
    setConfig(next);
    const { nativeResult } = saveAndSyncAutoSilentConfig(next);
    const updated = getNativeAutoSilentStatus();
    setNativeStatus(updated);
    if (nativeStatus.isNative && nativeResult === 'NO_PERMISSION') {
      onNotify?.('براہ کرم پہلے Do Not Disturb کی اجازت (Allow) آن کریں۔');
      getAndroidBridge()?.requestDndPermission?.();
    } else {
      maybePromptBatteryExemptionOnce(updated);
      onNotify?.('تمام نمازوں کا خودکار ڈونٹ ڈسٹرب شیڈول محفوظ و فعال ہو گیا!');
    }
  };

  const handleAllowDndPermission = () => {
    const bridge = getAndroidBridge();
    if (bridge && typeof bridge.requestDndPermission === 'function') {
      bridge.requestDndPermission();
      onNotify?.("کھلنے والی فہرست میں 'Khanqah Darul Falah' کو آن (Allow) کر کے بیک آئیں۔");
    }
  };

  const appShareMessage = useMemo(() => {
    return [
      '🔕 *نماز آٹو سائلنٹ موڈ — خانقاہ دارالفلاح ایپ (صدقۂ جاریہ)*',
      '',
      'مسجد میں نماز کے دوران موبائل کی گھنٹی سے بچنے کے لیے نیچے دیے گئے لنک سے خانقاہ دارالفلاح ایپ انسٹال کریں، اور ایپ کھول کر *"آٹو سائلنٹ موڈ"* میں اپنی نمازوں کا وقت آن کر لیں — موبائل خودکار خاموش ہو کر وقت پر خود نارمل ہو جائے گا:',
      '',
      '📲 *ایپ ڈاؤنلوڈ لنک (APK):*',
      OFFICIAL_APK_URL,
      '',
      '📌 *نوٹ:* اگر مسجد کے امام صاحب وقتِ جماعت تبدیل کریں تو آپ بھی ایپ میں وقت اپڈیٹ کر لیں۔',
      '🤲 ثواب کی نیت سے اپنے دوست احباب کے ساتھ ضرور شیئر کریں!',
    ].join('\n');
  }, []);

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
    const a = document.createElement('a');
    a.href = `https://wa.me/?text=${encodeURIComponent(appShareMessage)}`;
    a.target = '_blank';
    a.rel = 'noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="🔕 نماز آٹو سائلنٹ (Do Not Disturb)"
      isDark={isDark}
      lang={lang}
      compact
    >
      <div className="space-y-3 text-xs" dir={dir}>
        {/* CLEAN DO NOT DISTURB STATUS CARD */}
        <div
          className={`p-3 rounded-2xl border-2 border-[#d4af37]/80 space-y-2 shadow-sm ${
            isDark
              ? 'bg-gradient-to-b from-[#062a18] to-[#081b11] text-emerald-50'
              : 'bg-gradient-to-b from-[#f0faf4] to-white text-[#11261b]'
          }`}
        >
          {nativeStatus.isNative ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <VolumeX
                    className={`w-4 h-4 shrink-0 ${
                      nativeStatus.dndGranted ? 'text-[#00e676]' : 'text-[#d4af37]'
                    }`}
                  />
                  <span className="font-extrabold text-xs sm:text-[13px] truncate">
                    {nativeStatus.dndGranted
                      ? config.masterEnabled
                        ? 'آٹو سائلنٹ (DND) فعال ہے ✅'
                        : 'آٹو سائلنٹ عارضی طور پر بند ہے'
                      : 'ایک بار خودکار سائلنٹ کی اجازت دیں'}
                  </span>
                </div>

                {nativeStatus.dndGranted && (
                  <button
                    type="button"
                    onClick={handleToggleMaster}
                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold border cursor-pointer transition-all shrink-0 ${
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
                    <strong>Khanqah Darul Falah</strong> کو آن کر دیں — اس کے بعد تمام نمازوں میں موبائل آف لائن بھی خودکار{' '}
                    <strong>Do Not Disturb</strong> ہو کر وقت پر واپس <strong>نارمل موڈ</strong> پر آ جایا کرے گا۔
                  </p>
                  <button
                    type="button"
                    onClick={handleAllowDndPermission}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f0cf65] to-[#b08d43] hover:brightness-105 text-[#051a0f] font-extrabold text-xs border border-white/50 shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>1 کلک میں اجازت دیں (Allow)</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11.5px] leading-relaxed opacity-90">
                    ہر نماز کے وقت موبائل خودکار طور پر <strong>🔕 Do Not Disturb</strong> پر چلا جائے گا اور نماز کے بعد خودکار واپس <strong>🔊 نارمل موڈ</strong> پر آ جائے گا (آف لائن بھی کام کرتا ہے)۔
                  </p>

                  {!nativeStatus.exactAlarmGranted && (
                    <button
                      type="button"
                      onClick={() => getAndroidBridge()?.requestExactAlarmPermission?.()}
                      className="w-full py-1.5 px-2.5 rounded-xl bg-amber-500/20 border border-[#d4af37] text-[#8c6514] dark:text-[#f7e7a9] font-bold text-[11px] cursor-pointer"
                    >
                      ⏱️ عین وقت پر سائلنٹ کے لیے Alarms اجازت آن کریں
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-1 text-center py-0.5">
              <p className="font-extrabold text-[#064326] dark:text-[#d4af37] text-xs">
                🔕 مسجد میں نماز کے دوران خودکار Do Not Disturb
              </p>
              <p className="text-[11px] opacity-90 leading-relaxed">
                آفیشل اینڈرائڈ ایپ میں نماز کے وقت موبائل خودکار خاموش (DND) ہو جاتا ہے اور نماز کے بعد خودکار نارمل موڈ پر واپس آ جاتا ہے۔
              </p>
            </div>
          )}
        </div>

        {/* 6-PRAYER SCHEDULE */}
        <div
          className={`p-3.5 rounded-2xl border-2 border-[#d4af37]/55 space-y-3 shadow-sm ${
            isDark ? 'bg-[#08180f] text-emerald-50' : 'bg-white text-[#11261b]'
          }`}
        >
          <div className="pb-1.5 border-b border-[#d4af37]/25 text-center">
            <span className="font-extrabold text-sm text-[#064326] dark:text-[#d4af37]">
              🕌 تمام 6 نمازوں کے خودکار سائلنٹ اوقات
            </span>
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
            ✓ شیڈول محفوظ کریں
          </button>
        </div>

        {/* IMPORTANT IMAM NAMAZ TIME NOTE */}
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

        {/* SINGLE CLEAN SHARE BUTTON */}
        <div
          className={`p-3 rounded-2xl border-2 border-[#d4af37]/50 space-y-2 ${
            isDark ? 'bg-[#08180f]' : 'bg-[#f8fbf9]'
          }`}
        >
          <p className="text-[11px] opacity-85 text-center leading-relaxed">
            🤲 ثواب کی نیت سے اپنے دوست احباب کے ساتھ شیئر کریں تاکہ وہ بھی ایپ انسٹال کر کے نمازوں کے دوران خودکار سائلنٹ موڈ آن کر سکیں۔
          </p>
          <button
            type="button"
            onClick={handleNativeShareWithFriends}
            className="w-full py-2.5 px-3 rounded-xl bg-[#064326] hover:bg-[#095c34] text-white font-extrabold text-xs border border-[#d4af37]/70 flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-[#d4af37] shrink-0" />
            <span>دوستوں کے ساتھ ایپ شیئر کریں</span>
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

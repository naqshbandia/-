import {
  JamaatKey,
  JamaatScheduleItem,
  PrayerCache,
  resolveJamaatTime24,
} from './prayerEngine';

export interface AutoSilentSlot {
  key: JamaatKey;
  labelUrdu: string;
  start: string;
  end: string;
  enabled: boolean;
}

export type PrayerSilentMode = 'silent' | 'vibrate';

export interface StoredAutoSilentConfig {
  masterEnabled: boolean;
  customized: boolean;
  silentMode: PrayerSilentMode;
  slots: AutoSilentSlot[];
}

export interface NativeAutoSilentStatus {
  isNative: boolean;
  dndGranted: boolean;
  exactAlarmGranted: boolean;
  enabled: boolean;
  silentMode: PrayerSilentMode;
  activeCount: number;
  currentlySilent: boolean;
}

export interface SafeMobileStatus {
  isNative: boolean;
  sdkInt: number;
  privateDnsSupported: boolean;
  privateDnsActive: boolean;
  privateDnsServer: string;
}

export const AUTO_SILENT_STORAGE_KEY = 'khanqah_auto_silent_user_config_v1';

interface AndroidBridge {
  isNativeAndroid?: () => boolean;
  checkLiveUpdate?: () => void;
  forceLiveRefresh?: () => void;
  isDndPermissionGranted?: () => boolean;
  requestDndPermission?: () => void;
  hasExactAlarmPermission?: () => boolean;
  requestExactAlarmPermission?: () => void;
  hasNotificationPermission?: () => boolean;
  requestNotificationPermission?: () => void;
  openNotificationSettings?: () => void;
  sendTestNotification?: () => boolean;
  showUpdateNotification?: (title: string, body: string, subText: string) => void;
  saveAutoSilentSchedule?: (jsonConfig: string) => string;
  getAutoSilentStatus?: () => string;
  setSilentNow?: (silent: boolean) => boolean;
  openAppBatterySettings?: () => void;
  openDndSettings?: () => void;
  openAutoSilentSettings?: () => void;
  openSoundSettings?: () => void;
  getSafeMobileStatus?: () => string;
  openPrivateDnsSettings?: (hostname: string) => void;
  openExternalUrl?: (url: string) => void;
  exitApp?: () => void;
}

export function getAndroidBridge(): AndroidBridge | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { Android?: AndroidBridge };
  return w.Android || null;
}

export function getNativeSafeMobileStatus(): SafeMobileStatus {
  const bridge = getAndroidBridge();
  const fallback: SafeMobileStatus = {
    isNative: isRunningInNativeApk(),
    sdkInt: 0,
    privateDnsSupported: true,
    privateDnsActive: false,
    privateDnsServer: '',
  };
  if (!bridge || typeof bridge.getSafeMobileStatus !== 'function') {
    return fallback;
  }
  try {
    const parsed = JSON.parse(bridge.getSafeMobileStatus());
    return {
      isNative: Boolean(parsed?.isNative ?? true),
      sdkInt: Number(parsed?.sdkInt || 0),
      privateDnsSupported: Boolean(parsed?.privateDnsSupported ?? true),
      privateDnsActive: Boolean(parsed?.privateDnsActive),
      privateDnsServer: String(parsed?.privateDnsServer || ''),
    };
  } catch {
    return fallback;
  }
}

export function getNativeNotificationGranted(): boolean {
  const bridge = getAndroidBridge();
  if (!bridge) return false;
  try {
    if (typeof bridge.hasNotificationPermission === 'function') {
      return Boolean(bridge.hasNotificationPermission());
    }
  } catch {
    // Ignore bridge lookup errors
  }
  return false;
}

export function isRunningInNativeApk(): boolean {
  const bridge = getAndroidBridge();
  if (!bridge) return false;
  try {
    if (typeof bridge.isNativeAndroid === 'function') {
      return Boolean(bridge.isNativeAndroid());
    }
    return typeof bridge.openDndSettings === 'function';
  } catch {
    return false;
  }
}

export function getNativeAutoSilentStatus(): NativeAutoSilentStatus {
  const bridge = getAndroidBridge();
  const defaultStatus: NativeAutoSilentStatus = {
    isNative: isRunningInNativeApk(),
    dndGranted: false,
    exactAlarmGranted: true,
    enabled: false,
    silentMode: 'silent',
    activeCount: 0,
    currentlySilent: false,
  };
  if (!bridge) return defaultStatus;
  try {
    if (typeof bridge.getAutoSilentStatus === 'function') {
      const parsed = JSON.parse(bridge.getAutoSilentStatus());
      const silentMode: PrayerSilentMode =
        parsed?.silentMode === 'vibrate' ? 'vibrate' : 'silent';
      return {
        isNative: Boolean(parsed?.isNative ?? true),
        dndGranted: Boolean(parsed?.dndGranted),
        exactAlarmGranted: Boolean(parsed?.exactAlarmGranted ?? true),
        enabled: Boolean(parsed?.enabled),
        silentMode,
        activeCount: Number(parsed?.activeCount || 0),
        currentlySilent: Boolean(parsed?.currentlySilent),
      };
    }
    if (typeof bridge.isDndPermissionGranted === 'function') {
      return {
        ...defaultStatus,
        isNative: true,
        dndGranted: Boolean(bridge.isDndPermissionGranted()),
      };
    }
  } catch {
    // Fallback cleanly
  }
  return defaultStatus;
}

export function shiftMinutes24(time24: string, deltaMinutes: number): string {
  const [hStr, mStr] = (time24 || '12:00').split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return time24;
  let total = (h * 60 + m + deltaMinutes) % (24 * 60);
  if (total < 0) total += 24 * 60;
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function buildDefaultAutoSilentSlots(
  officialSchedule?: Record<JamaatKey, JamaatScheduleItem>,
  prayerData?: PrayerCache | null
): AutoSilentSlot[] {
  const specs: {
    key: JamaatKey;
    labelUrdu: string;
    fallback: string;
    before: number;
    after: number;
  }[] = [
    { key: 'Fajr', labelUrdu: '🌅 فجر (Fajr)', fallback: '06:00', before: -10, after: 20 },
    { key: 'Dhuhr', labelUrdu: '☀️ ظہر (Dhuhr)', fallback: '13:30', before: -10, after: 20 },
    { key: 'Asr', labelUrdu: '🌤️ عصر (Asr)', fallback: '16:00', before: -10, after: 20 },
    { key: 'Maghrib', labelUrdu: '🌇 مغرب (Maghrib)', fallback: '17:20', before: -5, after: 20 },
    { key: 'Isha', labelUrdu: '🌙 عشاء (Isha)', fallback: '19:00', before: -10, after: 25 },
    { key: 'Jummah', labelUrdu: '🕌 جمعہ (Jummah)', fallback: '13:30', before: -30, after: 30 },
  ];

  return specs.map((spec) => {
    const base24 =
      officialSchedule && officialSchedule[spec.key]
        ? resolveJamaatTime24(spec.key, officialSchedule[spec.key], prayerData || null)
        : spec.fallback;
    return {
      key: spec.key,
      labelUrdu: spec.labelUrdu,
      start: shiftMinutes24(base24, spec.before),
      end: shiftMinutes24(base24, spec.after),
      enabled: true,
    };
  });
}

export function loadAutoSilentConfig(
  officialSchedule?: Record<JamaatKey, JamaatScheduleItem>,
  prayerData?: PrayerCache | null
): StoredAutoSilentConfig {
  const defaults = buildDefaultAutoSilentSlots(officialSchedule, prayerData);
  try {
    const raw = localStorage.getItem(AUTO_SILENT_STORAGE_KEY);
    if (!raw) {
      return {
        masterEnabled: true,
        customized: false,
        silentMode: 'silent',
        slots: defaults,
      };
    }
    const parsed = JSON.parse(raw) as Partial<StoredAutoSilentConfig>;
    const masterEnabled = parsed.masterEnabled !== false;
    const customized = Boolean(parsed.customized);
    const silentMode: PrayerSilentMode =
      parsed.silentMode === 'vibrate' ? 'vibrate' : 'silent';
    if (!customized || !Array.isArray(parsed.slots) || parsed.slots.length === 0) {
      return {
        masterEnabled,
        customized: false,
        silentMode,
        slots: defaults,
      };
    }
    // Merge saved overrides with canonical slot keys so nothing is ever missing
    const byKey = new Map<string, AutoSilentSlot>();
    for (const s of parsed.slots) {
      if (s && s.key) byKey.set(s.key, s);
    }
    const mergedSlots = defaults.map((def) => {
      const saved = byKey.get(def.key);
      if (!saved) return def;
      return {
        key: def.key,
        labelUrdu: def.labelUrdu,
        start: saved.start || def.start,
        end: saved.end || def.end,
        enabled: saved.enabled !== false,
      };
    });
    return {
      masterEnabled,
      customized: true,
      silentMode,
      slots: mergedSlots,
    };
  } catch {
    return {
      masterEnabled: true,
      customized: false,
      silentMode: 'silent',
      slots: defaults,
    };
  }
}

export function saveAndSyncAutoSilentConfig(
  config: StoredAutoSilentConfig
): { saved: boolean; nativeResult: string } {
  try {
    localStorage.setItem(AUTO_SILENT_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage quota errors
  }

  const bridge = getAndroidBridge();
  if (!bridge || typeof bridge.saveAutoSilentSchedule !== 'function') {
    return { saved: true, nativeResult: 'WEB_ONLY' };
  }

  try {
    const payload = JSON.stringify({
      enabled: config.masterEnabled,
      silentMode: config.silentMode || 'silent',
      slots: config.slots,
    });
    const res = bridge.saveAutoSilentSchedule(payload) || 'OK';
    return { saved: true, nativeResult: res };
  } catch {
    return { saved: true, nativeResult: 'ERROR' };
  }
}

export function syncAutoSilentFromAppBoot(
  officialSchedule?: Record<JamaatKey, JamaatScheduleItem>,
  prayerData?: PrayerCache | null
): NativeAutoSilentStatus {
  const config = loadAutoSilentConfig(officialSchedule, prayerData);
  saveAndSyncAutoSilentConfig(config);
  return getNativeAutoSilentStatus();
}

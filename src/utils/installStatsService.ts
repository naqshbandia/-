import { useEffect, useState, useCallback } from 'react';
import {
  doc,
  getDoc,
  onSnapshot,
  writeBatch,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import {
  ARCHIVE_APK_IDENTIFIER,
  ARCHIVE_APK_VIEWS_API,
  ARCHIVE_APK_SEARCH_API,
} from '../data/appConfig';

const DEVICE_ID_STORAGE_KEY = 'khanqah_device_uuid_v1';
const STATS_CACHE_KEY = 'khanqah_app_stats_cache_v1';
const ARCHIVE_STATS_CACHE_KEY = 'khanqah_archive_apk_stats_v1';
const APP_VERSION = '1.0.0';

export type DevicePlatform = 'android' | 'ios' | 'desktop';
export type InstallMode = 'pwa_standalone' | 'apk_webview' | 'web_browser';

export interface FirestoreAppStats {
  totalInstalledDevices: number;
  totalPwaInstalls: number;
  totalApkClicks: number;
  totalWebUsers: number;
}

export interface ArchiveApkStats {
  allTimeDownloads: number | null;
  last30DaysDownloads: number | null;
  last7DaysDownloads: number | null;
  fetchedAt: number;
}

export interface CombinedInstallStats extends FirestoreAppStats, ArchiveApkStats {
  currentDeviceInstalled: boolean;
  currentInstallMode: InstallMode;
  isLoading: boolean;
}

const DEFAULT_FIRESTORE_STATS: FirestoreAppStats = {
  totalInstalledDevices: 0,
  totalPwaInstalls: 0,
  totalApkClicks: 0,
  totalWebUsers: 0,
};

const DEFAULT_ARCHIVE_STATS: ArchiveApkStats = {
  allTimeDownloads: null,
  last30DaysDownloads: null,
  last7DaysDownloads: null,
  fetchedAt: 0,
};

function isValidStoredDeviceId(val: string | null): val is string {
  return !!val && val.length >= 16 && val.length <= 64 && /^[a-zA-Z0-9_\-]+$/.test(val);
}

export function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (isValidStoredDeviceId(existing)) {
      return existing;
    }
    let randomPart = '';
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      randomPart = crypto.randomUUID().replace(/-/g, '');
    } else {
      randomPart = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}${Math.random()
        .toString(36)
        .slice(2, 10)}`;
    }
    const created = `kdf_${randomPart}`.slice(0, 40);
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, created);
    return created;
  } catch {
    return `kdf_fallback_${Date.now().toString(36)}_device`;
  }
}

export function detectDeviceContext(): {
  platform: DevicePlatform;
  installMode: InstallMode;
  installed: boolean;
} {
  if (typeof window === 'undefined') {
    return { platform: 'android', installMode: 'web_browser', installed: false };
  }

  const ua = window.navigator.userAgent || '';
  const uaLower = ua.toLowerCase();

  let platform: DevicePlatform = 'desktop';
  if (/iphone|ipad|ipod/.test(uaLower)) {
    platform = 'ios';
  } else if (/android/.test(uaLower)) {
    platform = 'android';
  }

  const isStandalonePWA =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  const winWithAndroid = window as unknown as {
    Android?: { isNativeAndroid?: () => boolean };
  };
  const isNativeBridge = Boolean(
    typeof winWithAndroid.Android?.isNativeAndroid === 'function' &&
      winWithAndroid.Android.isNativeAndroid()
  );

  const searchParams = new URLSearchParams(window.location.search);
  const isApkParam = searchParams.get('source') === 'apk' || searchParams.get('apk') === '1';
  const isAndroidReferrer = (document.referrer || '').startsWith('android-app://');
  const isAndroidWebView =
    /\bwv\b/.test(uaLower) || (/android/.test(uaLower) && /version\/[\d.]+/.test(uaLower));

  if (isNativeBridge || isApkParam || isAndroidReferrer || isAndroidWebView) {
    return { platform: 'android', installMode: 'apk_webview', installed: true };
  }

  if (isStandalonePWA) {
    return { platform, installMode: 'pwa_standalone', installed: true };
  }

  return { platform, installMode: 'web_browser', installed: false };
}

function loadCachedFirestoreStats(): FirestoreAppStats {
  try {
    const raw = localStorage.getItem(STATS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FirestoreAppStats>;
      return {
        totalInstalledDevices: Number(parsed.totalInstalledDevices) || 0,
        totalPwaInstalls: Number(parsed.totalPwaInstalls) || 0,
        totalApkClicks: Number(parsed.totalApkClicks) || 0,
        totalWebUsers: Number(parsed.totalWebUsers) || 0,
      };
    }
  } catch {}
  return DEFAULT_FIRESTORE_STATS;
}

function saveCachedFirestoreStats(stats: FirestoreAppStats): void {
  try {
    localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(stats));
  } catch {}
}

function loadCachedArchiveStats(): ArchiveApkStats {
  try {
    const raw = localStorage.getItem(ARCHIVE_STATS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ArchiveApkStats>;
      return {
        allTimeDownloads: typeof parsed.allTimeDownloads === 'number' ? parsed.allTimeDownloads : null,
        last30DaysDownloads:
          typeof parsed.last30DaysDownloads === 'number' ? parsed.last30DaysDownloads : null,
        last7DaysDownloads:
          typeof parsed.last7DaysDownloads === 'number' ? parsed.last7DaysDownloads : null,
        fetchedAt: typeof parsed.fetchedAt === 'number' ? parsed.fetchedAt : 0,
      };
    }
  } catch {}
  return DEFAULT_ARCHIVE_STATS;
}

function saveCachedArchiveStats(stats: ArchiveApkStats): void {
  try {
    localStorage.setItem(ARCHIVE_STATS_CACHE_KEY, JSON.stringify(stats));
  } catch {}
}

export async function fetchArchiveOrgApkStats(): Promise<ArchiveApkStats> {
  // 1. Primary: Archive.org Views/Downloads Short API (CORS-enabled JSON)
  try {
    const res = await fetch(`${ARCHIVE_APK_VIEWS_API}?_t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const json = (await res.json()) as Record<
        string,
        { all_time?: number; last_30day?: number; last_7day?: number; have_data?: boolean }
      >;
      const entry = json?.[ARCHIVE_APK_IDENTIFIER];
      if (entry && typeof entry.all_time === 'number') {
        const stats: ArchiveApkStats = {
          allTimeDownloads: entry.all_time,
          last30DaysDownloads: typeof entry.last_30day === 'number' ? entry.last_30day : null,
          last7DaysDownloads: typeof entry.last_7day === 'number' ? entry.last_7day : null,
          fetchedAt: Date.now(),
        };
        saveCachedArchiveStats(stats);
        return stats;
      }
    }
  } catch {}

  // 2. Secondary fallback: Archive.org Advanced Search stats API
  try {
    const res2 = await fetch(`${ARCHIVE_APK_SEARCH_API}&_t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (res2.ok) {
      const json2 = (await res2.json()) as {
        response?: { docs?: { downloads?: number; month?: number; week?: number }[] };
      };
      const firstDoc = json2?.response?.docs?.[0];
      if (firstDoc && typeof firstDoc.downloads === 'number') {
        const stats: ArchiveApkStats = {
          allTimeDownloads: firstDoc.downloads,
          last30DaysDownloads: typeof firstDoc.month === 'number' ? firstDoc.month : null,
          last7DaysDownloads: typeof firstDoc.week === 'number' ? firstDoc.week : null,
          fetchedAt: Date.now(),
        };
        saveCachedArchiveStats(stats);
        return stats;
      }
    }
  } catch {}

  return loadCachedArchiveStats();
}

let syncInFlight: Promise<void> | null = null;

export async function syncDeviceInstallState(options?: {
  forceInstalled?: boolean;
  markApkClicked?: boolean;
}): Promise<void> {
  if (syncInFlight) {
    await syncInFlight.catch(() => {});
  }

  const run = async () => {
    const deviceId = getOrCreateDeviceId();
    const ctx = detectDeviceContext();
    const installMode: InstallMode = options?.forceInstalled
      ? ctx.installMode === 'apk_webview'
        ? 'apk_webview'
        : 'pwa_standalone'
      : ctx.installMode;
    const isInstalledNow = Boolean(options?.forceInstalled || ctx.installed);
    const isApkClickNow = Boolean(options?.markApkClicked);

    const deviceRef = doc(db, 'appDevices', deviceId);
    const summaryRef = doc(db, 'appStats', 'summary');

    let deviceSnap;
    let summarySnap;
    try {
      [deviceSnap, summarySnap] = await Promise.all([getDoc(deviceRef), getDoc(summaryRef)]);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.GET, `appDevices/${deviceId}`);
      } catch {
        return;
      }
      return;
    }

    const batch = writeBatch(db);

    if (!deviceSnap.exists()) {
      batch.set(deviceRef, {
        deviceId,
        platform: ctx.platform,
        installMode,
        installed: isInstalledNow,
        apkDownloaded: isApkClickNow,
        appVersion: APP_VERSION,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (!summarySnap.exists()) {
        batch.set(summaryRef, {
          totalInstalledDevices: isInstalledNow ? 1 : 0,
          totalPwaInstalls: installMode === 'pwa_standalone' && isInstalledNow ? 1 : 0,
          totalApkClicks: isApkClickNow ? 1 : 0,
          totalWebUsers: 1,
          lastDeviceId: deviceId,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.update(summaryRef, {
          totalInstalledDevices: increment(isInstalledNow ? 1 : 0),
          totalPwaInstalls: increment(installMode === 'pwa_standalone' && isInstalledNow ? 1 : 0),
          totalApkClicks: increment(isApkClickNow ? 1 : 0),
          totalWebUsers: increment(1),
          lastDeviceId: deviceId,
          updatedAt: serverTimestamp(),
        });
      }

      try {
        await batch.commit();
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.WRITE, `appDevices/${deviceId}`);
        } catch {}
      }
      return;
    }

    const prev = deviceSnap.data() as {
      installed?: boolean;
      apkDownloaded?: boolean;
    };
    const needInstallFlip = prev.installed === false && isInstalledNow;
    const needApkFlip = prev.apkDownloaded === false && isApkClickNow;

    if (!needInstallFlip && !needApkFlip) {
      return;
    }

    const deviceUpdate: Record<string, unknown> = {
      appVersion: APP_VERSION,
      updatedAt: serverTimestamp(),
    };
    if (needInstallFlip) {
      deviceUpdate.installed = true;
      deviceUpdate.installMode = installMode;
    }
    if (needApkFlip) {
      deviceUpdate.apkDownloaded = true;
    }

    batch.update(deviceRef, deviceUpdate);

    if (!summarySnap.exists()) {
      batch.set(summaryRef, {
        totalInstalledDevices: needInstallFlip ? 1 : 0,
        totalPwaInstalls: needInstallFlip && installMode === 'pwa_standalone' ? 1 : 0,
        totalApkClicks: needApkFlip ? 1 : 0,
        totalWebUsers: 1,
        lastDeviceId: deviceId,
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.update(summaryRef, {
        totalInstalledDevices: increment(needInstallFlip ? 1 : 0),
        totalPwaInstalls: increment(
          needInstallFlip && installMode === 'pwa_standalone' ? 1 : 0
        ),
        totalApkClicks: increment(needApkFlip ? 1 : 0),
        lastDeviceId: deviceId,
        updatedAt: serverTimestamp(),
      });
    }

    try {
      await batch.commit();
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, `appDevices/${deviceId}`);
      } catch {}
    }
  };

  syncInFlight = run().finally(() => {
    syncInFlight = null;
  });
  await syncInFlight;
}

export async function recordApkDownloadClick(): Promise<void> {
  await syncDeviceInstallState({ markApkClicked: true });
}

export async function recordPwaInstalledEvent(): Promise<void> {
  await syncDeviceInstallState({ forceInstalled: true });
}

export function useAppInstallStats(): CombinedInstallStats & { refreshStats: () => void } {
  const ctx = detectDeviceContext();
  const [fsStats, setFsStats] = useState<FirestoreAppStats>(() => loadCachedFirestoreStats());
  const [archiveStats, setArchiveStats] = useState<ArchiveApkStats>(() =>
    loadCachedArchiveStats()
  );
  const [isLoading, setIsLoading] = useState(true);

  const refreshArchive = useCallback(async () => {
    const next = await fetchArchiveOrgApkStats();
    setArchiveStats(next);
  }, []);

  useEffect(() => {
    syncDeviceInstallState();
    refreshArchive().finally(() => setIsLoading(false));

    const onInstalled = () => {
      recordPwaInstalledEvent();
    };
    window.addEventListener('appinstalled', onInstalled);

    const summaryRef = doc(db, 'appStats', 'summary');
    const unsub = onSnapshot(
      summaryRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<FirestoreAppStats>;
          const next: FirestoreAppStats = {
            totalInstalledDevices: Number(data.totalInstalledDevices) || 0,
            totalPwaInstalls: Number(data.totalPwaInstalls) || 0,
            totalApkClicks: Number(data.totalApkClicks) || 0,
            totalWebUsers: Number(data.totalWebUsers) || 0,
          };
          saveCachedFirestoreStats(next);
          setFsStats(next);
        }
        setIsLoading(false);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, 'appStats/summary');
        } catch {}
        setIsLoading(false);
      }
    );

    return () => {
      window.removeEventListener('appinstalled', onInstalled);
      unsub();
    };
  }, [refreshArchive]);

  const refreshStats = useCallback(() => {
    setIsLoading(true);
    Promise.all([syncDeviceInstallState(), refreshArchive()]).finally(() =>
      setIsLoading(false)
    );
  }, [refreshArchive]);

  return {
    ...fsStats,
    ...archiveStats,
    currentDeviceInstalled: ctx.installed,
    currentInstallMode: ctx.installMode,
    isLoading,
    refreshStats,
  };
}

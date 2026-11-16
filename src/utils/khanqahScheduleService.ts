import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { User, signInWithPopup, signOut } from 'firebase/auth';
import {
  auth,
  db,
  googleProvider,
  ADMIN_EMAILS,
  OperationType,
  handleFirestoreError,
} from '../firebase';
import {
  DEFAULT_JAMAAT_SCHEDULE,
  JamaatKey,
  JamaatScheduleItem,
  clean24,
} from './prayerEngine';

const KHANQAH_OFFICIAL_CACHE_KEY = 'khanqah_official_jamaat_cache_v1';
const SCHEDULE_PATH = 'khanqahSchedule/official';
const TIME_24_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function sanitizeTime24(raw: string | undefined, fallback: string): string {
  const cleaned = clean24(raw, fallback);
  return TIME_24_REGEX.test(cleaned) ? cleaned : fallback;
}

function clampOffset(val: number | undefined, fallback: number): number {
  const n = typeof val === 'number' && !isNaN(val) ? Math.round(val) : fallback;
  return Math.max(1, Math.min(120, n));
}

function sanitizeMode(mode: string | undefined, fallback: 'auto' | 'custom'): 'auto' | 'custom' {
  return mode === 'auto' || mode === 'custom' ? mode : fallback;
}

export function loadCachedKhanqahSchedule(): Record<JamaatKey, JamaatScheduleItem> {
  try {
    const raw = localStorage.getItem(KHANQAH_OFFICIAL_CACHE_KEY);
    if (raw) {
      return { ...DEFAULT_JAMAAT_SCHEDULE, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_JAMAAT_SCHEDULE;
}

function saveCachedKhanqahSchedule(schedule: Record<JamaatKey, JamaatScheduleItem>) {
  try {
    localStorage.setItem(KHANQAH_OFFICIAL_CACHE_KEY, JSON.stringify(schedule));
  } catch {}
}

export function fromFirestoreScheduleDoc(
  data: Record<string, any> | undefined
): Record<JamaatKey, JamaatScheduleItem> {
  if (!data) return DEFAULT_JAMAAT_SCHEDULE;
  return {
    Fajr: {
      key: 'Fajr',
      name: DEFAULT_JAMAAT_SCHEDULE.Fajr.name,
      mode: sanitizeMode(data.fajrMode, DEFAULT_JAMAAT_SCHEDULE.Fajr.mode),
      offsetMinutes: clampOffset(data.fajrOffset, DEFAULT_JAMAAT_SCHEDULE.Fajr.offsetMinutes),
      customTime24: sanitizeTime24(data.fajrTime, DEFAULT_JAMAAT_SCHEDULE.Fajr.customTime24),
    },
    Dhuhr: {
      key: 'Dhuhr',
      name: DEFAULT_JAMAAT_SCHEDULE.Dhuhr.name,
      mode: sanitizeMode(data.dhuhrMode, DEFAULT_JAMAAT_SCHEDULE.Dhuhr.mode),
      offsetMinutes: clampOffset(data.dhuhrOffset, DEFAULT_JAMAAT_SCHEDULE.Dhuhr.offsetMinutes),
      customTime24: sanitizeTime24(data.dhuhrTime, DEFAULT_JAMAAT_SCHEDULE.Dhuhr.customTime24),
    },
    Asr: {
      key: 'Asr',
      name: DEFAULT_JAMAAT_SCHEDULE.Asr.name,
      mode: sanitizeMode(data.asrMode, DEFAULT_JAMAAT_SCHEDULE.Asr.mode),
      offsetMinutes: clampOffset(data.asrOffset, DEFAULT_JAMAAT_SCHEDULE.Asr.offsetMinutes),
      customTime24: sanitizeTime24(data.asrTime, DEFAULT_JAMAAT_SCHEDULE.Asr.customTime24),
    },
    Maghrib: {
      key: 'Maghrib',
      name: DEFAULT_JAMAAT_SCHEDULE.Maghrib.name,
      mode: sanitizeMode(data.maghribMode, DEFAULT_JAMAAT_SCHEDULE.Maghrib.mode),
      offsetMinutes: clampOffset(data.maghribOffset, DEFAULT_JAMAAT_SCHEDULE.Maghrib.offsetMinutes),
      customTime24: sanitizeTime24(data.maghribTime, DEFAULT_JAMAAT_SCHEDULE.Maghrib.customTime24),
    },
    Isha: {
      key: 'Isha',
      name: DEFAULT_JAMAAT_SCHEDULE.Isha.name,
      mode: sanitizeMode(data.ishaMode, DEFAULT_JAMAAT_SCHEDULE.Isha.mode),
      offsetMinutes: clampOffset(data.ishaOffset, DEFAULT_JAMAAT_SCHEDULE.Isha.offsetMinutes),
      customTime24: sanitizeTime24(data.ishaTime, DEFAULT_JAMAAT_SCHEDULE.Isha.customTime24),
    },
    Jummah: {
      key: 'Jummah',
      name: DEFAULT_JAMAAT_SCHEDULE.Jummah.name,
      mode: 'custom',
      offsetMinutes: 0,
      customTime24: sanitizeTime24(data.jummahTime, DEFAULT_JAMAAT_SCHEDULE.Jummah.customTime24),
    },
  };
}

export function subscribeKhanqahSchedule(
  onSchedule: (schedule: Record<JamaatKey, JamaatScheduleItem>, isFromCloud: boolean) => void
): Unsubscribe {
  const ref = doc(db, 'khanqahSchedule', 'official');
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        const parsed = fromFirestoreScheduleDoc(snap.data());
        saveCachedKhanqahSchedule(parsed);
        onSchedule(parsed, true);
      } else {
        onSchedule(loadCachedKhanqahSchedule(), false);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, SCHEDULE_PATH);
      } catch {
        // Keep local cache silently if network/offline
      }
    }
  );
}

export async function verifyUserIsAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  const email = (user.email || '').trim().toLowerCase();
  if (ADMIN_EMAILS.has(email)) return true;

  try {
    const adminSnap = await getDoc(doc(db, 'admins', user.uid));
    return adminSnap.exists();
  } catch {
    return false;
  }
}

export async function signInKhanqahAdmin(): Promise<{ user: User | null; isAdmin: boolean }> {
  const cred = await signInWithPopup(auth, googleProvider);
  const user = cred.user;
  const isAdmin = await verifyUserIsAdmin(user);
  if (!isAdmin) {
    await signOut(auth).catch(() => {});
    return { user: null, isAdmin: false };
  }
  return { user, isAdmin: true };
}

export async function signOutKhanqahAdmin(): Promise<void> {
  await signOut(auth);
}

export async function saveKhanqahOfficialSchedule(
  schedule: Record<JamaatKey, JamaatScheduleItem>
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('صرف تصدیق شدہ ایڈمن ہی خانقاہ دارالفلاح کے اوقات محفوظ کر سکتا ہے۔');
  }

  const payload = {
    fajrMode: sanitizeMode(schedule.Fajr.mode, 'auto'),
    fajrOffset: clampOffset(schedule.Fajr.offsetMinutes, 30),
    fajrTime: sanitizeTime24(schedule.Fajr.customTime24, '05:45'),
    dhuhrMode: sanitizeMode(schedule.Dhuhr.mode, 'custom'),
    dhuhrOffset: clampOffset(schedule.Dhuhr.offsetMinutes, 45),
    dhuhrTime: sanitizeTime24(schedule.Dhuhr.customTime24, '13:30'),
    asrMode: sanitizeMode(schedule.Asr.mode, 'auto'),
    asrOffset: clampOffset(schedule.Asr.offsetMinutes, 20),
    asrTime: sanitizeTime24(schedule.Asr.customTime24, '16:15'),
    maghribMode: sanitizeMode(schedule.Maghrib.mode, 'auto'),
    maghribOffset: clampOffset(schedule.Maghrib.offsetMinutes, 5),
    maghribTime: sanitizeTime24(schedule.Maghrib.customTime24, '17:45'),
    ishaMode: sanitizeMode(schedule.Isha.mode, 'auto'),
    ishaOffset: clampOffset(schedule.Isha.offsetMinutes, 25),
    ishaTime: sanitizeTime24(schedule.Isha.customTime24, '19:45'),
    jummahTime: sanitizeTime24(schedule.Jummah.customTime24, '13:30'),
    updatedByUid: user.uid,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'khanqahSchedule', 'official'), payload);
    saveCachedKhanqahSchedule(schedule);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, SCHEDULE_PATH);
  }
}

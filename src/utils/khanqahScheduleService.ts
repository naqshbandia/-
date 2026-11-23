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
  KHANQAH_JAMAAT_HTML_URL,
  KHANQAH_CLOCK_HTML_URL,
  KHANQAH_MESSAGE_HTML_URL,
  KHANQAH_LATEST_UPDATE_TXT_URL,
} from '../data/appConfig';
import {
  DEFAULT_JAMAAT_SCHEDULE,
  JamaatKey,
  JamaatScheduleItem,
  clean24,
} from './prayerEngine';

const KHANQAH_OFFICIAL_CACHE_KEY = 'khanqah_official_jamaat_cache_v2';
const KHANQAH_TICKER_CACHE_KEY = 'khanqah_ticker_message_v1';
const DEFAULT_TICKER_MESSAGE =
  'خانقاہ دارالفلاح نزد ملک اڈہ میراخیل بنوں — حضرت اقدس دامت برکاتہم کے تازہ بیانات، کتب اور اوقاتِ نماز ایپ میں ملاحظہ فرمائیں۔';
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

function normalizeDigits(input: string): string {
  const urduDigits = '۰۱۲۳۴۵۶۷۸۹';
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  return input
    .replace(/[۰-۹]/g, (d) => String(urduDigits.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)));
}

function mapPrayerLabelToKey(rawLabel: string): JamaatKey | null {
  const label = normalizeDigits(rawLabel).trim().toLowerCase();
  if (label.includes('فجر') || label.includes('fajr')) return 'Fajr';
  if (label.includes('جمع') || label.includes('jummah') || label.includes('jumma')) return 'Jummah';
  if (label.includes('ظہر') || label.includes('dhuhr') || label.includes('zuhr')) return 'Dhuhr';
  if (label.includes('عصر') || label.includes('asr')) return 'Asr';
  if (label.includes('مغرب') || label.includes('maghrib')) return 'Maghrib';
  if (label.includes('عشاء') || label.includes('عشا') || label.includes('isha')) return 'Isha';
  return null;
}

function parseCellValueToScheduleItem(
  key: JamaatKey,
  rawVal: string,
  fallback: JamaatScheduleItem
): JamaatScheduleItem {
  const text = normalizeDigits(rawVal).replace(/\s+/g, ' ').trim();
  if (!text) return fallback;

  // Check for relative offset like "اذان کے 5 منٹ بعد" or "+5"
  if (
    text.includes('اذان') ||
    text.includes('منٹ') ||
    text.startsWith('+')
  ) {
    const minsMatch = text.match(/(\d{1,3})/);
    if (minsMatch) {
      const offset = clampOffset(parseInt(minsMatch[1], 10), fallback.offsetMinutes);
      if (key !== 'Jummah') {
        return {
          ...fallback,
          mode: 'auto',
          offsetMinutes: offset,
        };
      }
    }
  }

  // Parse explicit clock time (e.g. "06:00 AM", "01:30 PM", "13:30", "5:45 شام")
  const timeMatch = text.match(/(\d{1,2})\s*:\s*(\d{2})\s*(am|pm|صبح|شام|رات|دوپہر)?/i);
  if (timeMatch) {
    let h = parseInt(timeMatch[1], 10);
    const m = parseInt(timeMatch[2], 10);
    const meridiem = (timeMatch[3] || '').toLowerCase();

    if (m >= 0 && m <= 59 && h >= 0 && h <= 23) {
      if (meridiem === 'pm' || meridiem === 'شام' || meridiem === 'رات' || meridiem === 'دوپہر') {
        if (h < 12) h += 12;
      } else if (meridiem === 'am' || meridiem === 'صبح') {
        if (h === 12) h = 0;
      } else if (h >= 1 && h <= 11) {
        // Smart inference when admin omits AM/PM for afternoon/evening prayers
        if (key === 'Dhuhr' || key === 'Jummah') {
          if (h <= 4) h += 12;
        } else if (key === 'Asr' || key === 'Maghrib' || key === 'Isha') {
          h += 12;
        }
      }

      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      return {
        ...fallback,
        mode: 'custom',
        customTime24: `${hh}:${mm}`,
      };
    }
  }

  return fallback;
}

export function parseKhanqahScheduleHtml(
  html: string
): Record<JamaatKey, JamaatScheduleItem> | null {
  try {
    const parser = new DOMParser();
    const parsedDoc = parser.parseFromString(html, 'text/html');
    const jamaatTableRows = parsedDoc.querySelectorAll('#khanqah-jamaat-table tr');
    const page2Rows = parsedDoc.querySelectorAll('#page2 tr');
    const rows =
      jamaatTableRows.length > 0
        ? jamaatTableRows
        : page2Rows.length > 0
        ? page2Rows
        : parsedDoc.querySelectorAll('table tr');

    if (!rows || rows.length === 0) return null;

    const result: Record<JamaatKey, JamaatScheduleItem> = {
      Fajr: { ...DEFAULT_JAMAAT_SCHEDULE.Fajr, mode: 'custom', customTime24: '06:00' },
      Dhuhr: { ...DEFAULT_JAMAAT_SCHEDULE.Dhuhr, mode: 'custom', customTime24: '13:30' },
      Asr: { ...DEFAULT_JAMAAT_SCHEDULE.Asr, mode: 'custom', customTime24: '16:00' },
      Maghrib: { ...DEFAULT_JAMAAT_SCHEDULE.Maghrib, mode: 'auto', offsetMinutes: 5 },
      Isha: { ...DEFAULT_JAMAAT_SCHEDULE.Isha, mode: 'custom', customTime24: '19:00' },
      Jummah: { ...DEFAULT_JAMAAT_SCHEDULE.Jummah, mode: 'custom', customTime24: '13:30' },
    };

    let matchedCount = 0;
    let hasExplicitJummah = false;

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 2) return;
      const key = mapPrayerLabelToKey(cells[0].textContent || '');
      if (!key) return;

      const parsedItem = parseCellValueToScheduleItem(
        key,
        cells[1].textContent || '',
        result[key]
      );
      result[key] = parsedItem;
      matchedCount++;
      if (key === 'Jummah') hasExplicitJummah = true;
    });

    if (matchedCount === 0) return null;

    // If Jummah is not explicitly listed in HTML yet, match Dhuhr custom time (1:30 PM)
    if (!hasExplicitJummah && result.Dhuhr.mode === 'custom') {
      result.Jummah = {
        ...result.Jummah,
        mode: 'custom',
        customTime24: result.Dhuhr.customTime24,
      };
    }

    return result;
  } catch {
    return null;
  }
}

export async function fetchKhanqahScheduleFromGitHubHtml(): Promise<Record<
  JamaatKey,
  JamaatScheduleItem
> | null> {
  const candidateUrls = [
    `${KHANQAH_JAMAAT_HTML_URL}?_t=${Date.now()}`,
    `${import.meta.env.BASE_URL}khanqah-jamaat.html?_t=${Date.now()}`,
    `${KHANQAH_CLOCK_HTML_URL}?_t=${Date.now()}`,
  ];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const html = await res.text();
      const parsed = parseKhanqahScheduleHtml(html);
      if (parsed) {
        saveCachedKhanqahSchedule(parsed);
        return parsed;
      }
    } catch {
      // Try next fallback source
    }
  }
  return null;
}

export function parseTickerMessageHtml(html: string): string | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    doc.querySelectorAll('script, style, noscript').forEach((el) => el.remove());

    const container =
      doc.querySelector('#khanqah-messages') ||
      doc.querySelector('.message') ||
      doc.body;
    if (!container) return null;

    const paragraphs = Array.from(container.querySelectorAll('p'))
      .map((p) => (p.textContent || '').replace(/\s+/g, ' ').trim())
      .filter((txt) => txt.length > 0);

    if (paragraphs.length > 0) {
      return paragraphs.join('   ✦   ');
    }

    const fallbackText = (container.textContent || '').replace(/\s+/g, ' ').trim();
    return fallbackText.length > 0 ? fallbackText : null;
  } catch {
    return null;
  }
}

export function loadCachedTickerMessage(): string {
  try {
    const saved = localStorage.getItem(KHANQAH_TICKER_CACHE_KEY);
    if (saved && saved.trim().length > 0) return saved.trim();
  } catch {}
  return DEFAULT_TICKER_MESSAGE;
}

function saveCachedTickerMessage(msg: string) {
  try {
    localStorage.setItem(KHANQAH_TICKER_CACHE_KEY, msg);
  } catch {}
}

export async function fetchKhanqahTickerMessage(): Promise<string | null> {
  // 1. Primary: Official GitHub HTML file (khanqah-message.html)
  try {
    const res = await fetch(`${KHANQAH_MESSAGE_HTML_URL}?_t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const html = await res.text();
      const parsed = parseTickerMessageHtml(html);
      if (parsed) {
        saveCachedTickerMessage(parsed);
        return parsed;
      }
    }
  } catch {}

  // 2. Secondary: Fallback to plain text latest_update.txt if khanqah-message.html is not created yet
  try {
    const resTxt = await fetch(`${KHANQAH_LATEST_UPDATE_TXT_URL}?_t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (resTxt.ok) {
      const txt = (await resTxt.text()).replace(/\s+/g, ' ').trim();
      if (txt.length > 0 && !txt.startsWith('<')) {
        saveCachedTickerMessage(txt);
        return txt;
      }
    }
  } catch {}

  return null;
}

export function loadCachedKhanqahSchedule(): Record<JamaatKey, JamaatScheduleItem> {
  try {
    const raw = localStorage.getItem(KHANQAH_OFFICIAL_CACHE_KEY);
    if (raw) {
      return { ...DEFAULT_JAMAAT_SCHEDULE, ...JSON.parse(raw) };
    }
  } catch {}
  // Default aligned with current khanqah-darul-falah-clock.html values until live HTML loads
  return {
    ...DEFAULT_JAMAAT_SCHEDULE,
    Fajr: { ...DEFAULT_JAMAAT_SCHEDULE.Fajr, mode: 'custom', customTime24: '06:00' },
    Dhuhr: { ...DEFAULT_JAMAAT_SCHEDULE.Dhuhr, mode: 'custom', customTime24: '13:30' },
    Asr: { ...DEFAULT_JAMAAT_SCHEDULE.Asr, mode: 'custom', customTime24: '16:00' },
    Maghrib: { ...DEFAULT_JAMAAT_SCHEDULE.Maghrib, mode: 'auto', offsetMinutes: 5 },
    Isha: { ...DEFAULT_JAMAAT_SCHEDULE.Isha, mode: 'custom', customTime24: '19:00' },
    Jummah: { ...DEFAULT_JAMAAT_SCHEDULE.Jummah, mode: 'custom', customTime24: '13:30' },
  };
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

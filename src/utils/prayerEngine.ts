// Bannu Farz Timings, Hanafi Nawafil, and Editable Khanqah Jama'at Schedule Engine

export type FarzKey = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
export type JamaatKey = FarzKey | 'Jummah';

export interface FarzTiming {
  key: FarzKey;
  name: string;
  start24: string;
  start12: string;
  end24: string;
  end12: string;
}

export interface NawafilTiming {
  key: string;
  name: string;
  subLabel: string;
  start24: string;
  start12: string;
  end24: string;
  end12: string;
  isProhibited?: boolean;
}

export interface PrayerCache {
  hijriDate: string;
  gregorianDate: string;
  sunrise24: string;
  sunset24: string;
  lastthird24: string;
  midnight24: string;
  prayers: FarzTiming[];
  fetchedDateKey: string;
}

export interface JamaatScheduleItem {
  key: JamaatKey;
  name: string;
  mode: 'auto' | 'custom';
  offsetMinutes: number; // used when mode === 'auto' relative to Farz time
  customTime24: string; // "HH:MM"
}

export const PRAYER_CACHE_KEY = 'khanqah_bannu_prayers_v2';
export const JAMAAT_STORAGE_KEY = 'khanqah_jamaat_schedule_v1';

export const DEFAULT_JAMAAT_SCHEDULE: Record<JamaatKey, JamaatScheduleItem> = {
  Fajr: { key: 'Fajr', name: 'فجر جماعت', mode: 'auto', offsetMinutes: 30, customTime24: '05:45' },
  Dhuhr: { key: 'Dhuhr', name: 'ظہر جماعت', mode: 'custom', offsetMinutes: 45, customTime24: '13:30' },
  Asr: { key: 'Asr', name: 'عصر جماعت', mode: 'auto', offsetMinutes: 20, customTime24: '16:15' },
  Maghrib: { key: 'Maghrib', name: 'مغرب جماعت', mode: 'auto', offsetMinutes: 5, customTime24: '17:45' },
  Isha: { key: 'Isha', name: 'عشاء جماعت', mode: 'auto', offsetMinutes: 25, customTime24: '19:45' },
  Jummah: { key: 'Jummah', name: 'جمعہ جماعت', mode: 'custom', offsetMinutes: 0, customTime24: '13:30' },
};

export function clean24(raw: string | undefined, fallback = '00:00'): string {
  if (!raw) return fallback;
  const part = raw.split(' ')[0].trim();
  const [h, m] = part.split(':');
  const hh = parseInt(h, 10);
  const mm = parseInt(m, 10);
  if (isNaN(hh) || isNaN(mm)) return fallback;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function time24ToMinutes(time24: string): number {
  const clean = clean24(time24);
  const [hStr, mStr] = clean.split(':');
  return parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
}

export function addMinutesTo24h(time24: string, deltaMinutes: number): string {
  const baseMins = time24ToMinutes(time24);
  const total = ((baseMins + deltaMinutes) % 1440 + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTo12Hour(time24: string): string {
  const clean = clean24(time24);
  const [hStr, mStr] = clean.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return time24;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function parseAladhanPayload(json: any): PrayerCache | null {
  const h = json?.data?.date?.hijri;
  const g = json?.data?.date?.gregorian;
  const t = json?.data?.timings;
  if (!h || !t) return null;

  const fajr = clean24(t.Fajr);
  const sunrise = clean24(t.Sunrise, addMinutesTo24h(fajr, 80));
  const dhuhr = clean24(t.Dhuhr);
  const asr = clean24(t.Asr);
  const maghrib = clean24(t.Maghrib);
  const sunset = clean24(t.Sunset, maghrib);
  const isha = clean24(t.Isha);
  const lastthird = clean24(t.Lastthird, addMinutesTo24h(fajr, -90));
  const midnight = clean24(t.Midnight, '00:00');

  const prayers: FarzTiming[] = [
    {
      key: 'Fajr',
      name: 'فجر',
      start24: fajr,
      start12: formatTo12Hour(fajr),
      end24: sunrise,
      end12: formatTo12Hour(sunrise),
    },
    {
      key: 'Dhuhr',
      name: 'ظہر',
      start24: dhuhr,
      start12: formatTo12Hour(dhuhr),
      end24: asr,
      end12: formatTo12Hour(asr),
    },
    {
      key: 'Asr',
      name: 'عصر',
      start24: asr,
      start12: formatTo12Hour(asr),
      end24: sunset,
      end12: formatTo12Hour(sunset),
    },
    {
      key: 'Maghrib',
      name: 'مغرب',
      start24: maghrib,
      start12: formatTo12Hour(maghrib),
      end24: isha,
      end12: formatTo12Hour(isha),
    },
    {
      key: 'Isha',
      name: 'عشاء',
      start24: isha,
      start12: formatTo12Hour(isha),
      end24: fajr,
      end12: formatTo12Hour(fajr),
    },
  ];

  return {
    hijriDate: `${h.day} ${h.month?.ar || ''} ${h.year}ھ`,
    gregorianDate: g?.date || '',
    sunrise24: sunrise,
    sunset24: sunset,
    lastthird24: lastthird,
    midnight24: midnight,
    prayers,
    fetchedDateKey: new Date().toDateString(),
  };
}

export function computeNawafilTimings(cache: PrayerCache | null): NawafilTiming[] {
  if (!cache || !cache.prayers.length) return [];
  const fajr = cache.prayers.find((p) => p.key === 'Fajr')?.start24 || '05:00';
  const dhuhr = cache.prayers.find((p) => p.key === 'Dhuhr')?.start24 || '12:15';
  const maghrib = cache.prayers.find((p) => p.key === 'Maghrib')?.start24 || '17:30';
  const isha = cache.prayers.find((p) => p.key === 'Isha')?.start24 || '19:00';

  const tahajjudStart = cache.lastthird24 || addMinutesTo24h(fajr, -90);
  const ishraqStart = addMinutesTo24h(cache.sunrise24, 15);
  const ishraqEnd = addMinutesTo24h(cache.sunrise24, 75);
  const chashtStart = addMinutesTo24h(cache.sunrise24, 45);
  const zawalStart = addMinutesTo24h(dhuhr, -10);
  const awwabinStart = addMinutesTo24h(maghrib, 10);

  return [
    {
      key: 'Tahajjud',
      name: 'تہجد',
      subLabel: 'آخرِ شب تا صبح صادق',
      start24: tahajjudStart,
      start12: formatTo12Hour(tahajjudStart),
      end24: fajr,
      end12: formatTo12Hour(fajr),
    },
    {
      key: 'Ishraq',
      name: 'اشراق',
      subLabel: 'طلوع کے 15 منٹ بعد',
      start24: ishraqStart,
      start12: formatTo12Hour(ishraqStart),
      end24: ishraqEnd,
      end12: formatTo12Hour(ishraqEnd),
    },
    {
      key: 'Chasht',
      name: 'چاشت (ضحیٰ)',
      subLabel: 'اشراق کے بعد تا قبل زوال',
      start24: chashtStart,
      start12: formatTo12Hour(chashtStart),
      end24: zawalStart,
      end12: formatTo12Hour(zawalStart),
    },
    {
      key: 'Zawal',
      name: 'زوال (مکروہ)',
      subLabel: 'نماز پڑھنا ممنوع ہے',
      start24: zawalStart,
      start12: formatTo12Hour(zawalStart),
      end24: dhuhr,
      end12: formatTo12Hour(dhuhr),
      isProhibited: true,
    },
    {
      key: 'Awwabin',
      name: 'اوابین',
      subLabel: 'مغرب کے بعد تا عشاء',
      start24: awwabinStart,
      start12: formatTo12Hour(awwabinStart),
      end24: isha,
      end12: formatTo12Hour(isha),
    },
  ];
}

export function resolveJamaatTime24(
  key: JamaatKey,
  item: JamaatScheduleItem,
  cache: PrayerCache | null
): string {
  if (item.mode === 'custom' || key === 'Jummah') {
    return clean24(item.customTime24, '13:30');
  }
  const farz = cache?.prayers.find((p) => p.key === key);
  if (!farz) return clean24(item.customTime24);
  return addMinutesTo24h(farz.start24, item.offsetMinutes);
}

export function getNextFarzKey(prayers: FarzTiming[], now: Date): FarzKey | null {
  if (!prayers.length) return null;
  const currentMins = now.getHours() * 60 + now.getMinutes();
  for (const p of prayers) {
    const mins = time24ToMinutes(p.start24);
    if (!isNaN(mins) && mins > currentMins) {
      return p.key;
    }
  }
  return 'Fajr';
}

import { useState, useEffect, useCallback } from 'react';
import { BAYANAT_DATABASE, BayanItem } from '../data/bayanatData';

const ARCHIVE_CACHE_KEY = 'khanqah_archive_live_bayanat_v1';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const ARCHIVE_COLLECTIONS: Record<
  string,
  { title: string; urdu: string; category: BayanItem['category'] }
> = {
  'noor-e-nisbat': {
    title: 'Sulook ila Allah ke Aasaan Usool',
    urdu: 'سلوک الی اللہ کے آسان اصول',
    category: 'Sulook',
  },
  '20250918_20250918_0142': {
    title: 'Sulook ila Allah',
    urdu: 'سلوک الی اللہ',
    category: 'Sulook',
  },
  '20251018_20251018_0949': {
    title: 'Haftawar Zikr Majalis',
    urdu: 'ہفتہ وار ذکر مجالس',
    category: 'Zikr',
  },
  '143_20251113': {
    title: 'Dars-e-Quran Masjid Islamuddin',
    urdu: 'درسِ قرآن مسجد اسلام الدین',
    category: 'Dars',
  },
  '001_20251018': {
    title: 'Hamd o Naat',
    urdu: 'حمد و نعت',
    category: 'Hamd',
  },
  '20260205_20260205_1013': {
    title: 'Dastar-e-Fazilat 2026',
    urdu: 'دستارِ فضیلت 2026',
    category: 'Islahi',
  },
  '2_20250901': {
    title: 'Islahi Bayanat',
    urdu: 'اصلاحی بیانات',
    category: 'Islahi',
  },
  '13-2024_202510': {
    title: 'Masnoon Duain o Fazail',
    urdu: 'مسنون دعائیں و فضائل',
    category: 'Fazilat',
  },
  '22-2017_202509': {
    title: 'Khasoosi Bayanat',
    urdu: 'خصوصی بیانات و مواعظ',
    category: 'Islahi',
  },
};

export function getBayanTimestampMs(bayan: BayanItem): number {
  const mtimeNum = parseInt(bayan.mtime || '0', 10);
  if (!isNaN(mtimeNum) && mtimeNum > 0) {
    return mtimeNum * 1000;
  }
  return 0;
}

/**
 * Returns true if the Bayan was uploaded within the last 7 days.
 */
export function isBayanNew(bayan: BayanItem, referenceNowMs = Date.now()): boolean {
  const ts = getBayanTimestampMs(bayan);
  if (!ts) return false;
  const diff = referenceNowMs - ts;
  return diff >= -86400000 && diff <= SEVEN_DAYS_MS;
}

export function formatBayanDateUrdu(bayan: BayanItem): string {
  const ts = getBayanTimestampMs(bayan);
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleDateString('ur-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Share a Bayan directly on WhatsApp without disrupting the current page
 */
export function shareBayanOnWhatsApp(bayan: BayanItem) {
  const title = bayan.urduTitle || bayan.title;
  const folder = bayan.collectionUrdu || bayan.collectionTitle;
  const text = [
    `🌙 *خانقاہ دارالفلاح — آڈیو بیان*`,
    `📌 *عنوان:* ${title}`,
    `📁 *فولڈر:* ${folder}`,
    `🎙️ *شیخ الحدیث حضرت مولانا پیر محمد جمشید نقشبندی مجددی (دامت برکاتہم)*`,
    ``,
    `🎧 براہِ راست سننے یا ڈاؤنلوڈ کرنے کا لنک:`,
    bayan.audioUrl,
  ].join('\n');

  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const a = document.createElement('a');
  a.href = waUrl;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      document.body.removeChild(a);
    } catch {}
  }, 500);
}

/**
 * Normalizes text for strong Urdu/Arabic/Date/Location matching
 */
export function normalizeSearchText(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[يى]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[هھة]/g, 'ہ')
    .replace(/[أإآا]/g, 'ا')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[_.\-\[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function mergeAndSortBayanat(liveItems: BayanItem[]): BayanItem[] {
  const map = new Map<string, BayanItem>();
  for (const item of BAYANAT_DATABASE) {
    map.set(item.audioUrl, item);
  }
  for (const item of liveItems) {
    const existing = map.get(item.audioUrl);
    if (existing) {
      map.set(item.audioUrl, {
        ...existing,
        mtime: item.mtime || existing.mtime,
        size: item.size || existing.size,
        length: item.length || existing.length,
      });
    } else {
      map.set(item.audioUrl, item);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => getBayanTimestampMs(b) - getBayanTimestampMs(a)
  );
}

async function fetchCollectionMetadata(collectionId: string): Promise<BayanItem[]> {
  const info = ARCHIVE_COLLECTIONS[collectionId];
  if (!info) return [];
  const res = await fetch(`https://archive.org/metadata/${collectionId}`);
  if (!res.ok) return [];
  const json = await res.json();
  const files: any[] = Array.isArray(json?.files) ? json.files : [];
  const items: BayanItem[] = [];

  for (const f of files) {
    const name = String(f?.name || '');
    if (!name.toLowerCase().endsWith('.mp3')) continue;
    const baseName = name.replace(/\.mp3$/i, '').trim();
    const encodedName = name
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/');
    items.push({
      id: `live-${collectionId}-${baseName}`,
      collectionId,
      collectionTitle: info.title,
      collectionUrdu: info.urdu,
      category: info.category,
      filename: name,
      title: baseName,
      urduTitle: baseName,
      audioUrl: `https://archive.org/download/${collectionId}/${encodedName}`,
      length: f?.length ? String(f.length) : undefined,
      size: f?.size ? String(f.size) : undefined,
      mtime: f?.mtime ? String(f.mtime) : undefined,
    });
  }
  return items;
}

export function useArchiveBayanat() {
  const [bayanat, setBayanat] = useState<BayanItem[]>(() => {
    try {
      const cached = localStorage.getItem(ARCHIVE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return mergeAndSortBayanat(parsed);
        }
      }
    } catch {}
    return mergeAndSortBayanat([]);
  });

  const [isSyncingArchive, setIsSyncingArchive] = useState(false);

  const syncArchive = useCallback(async () => {
    setIsSyncingArchive(true);
    try {
      const collectionIds = Object.keys(ARCHIVE_COLLECTIONS);
      const settled = await Promise.allSettled(
        collectionIds.map((id) => fetchCollectionMetadata(id))
      );
      const liveItems: BayanItem[] = [];
      for (const r of settled) {
        if (r.status === 'fulfilled' && r.value.length > 0) {
          liveItems.push(...r.value);
        }
      }
      if (liveItems.length > 0) {
        const merged = mergeAndSortBayanat(liveItems);
        setBayanat(merged);
        try {
          // Cache only live items to keep localStorage lightweight
          localStorage.setItem(ARCHIVE_CACHE_KEY, JSON.stringify(liveItems.slice(0, 250)));
        } catch {}
      }
    } catch {
      // Keep fallback database smoothly
    } finally {
      setIsSyncingArchive(false);
    }
  }, []);

  useEffect(() => {
    syncArchive();
  }, [syncArchive]);

  return {
    bayanat,
    isSyncingArchive,
    syncArchive,
  };
}

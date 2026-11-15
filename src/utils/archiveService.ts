import { useState, useEffect, useCallback } from 'react';
import { BAYANAT_DATABASE, BayanItem } from '../data/bayanatData';

const ARCHIVE_CACHE_KEY = 'khanqah_archive_live_bayanat_v2';
const ARCHIVE_FOLDERS_CACHE_KEY = 'khanqah_archive_folders_v2';
const ARCHIVE_UPLOADER_EMAIL = 'khanqahdarulfalah@gmail.com';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface ArchiveCollectionMeta {
  title: string;
  urdu: string;
  category: BayanItem['category'];
}

export interface ArchiveFolderSummary {
  id: string;
  title: string;
  urdu: string;
  mediatype: 'audio' | 'texts' | 'movies' | string;
  category: BayanItem['category'];
  addeddate?: string;
  itemCount: number;
  archiveUrl: string;
}

export const ARCHIVE_COLLECTIONS: Record<string, ArchiveCollectionMeta> = {
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
  '20260220_20260220_0620': {
    title: 'Ramzan ul Mubarak ke Aham Masail',
    urdu: 'رمضان المبارک کے اہم مسائل',
    category: 'Dars',
  },
  'wa-0112_202511': {
    title: 'Shukook o Shubahat ka Izaala',
    urdu: 'شکوک و شبہات کا ازالہ',
    category: 'Islahi',
  },
  '1-2_20250901': {
    title: 'Seerat-un-Nabi Dars 1-2',
    urdu: 'سیرت النبی ﷺ درس نمبر 1-2',
    category: 'Dars',
  },
};

function inferCategoryFromTitle(title: string): BayanItem['category'] {
  const lower = title.toLowerCase();
  if (lower.includes('سلوک') || lower.includes('نسبت') || lower.includes('sulook')) return 'Sulook';
  if (lower.includes('ذکر') || lower.includes('zikr') || lower.includes('مجلس')) return 'Zikr';
  if (lower.includes('درس') || lower.includes('قرآن') || lower.includes('سیرت') || lower.includes('رمضان')) return 'Dars';
  if (lower.includes('حمد') || lower.includes('نعت') || lower.includes('تلاوت')) return 'Hamd';
  if (lower.includes('فضیلت') || lower.includes('دعا')) return 'Fazilat';
  return 'Islahi';
}

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

interface DiscoveredArchiveDoc {
  identifier: string;
  title: string;
  mediatype: string;
  addeddate?: string;
}

async function discoverUploaderItems(): Promise<DiscoveredArchiveDoc[]> {
  const url = `https://archive.org/advancedsearch.php?q=uploader:${encodeURIComponent(
    ARCHIVE_UPLOADER_EMAIL
  )}&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=mediatype&fl%5B%5D=addeddate&sort%5B%5D=addeddate+desc&rows=50&output=json`;

  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  const docs: any[] = Array.isArray(json?.response?.docs) ? json.response.docs : [];
  return docs
    .map((d) => ({
      identifier: String(d?.identifier || '').trim(),
      title: String(d?.title || d?.identifier || '').trim(),
      mediatype: String(d?.mediatype || 'audio').trim(),
      addeddate: d?.addeddate ? String(d.addeddate) : undefined,
    }))
    .filter((d) => d.identifier.length > 0);
}

async function fetchCollectionMetadata(
  collectionId: string,
  meta: ArchiveCollectionMeta
): Promise<BayanItem[]> {
  const res = await fetch(`https://archive.org/metadata/${collectionId}`);
  if (!res.ok) return [];
  const json = await res.json();
  const files: any[] = Array.isArray(json?.files) ? json.files : [];
  const items: BayanItem[] = [];

  for (const f of files) {
    const name = String(f?.name || '');
    const lower = name.toLowerCase();
    if (!lower.endsWith('.mp3') || lower.endsWith('_64kb.mp3')) continue;
    const baseName = name.replace(/\.mp3$/i, '').trim();
    const encodedName = name
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/');
    items.push({
      id: `live-${collectionId}-${baseName}`,
      collectionId,
      collectionTitle: meta.title,
      collectionUrdu: meta.urdu,
      category: meta.category,
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

function buildDefaultFolders(bayanat: BayanItem[]): ArchiveFolderSummary[] {
  const counts = new Map<string, number>();
  for (const b of bayanat) {
    counts.set(b.collectionId, (counts.get(b.collectionId) || 0) + 1);
  }
  return Object.entries(ARCHIVE_COLLECTIONS).map(([id, info]) => ({
    id,
    title: info.title,
    urdu: info.urdu,
    mediatype: 'audio',
    category: info.category,
    itemCount: counts.get(id) || 0,
    archiveUrl: `https://archive.org/details/${id}`,
  }));
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

  const [archiveFolders, setArchiveFolders] = useState<ArchiveFolderSummary[]>(() => {
    try {
      const cached = localStorage.getItem(ARCHIVE_FOLDERS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return buildDefaultFolders(BAYANAT_DATABASE);
  });

  const [isSyncingArchive, setIsSyncingArchive] = useState(false);

  const syncArchive = useCallback(async () => {
    setIsSyncingArchive(true);
    try {
      // 1. Auto-discover ALL collections uploaded under khanqahdarulfalah@gmail.com
      let discoveredDocs: DiscoveredArchiveDoc[] = [];
      try {
        discoveredDocs = await discoverUploaderItems();
      } catch {}

      const collectionsMap = new Map<string, ArchiveCollectionMeta & { mediatype: string; addeddate?: string }>();
      for (const [id, meta] of Object.entries(ARCHIVE_COLLECTIONS)) {
        collectionsMap.set(id, { ...meta, mediatype: 'audio' });
      }

      for (const doc of discoveredDocs) {
        // Skip internal software APK & pure UI image assets in folder list
        if (doc.mediatype === 'software' || doc.mediatype === 'image') continue;
        const existing = ARCHIVE_COLLECTIONS[doc.identifier];
        collectionsMap.set(doc.identifier, {
          title: existing?.title || doc.title,
          urdu: doc.title && /[\u0600-\u06FF]/.test(doc.title) ? doc.title : (existing?.urdu || doc.title),
          category: existing?.category || inferCategoryFromTitle(doc.title),
          mediatype: doc.mediatype,
          addeddate: doc.addeddate,
        });
      }

      // 2. Fetch audio files across all audio collections
      const audioEntries = Array.from(collectionsMap.entries()).filter(
        ([, meta]) => meta.mediatype === 'audio'
      );

      const settled = await Promise.allSettled(
        audioEntries.map(([id, meta]) => fetchCollectionMetadata(id, meta))
      );

      const liveItems: BayanItem[] = [];
      const folderCounts = new Map<string, number>();

      settled.forEach((r, idx) => {
        const folderId = audioEntries[idx][0];
        if (r.status === 'fulfilled') {
          folderCounts.set(folderId, r.value.length);
          if (r.value.length > 0) {
            liveItems.push(...r.value);
          }
        }
      });

      const merged = liveItems.length > 0 ? mergeAndSortBayanat(liveItems) : bayanat;
      if (liveItems.length > 0) {
        setBayanat(merged);
        try {
          localStorage.setItem(ARCHIVE_CACHE_KEY, JSON.stringify(liveItems.slice(0, 350)));
        } catch {}
      }

      // Build complete folder summaries (auto-discovered audio folders + books/videos)
      const fallbackCounts = new Map<string, number>();
      for (const b of merged) {
        fallbackCounts.set(b.collectionId, (fallbackCounts.get(b.collectionId) || 0) + 1);
      }

      const folderList: ArchiveFolderSummary[] = Array.from(collectionsMap.entries()).map(
        ([id, meta]) => ({
          id,
          title: meta.title,
          urdu: meta.urdu,
          mediatype: meta.mediatype,
          category: meta.category,
          addeddate: meta.addeddate,
          itemCount: folderCounts.get(id) ?? fallbackCounts.get(id) ?? 0,
          archiveUrl: `https://archive.org/details/${id}`,
        })
      );

      setArchiveFolders(folderList);
      try {
        localStorage.setItem(ARCHIVE_FOLDERS_CACHE_KEY, JSON.stringify(folderList));
      } catch {}
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
    archiveFolders,
    isSyncingArchive,
    syncArchive,
  };
}

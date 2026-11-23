import { useState, useEffect, useCallback } from 'react';
import { BAYANAT_DATABASE, BayanItem } from '../data/bayanatData';

const ARCHIVE_CACHE_KEY = 'khanqah_archive_live_bayanat_v2';
const ARCHIVE_FOLDERS_CACHE_KEY = 'khanqah_archive_folders_v2';
const ARCHIVE_BOOKS_CACHE_KEY = 'khanqah_archive_live_books_v1';
const ARCHIVE_UPLOADER_EMAIL = 'khanqahdarulfalah@gmail.com';
const ARCHIVE_COVERS_COLLECTION = 'screenshot-20260427-111530';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface BookItem {
  id: string;
  collectionId: string;
  collectionTitle: string;
  collectionUrdu: string;
  filename: string;
  title: string;
  urduTitle: string;
  pdfUrl: string;
  coverUrl?: string;
  size?: string;
  mtime?: string;
}

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
  '20251018_20251018_0949': {
    title: 'Telawat, Hamd o Naat Sharif',
    urdu: 'تلاوت، حمد و نعت شریف',
    category: 'Hamd',
  },
  'noor-e-nisbat': {
    title: 'Sulook ila Allah ke Aasaan Usool',
    urdu: 'نورِ نسبت (سلوک کے آسان طریقے)',
    category: 'Sulook',
  },
  '20250918_20250918_0142': {
    title: 'Sulook ila Allah',
    urdu: 'سلوک الی اللہ',
    category: 'Sulook',
  },
  '13-2024_202510': {
    title: 'Haftawar Majlis-e-Zikr Bayanat',
    urdu: 'ہفتہ وار مجلسِ ذکر بیانات',
    category: 'Zikr',
  },
  '22-2017_202509': {
    title: 'Islahi Majalis',
    urdu: 'اصلاحی مجالس',
    category: 'Islahi',
  },
  '2_20250901': {
    title: 'Mehman Ulama-e-Kiram Bayanat',
    urdu: 'خانقاہ دارالفلاح میں مہمان علماء کرام کے بیانات',
    category: 'Islahi',
  },
  '001_20251018': {
    title: 'Dars-e-Quran Jamia Arabia Darulhuda',
    urdu: 'درسِ قرآن جامعہ عربیہ دارالہدیٰ میراخیل بنوں',
    category: 'Dars',
  },
  '143_20251113': {
    title: 'Dars-e-Quran Masjid Islamuddin',
    urdu: 'درسِ قرآن مسجد اسلام دین نہرغوڑہ',
    category: 'Dars',
  },
  '20260205_20260205_1013': {
    title: 'Dastar-e-Fazilat 2026',
    urdu: 'خانقاہ و مدرسہ دارالفلاح 2026 دوسرا جلسہ',
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

export function getTimestampMsFromMtime(mtime?: string): number {
  const mtimeNum = parseInt(mtime || '0', 10);
  if (!isNaN(mtimeNum) && mtimeNum > 0) {
    return mtimeNum * 1000;
  }
  return 0;
}

export function getBayanTimestampMs(bayan: BayanItem): number {
  return getTimestampMsFromMtime(bayan.mtime);
}

/**
 * Returns true if the item was uploaded within the last 7 days.
 */
export function isTimestampNew(mtime?: string, referenceNowMs = Date.now()): boolean {
  const ts = getTimestampMsFromMtime(mtime);
  if (!ts) return false;
  const diff = referenceNowMs - ts;
  return diff >= -86400000 && diff <= SEVEN_DAYS_MS;
}

export function isBayanNew(bayan: BayanItem, referenceNowMs = Date.now()): boolean {
  return isTimestampNew(bayan.mtime, referenceNowMs);
}

export function isBookNew(book: BookItem, referenceNowMs = Date.now()): boolean {
  return isTimestampNew(book.mtime, referenceNowMs);
}

export function formatMtimeUrdu(mtime?: string): string {
  const ts = getTimestampMsFromMtime(mtime);
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

export function formatBayanDateUrdu(bayan: BayanItem): string {
  return formatMtimeUrdu(bayan.mtime);
}

export function formatBookDateUrdu(book: BookItem): string {
  return formatMtimeUrdu(book.mtime);
}

export function formatBookSize(sizeStr?: string): string {
  const bytes = parseInt(sizeStr || '0', 10);
  if (!bytes || isNaN(bytes)) return '';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
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
 * Share a PDF Book directly on WhatsApp without disrupting the current page
 */
export function shareBookOnWhatsApp(book: BookItem) {
  const title = book.urduTitle || book.title;
  const text = [
    `📚 *خانقاہ دارالفلاح — اسلامی کتاب / رسالہ*`,
    `📖 *کتاب کا نام:* ${title}`,
    `🕌 *زیرِ سرپرستی:* حضرت مولانا پیر محمد جمشید نقشبندی مجددی (دامت برکاتہم)`,
    ``,
    `📥 براہِ راست PDF کتاب پڑھنے یا ڈاؤنلوڈ کرنے کا لنک:`,
    book.pdfUrl,
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
    const colMeta = ARCHIVE_COLLECTIONS[item.collectionId];
    map.set(item.audioUrl, {
      ...item,
      collectionTitle: colMeta?.title || item.collectionTitle,
      collectionUrdu: colMeta?.urdu || item.collectionUrdu,
      category: colMeta?.category || item.category,
    });
  }
  for (const item of liveItems) {
    const existing = map.get(item.audioUrl);
    if (existing) {
      map.set(item.audioUrl, {
        ...existing,
        collectionTitle: item.collectionTitle || existing.collectionTitle,
        collectionUrdu: item.collectionUrdu || existing.collectionUrdu,
        category: item.category || existing.category,
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

// ============================================================================
// Automatic Archive.org Islamic Books Library (PDF Sync + Cover Matching)
// ============================================================================

export const ARCHIVE_BOOK_COLLECTIONS: Record<
  string,
  { title: string; urdu: string }
> = {
  '20250816': {
    title: 'Islamic Urdu Books Collection',
    urdu: 'اسلامی اردو کتب لائبریری',
  },
  'haftaar-zikr-majalis': {
    title: 'Haftawar Zikr Majalis Books',
    urdu: 'ہفتہ وار ذکر مجالس کتب',
  },
};

const KNOWN_BOOK_OVERRIDES: Record<
  string,
  { urduTitle: string; coverUrl?: string }
> = {
  'دل کی صفائی اور نفس کی پاکیزگی': {
    urduTitle: 'دل کی صفائی اور نفس کی پاکیزگی',
    coverUrl:
      'https://archive.org/download/screenshot-20260427-111530/file_000000003f9c720989d1e932137a1849%20%281%29.png',
  },
  shajara_tayyeba: {
    urduTitle: 'شجرہ طیبہ (نقشبندیہ مجددیہ)',
    coverUrl:
      'https://archive.org/download/screenshot-20260427-111530/Screenshot_20260427-111530.jpg',
  },
  'مستند_احادیث_سے__صبح_و_شام_کی_مسنون_دعائیں_دارالافتاء_الاخلاص__کراچی': {
    urduTitle: 'صبح و شام کی مسنون دعائیں (مستند احادیث سے)',
    coverUrl:
      'https://archive.org/download/screenshot-20260427-111530/Screenshot_20260427-164055.jpg',
  },
  'صبح وشام کی مسنون دعائیں': {
    urduTitle: 'صبح و شام کی مسنون دعائیں',
    coverUrl:
      'https://archive.org/download/screenshot-20260427-111530/Screenshot_20260427-164055.jpg',
  },
  '2-گرمی کی شدت اور اسلامی تعلیمات-مفتی محمد شکیل': {
    urduTitle: 'گرمی کی شدت اور اسلامی تعلیمات — مفتی محمد شکیل',
    coverUrl:
      'https://archive.org/download/screenshot-20260427-111530/2-%DA%AF%D8%B1%D9%85%DB%8C%20%DA%A9%DB%8C%20%D8%B4%D8%AF%D8%AA%20%D8%A7%D9%88%D8%B1%20%D8%A7%D8%B3%D9%84%D8%A7%D9%85%DB%8C%20%D8%AA%D8%B9%D9%84%DB%8C%D9%85%D8%A7%D8%AA-%D9%85%D9%81%D8%AA%DB%8C%20%D9%85%D8%AD%D9%85%D8%AF%20%D8%B4%DA%A9%DB%8C%D9%84.jpg',
  },
  نقشہ_اوقات: {
    urduTitle: 'نقشہ اوقاتِ نماز',
  },
};

export const DEFAULT_ARCHIVE_BOOKS: BookItem[] = [
  {
    id: 'book-20250816-dil-ki-safai',
    collectionId: '20250816',
    collectionTitle: 'Islamic Urdu Books Collection',
    collectionUrdu: 'اسلامی اردو کتب لائبریری',
    filename: 'دل کی صفائی اور نفس کی پاکیزگی.pdf',
    title: 'دل کی صفائی اور نفس کی پاکیزگی',
    urduTitle: 'دل کی صفائی اور نفس کی پاکیزگی',
    pdfUrl:
      'https://archive.org/download/20250816/%D8%AF%D9%84%20%DA%A9%DB%8C%20%D8%B5%D9%81%D8%A7%D8%A6%DB%8C%20%D8%A7%D9%88%D8%B1%20%D9%86%D9%81%D8%B3%20%DA%A9%DB%8C%20%D9%BE%D8%A7%DA%A9%DB%8C%D8%B2%DA%AF%DB%8C.pdf',
    coverUrl:
      'https://archive.org/download/screenshot-20260427-111530/file_000000003f9c720989d1e932137a1849%20%281%29.png',
    size: '23558654',
    mtime: '1781715274',
  },
  {
    id: 'book-20250816-garmi-ki-shiddat',
    collectionId: '20250816',
    collectionTitle: 'Islamic Urdu Books Collection',
    collectionUrdu: 'اسلامی اردو کتب لائبریری',
    filename: '2-گرمی کی شدت اور اسلامی تعلیمات-مفتی محمد شکیل.pdf',
    title: 'گرمی کی شدت اور اسلامی تعلیمات',
    urduTitle: 'گرمی کی شدت اور اسلامی تعلیمات — مفتی محمد شکیل',
    pdfUrl:
      'https://archive.org/download/20250816/2-%DA%AF%D8%B1%D9%85%DB%8C%20%DA%A9%DB%8C%20%D8%B4%D8%AF%D8%AA%20%D8%A7%D9%88%D8%B1%20%D8%A7%D8%B3%D9%84%D8%A7%D9%85%DB%8C%20%D8%AA%D8%B9%D9%84%DB%8C%D9%85%D8%A7%D8%AA-%D9%85%D9%81%D8%AA%DB%8C%20%D9%85%D8%AD%D9%85%D8%AF%20%D8%B4%DA%A9%DB%8C%D9%84.pdf',
    coverUrl:
      'https://archive.org/download/screenshot-20260427-111530/2-%DA%AF%D8%B1%D9%85%DB%8C%20%DA%A9%DB%8C%20%D8%B4%D8%AF%D8%AA%20%D8%A7%D9%88%D8%B1%20%D8%A7%D8%B3%D9%84%D8%A7%D9%85%DB%8C%20%D8%AA%D8%B9%D9%84%DB%8C%D9%85%D8%A7%D8%AA-%D9%85%D9%81%D8%AA%DB%8C%20%D9%85%D8%AD%D9%85%D8%AF%20%D8%B4%DA%A9%DB%8C%D9%84.jpg',
    size: '9464944',
    mtime: '1777336613',
  },
  {
    id: 'book-20250816-naqsha-awqaat',
    collectionId: '20250816',
    collectionTitle: 'Islamic Urdu Books Collection',
    collectionUrdu: 'اسلامی اردو کتب لائبریری',
    filename: 'نقشہ_اوقات.pdf',
    title: 'نقشہ اوقاتِ نماز',
    urduTitle: 'نقشہ اوقاتِ نماز',
    pdfUrl:
      'https://archive.org/download/20250816/%D9%86%D9%82%D8%B4%DB%81_%D8%A7%D9%88%D9%82%D8%A7%D8%AA.pdf',
    size: '1765536',
    mtime: '1777308952',
  },
  {
    id: 'book-20250816-subah-shaam-duain',
    collectionId: '20250816',
    collectionTitle: 'Islamic Urdu Books Collection',
    collectionUrdu: 'اسلامی اردو کتب لائبریری',
    filename: 'مستند_احادیث_سے__صبح_و_شام_کی_مسنون_دعائیں_دارالافتاء_الاخلاص__کراچی.pdf',
    title: 'صبح و شام کی مسنون دعائیں',
    urduTitle: 'صبح و شام کی مسنون دعائیں (مستند احادیث سے)',
    pdfUrl:
      'https://archive.org/download/20250816/%D9%85%D8%B3%D8%AA%D9%86%D8%AF_%D8%A7%D8%AD%D8%A7%D8%AF%DB%8C%D8%AB_%D8%B3%DB%92__%D8%B5%D8%A8%D8%AD_%D9%88_%D8%B4%D8%A7%D9%85_%DA%A9%DB%8C_%D9%85%D8%B3%D9%86%D9%88%D9%86_%D8%AF%D8%B9%D8%A7%D8%A6%DB%8C%DA%BA_%D8%AF%D8%A7%D8%B1%D8%A7%D9%84%D8%A7%D9%81%D8%AA%D8%A7%D8%A1_%D8%A7%D9%84%D8%A7%D8%AE%D9%84%D8%A7%D8%B5__%DA%A9%D8%B1%D8%A7%DA%86%DB%8C.pdf',
    coverUrl:
      'https://archive.org/download/screenshot-20260427-111530/Screenshot_20260427-164055.jpg',
    size: '454202',
    mtime: '1772129165',
  },
  {
    id: 'book-20250816-shajara-tayyeba',
    collectionId: '20250816',
    collectionTitle: 'Islamic Urdu Books Collection',
    collectionUrdu: 'اسلامی اردو کتب لائبریری',
    filename: 'SHAJARA_TAYYEBA.pdf',
    title: 'Shajara Tayyeba',
    urduTitle: 'شجرہ طیبہ (نقشبندیہ مجددیہ)',
    pdfUrl: 'https://archive.org/download/20250816/SHAJARA_TAYYEBA.pdf',
    coverUrl:
      'https://archive.org/download/screenshot-20260427-111530/Screenshot_20260427-111530.jpg',
    size: '23054831',
    mtime: '1757898498',
  },
];

function cleanBookBaseTitle(rawFilename: string): string {
  return rawFilename
    .replace(/\.pdf$/i, '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isDerivativePdf(filename: string): boolean {
  const lower = filename.trim().toLowerCase();
  return (
    !lower.endsWith('.pdf') ||
    lower.endsWith('_text.pdf') ||
    lower.endsWith('_bw.pdf') ||
    lower.endsWith('_djvu.pdf') ||
    lower.endsWith('_jp2.pdf') ||
    lower.endsWith('_abbyy.pdf')
  );
}

function isCoverImageFile(filename: string): boolean {
  const lower = filename.trim().toLowerCase();
  if (lower.startsWith('__ia_thumb') || lower.endsWith('_thumb.jpg')) return false;
  return (
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.png') ||
    lower.endsWith('.webp')
  );
}

async function fetchExternalCoversMap(): Promise<Map<string, string>> {
  const coverMap = new Map<string, string>();
  try {
    const res = await fetch(`https://archive.org/metadata/${ARCHIVE_COVERS_COLLECTION}`);
    if (!res.ok) return coverMap;
    const json = await res.json();
    const files: any[] = Array.isArray(json?.files) ? json.files : [];
    for (const f of files) {
      const name = String(f?.name || '');
      if (!isCoverImageFile(name)) continue;
      const base = name.replace(/\.(jpg|jpeg|png|webp)$/i, '').trim().toLowerCase();
      const encodedName = name
        .split('/')
        .map((seg) => encodeURIComponent(seg))
        .join('/');
      coverMap.set(
        base,
        `https://archive.org/download/${ARCHIVE_COVERS_COLLECTION}/${encodedName}`
      );
    }
  } catch {}
  return coverMap;
}

async function fetchBookCollectionMetadata(
  collectionId: string,
  meta: { title: string; urdu: string },
  externalCovers: Map<string, string>
): Promise<BookItem[]> {
  const res = await fetch(`https://archive.org/metadata/${collectionId}`);
  if (!res.ok) return [];
  const json = await res.json();
  const files: any[] = Array.isArray(json?.files) ? json.files : [];

  // Index any cover images placed inside the same Archive folder
  const localCovers = new Map<string, string>();
  for (const f of files) {
    const name = String(f?.name || '');
    if (!isCoverImageFile(name)) continue;
    const base = name.replace(/\.(jpg|jpeg|png|webp)$/i, '').trim().toLowerCase();
    const encodedName = name
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/');
    localCovers.set(base, `https://archive.org/download/${collectionId}/${encodedName}`);
  }

  // Deduplicate whitespace-variant files with identical trimmed names
  const dedupedByTrimmedName = new Map<string, any>();
  for (const f of files) {
    const name = String(f?.name || '');
    if (isDerivativePdf(name)) continue;
    const key = name.trim().toLowerCase();
    const existing = dedupedByTrimmedName.get(key);
    if (!existing) {
      dedupedByTrimmedName.set(key, f);
    } else {
      const existingStartsWithSpace = String(existing.name || '').startsWith(' ');
      const currentStartsWithSpace = name.startsWith(' ');
      if (existingStartsWithSpace && !currentStartsWithSpace) {
        dedupedByTrimmedName.set(key, f);
      } else if (parseInt(f?.mtime || '0', 10) > parseInt(existing?.mtime || '0', 10)) {
        dedupedByTrimmedName.set(key, f);
      }
    }
  }

  const items: BookItem[] = [];
  for (const f of dedupedByTrimmedName.values()) {
    const name = String(f?.name || '');
    const rawBase = name.replace(/\.pdf$/i, '').trim();
    const lowerBase = rawBase.toLowerCase();
    const override = KNOWN_BOOK_OVERRIDES[rawBase] || KNOWN_BOOK_OVERRIDES[lowerBase];
    const cleanTitle = cleanBookBaseTitle(name);
    const encodedName = name
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/');

    const matchedCover =
      override?.coverUrl ||
      localCovers.get(lowerBase) ||
      externalCovers.get(lowerBase);

    items.push({
      id: `book-${collectionId}-${rawBase}`,
      collectionId,
      collectionTitle: meta.title,
      collectionUrdu: meta.urdu,
      filename: name,
      title: cleanTitle,
      urduTitle: override?.urduTitle || cleanTitle,
      pdfUrl: `https://archive.org/download/${collectionId}/${encodedName}`,
      coverUrl: matchedCover,
      size: f?.size ? String(f.size) : undefined,
      mtime: f?.mtime ? String(f.mtime) : undefined,
    });
  }

  return items;
}

export function useArchiveBooks() {
  const [books, setBooks] = useState<BookItem[]>(() => {
    try {
      const cached = localStorage.getItem(ARCHIVE_BOOKS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_ARCHIVE_BOOKS;
  });

  const [isSyncingBooks, setIsSyncingBooks] = useState(false);

  const syncBooks = useCallback(async (onNotify?: (msg: string) => void) => {
    setIsSyncingBooks(true);
    try {
      let discoveredDocs: DiscoveredArchiveDoc[] = [];
      try {
        discoveredDocs = await discoverUploaderItems();
      } catch {}

      const bookCollections = new Map<string, { title: string; urdu: string }>();
      for (const [id, meta] of Object.entries(ARCHIVE_BOOK_COLLECTIONS)) {
        bookCollections.set(id, meta);
      }
      for (const doc of discoveredDocs) {
        if (doc.mediatype === 'texts') {
          const existing = ARCHIVE_BOOK_COLLECTIONS[doc.identifier];
          bookCollections.set(doc.identifier, {
            title: existing?.title || doc.title,
            urdu:
              doc.title && /[\u0600-\u06FF]/.test(doc.title)
                ? doc.title
                : existing?.urdu || doc.title || 'اسلامی اردو کتب لائبریری',
          });
        }
      }

      const externalCovers = await fetchExternalCoversMap();
      const entries = Array.from(bookCollections.entries());
      const settled = await Promise.allSettled(
        entries.map(([id, meta]) =>
          fetchBookCollectionMetadata(id, meta, externalCovers)
        )
      );

      const liveBooks: BookItem[] = [];
      settled.forEach((r) => {
        if (r.status === 'fulfilled' && r.value.length > 0) {
          liveBooks.push(...r.value);
        }
      });

      if (liveBooks.length > 0) {
        liveBooks.sort(
          (a, b) =>
            getTimestampMsFromMtime(b.mtime) - getTimestampMsFromMtime(a.mtime)
        );
        setBooks(liveBooks);
        try {
          localStorage.setItem(ARCHIVE_BOOKS_CACHE_KEY, JSON.stringify(liveBooks));
        } catch {}
        if (onNotify) {
          onNotify(`کتب لائبریری تازہ ہو گئی — ${liveBooks.length} کتب دستیاب ہیں!`);
        }
      }
    } catch {
      // Retain cached/default books gracefully
    } finally {
      setIsSyncingBooks(false);
    }
  }, []);

  useEffect(() => {
    syncBooks();
  }, [syncBooks]);

  return {
    books,
    isSyncingBooks,
    syncBooks,
  };
}

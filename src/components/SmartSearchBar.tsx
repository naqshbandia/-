import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  X,
  BookOpen,
  Calendar,
  Play,
  Download,
  Filter,
  Folder,
  FolderDown,
  Loader2,
  Share2,
  Newspaper,
  Eye,
} from 'lucide-react';
import { BAYANAT_DATABASE, BLOG_POSTS, BayanItem, BlogPostItem } from '../data/bayanatData';
import { BloggerPostTab } from '../data/appConfig';
import {
  downloadSingleBayan,
  downloadSingleBook,
  downloadSinglePoster,
  downloadFolderBayanat,
  subscribeToDownloads,
} from '../utils/downloadHelper';
import {
  BookItem,
  NewsPosterItem,
  normalizeSearchText,
  shareBayanOnWhatsApp,
  shareBookOnWhatsApp,
  sharePosterOnWhatsApp,
  isBayanNew,
  isBookNew,
  isPosterNew,
  formatBayanDateUrdu,
  formatBookDateUrdu,
  formatBookSize,
  formatPosterDateUrdu,
} from '../utils/archiveService';
import {
  AppLanguage,
  DEFAULT_LANGUAGE,
  UI_STRINGS,
  getDir,
} from '../data/translations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateUrl: (url: string) => void;
  onPlayAudio?: (bayan: BayanItem) => void;
  onOpenBookReader?: (book: BookItem) => void;
  onOpenNews?: () => void;
  onOpenLibraryFolder?: (folderId: string) => void;
  onNotify?: (message: string) => void;
  isDark: boolean;
  bayanatList?: BayanItem[];
  booksList?: BookItem[];
  postersList?: NewsPosterItem[];
  bloggerTabs?: BloggerPostTab[];
  lang?: AppLanguage;
}

export interface FolderGroup {
  id: string;
  title: string;
  urdu: string;
  category: string;
  items: BayanItem[];
}

export type UnifiedSearchResult =
  | { type: 'folder'; data: FolderGroup }
  | { type: 'book'; data: BookItem }
  | { type: 'poster'; data: NewsPosterItem }
  | { type: 'bayan'; data: BayanItem }
  | { type: 'post'; data: BlogPostItem };

export const SmartSearchBar: React.FC<Props> = ({
  isOpen,
  onClose,
  onNavigateUrl,
  onPlayAudio,
  onOpenBookReader,
  onOpenNews,
  onOpenLibraryFolder,
  onNotify,
  isDark,
  bayanatList = BAYANAT_DATABASE,
  booksList = [],
  postersList = [],
  bloggerTabs = [],
  lang = DEFAULT_LANGUAGE,
}) => {
  const t = UI_STRINGS[lang];
  const dir = getDir(lang);
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'folders' | 'bayanat' | 'books' | 'posters' | 'islahi' | 'dars' | 'posts'
  >('all');
  const [downloadingFolderId, setDownloadingFolderId] = useState<string | null>(null);
  const [folderProgress, setFolderProgress] = useState<{
    current: number;
    total: number;
    title: string;
  } | null>(null);
  const [activeDownloadIds, setActiveDownloadIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = subscribeToDownloads((activeIds) => {
      setActiveDownloadIds(activeIds);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Merge hardcoded BLOG_POSTS + live Blogger posts without duplicates
  const allPosts = useMemo<BlogPostItem[]>(() => {
    const map = new Map<string, BlogPostItem>();
    for (const p of BLOG_POSTS) {
      map.set(p.url, p);
    }
    for (const tab of bloggerTabs) {
      if (!map.has(tab.url)) {
        map.set(tab.url, {
          id: tab.id,
          title: tab.title,
          urduTitle: tab.title,
          url: tab.url,
          published: tab.published ? tab.published.slice(0, 10) : '',
          description: tab.snippet || 'خانقاہ دارالفلاح پوسٹ / اعلان / اشتہار',
          category: tab.iconName === 'news' ? 'اعلان و اشتہار' : 'بلاگر پوسٹ',
        });
      }
    }
    return Array.from(map.values());
  }, [bloggerTabs]);

  // Compute Folders
  const foldersList = useMemo<FolderGroup[]>(() => {
    const map = new Map<string, FolderGroup>();
    for (const b of bayanatList) {
      if (!map.has(b.collectionId)) {
        map.set(b.collectionId, {
          id: b.collectionId,
          title: b.collectionTitle,
          urdu: b.collectionUrdu,
          category: b.category,
          items: [],
        });
      }
      map.get(b.collectionId)!.items.push(b);
    }
    return Array.from(map.values());
  }, [bayanatList]);

  const filteredFolders = useMemo(() => {
    const q = normalizeSearchText(query);
    if (!q) return foldersList;
    return foldersList.filter(
      (f) => normalizeTextMatch(f.urdu, q) || normalizeTextMatch(f.title, q)
    );
  }, [foldersList, query]);

  const searchResults = useMemo(() => {
    const q = normalizeSearchText(query);
    if (!q && selectedFilter === 'all') {
      return [];
    }

    const results: UnifiedSearchResult[] = [];

    // 1. Folders (shown in 'all' when query matches a folder name)
    if (selectedFilter === 'all' && q) {
      for (const folder of filteredFolders) {
        results.push({ type: 'folder', data: folder });
      }
    }

    // 2. Books (کتابیں)
    if (selectedFilter === 'all' || selectedFilter === 'books') {
      for (const book of booksList) {
        const urduDate = formatBookDateUrdu(book);
        const titleMatch =
          normalizeTextMatch(book.title, q) || normalizeTextMatch(book.urduTitle, q);
        const collectionMatch =
          normalizeTextMatch(book.collectionUrdu, q) ||
          normalizeTextMatch(book.collectionTitle, q);
        const filenameMatch = normalizeTextMatch(book.filename, q);
        const dateMatch = normalizeTextMatch(urduDate, q);

        if (!q || titleMatch || collectionMatch || filenameMatch || dateMatch) {
          results.push({ type: 'book', data: book });
        }
      }
    }

    // 3. News & Ishteharat Posters (اشتہارات و اعلانات)
    if (selectedFilter === 'all' || selectedFilter === 'posters') {
      for (const poster of postersList) {
        const urduDate = formatPosterDateUrdu(poster);
        const titleMatch = normalizeTextMatch(poster.title, q);
        const filenameMatch = normalizeTextMatch(poster.filename, q);
        const dateMatch = normalizeTextMatch(urduDate, q);

        if (!q || titleMatch || filenameMatch || dateMatch) {
          results.push({ type: 'poster', data: poster });
        }
      }
    }

    // 4. Bayanat (آڈیو بیانات)
    if (
      selectedFilter === 'all' ||
      selectedFilter === 'bayanat' ||
      selectedFilter === 'islahi' ||
      selectedFilter === 'dars'
    ) {
      for (const bayan of bayanatList) {
        if (selectedFilter === 'islahi' && bayan.category !== 'Islahi') continue;
        if (selectedFilter === 'dars' && bayan.category !== 'Dars') continue;

        const urduDate = formatBayanDateUrdu(bayan);
        const isoDate = bayan.mtime
          ? new Date(parseInt(bayan.mtime, 10) * 1000).toISOString().slice(0, 10)
          : '';

        const titleMatch =
          normalizeTextMatch(bayan.title, q) || normalizeTextMatch(bayan.urduTitle, q);
        const collectionMatch =
          normalizeTextMatch(bayan.collectionUrdu, q) ||
          normalizeTextMatch(bayan.collectionTitle, q);
        const filenameMatch = normalizeTextMatch(bayan.filename, q);
        const dateMatch =
          normalizeTextMatch(urduDate, q) ||
          normalizeTextMatch(isoDate, q) ||
          (bayan.mtime || '').includes(q);

        if (!q || titleMatch || collectionMatch || filenameMatch || dateMatch) {
          results.push({ type: 'bayan', data: bayan });
        }
      }
    }

    // 5. Blog Posts / Misc Posts
    if (selectedFilter === 'all' || selectedFilter === 'posts') {
      for (const post of allPosts) {
        const titleMatch =
          normalizeTextMatch(post.title, q) || normalizeTextMatch(post.urduTitle, q);
        const descMatch = normalizeTextMatch(post.description, q);
        const catMatch = normalizeTextMatch(post.category, q);
        const dateMatch = normalizeTextMatch(post.published, q);

        if (!q || titleMatch || descMatch || catMatch || dateMatch) {
          results.push({ type: 'post', data: post });
        }
      }
    }

    return results;
  }, [query, selectedFilter, allPosts, bayanatList, booksList, postersList, filteredFolders]);

  if (!isOpen) return null;

  const handleSelectPost = (url: string) => {
    onNavigateUrl(url);
    onClose();
  };

  const handleSelectBayan = (bayan: BayanItem) => {
    if (onPlayAudio) {
      onPlayAudio(bayan);
    }
    onClose();
  };

  const handleSelectBook = (book: BookItem) => {
    if (onOpenBookReader) {
      onOpenBookReader(book);
    }
    onClose();
  };

  const handleSelectPoster = () => {
    if (onOpenNews) {
      onOpenNews();
    }
    onClose();
  };

  const handleSelectFolder = (folderId: string) => {
    if (onOpenLibraryFolder) {
      onOpenLibraryFolder(folderId);
    }
    onClose();
  };

  const handleDownloadSingle = async (e: React.MouseEvent, bayan: BayanItem) => {
    e.stopPropagation();
    await downloadSingleBayan(bayan, (msg) => {
      onNotify?.(msg);
    });
  };

  const handleShareSingle = (e: React.MouseEvent, bayan: BayanItem) => {
    e.stopPropagation();
    shareBayanOnWhatsApp(bayan);
  };

  const handleDownloadBook = async (e: React.MouseEvent, book: BookItem) => {
    e.stopPropagation();
    await downloadSingleBook(book, (msg) => {
      onNotify?.(msg);
    });
  };

  const handleShareBook = (e: React.MouseEvent, book: BookItem) => {
    e.stopPropagation();
    shareBookOnWhatsApp(book);
  };

  const handleDownloadPoster = async (e: React.MouseEvent, poster: NewsPosterItem) => {
    e.stopPropagation();
    await downloadSinglePoster(poster, (msg) => {
      onNotify?.(msg);
    });
  };

  const handleSharePoster = (e: React.MouseEvent, poster: NewsPosterItem) => {
    e.stopPropagation();
    sharePosterOnWhatsApp(poster);
  };

  const handleDownloadWholeFolder = async (e: React.MouseEvent, folder: FolderGroup) => {
    e.stopPropagation();
    if (downloadingFolderId) return;

    setDownloadingFolderId(folder.id);
    onNotify?.(`فولڈر ڈاؤنلوڈ شروع: ${folder.urdu} (${folder.items.length} بیانات)`);

    await downloadFolderBayanat(
      folder.urdu,
      folder.items,
      (current, total, title) => {
        setFolderProgress({ current, total, title });
      },
      () => {
        setDownloadingFolderId(null);
        setFolderProgress(null);
        onNotify?.(`فولڈر "${folder.urdu}" کے تمام بیانات میموری میں ڈاؤنلوڈ ہو گئے!`);
      }
    );
  };

  return (
    <div
      className={`absolute top-0 left-0 right-0 z-40 border-b-2 border-[#d4af37] shadow-2xl animate-in slide-in-from-top-3 duration-200 transition-colors ${
        isDark ? 'bg-[#081b11] text-emerald-50' : 'bg-[#f4f7f6] text-[#11261b]'
      }`}
      dir={dir}
    >
      <div className="max-w-5xl mx-auto p-3">
        {/* Search Input Box */}
        <div
          className={`flex items-center gap-2 border border-[#d4af37]/70 rounded-xl px-3 py-2 shadow-inner transition-colors ${
            isDark ? 'bg-[#05120b]' : 'bg-white'
          }`}
        >
          <Search className="w-5 h-5 text-[#064326] dark:text-[#d4af37] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-transparent border-none outline-hidden text-sm font-lalezar leading-normal placeholder-gray-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-[#b08d43] hover:text-emerald-600 cursor-pointer"
              title={t.clearBtn}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-[#064326] hover:bg-[#095c34] text-white text-xs rounded-lg font-lalezar font-bold tracking-wide shadow-xs cursor-pointer"
          >
            {t.closeBtn}
          </button>
        </div>

        {/* Folder Download Ongoing Banner */}
        {folderProgress && (
          <div className="mt-2 p-2.5 bg-emerald-950 border border-emerald-500 rounded-xl flex items-center justify-between text-xs text-emerald-200 font-lalezar">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>
                {t.downloadingText} {folderProgress.current} / {folderProgress.total} ({folderProgress.title})
              </span>
            </div>
            <span className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded-full text-white font-sans">
              {Math.round((folderProgress.current / folderProgress.total) * 100)}%
            </span>
          </div>
        )}

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 text-xs font-lalezar no-scrollbar">
          <span className="text-[#8c6514] dark:text-[#d4af37] text-[11px] shrink-0 flex items-center gap-1 pl-1 font-bold">
            <Filter className="w-3.5 h-3.5" />
            {t.filterLabel}
          </span>
          {(
            [
              ['all', t.filterAll],
              ['bayanat', `${t.filterBayanat} (${bayanatList.length})`],
              ['books', `کتابیں (${booksList.length})`],
              ['posters', `اشتہارات (${postersList.length})`],
              ['folders', `${t.filterFolders} (${foldersList.length})`],
              ['islahi', t.filterIslahi],
              ['dars', t.filterDars],
              ['posts', t.filterPosts],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedFilter(key)}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition-all cursor-pointer font-bold ${
                selectedFilter === key
                  ? 'bg-[#064326] text-white shadow-xs ring-1 ring-[#d4af37]'
                  : isDark
                  ? 'bg-[#0e2418] text-emerald-100/80 border border-[#d4af37]/25'
                  : 'bg-white text-[#064326] border border-emerald-900/15'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* FOLDERS VIEW */}
        {selectedFilter === 'folders' && (
          <div className="mt-2 max-h-[60vh] overflow-y-auto space-y-2">
            {filteredFolders.length === 0 ? (
              <div className="p-6 text-center opacity-70 font-lalezar text-base">
                {t.noResults}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredFolders.map((folder) => {
                  const isDownloading = downloadingFolderId === folder.id;
                  return (
                    <div
                      key={folder.id}
                      onClick={() => handleSelectFolder(folder.id)}
                      className={`p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                        isDark
                          ? 'bg-[#0d2217] border-[#d4af37]/30 hover:border-[#d4af37]'
                          : 'bg-white border-emerald-900/15 shadow-xs hover:border-[#d4af37]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[#064326] dark:text-[#00ff99]">
                            {folder.items.length} بیانات
                          </span>
                          <Folder className="w-5 h-5 text-[#d4af37]" />
                        </div>
                        <h4 className="text-base font-bold font-lalezar leading-tight mb-1">
                          {folder.urdu}
                        </h4>
                        <p className="text-[11px] opacity-65 font-sans line-clamp-1">{folder.title}</p>
                      </div>

                      <button
                        onClick={(e) => handleDownloadWholeFolder(e, folder)}
                        disabled={isDownloading}
                        className="mt-3 w-full py-2 px-3 bg-[#064326] hover:bg-[#095c34] text-white font-lalezar text-xs rounded-lg shadow flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{t.downloadingText}</span>
                          </>
                        ) : (
                          <>
                            <FolderDown className="w-3.5 h-3.5 text-[#d4af37]" />
                            <span>
                              {t.downloadWholeFolder} ({folder.items.length} {t.filesWord})
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* RESULTS OVERLAY LIST */}
        {selectedFilter !== 'folders' && (query.trim().length > 0 || selectedFilter !== 'all') && (
          <div
            className={`mt-2 max-h-[60vh] overflow-y-auto border border-[#d4af37]/40 rounded-xl divide-y divide-emerald-900/10 dark:divide-white/10 shadow-xl ${
              isDark ? 'bg-[#0a1d13]' : 'bg-white'
            }`}
          >
            <div
              className={`px-3 py-1.5 text-xs font-lalezar flex justify-between items-center sticky top-0 z-10 border-b border-[#d4af37]/25 ${
                isDark ? 'bg-[#062214] text-[#d4af37]' : 'bg-[#ebf2ee] text-[#064326]'
              }`}
            >
              <span className="font-bold">
                {t.resultsAvailable} {searchResults.length}
              </span>
              <span className="text-[10px] opacity-75">{t.searchHint}</span>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-6 text-center opacity-70 font-lalezar text-base">
                {t.noResults}
              </div>
            ) : (
              searchResults.map((item, idx) => {
                if (item.type === 'folder') {
                  const folder = item.data;
                  const isDownloading = downloadingFolderId === folder.id;
                  return (
                    <div
                      key={`folder-${folder.id}-${idx}`}
                      onClick={() => handleSelectFolder(folder.id)}
                      className={`p-2.5 cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                        isDark ? 'hover:bg-[#112e1f]' : 'hover:bg-emerald-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#004d00] to-[#007300] border border-[#d4af37] text-[#d4af37] flex items-center justify-center shrink-0">
                          <Folder className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-[#064326] text-[#d4af37] text-[10px] font-bold shrink-0">
                              فولڈر
                            </span>
                            <h4 className="text-sm sm:text-base font-bold font-lalezar leading-tight truncate">
                              {folder.urdu}
                            </h4>
                          </div>
                          <div className="text-[11px] opacity-75 mt-0.5">
                            {folder.items.length} بیانات · کھولنے کے لیے کلک کریں
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDownloadWholeFolder(e, folder)}
                        disabled={isDownloading}
                        className="px-2.5 py-1.5 rounded-lg bg-[#064326] hover:bg-[#095c34] text-white font-lalezar text-xs shadow-xs flex items-center gap-1 shrink-0 cursor-pointer"
                        title={t.downloadWholeFolder}
                      >
                        {isDownloading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <FolderDown className="w-3.5 h-3.5 text-[#d4af37]" />
                            <span className="hidden xs:inline">{t.downloadLabel}</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                } else if (item.type === 'book') {
                  const book = item.data;
                  const isNew = isBookNew(book);
                  const dateLabel = formatBookDateUrdu(book);
                  const sizeLabel = formatBookSize(book.size);
                  const isDownloading = activeDownloadIds.has(book.id);
                  return (
                    <div
                      key={`book-${book.id}-${idx}`}
                      onClick={() => handleSelectBook(book)}
                      className={`p-2.5 cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                        isDark ? 'hover:bg-[#112e1f]' : 'hover:bg-emerald-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-9 h-11 rounded-lg bg-gradient-to-br from-[#064326] to-[#0b5c34] border border-[#d4af37]/70 text-[#f3d97d] overflow-hidden flex items-center justify-center shrink-0">
                          {book.coverUrl ? (
                            <img
                              src={book.coverUrl}
                              alt={book.urduTitle}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-amber-600 text-white text-[10px] font-bold shrink-0">
                              کتاب
                            </span>
                            {isNew && (
                              <span className="px-1.5 py-0.5 rounded bg-[#d4af37] text-[#051a0f] text-[10px] font-bold shrink-0">
                                {t.newShortBadge}
                              </span>
                            )}
                            <h4 className="text-sm sm:text-base font-bold font-lalezar leading-tight truncate">
                              {book.urduTitle || book.title}
                            </h4>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] opacity-75 mt-0.5">
                            <span className="text-[#064326] dark:text-[#d4af37] font-semibold truncate">
                              {book.collectionUrdu}
                            </span>
                            {sizeLabel && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="tabular-nums">{sizeLabel}</span>
                              </>
                            )}
                            {dateLabel && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="tabular-nums">{dateLabel}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" dir="ltr">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectBook(book);
                          }}
                          className="p-2 rounded-lg bg-[#d4af37] hover:bg-[#c5a028] text-[#051a0f] shadow-xs active:scale-95 transition-all cursor-pointer"
                          title="پڑھیں"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleShareBook(e, book)}
                          className="p-2 rounded-lg bg-[#25D366] hover:bg-[#1faa4e] text-white shadow-xs active:scale-95 transition-all cursor-pointer"
                          title={t.shareLabel}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDownloadBook(e, book)}
                          disabled={isDownloading}
                          className={`px-2.5 py-1.5 active:scale-95 text-white font-lalezar text-xs rounded-lg shadow-xs flex items-center gap-1 transition-all cursor-pointer ${
                            isDownloading
                              ? 'bg-amber-600 cursor-wait opacity-90'
                              : 'bg-[#064326] hover:bg-[#095c34]'
                          }`}
                          title={t.downloadLabel}
                        >
                          {isDownloading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span className="hidden xs:inline">PDF</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                } else if (item.type === 'poster') {
                  const poster = item.data;
                  const isNew = isPosterNew(poster);
                  const dateLabel = formatPosterDateUrdu(poster);
                  const isDownloading = activeDownloadIds.has(poster.id);
                  return (
                    <div
                      key={`poster-${poster.id}-${idx}`}
                      onClick={handleSelectPoster}
                      className={`p-2.5 cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                        isDark ? 'hover:bg-[#112e1f]' : 'hover:bg-emerald-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#064326] to-[#0b5c34] border border-[#d4af37]/70 text-[#f3d97d] overflow-hidden flex items-center justify-center shrink-0">
                          {poster.imageUrl ? (
                            <img
                              src={poster.imageUrl}
                              alt={poster.title}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Newspaper className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-rose-700 text-white text-[10px] font-bold shrink-0">
                              اشتہار
                            </span>
                            {isNew && (
                              <span className="px-1.5 py-0.5 rounded bg-[#d4af37] text-[#051a0f] text-[10px] font-bold shrink-0">
                                {t.newShortBadge}
                              </span>
                            )}
                            <h4 className="text-sm sm:text-base font-bold font-lalezar leading-tight truncate">
                              {poster.title}
                            </h4>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] opacity-75 mt-0.5">
                            <span className="text-[#064326] dark:text-[#d4af37] font-semibold">
                              خبریں اور اشتہارات
                            </span>
                            {dateLabel && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="tabular-nums">{dateLabel}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" dir="ltr">
                        <button
                          onClick={(e) => handleSharePoster(e, poster)}
                          className="p-2 rounded-lg bg-[#25D366] hover:bg-[#1faa4e] text-white shadow-xs active:scale-95 transition-all cursor-pointer"
                          title={t.shareLabel}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDownloadPoster(e, poster)}
                          disabled={isDownloading}
                          className={`px-2.5 py-1.5 active:scale-95 text-white font-lalezar text-xs rounded-lg shadow-xs flex items-center gap-1 transition-all cursor-pointer ${
                            isDownloading
                              ? 'bg-amber-600 cursor-wait opacity-90'
                              : 'bg-[#064326] hover:bg-[#095c34]'
                          }`}
                          title={t.downloadLabel}
                        >
                          {isDownloading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span className="hidden xs:inline">{t.downloadLabel}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                } else if (item.type === 'post') {
                  const post = item.data;
                  return (
                    <div
                      key={`post-${post.id}-${idx}`}
                      onClick={() => handleSelectPost(post.url)}
                      className={`p-3 cursor-pointer transition-colors flex items-start justify-between gap-3 group ${
                        isDark ? 'hover:bg-[#112e1f]' : 'hover:bg-emerald-50/70'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-[#064326]/10 dark:bg-[#d4af37]/15 text-[#064326] dark:text-[#d4af37] flex items-center justify-center shrink-0 mt-0.5">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm sm:text-base font-bold font-lalezar leading-tight">
                            {post.urduTitle || post.title}
                          </h4>
                          <p className="text-xs opacity-70 font-sans line-clamp-1 mt-0.5">
                            {post.description}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] opacity-75 mt-1">
                            {post.published && (
                              <span className="flex items-center gap-1 tabular-nums">
                                <Calendar className="w-3 h-3" />
                                {post.published}
                              </span>
                            )}
                            <span className="text-[#064326] dark:text-[#d4af37] font-bold">
                              {t.openPost}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  const bayan = item.data;
                  const isNew = isBayanNew(bayan);
                  const dateLabel = formatBayanDateUrdu(bayan);
                  return (
                    <div
                      key={`bayan-${bayan.id}-${idx}`}
                      onClick={() => handleSelectBayan(bayan)}
                      className={`p-2.5 cursor-pointer transition-colors flex items-center justify-between gap-2 group ${
                        isDark ? 'hover:bg-[#112e1f]' : 'hover:bg-emerald-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          onClick={() => handleSelectBayan(bayan)}
                          className="w-9 h-9 rounded-full bg-[#064326] text-white flex items-center justify-center shrink-0 hover:bg-[#095c34] active:scale-95 transition-transform cursor-pointer"
                          title="سنیں"
                        >
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {isNew && (
                              <span className="px-1.5 py-0.5 rounded bg-[#d4af37] text-[#051a0f] text-[10px] font-bold shrink-0">
                                {t.newShortBadge}
                              </span>
                            )}
                            <h4 className="text-sm sm:text-base font-bold font-lalezar leading-tight truncate">
                              {bayan.urduTitle || bayan.title}
                            </h4>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] opacity-75 mt-0.5">
                            <span className="text-[#064326] dark:text-[#d4af37] font-semibold truncate">
                              {bayan.collectionUrdu}
                            </span>
                            {dateLabel && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="tabular-nums">{dateLabel}</span>
                              </>
                            )}
                            {bayan.length && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="tabular-nums">
                                  {Math.max(1, Math.floor(parseFloat(bayan.length) / 60))} {t.minuteUnit}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" dir="ltr">
                        <button
                          onClick={(e) => handleShareSingle(e, bayan)}
                          className="p-2 rounded-lg bg-[#25D366] hover:bg-[#1faa4e] text-white shadow-xs active:scale-95 transition-all cursor-pointer"
                          title={t.shareLabel}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDownloadSingle(e, bayan)}
                          disabled={activeDownloadIds.has(bayan.id)}
                          className={`px-2.5 py-1.5 active:scale-95 text-white font-lalezar text-xs rounded-lg shadow-xs flex items-center gap-1 transition-all cursor-pointer ${
                            activeDownloadIds.has(bayan.id)
                              ? 'bg-amber-600 cursor-wait opacity-90'
                              : 'bg-[#064326] hover:bg-[#095c34]'
                          }`}
                          title={t.downloadLabel}
                        >
                          {activeDownloadIds.has(bayan.id) ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span className="hidden xs:inline">{t.downloadLabel}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                }
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function normalizeTextMatch(haystack: string | undefined, needle: string): boolean {
  if (!needle) return true;
  if (!haystack) return false;
  return normalizeSearchText(haystack).includes(needle);
}

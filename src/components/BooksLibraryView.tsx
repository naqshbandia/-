import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Download,
  Share2,
  Search,
  RotateCw,
  Loader2,
  ArrowRight,
  FileText,
  X,
  Eye,
  Calendar,
} from 'lucide-react';
import {
  BookItem,
  isBookNew,
  formatBookDateUrdu,
  formatBookSize,
  shareBookOnWhatsApp,
  normalizeSearchText,
} from '../utils/archiveService';
import {
  downloadSingleBook,
  subscribeToDownloads,
} from '../utils/downloadHelper';
import {
  AppLanguage,
  DEFAULT_LANGUAGE,
  UI_STRINGS,
  getDir,
} from '../data/translations';

interface Props {
  books: BookItem[];
  isSyncing: boolean;
  onRefreshBooks: () => void;
  onGoHome: () => void;
  onNotify: (msg: string) => void;
  isDark: boolean;
  lang?: AppLanguage;
  initialBookId?: string | null;
  onClearInitialBook?: () => void;
}

export const BooksLibraryView: React.FC<Props> = ({
  books,
  isSyncing,
  onRefreshBooks,
  onGoHome,
  onNotify,
  isDark,
  lang = DEFAULT_LANGUAGE,
  initialBookId = null,
  onClearInitialBook,
}) => {
  const t = UI_STRINGS[lang];
  const dir = getDir(lang);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('all');
  const [activeDownloadIds, setActiveDownloadIds] = useState<Set<string>>(new Set());
  const [brokenCovers, setBrokenCovers] = useState<Set<string>>(new Set());
  const [readingBook, setReadingBook] = useState<BookItem | null>(null);
  const [isReaderLoading, setIsReaderLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToDownloads((ids) => setActiveDownloadIds(ids));
    return unsub;
  }, []);

  useEffect(() => {
    if (!initialBookId) return;
    const found = books.find((b) => b.id === initialBookId);
    if (found) {
      setIsReaderLoading(true);
      setReadingBook(found);
      onClearInitialBook?.();
    }
  }, [initialBookId, books, onClearInitialBook]);

  useEffect(() => {
    if (!readingBook) return;
    const handleBackIntercept = (e: Event) => {
      e.preventDefault();
      setReadingBook(null);
    };
    window.addEventListener('kdf-back-intercept', handleBackIntercept);
    return () => window.removeEventListener('kdf-back-intercept', handleBackIntercept);
  }, [readingBook]);

  const bookCollections = useMemo(() => {
    const map = new Map<string, { id: string; title: string; count: number }>();
    for (const b of books) {
      const existing = map.get(b.collectionId);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(b.collectionId, {
          id: b.collectionId,
          title: b.collectionUrdu || b.collectionTitle,
          count: 1,
        });
      }
    }
    return Array.from(map.values());
  }, [books]);

  const filteredBooks = useMemo(() => {
    const q = normalizeSearchText(searchQuery);
    return books.filter((b) => {
      if (selectedCollectionId !== 'all' && b.collectionId !== selectedCollectionId) {
        return false;
      }
      if (!q) return true;
      const hay = normalizeSearchText(
        `${b.urduTitle} ${b.title} ${b.filename} ${b.collectionUrdu}`
      );
      return hay.includes(q);
    });
  }, [books, searchQuery, selectedCollectionId]);

  const handleOpenReader = (book: BookItem) => {
    setIsReaderLoading(true);
    setReadingBook(book);
  };

  const handleMarkCoverBroken = (bookId: string) => {
    setBrokenCovers((prev) => {
      const next = new Set(prev);
      next.add(bookId);
      return next;
    });
  };

  return (
    <div
      className="kdf-app-canvas flex-1 w-full h-full overflow-y-auto transition-colors duration-200"
      dir={dir}
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-5 py-4 space-y-4">
        {/* Emerald-Green & Gold Header Card */}
        <section
          className={`rounded-3xl border-2 border-[#d4af37]/75 overflow-hidden shadow-md ${
            isDark ? 'bg-[#0b1f14] text-emerald-50' : 'bg-white text-[#11261b]'
          }`}
        >
          <div className="bg-gradient-to-l from-[#004d00] via-[#007300] to-[#004d00] text-white px-4 py-3 border-b-[3px] border-[#d4af37] flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={onGoHome}
                className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 border border-[#d4af37]/60 text-[#ffd700] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                title={t.drawerItemHome}
              >
                <ArrowRight className={`w-4 h-4 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
              </button>

              <div className="w-10 h-10 rounded-xl bg-white/15 border border-[#d4af37] text-[#ffd700] flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm sm:text-lg font-bold text-white truncate">
                    اسلامی اردو کتب لائبریری
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-white/15 border border-[#d4af37] text-[#fff7b2] text-[10.5px] font-bold tabular-nums">
                    {books.length} کتب
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100/85">
                  آرکائیو سے خودکار اپڈیٹ — ہر کتاب براہِ راست پڑھیں، ڈاؤنلوڈ اور شیئر کریں
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onRefreshBooks}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#d4af37] to-[#a67c2e] hover:brightness-110 text-white border border-white/40 text-xs font-bold shadow-xs cursor-pointer disabled:opacity-60 transition-all active:scale-95"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'تازہ ہو رہا ہے...' : t.refreshBtn}</span>
            </button>
          </div>

          <div className="p-3 sm:p-4 space-y-2.5">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#b08d43] absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="کتاب یا رسالے کا نام تلاش کریں..."
                className={`w-full ps-9 pe-9 py-2 rounded-full border text-xs sm:text-sm outline-none transition-colors ${
                  isDark
                    ? 'bg-[#07150d] border-[#d4af37]/40 text-emerald-50 placeholder-emerald-200/45 focus:border-[#d4af37]'
                    : 'bg-[#fffdf8] border-[#c9b382] text-[#004d00] placeholder-emerald-900/45 focus:border-[#006400]'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute top-1/2 -translate-y-1/2 end-2.5 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Automatic Archive Collection Filter Pills (shown when >1 book folder exists) */}
            {bookCollections.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedCollectionId('all')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 border transition-colors cursor-pointer ${
                    selectedCollectionId === 'all'
                      ? 'bg-[#004d00] text-white border-[#d4af37]'
                      : isDark
                      ? 'bg-white/5 text-emerald-100 border-[#d4af37]/30'
                      : 'bg-[#fffdf8] text-[#004d00] border-[#c9b382]'
                  }`}
                >
                  تمام کتب ({books.length})
                </button>
                {bookCollections.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setSelectedCollectionId(col.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 border transition-colors cursor-pointer ${
                      selectedCollectionId === col.id
                        ? 'bg-[#004d00] text-white border-[#d4af37]'
                        : isDark
                        ? 'bg-white/5 text-emerald-100 border-[#d4af37]/30'
                        : 'bg-[#fffdf8] text-[#004d00] border-[#c9b382]'
                    }`}
                  >
                    {col.title} ({col.count})
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <div
            className={`rounded-3xl border border-[#d4af37]/40 p-8 text-center space-y-2 ${
              isDark ? 'bg-[#0b1f14] text-emerald-100' : 'bg-white text-[#11261b]'
            }`}
          >
            <BookOpen className="w-10 h-10 mx-auto text-[#d4af37] opacity-80" />
            <p className="font-bold text-sm">کوئی کتاب نہیں ملی</p>
            <p className="text-xs opacity-70">
              {searchQuery
                ? 'تلاش کا لفظ بدل کر دوبارہ کوشش کریں'
                : 'آرکائیو فولڈر سے کتابیں حاصل کرنے کے لیے "تازہ کریں" پر کلک کریں'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5 pb-6">
            {filteredBooks.map((book) => {
              const isDownloading = activeDownloadIds.has(book.id);
              const isNew = isBookNew(book);
              const dateLabel = formatBookDateUrdu(book);
              const sizeLabel = formatBookSize(book.size);
              const showImage = Boolean(book.coverUrl) && !brokenCovers.has(book.id);

              return (
                <article
                  key={book.id}
                  className={`rounded-2xl border-2 overflow-hidden flex flex-col justify-between transition-all shadow-sm hover:shadow-md ${
                    isDark
                      ? 'bg-[#0c2216] border-[#d4af37]/40 hover:border-[#d4af37] text-emerald-50'
                      : 'bg-gradient-to-b from-[#fffdf8] to-[#f7efdc] border-[#d4c4a8] hover:border-[#d4af37] text-[#11261b]'
                  }`}
                >
                  {/* Full-Size Portrait Book Cover + Title */}
                  <div className="p-2 sm:p-2.5 space-y-2">
                    <div
                      onClick={() => handleOpenReader(book)}
                      className="relative aspect-[3/4] w-full rounded-xl overflow-hidden border border-[#d4af37]/50 cursor-pointer group bg-gradient-to-br from-[#064326] via-[#042917] to-[#081b11] shadow-inner"
                    >
                      {showImage ? (
                        <img
                          src={book.coverUrl}
                          alt={book.urduTitle}
                          onError={() => handleMarkCoverBroken(book.id)}
                          className="relative z-10 w-full h-full object-contain p-1 group-hover:scale-[1.03] transition-transform duration-300"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center islamic-panel-pattern">
                          <div className="w-11 h-11 rounded-2xl bg-[#d4af37]/15 border border-[#d4af37] text-[#d4af37] flex items-center justify-center mb-2 shadow-sm">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-[#fde68a] line-clamp-3 leading-snug">
                            {book.urduTitle}
                          </p>
                          <span className="mt-1.5 text-[9.5px] text-emerald-100/80">
                            PDF اسلامی کتاب
                          </span>
                        </div>
                      )}

                      {isNew && (
                        <span className="khanqah-new-neon-badge absolute top-1.5 start-1.5 z-20 px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold tracking-wide">
                          {t.newBadge}
                        </span>
                      )}

                      {sizeLabel && (
                        <span
                          className="absolute bottom-1.5 end-1.5 z-20 px-1.5 py-0.5 rounded-md bg-black/80 text-[#00ff99] border border-[#d4af37]/50 text-[9.5px] font-bold tabular-nums"
                          dir="ltr"
                        >
                          {sizeLabel}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-xs sm:text-sm font-bold leading-snug line-clamp-2 text-[#064326] dark:text-[#d4af37] min-h-[2.25rem]">
                        {book.urduTitle}
                      </h2>
                      <div className="flex flex-wrap items-center gap-1 text-[9.5px] sm:text-[10.5px] opacity-75">
                        <span className="inline-flex items-center gap-0.5 truncate max-w-full">
                          <FileText className="w-3 h-3 text-[#d4af37] shrink-0" />
                          <span className="truncate">{book.collectionUrdu}</span>
                        </span>
                        {dateLabel && (
                          <span className="inline-flex items-center gap-0.5 tabular-nums shrink-0">
                            <Calendar className="w-2.5 h-2.5" />
                            {dateLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Clean 2-Row Action Buttons for 2-Column Mobile Grid: Read (full) + Download & WhatsApp Share */}
                  <div className="px-2 sm:px-2.5 pb-2.5 pt-2 border-t border-emerald-900/10 dark:border-[#d4af37]/20 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenReader(book)}
                      className="w-full h-8 px-2 rounded-xl bg-[#064326] hover:bg-[#095c34] text-white dark:bg-[#d4af37] dark:text-[#051a0f] flex items-center justify-center gap-1.5 text-[11px] font-bold whitespace-nowrap transition-all active:scale-95 cursor-pointer"
                      title="کتاب پڑھیں"
                    >
                      <Eye className="w-3.5 h-3.5 shrink-0" />
                      <span>پڑھیں</span>
                    </button>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => downloadSingleBook(book, onNotify)}
                        disabled={isDownloading}
                        className={`h-8 px-1.5 rounded-xl flex items-center justify-center gap-1 text-[10.5px] font-bold whitespace-nowrap transition-all active:scale-95 cursor-pointer disabled:opacity-60 ${
                          isDark
                            ? 'bg-white/10 hover:bg-emerald-600 text-white'
                            : 'bg-emerald-900/10 hover:bg-[#064326] text-[#064326] hover:text-white'
                        }`}
                        title={t.downloadLabel}
                      >
                        {isDownloading ? (
                          <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                        ) : (
                          <Download className="w-3 h-3 shrink-0" />
                        )}
                        <span>{isDownloading ? t.loadingLabel : t.downloadLabel}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => shareBookOnWhatsApp(book)}
                        className="h-8 px-1.5 rounded-xl bg-[#25D366] hover:bg-[#1faa4e] text-white flex items-center justify-center gap-1 text-[10.5px] font-bold whitespace-nowrap transition-all active:scale-95 cursor-pointer"
                        title={t.shareLabel}
                      >
                        <Share2 className="w-3 h-3 shrink-0" />
                        <span>{t.shareLabel}</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* In-App PDF Book Reader Modal */}
      {readingBook && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col"
          dir={dir}
        >
          <div
            className={`px-3 py-2.5 border-b-2 border-[#d4af37] flex items-center justify-between gap-2 shrink-0 ${
              isDark ? 'bg-[#071b10] text-white' : 'bg-[#064326] text-white'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <BookOpen className="w-4 h-4 text-[#d4af37] shrink-0" />
              <span className="font-bold text-xs sm:text-sm truncate">
                {readingBook.urduTitle}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => downloadSingleBook(readingBook, onNotify)}
                className="px-2.5 py-1.5 rounded-lg bg-[#d4af37] text-[#051a0f] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ڈاؤنلوڈ</span>
              </button>

              <button
                type="button"
                onClick={() => shareBookOnWhatsApp(readingBook)}
                className="px-2.5 py-1.5 rounded-lg bg-[#25D366] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>شیئر</span>
              </button>

              <button
                type="button"
                onClick={() => setReadingBook(null)}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white cursor-pointer"
                title={t.closeBtn}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative flex-1 bg-slate-900">
            {isReaderLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-emerald-100 pointer-events-none">
                <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
                <span className="text-xs font-bold">کتاب لوڈ ہو رہی ہے...</span>
              </div>
            )}
            <iframe
              src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
                readingBook.pdfUrl
              )}`}
              title={readingBook.urduTitle}
              onLoad={() => setIsReaderLoading(false)}
              className="w-full h-full border-none bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Newspaper,
  Download,
  Share2,
  RotateCw,
  Loader2,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  X,
  Maximize2,
  Calendar,
  Search,
} from 'lucide-react';
import {
  NewsPosterItem,
  isPosterNew,
  formatPosterDateUrdu,
  formatBookSize,
  sharePosterOnWhatsApp,
  normalizeSearchText,
} from '../utils/archiveService';
import {
  downloadSinglePoster,
  subscribeToDownloads,
} from '../utils/downloadHelper';
import {
  AppLanguage,
  DEFAULT_LANGUAGE,
  UI_STRINGS,
  getDir,
} from '../data/translations';

interface Props {
  posters: NewsPosterItem[];
  isSyncing: boolean;
  onRefreshPosters: () => void;
  onGoHome: () => void;
  onNotify: (msg: string) => void;
  isDark: boolean;
  lang?: AppLanguage;
}

export const NewsUpdatesView: React.FC<Props> = ({
  posters,
  isSyncing,
  onRefreshPosters,
  onGoHome,
  onNotify,
  isDark,
  lang = DEFAULT_LANGUAGE,
}) => {
  const t = UI_STRINGS[lang];
  const dir = getDir(lang);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenPoster, setFullscreenPoster] = useState<NewsPosterItem | null>(null);
  const [activeDownloadIds, setActiveDownloadIds] = useState<Set<string>>(new Set());
  const pauseAutoUntilRef = useRef(0);
  const touchStartXRef = useRef(0);

  useEffect(() => {
    const unsub = subscribeToDownloads((ids) => setActiveDownloadIds(ids));
    return unsub;
  }, []);

  const filteredPosters = useMemo(() => {
    const q = normalizeSearchText(searchQuery);
    if (!q) return posters;
    return posters.filter((p) =>
      normalizeSearchText(`${p.title} ${p.filename}`).includes(q)
    );
  }, [posters, searchQuery]);

  useEffect(() => {
    setActiveIndex(0);
  }, [filteredPosters.length]);

  // Auto slide featured poster every 8 seconds unless fullscreen is open
  useEffect(() => {
    if (filteredPosters.length <= 1 || fullscreenPoster) return;
    const timer = window.setInterval(() => {
      if (Date.now() < pauseAutoUntilRef.current) return;
      setActiveIndex((prev) => (prev + 1) % filteredPosters.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [filteredPosters.length, fullscreenPoster]);

  const currentPoster = filteredPosters[activeIndex] || null;

  const handleNext = () => {
    if (!filteredPosters.length) return;
    pauseAutoUntilRef.current = Date.now() + 10000;
    setActiveIndex((prev) => (prev + 1) % filteredPosters.length);
  };

  const handlePrev = () => {
    if (!filteredPosters.length) return;
    pauseAutoUntilRef.current = Date.now() + 10000;
    setActiveIndex((prev) => (prev - 1 + filteredPosters.length) % filteredPosters.length);
  };

  return (
    <div
      className="kdf-app-canvas flex-1 w-full h-full overflow-y-auto transition-colors duration-200"
      dir={dir}
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-5 py-4 space-y-4">
        {/* Emerald & Gold Header Card */}
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
                <Newspaper className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm sm:text-lg font-bold text-white truncate">
                    اشتہارات و تازہ اعلانات
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-white/15 border border-[#d4af37] text-[#fff7b2] text-[10.5px] font-bold tabular-nums">
                    {posters.length} اشتہارات
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100/85">
                  آرکائیو سے خودکار اپڈیٹ — ہر اشتہار دیکھیں، ڈاؤنلوڈ اور واٹس ایپ شیئر کریں
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onRefreshPosters}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#d4af37] to-[#a67c2e] hover:brightness-110 text-white border border-white/40 text-xs font-bold shadow-xs cursor-pointer disabled:opacity-60 transition-all active:scale-95"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'تازہ ہو رہا ہے...' : t.refreshBtn}</span>
            </button>
          </div>

          <div className="p-3 sm:p-4">
            <div className="relative">
              <Search className="w-4 h-4 text-[#b08d43] absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="اشتہار یا اعلان تلاش کریں..."
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
          </div>
        </section>

        {/* Featured Interactive Poster Slider */}
        {currentPoster && (
          <section
            className={`rounded-3xl border-2 border-[#d4af37]/75 overflow-hidden shadow-lg max-w-xl mx-auto ${
              isDark ? 'bg-[#0a1d13] text-emerald-50' : 'bg-[#fffdf8] text-[#11261b]'
            }`}
          >
            <div className="px-4 py-2 bg-[#064326] text-white border-b border-[#d4af37] flex items-center justify-between gap-2 text-xs font-bold">
              <span className="truncate">{currentPoster.title}</span>
              <span className="px-2 py-0.5 rounded-full bg-black/30 text-[#ffd700] border border-[#d4af37]/60 text-[11px] tabular-nums shrink-0" dir="ltr">
                {activeIndex + 1} / {filteredPosters.length}
              </span>
            </div>

            <div
              className="relative h-80 sm:h-96 bg-black/5 dark:bg-black/30 flex items-center justify-center overflow-hidden select-none"
              onTouchStart={(e) => {
                touchStartXRef.current = e.touches[0].clientX;
              }}
              onTouchEnd={(e) => {
                const endX = e.changedTouches[0].clientX;
                if (touchStartXRef.current - endX > 45) handleNext();
                if (endX - touchStartXRef.current > 45) handlePrev();
              }}
            >
              <img
                src={currentPoster.imageUrl}
                alt={currentPoster.title}
                onClick={() => setFullscreenPoster(currentPoster)}
                decoding="async"
                className="w-full h-full object-contain p-2 cursor-zoom-in transition-opacity duration-300"
              />

              {isPosterNew(currentPoster) && (
                <span className="khanqah-new-neon-badge absolute top-3 start-3 px-2 py-0.5 rounded-md text-[10px] font-extrabold">
                  {t.newBadge}
                </span>
              )}

              <button
                type="button"
                onClick={() => setFullscreenPoster(currentPoster)}
                className="absolute top-3 end-3 w-8 h-8 rounded-full bg-black/60 hover:bg-[#d4af37] text-white flex items-center justify-center cursor-pointer transition-colors"
                title="مکمل اسکرین میں دیکھیں"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {filteredPosters.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute start-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/55 hover:bg-[#d4af37] text-white border border-white/40 flex items-center justify-center cursor-pointer transition-colors"
                    aria-label="پچھلا اشتہار"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute end-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/55 hover:bg-[#d4af37] text-white border border-white/40 flex items-center justify-center cursor-pointer transition-colors"
                    aria-label="اگلا اشتہار"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Pagination Dots */}
            {filteredPosters.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 py-2">
                {filteredPosters.map((p, idx) => (
                  <button
                    key={`dot-${p.id}`}
                    type="button"
                    onClick={() => {
                      pauseAutoUntilRef.current = Date.now() + 10000;
                      setActiveIndex(idx);
                    }}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === activeIndex
                        ? 'w-5 bg-[#d4af37]'
                        : 'w-2 bg-gray-400/60 hover:bg-[#d4af37]/70'
                    }`}
                    aria-label={p.title}
                  />
                ))}
              </div>
            )}

            {/* Slider Quick Action Buttons */}
            <div className="px-3 pb-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => downloadSinglePoster(currentPoster, onNotify)}
                disabled={activeDownloadIds.has(currentPoster.id)}
                className="h-9 px-3 rounded-xl bg-gradient-to-r from-[#005c00] to-[#008200] hover:brightness-110 text-white border border-[#d4af37] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {activeDownloadIds.has(currentPoster.id) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>ڈاؤنلوڈ</span>
              </button>

              <button
                type="button"
                onClick={() => sharePosterOnWhatsApp(currentPoster)}
                className="h-9 px-3 rounded-xl bg-gradient-to-r from-[#25d366] to-[#128c7e] hover:brightness-105 text-white border border-[#0e6f63] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>واٹس ایپ شیئر</span>
              </button>
            </div>
          </section>
        )}

        {/* 2-Column Mobile / Multi-Column Desktop Gallery Grid of All Archive Posters */}
        {filteredPosters.length === 0 ? (
          <div
            className={`rounded-3xl border border-[#d4af37]/40 p-8 text-center space-y-2 ${
              isDark ? 'bg-[#0b1f14] text-emerald-100' : 'bg-white text-[#11261b]'
            }`}
          >
            <Newspaper className="w-10 h-10 mx-auto text-[#d4af37] opacity-80" />
            <p className="font-bold text-sm">کوئی اشتہار نہیں ملا</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5 pb-6">
            {filteredPosters.map((poster, idx) => {
              const isDownloading = activeDownloadIds.has(poster.id);
              const isNew = isPosterNew(poster);
              const dateLabel = formatPosterDateUrdu(poster);
              const sizeLabel = formatBookSize(poster.size);

              return (
                <article
                  key={poster.id}
                  className={`rounded-2xl border-2 overflow-hidden flex flex-col justify-between transition-all shadow-sm hover:shadow-md ${
                    idx === activeIndex
                      ? 'border-[#d4af37] ring-1 ring-[#d4af37]/50'
                      : isDark
                      ? 'border-[#d4af37]/35'
                      : 'border-[#d4c4a8]'
                  } ${
                    isDark
                      ? 'bg-[#0c2216] text-emerald-50'
                      : 'bg-gradient-to-b from-[#fffdf8] to-[#f7efdc] text-[#11261b]'
                  }`}
                >
                  <div className="p-2 space-y-2">
                    <div
                      onClick={() => setFullscreenPoster(poster)}
                      className="relative aspect-[3/4] w-full rounded-xl overflow-hidden border border-[#d4af37]/50 cursor-zoom-in bg-[#042414]/90"
                    >
                      <img
                        src={poster.imageUrl}
                        alt={poster.title}
                        className="w-full h-full object-contain p-1 hover:scale-[1.03] transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                      />
                      {isNew && (
                        <span className="khanqah-new-neon-badge absolute top-1.5 start-1.5 px-1.5 py-0.5 rounded text-[9px] font-extrabold">
                          {t.newBadge}
                        </span>
                      )}
                      {sizeLabel && (
                        <span
                          className="absolute bottom-1.5 end-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[#00ff99] border border-[#d4af37]/50 text-[9px] font-bold tabular-nums"
                          dir="ltr"
                        >
                          {sizeLabel}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-xs sm:text-sm font-bold leading-snug line-clamp-2 text-[#004d00] dark:text-[#d4af37] min-h-[2.2rem]">
                        {poster.title}
                      </h2>
                      {dateLabel && (
                        <div className="flex items-center gap-1 text-[10px] opacity-75 tabular-nums">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{dateLabel}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-2 pb-2 pt-1.5 border-t border-emerald-900/10 dark:border-[#d4af37]/20 grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => downloadSinglePoster(poster, onNotify)}
                      disabled={isDownloading}
                      className="h-8 px-1.5 rounded-xl bg-gradient-to-r from-[#005c00] to-[#008200] hover:brightness-110 text-white border border-[#d4af37] text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
                    >
                      {isDownloading ? (
                        <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                      ) : (
                        <Download className="w-3 h-3 shrink-0" />
                      )}
                      <span>ڈاؤنلوڈ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => sharePosterOnWhatsApp(poster)}
                      className="h-8 px-1.5 rounded-xl bg-gradient-to-r from-[#25d366] to-[#128c7e] hover:brightness-105 text-white border border-[#0e6f63] text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Share2 className="w-3 h-3 shrink-0" />
                      <span>شیئر</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Fullscreen Poster Lightbox */}
      {fullscreenPoster && (
        <div
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-xs flex flex-col p-3"
          dir={dir}
        >
          <div className="flex items-center justify-between gap-2 pb-2 text-white">
            <h3 className="text-xs sm:text-sm font-bold text-[#ffd700] truncate">
              {fullscreenPoster.title}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => downloadSinglePoster(fullscreenPoster, onNotify)}
                className="px-2.5 py-1.5 rounded-lg bg-[#007300] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ڈاؤنلوڈ</span>
              </button>
              <button
                type="button"
                onClick={() => sharePosterOnWhatsApp(fullscreenPoster)}
                className="px-2.5 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>شیئر</span>
              </button>
              <button
                type="button"
                onClick={() => setFullscreenPoster(null)}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white cursor-pointer"
                title={t.closeBtn}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            className="flex-1 flex items-center justify-center overflow-hidden"
            onClick={() => setFullscreenPoster(null)}
          >
            <img
              src={fullscreenPoster.imageUrl}
              alt={fullscreenPoster.title}
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

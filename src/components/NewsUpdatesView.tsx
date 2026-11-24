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
  LayoutGrid,
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
  const [showAllGrid, setShowAllGrid] = useState(false);
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

  // Auto slide featured poster every 6.5 seconds when in slider view
  useEffect(() => {
    if (filteredPosters.length <= 1 || fullscreenPoster || showAllGrid) return;
    const timer = window.setInterval(() => {
      if (Date.now() < pauseAutoUntilRef.current) return;
      setActiveIndex((prev) => (prev + 1) % filteredPosters.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [filteredPosters.length, fullscreenPoster, showAllGrid]);

  // Mobile Back button steps smoothly: Fullscreen -> All Grid -> Slider -> Home
  useEffect(() => {
    if (!fullscreenPoster && !showAllGrid) return;
    const handleBackIntercept = (e: Event) => {
      e.preventDefault();
      if (fullscreenPoster) {
        setFullscreenPoster(null);
      } else if (showAllGrid) {
        setShowAllGrid(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('kdf-back-intercept', handleBackIntercept);
    return () => window.removeEventListener('kdf-back-intercept', handleBackIntercept);
  }, [fullscreenPoster, showAllGrid]);

  const currentPoster = filteredPosters[activeIndex] || posters[0] || null;

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

  const handleFullscreenNext = () => {
    if (!fullscreenPoster || filteredPosters.length <= 1) return;
    const idx = filteredPosters.findIndex((p) => p.id === fullscreenPoster.id);
    const nextIdx = (idx >= 0 ? idx + 1 : 0) % filteredPosters.length;
    setFullscreenPoster(filteredPosters[nextIdx]);
    setActiveIndex(nextIdx);
  };

  const handleFullscreenPrev = () => {
    if (!fullscreenPoster || filteredPosters.length <= 1) return;
    const idx = filteredPosters.findIndex((p) => p.id === fullscreenPoster.id);
    const prevIdx = ((idx >= 0 ? idx : 0) - 1 + filteredPosters.length) % filteredPosters.length;
    setFullscreenPoster(filteredPosters[prevIdx]);
    setActiveIndex(prevIdx);
  };

  return (
    <div
      className="kdf-app-canvas flex-1 w-full h-full overflow-y-auto transition-colors duration-200"
      dir={dir}
    >
      <div className="max-w-4xl mx-auto px-3 sm:px-5 py-3 space-y-3 pb-8">
        {/* Clean Header Strip: اشتہارات اور اعلانات + تازہ کریں بٹن سائیڈ میں */}
        <section className="relative rounded-2xl p-[2px] bg-gradient-to-r from-[#d4af37] via-[#f7e7a9] to-[#b08d43] shadow-md">
          <div className="rounded-[14px] bg-gradient-to-l from-[#004d00] via-[#007300] to-[#004d00] text-white px-3.5 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={showAllGrid ? () => setShowAllGrid(false) : onGoHome}
                className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 border border-[#d4af37]/70 text-[#ffd700] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                title={showAllGrid ? 'واپس سلائیڈر پر جائیں' : t.drawerItemHome}
              >
                <ArrowRight className={`w-4 h-4 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
              </button>

              <div className="w-9 h-9 rounded-xl bg-white/15 border border-[#d4af37] text-[#ffd700] flex items-center justify-center shrink-0">
                <Newspaper className="w-4.5 h-4.5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm sm:text-base font-extrabold text-white truncate">
                    اشتہارات اور اعلانات
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-black/25 border border-[#d4af37]/80 text-[#fff7b2] text-[10.5px] font-bold tabular-nums">
                    {posters.length}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onRefreshPosters}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#d4af37] to-[#b08d43] hover:brightness-110 text-[#051a0f] border border-[#fff7b2]/60 text-xs font-extrabold shadow-xs cursor-pointer disabled:opacity-60 transition-all active:scale-95 shrink-0"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'تازہ ہو رہا...' : 'تازہ کریں'}</span>
            </button>
          </div>
        </section>

        {/* MODE 1: Full-Width Clean Sliding Showcase (Default) */}
        {!showAllGrid && currentPoster && (
          <section
            className={`rounded-3xl border-2 border-[#d4af37]/85 overflow-hidden shadow-xl ${
              isDark ? 'bg-[#0a1d13] text-emerald-50' : 'bg-[#fffdf8] text-[#11261b]'
            }`}
          >
            {/* Title + Slide Index Strip */}
            <div className="px-3.5 py-2 bg-[#064326] text-white border-b border-[#d4af37]/80 flex items-center justify-between gap-2 text-xs font-bold">
              <span className="truncate">{currentPoster.title}</span>
              <span
                className="px-2.5 py-0.5 rounded-full bg-black/35 text-[#ffd700] border border-[#d4af37]/70 text-[11px] tabular-nums shrink-0"
                dir="ltr"
              >
                {activeIndex + 1} / {filteredPosters.length}
              </span>
            </div>

            {/* Full Prominent Sliding Poster Image */}
            <div
              className="relative w-full h-[54vh] min-h-[340px] max-h-[560px] bg-gradient-to-b from-[#041d10] via-[#062b18] to-[#041d10] flex items-center justify-center overflow-hidden select-none"
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
                className="w-full h-full object-contain p-2 sm:p-3 cursor-zoom-in transition-opacity duration-300"
              />

              {isPosterNew(currentPoster) && (
                <span className="khanqah-new-neon-badge absolute top-3 start-3 px-2.5 py-0.5 rounded-md text-[10.5px] font-extrabold">
                  {t.newBadge}
                </span>
              )}

              <button
                type="button"
                onClick={() => setFullscreenPoster(currentPoster)}
                className="absolute top-3 end-3 px-2.5 py-1.5 rounded-xl bg-black/65 hover:bg-[#d4af37] text-white hover:text-[#051a0f] border border-[#d4af37]/70 flex items-center gap-1 text-[10.5px] font-bold cursor-pointer transition-colors"
                title="فل اسکرین دیکھیں"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>فل اسکرین</span>
              </button>

              {filteredPosters.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute start-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-[#d4af37] text-white hover:text-[#051a0f] border border-[#d4af37]/70 flex items-center justify-center cursor-pointer transition-colors shadow-md"
                    aria-label="پچھلا اشتہار"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute end-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-[#d4af37] text-white hover:text-[#051a0f] border border-[#d4af37]/70 flex items-center justify-center cursor-pointer transition-colors shadow-md"
                    aria-label="اگلا اشتہار"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Pagination Dots */}
            {filteredPosters.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 py-2 border-t border-[#d4af37]/20">
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

            {/* ONE Single Line of 3 Action Buttons: Download · Share · View+All */}
            <div className="px-2.5 pb-3 pt-1.5 grid grid-cols-3 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => downloadSinglePoster(currentPoster, onNotify)}
                disabled={activeDownloadIds.has(currentPoster.id)}
                className="h-10 px-2 rounded-xl bg-gradient-to-r from-[#005c00] to-[#008200] hover:brightness-110 text-white border border-[#d4af37] text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60 active:scale-95 transition-all whitespace-nowrap"
              >
                {activeDownloadIds.has(currentPoster.id) ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                ) : (
                  <Download className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>ڈاؤنلوڈ</span>
              </button>

              <button
                type="button"
                onClick={() => sharePosterOnWhatsApp(currentPoster)}
                className="h-10 px-2 rounded-xl bg-gradient-to-r from-[#25d366] to-[#128c7e] hover:brightness-105 text-white border border-[#0e6f63] text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all whitespace-nowrap"
              >
                <Share2 className="w-3.5 h-3.5 shrink-0" />
                <span>شیئر</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAllGrid(true)}
                className="h-10 px-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b08d43] hover:brightness-105 text-[#051a0f] border border-[#f7e7a9] text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all whitespace-nowrap shadow-xs"
              >
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                <span>تمام اشتہارات +</span>
              </button>
            </div>
          </section>
        )}

        {/* Empty State if zero posters */}
        {!currentPoster && (
          <div
            className={`rounded-3xl border border-[#d4af37]/40 p-8 text-center space-y-2 ${
              isDark ? 'bg-[#0b1f14] text-emerald-100' : 'bg-white text-[#11261b]'
            }`}
          >
            <Newspaper className="w-10 h-10 mx-auto text-[#d4af37] opacity-80" />
            <p className="font-bold text-sm">اس وقت کوئی اشتہار دستیاب نہیں</p>
          </div>
        )}

        {/* MODE 2: View+All 2-Column Folder Gallery (یک لائن میں دو اشتہارات) */}
        {showAllGrid && (
          <div className="space-y-3">
            {/* Search & Back-to-Slider Bar inside View All Folder */}
            <div
              className={`rounded-2xl border border-[#d4af37]/60 p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 ${
                isDark ? 'bg-[#0b1f14]' : 'bg-white'
              }`}
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#b08d43] absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="اشتہار یا اعلان تلاش کریں..."
                  className={`w-full ps-9 pe-8 py-1.5 rounded-full border text-xs outline-none transition-colors ${
                    isDark
                      ? 'bg-[#07150d] border-[#d4af37]/40 text-emerald-50 placeholder-emerald-200/45 focus:border-[#d4af37]'
                      : 'bg-[#fffdf8] border-[#c9b382] text-[#004d00] placeholder-emerald-900/45 focus:border-[#006400]'
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute top-1/2 -translate-y-1/2 end-2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAllGrid(false);
                  setSearchQuery('');
                }}
                className="px-3 py-1.5 rounded-xl bg-[#064326] hover:bg-[#095c34] text-white border border-[#d4af37]/70 text-xs font-bold cursor-pointer shrink-0"
              >
                سلائیڈر ویو پر واپس جائیں
              </button>
            </div>

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
              /* Strictly 2 Posters Per Row (ایک لائن میں دو اشتہارات) */
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
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
                          ? 'border-[#d4af37]/40'
                          : 'border-[#d4c4a8]'
                      } ${
                        isDark
                          ? 'bg-[#0c2216] text-emerald-50'
                          : 'bg-gradient-to-b from-[#fffdf8] to-[#f7efdc] text-[#11261b]'
                      }`}
                    >
                      <div className="p-2 space-y-1.5">
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

                        <div className="space-y-0.5">
                          <h2 className="text-xs sm:text-sm font-bold leading-snug line-clamp-2 text-[#004d00] dark:text-[#d4af37] min-h-[2.1rem]">
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

                      {/* Download & Share in One Single Row per Card */}
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
        )}
      </div>

      {/* Fullscreen Poster Lightbox */}
      {fullscreenPoster && (
        <div
          className="fixed inset-0 z-50 bg-black/94 backdrop-blur-xs flex flex-col p-3"
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
            className="relative flex-1 flex items-center justify-center overflow-hidden"
            onClick={() => setFullscreenPoster(null)}
          >
            <img
              src={fullscreenPoster.imageUrl}
              alt={fullscreenPoster.title}
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-full object-contain rounded-lg"
            />

            {filteredPosters.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFullscreenPrev();
                  }}
                  className="absolute start-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/65 hover:bg-[#d4af37] text-white hover:text-[#051a0f] border border-[#d4af37]/70 flex items-center justify-center cursor-pointer transition-colors"
                  aria-label="پچھلا اشتہار"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFullscreenNext();
                  }}
                  className="absolute end-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/65 hover:bg-[#d4af37] text-white hover:text-[#051a0f] border border-[#d4af37]/70 flex items-center justify-center cursor-pointer transition-colors"
                  aria-label="اگلا اشتہار"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo, useEffect } from 'react';
import {
  Play,
  Download,
  Loader2,
  Search,
  Filter,
  Folder,
  FolderDown,
  CheckCircle2,
  Headphones,
  Clock,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  MessageCircle,
  Youtube,
  Facebook,
  Smartphone,
  Share2,
  ExternalLink,
  GraduationCap,
  Users,
  Landmark,
  Copy,
  Check,
  FileCode2,
} from 'lucide-react';
import { BAYANAT_DATABASE, BayanItem } from '../data/bayanatData';
import {
  downloadSingleBayan,
  downloadFolderBayanat,
  subscribeToDownloads,
} from '../utils/downloadHelper';
import {
  OFFICIAL_WHATSAPP_LINKS,
  OFFICIAL_APK_URL,
  SHEIKH_GLASS_BANNER_URL,
  WHATSAPP_DIRECT_CHAT_URL,
} from '../data/appConfig';
import {
  shareBayanOnWhatsApp,
  isBayanNew,
  formatBayanDateUrdu,
  formatBookSize,
  normalizeSearchText,
} from '../utils/archiveService';
import {
  downloadFolderHtmlFile,
  downloadCombinedAllFoldersHtml,
} from '../utils/folderHtmlGenerator';
import {
  AppLanguage,
  DEFAULT_LANGUAGE,
  UI_STRINGS,
  getDir,
} from '../data/translations';

interface Props {
  onPlayAudio: (bayan: BayanItem) => void;
  onNotify: (message: string) => void;
  onNavigateUrl?: (url: string) => void;
  onSwitchToWebView?: () => void;
  isDark: boolean;
  currentPlayingBayanId?: string | null;
  bayanatList?: BayanItem[];
  initialFolderId?: string;
  lang?: AppLanguage;
}

export interface FolderInfo {
  id: string;
  title: string;
  urdu: string;
  category: string;
  count: number;
  items: BayanItem[];
}

interface FolderCardProps {
  folder: FolderInfo;
  isSingleFocus: boolean;
  globalSearchQuery: string;
  isDark: boolean;
  currentPlayingBayanId?: string | null;
  activeDownloadIds: Set<string>;
  downloadingFolderId: string | null;
  folderProgress: { current: number; total: number; title: string } | null;
  onPlayAudio: (bayan: BayanItem) => void;
  onDownloadSingle: (e: React.MouseEvent, bayan: BayanItem) => void;
  onDownloadFolder: (folder: FolderInfo) => void;
  onNotify: (msg: string) => void;
  t: (typeof UI_STRINGS)[AppLanguage];
}

const FolderEmeraldGoldBox: React.FC<FolderCardProps> = ({
  folder,
  isSingleFocus,
  globalSearchQuery,
  isDark,
  currentPlayingBayanId,
  activeDownloadIds,
  downloadingFolderId,
  folderProgress,
  onPlayAudio,
  onDownloadSingle,
  onDownloadFolder,
  onNotify,
  t,
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isExpanded, setIsExpanded] = useState(true);

  const itemsPerPage = isSingleFocus ? 20 : 5;

  const filteredItems = useMemo(() => {
    const qLocal = normalizeSearchText(localSearch);
    const qGlobal = normalizeSearchText(globalSearchQuery);
    return folder.items.filter((b) => {
      const hay = normalizeSearchText(
        `${b.urduTitle} ${b.title} ${b.filename} ${b.collectionUrdu}`
      );
      if (qGlobal && !hay.includes(qGlobal)) return false;
      if (qLocal && !hay.includes(qLocal)) return false;
      return true;
    });
  }, [folder.items, localSearch, globalSearchQuery]);

  useEffect(() => {
    setPage(1);
  }, [localSearch, globalSearchQuery, folder.id]);

  // Auto-open if user searches or if this folder has the currently playing bayan
  const hasPlayingHere = useMemo(
    () => folder.items.some((b) => b.id === currentPlayingBayanId),
    [folder.items, currentPlayingBayanId]
  );

  useEffect(() => {
    if (isSingleFocus || hasPlayingHere || localSearch.trim() || globalSearchQuery.trim()) {
      setIsExpanded(true);
    }
  }, [isSingleFocus, hasPlayingHere, localSearch, globalSearchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredItems.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  );
  const startIndex = (safePage - 1) * itemsPerPage;

  if (globalSearchQuery.trim() && filteredItems.length === 0) {
    return null;
  }

  return (
    <section
      className={`rounded-2xl border-2 overflow-hidden shadow-md transition-all ${
        isDark
          ? 'bg-[#081b11] border-[#d4af37]/50 text-emerald-50'
          : 'bg-[#fdfaf3] border-[#d4af37]/70 text-[#11261b]'
      }`}
    >
      {/* Signature Emerald-Green & Gold Gradient Folder Header (telawat-Hamd-naat.html style) */}
      <div className="bg-gradient-to-l from-[#004d00] via-[#007300] to-[#004d00] text-white px-3 sm:px-4 py-2.5 border-b-[3px] border-[#d4af37] flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-2 min-w-0 flex-1 text-right cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-white/15 border border-[#d4af37]/70 text-[#ffd700] flex items-center justify-center shrink-0">
            <Folder className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xs sm:text-sm font-extrabold text-white leading-snug truncate">
                {folder.urdu}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-white/15 border border-[#d4af37] text-[#fff7b2] text-[10px] font-bold shrink-0 tabular-nums">
                {filteredItems.length} بیانات
              </span>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#ffd700] shrink-0 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Header Actions: Download Whole Folder + Export Standalone HTML */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onDownloadFolder(folder)}
            disabled={downloadingFolderId === folder.id}
            className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[#d4af37] to-[#a67c2e] hover:brightness-110 text-white border border-white/40 text-[10.5px] font-bold inline-flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-60 transition-all active:scale-95"
            title="پورا فولڈر ڈاؤنلوڈ کریں"
          >
            {downloadingFolderId === folder.id ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>
                  {folderProgress
                    ? `${folderProgress.current}/${folderProgress.total}`
                    : 'جاری...'}
                </span>
              </>
            ) : (
              <>
                <FolderDown className="w-3 h-3" />
                <span>مکمل فولڈر</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => downloadFolderHtmlFile(folder.id, folder.urdu, onNotify)}
            className="px-2 py-1 rounded-full bg-black/25 hover:bg-black/40 text-[#fff7b2] border border-[#d4af37]/60 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            title="اس فولڈر کی علیحدہ HTML فائل محفوظ کریں"
          >
            <FileCode2 className="w-3 h-3 text-[#ffd700]" />
            <span>HTML</span>
          </button>
        </div>
      </div>

      {/* Expandable Folder Body */}
      {isExpanded && (
        <div className="p-2.5 sm:p-3 space-y-2.5">
          {/* Per-Folder Rounded Gold Search Input */}
          {folder.items.length > 4 && (
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[#b08d43] absolute start-3 pointer-events-none" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder={`"${folder.urdu}" میں بیان تلاش کریں...`}
                className={`w-full ps-8 pe-3 py-1.5 rounded-full border text-xs outline-none transition-colors ${
                  isDark
                    ? 'bg-[#0c2417] border-[#d4af37]/40 text-emerald-50 placeholder-emerald-200/45 focus:border-[#d4af37]'
                    : 'bg-[#fffdf8] border-[#c9b382] text-[#004d00] placeholder-emerald-900/45 focus:border-[#006400]'
                }`}
              />
            </div>
          )}

          {/* Audio Items Inside This Folder (Cream-Gold Cards with Glowing Playing Animation) */}
          {pageItems.length === 0 ? (
            <div className="py-5 text-center text-xs opacity-75">
              اس تلاش کے مطابق کوئی بیان نہیں ملا
            </div>
          ) : (
            <div className="space-y-2">
              {pageItems.map((bayan, idx) => {
                const isPlayingThis = currentPlayingBayanId === bayan.id;
                const isDownloadingThis = activeDownloadIds.has(bayan.id);
                const itemNum = startIndex + idx + 1;
                const showNew = isBayanNew(bayan);
                const dateLabel = formatBayanDateUrdu(bayan);
                const sizeLabel = formatBookSize(bayan.size);

                return (
                  <div
                    key={`${folder.id}-${bayan.id}-${idx}`}
                    className={`p-2.5 sm:p-3 rounded-xl border transition-all duration-200 space-y-2 ${
                      isPlayingThis
                        ? isDark
                          ? 'khanqah-audio-playing-card bg-gradient-to-b from-[#113822] to-[#0a2315] border-[#ffd700]'
                          : 'khanqah-audio-playing-card bg-gradient-to-b from-[#fffff7] to-[#f5ebd2] border-[#ffd700]'
                        : isDark
                        ? 'bg-[#0e2619] border-[#d4af37]/30 hover:border-[#d4af37]'
                        : 'bg-gradient-to-b from-[#fffdf8] to-[#f7efdc] border-[#d4c4a8] hover:border-[#b08d43] shadow-2xs'
                    }`}
                  >
                    {/* Title Row with Circular Gold Number Badge + NEW + Playing EQ Bars */}
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onPlayAudio(bayan)}
                        className="flex items-start gap-2 min-w-0 flex-1 text-right cursor-pointer"
                      >
                        <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#d4af37] to-[#9e7728] text-white border border-[#006400] text-[10.5px] font-bold flex items-center justify-center shrink-0 shadow-2xs mt-0.5 tabular-nums">
                          {itemNum}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {showNew && (
                              <span className="khanqah-new-neon-badge px-1.5 py-0.5 rounded text-[9px] font-extrabold shrink-0 leading-none">
                                {t.newShortBadge}
                              </span>
                            )}
                            <h3
                              className={`text-xs sm:text-sm font-bold leading-snug ${
                                isPlayingThis
                                  ? 'text-[#006400] dark:text-[#ffd700]'
                                  : isDark
                                  ? 'text-emerald-50'
                                  : 'text-[#004d00]'
                              }`}
                            >
                              {bayan.urduTitle || bayan.title}
                            </h3>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] opacity-75">
                            {bayan.length && (
                              <span className="inline-flex items-center gap-0.5 tabular-nums">
                                <Clock className="w-2.5 h-2.5" />
                                {Math.max(1, Math.floor(parseFloat(bayan.length) / 60))}{' '}
                                {t.minuteUnit}
                              </span>
                            )}
                            {sizeLabel && (
                              <span className="tabular-nums" dir="ltr">
                                {sizeLabel}
                              </span>
                            )}
                            {dateLabel && (
                              <span className="tabular-nums">{dateLabel}</span>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Animated Equalizer Bars when Playing */}
                      {isPlayingThis && (
                        <span
                          className="inline-flex items-end gap-0.5 h-4 px-1.5 py-0.5 rounded-md bg-[#006400] border border-[#ffd700] shrink-0"
                          aria-label="چل رہا ہے"
                        >
                          <span className="khanqah-eq-bar" />
                          <span className="khanqah-eq-bar" />
                          <span className="khanqah-eq-bar" />
                        </span>
                      )}
                    </div>

                    {/* Action Row: Play + Instant Direct Download + WhatsApp Share */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => onPlayAudio(bayan)}
                        className={`h-8 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
                          isPlayingThis
                            ? 'bg-gradient-to-r from-[#d4af37] to-[#a67c2e] text-white shadow-xs'
                            : 'bg-[#064326] hover:bg-[#095c34] text-white border border-[#d4af37]/50'
                        }`}
                      >
                        <Play
                          className={`w-3 h-3 shrink-0 ${
                            isPlayingThis ? 'fill-white' : 'fill-current'
                          }`}
                        />
                        <span>{isPlayingThis ? t.playingLabel : t.playLabel}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => onDownloadSingle(e, bayan)}
                        disabled={isDownloadingThis}
                        className="h-8 px-2 rounded-lg bg-gradient-to-r from-[#005c00] to-[#008200] hover:brightness-110 text-white border border-[#d4af37] text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                      >
                        {isDownloadingThis ? (
                          <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                        ) : (
                          <Download className="w-3 h-3 shrink-0" />
                        )}
                        <span>
                          {isDownloadingThis ? t.loadingLabel : t.downloadLabel}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          shareBayanOnWhatsApp(bayan);
                        }}
                        className="h-8 px-2 rounded-lg bg-gradient-to-r from-[#25d366] to-[#128c7e] hover:brightness-105 text-white border border-[#0e6f63] text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                      >
                        <Share2 className="w-3 h-3 shrink-0" />
                        <span>{t.shareLabel}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Emerald-Gold Per-Folder Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-gradient-to-l from-[#004d00] to-[#006b00] border border-[#d4af37] text-white">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="px-3 py-1 rounded-full bg-gradient-to-r from-[#d4af37] to-[#a67c2e] text-white border border-white/40 text-[11px] font-bold inline-flex items-center gap-1 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                <span>پچھلا</span>
              </button>

              <span className="text-[11px] font-bold text-[#fff7b2] tabular-nums" dir="ltr">
                Page {safePage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="px-3 py-1 rounded-full bg-gradient-to-r from-[#d4af37] to-[#a67c2e] text-white border border-white/40 text-[11px] font-bold inline-flex items-center gap-1 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>اگلا</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export const AudioLibraryView: React.FC<Props> = ({
  onPlayAudio,
  onNotify,
  isDark,
  currentPlayingBayanId,
  bayanatList = BAYANAT_DATABASE,
  initialFolderId = 'all',
  lang = DEFAULT_LANGUAGE,
}) => {
  const t = UI_STRINGS[lang];
  const dir = getDir(lang);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>(initialFolderId);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    setSelectedFolderId(initialFolderId || 'all');
  }, [initialFolderId]);

  const [activeDownloadIds, setActiveDownloadIds] = useState<Set<string>>(new Set());
  const [downloadingFolderId, setDownloadingFolderId] = useState<string | null>(null);
  const [folderProgress, setFolderProgress] = useState<{
    current: number;
    total: number;
    title: string;
  } | null>(null);

  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [isWhatsappExpanded, setIsWhatsappExpanded] = useState(false);
  const [copiedWaId, setCopiedWaId] = useState<string | null>(null);

  const handleCopyWaLink = (url: string, id: string) => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiedWaId(id);
        setTimeout(() => setCopiedWaId(null), 2500);
      })
      .catch(() => {
        setCopiedWaId(id);
        setTimeout(() => setCopiedWaId(null), 2500);
      });
  };

  useEffect(() => {
    const unsubscribe = subscribeToDownloads((activeIds) => {
      setActiveDownloadIds(activeIds);
    });
    return unsubscribe;
  }, []);

  // Group bayanat cleanly by Archive.org collection folder
  const folderGroups = useMemo<FolderInfo[]>(() => {
    const map = new Map<string, FolderInfo>();
    for (const b of bayanatList) {
      if (!map.has(b.collectionId)) {
        map.set(b.collectionId, {
          id: b.collectionId,
          title: b.collectionTitle,
          urdu: b.collectionUrdu,
          category: b.category,
          count: 0,
          items: [],
        });
      }
      const group = map.get(b.collectionId)!;
      group.count++;
      group.items.push(b);
    }
    return Array.from(map.values());
  }, [bayanatList]);

  const displayedFolders = useMemo(() => {
    return folderGroups.filter((f) => {
      if (selectedFolderId !== 'all' && f.id !== selectedFolderId) return false;
      if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;
      return true;
    });
  }, [folderGroups, selectedFolderId, selectedCategory]);

  const handleDownloadSingle = async (e: React.MouseEvent, bayan: BayanItem) => {
    e.stopPropagation();
    await downloadSingleBayan(bayan, onNotify);
  };

  const handleDownloadFolder = async (folder: FolderInfo) => {
    if (downloadingFolderId) return;
    setDownloadingFolderId(folder.id);
    onNotify(`فولڈر ڈاؤنلوڈ شروع: ${folder.urdu} (${folder.items.length} بیانات)`);

    await downloadFolderBayanat(
      folder.urdu,
      folder.items,
      (current, total, title) => {
        setFolderProgress({ current, total, title });
      },
      () => {
        setDownloadingFolderId(null);
        setFolderProgress(null);
        onNotify(`فولڈر "${folder.urdu}" کے تمام بیانات کامیابی سے ڈاؤنلوڈ ہو گئے!`);
      }
    );
  };

  return (
    <div
      className="kdf-app-canvas flex-1 w-full h-full flex flex-col overflow-y-auto select-none transition-colors duration-200 font-modern"
      dir={dir}
    >
      {/* Top Hero Header & Search */}
      <div className="w-full max-w-4xl mx-auto px-3 pt-2.5 pb-1">
        <div
          className={`rounded-2xl border-2 transition-all overflow-hidden shadow-xl p-4 sm:p-5 text-center space-y-3 ${
            isDark
              ? 'bg-gradient-to-b from-[#2e1d12] via-[#24170d] to-[#1a1008] border-[#b08d43]/60 text-white'
              : 'bg-gradient-to-b from-[#3a281b] to-[#2b1c12] text-white border-[#b08d43]'
          }`}
        >
          <div className="space-y-1">
            <h2 className="text-xs sm:text-sm font-bold tracking-wider text-amber-100 font-sans uppercase leading-tight">
              SHEIKH-UL-HADEES HAZRAT MAULANA PEER
              <br />
              MUHAMMAD JAMSHAID NAQSHBANDI (D.B)
            </h2>
            <h3 className="text-base sm:text-xl font-extrabold tracking-wide text-[#d4af37] font-sans uppercase pt-0.5">
              KHANQAH DAR-UL-FALAH DIGITAL LIBRARY
            </h3>
          </div>

          {/* Social Icons Row */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <a
              href="https://whatsapp.com/channel/0029VaHFtAKDDmFU33nD360K"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform"
              title="واٹس ایپ چینل"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=100068373408345"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform"
              title="فیس بک پیج"
            >
              <Facebook className="w-4 h-4 fill-white" />
            </a>
            <a
              href="https://youtube.com/@peermolanamuhammadjamshedn1391"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform"
              title="یوٹیوب چینل"
            >
              <Youtube className="w-4 h-4 fill-white" />
            </a>
            <a
              href={OFFICIAL_APK_URL}
              download="khanqah-Darul-falah.apk"
              className="inline-flex items-center gap-1.5 bg-[#422c1d] border border-[#d4af37]/70 hover:bg-[#523825] text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md active:scale-95 transition-all"
              title="اینڈرائڈ ایپ ڈاؤنلوڈ کریں"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-sans font-bold">App (APK)</span>
            </a>
          </div>

          <div className="border-t border-[#b08d43]/30 my-1" />

          {/* WHATSAPP GROUPS Dropdown */}
          <div className="space-y-2">
            <button
              onClick={() => setIsWhatsappExpanded(!isWhatsappExpanded)}
              className="inline-flex items-center justify-center gap-2 text-sm font-bold text-[#25D366] hover:text-[#20ba5a] active:scale-95 transition-all cursor-pointer py-1"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isWhatsappExpanded ? 'rotate-180' : ''
                }`}
              />
              <span className="font-sans tracking-wide">WHATSAPP GROUPS</span>
              <MessageCircle className="w-4 h-4 fill-[#25D366]" />
            </button>

            {isWhatsappExpanded && (
              <div className="bg-black/40 border border-[#b08d43]/50 rounded-xl p-3 text-right space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs text-amber-300 border-b border-[#b08d43]/30 pb-1.5">
                  <span className="font-bold font-lalezar">
                    حضرت اقدس کے آفیشل واٹس ایپ گروپس
                  </span>
                  <button
                    onClick={() => setIsWhatsappModalOpen(true)}
                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>مکمل ونڈو میں دیکھیں</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                  {OFFICIAL_WHATSAPP_LINKS.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-lg bg-[#27180e] border border-[#b08d43]/30 flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <p className="font-bold text-amber-100 font-lalezar truncate text-[13px]">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-gray-400 font-sans truncate" dir="ltr">
                          {item.subTitle}
                        </p>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-[#25D366] hover:bg-[#1faa4e] text-white text-[11px] font-bold rounded flex items-center gap-1 shadow-xs transition-all active:scale-95 shrink-0"
                      >
                        <span>جوائن</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="mt-2.5 flex items-stretch rounded-xl overflow-hidden border-2 border-[#b08d43] shadow-md bg-white">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={`flex-1 px-3.5 py-2.5 text-sm sm:text-base text-[#2c1f15] bg-white outline-none placeholder-gray-500 font-medium ${
              dir === 'ltr' ? 'text-left' : 'text-right'
            }`}
            dir={dir}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-2 text-xs text-amber-700 hover:text-amber-900 bg-amber-50 font-bold cursor-pointer"
            >
              {t.clearBtn}
            </button>
          )}
          <div className="bg-[#b08d43] text-white px-4 flex items-center justify-center">
            <Search className="w-5 h-5" />
          </div>
        </div>

        {/* 3 Prominent Category Cards */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <button
            onClick={() => {
              if (selectedCategory === 'Dars') {
                setSelectedCategory('all');
                setSelectedFolderId('all');
              } else {
                setSelectedCategory('Dars');
                setSelectedFolderId('all');
              }
            }}
            className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
              selectedCategory === 'Dars'
                ? 'border-[#0a5d38] bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600 font-bold'
                : isDark
                ? 'border-[#b08d43]/30 bg-[#24170d] text-emerald-400 hover:border-[#b08d43]'
                : 'border-gray-200 bg-white text-[#0a5d38] hover:border-emerald-400 hover:shadow-md'
            }`}
          >
            <Landmark className="w-7 h-7 sm:w-8 sm:h-8 text-[#0a5d38] dark:text-emerald-400" />
            <span className="text-[10px] sm:text-xs font-bold leading-tight uppercase font-sans">
              DARS-E-QURAN DARULHUDA
            </span>
          </button>

          <button
            onClick={() => {
              if (selectedFolderId === '20260205_20260205_1013') {
                setSelectedFolderId('all');
              } else {
                setSelectedFolderId('20260205_20260205_1013');
                setSelectedCategory('all');
              }
            }}
            className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
              selectedFolderId === '20260205_20260205_1013'
                ? 'border-[#0a5d38] bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600 font-bold'
                : isDark
                ? 'border-[#b08d43]/30 bg-[#24170d] text-emerald-400 hover:border-[#b08d43]'
                : 'border-gray-200 bg-white text-[#0a5d38] hover:border-emerald-400 hover:shadow-md'
            }`}
          >
            <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-[#0a5d38] dark:text-emerald-400" />
            <span className="text-[10px] sm:text-xs font-bold leading-tight uppercase font-sans">
              DASTAR-E-FAZILAT 2026
            </span>
          </button>

          <button
            onClick={() => {
              if (selectedCategory === 'Islahi') {
                setSelectedCategory('all');
                setSelectedFolderId('all');
              } else {
                setSelectedCategory('Islahi');
                setSelectedFolderId('all');
              }
            }}
            className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
              selectedCategory === 'Islahi'
                ? 'border-[#0a5d38] bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600 font-bold'
                : isDark
                ? 'border-[#b08d43]/30 bg-[#24170d] text-emerald-400 hover:border-[#b08d43]'
                : 'border-gray-200 bg-white text-[#0a5d38] hover:border-emerald-400 hover:shadow-md'
            }`}
          >
            <Users className="w-7 h-7 sm:w-8 sm:h-8 text-[#0a5d38] dark:text-emerald-400" />
            <span className="text-[10px] sm:text-xs font-bold leading-tight uppercase font-sans">
              ISLAHI MAJALIS
            </span>
          </button>
        </div>

        {/* Glass Calligraphy Banner */}
        <div className="mt-3 rounded-2xl overflow-hidden border-2 border-[#b08d43] shadow-xl bg-white dark:bg-[#0c2317]">
          <img
            src={SHEIKH_GLASS_BANNER_URL}
            alt="پیر طریقت رہبر شریعت ولی کامل استاد العلماء حضرت شیخ پیر محمد جمشید نقشبندی مجددی صاحب دامت برکاتہم العالیہ"
            className="w-full h-auto object-cover block"
            loading="eager"
          />
        </div>
      </div>

      {/* Folder Filter Strip (All Folders vs Specific Folder) */}
      <div className="w-full max-w-4xl mx-auto px-3 pt-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold no-scrollbar">
          <span className="text-[#b08d43] text-xs shrink-0 flex items-center gap-1 pl-1">
            <Filter className="w-3.5 h-3.5" />
            فولڈرز:
          </span>

          <button
            type="button"
            onClick={() => {
              setSelectedFolderId('all');
              setSelectedCategory('all');
            }}
            className={`px-3 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer ${
              selectedFolderId === 'all' && selectedCategory === 'all'
                ? 'bg-[#064326] text-white border border-[#d4af37] shadow-xs font-bold'
                : isDark
                ? 'bg-[#0e2217] text-amber-200 border border-[#d4af37]/30'
                : 'bg-white text-[#064326] border border-[#d4af37]/40'
            }`}
          >
            تمام فولڈرز ({folderGroups.length})
          </button>

          {folderGroups.map((fg) => (
            <button
              key={`pill-${fg.id}`}
              type="button"
              onClick={() => {
                setSelectedFolderId(fg.id);
                setSelectedCategory('all');
              }}
              className={`px-3 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer ${
                selectedFolderId === fg.id
                  ? 'bg-[#064326] text-white border border-[#d4af37] shadow-xs font-bold'
                  : isDark
                  ? 'bg-[#0e2217] text-amber-200 border border-[#d4af37]/30'
                  : 'bg-white text-[#064326] border border-[#d4af37]/40'
              }`}
            >
              {fg.urdu} ({fg.count})
            </button>
          ))}
        </div>
      </div>

      {/* Info Banner + Download All-Folders Combined HTML Button */}
      <div className="w-full max-w-4xl mx-auto px-3 pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-[#064326] dark:text-[#d4af37]">
            📂 کل فولڈرز: {displayedFolders.length} · مجموعی بیانات: {bayanatList.length}
          </span>
          <span className="text-emerald-600 dark:text-[#00ff99] flex items-center gap-1 font-medium opacity-85">
            <CheckCircle2 className="w-3.5 h-3.5" />
            رمضان المبارک HTML طرز پر ترتیب
          </span>
        </div>

        <button
          type="button"
          onClick={() =>
            downloadCombinedAllFoldersHtml(
              folderGroups.map((fg) => ({ archiveId: fg.id, title: fg.urdu })),
              onNotify
            )
          }
          className="px-3 py-1.5 rounded-xl bg-[#064326] hover:bg-[#095c34] text-white border border-[#d4af37] text-[10.5px] font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
          title="تمام فولڈرز کی یکجا HTML فائل ڈاؤنلوڈ کریں (GitHub / Blogger کے لیے)"
        >
          <FileCode2 className="w-3.5 h-3.5 text-[#ffd700]" />
          <span>تمام فولڈرز یکجا HTML ڈاؤنلوڈ</span>
        </button>
      </div>

      {/* Stacked Archive Folders (Each in Emerald-Green & Gold HTML Style) */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-3 space-y-4 pb-8">
        {displayedFolders.length === 0 ? (
          <div
            className={`p-10 text-center rounded-2xl border ${
              isDark ? 'bg-[#0b1f14] border-[#d4af37]/30' : 'bg-white border-[#d4af37]/30'
            }`}
          >
            <Headphones className="w-12 h-12 text-[#d4af37] mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold mb-1">کوئی فولڈر یا بیان نہیں ملا</h3>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedFolderId('all');
                setSelectedCategory('all');
              }}
              className="mt-2 px-4 py-2 bg-[#064326] text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              تمام فولڈرز دیکھیں
            </button>
          </div>
        ) : (
          displayedFolders.map((folder) => (
            <FolderEmeraldGoldBox
              key={folder.id}
              folder={folder}
              isSingleFocus={displayedFolders.length === 1}
              globalSearchQuery={searchQuery}
              isDark={isDark}
              currentPlayingBayanId={currentPlayingBayanId}
              activeDownloadIds={activeDownloadIds}
              downloadingFolderId={downloadingFolderId}
              folderProgress={folderProgress}
              onPlayAudio={onPlayAudio}
              onDownloadSingle={handleDownloadSingle}
              onDownloadFolder={handleDownloadFolder}
              onNotify={onNotify}
              t={t}
            />
          ))
        )}
      </div>

      {/* WhatsApp Groups Modal */}
      {isWhatsappModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
          dir="rtl"
        >
          <div
            className={`w-full max-w-lg rounded-2xl border-2 border-[#b08d43] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
              isDark ? 'bg-[#22160d] text-amber-50' : 'bg-white text-[#2c1f15]'
            }`}
          >
            <div
              className={`p-4 border-b flex items-center justify-between ${
                isDark
                  ? 'bg-[#311f13] border-[#b08d43]/40'
                  : 'bg-emerald-50 border-emerald-300/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md">
                  <MessageCircle className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-lalezar">
                    خانقاہ دارالفلاح واٹس ایپ گروپس و چینل
                  </h3>
                  <p className="text-[11px] text-[#b08d43] font-medium">
                    شیخ الحدیث مولانا پیر محمد جمشید نقشبندی مجددی (D.B.)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWhatsappModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-black/20 transition-colors cursor-pointer"
                title="بند کریں"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
              <div className="space-y-2.5">
                {OFFICIAL_WHATSAPP_LINKS.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all ${
                      item.type === 'channel'
                        ? 'border-emerald-500 bg-emerald-950/30 shadow-xs'
                        : isDark
                        ? 'border-[#b08d43]/30 bg-[#2d1c12]'
                        : 'border-[#b08d43]/30 bg-amber-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-sans ${
                          item.type === 'channel'
                            ? 'bg-[#25D366] text-white'
                            : 'bg-[#b08d43] text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                      <h4 className="font-bold font-lalezar text-sm text-[#b08d43]">
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-85 mb-2.5">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1.5 px-3 bg-[#25D366] hover:bg-[#1faa4e] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white" />
                        <span>
                          {item.type === 'channel' ? 'چینل فالو کریں' : 'گروپ میں شامل ہوں'}
                        </span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => handleCopyWaLink(item.url, item.id)}
                        className="py-1.5 px-2.5 border border-[#b08d43]/40 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedWaId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>کاپی ہو گیا</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>کاپی</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl border border-emerald-600/40 flex items-center justify-between">
                <div>
                  <p className="font-bold font-lalezar text-sm text-emerald-500">
                    براہِ راست واٹس ایپ رابطہ
                  </p>
                  <p className="text-xs opacity-75">شیخ صاحب سے براہِ راست واٹس ایپ میسج</p>
                </div>
                <a
                  href={WHATSAPP_DIRECT_CHAT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-[#25D366] hover:bg-[#1faa4e] text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                >
                  <span>میسج بھیجیں</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="p-3 border-t flex justify-end">
              <button
                onClick={() => setIsWhatsappModalOpen(false)}
                className="px-5 py-1.5 bg-[#b08d43] hover:bg-[#96742e] text-white font-lalezar text-xs rounded-lg cursor-pointer"
              >
                بند کریں
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

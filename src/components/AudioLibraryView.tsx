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
  Globe,
  Sparkles,
  MessageCircle,
  Youtube,
  Facebook,
  Smartphone,
  Share2,
  BookOpen,
  Bell,
  ArrowUpRight,
  Copy,
  Check,
  ExternalLink,
  GraduationCap,
  Users,
  Landmark,
  Compass,
  Heart
} from 'lucide-react';
import { BAYANAT_DATABASE, BayanItem } from '../data/bayanatData';
import { 
  downloadSingleBayan, 
  downloadFolderBayanat, 
  subscribeToDownloads 
} from '../utils/downloadHelper';
import { OFFICIAL_WHATSAPP_LINKS } from '../data/appConfig';

interface Props {
  onPlayAudio: (bayan: BayanItem) => void;
  onNotify: (message: string) => void;
  onNavigateUrl?: (url: string) => void;
  onSwitchToWebView?: () => void;
  isDark: boolean;
  currentPlayingBayanId?: string | null;
}

export interface FolderInfo {
  id: string;
  title: string;
  urdu: string;
  category: string;
  count: number;
  items: BayanItem[];
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[يى]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[هھة]/g, 'ہ')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/_/g, ' ')
    .trim();
}

const ITEMS_PER_PAGE = 30;

export const AudioLibraryView: React.FC<Props> = ({
  onPlayAudio,
  onNotify,
  onNavigateUrl,
  onSwitchToWebView,
  isDark,
  currentPlayingBayanId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDownloadIds, setActiveDownloadIds] = useState<Set<string>>(new Set());

  // Folder batch download state
  const [downloadingFolderId, setDownloadingFolderId] = useState<string | null>(null);
  const [folderProgress, setFolderProgress] = useState<{ current: number; total: number; title: string } | null>(null);

  // WhatsApp Groups Dialog & Inline Expand
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [isWhatsappExpanded, setIsWhatsappExpanded] = useState(false);
  const [copiedWaId, setCopiedWaId] = useState<string | null>(null);

  const handleCopyWaLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedWaId(id);
      setTimeout(() => setCopiedWaId(null), 2500);
    }).catch(() => {
      setCopiedWaId(id);
      setTimeout(() => setCopiedWaId(null), 2500);
    });
  };

  // Subscribe to real-time active download status
  useEffect(() => {
    const unsubscribe = subscribeToDownloads((activeIds) => {
      setActiveDownloadIds(activeIds);
    });
    return unsubscribe;
  }, []);

  // Compute folder groups
  const folderGroups = useMemo<FolderInfo[]>(() => {
    const map = new Map<string, FolderInfo>();
    for (const b of BAYANAT_DATABASE) {
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
  }, []);

  // Filtered bayanat
  const filteredBayanat = useMemo(() => {
    const q = normalizeText(searchQuery);

    return BAYANAT_DATABASE.filter((bayan) => {
      // Folder filter
      if (selectedFolderId !== 'all' && bayan.collectionId !== selectedFolderId) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'Sulook' && bayan.category !== 'Sulook') return false;
        if (selectedCategory === 'Islahi' && bayan.category !== 'Islahi') return false;
        if (selectedCategory === 'Dars' && bayan.category !== 'Dars') return false;
        if (selectedCategory === 'Hamd' && bayan.category !== 'Hamd') return false;
      }

      // Query filter
      if (q) {
        const titleMatch = normalizeText(bayan.title).includes(q) || normalizeText(bayan.urduTitle).includes(q);
        const folderMatch = normalizeText(bayan.collectionUrdu).includes(q) || normalizeText(bayan.collectionTitle).includes(q);
        const filenameMatch = normalizeText(bayan.filename).includes(q);
        return titleMatch || folderMatch || filenameMatch;
      }

      return true;
    });
  }, [searchQuery, selectedFolderId, selectedCategory]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFolderId, selectedCategory]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredBayanat.length / ITEMS_PER_PAGE));
  const displayedBayanat = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBayanat.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBayanat, currentPage]);

  // Handle single bayan download - 100% NO NAVIGATION GUARANTEED
  const handleDownloadSingle = async (e: React.MouseEvent, bayan: BayanItem) => {
    e.stopPropagation();
    await downloadSingleBayan(bayan, onNotify);
  };

  // Handle folder batch download
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

  const activeFolder = folderGroups.find((f) => f.id === selectedFolderId);

  return (
    <div
      className={`flex-1 w-full h-full flex flex-col overflow-y-auto select-none transition-colors duration-200 font-modern ${
        isDark ? 'bg-[#18110b] text-amber-50' : 'bg-[#faf6ee] text-[#2c1f15]'
      }`}
      dir="rtl"
    >
      {/* 
        AUTHENTIC HOME HERO SECTION (Exactly matching Screenshot_20261111-184312_cd06ab0b.png)
        Dark brown header card, search container, prominent category cards, and authentic calligraphy banner
      */}
      <div className="w-full max-w-4xl mx-auto px-3 pt-2.5 pb-1">
        {/* The Authentic Dark Brown Hero Card */}
        <div
          className={`rounded-2xl border-2 transition-all overflow-hidden shadow-xl p-4 sm:p-5 text-center space-y-3 ${
            isDark
              ? 'bg-gradient-to-b from-[#2e1d12] via-[#24170d] to-[#1a1008] border-[#b08d43]/60 text-white'
              : 'bg-gradient-to-b from-[#3a281b] to-[#2b1c12] text-white border-[#b08d43]'
          }`}
        >
          {/* Top English Sheikh Name & Golden Library Title (Matching Screenshot 4) */}
          <div className="space-y-1">
            <h2 className="text-xs sm:text-sm font-bold tracking-wider text-amber-100 font-sans uppercase leading-tight">
              SHEIKH-UL-HADEES HAZRAT MAULANA PEER<br />
              MUHAMMAD JAMSHAID NAQSHBANDI (D.B)
            </h2>
            <h3 className="text-base sm:text-xl font-extrabold tracking-wide text-[#d4af37] font-sans uppercase pt-0.5">
              KHANQAH DAR-UL-FALAH DIGITAL LIBRARY
            </h3>
          </div>

          {/* Social Action Icons Row (WhatsApp, Facebook, YouTube, Android App) */}
          <div className="flex items-center justify-center gap-3 pt-1">
            {/* WhatsApp */}
            <a
              href="https://whatsapp.com/channel/0029VaHFtAKDDmFU33nD360K"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform"
              title="واٹس ایپ چینل"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
            </a>

            {/* Facebook */}
            <a
              href="https://www.facebook.com/profile.php?id=100068373408345"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform"
              title="فیس بک پیج"
            >
              <Facebook className="w-4 h-4 fill-white" />
            </a>

            {/* YouTube */}
            <a
              href="https://youtube.com/@peermolanamuhammadjamshedn1391"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform"
              title="یوٹیوب چینل"
            >
              <Youtube className="w-4 h-4 fill-white" />
            </a>

            {/* Android App Pill Button */}
            <a
              href="https://archive.org/download/khanqah-darul-falah/%20Khanqah%20Darul%20falah.apk"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#422c1d] border border-[#d4af37]/70 hover:bg-[#523825] text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md active:scale-95 transition-all"
              title="اینڈرائڈ ایپ ڈاؤنلوڈ کریں"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-sans font-bold">App</span>
            </a>
          </div>

          {/* Thin Divider Line */}
          <div className="border-t border-[#b08d43]/30 my-1" />

          {/* WHATSAPP GROUPS Dropdown Accordion Button (Exact match from Screenshot 4) */}
          <div className="space-y-2">
            <button
              onClick={() => setIsWhatsappExpanded(!isWhatsappExpanded)}
              className="inline-flex items-center justify-center gap-2 text-sm font-bold text-[#25D366] hover:text-[#20ba5a] active:scale-95 transition-all cursor-pointer py-1"
              title="واٹس ایپ گروپس فہرست کھولیں / بند کریں"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isWhatsappExpanded ? 'rotate-180' : ''}`} />
              <span className="font-sans tracking-wide">WHATSAPP GROUPS</span>
              <MessageCircle className="w-4 h-4 fill-[#25D366]" />
            </button>

            {/* Expandable list of all official WhatsApp groups right inside the card */}
            {isWhatsappExpanded && (
              <div className="bg-black/40 border border-[#b08d43]/50 rounded-xl p-3 text-right space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs text-amber-300 border-b border-[#b08d43]/30 pb-1.5">
                  <span className="font-bold font-lalezar">حضرت اقدس کے آفیشل واٹس ایپ گروپس</span>
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
                        <p className="font-bold text-amber-100 font-lalezar truncate text-[13px]">{item.title}</p>
                        <p className="text-[10px] text-gray-400 font-sans truncate" dir="ltr">{item.subTitle}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-[#25D366] hover:bg-[#1faa4e] text-white text-[11px] font-bold rounded flex items-center gap-1 shadow-xs transition-all active:scale-95"
                        >
                          <span>جوائن</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Thin Divider Bar (Matching Screenshot 4) */}
        <div className="mt-2.5 py-1 px-3 bg-white/90 dark:bg-[#25170d] rounded-lg border border-[#b08d43]/30 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="w-4 h-0.5 bg-[#b08d43]"></span>
            <span className="w-4 h-0.5 bg-[#b08d43]"></span>
            <span className="w-4 h-0.5 bg-[#b08d43]"></span>
          </div>
          <span className="text-[11px] font-medium text-gray-500 dark:text-amber-200/70">
            خانقاہ دارالفلاح آڈیو آرکائیو
          </span>
        </div>

        {/* Search Container (Matching Screenshot 4) */}
        <div className="mt-2 flex items-stretch rounded-xl overflow-hidden border-2 border-[#b08d43] shadow-md bg-white">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بیان کا نام یا مقام سرچ کریں"
            className="flex-1 px-3.5 py-2.5 text-sm sm:text-base text-[#2c1f15] bg-white outline-none placeholder-gray-500 font-medium text-right"
            dir="rtl"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-2 text-xs text-amber-700 hover:text-amber-900 bg-amber-50 font-bold"
            >
              صاف کریں
            </button>
          )}
          <button
            onClick={() => {}}
            className="bg-[#b08d43] hover:bg-[#9a7b38] text-white px-5 flex items-center justify-center transition-colors active:scale-95"
            title="تلاش کریں"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Prominent Category Cards (Exactly matching Screenshot 2) */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {/* Card 1: DARS-E-QURAN DARULHUDA */}
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
            className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
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

          {/* Card 2: DASTAR-E-FAZILAT 2026 */}
          <button
            onClick={() => {
              if (selectedFolderId === '20260205_20260205_1013') {
                setSelectedFolderId('all');
              } else {
                setSelectedFolderId('20260205_20260205_1013');
                setSelectedCategory('all');
              }
            }}
            className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
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

          {/* Card 3: ISLAHI MAJALIS */}
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
            className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
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

        {/* Authentic Wood-Carved Calligraphy Banner Image (Exactly matching Screenshot 2) */}
        <div className="mt-3 rounded-2xl overflow-hidden border-2 border-[#b08d43] shadow-xl bg-[#3d2e21]">
          <img 
            src="https://archive.org/download/20260422_20260422_1213/%D8%B4%DB%8C%D8%AE%20%D8%B5%D8%A7%D8%AD%D8%A8%20%D9%84%D9%88%DA%AF%D9%88%20%D9%84%DA%A9%DA%91%DB%8C%20%D9%88%D8%A7%D9%84%D8%A7.png" 
            alt="پیر طریقت رہبر شریعت ولی کامل استاد العلماء حضرت شیخ پیر محمد جمشید نقشبندی مجددی صاحب دامت برکاتہم العالیہ" 
            className="w-full h-auto object-cover block"
            loading="eager"
          />
        </div>
      </div>

      {/* Quick Category Filter Pills */}
      <div className="w-full max-w-4xl mx-auto px-3 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold no-scrollbar">
          <span className="text-amber-500 text-xs shrink-0 flex items-center gap-1 pl-1">
            <Filter className="w-3.5 h-3.5" />
            فلٹر:
          </span>

          {/* All */}
          <button
            onClick={() => {
              setSelectedFolderId('all');
              setSelectedCategory('all');
            }}
            className={`px-3 py-1.5 rounded-xl shrink-0 transition-all ${
              selectedFolderId === 'all' && selectedCategory === 'all'
                ? 'bg-[#b08d43] text-white shadow-xs font-bold'
                : isDark
                ? 'bg-[#22170f] text-amber-200/80 border border-[#b08d43]/30'
                : 'bg-amber-100/70 text-[#3d2e21] border border-[#b08d43]/40'
            }`}
          >
            تمام بیانات ({BAYANAT_DATABASE.length})
          </button>

          {/* Noor e nisbat */}
          <button
            onClick={() => {
              setSelectedFolderId('noor-e-nisbat');
              setSelectedCategory('all');
            }}
            className={`px-3 py-1.5 rounded-xl shrink-0 transition-all ${
              selectedFolderId === 'noor-e-nisbat'
                ? 'bg-[#b08d43] text-white shadow-xs font-bold'
                : isDark
                ? 'bg-[#22170f] text-amber-200/80 border border-[#b08d43]/30'
                : 'bg-amber-100/70 text-[#3d2e21] border border-[#b08d43]/40'
            }`}
          >
            سلوک کے آسان اصول
          </button>

          {/* Sulook */}
          <button
            onClick={() => {
              setSelectedFolderId('20250918_20250918_0142');
              setSelectedCategory('all');
            }}
            className={`px-3 py-1.5 rounded-xl shrink-0 transition-all ${
              selectedFolderId === '20250918_20250918_0142'
                ? 'bg-[#b08d43] text-white shadow-xs font-bold'
                : isDark
                ? 'bg-[#22170f] text-amber-200/80 border border-[#b08d43]/30'
                : 'bg-amber-100/70 text-[#3d2e21] border border-[#b08d43]/40'
            }`}
          >
            سلوک الی اللہ
          </button>

          {/* Islahi */}
          <button
            onClick={() => {
              setSelectedCategory('Islahi');
              setSelectedFolderId('all');
            }}
            className={`px-3 py-1.5 rounded-xl shrink-0 transition-all ${
              selectedCategory === 'Islahi'
                ? 'bg-[#b08d43] text-white shadow-xs font-bold'
                : isDark
                ? 'bg-[#22170f] text-amber-200/80 border border-[#b08d43]/30'
                : 'bg-amber-100/70 text-[#3d2e21] border border-[#b08d43]/40'
            }`}
          >
            اصلاحی مجالس
          </button>

          {/* Dars */}
          <button
            onClick={() => {
              setSelectedCategory('Dars');
              setSelectedFolderId('all');
            }}
            className={`px-3 py-1.5 rounded-xl shrink-0 transition-all ${
              selectedCategory === 'Dars'
                ? 'bg-[#b08d43] text-white shadow-xs font-bold'
                : isDark
                ? 'bg-[#22170f] text-amber-200/80 border border-[#b08d43]/30'
                : 'bg-amber-100/70 text-[#3d2e21] border border-[#b08d43]/40'
            }`}
          >
            دروسِ قرآن
          </button>
        </div>
      </div>

      {/* Main Bayanat Section */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-3 space-y-3">
        {/* Active Folder Header + Download Whole Folder Button */}
        {activeFolder && (
          <div
            className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDark
                ? 'bg-gradient-to-r from-[#24170d] to-[#1c1209] border-[#b08d43]/50'
                : 'bg-gradient-to-r from-amber-50 to-[#fffdf7] border-[#b08d43]/40 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#b08d43]/20 border border-[#b08d43]/40 text-[#b08d43] flex items-center justify-center shrink-0">
                <Folder className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold leading-tight">
                  {activeFolder.urdu}
                </h2>
                <p className="text-xs opacity-75 font-sans">
                  مجموعی بیانات: {activeFolder.items.length} فائلیں • موبائل میموری میں براہِ راست محفوظ کریں
                </p>
              </div>
            </div>

            <button
              onClick={() => handleDownloadFolder(activeFolder)}
              disabled={downloadingFolderId === activeFolder.id}
              className="py-2 px-4 bg-gradient-to-r from-[#b08d43] to-[#8c6d2b] hover:from-[#c29c4c] hover:to-[#9f7d33] active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-60 shrink-0"
              title="پورا فولڈر ایک ساتھ ڈاؤنلوڈ کریں"
            >
              {downloadingFolderId === activeFolder.id ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>ڈاؤنلوڈ جاری ہے...</span>
                </>
              ) : (
                <>
                  <FolderDown className="w-4 h-4" />
                  <span>پورا فولڈر ڈاؤنلوڈ کریں ({activeFolder.items.length} بیانات)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Results Info & Guarantee Banner */}
        <div className="flex items-center justify-between text-xs px-1 text-gray-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold">دستیاب نتائج: {filteredBayanat.length} بیانات</span>
            {searchQuery && (
              <span className="text-[#b08d43]">
                (تلاش: &quot;{searchQuery}&quot;)
              </span>
            )}
          </div>
          <span className="text-emerald-500 font-sans text-[11px] flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            1-کلک ڈاؤنلوڈ: بغیر کوئی اور پیج کھولے فوری ڈاؤنلوڈ
          </span>
        </div>

        {/* Empty State */}
        {filteredBayanat.length === 0 && (
          <div
            className={`p-10 text-center rounded-2xl border ${
              isDark ? 'bg-[#20140b] border-[#b08d43]/30' : 'bg-white border-[#b08d43]/30'
            }`}
          >
            <Headphones className="w-12 h-12 text-[#b08d43] mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-bold mb-1">کوئی بیان نہیں ملا</h3>
            <p className="text-xs text-gray-400 mb-4">
              براہ کرم دوسرا لفظ یا تاریخ درج کر کے تلاش کیجیے۔
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFolderId('all');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 bg-[#b08d43] text-white text-xs font-semibold rounded-xl"
            >
              تمام بیانات دیکھیں
            </button>
          </div>
        )}

        {/* List of Bayanat Cards - Every Bayan with Dedicated Download Button */}
        <div className="space-y-2.5">
          {displayedBayanat.map((bayan, idx) => {
            const isPlayingThis = currentPlayingBayanId === bayan.id;
            const isDownloadingThis = activeDownloadIds.has(bayan.id);
            const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;

            return (
              <div
                key={`home-bayan-${bayan.id}-${idx}`}
                className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                  isPlayingThis
                    ? isDark
                      ? 'bg-[#2d1f14] border-[#d4af37] ring-1 ring-[#d4af37]/50 shadow-md'
                      : 'bg-[#fff9ea] border-[#b08d43] ring-1 ring-[#b08d43]/40 shadow-md'
                    : isDark
                    ? 'bg-[#1e140d] border-[#b08d43]/35 hover:border-[#b08d43] hover:bg-[#251910]'
                    : 'bg-white border-[#b08d43]/30 hover:border-[#b08d43] shadow-2xs hover:shadow-sm hover:bg-[#fffefb]'
                }`}
              >
                {/* Bayan Title and Meta Info */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Number Badge */}
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold font-sans text-xs shrink-0 mt-0.5 ${
                      isPlayingThis
                        ? 'bg-[#d4af37] text-[#2c1f15] font-extrabold shadow-sm'
                        : isDark
                        ? 'bg-[#2e1d12] text-amber-300 border border-[#b08d43]/40'
                        : 'bg-amber-100 text-[#3d2e21] border border-[#b08d43]/40'
                    }`}
                  >
                    {globalIndex}
                  </div>

                  {/* Title and details */}
                  <div className="min-w-0 flex-1">
                    <h3
                      onClick={() => onPlayAudio(bayan)}
                      className={`text-base font-bold leading-snug cursor-pointer transition-colors ${
                        isPlayingThis
                          ? 'text-[#d4af37]'
                          : 'group-hover:text-[#b08d43]'
                      }`}
                    >
                      {bayan.urduTitle || bayan.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                      {/* Collection / Folder Badge */}
                      <span
                        onClick={() => setSelectedFolderId(bayan.collectionId)}
                        className="text-[#b08d43] hover:underline cursor-pointer truncate max-w-[200px] font-medium"
                        title={bayan.collectionUrdu}
                      >
                        {bayan.collectionUrdu}
                      </span>

                      {/* Duration */}
                      {bayan.length && (
                        <span className="font-sans text-[11px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {Math.floor(parseFloat(bayan.length) / 60)} منٹ
                        </span>
                      )}

                      {/* Category Badge */}
                      {bayan.category && (
                        <span className="text-[10px] px-2 py-0.2 rounded-full font-medium bg-[#b08d43]/15 text-[#b08d43] border border-[#b08d43]/30">
                          {bayan.category === 'Sulook'
                            ? 'سلوک'
                            : bayan.category === 'Islahi'
                            ? 'اصلاحی'
                            : bayan.category === 'Dars'
                            ? 'درس'
                            : bayan.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Play + INSTANT DOWNLOAD (No other page opened) */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center" dir="ltr">
                  {/* Play Button */}
                  <button
                    onClick={() => onPlayAudio(bayan)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
                      isPlayingThis
                        ? 'bg-[#b08d43] text-white shadow-sm ring-1 ring-amber-300'
                        : isDark
                        ? 'bg-amber-900/30 text-amber-200 border border-[#b08d43]/40 hover:bg-[#b08d43] hover:text-white'
                        : 'bg-amber-50 text-[#3d2e21] border border-[#b08d43]/40 hover:bg-[#b08d43] hover:text-white'
                    }`}
                    title="بیان سنیں"
                  >
                    <Play className={`w-3.5 h-3.5 ${isPlayingThis ? 'fill-white text-white' : 'fill-current'}`} />
                    <span>{isPlayingThis ? 'چل رہا ہے' : 'سنیں'}</span>
                  </button>

                  {/* INSTANT DOWNLOAD BUTTON - CRITICAL USER REQUIREMENT */}
                  <button
                    onClick={(e) => handleDownloadSingle(e, bayan)}
                    disabled={isDownloadingThis}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95 ${
                      isDownloadingThis
                        ? 'bg-amber-600 text-white cursor-wait opacity-90'
                        : 'bg-[#25D366] hover:bg-[#1faa4e] text-white shadow-emerald-900/20 hover:shadow-md'
                    }`}
                    title="فورا موبائل میموری میں ڈاؤنلوڈ کریں (بغیر کوئی اور پیج کھولے)"
                  >
                    {isDownloadingThis ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>ڈاؤنلوڈ جاری ہے...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>ڈاؤنلوڈ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-semibold transition-colors ${
              isDark
                ? 'bg-[#20150d] border-[#b08d43]/30 text-amber-200'
                : 'bg-white border-[#b08d43]/40 text-[#3d2e21] shadow-2xs'
            }`}
          >
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-xl border border-[#b08d43]/40 flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none hover:bg-[#b08d43] hover:text-white transition-all active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
              <span>پچھلا صفحہ</span>
            </button>

            <span className="font-sans font-bold">
              صفحہ {currentPage} از {totalPages} ({filteredBayanat.length} بیانات)
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-xl border border-[#b08d43]/40 flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none hover:bg-[#b08d43] hover:text-white transition-all active:scale-95"
            >
              <span>اگلا صفحہ</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* WhatsApp Groups & Channel Modal */}
      {isWhatsappModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
          <div
            className={`w-full max-w-lg rounded-2xl border-2 border-[#b08d43] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
              isDark ? 'bg-[#22160d] text-amber-50' : 'bg-white text-[#2c1f15]'
            }`}
          >
            {/* Modal Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              isDark ? 'bg-[#311f13] border-[#b08d43]/40' : 'bg-emerald-50 border-emerald-300/50'
            }`}>
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
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-black/20 transition-colors"
                title="بند کریں"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
              <div className={`p-3 rounded-xl border border-emerald-500/40 text-center ${
                isDark ? 'bg-emerald-950/40 text-emerald-100' : 'bg-emerald-50 text-emerald-950'
              }`}>
                <p className="font-semibold leading-relaxed">
                  حضرت اقدس کے روزانہ کے بیانات، مجالسِ ذکر، اصلاحی پیغامات اور اعلانات کے تمام آفیشل واٹس ایپ گروپس اور چینل لنکس درج ذیل ہیں۔ نیچے دیے گئے بٹن پر کلک کرکے شامل ہو سکتے ہیں:
                </p>
              </div>

              {/* All WhatsApp Groups & Channel Items */}
              <div className="space-y-2.5">
                {OFFICIAL_WHATSAPP_LINKS.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all ${
                      item.type === 'channel'
                        ? 'border-emerald-500 bg-emerald-950/30 shadow-xs'
                        : isDark
                        ? 'border-[#b08d43]/30 bg-[#2d1c12] hover:border-[#b08d43]/70'
                        : 'border-[#b08d43]/30 bg-amber-50/50 hover:border-[#b08d43]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-sans ${
                          item.type === 'channel'
                            ? 'bg-[#25D366] text-white shadow-xs'
                            : 'bg-[#b08d43] text-white'
                        }`}>
                          {item.badge}
                        </span>
                        <h4 className="font-bold font-lalezar text-sm text-[#b08d43]">
                          {item.title}
                        </h4>
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-400 font-sans mb-1" dir="ltr">
                      {item.subTitle}
                    </p>

                    <p className="text-[11px] leading-relaxed opacity-85 mb-2.5">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1.5 px-3 bg-[#25D366] hover:bg-[#1faa4e] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white" />
                        <span>{item.type === 'channel' ? 'چینل فالو کریں' : 'گروپ میں شامل ہوں'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => handleCopyWaLink(item.url, item.id)}
                        className={`py-1.5 px-2.5 border rounded-lg text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 ${
                          copiedWaId === item.id
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : isDark
                            ? 'border-[#b08d43]/40 hover:bg-[#b08d43]/20 text-amber-200'
                            : 'border-[#b08d43]/40 hover:bg-amber-100 text-[#3d2e21]'
                        }`}
                        title="لنک کاپی کریں"
                      >
                        {copiedWaId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>کاپی ہو گیا!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>کاپی لنک</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Direct WhatsApp Contact Button */}
              <div className={`p-3 rounded-xl border border-emerald-600/40 flex items-center justify-between ${
                isDark ? 'bg-emerald-950/30' : 'bg-emerald-50/80'
              }`}>
                <div>
                  <p className="font-bold font-lalezar text-sm text-emerald-400">براہِ راست واٹس ایپ رابطہ</p>
                  <p className="text-xs text-emerald-200 font-sans" dir="ltr">+92 332 9106002</p>
                </div>
                <a
                  href="https://api.whatsapp.com/send?phone=923329106002"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-[#25D366] hover:bg-[#1faa4e] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <span>میسج بھیجیں</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-3 border-t flex justify-end ${
              isDark ? 'bg-[#1b120a] border-[#b08d43]/30' : 'bg-gray-50 border-gray-200'
            }`}>
              <button
                onClick={() => setIsWhatsappModalOpen(false)}
                className="px-5 py-1.5 bg-[#b08d43] hover:bg-[#96742e] text-white font-lalezar text-xs rounded-lg transition-all active:scale-95 shadow-xs"
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

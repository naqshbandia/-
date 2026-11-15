import React, { useState, useEffect, useMemo } from 'react';
import {
  Headphones,
  BookOpen,
  Bell,
  MessageCircle,
  Globe,
  Landmark,
  Radio,
  HeartHandshake,
  Sparkles,
  Play,
  Download,
  Loader2,
  Clock,
  CheckCircle2,
  MapPin,
  ArrowLeft,
  Search,
  X,
  Share2,
  FileText,
  ShieldCheck,
  PhoneCall,
  Youtube,
  Facebook,
  Smartphone,
  Newspaper,
  Calendar,
  Pencil,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  GOLD_LIBRARY_URL,
  NEWS_UPDATES_URL,
  URDU_BOOKS_URL,
  HAFTAWAR_BAYANAT_URL,
  ISLAMI_MAJALIS_URL,
  TELAWAT_HAMD_NAAT_URL,
  OFFICIAL_APK_URL,
  SHEIKH_TITLE_BANNER_URL,
  WHATSAPP_DIRECT_CHAT_URL,
  DEVELOPER_WHATSAPP_URL,
  BloggerPostTab,
} from '../data/appConfig';
import { BAYANAT_DATABASE, BLOG_POSTS, BayanItem, BlogPostItem } from '../data/bayanatData';
import { downloadSingleBayan, subscribeToDownloads } from '../utils/downloadHelper';
import {
  isBayanNew,
  formatBayanDateUrdu,
  shareBayanOnWhatsApp,
  normalizeSearchText,
} from '../utils/archiveService';
import {
  PrayerCache,
  JamaatKey,
  JamaatScheduleItem,
  PRAYER_CACHE_KEY,
  JAMAAT_STORAGE_KEY,
  DEFAULT_JAMAAT_SCHEDULE,
  parseAladhanPayload,
  computeNawafilTimings,
  resolveJamaatTime24,
  getNextFarzKey,
  formatTo12Hour,
} from '../utils/prayerEngine';

interface Props {
  isDark: boolean;
  bayanatList?: BayanItem[];
  bloggerTabs?: BloggerPostTab[];
  onOpenUrl: (url: string) => void;
  onOpenLibrary: () => void;
  onOpenWhatsAppGroups: () => void;
  onOpenIntroKhanqah: () => void;
  onOpenIntroSheikh: () => void;
  onOpenContact: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onPlayAudio: (bayan: BayanItem) => void;
  onNotify: (msg: string) => void;
  currentPlayingBayanId?: string | null;
}

const NOTIFY_EMAIL_KEY = 'khanqah_live_notify_email_v1';

function normalizeMatch(haystack: string | undefined, needle: string): boolean {
  if (!needle) return true;
  if (!haystack) return false;
  return normalizeSearchText(haystack).includes(needle);
}

function getBloggerFolderIcon(iconName: BloggerPostTab['iconName']) {
  switch (iconName) {
    case 'audio':
      return Headphones;
    case 'books':
      return BookOpen;
    case 'news':
      return Newspaper;
    case 'app':
      return Smartphone;
    case 'blogger':
      return Globe;
    default:
      return FileText;
  }
}

export const SmartDashboardHome: React.FC<Props> = ({
  isDark,
  bayanatList = BAYANAT_DATABASE,
  bloggerTabs = [],
  onOpenUrl,
  onOpenLibrary,
  onOpenWhatsAppGroups,
  onOpenIntroKhanqah,
  onOpenIntroSheikh,
  onOpenContact,
  onOpenTerms,
  onOpenPrivacy,
  onPlayAudio,
  onNotify,
  currentPlayingBayanId,
}) => {
  const [now, setNow] = useState<Date>(() => new Date());
  const [bannerError, setBannerError] = useState(false);
  const [dashQuery, setDashQuery] = useState('');

  // Active Prayer Section Tab: Farz | Nawafil | Jama'at
  const [prayerTab, setPrayerTab] = useState<'farz' | 'nawafil' | 'jamaat'>('farz');
  const [isEditingJamaat, setIsEditingJamaat] = useState(false);

  // Prayer Cache State
  const [prayerData, setPrayerData] = useState<PrayerCache | null>(() => {
    try {
      const saved = localStorage.getItem(PRAYER_CACHE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoadingPrayers, setIsLoadingPrayers] = useState(false);

  // Jama'at Schedule State
  const [jamaatSchedule, setJamaatSchedule] = useState<Record<JamaatKey, JamaatScheduleItem>>(() => {
    try {
      const saved = localStorage.getItem(JAMAAT_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_JAMAAT_SCHEDULE, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_JAMAAT_SCHEDULE;
  });

  // Live Notification Form State
  const [showNotifyForm, setShowNotifyForm] = useState(false);
  const [notifyEmailInput, setNotifyEmailInput] = useState('');
  const [savedNotifyEmail, setSavedNotifyEmail] = useState<string>(() => {
    try {
      return localStorage.getItem(NOTIFY_EMAIL_KEY) || '';
    } catch {
      return '';
    }
  });

  // Download tracking
  const [activeDownloadIds, setActiveDownloadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsub = subscribeToDownloads((ids) => setActiveDownloadIds(ids));
    return unsub;
  }, []);

  // Persist Jamaat schedule
  useEffect(() => {
    try {
      localStorage.setItem(JAMAAT_STORAGE_KEY, JSON.stringify(jamaatSchedule));
    } catch {}
  }, [jamaatSchedule]);

  // Live Clock (ticks every second)
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchPrayerTimes = async () => {
    setIsLoadingPrayers(true);
    try {
      const res = await fetch(
        'https://api.aladhan.com/v1/timingsByCity?city=Bannu&country=Pakistan&method=1&school=1'
      );
      if (!res.ok) throw new Error('API response error');
      const json = await res.json();
      const parsed = parseAladhanPayload(json);
      if (parsed) {
        setPrayerData(parsed);
        try {
          localStorage.setItem(PRAYER_CACHE_KEY, JSON.stringify(parsed));
        } catch {}
      }
    } catch {
      // Keep cached data gracefully if offline
    } finally {
      setIsLoadingPrayers(false);
    }
  };

  useEffect(() => {
    fetchPrayerTimes();
  }, []);

  // Derived Prayer Lists
  const nawafilList = useMemo(() => computeNawafilTimings(prayerData), [prayerData]);

  const jamaatCards = useMemo(() => {
    const order: JamaatKey[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Jummah'];
    return order.map((key) => {
      const item = jamaatSchedule[key];
      const time24 = resolveJamaatTime24(key, item, prayerData);
      return {
        ...item,
        resolved24: time24,
        resolved12: formatTo12Hour(time24),
      };
    });
  }, [jamaatSchedule, prayerData]);

  const formattedClock = now.toLocaleTimeString('en-US', {
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const nextPrayerKey = useMemo(
    () => (prayerData ? getNextFarzKey(prayerData.prayers, now) : null),
    [prayerData, now]
  );

  // Latest 4 uploaded bayanat across ALL Archive collections
  const latestUploadedBayanat = useMemo(() => {
    return bayanatList.filter((b) => (b.urduTitle || b.title).trim().length > 0).slice(0, 4);
  }, [bayanatList]);

  // Combined search dataset for Prominent Top Search Bar
  const allSearchPosts = useMemo<BlogPostItem[]>(() => {
    const map = new Map<string, BlogPostItem>();
    for (const p of BLOG_POSTS) {
      map.set(p.url, p);
    }
    for (const t of bloggerTabs) {
      if (!map.has(t.url)) {
        map.set(t.url, {
          id: t.id,
          title: t.title,
          urduTitle: t.title,
          url: t.url,
          published: t.published ? t.published.slice(0, 10) : '',
          description: t.snippet || 'اعلان و اشتہار',
          category: t.iconName === 'news' ? 'اعلان و اشتہار' : 'اسلامی پوسٹ',
        });
      }
    }
    return Array.from(map.values());
  }, [bloggerTabs]);

  const topSearchResults = useMemo(() => {
    const q = normalizeSearchText(dashQuery);
    if (!q) return { posts: [] as BlogPostItem[], bayanat: [] as BayanItem[] };

    const matchingPosts = allSearchPosts.filter(
      (post) =>
        normalizeMatch(post.title, q) ||
        normalizeMatch(post.urduTitle, q) ||
        normalizeMatch(post.description, q) ||
        normalizeMatch(post.category, q) ||
        normalizeMatch(post.published, q)
    );

    const matchingBayanat = bayanatList.filter((bayan) => {
      const urduDate = formatBayanDateUrdu(bayan);
      const isoDate = bayan.mtime
        ? new Date(parseInt(bayan.mtime, 10) * 1000).toISOString().slice(0, 10)
        : '';
      return (
        normalizeMatch(bayan.urduTitle, q) ||
        normalizeMatch(bayan.title, q) ||
        normalizeMatch(bayan.collectionUrdu, q) ||
        normalizeMatch(bayan.collectionTitle, q) ||
        normalizeMatch(bayan.filename, q) ||
        normalizeMatch(urduDate, q) ||
        normalizeMatch(isoDate, q) ||
        (bayan.mtime || '').includes(q)
      );
    });

    return {
      posts: matchingPosts.slice(0, 8),
      bayanat: matchingBayanat.slice(0, 20),
    };
  }, [dashQuery, allSearchPosts, bayanatList]);

  const handleSaveNotify = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = notifyEmailInput.trim();
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      onNotify('براہ کرم درست Gmail پتہ درج کریں');
      return;
    }
    try {
      localStorage.setItem(NOTIFY_EMAIL_KEY, trimmed);
    } catch {}
    setSavedNotifyEmail(trimmed);
    setShowNotifyForm(false);
    setNotifyEmailInput('');
    onNotify('جزاک اللہ! لائیو بیان نوٹیفیکیشن کے لیے آپ کی Gmail محفوظ ہو گئی ہے۔');
  };

  const handleClearNotify = () => {
    try {
      localStorage.removeItem(NOTIFY_EMAIL_KEY);
    } catch {}
    setSavedNotifyEmail('');
    onNotify('نوٹیفیکیشن ای میل ہٹا دیا گیا ہے۔');
  };

  // Core Folder Cards + Automatic Live Blogger Posts Grid
  const coreFolders = useMemo(
    () => [
      {
        id: 'audio-library',
        label: 'آڈیو لائبریری',
        subLabel: `${bayanatList.length} بیانات (فولڈرز)`,
        icon: Headphones,
        accent: 'text-[#064326] dark:text-[#00ff99]',
        onClick: onOpenLibrary,
      },
      {
        id: 'haftawar-bayanat',
        label: 'ہفتہ وار بیانات',
        subLabel: 'تازہ خطابات',
        icon: Radio,
        accent: 'text-[#0a5d38] dark:text-emerald-400',
        onClick: () => onOpenUrl(HAFTAWAR_BAYANAT_URL),
      },
      {
        id: 'islami-majalis',
        label: 'اصلاحی مجالس',
        subLabel: 'ذکر و مراقبہ',
        icon: HeartHandshake,
        accent: 'text-[#064326] dark:text-emerald-400',
        onClick: () => onOpenUrl(ISLAMI_MAJALIS_URL),
      },
      {
        id: 'urdu-books',
        label: 'اسلامی اردو کتب',
        subLabel: 'کتابیں و رسائل',
        icon: BookOpen,
        accent: 'text-[#8c6514] dark:text-[#d4af37]',
        onClick: () => onOpenUrl(URDU_BOOKS_URL),
      },
      {
        id: 'telawat-naat',
        label: 'تلاوت، حمد و نعت',
        subLabel: 'منتخب کلام',
        icon: Sparkles,
        accent: 'text-[#0a5d38] dark:text-emerald-400',
        onClick: () => onOpenUrl(TELAWAT_HAMD_NAAT_URL),
      },
      {
        id: 'news-updates',
        label: 'اعلانات و اشتہارات',
        subLabel: 'خبریں و تازہ معلومات',
        icon: Bell,
        accent: 'text-[#b91c1c] dark:text-rose-400',
        onClick: () => onOpenUrl(NEWS_UPDATES_URL),
      },
      {
        id: 'whatsapp-groups',
        label: 'واٹس ایپ گروپس',
        subLabel: 'چینل و گروپس',
        icon: MessageCircle,
        accent: 'text-[#15803d] dark:text-emerald-400',
        onClick: onOpenWhatsAppGroups,
      },
    ],
    [bayanatList.length, onOpenLibrary, onOpenUrl, onOpenWhatsAppGroups]
  );

  const bloggerLiveFolders = useMemo(() => {
    const coreUrls = new Set([GOLD_LIBRARY_URL, URDU_BOOKS_URL, NEWS_UPDATES_URL]);
    const list: {
      id: string;
      label: string;
      subLabel: string;
      icon: React.ComponentType<{ className?: string }>;
      accent: string;
      publishedDate?: string;
      onClick: () => void;
    }[] = [];

    const seenUrl = new Set<string>();
    for (const tab of bloggerTabs) {
      if (tab.id === 'audio-library-gold-page') continue;
      if (!tab.isLivePost && coreUrls.has(tab.url)) continue;
      if (seenUrl.has(tab.url)) continue;
      seenUrl.add(tab.url);

      const IconComp = getBloggerFolderIcon(tab.iconName);
      const dateStr = tab.published ? tab.published.slice(0, 10) : '';
      list.push({
        id: `blogger-folder-${tab.id}`,
        label: tab.title,
        subLabel: tab.snippet || 'خانقاہ دارالفلاح',
        icon: IconComp,
        accent: 'text-[#8c6514] dark:text-[#d4af37]',
        publishedDate: dateStr,
        onClick: () => onOpenUrl(tab.url),
      });
    }
    return list;
  }, [bloggerTabs, onOpenUrl]);

  const totalSearchHits = topSearchResults.posts.length + topSearchResults.bayanat.length;

  return (
    <div
      className={`flex-1 w-full h-full overflow-y-auto transition-colors duration-200 ${
        isDark ? 'bg-[#09150f] text-emerald-50' : 'bg-[#f4f7f6] text-[#11261b]'
      }`}
      dir="rtl"
    >
      <div className="max-w-5xl mx-auto px-3.5 sm:px-6 py-4 space-y-5">
        {/* 1. Top Sheikh Title Calligraphy Banner (Enlarged PNG Logo Showcase) */}
        <section
          className={`rounded-3xl border-2 border-[#d4af37]/80 overflow-hidden shadow-md transition-colors ${
            isDark ? 'bg-[#0c2317]' : 'bg-white'
          }`}
        >
          {!bannerError ? (
            <div className="w-full flex items-center justify-center bg-gradient-to-l from-[#064326]/10 via-transparent to-[#064326]/10 px-4 py-3 sm:py-4">
              <img
                src={SHEIKH_TITLE_BANNER_URL}
                alt="شیخ الحدیث حضرت مولانا پیر محمد جمشید نقشبندی مجددی دامت برکاتہم"
                onError={() => setBannerError(true)}
                className="max-h-36 sm:max-h-44 md:max-h-48 w-full max-w-2xl object-contain mx-auto drop-shadow-sm"
              />
            </div>
          ) : (
            <div className="py-5 px-4 text-center bg-[#064326] text-white">
              <p className="text-lg sm:text-xl font-bold text-[#d4af37]">
                خانقاہ دارالفلاح (سلسلہ عالیہ نقشبندیہ مجددیہ)
              </p>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1">
                شیخ الحدیث حضرت مولانا پیر محمد جمشید نقشبندی مجددی دامت برکاتہم
              </p>
            </div>
          )}
        </section>

        {/* 2. Prominent Top Search Bar */}
        <section className="relative z-20">
          <div
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border-2 transition-all shadow-sm ${
              isDark
                ? 'bg-[#0e2217] border-[#d4af37]/60 focus-within:border-[#00ff99]'
                : 'bg-white border-[#064326]/30 focus-within:border-[#064326]'
            }`}
          >
            <Search className="w-5 h-5 text-[#064326] dark:text-[#d4af37] shrink-0" />
            <input
              type="text"
              value={dashQuery}
              onChange={(e) => setDashQuery(e.target.value)}
              placeholder="بیان کا نام، تاریخ (2026)، مقام (مسجد اسلام دین، دارالہدیٰ)، فولڈر یا اشتہار تلاش کریں..."
              className="w-full bg-transparent border-none outline-none text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-emerald-200/45"
            />
            {dashQuery && (
              <button
                onClick={() => setDashQuery('')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer shrink-0"
                title="تلاش صاف کریں"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {dashQuery.trim().length > 0 && (
            <div
              className={`mt-2 rounded-2xl border-2 border-[#d4af37]/60 shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto divide-y ${
                isDark
                  ? 'bg-[#0b1f14] border-[#d4af37]/60 divide-white/10'
                  : 'bg-white border-[#d4af37]/70 divide-emerald-950/10'
              }`}
            >
              <div
                className={`px-4 py-2 text-xs font-bold flex items-center justify-between sticky top-0 z-10 ${
                  isDark ? 'bg-[#062b18] text-[#d4af37]' : 'bg-[#ebf2ee] text-[#064326]'
                }`}
              >
                <span>تلاش کے نتائج: {totalSearchHits}</span>
                <button
                  onClick={() => setDashQuery('')}
                  className="text-[11px] hover:underline cursor-pointer"
                >
                  بند کریں
                </button>
              </div>

              {totalSearchHits === 0 ? (
                <div className="p-6 text-center text-sm opacity-75">
                  &quot;{dashQuery}&quot; سے متعلق کوئی بیان، مقام، تاریخ یا اشتہار نہیں ملا۔
                </div>
              ) : (
                <>
                  {topSearchResults.posts.map((post) => (
                    <div
                      key={`dash-post-${post.id}`}
                      onClick={() => onOpenUrl(post.url)}
                      className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-[#133523]' : 'hover:bg-emerald-50/70'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 text-[#8c6514] dark:text-[#d4af37] flex items-center justify-center shrink-0">
                          <Newspaper className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold truncate">
                            {post.urduTitle || post.title}
                          </h4>
                          <p className="text-xs opacity-70 truncate mt-0.5">{post.description}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-[#064326] text-white text-[11px] font-bold shrink-0">
                        کھولیں
                      </span>
                    </div>
                  ))}

                  {topSearchResults.bayanat.map((bayan) => {
                    const isNew = isBayanNew(bayan);
                    const dateText = formatBayanDateUrdu(bayan);
                    const isDownloading = activeDownloadIds.has(bayan.id);

                    return (
                      <div
                        key={`dash-bayan-${bayan.id}`}
                        className={`p-3 flex items-center justify-between gap-2 transition-colors ${
                          isDark ? 'hover:bg-[#133523]' : 'hover:bg-emerald-50/70'
                        }`}
                      >
                        <button
                          onClick={() => onPlayAudio(bayan)}
                          className="flex items-center gap-2.5 min-w-0 flex-1 text-right cursor-pointer"
                        >
                          <span className="w-9 h-9 rounded-xl bg-[#064326] text-white flex items-center justify-center shrink-0">
                            <Play className="w-4 h-4 fill-white" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              {isNew && (
                                <span className="px-1.5 py-0.5 rounded bg-[#d4af37] text-[#051a0f] text-[10px] font-bold shrink-0">
                                  نیا
                                </span>
                              )}
                              <h4 className="text-sm font-bold truncate">
                                {bayan.urduTitle || bayan.title}
                              </h4>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] opacity-75 mt-0.5 truncate">
                              <span className="text-[#064326] dark:text-[#d4af37] font-semibold truncate">
                                {bayan.collectionUrdu}
                              </span>
                              {dateText && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="tabular-nums shrink-0">{dateText}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => shareBayanOnWhatsApp(bayan)}
                            className="min-w-[38px] min-h-[38px] rounded-xl bg-[#25D366] hover:bg-[#1faa4e] text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                            title="واٹس ایپ پر شیئر کریں"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => downloadSingleBayan(bayan, onNotify)}
                            disabled={isDownloading}
                            className="min-w-[38px] min-h-[38px] rounded-xl bg-[#064326] hover:bg-[#095c34] text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                            title="بغیر صفحہ بدلے ڈاؤنلوڈ کریں"
                          >
                            {isDownloading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </section>

        {/* 3. Smart Islamic Display Box: Clock + 3 Prayer Tabs + Live Bayan */}
        <section className="islamic-panel-pattern border-2 border-[#d4af37] rounded-3xl p-4 sm:p-5 text-white shadow-xl space-y-4">
          {/* Top Metadata Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-amber-200/90 border-b border-[#d4af37]/25 pb-2.5">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>بنوں، پاکستان</span>
              <span aria-hidden="true">·</span>
              <button
                onClick={onOpenIntroKhanqah}
                className="hover:text-[#d4af37] underline-offset-4 hover:underline transition-colors cursor-pointer"
              >
                تعارفِ خانقاہ
              </button>
            </div>

            {isLoadingPrayers ? (
              <span className="text-[11px] text-emerald-200/75">اوقاتِ نماز اپڈیٹ ہو رہے ہیں...</span>
            ) : (
              <span className="text-[11px] text-[#00ff99]/85 font-semibold">خانقاہ دارالفلاح</span>
            )}
          </div>

          {/* Live Clock & Hijri Date */}
          <div className="text-center py-1">
            <div
              className="text-3xl sm:text-4xl font-bold text-[#00ff99] tracking-wider tabular-nums font-sans"
              dir="ltr"
            >
              {formattedClock}
            </div>
            <div className="text-base sm:text-lg font-bold text-[#d4af37] mt-1">
              {prayerData?.hijriDate || 'ہجری تاریخ لوڈ ہو رہی ہے...'}
            </div>
            <div className="text-xs text-emerald-100/75 mt-0.5 tabular-nums">
              {now.toLocaleDateString('ur-PK', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>

          {/* 3 Tab Buttons Right Above Prayer Cards: فرض نمازیں | دیگر نمازیں | جماعت اوقات */}
          <div className="pt-2 border-t border-[#d4af37]/20 space-y-3">
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <button
                onClick={() => setPrayerTab('farz')}
                className={`py-2 px-1.5 rounded-xl text-[11px] sm:text-sm font-bold border transition-all cursor-pointer whitespace-nowrap ${
                  prayerTab === 'farz'
                    ? 'bg-[#d4af37] text-[#051a0f] border-[#d4af37] shadow-md'
                    : 'bg-white/[0.06] text-emerald-100 border-[#d4af37]/30 hover:bg-white/10'
                }`}
              >
                فرض نمازیں
              </button>
              <button
                onClick={() => setPrayerTab('nawafil')}
                className={`py-2 px-1.5 rounded-xl text-[11px] sm:text-sm font-bold border transition-all cursor-pointer whitespace-nowrap ${
                  prayerTab === 'nawafil'
                    ? 'bg-[#d4af37] text-[#051a0f] border-[#d4af37] shadow-md'
                    : 'bg-white/[0.06] text-emerald-100 border-[#d4af37]/30 hover:bg-white/10'
                }`}
              >
                دیگر نمازیں
              </button>
              <button
                onClick={() => setPrayerTab('jamaat')}
                className={`py-2 px-1.5 rounded-xl text-[11px] sm:text-sm font-bold border transition-all cursor-pointer whitespace-nowrap ${
                  prayerTab === 'jamaat'
                    ? 'bg-[#d4af37] text-[#051a0f] border-[#d4af37] shadow-md'
                    : 'bg-white/[0.06] text-emerald-100 border-[#d4af37]/30 hover:bg-white/10'
                }`}
              >
                جماعت اوقات
              </button>
            </div>

            {/* TAB 1: فرض نمازیں (Same clean 5-card architecture with Start & End Times) */}
            {prayerTab === 'farz' && (
              prayerData ? (
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {prayerData.prayers.map((p) => {
                    const isNext = nextPrayerKey === p.key;
                    return (
                      <div
                        key={p.key}
                        className={`rounded-xl py-2.5 px-1 text-center border transition-colors ${
                          isNext
                            ? 'bg-[#d4af37]/20 border-[#d4af37] text-white'
                            : 'bg-[#d4af37]/[0.08] border-[#d4af37]/20 text-emerald-50'
                        }`}
                      >
                        <div className="text-[11px] sm:text-xs font-bold text-[#d4af37]">
                          {p.name}
                          {isNext && (
                            <span className="block text-[9px] text-[#00ff99] mt-0.5">اگلی نماز</span>
                          )}
                        </div>
                        <div className="text-[11px] sm:text-xs font-bold tabular-nums mt-1" dir="ltr">
                          {p.start12}
                        </div>
                        <div
                          className="text-[9px] sm:text-[10px] text-emerald-100/70 tabular-nums mt-0.5"
                          dir="ltr"
                        >
                          تا {p.end12}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-xs text-emerald-200/70 py-3">
                  فرض نمازوں کے اوقات لوڈ ہو رہے ہیں...
                </div>
              )
            )}

            {/* TAB 2: دیگر نمازیں / نوافل (Exact Same 5-Card Golden Architecture) */}
            {prayerTab === 'nawafil' && (
              nawafilList.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {nawafilList.map((item) => (
                      <div
                        key={item.key}
                        className={`rounded-xl py-2.5 px-1 text-center border transition-colors ${
                          item.isProhibited
                            ? 'bg-rose-500/15 border-rose-400/50 text-rose-100'
                            : 'bg-[#d4af37]/[0.08] border-[#d4af37]/25 text-emerald-50'
                        }`}
                      >
                        <div
                          className={`text-[11px] sm:text-xs font-bold ${
                            item.isProhibited ? 'text-rose-300' : 'text-[#d4af37]'
                          }`}
                        >
                          {item.name}
                        </div>
                        <div className="text-[11px] sm:text-xs font-bold tabular-nums mt-1" dir="ltr">
                          {item.start12}
                        </div>
                        <div
                          className="text-[9px] sm:text-[10px] text-emerald-100/75 tabular-nums mt-0.5"
                          dir="ltr"
                        >
                          تا {item.end12}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-center text-emerald-100/75">
                    طلوعِ آفتاب: <span className="tabular-nums text-[#d4af37]" dir="ltr">{formatTo12Hour(prayerData?.sunrise24 || '06:00')}</span>
                    <span aria-hidden="true"> · </span>
                    مکروہ زوال کے وقت (ظہر سے 10 منٹ قبل) نماز ممنوع ہے
                  </p>
                </div>
              ) : (
                <div className="text-center text-xs text-emerald-200/70 py-3">
                  نوافل کے اوقات لوڈ ہو رہے ہیں...
                </div>
              )
            )}

            {/* TAB 3: خانقاہ دارالفلاح جماعت کے اوقات (Editable & Persistent) */}
            {prayerTab === 'jamaat' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <span className="text-xs text-amber-200 font-semibold">
                    خانقاہ دارالفلاح — باجماعت نماز کے اوقات
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditingJamaat((prev) => !prev)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#d4af37]/20 hover:bg-[#d4af37]/30 border border-[#d4af37]/50 text-[#d4af37] text-[11px] font-bold cursor-pointer"
                    >
                      {isEditingJamaat ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                      <span>{isEditingJamaat ? 'محفوظ / بند کریں' : 'اوقات تبدیل کریں'}</span>
                    </button>
                    {isEditingJamaat && (
                      <button
                        onClick={() => {
                          setJamaatSchedule(DEFAULT_JAMAAT_SCHEDULE);
                          onNotify('جماعت کے اوقات ڈیفالٹ سیٹنگ پر بحال کر دیے گئے۔');
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-emerald-100 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>ڈیفالٹ</span>
                      </button>
                    )}
                  </div>
                </div>

                {!isEditingJamaat ? (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
                    {jamaatCards.map((item) => (
                      <div
                        key={item.key}
                        className="rounded-xl py-2.5 px-1.5 text-center border bg-[#d4af37]/[0.10] border-[#d4af37]/30 text-emerald-50"
                      >
                        <div className="text-[11px] sm:text-xs font-bold text-[#d4af37]">
                          {item.name}
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-[#00ff99] tabular-nums mt-1" dir="ltr">
                          {item.resolved12}
                        </div>
                        <div className="text-[9px] text-emerald-100/70 mt-0.5">
                          {item.mode === 'custom' || item.key === 'Jummah'
                            ? 'مقررہ وقت'
                            : `+${item.offsetMinutes} منٹ بعد`}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-black/30 p-3 rounded-2xl border border-[#d4af37]/40">
                    {jamaatCards.map((item) => (
                      <div
                        key={item.key}
                        className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs"
                      >
                        <span className="font-bold text-[#d4af37] min-w-[78px]">{item.name}</span>

                        {item.key !== 'Jummah' && (
                          <select
                            value={item.mode}
                            onChange={(e) => {
                              const mode = e.target.value as 'auto' | 'custom';
                              setJamaatSchedule((prev) => ({
                                ...prev,
                                [item.key]: { ...prev[item.key], mode },
                              }));
                            }}
                            className="bg-[#062214] text-white border border-[#d4af37]/40 rounded-lg px-2 py-1 text-[11px]"
                          >
                            <option value="auto">اذان کے بعد (منٹ)</option>
                            <option value="custom">مقررہ وقت</option>
                          </select>
                        )}

                        {item.mode === 'auto' && item.key !== 'Jummah' ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={1}
                              max={120}
                              value={item.offsetMinutes}
                              onChange={(e) => {
                                const val = Math.max(1, Math.min(120, parseInt(e.target.value || '10', 10)));
                                setJamaatSchedule((prev) => ({
                                  ...prev,
                                  [item.key]: { ...prev[item.key], offsetMinutes: val },
                                }));
                              }}
                              className="w-14 bg-white text-[#11261b] rounded-lg px-2 py-1 text-xs font-bold text-center"
                            />
                            <span className="text-[11px] opacity-80">منٹ</span>
                          </div>
                        ) : (
                          <input
                            type="time"
                            value={item.customTime24}
                            onChange={(e) => {
                              setJamaatSchedule((prev) => ({
                                ...prev,
                                [item.key]: { ...prev[item.key], customTime24: e.target.value },
                              }));
                            }}
                            className="bg-white text-[#11261b] rounded-lg px-2 py-1 text-xs font-bold"
                            dir="ltr"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mixlr Live Bayan Status & Notification Box (Inside Clock Box) */}
          <div className="rounded-2xl bg-black/25 border border-[#d4af37]/45 p-3.5 sm:p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 text-[#d4af37] flex items-center justify-center shrink-0">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#d4af37]">
                    لائیو بیان (Mixlr)
                  </h2>
                  <p className="text-xs text-emerald-100/80">
                    اس وقت کوئی لائیو بیان نشر نہیں ہو رہا — نشر ہوتے ہی یہاں ظاہر ہوگا
                  </p>
                </div>
              </div>
            </div>

            {/* Compact Live Notification Email Bar */}
            <div className="border-t border-white/10 pt-2.5 text-center">
              {savedNotifyEmail && !showNotifyForm ? (
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#00ff99]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>لائیو نوٹیفیکیشن فعال ہے: {savedNotifyEmail}</span>
                  <button
                    onClick={() => {
                      setNotifyEmailInput(savedNotifyEmail);
                      setShowNotifyForm(true);
                    }}
                    className="text-[#d4af37] hover:underline text-[11px] cursor-pointer"
                  >
                    تبدیل کریں
                  </button>
                  <span aria-hidden="true" className="text-white/30">·</span>
                  <button
                    onClick={handleClearNotify}
                    className="text-rose-300 hover:underline text-[11px] cursor-pointer"
                  >
                    بند کریں
                  </button>
                </div>
              ) : !showNotifyForm ? (
                <button
                  onClick={() => setShowNotifyForm(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#051a0f] text-xs font-semibold transition-all cursor-pointer min-h-[36px]"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>لائیو بیان نوٹیفیکیشن آن کریں</span>
                </button>
              ) : (
                <form
                  onSubmit={handleSaveNotify}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-black/30 p-2 rounded-xl"
                >
                  <input
                    type="email"
                    value={notifyEmailInput}
                    onChange={(e) => setNotifyEmailInput(e.target.value)}
                    placeholder="اپنی Gmail یہاں لکھیں..."
                    required
                    dir="ltr"
                    className="flex-1 px-3 py-2 rounded-lg bg-white text-[#11261b] text-xs outline-none placeholder-gray-500 text-right"
                  />
                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-[#00ff99] hover:bg-[#33ffad] text-[#051a0f] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      آن کریں
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNotifyForm(false)}
                      className="px-3 py-2 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      بعد میں
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* 3B. Separate Beautiful Box: Latest Uploaded Bayanat */}
        <section
          className={`rounded-3xl border-2 border-[#d4af37]/60 p-4 sm:p-5 shadow-md space-y-3.5 transition-colors ${
            isDark
              ? 'bg-[#0b1f14] text-emerald-50'
              : 'bg-white text-[#11261b]'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d4af37]/25 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isDark ? 'bg-[#d4af37]/15 text-[#d4af37]' : 'bg-[#ebf2ee] text-[#064326]'
                }`}
              >
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#064326] dark:text-[#d4af37]">
                  تازہ ترین اپلوڈ شدہ بیانات
                </h2>
                <p className="text-[11px] opacity-75">
                  سب سے آخر میں شامل کیے گئے بیانات (7 دن تک &quot;نیا&quot; نشان کے ساتھ)
                </p>
              </div>
            </div>

            <button
              onClick={onOpenLibrary}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#064326] dark:text-[#00ff99] hover:underline cursor-pointer whitespace-nowrap"
            >
              <span>تمام بیانات دیکھیں</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {latestUploadedBayanat.map((bayan) => {
              const isPlaying = currentPlayingBayanId === bayan.id;
              const isDownloading = activeDownloadIds.has(bayan.id);
              const isNew = isBayanNew(bayan);
              const dateLabel = formatBayanDateUrdu(bayan);

              return (
                <div
                  key={bayan.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 transition-all ${
                    isPlaying
                      ? isDark
                        ? 'bg-[#0f3822] border-[#00ff99]'
                        : 'bg-[#ebf2ee] border-[#064326]'
                      : isDark
                      ? 'bg-[#0e2418] border-[#d4af37]/30 hover:border-[#d4af37]'
                      : 'bg-[#f8faf9] border-emerald-900/15 hover:border-[#d4af37]'
                  }`}
                >
                  <button
                    onClick={() => onPlayAudio(bayan)}
                    className="flex-1 min-w-0 text-right cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      {isNew && (
                        <span className="px-1.5 py-0.5 rounded bg-[#064326] dark:bg-[#00ff99] text-white dark:text-[#051a0f] text-[10px] font-extrabold shrink-0">
                          نیا
                        </span>
                      )}
                      <p className="text-xs sm:text-sm font-bold truncate">
                        {bayan.urduTitle || bayan.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] opacity-75 mt-1 truncate">
                      <span className="text-[#8c6514] dark:text-[#d4af37] font-semibold truncate">
                        {bayan.collectionUrdu}
                      </span>
                      {dateLabel && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums shrink-0">{dateLabel}</span>
                        </>
                      )}
                      {bayan.length && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-0.5 tabular-nums shrink-0">
                            <Clock className="w-3 h-3" />
                            {Math.max(1, Math.floor(parseFloat(bayan.length) / 60))} منٹ
                          </span>
                        </>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onPlayAudio(bayan)}
                      className={`min-w-[38px] min-h-[38px] rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                        isPlaying
                          ? 'bg-[#00ff99] text-[#051a0f]'
                          : 'bg-[#064326] hover:bg-[#095c34] text-white dark:bg-[#d4af37] dark:text-[#051a0f]'
                      }`}
                      title="بیان سنیں"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>

                    <button
                      onClick={() => downloadSingleBayan(bayan, onNotify)}
                      disabled={isDownloading}
                      className={`min-w-[38px] min-h-[38px] rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer disabled:opacity-60 ${
                        isDark
                          ? 'bg-white/10 hover:bg-emerald-600 text-white'
                          : 'bg-emerald-900/10 hover:bg-[#064326] text-[#064326] hover:text-white'
                      }`}
                      title="ڈاؤنلوڈ کریں (اسی صفحے پر)"
                    >
                      {isDownloading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => shareBayanOnWhatsApp(bayan)}
                      className="min-w-[38px] min-h-[38px] rounded-xl bg-[#25D366] hover:bg-[#1faa4e] text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                      title="واٹس ایپ پر شیئر کریں"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Dynamic Grid Folders (All Blogger Posts + Core Folders without technical labels) */}
        <section className="space-y-3">
          <div className="px-1">
            <h2 className="text-base sm:text-lg font-bold text-[#064326] dark:text-[#d4af37]">
              فولڈرز اور اسلامی لائبریری
            </h2>
            <p className="text-[11px] opacity-70">
              تمام بیانات، کتب، اعلانات اور خانقاہ کے شعبہ جات خودکار طور پر یہاں ظاہر ہوتے ہیں
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3.5">
            {coreFolders.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={`min-h-[116px] p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] cursor-pointer ${
                    isDark
                      ? 'bg-[#0e2217] border-[#d4af37]/25 hover:border-[#d4af37] text-emerald-50 shadow-sm'
                      : 'bg-white border-emerald-950/10 hover:border-[#d4af37] text-[#11261b] shadow-xs hover:shadow-md'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      isDark ? 'bg-white/[0.06]' : 'bg-[#f4f7f6]'
                    } ${item.accent}`}
                  >
                    <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold leading-snug line-clamp-2">
                    {item.label}
                  </span>
                  <span className="text-[11px] opacity-65 font-medium line-clamp-1">
                    {item.subLabel}
                  </span>
                </button>
              );
            })}

            {bloggerLiveFolders.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={`min-h-[116px] p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] cursor-pointer relative ${
                    isDark
                      ? 'bg-[#0e2217] border-[#d4af37]/30 hover:border-[#d4af37] text-emerald-50 shadow-sm'
                      : 'bg-white border-emerald-950/10 hover:border-[#d4af37] text-[#11261b] shadow-xs hover:shadow-md'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      isDark ? 'bg-white/[0.06]' : 'bg-[#f4f7f6]'
                    } ${item.accent}`}
                  >
                    <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold leading-snug line-clamp-2">
                    {item.label}
                  </span>
                  <span className="text-[11px] opacity-65 font-medium line-clamp-1">
                    {item.subLabel}
                  </span>
                  {item.publishedDate && (
                    <span className="inline-flex items-center gap-1 text-[10px] opacity-60 tabular-nums">
                      <Calendar className="w-3 h-3" />
                      {item.publishedDate}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* 5. Clean Website-Style Footer Cards */}
        <footer
          className={`rounded-3xl border-2 border-[#d4af37]/35 p-4 sm:p-5 space-y-4 ${
            isDark
              ? 'bg-[#0b1c13] text-emerald-50'
              : 'bg-white text-[#11261b] shadow-xs'
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Card 1 */}
            <div
              className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2.5 ${
                isDark
                  ? 'bg-[#0e2418] border-[#d4af37]/25'
                  : 'bg-[#f8faf9] border-emerald-900/10'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[#064326] dark:text-[#d4af37]">
                  <Landmark className="w-4 h-4 shrink-0" />
                  <h3 className="text-sm font-bold">تعارفِ خانقاہ و شیخ</h3>
                </div>
                <p className="text-xs opacity-80 leading-relaxed">
                  شیخ الحدیث حضرت مولانا پیر محمد جمشید نقشبندی مجددی دامت برکاتہم کی سرپرستی میں دینی و اصلاحی مرکز۔
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={onOpenIntroKhanqah}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#064326] hover:bg-[#095c34] text-white text-[11px] font-bold transition-colors cursor-pointer"
                >
                  تعارفِ خانقاہ
                </button>
                <button
                  onClick={onOpenIntroSheikh}
                  className="flex-1 py-1.5 px-2.5 rounded-lg border border-[#d4af37]/60 text-[#064326] dark:text-[#d4af37] hover:bg-[#d4af37]/15 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  تعارفِ شیخ
                </button>
              </div>
            </div>

            {/* Card 2 */}
            <div
              className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2.5 ${
                isDark
                  ? 'bg-[#0e2418] border-[#d4af37]/25'
                  : 'bg-[#f8faf9] border-emerald-900/10'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[#064326] dark:text-[#d4af37]">
                  <FileText className="w-4 h-4 shrink-0" />
                  <h3 className="text-sm font-bold">شرائط و ضوابط</h3>
                </div>
                <p className="text-xs opacity-80 leading-relaxed">
                  تمام بیانات، دروس اور کتب خالصتاً اصلاحی و دینی اشاعت کے لیے بلا معاوضہ فراہم کی گئی ہیں۔
                </p>
              </div>
              <button
                onClick={onOpenTerms}
                className="w-full py-1.5 px-3 rounded-lg border border-[#064326]/30 dark:border-[#d4af37]/50 text-[#064326] dark:text-[#d4af37] hover:bg-[#064326] hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                شرائط و ضوابط پڑھیں
              </button>
            </div>

            {/* Card 3 */}
            <div
              className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2.5 ${
                isDark
                  ? 'bg-[#0e2418] border-[#d4af37]/25'
                  : 'bg-[#f8faf9] border-emerald-900/10'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[#064326] dark:text-[#d4af37]">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <h3 className="text-sm font-bold">پرائیویسی پالیسی</h3>
                </div>
                <p className="text-xs opacity-80 leading-relaxed">
                  صارفین کی رازداری کا مکمل احترام؛ ایپ اشتہارات سے پاک ہے اور کوئی ذاتی ڈیٹا جمع نہیں کرتی۔
                </p>
              </div>
              <button
                onClick={onOpenPrivacy}
                className="w-full py-1.5 px-3 rounded-lg border border-[#064326]/30 dark:border-[#d4af37]/50 text-[#064326] dark:text-[#d4af37] hover:bg-[#064326] hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                پرائیویسی پالیسی دیکھیں
              </button>
            </div>

            {/* Card 4 */}
            <div
              className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2.5 ${
                isDark
                  ? 'bg-[#0e2418] border-[#d4af37]/25'
                  : 'bg-[#f8faf9] border-emerald-900/10'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[#064326] dark:text-[#d4af37]">
                  <PhoneCall className="w-4 h-4 shrink-0" />
                  <h3 className="text-sm font-bold">رابطہ و آفیشل ایپ</h3>
                </div>
                <p className="text-xs opacity-80 leading-relaxed">
                  آفیشل واٹس ایپ، سوشل میڈیا اور اینڈرائڈ ایپ لنکس:
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <a
                    href={WHATSAPP_DIRECT_CHAT_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-[#25D366] text-white hover:opacity-90 transition-opacity"
                    title="شیخ صاحب سے براہِ راست واٹس ایپ رابطہ"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                  <a
                    href="https://youtube.com/@peermolanamuhammadjamshedn1391"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-[#FF0000] text-white hover:opacity-90 transition-opacity"
                    title="یوٹیوب چینل"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                  <a
                    href="https://www.facebook.com/profile.php?id=100068373408345"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-[#1877F2] text-white hover:opacity-90 transition-opacity"
                    title="فیس بک پیج"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                  <button
                    onClick={onOpenContact}
                    className="px-2.5 py-1.5 rounded-lg border border-[#d4af37]/50 text-[11px] font-bold hover:bg-[#d4af37]/15 cursor-pointer"
                  >
                    مزید رابطہ
                  </button>
                </div>
              </div>

              <a
                href={OFFICIAL_APK_URL}
                download="khanqah-Darul-falah.apk"
                onClick={() => onNotify('آفیشل Android APK ڈاؤنلوڈ شروع ہو گئی ہے...')}
                className="w-full py-2 px-3 rounded-xl bg-[#064326] hover:bg-[#095c34] text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-[#d4af37]/60 shadow-xs transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>اینڈرائڈ APK انسٹال کریں</span>
              </a>
            </div>
          </div>

          <div className="pt-3 border-t border-emerald-900/10 dark:border-white/10 text-center text-xs space-y-2.5">
            <div className="flex justify-center">
              <a
                href={DEVELOPER_WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all active:scale-95 cursor-pointer ${
                  isDark
                    ? 'bg-[#0e291b] border-[#25D366]/50 text-[#00ff99] hover:bg-[#25D366] hover:text-white'
                    : 'bg-[#ebf2ee] border-[#25D366]/50 text-[#064326] hover:bg-[#25D366] hover:text-white'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                <span>رہنمائی یا مشورہ کے لیے اور کاروباری ویب سائٹس یا ایپ بنانے کے لیے یہاں کلک کریں</span>
              </a>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-[#064326] dark:text-[#d4af37]">
                خانقاہ دارالفلاح · تمام حقوق محفوظ ہیں © 2026
              </p>
              <a
                href={DEVELOPER_WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                dir="ltr"
                className="inline-flex items-center gap-1.5 text-[11px] font-medium hover:text-[#25D366] transition-colors cursor-pointer"
                title="واٹس ایپ پر براہِ راست رابطہ کریں"
              >
                <span className="opacity-75">Developed by</span>
                <b className="text-[#064326] dark:text-[#00ff99] underline decoration-[#d4af37]/70 underline-offset-4">
                  Abu-HamadGrfx
                </b>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

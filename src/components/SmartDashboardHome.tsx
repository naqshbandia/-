import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Headphones,
  BookOpen,
  Bell,
  MessageCircle,
  Globe,
  Landmark,
  HeartHandshake,
  Radio,
  Play,
  Download,
  Loader2,
  Clock,
  CheckCircle2,
  ArrowLeft,
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
  RotateCw,
  Folder,
  Megaphone,
  Users,
  BellOff,
} from 'lucide-react';
import {
  SHEIKH_GLASS_BANNER_URL,
  WHATSAPP_DIRECT_CHAT_URL,
  DEVELOPER_WHATSAPP_URL,
  getAppGiftWhatsAppShareUrl,
  BloggerPostTab,
} from '../data/appConfig';
import { CombinedInstallStats } from '../utils/installStatsService';
import { BAYANAT_DATABASE, BayanItem } from '../data/bayanatData';
import { downloadSingleBayan, subscribeToDownloads } from '../utils/downloadHelper';
import {
  isBayanNew,
  formatBayanDateUrdu,
  shareBayanOnWhatsApp,
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
import {
  loadCachedKhanqahSchedule,
  fetchKhanqahScheduleFromGitHubHtml,
  loadCachedTickerMessage,
  fetchKhanqahTickerMessage,
} from '../utils/khanqahScheduleService';
import {
  AppLanguage,
  DEFAULT_LANGUAGE,
  UI_STRINGS,
  getDir,
  getDateLocale,
  getFarzLabel,
  getJamaatLabel,
  getNawafilLabel,
  getDonationLabels,
  getAutoSilentLabels,
} from '../data/translations';

interface Props {
  isDark: boolean;
  lang?: AppLanguage;
  bayanatList?: BayanItem[];
  bloggerTabs?: BloggerPostTab[];
  onRefreshBlogger?: () => void;
  isRefreshingBlogger?: boolean;
  onOpenUrl: (url: string) => void;
  onOpenLibrary: () => void;
  onOpenWhatsAppGroups: () => void;
  onOpenDonations: () => void;
  onOpenAutoSilent?: () => void;
  onOpenIntroKhanqah: () => void;
  onOpenIntroSheikh: () => void;
  onOpenContact: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onPlayAudio: (bayan: BayanItem) => void;
  onNotify: (msg: string) => void;
  currentPlayingBayanId?: string | null;
  installStats?: CombinedInstallStats & { refreshStats: () => void };
}

const NOTIFY_EMAIL_KEY = 'khanqah_live_notify_email_v1';

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
      return Folder;
  }
}

const SlidingBayanTitle: React.FC<{ text: string }> = ({ text }) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const [shouldSlide, setShouldSlide] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      const vp = viewportRef.current;
      const sp = spanRef.current;
      if (!vp || !sp) return;
      setShouldSlide(sp.scrollWidth > vp.clientWidth + 4);
    };

    checkOverflow();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(checkOverflow) : null;
    if (ro && viewportRef.current) ro.observe(viewportRef.current);
    return () => ro?.disconnect();
  }, [text]);

  const durationSec = Math.max(10, Math.min(28, Math.round(text.length * 0.22)));

  return (
    <div
      ref={viewportRef}
      className={`flex-1 min-w-0 overflow-hidden ${shouldSlide ? 'urdu-ticker-viewport' : ''}`}
    >
      <span
        ref={spanRef}
        dir="rtl"
        style={shouldSlide ? { animationDuration: `${durationSec}s` } : undefined}
        className={`text-[11.5px] sm:text-[12.5px] font-bold leading-snug whitespace-nowrap ${
          shouldSlide ? 'urdu-ticker-track' : 'block text-right'
        }`}
      >
        {text}
      </span>
    </div>
  );
};

export const SmartDashboardHome: React.FC<Props> = ({
  isDark,
  lang = DEFAULT_LANGUAGE,
  bayanatList = BAYANAT_DATABASE,
  bloggerTabs = [],
  onRefreshBlogger,
  isRefreshingBlogger = false,
  onOpenUrl,
  onOpenLibrary,
  onOpenWhatsAppGroups,
  onOpenDonations,
  onOpenAutoSilent,
  onOpenIntroKhanqah,
  onOpenIntroSheikh,
  onOpenContact,
  onOpenTerms,
  onOpenPrivacy,
  onPlayAudio,
  onNotify,
  currentPlayingBayanId,
  installStats,
}) => {
  const t = UI_STRINGS[lang];
  const donationLabels = getDonationLabels(lang);
  const autoSilentLabels = getAutoSilentLabels(lang);
  const dir = getDir(lang);
  const [now, setNow] = useState<Date>(() => new Date());
  const [glassBannerError, setGlassBannerError] = useState(false);
  const [tickerMessage, setTickerMessage] = useState<string>(() => loadCachedTickerMessage());

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

  // User's Own Mosque Jama'at Schedule State (stored locally on user's device)
  const [myMosqueName, setMyMosqueName] = useState<string>(() => {
    try {
      return localStorage.getItem('khanqah_user_mosque_name_v1') || 'میری مسجد';
    } catch {
      return 'میری مسجد';
    }
  });
  const [jamaatSchedule, setJamaatSchedule] = useState<Record<JamaatKey, JamaatScheduleItem>>(() => {
    try {
      const saved = localStorage.getItem(JAMAAT_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_JAMAAT_SCHEDULE, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_JAMAAT_SCHEDULE;
  });

  // Khanqah Darul Falah Official Jama'at Schedule (Admin-only via GitHub khanqah-darul-falah-clock.html)
  const [khanqahOfficialSchedule, setKhanqahOfficialSchedule] = useState<
    Record<JamaatKey, JamaatScheduleItem>
  >(() => loadCachedKhanqahSchedule());
  const [isKhanqahSyncedHtml, setIsKhanqahSyncedHtml] = useState(false);
  const [isRefreshingKhanqah, setIsRefreshingKhanqah] = useState(false);

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

  const syncKhanqahScheduleFromHtml = async (notify = false) => {
    setIsRefreshingKhanqah(true);
    try {
      const parsed = await fetchKhanqahScheduleFromGitHubHtml();
      if (parsed) {
        setKhanqahOfficialSchedule(parsed);
        setIsKhanqahSyncedHtml(true);
        if (notify) {
          onNotify(t.khanqahScheduleRefreshed);
        }
      } else if (notify) {
        onNotify(t.khanqahScheduleCached);
      }
    } finally {
      setIsRefreshingKhanqah(false);
    }
  };

  // Fetch Official Khanqah Darul Falah Jama'at times & Ticker Message from GitHub HTML on mount and focus
  useEffect(() => {
    syncKhanqahScheduleFromHtml(false);
    fetchKhanqahTickerMessage().then((msg) => {
      if (msg) setTickerMessage(msg);
    });

    const handleVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchKhanqahTickerMessage().then((msg) => {
          if (msg) setTickerMessage(msg);
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisible);
    return () => document.removeEventListener('visibilitychange', handleVisible);
  }, []);

  // Persist user's local mosque name and Jamaat schedule
  useEffect(() => {
    try {
      localStorage.setItem('khanqah_user_mosque_name_v1', myMosqueName);
    } catch {}
  }, [myMosqueName]);

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

  const khanqahCards = useMemo(() => {
    const order: JamaatKey[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Jummah'];
    return order.map((key) => {
      const item = khanqahOfficialSchedule[key];
      const time24 = resolveJamaatTime24(key, item, prayerData);
      return {
        ...item,
        resolved24: time24,
        resolved12: formatTo12Hour(time24),
      };
    });
  }, [khanqahOfficialSchedule, prayerData]);

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

  const tickerDurationSeconds = useMemo(
    () => Math.max(20, Math.min(60, Math.round(tickerMessage.length * 0.28))),
    [tickerMessage]
  );

  const handleSaveNotify = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = notifyEmailInput.trim();
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      onNotify(t.invalidEmailToast);
      return;
    }
    try {
      localStorage.setItem(NOTIFY_EMAIL_KEY, trimmed);
    } catch {}
    setSavedNotifyEmail(trimmed);
    setShowNotifyForm(false);
    setNotifyEmailInput('');
    onNotify(t.savedEmailToast);
  };

  const handleClearNotify = () => {
    try {
      localStorage.removeItem(NOTIFY_EMAIL_KEY);
    } catch {}
    setSavedNotifyEmail('');
    onNotify(t.clearedEmailToast);
  };

  // Native App-Only Utility Cards (Archive.org MP3 Library + Official WhatsApp Groups)
  const coreFolders = useMemo(
    () => [
      {
        id: 'audio-library',
        label: t.audioLibraryTitle,
        subLabel: `${bayanatList.length} ${t.audioLibrarySubSuffix}`,
        icon: Headphones,
        accent: 'text-[#064326] dark:text-[#00ff99]',
        onClick: onOpenLibrary,
      },
      {
        id: 'whatsapp-groups',
        label: t.whatsappGroupsTitle,
        subLabel: t.whatsappGroupsSub,
        icon: MessageCircle,
        accent: 'text-[#15803d] dark:text-emerald-400',
        onClick: onOpenWhatsAppGroups,
      },
      {
        id: 'donations-sadaqah',
        label: donationLabels.folderTitle,
        subLabel: donationLabels.folderSub,
        icon: HeartHandshake,
        accent: 'text-rose-600 dark:text-[#d4af37]',
        onClick: onOpenDonations,
      },
      ...(onOpenAutoSilent
        ? [
            {
              id: 'auto-silent-mode',
              label: autoSilentLabels.folderTitle,
              subLabel: autoSilentLabels.folderSub,
              icon: BellOff,
              accent: 'text-[#064326] dark:text-[#00ff99]',
              onClick: onOpenAutoSilent,
            },
          ]
        : []),
    ],
    [
      bayanatList.length,
      onOpenLibrary,
      onOpenWhatsAppGroups,
      onOpenDonations,
      onOpenAutoSilent,
      t.audioLibraryTitle,
      t.audioLibrarySubSuffix,
      t.whatsappGroupsTitle,
      t.whatsappGroupsSub,
      donationLabels.folderTitle,
      donationLabels.folderSub,
      autoSilentLabels.folderTitle,
      autoSilentLabels.folderSub,
    ]
  );

  // Live Blogger Posts Grid (1 Blogger post = 1 folder card, synced automatically)
  const bloggerLiveFolders = useMemo(() => {
    const list: {
      id: string;
      label: string;
      subLabel: string;
      icon: React.ComponentType<{ className?: string }>;
      accent: string;
      publishedDate?: string;
      onClick: () => void;
    }[] = [];

    const seenId = new Set<string>();
    for (const tab of bloggerTabs) {
      if (tab.id === 'blogger-home') continue;
      if (seenId.has(tab.id)) continue;
      seenId.add(tab.id);

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

  return (
    <div
      className="kdf-app-canvas flex-1 w-full h-full overflow-y-auto transition-colors duration-200"
      dir={dir}
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-5 py-3 space-y-3">
        {/* 1. Top Sheikh Title Calligraphy Banner (Glass Crystal Card PNG Showcase) */}
        <section
          className={`rounded-3xl border-2 border-[#d4af37]/80 overflow-hidden shadow-md transition-colors ${
            isDark ? 'bg-[#0c2317]' : 'bg-white'
          }`}
        >
          {!glassBannerError ? (
            <div className="w-full flex items-center justify-center bg-gradient-to-l from-[#064326]/10 via-transparent to-[#064326]/10 px-4 py-3 sm:py-4">
              <img
                src={SHEIKH_GLASS_BANNER_URL}
                alt={t.sheikhFullTitle}
                onError={() => setGlassBannerError(true)}
                className="max-h-36 sm:max-h-44 md:max-h-48 w-full max-w-2xl object-contain mx-auto drop-shadow-sm"
              />
            </div>
          ) : (
            <div className="py-5 px-4 text-center bg-[#064326] text-white">
              <p className="text-lg sm:text-xl font-bold text-[#d4af37]">
                {t.appName} ({t.appSubtitle})
              </p>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1">
                {t.sheikhFullTitle}
              </p>
            </div>
          )}
        </section>

        {/* 2. Single-Line Urdu Scrolling Ticker Bar (Synced from GitHub khanqah-message.html) */}
        <section
          aria-label={t.tickerBadge}
          className={`rounded-2xl border-2 border-[#d4af37]/80 shadow-sm overflow-hidden flex items-center transition-colors ${
            isDark ? 'bg-[#0c2317] text-emerald-50' : 'bg-white text-[#064326]'
          }`}
        >
          <div className="bg-[var(--kdf-primary,#064326)] text-[var(--kdf-accent,#d4af37)] px-3 py-2.5 flex items-center gap-1.5 text-xs font-bold shrink-0 border-e border-[var(--kdf-accent,#d4af37)]/40">
            <Megaphone className="w-3.5 h-3.5 text-[var(--kdf-led,#00ff99)] shrink-0" />
            <span>{t.tickerBadge}</span>
          </div>

          <div className="urdu-ticker-viewport flex-1 min-w-0 py-2 px-1">
            <span
              dir="rtl"
              style={{ animationDuration: `${tickerDurationSeconds}s` }}
              className="urdu-ticker-track text-xs sm:text-sm font-bold text-[#064326] dark:text-[#d4af37]"
            >
              {tickerMessage}
            </span>
          </div>
        </section>

        {/* 3. Standalone Smart Clock & Prayer Timings Display Box */}
        <section className="islamic-panel-pattern border-2 border-[#d4af37] rounded-3xl p-4 sm:p-5 text-white shadow-xl space-y-4">
          {/* Live Clock & Hijri Date */}
          <div className="text-center py-1">
            <div
              className="text-3xl sm:text-4xl font-bold text-[#00ff99] tracking-wider tabular-nums font-sans"
              dir="ltr"
            >
              {formattedClock}
            </div>
            <div className="text-base sm:text-lg font-bold text-[#d4af37] mt-1">
              {prayerData?.hijriDate || t.hijriLoading}
            </div>
            <div className="text-xs text-emerald-100/75 mt-0.5 tabular-nums">
              {now.toLocaleDateString(getDateLocale(lang), {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>

          {/* 3 Tab Buttons Right Above Prayer Cards */}
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
                {t.tabFarz}
              </button>
              <button
                onClick={() => setPrayerTab('nawafil')}
                className={`py-2 px-1.5 rounded-xl text-[11px] sm:text-sm font-bold border transition-all cursor-pointer whitespace-nowrap ${
                  prayerTab === 'nawafil'
                    ? 'bg-[#d4af37] text-[#051a0f] border-[#d4af37] shadow-md'
                    : 'bg-white/[0.06] text-emerald-100 border-[#d4af37]/30 hover:bg-white/10'
                }`}
              >
                {t.tabNawafil}
              </button>
              <button
                onClick={() => setPrayerTab('jamaat')}
                className={`py-2 px-1.5 rounded-xl text-[11px] sm:text-sm font-bold border transition-all cursor-pointer whitespace-nowrap ${
                  prayerTab === 'jamaat'
                    ? 'bg-[#d4af37] text-[#051a0f] border-[#d4af37] shadow-md'
                    : 'bg-white/[0.06] text-emerald-100 border-[#d4af37]/30 hover:bg-white/10'
                }`}
              >
                {t.tabJamaat}
              </button>
            </div>

            {/* TAB 1: Farz Prayers */}
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
                          {getFarzLabel(lang, p.key)}
                          {isNext && (
                            <span className="block text-[9px] text-[#00ff99] mt-0.5">
                              {t.nextPrayer}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] sm:text-xs font-bold tabular-nums mt-1" dir="ltr">
                          {p.start12}
                        </div>
                        <div
                          className="text-[9px] sm:text-[10px] text-emerald-100/70 tabular-nums mt-0.5"
                          dir="ltr"
                        >
                          {t.untilPrefix} {p.end12}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-xs text-emerald-200/70 py-3">
                  {t.farzLoading}
                </div>
              )
            )}

            {/* TAB 2: Nawafil & Sunnah */}
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
                          {getNawafilLabel(lang, item.key)}
                        </div>
                        <div className="text-[11px] sm:text-xs font-bold tabular-nums mt-1" dir="ltr">
                          {item.start12}
                        </div>
                        <div
                          className="text-[9px] sm:text-[10px] text-emerald-100/75 tabular-nums mt-0.5"
                          dir="ltr"
                        >
                          {t.untilPrefix} {item.end12}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-center text-emerald-100/75">
                    {t.sunriseLabel}{' '}
                    <span className="tabular-nums text-[#d4af37]" dir="ltr">
                      {formatTo12Hour(prayerData?.sunrise24 || '06:00')}
                    </span>
                    <span aria-hidden="true"> · </span>
                    {t.zawalNote}
                  </p>
                </div>
              ) : (
                <div className="text-center text-xs text-emerald-200/70 py-3">
                  {t.nawafilLoading}
                </div>
              )
            )}

            {/* TAB 3: User Mosque Jamaat Times */}
            {prayerTab === 'jamaat' && (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <span className="text-xs text-amber-200 font-semibold">
                    {myMosqueName === 'میری مسجد' ? t.myMosqueDefault : myMosqueName || t.myMosqueDefault} — {t.myMosqueScheduleLabel}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditingJamaat((prev) => !prev)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#d4af37]/20 hover:bg-[#d4af37]/30 border border-[#d4af37]/50 text-[#d4af37] text-[11px] font-bold cursor-pointer"
                    >
                      {isEditingJamaat ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                      <span>{isEditingJamaat ? t.saveCloseBtn : t.editTimesBtn}</span>
                    </button>
                    {isEditingJamaat && (
                      <button
                        onClick={() => {
                          setJamaatSchedule(DEFAULT_JAMAAT_SCHEDULE);
                          setMyMosqueName(t.myMosqueDefault);
                          onNotify(t.resetDefaultNotice);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-emerald-100 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{t.resetDefaultBtn}</span>
                      </button>
                    )}
                  </div>
                </div>

                {!isEditingJamaat ? (
                  <div className="grid grid-cols-6 gap-0.5 sm:gap-1.5">
                    {jamaatCards.map((item) => (
                      <div
                        key={item.key}
                        className="rounded-lg sm:rounded-xl py-1.5 sm:py-2 px-0.5 sm:px-1 text-center border bg-[#d4af37]/[0.10] border-[#d4af37]/30 text-emerald-50 overflow-hidden"
                      >
                        <div className="text-[9.5px] sm:text-xs font-bold text-[#d4af37] whitespace-nowrap">
                          {getJamaatLabel(lang, item.key)}
                        </div>
                        <div className="text-[8px] sm:text-xs font-bold text-[#00ff99] tabular-nums mt-0.5 sm:mt-1 whitespace-nowrap tracking-tighter sm:tracking-normal" dir="ltr">
                          {item.resolved12}
                        </div>
                        <div className="text-[7.5px] sm:text-[9px] text-emerald-100/70 mt-0.5 whitespace-nowrap">
                          {item.mode === 'custom' || item.key === 'Jummah'
                            ? t.fixedBadge
                            : `+${item.offsetMinutes} ${t.minuteUnit}`}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2.5 bg-black/30 p-3 rounded-2xl border border-[#d4af37]/40">
                    <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-white/10">
                      <label className="text-[11px] font-bold text-[#d4af37]">{t.mosqueNameLabel}</label>
                      <input
                        type="text"
                        value={myMosqueName}
                        onChange={(e) => setMyMosqueName(e.target.value)}
                        maxLength={60}
                        placeholder={t.mosqueNamePlaceholder}
                        className="flex-1 min-w-[160px] bg-white text-[#11261b] rounded-lg px-2.5 py-1 text-xs font-bold outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {jamaatCards.map((item) => (
                        <div
                          key={item.key}
                          className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs"
                        >
                          <span className="font-bold text-[#d4af37] min-w-[78px]">
                            {getJamaatLabel(lang, item.key)} {t.jamaatSuffix}
                          </span>

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
                              <option value="auto">{t.modeAutoLabel}</option>
                              <option value="custom">{t.modeCustomLabel}</option>
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
                              <span className="text-[11px] opacity-80">{t.minuteUnit}</span>
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
                  </div>
                )}
              </div>
            )}

            {/* Official Khanqah Darul Falah Jama'at Schedule — Single Row */}
            <div className="pt-2.5 border-t border-[#d4af37]/25 space-y-1.5">
              <div className="flex items-center justify-between gap-2 px-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Landmark className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                  <span className="text-[11px] sm:text-xs font-bold text-[#d4af37] truncate">
                    {t.khanqahScheduleTitle}
                  </span>
                  {isKhanqahSyncedHtml && (
                    <span className="px-1.5 py-0.5 rounded bg-[#00ff99]/15 border border-[#00ff99]/35 text-[#00ff99] text-[9px] font-bold shrink-0">
                      {t.officialBadge}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => syncKhanqahScheduleFromHtml(true)}
                  disabled={isRefreshingKhanqah}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.14] border border-[#d4af37]/30 text-[10px] text-amber-100 cursor-pointer disabled:opacity-50 shrink-0"
                  title={t.refreshBtn}
                >
                  <RotateCw className={`w-3 h-3 text-[#d4af37] ${isRefreshingKhanqah ? 'animate-spin' : ''}`} />
                  <span>{t.refreshBtn}</span>
                </button>
              </div>

              {/* Single-line 6-card horizontal strip */}
              <div className="grid grid-cols-6 gap-0.5 sm:gap-1.5">
                {khanqahCards.map((item) => (
                  <div
                    key={`khanqah-row-${item.key}`}
                    className="rounded-lg py-1.5 px-0.5 sm:px-1 text-center border bg-[#042414]/90 border-[#d4af37]/35 text-emerald-50 overflow-hidden"
                  >
                    <div className="text-[9.5px] sm:text-xs font-bold text-[#d4af37] whitespace-nowrap">
                      {getJamaatLabel(lang, item.key)}
                    </div>
                    <div
                      className="text-[8px] sm:text-xs font-bold text-[#00ff99] tabular-nums mt-0.5 whitespace-nowrap tracking-tighter sm:tracking-normal"
                      dir="ltr"
                    >
                      {item.resolved12}
                    </div>
                    <div className="text-[7.5px] sm:text-[9px] text-emerald-100/70 whitespace-nowrap">
                      {item.mode === 'custom' || item.key === 'Jummah'
                        ? t.fixedBadge
                        : `+${item.offsetMinutes} ${t.minuteUnit}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 3A. Standalone Live Audio Broadcast Box (Mixlr) */}
        <section
          className={`rounded-3xl border-2 border-[#d4af37]/75 shadow-md overflow-hidden transition-colors ${
            isDark
              ? 'bg-gradient-to-br from-[#0b1f14] via-[#08170f] to-[#0f291c] text-emerald-50'
              : 'bg-white text-[#11261b]'
          }`}
        >
          <div className="p-3 sm:p-4 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#064326] border border-[#d4af37]/60 text-[#00ff99] flex items-center justify-center shrink-0 shadow-sm">
                  <Radio className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-[#064326] dark:text-[#d4af37]">
                    {t.mixlrTitle}
                  </h2>
                  <p className="text-[11px] opacity-80 leading-snug">
                    {t.mixlrSubtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNotify(t.mixlrOfflineToast)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#064326] hover:bg-[#095c34] text-white border border-[#d4af37]/65 text-[11px] font-bold shadow-sm transition-all active:scale-95 shrink-0 cursor-pointer min-h-[38px]"
              >
                <Headphones className="w-3.5 h-3.5 text-[#00ff99] shrink-0" />
                <span>{t.mixlrBtn}</span>
              </button>
            </div>

            {/* Live Notification Email Bar */}
            <div className="border-t border-[#d4af37]/20 pt-2.5 text-center">
              {savedNotifyEmail && !showNotifyForm ? (
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#064326] dark:text-[#00ff99] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.liveNotifyActive} {savedNotifyEmail}</span>
                  <button
                    onClick={() => {
                      setNotifyEmailInput(savedNotifyEmail);
                      setShowNotifyForm(true);
                    }}
                    className="text-[#8c6514] dark:text-[#d4af37] hover:underline text-[10.5px] cursor-pointer"
                  >
                    {t.changeBtn}
                  </button>
                  <span aria-hidden="true" className="opacity-40">·</span>
                  <button
                    onClick={handleClearNotify}
                    className="text-rose-600 dark:text-rose-300 hover:underline text-[10.5px] cursor-pointer"
                  >
                    {t.turnOffBtn}
                  </button>
                </div>
              ) : !showNotifyForm ? (
                <button
                  onClick={() => setShowNotifyForm(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-[#064326]/35 dark:border-[#d4af37]/70 text-[#064326] dark:text-[#d4af37] hover:bg-[#064326] hover:text-white dark:hover:bg-[#d4af37] dark:hover:text-[#051a0f] text-[11px] font-bold transition-all cursor-pointer min-h-[36px]"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{t.enableLiveNotifyBtn}</span>
                </button>
              ) : (
                <form
                  onSubmit={handleSaveNotify}
                  className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-xl border ${
                    isDark ? 'bg-black/30 border-[#d4af37]/30' : 'bg-[#f4f7f6] border-emerald-900/15'
                  }`}
                >
                  <input
                    type="email"
                    value={notifyEmailInput}
                    onChange={(e) => setNotifyEmailInput(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    required
                    dir="ltr"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white text-[#11261b] text-xs outline-none placeholder-gray-500 border border-emerald-900/15"
                  />
                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-lg bg-[#064326] dark:bg-[#00ff99] hover:bg-[#095c34] dark:hover:bg-[#33ffad] text-white dark:text-[#051a0f] text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap min-h-[34px]"
                    >
                      {t.turnOnBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNotifyForm(false)}
                      className="px-3 py-1.5 rounded-lg text-[11px] opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap min-h-[34px]"
                    >
                      {t.laterBtn}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* 3B. Compact Box: Latest Uploaded Bayanat */}
        <section
          className={`rounded-3xl border-2 border-[#d4af37]/60 p-3 sm:p-4 shadow-md space-y-2.5 transition-colors ${
            isDark
              ? 'bg-[#0b1f14] text-emerald-50'
              : 'bg-white text-[#11261b]'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d4af37]/20 pb-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isDark ? 'bg-[#d4af37]/15 text-[#d4af37]' : 'bg-[#ebf2ee] text-[#064326]'
                }`}
              >
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-[13px] sm:text-sm font-bold text-[#064326] dark:text-[#d4af37]">
                  {t.latestBayanatTitle}
                </h2>
                <p className="text-[10px] opacity-75">
                  {t.latestBayanatSub}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenLibrary}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#064326] dark:text-[#00ff99] hover:underline cursor-pointer whitespace-nowrap"
            >
              <span>{t.viewAllBayanat}</span>
              <ArrowLeft className={`w-3.5 h-3.5 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {latestUploadedBayanat.map((bayan, idx) => {
              const isPlaying = currentPlayingBayanId === bayan.id;
              const isDownloading = activeDownloadIds.has(bayan.id);
              const showNeonNew = isBayanNew(bayan) || idx < 2;
              const dateLabel = formatBayanDateUrdu(bayan);
              const fullTitle = bayan.urduTitle || bayan.title;

              return (
                <div
                  key={bayan.id}
                  className={`p-2.5 rounded-2xl border flex flex-col gap-1.5 transition-all ${
                    isPlaying
                      ? isDark
                        ? 'bg-[#0f3822] border-[#00ff99] shadow-md'
                        : 'bg-[#ebf2ee] border-[#064326] shadow-md'
                      : isDark
                      ? 'bg-[#0e2418] border-[#d4af37]/30 hover:border-[#d4af37]'
                      : 'bg-[#f8faf9] border-emerald-900/15 hover:border-[#d4af37]'
                  }`}
                >
                  {/* Top Row: Animated Red Neon NEW Badge + Complete Single-Line Title (auto-slides if overflow) */}
                  <button
                    onClick={() => onPlayAudio(bayan)}
                    className={`w-full cursor-pointer space-y-1 ${dir === 'ltr' ? 'text-left' : 'text-right'}`}
                    title={fullTitle}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {showNeonNew && (
                        <span className="khanqah-new-neon-badge px-1.5 py-0.5 rounded text-[9.5px] font-extrabold tracking-wide shrink-0 whitespace-nowrap leading-none">
                          {t.newBadge}
                        </span>
                      )}
                      <SlidingBayanTitle text={fullTitle} />
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] opacity-75 truncate">
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
                            <Clock className="w-2.5 h-2.5" />
                            {Math.max(1, Math.floor(parseFloat(bayan.length) / 60))} {t.minuteUnit}
                          </span>
                        </>
                      )}
                    </div>
                  </button>

                  {/* Bottom Row: Play, Download & Share Buttons BELOW the title (compact single-line) */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-emerald-900/10 dark:border-[#d4af37]/20">
                    <button
                      onClick={() => onPlayAudio(bayan)}
                      className={`h-8 px-1.5 rounded-xl flex items-center justify-center gap-1 text-[10px] sm:text-[10.5px] font-bold whitespace-nowrap transition-all active:scale-95 cursor-pointer ${
                        isPlaying
                          ? 'bg-[#00ff99] text-[#051a0f]'
                          : 'bg-[#064326] hover:bg-[#095c34] text-white dark:bg-[#d4af37] dark:text-[#051a0f]'
                      }`}
                      title={t.playLabel}
                    >
                      <Play className="w-3 h-3 fill-current shrink-0" />
                      <span>{isPlaying ? t.playingLabel : t.playLabel}</span>
                    </button>

                    <button
                      onClick={() => downloadSingleBayan(bayan, onNotify)}
                      disabled={isDownloading}
                      className={`h-8 px-1.5 rounded-xl flex items-center justify-center gap-1 text-[10px] sm:text-[10.5px] font-bold whitespace-nowrap transition-all active:scale-95 cursor-pointer disabled:opacity-60 ${
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
                      onClick={() => shareBayanOnWhatsApp(bayan)}
                      className="h-8 px-1.5 rounded-xl bg-[#25D366] hover:bg-[#1faa4e] text-white flex items-center justify-center gap-1 text-[10px] sm:text-[10.5px] font-bold whitespace-nowrap transition-all active:scale-95 cursor-pointer"
                      title={t.shareLabel}
                    >
                      <Share2 className="w-3 h-3 shrink-0" />
                      <span>{t.shareLabel}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Dynamic Grid Folders */}
        <section className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <h2 className="text-[14px] sm:text-base font-bold text-[#064326] dark:text-[#d4af37]">
              {t.foldersHeading}
            </h2>

            {onRefreshBlogger && (
              <button
                onClick={onRefreshBlogger}
                disabled={isRefreshingBlogger}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all cursor-pointer disabled:opacity-60 ${
                  isDark
                    ? 'bg-[#0e2217] border-[#d4af37]/40 text-[#d4af37] hover:bg-[#133021]'
                    : 'bg-white border-[#064326]/25 text-[#064326] hover:bg-emerald-50 shadow-2xs'
                }`}
                title={t.refreshFoldersTitle}
              >
                <RotateCw className={`w-3 h-3 ${isRefreshingBlogger ? 'animate-spin' : ''}`} />
                <span>{t.refreshBtn}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
            {bloggerLiveFolders.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={`khanqah-folder-card min-h-[96px] p-2.5 rounded-2xl border flex flex-col items-center justify-center text-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] ${
                    isDark
                      ? 'bg-[#0e2217] border-[#d4af37]/30 hover:bg-[#122e1f] text-emerald-50 shadow-sm'
                      : 'bg-white border-emerald-950/10 hover:bg-[#f9fbfa] text-[#11261b] shadow-xs'
                  }`}
                >
                  <div
                    className={`khanqah-folder-icon w-9 h-9 rounded-xl flex items-center justify-center ${
                      isDark ? 'bg-white/[0.06]' : 'bg-[#f4f7f6]'
                    } ${item.accent}`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span className="text-[12px] sm:text-[13px] font-bold leading-snug line-clamp-2">
                    {item.label}
                  </span>
                  <span className="text-[10px] opacity-65 font-medium line-clamp-1">
                    {item.subLabel}
                  </span>
                  {item.publishedDate && (
                    <span className="inline-flex items-center gap-1 text-[9.5px] opacity-60 tabular-nums">
                      <Calendar className="w-2.5 h-2.5" />
                      {item.publishedDate}
                    </span>
                  )}
                </button>
              );
            })}

            {coreFolders.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={`khanqah-folder-card min-h-[96px] p-2.5 rounded-2xl border flex flex-col items-center justify-center text-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] ${
                    isDark
                      ? 'bg-[#0e2217] border-[#d4af37]/25 hover:bg-[#122e1f] text-emerald-50 shadow-sm'
                      : 'bg-white border-emerald-950/10 hover:bg-[#f9fbfa] text-[#11261b] shadow-xs'
                  }`}
                >
                  <div
                    className={`khanqah-folder-icon w-9 h-9 rounded-xl flex items-center justify-center ${
                      isDark ? 'bg-white/[0.06]' : 'bg-[#f4f7f6]'
                    } ${item.accent}`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span className="text-[12px] sm:text-[13px] font-bold leading-snug line-clamp-2">
                    {item.label}
                  </span>
                  <span className="text-[10px] opacity-65 font-medium line-clamp-1">
                    {item.subLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 5. Compact Emerald-Green Folder-Style Footer Boxes + Developer Bar */}
        <footer
          className={`rounded-3xl border-2 border-[#d4af37]/45 p-3.5 sm:p-4 space-y-3.5 ${
            isDark
              ? 'bg-[#0b1c13] text-emerald-50'
              : 'bg-white text-[#11261b] shadow-xs'
          }`}
        >
          {/* Compact Emerald-Green Box Folders (Styled like تعارفِ خانقاہ green folder button) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            <button
              type="button"
              onClick={onOpenIntroKhanqah}
              className="khanqah-folder-card rounded-2xl bg-[var(--kdf-primary,#064326)] hover:opacity-95 text-white border border-[var(--kdf-accent,#d4af37)]/70 p-2.5 flex flex-col items-center justify-center text-center gap-1 shadow-sm cursor-pointer min-h-[78px]"
            >
              <div className="khanqah-folder-icon w-8 h-8 rounded-xl bg-white/10 border border-[#d4af37]/45 text-[#d4af37] flex items-center justify-center shrink-0">
                <Landmark className="w-4 h-4" />
              </div>
              <span className="text-[11.5px] sm:text-xs font-bold leading-tight">
                {t.footerFolderKhanqah}
              </span>
              <span className="text-[9.5px] text-emerald-100/75 leading-none">
                {t.footerFolderKhanqahSub}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenIntroSheikh}
              className="khanqah-folder-card rounded-2xl bg-[var(--kdf-primary,#064326)] hover:opacity-95 text-white border border-[var(--kdf-accent,#d4af37)]/70 p-2.5 flex flex-col items-center justify-center text-center gap-1 shadow-sm cursor-pointer min-h-[78px]"
            >
              <div className="khanqah-folder-icon w-8 h-8 rounded-xl bg-white/10 border border-[#d4af37]/45 text-[#d4af37] flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-[11.5px] sm:text-xs font-bold leading-tight">
                {t.footerFolderSheikh}
              </span>
              <span className="text-[9.5px] text-emerald-100/75 leading-none">
                {t.footerFolderSheikhSub}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenTerms}
              className="khanqah-folder-card rounded-2xl bg-[var(--kdf-primary,#064326)] hover:opacity-95 text-white border border-[var(--kdf-accent,#d4af37)]/70 p-2.5 flex flex-col items-center justify-center text-center gap-1 shadow-sm cursor-pointer min-h-[78px]"
            >
              <div className="khanqah-folder-icon w-8 h-8 rounded-xl bg-white/10 border border-[#d4af37]/45 text-[#d4af37] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[11.5px] sm:text-xs font-bold leading-tight">
                {t.footerFolderTerms}
              </span>
              <span className="text-[9.5px] text-emerald-100/75 leading-none">
                {t.footerFolderTermsSub}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenPrivacy}
              className="khanqah-folder-card rounded-2xl bg-[var(--kdf-primary,#064326)] hover:opacity-95 text-white border border-[var(--kdf-accent,#d4af37)]/70 p-2.5 flex flex-col items-center justify-center text-center gap-1 shadow-sm cursor-pointer min-h-[78px]"
            >
              <div className="khanqah-folder-icon w-8 h-8 rounded-xl bg-white/10 border border-[#d4af37]/45 text-[#d4af37] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[11.5px] sm:text-xs font-bold leading-tight">
                {t.footerFolderPrivacy}
              </span>
              <span className="text-[9.5px] text-emerald-100/75 leading-none">
                {t.footerFolderPrivacySub}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenContact}
              className="khanqah-folder-card col-span-2 sm:col-span-1 rounded-2xl bg-[var(--kdf-primary,#064326)] hover:opacity-95 text-white border border-[var(--kdf-accent,#d4af37)]/70 p-2.5 flex flex-col items-center justify-center text-center gap-1 shadow-sm cursor-pointer min-h-[78px]"
            >
              <div className="khanqah-folder-icon w-8 h-8 rounded-xl bg-white/10 border border-[#d4af37]/45 text-[#d4af37] flex items-center justify-center shrink-0">
                <PhoneCall className="w-4 h-4" />
              </div>
              <span className="text-[11.5px] sm:text-xs font-bold leading-tight">
                {t.footerFolderContact}
              </span>
              <span className="text-[9.5px] text-emerald-100/75 leading-none">
                {t.footerFolderContactSub}
              </span>
            </button>
          </div>

          {/* Public Live Install & Archive.org Download Counter (No Play Store needed) */}
          {installStats && (
            <div
              className={`rounded-2xl border p-3 space-y-2 ${
                isDark
                  ? 'bg-[#08150e] border-[#d4af37]/30 text-emerald-50'
                  : 'bg-[#f6faf7] border-emerald-900/15 text-[#11261b]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#064326] dark:text-[#00ff99] shrink-0" />
                  <span className="text-[11.5px] font-bold text-[#064326] dark:text-[#d4af37]">
                    ایپ ڈاؤنلوڈز اور انسٹال شماریات
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={installStats.refreshStats}
                    className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                    title="تازہ کریں"
                  >
                    <RotateCw
                      className={`w-3.5 h-3.5 ${installStats.isLoading ? 'animate-spin' : ''}`}
                    />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
                <div
                  className={`rounded-xl p-2 border ${
                    isDark ? 'bg-[#0e2318] border-[#d4af37]/20' : 'bg-white border-emerald-900/10'
                  }`}
                >
                  <div className="text-base sm:text-lg font-extrabold tabular-nums text-[#064326] dark:text-[#00ff99]">
                    {installStats.totalInstalledDevices}
                  </div>
                  <div className="text-[10px] font-bold opacity-80">انسٹال شدہ موبائلز</div>
                </div>

                <div
                  className={`rounded-xl p-2 border ${
                    isDark ? 'bg-[#0e2318] border-[#d4af37]/20' : 'bg-white border-emerald-900/10'
                  }`}
                >
                  <div className="text-base sm:text-lg font-extrabold tabular-nums text-[#8c6514] dark:text-[#d4af37]">
                    {installStats.allTimeDownloads ?? '—'}
                  </div>
                  <div className="text-[10px] font-bold opacity-80">کل APK ڈاؤنلوڈز</div>
                </div>

                <div
                  className={`rounded-xl p-2 border ${
                    isDark ? 'bg-[#0e2318] border-[#d4af37]/20' : 'bg-white border-emerald-900/10'
                  }`}
                >
                  <div className="text-base sm:text-lg font-extrabold tabular-nums text-[#064326] dark:text-emerald-300">
                    {installStats.totalApkClicks}
                  </div>
                  <div className="text-[10px] font-bold opacity-80">ایپ APK کلکس</div>
                </div>

                <div
                  className={`rounded-xl p-2 border ${
                    isDark ? 'bg-[#0e2318] border-[#d4af37]/20' : 'bg-white border-emerald-900/10'
                  }`}
                >
                  <div className="text-base sm:text-lg font-extrabold tabular-nums text-[#064326] dark:text-emerald-200 flex items-center justify-center gap-1">
                    <Users className="w-3.5 h-3.5 opacity-75" />
                    <span>{installStats.totalWebUsers}</span>
                  </div>
                  <div className="text-[10px] font-bold opacity-80">مجموعی ڈیوائسز</div>
                </div>
              </div>

              {(installStats.last7DaysDownloads !== null ||
                installStats.last30DaysDownloads !== null) && (
                <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] opacity-75">
                  {installStats.last7DaysDownloads !== null && (
                    <span>گزشتہ 7 دن: {installStats.last7DaysDownloads}</span>
                  )}
                  {installStats.last30DaysDownloads !== null && (
                    <span>گزشتہ 30 دن: {installStats.last30DaysDownloads}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Compact Centered Social Icons + Gift App Share + Developer Bar */}
          <div className="pt-2.5 border-t border-emerald-900/10 dark:border-white/10 text-center text-xs space-y-2.5">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <a
                href={WHATSAPP_DIRECT_CHAT_URL}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-[#25D366] text-white hover:opacity-90 transition-opacity flex items-center justify-center shadow-xs"
                title="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com/@peermolanamuhammadjamshedn1391"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-[#FF0000] text-white hover:opacity-90 transition-opacity flex items-center justify-center shadow-xs"
                title="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=100068373408345"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-[#1877F2] text-white hover:opacity-90 transition-opacity flex items-center justify-center shadow-xs"
                title="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>

              <a
                href={getAppGiftWhatsAppShareUrl()}
                target="_blank"
                rel="noreferrer"
                onClick={() => onNotify(t.giftShareToast)}
                className="py-2 px-3.5 rounded-xl bg-[#064326] hover:bg-[#095c34] text-white text-[11px] font-bold inline-flex items-center justify-center gap-1.5 border border-[#d4af37]/60 shadow-xs transition-all active:scale-95"
                title={t.giftShareAppBtn}
              >
                <Share2 className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                <span>{t.giftShareAppBtn}</span>
              </a>
            </div>

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
                <span>{t.devCtaBtn}</span>
              </a>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-[#064326] dark:text-[#d4af37]">
                {t.copyrightLine}
              </p>
              <a
                href={DEVELOPER_WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                dir="ltr"
                className="inline-flex items-center gap-1.5 text-[11px] font-medium hover:text-[#25D366] transition-colors cursor-pointer"
                title="WhatsApp"
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

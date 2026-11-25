/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { Header } from './components/Header';
import { SmartSearchBar } from './components/SmartSearchBar';
import { HamburgerDrawer } from './components/HamburgerDrawer';
import { SmartDashboardHome } from './components/SmartDashboardHome';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import {
  IntroKhanqahModal,
  IntroSheikhModal,
  ContactModal,
  AboutAppModal,
  WhatsAppGroupsModal,
  TermsModal,
  PrivacyPolicyModal,
  DonationModal,
  ExitAppConfirmModal,
} from './components/Modals';

const WebViewContainer = lazy(() =>
  import('./components/WebViewContainer').then((m) => ({ default: m.WebViewContainer }))
);
const AudioLibraryView = lazy(() =>
  import('./components/AudioLibraryView').then((m) => ({ default: m.AudioLibraryView }))
);
const BooksLibraryView = lazy(() =>
  import('./components/BooksLibraryView').then((m) => ({ default: m.BooksLibraryView }))
);
const NewsUpdatesView = lazy(() =>
  import('./components/NewsUpdatesView').then((m) => ({ default: m.NewsUpdatesView }))
);
const AutoSilentModal = lazy(() =>
  import('./components/AutoSilentModal').then((m) => ({ default: m.AutoSilentModal }))
);
import { loadCachedKhanqahSchedule } from './utils/khanqahScheduleService';
import { PRAYER_CACHE_KEY, PrayerCache } from './utils/prayerEngine';
import { getAndroidBridge, syncAutoSilentFromAppBoot } from './utils/nativeAutoSilent';
import { BayanItem } from './data/bayanatData';
import { 
  GOLD_LIBRARY_URL, 
  BLOGGER_HOME_URL 
} from './data/appConfig';
import { useBloggerTabs } from './utils/bloggerService';
import { useArchiveBayanat, useArchiveBooks, useArchiveNewsPosters } from './utils/archiveService';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { DownloadCloud } from 'lucide-react';
import {
  AppLanguage,
  DEFAULT_LANGUAGE,
  UI_STRINGS,
  getDir,
} from './data/translations';
import {
  IslamicThemePalette,
  applyIslamicThemeToDocument,
  fetchKhanqahRemoteTheme,
  getThemePaletteById,
  loadCachedRemoteTheme,
  loadLocalThemeOverride,
  saveLocalThemeOverride,
} from './utils/themeService';
import { useAppInstallStats } from './utils/installStatsService';
import {
  DisplayModePreference,
  loadDisplayModePreference,
  resolveIsDarkForMode,
  saveDisplayModePreference,
  startAmbientLightWatcher,
} from './utils/displayModeService';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="h-screen w-screen flex flex-col items-center justify-center p-6 text-center bg-[#09150f] text-emerald-50 space-y-4"
        >
          <div className="rounded-2xl border-2 border-[#d4af37] bg-[#0c2317] p-6 max-w-sm w-full space-y-3 shadow-xl">
            <h2 className="text-lg font-bold text-[#d4af37]">خانقاہ دارالفلاح</h2>
            <p className="text-xs text-emerald-100/85">
              صفحہ لوڈ کرنے میں عارضی مسئلہ پیش آیا۔ براہِ کرم دوبارہ لوڈ کریں۔
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 rounded-xl bg-[#064326] hover:bg-[#095c34] text-white border border-[#d4af37] text-xs font-bold cursor-pointer"
            >
              دوبارہ لوڈ کریں
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppContent />
    </AppErrorBoundary>
  );
}

function AppContent() {
  // Home Screen defaults to the clean Islamic Smart Dashboard
  const [activeView, setActiveView] = useState<'dashboard' | 'library' | 'books' | 'news' | 'webview'>('dashboard');
  const [currentUrl, setCurrentUrl] = useState(GOLD_LIBRARY_URL);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedLibraryFolderId, setSelectedLibraryFolderId] = useState<string>('all');
  const [initialReadingBookId, setInitialReadingBookId] = useState<string | null>(null);

  // App Language state: Always starts in Urdu ('ur'); user can switch anytime during use
  const [lang, setLang] = useState<AppLanguage>(DEFAULT_LANGUAGE);

  // Dynamic Blogger Posts & Libraries (used cleanly in search)
  const { tabs, isRefreshing, refreshPosts } = useBloggerTabs();

  // Dynamic Archive.org Bayanat, Books & News/Ishteharat sync
  const { bayanat, archiveFolders, isSyncingArchive, syncArchive } = useArchiveBayanat();
  const { books, isSyncingBooks, syncBooks } = useArchiveBooks();
  const { posters, isSyncingPosters, syncPosters } = useArchiveNewsPosters();

  // Display mode: 'auto' (Normal/Light outdoors & daytime, Dark indoors & night) | 'light' | 'dark'
  const [displayMode, setDisplayMode] = useState<DisplayModePreference>(() =>
    loadDisplayModePreference()
  );
  const [ambientLux, setAmbientLux] = useState<number | null>(null);
  const [clockTick, setClockTick] = useState<number>(() => Date.now());

  const isDark = resolveIsDarkForMode(displayMode, ambientLux, new Date(clockTick));

  // Watch ambient light sensor (when available) + periodic clock check when in 'auto' mode
  useEffect(() => {
    if (displayMode !== 'auto') return;
    const watcher = startAmbientLightWatcher((lux) => {
      setAmbientLux(lux);
    });
    const timer = window.setInterval(() => {
      setClockTick(Date.now());
    }, 60 * 1000);
    return () => {
      watcher?.stop();
      window.clearInterval(timer);
    };
  }, [displayMode]);

  // Remote & Local Islamic Background Color Palette (synced with GitHub khanqah-theme.html)
  const [remoteTheme, setRemoteTheme] = useState<IslamicThemePalette>(() =>
    loadCachedRemoteTheme()
  );
  const [themeOverride, setThemeOverride] = useState<string>(() =>
    loadLocalThemeOverride()
  );

  const activeTheme =
    themeOverride === 'auto' ? remoteTheme : getThemePaletteById(themeOverride);

  // Sync Tailwind dark class + active Islamic CSS theme variables on document root
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    applyIslamicThemeToDocument(activeTheme, isDark);
  }, [isDark, activeTheme]);

  // Fetch active Islamic background theme from GitHub khanqah-theme.html on boot & focus
  useEffect(() => {
    let active = true;
    const syncRemoteTheme = () => {
      fetchKhanqahRemoteTheme().then((parsed) => {
        if (active && parsed) {
          setRemoteTheme(parsed);
        }
      });
    };
    syncRemoteTheme();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncRemoteTheme();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Persistent Archive.org + Firestore App Install & Download Stats
  const installStats = useAppInstallStats();

  // Enforce Mobile Mode only (clean responsive viewport, never zoomed desktop mode)
  useEffect(() => {
    document.documentElement.classList.remove('desktop-mode');
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover'
      );
    }
  }, []);

  // Sync HTML lang and direction attribute whenever language changes
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = getDir(lang);
  }, [lang]);

  // Toast notification message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isIntroKhanqahOpen, setIsIntroKhanqahOpen] = useState(false);
  const [isIntroSheikhOpen, setIsIntroSheikhOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isWhatsAppGroupsOpen, setIsWhatsAppGroupsOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [isAutoSilentOpen, setIsAutoSilentOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('open') === 'auto-silent' || window.location.hash === '#auto-silent';
    } catch {
      return false;
    }
  });
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);

  const cachedPrayerData = React.useMemo<PrayerCache | null>(() => {
    try {
      const raw = localStorage.getItem(PRAYER_CACHE_KEY);
      return raw ? (JSON.parse(raw) as PrayerCache) : null;
    } catch {
      return null;
    }
  }, [isAutoSilentOpen]);

  const cachedKhanqahSchedule = React.useMemo(
    () => loadCachedKhanqahSchedule(),
    [isAutoSilentOpen]
  );

  // Automatically sync 6-prayer Auto-Silent schedules to native Android AlarmManager on boot & resume
  useEffect(() => {
    const syncNativeSchedule = () => {
      syncAutoSilentFromAppBoot(cachedKhanqahSchedule, cachedPrayerData);
    };
    syncNativeSchedule();
    window.addEventListener('kdf-native-resume', syncNativeSchedule);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncNativeSchedule();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('kdf-native-resume', syncNativeSchedule);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [cachedKhanqahSchedule, cachedPrayerData]);

  // Audio player state
  const [currentBayan, setCurrentBayan] = useState<BayanItem | null>(null);

  const handleSelectDisplayMode = (nextMode: DisplayModePreference) => {
    setDisplayMode(nextMode);
    saveDisplayModePreference(nextMode);
    if (nextMode === 'auto') {
      showNotification('اسمارٹ آٹو موڈ آن: باہر روشنی/دن میں نارمل اور رات/کمرے میں ڈارک موڈ!');
    } else if (nextMode === 'light') {
      showNotification('نارمل (لائٹ) موڈ فعال ہو گیا — دھوپ اور باہر واضح پڑھائی کے لیے');
    } else {
      showNotification('ڈارک موڈ فعال ہو گیا — کمرے اور رات کے لیے');
    }
  };

  const toggleTheme = () => {
    const order: DisplayModePreference[] = ['auto', 'light', 'dark'];
    const idx = order.indexOf(displayMode);
    const next = order[(idx + 1) % order.length];
    handleSelectDisplayMode(next);
  };

  const handleChangeLanguage = (nextLang: AppLanguage) => {
    setLang(nextLang);
    showNotification(UI_STRINGS[nextLang].toastLangChanged);
  };

  const showNotification = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  // Keyboard shortcut: Escape closes search or menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mobile Hardware / Gesture Back-Button Navigation:
  // 1) Inside any folder, book reader, poster lightbox, modal, drawer, or search -> returns cleanly toward Home Page instead of exiting.
  // 2) On Home Page -> 1st Back press warns "press again", 2nd Back press shows the Home-or-Exit choice dialog.
  const isExitingRef = useRef(false);
  const lastHomeBackPressRef = useRef(0);
  const backNavStateRef = useRef({
    activeView,
    isMenuOpen,
    isSearchOpen,
    isExitConfirmOpen,
    hasAnyModalOpen: false,
    lang,
  });

  const hasAnyModalOpen =
    isIntroKhanqahOpen ||
    isIntroSheikhOpen ||
    isContactOpen ||
    isAboutOpen ||
    isWhatsAppGroupsOpen ||
    isTermsOpen ||
    isPrivacyOpen ||
    isDonationOpen ||
    isAutoSilentOpen;

  backNavStateRef.current = {
    activeView,
    isMenuOpen,
    isSearchOpen,
    isExitConfirmOpen,
    hasAnyModalOpen,
    lang,
  };

  const armBackGuard = useCallback(() => {
    if (isExitingRef.current) return;
    try {
      if (!window.history.state?.kdfAppTrap) {
        window.history.pushState({ kdfAppTrap: true }, '');
      }
    } catch {
      // Ignore History API restrictions
    }
  }, []);

  // Ensure guard entry is armed whenever user navigates, opens UI, or runs standalone/native
  useEffect(() => {
    const isEmbeddedIframe = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();
    if (
      isEmbeddedIframe &&
      activeView === 'dashboard' &&
      !hasAnyModalOpen &&
      !isMenuOpen &&
      !isSearchOpen &&
      !isExitConfirmOpen
    ) {
      return;
    }
    armBackGuard();
  }, [activeView, hasAnyModalOpen, isMenuOpen, isSearchOpen, isExitConfirmOpen, armBackGuard]);

  useEffect(() => {
    const handleUserActivation = () => {
      armBackGuard();
    };
    window.addEventListener('pointerdown', handleUserActivation, { passive: true });
    return () => window.removeEventListener('pointerdown', handleUserActivation);
  }, [armBackGuard]);

  const handleBackNavigationStep = useCallback(() => {
    if (isExitingRef.current) return;

    const state = backNavStateRef.current;

    // 1. If exit dialog is open, dismiss back to Home
    if (state.isExitConfirmOpen) {
      setIsExitConfirmOpen(false);
      armBackGuard();
      return;
    }

    // 2. If any info/donation/auto-silent modal is open, close it cleanly
    if (state.hasAnyModalOpen) {
      setIsIntroKhanqahOpen(false);
      setIsIntroSheikhOpen(false);
      setIsContactOpen(false);
      setIsAboutOpen(false);
      setIsWhatsAppGroupsOpen(false);
      setIsTermsOpen(false);
      setIsPrivacyOpen(false);
      setIsDonationOpen(false);
      setIsAutoSilentOpen(false);
      armBackGuard();
      return;
    }

    // 3. If drawer or search bar is open, close them
    if (state.isMenuOpen || state.isSearchOpen) {
      setIsMenuOpen(false);
      setIsSearchOpen(false);
      armBackGuard();
      return;
    }

    // 4. Let nested views (e.g. open book PDF reader or fullscreen poster) handle back first
    const backEvent = new CustomEvent('kdf-back-intercept', { cancelable: true });
    const notCancelled = window.dispatchEvent(backEvent);
    if (!notCancelled) {
      armBackGuard();
      return;
    }

    // 5. Inside any folder / sub-page -> return straight back to Home Page
    if (state.activeView !== 'dashboard') {
      setActiveView('dashboard');
      armBackGuard();
      return;
    }

    // 6. Already on Home Page -> require double Back press, then show Exit vs Home choice
    const now = Date.now();
    if (now - lastHomeBackPressRef.current <= 3500) {
      lastHomeBackPressRef.current = 0;
      setIsExitConfirmOpen(true);
    } else {
      lastHomeBackPressRef.current = now;
      const hint =
        state.lang === 'ps'
          ? 'د وتلو لپاره د بېرته تلو (Back) تڼۍ یو ځل بیا فشار ورکړئ'
          : state.lang === 'ar'
          ? 'اضغط زر الرجوع مرة أخرى للخروج أو العودة للرئيسية'
          : state.lang === 'en'
          ? 'Press Back again to exit or confirm Home'
          : 'ایپ سے باہر نکلنے کے لیے بیک بٹن دوبارہ دبائیں';
      showNotification(hint);
    }
    armBackGuard();
  }, [armBackGuard, showNotification]);

  useEffect(() => {
    const w = window as unknown as { __kdfHandleNativeBack?: () => void };
    w.__kdfHandleNativeBack = handleBackNavigationStep;
    window.addEventListener('popstate', handleBackNavigationStep);
    return () => {
      delete w.__kdfHandleNativeBack;
      window.removeEventListener('popstate', handleBackNavigationStep);
    };
  }, [handleBackNavigationStep]);

  const handleStayHomeFromExit = () => {
    setIsExitConfirmOpen(false);
    setActiveView('dashboard');
    armBackGuard();
  };

  const handleConfirmExitApp = () => {
    isExitingRef.current = true;
    setIsExitConfirmOpen(false);
    setCurrentBayan(null);
    try {
      const bridgeWin = window as unknown as {
        Android?: { exitApp?: () => void };
        ReactNativeWebView?: { postMessage?: (msg: string) => void };
      };
      bridgeWin.Android?.exitApp?.();
      bridgeWin.ReactNativeWebView?.postMessage?.(JSON.stringify({ type: 'EXIT_APP' }));
    } catch {
      // Ignore native bridge absence
    }
    window.close();
    if (window.history.length > 2) {
      window.history.go(-2);
    } else if (window.history.length > 1) {
      window.history.back();
    }
    window.setTimeout(() => {
      isExitingRef.current = false;
      armBackGuard();
      showNotification(
        lang === 'en'
          ? 'Please use your device Home button to minimize or close this tab.'
          : 'ایپ بند کرنے کے لیے اپنے موبائل کا ہوم بٹن یا بیک بٹن استعمال کریں۔'
      );
    }, 600);
  };

  const handleNavigateUrl = (url: string) => {
    setCurrentUrl(url);
    setActiveView('webview');
  };

  const handlePlayAudio = (bayan: BayanItem) => {
    window.dispatchEvent(new CustomEvent('kdf-pause-folder-iframes'));
    setCurrentBayan(bayan);
  };

  // Silent automatic background sync every 10 minutes + on tab focus
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPosts();
      syncArchive();
      syncBooks();
      syncPosters();
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshPosts, syncArchive, syncBooks, syncPosters]);

  const handleManualRefresh = () => {
    refreshPosts(showNotification);
    syncArchive();
    syncBooks();
    syncPosters();
  };

  const handleHeaderRefresh = async () => {
    showNotification('ایپ اور تازہ ترین اپڈیٹ ریفریش ہو رہا ہے...');
    handleManualRefresh();

    const bridge = getAndroidBridge();
    if (bridge && typeof bridge.forceLiveRefresh === 'function') {
      bridge.forceLiveRefresh();
      return;
    }
    if (bridge && typeof bridge.checkLiveUpdate === 'function') {
      bridge.checkLiveUpdate();
    }

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.update().catch(() => undefined)));
        }
        if ('caches' in window) {
          const keys = await window.caches.keys();
          await Promise.all(keys.map((k) => window.caches.delete(k)));
        }
      } catch {
        // Ignore cache cleanup errors
      }
      window.setTimeout(() => {
        window.location.reload();
      }, 450);
    }
  };

  const handleOpenLibraryFolder = (folderId = 'all') => {
    setSelectedLibraryFolderId(folderId);
    setActiveView('library');
  };

  const handleChangeThemeOverride = (nextId: string) => {
    setThemeOverride(nextId);
    saveLocalThemeOverride(nextId);
    const chosen = nextId === 'auto' ? remoteTheme : getThemePaletteById(nextId);
    showNotification(`اسلامک بیک گراؤنڈ تھیم تبدیل ہو گئی: ${chosen.nameUrdu}`);
  };

  return (
    <div
      className={`kdf-app-canvas h-screen w-screen flex flex-col select-none overflow-hidden transition-colors duration-200`}
    >
      {/* Sleek single line header */}
      <Header
        onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
        onToggleSearch={() => setIsSearchOpen((prev) => !prev)}
        isSearchOpen={isSearchOpen}
        isDark={isDark}
        displayMode={displayMode}
        onToggleTheme={toggleTheme}
        isDashboard={activeView === 'dashboard'}
        onGoHome={() => setActiveView('dashboard')}
        lang={lang}
        onChangeLang={handleChangeLanguage}
        onRefresh={handleHeaderRefresh}
        isRefreshing={isRefreshing || isSyncingArchive || isSyncingBooks || isSyncingPosters}
      />

      {/* PWA 1-Click Android App Install Banner */}
      <PWAInstallBanner isDark={isDark} onNotify={showNotification} lang={lang} />

      {/* Smart Search Bar */}
      <div className="relative">
        <SmartSearchBar
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onNavigateUrl={handleNavigateUrl}
          onPlayAudio={handlePlayAudio}
          onOpenBookReader={(book) => {
            setInitialReadingBookId(book.id);
            setActiveView('books');
          }}
          onOpenNews={() => setActiveView('news')}
          onOpenLibraryFolder={(folderId) => handleOpenLibraryFolder(folderId)}
          onNotify={showNotification}
          isDark={isDark}
          bayanatList={bayanat}
          booksList={books}
          postersList={posters}
          bloggerTabs={tabs}
          lang={lang}
        />
      </div>

      {/* Main Content Area: Smart Islamic Dashboard / Audio Library / WebView */}
      <main className="flex-1 w-full relative overflow-hidden flex flex-col">
        {activeView === 'dashboard' ? (
          <SmartDashboardHome
            isDark={isDark}
            lang={lang}
            bayanatList={bayanat}
            booksList={books}
            booksCount={books.length}
            postersList={posters}
            postersCount={posters.length}
            archiveFolders={archiveFolders}
            onRefreshBlogger={handleManualRefresh}
            isRefreshingBlogger={isRefreshing || isSyncingArchive || isSyncingBooks || isSyncingPosters}
            onOpenLibrary={() => handleOpenLibraryFolder('all')}
            onOpenLibraryFolder={(folderId) => handleOpenLibraryFolder(folderId)}
            onOpenBooks={() => {
              setInitialReadingBookId(null);
              setActiveView('books');
            }}
            onOpenBookReader={(book) => {
              setInitialReadingBookId(book.id);
              setActiveView('books');
            }}
            onOpenNews={() => setActiveView('news')}
            onOpenWhatsAppGroups={() => setIsWhatsAppGroupsOpen(true)}
            onOpenDonations={() => setIsDonationOpen(true)}
            onOpenAutoSilent={() => setIsAutoSilentOpen(true)}
            onOpenIntroKhanqah={() => setIsIntroKhanqahOpen(true)}
            onOpenIntroSheikh={() => setIsIntroSheikhOpen(true)}
            onOpenContact={() => setIsContactOpen(true)}
            onOpenTerms={() => setIsTermsOpen(true)}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
            onPlayAudio={handlePlayAudio}
            onNotify={showNotification}
            currentPlayingBayanId={currentBayan?.id || null}
            installStats={installStats}
          />
        ) : (
          <Suspense
            fallback={
              <div className="flex-1 flex items-center justify-center p-6 text-xs font-bold text-[#064326] dark:text-[#d4af37]">
                لوڈ ہو رہا ہے...
              </div>
            }
          >
            {activeView === 'library' ? (
              <AudioLibraryView
                onPlayAudio={handlePlayAudio}
                onPauseFloatingAudio={() => setCurrentBayan(null)}
                onNotify={showNotification}
                onNavigateUrl={handleNavigateUrl}
                onSwitchToWebView={() => handleNavigateUrl(GOLD_LIBRARY_URL)}
                isDark={isDark}
                currentPlayingBayanId={currentBayan?.id || null}
                bayanatList={bayanat}
                archiveFolders={archiveFolders}
                initialFolderId={selectedLibraryFolderId}
                lang={lang}
              />
            ) : activeView === 'books' ? (
              <BooksLibraryView
                books={books}
                isSyncing={isSyncingBooks}
                onRefreshBooks={() => syncBooks(showNotification)}
                onGoHome={() => setActiveView('dashboard')}
                onNotify={showNotification}
                isDark={isDark}
                lang={lang}
                initialBookId={initialReadingBookId}
                onClearInitialBook={() => setInitialReadingBookId(null)}
              />
            ) : activeView === 'news' ? (
              <NewsUpdatesView
                posters={posters}
                isSyncing={isSyncingPosters}
                onRefreshPosters={() => syncPosters(showNotification)}
                onGoHome={() => setActiveView('dashboard')}
                onNotify={showNotification}
                isDark={isDark}
                lang={lang}
              />
            ) : (
              <WebViewContainer
                currentUrl={currentUrl}
                onUrlChange={setCurrentUrl}
                onBackRequest={() => setIsAboutOpen(true)}
                onGoHome={() => setActiveView('dashboard')}
                isDark={isDark}
              />
            )}
          </Suspense>
        )}
      </main>

      {/* 3-Line Hamburger Drawer */}
      <HamburgerDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onGoHome={() => setActiveView('dashboard')}
        onOpenIntroKhanqah={() => setIsIntroKhanqahOpen(true)}
        onOpenIntroSheikh={() => setIsIntroSheikhOpen(true)}
        onOpenAllBayanat={() => handleOpenLibraryFolder('all')}
        onOpenBooks={() => setActiveView('books')}
        onOpenNews={() => setActiveView('news')}
        onOpenIslahiBayanat={() => handleNavigateUrl(GOLD_LIBRARY_URL)}
        onOpenUrl={handleNavigateUrl}
        onOpenWhatsAppGroups={() => setIsWhatsAppGroupsOpen(true)}
        onOpenDonations={() => setIsDonationOpen(true)}
        onOpenAutoSilent={() => setIsAutoSilentOpen(true)}
        onOpenContact={() => setIsContactOpen(true)}
        onOpenWebsite={() => {
          handleNavigateUrl(BLOGGER_HOME_URL);
        }}
        onOpenTerms={() => setIsTermsOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        isDark={isDark}
        displayMode={displayMode}
        onSelectDisplayMode={handleSelectDisplayMode}
        onToggleTheme={toggleTheme}
        onRefreshBlogger={handleManualRefresh}
        isRefreshingBlogger={isRefreshing || isSyncingArchive || isSyncingBooks || isSyncingPosters}
        lang={lang}
        themeOverride={themeOverride}
        remoteTheme={remoteTheme}
        onChangeThemeOverride={handleChangeThemeOverride}
      />

      {/* Floating Audio Player with 1-Click Memory Download */}
      <AudioPlayerBar
        currentBayan={currentBayan}
        onClose={() => setCurrentBayan(null)}
        onNotify={showNotification}
        isDark={isDark}
        lang={lang}
      />

      {/* Real-time Download & Sync Toast Notification */}
      {toastMessage && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#064326] text-white px-5 py-2.5 rounded-full shadow-2xl border border-[#d4af37] flex items-center gap-2.5 font-lalezar text-sm animate-in slide-in-from-top-3 duration-200"
          dir={getDir(lang)}
        >
          <DownloadCloud className="w-5 h-5 text-[#00ff99] shrink-0" />
          <span className="truncate max-w-xs sm:max-w-md">{toastMessage}</span>
        </div>
      )}

      {/* Information Modals */}
      <IntroKhanqahModal
        isOpen={isIntroKhanqahOpen}
        onClose={() => setIsIntroKhanqahOpen(false)}
        isDark={isDark}
        lang={lang}
      />

      <IntroSheikhModal
        isOpen={isIntroSheikhOpen}
        onClose={() => setIsIntroSheikhOpen(false)}
        isDark={isDark}
        lang={lang}
      />

      <WhatsAppGroupsModal
        isOpen={isWhatsAppGroupsOpen}
        onClose={() => setIsWhatsAppGroupsOpen(false)}
        isDark={isDark}
        lang={lang}
      />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        isDark={isDark}
        lang={lang}
        onOpenWhatsAppGroups={() => setIsWhatsAppGroupsOpen(true)}
      />

      <AboutAppModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        isDark={isDark}
        lang={lang}
        installStats={installStats}
      />

      <TermsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        isDark={isDark}
        lang={lang}
      />

      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        isDark={isDark}
        lang={lang}
      />

      <DonationModal
        isOpen={isDonationOpen}
        onClose={() => setIsDonationOpen(false)}
        isDark={isDark}
        lang={lang}
        onNotify={showNotification}
      />

      {isAutoSilentOpen && (
        <Suspense fallback={null}>
          <AutoSilentModal
            isOpen={isAutoSilentOpen}
            onClose={() => setIsAutoSilentOpen(false)}
            isDark={isDark}
            lang={lang}
            officialSchedule={cachedKhanqahSchedule}
            prayerData={cachedPrayerData}
            onNotify={showNotification}
          />
        </Suspense>
      )}

      <ExitAppConfirmModal
        isOpen={isExitConfirmOpen}
        onStayHome={handleStayHomeFromExit}
        onConfirmExit={handleConfirmExitApp}
        isDark={isDark}
        lang={lang}
      />
    </div>
  );
}

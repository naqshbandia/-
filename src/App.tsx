/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SmartSearchBar } from './components/SmartSearchBar';
import { HamburgerDrawer } from './components/HamburgerDrawer';
import { WebViewContainer } from './components/WebViewContainer';
import { AudioLibraryView } from './components/AudioLibraryView';
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
} from './components/Modals';
import { BayanItem } from './data/bayanatData';
import { 
  GOLD_LIBRARY_URL, 
  BLOGGER_HOME_URL 
} from './data/appConfig';
import { useBloggerTabs } from './utils/bloggerService';
import { useArchiveBayanat } from './utils/archiveService';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { DownloadCloud } from 'lucide-react';
import {
  AppLanguage,
  DEFAULT_LANGUAGE,
  LANG_STORAGE_KEY,
  UI_STRINGS,
  getDir,
  isValidAppLanguage,
} from './data/translations';

export default function App() {
  // Home Screen defaults to the clean Islamic Smart Dashboard
  const [activeView, setActiveView] = useState<'dashboard' | 'library' | 'webview'>('dashboard');
  const [currentUrl, setCurrentUrl] = useState(GOLD_LIBRARY_URL);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedLibraryFolderId, setSelectedLibraryFolderId] = useState<string>('all');

  // App Language state: Always opens in Urdu ('ur') by default unless user explicitly switches
  const [lang, setLang] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (isValidAppLanguage(saved)) {
        return saved;
      }
    } catch {}
    return DEFAULT_LANGUAGE;
  });

  // Dynamic Blogger Posts & Libraries (automatically updates when new posts are published on Blogger)
  const { tabs, isRefreshing, refreshPosts } = useBloggerTabs();

  // Dynamic Archive.org Bayanat sync (auto-discovers latest bayanat across all collections)
  const { bayanat, isSyncingArchive, syncArchive } = useArchiveBayanat();
  
  // Theme state: Default to clean Islamic Light theme (matches the Smart Dashboard aesthetic)
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('khanqah_app_theme_v2');
      return saved ? saved === 'dark' : false;
    } catch {
      return false;
    }
  });

  // Sync Tailwind dark class on document root
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

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

  // Audio player state
  const [currentBayan, setCurrentBayan] = useState<BayanItem | null>(null);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('khanqah_app_theme_v2', next ? 'dark' : 'light');
      } catch {}
      return next;
    });
  };

  const handleChangeLanguage = (nextLang: AppLanguage) => {
    setLang(nextLang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, nextLang);
    } catch {}
    showNotification(UI_STRINGS[nextLang].toastLangChanged);
  };

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

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

  const handleNavigateUrl = (url: string) => {
    setCurrentUrl(url);
    setActiveView('webview');
  };

  const handlePlayAudio = (bayan: BayanItem) => {
    setCurrentBayan(bayan);
  };

  // Silent automatic background sync every 10 minutes + on tab focus
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPosts();
      syncArchive();
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshPosts, syncArchive]);

  const handleManualRefresh = () => {
    refreshPosts(showNotification);
    syncArchive();
  };

  const handleOpenLibraryFolder = (folderId = 'all') => {
    setSelectedLibraryFolderId(folderId);
    setActiveView('library');
  };

  return (
    <div
      className={`h-screen w-screen flex flex-col select-none overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-[#09150f] text-emerald-50' : 'bg-[#f4f7f6] text-[#11261b]'
      }`}
    >
      {/* Sleek single line header */}
      <Header
        onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
        onToggleSearch={() => setIsSearchOpen((prev) => !prev)}
        isSearchOpen={isSearchOpen}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        isDashboard={activeView === 'dashboard'}
        onGoHome={() => setActiveView('dashboard')}
        lang={lang}
        onChangeLang={handleChangeLanguage}
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
          onNotify={showNotification}
          isDark={isDark}
          bayanatList={bayanat}
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
            bloggerTabs={tabs}
            onRefreshBlogger={handleManualRefresh}
            isRefreshingBlogger={isRefreshing}
            onOpenUrl={handleNavigateUrl}
            onOpenLibrary={() => handleOpenLibraryFolder('all')}
            onOpenWhatsAppGroups={() => setIsWhatsAppGroupsOpen(true)}
            onOpenIntroKhanqah={() => setIsIntroKhanqahOpen(true)}
            onOpenIntroSheikh={() => setIsIntroSheikhOpen(true)}
            onOpenContact={() => setIsContactOpen(true)}
            onOpenTerms={() => setIsTermsOpen(true)}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
            onPlayAudio={handlePlayAudio}
            onNotify={showNotification}
            currentPlayingBayanId={currentBayan?.id || null}
          />
        ) : activeView === 'library' ? (
          <AudioLibraryView
            onPlayAudio={handlePlayAudio}
            onNotify={showNotification}
            onNavigateUrl={handleNavigateUrl}
            onSwitchToWebView={() => handleNavigateUrl(GOLD_LIBRARY_URL)}
            isDark={isDark}
            currentPlayingBayanId={currentBayan?.id || null}
            bayanatList={bayanat}
            initialFolderId={selectedLibraryFolderId}
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
      </main>

      {/* 3-Line Hamburger Drawer */}
      <HamburgerDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onGoHome={() => setActiveView('dashboard')}
        onOpenIntroKhanqah={() => setIsIntroKhanqahOpen(true)}
        onOpenIntroSheikh={() => setIsIntroSheikhOpen(true)}
        onOpenAllBayanat={() => handleOpenLibraryFolder('all')}
        onOpenIslahiBayanat={() => handleNavigateUrl(GOLD_LIBRARY_URL)}
        onOpenUrl={handleNavigateUrl}
        onOpenWhatsAppGroups={() => setIsWhatsAppGroupsOpen(true)}
        onOpenContact={() => setIsContactOpen(true)}
        onOpenWebsite={() => {
          handleNavigateUrl(BLOGGER_HOME_URL);
        }}
        onOpenTerms={() => setIsTermsOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onRefreshBlogger={handleManualRefresh}
        isRefreshingBlogger={isRefreshing || isSyncingArchive}
        lang={lang}
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
    </div>
  );
}

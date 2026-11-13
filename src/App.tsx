/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PostsTabBar } from './components/PostsTabBar';
import { SmartSearchBar } from './components/SmartSearchBar';
import { HamburgerDrawer } from './components/HamburgerDrawer';
import { WebViewContainer } from './components/WebViewContainer';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import {
  IntroKhanqahModal,
  IntroSheikhModal,
  ContactModal,
  AboutAppModal,
  WhatsAppGroupsModal,
} from './components/Modals';
import { BayanItem } from './data/bayanatData';
import { 
  GOLD_LIBRARY_URL, 
  BLOGGER_HOME_URL 
} from './data/appConfig';
import { useBloggerTabs } from './utils/bloggerService';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { DownloadCloud } from 'lucide-react';

export default function App() {
  // Start on the Authentic Original Audio Library Gold Page as the #1 Home Page
  const [currentUrl, setCurrentUrl] = useState(GOLD_LIBRARY_URL);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Dynamic Blogger Posts & Libraries (automatically updates when new posts are published on Blogger)
  const { tabs, isRefreshing, refreshPosts } = useBloggerTabs();
  
  // Theme state: Normal (Light) vs Dark
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('khanqah_app_theme');
      return saved ? saved === 'dark' : true;
    } catch {
      return true;
    }
  });

  // Toast notification message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isIntroKhanqahOpen, setIsIntroKhanqahOpen] = useState(false);
  const [isIntroSheikhOpen, setIsIntroSheikhOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isWhatsAppGroupsOpen, setIsWhatsAppGroupsOpen] = useState(false);

  // Audio player state
  const [currentBayan, setCurrentBayan] = useState<BayanItem | null>(null);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('khanqah_app_theme', next ? 'dark' : 'light');
      } catch {}
      return next;
    });
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
  };

  const handlePlayAudio = (bayan: BayanItem) => {
    setCurrentBayan(bayan);
  };

  const handleManualRefresh = () => {
    refreshPosts(showNotification);
  };

  return (
    <div
      className={`h-screen w-screen flex flex-col select-none overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-[#1e1712] text-amber-50' : 'bg-[#fdfaf3] text-[#2c1f15]'
      }`}
    >
      {/* Sleek single line header: Three-line Menu, App Title (Lalezar font), Theme Toggle, Search */}
      <Header
        onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
        onToggleSearch={() => setIsSearchOpen((prev) => !prev)}
        isSearchOpen={isSearchOpen}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* PWA 1-Click Android App Install Banner */}
      <PWAInstallBanner isDark={isDark} />

      {/* Dynamic Blogger Posts & Library Tabs Bar (Automatically pulls all posts from Blogger + Instant Sync) */}
      <PostsTabBar
        currentUrl={currentUrl}
        onSelectTab={handleNavigateUrl}
        isDark={isDark}
        tabs={tabs}
        isRefreshing={isRefreshing}
        onRefresh={handleManualRefresh}
      />

      {/* Smart Search Bar (With Lalezar font, 1-click Direct Memory Download, and Folder Downloads) */}
      <div className="relative">
        <SmartSearchBar
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onNavigateUrl={handleNavigateUrl}
          onPlayAudio={handlePlayAudio}
          onNotify={showNotification}
          isDark={isDark}
        />
      </div>

      {/* Main Content Area: Authentic Original Website & Audio Library in WebView */}
      <main className="flex-1 w-full relative overflow-hidden flex flex-col">
        <WebViewContainer
          currentUrl={currentUrl}
          onUrlChange={setCurrentUrl}
          onBackRequest={() => setIsAboutOpen(true)}
          isDark={isDark}
        />
      </main>

      {/* 3-Line Hamburger Drawer (Urdu menu, theme toggle, refresh) */}
      <HamburgerDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenIntroKhanqah={() => setIsIntroKhanqahOpen(true)}
        onOpenIntroSheikh={() => setIsIntroSheikhOpen(true)}
        onOpenAllBayanat={() => {
          handleNavigateUrl(GOLD_LIBRARY_URL);
        }}
        onOpenIslahiBayanat={() => {
          handleNavigateUrl(GOLD_LIBRARY_URL);
        }}
        onOpenWhatsAppGroups={() => setIsWhatsAppGroupsOpen(true)}
        onOpenContact={() => setIsContactOpen(true)}
        onOpenWebsite={() => {
          handleNavigateUrl(BLOGGER_HOME_URL);
        }}
        onOpenAbout={() => setIsAboutOpen(true)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onRefreshBlogger={handleManualRefresh}
        isRefreshingBlogger={isRefreshing}
      />

      {/* Floating Audio Player with 1-Click Memory Download */}
      <AudioPlayerBar
        currentBayan={currentBayan}
        onClose={() => setCurrentBayan(null)}
        onNotify={showNotification}
        isDark={isDark}
      />

      {/* Real-time Download & Sync Toast Notification */}
      {toastMessage && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#0a5d38] text-white px-5 py-2.5 rounded-full shadow-2xl border border-emerald-400 flex items-center gap-2.5 font-lalezar text-sm animate-in slide-in-from-top-3 duration-200"
          dir="rtl"
        >
          <DownloadCloud className="w-5 h-5 text-emerald-200 shrink-0 animate-bounce" />
          <span className="truncate max-w-xs sm:max-w-md">{toastMessage}</span>
        </div>
      )}

      {/* Urdu Information Modals */}
      <IntroKhanqahModal
        isOpen={isIntroKhanqahOpen}
        onClose={() => setIsIntroKhanqahOpen(false)}
        isDark={isDark}
      />

      <IntroSheikhModal
        isOpen={isIntroSheikhOpen}
        onClose={() => setIsIntroSheikhOpen(false)}
        isDark={isDark}
      />

      <WhatsAppGroupsModal
        isOpen={isWhatsAppGroupsOpen}
        onClose={() => setIsWhatsAppGroupsOpen(false)}
        isDark={isDark}
      />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        isDark={isDark}
        onOpenWhatsAppGroups={() => setIsWhatsAppGroupsOpen(true)}
      />

      <AboutAppModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        isDark={isDark}
      />
    </div>
  );
}

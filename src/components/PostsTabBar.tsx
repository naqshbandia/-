/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Headphones, 
  Bell, 
  BookOpen, 
  Globe, 
  Smartphone, 
  FileText, 
  RotateCw,
  ChevronRight,
  ChevronLeft,
  Pause,
  Play,
  Home
} from 'lucide-react';
import { BloggerPostTab, BLOGGER_HOME_URL } from '../data/appConfig';

interface Props {
  currentUrl: string;
  onSelectTab: (url: string) => void;
  activeView?: 'dashboard' | 'library' | 'webview';
  onSelectDashboard?: () => void;
  onSelectLibrary?: () => void;
  isDark: boolean;
  tabs: BloggerPostTab[];
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export const PostsTabBar: React.FC<Props> = ({ 
  currentUrl, 
  onSelectTab, 
  activeView = 'dashboard',
  onSelectDashboard,
  onSelectLibrary,
  isDark, 
  tabs,
  isRefreshing = false,
  onRefresh,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-slide state
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  // Scroll direction: -1 (scroll left) or +1 (scroll right)
  const scrollDirectionRef = useRef<number>(-1);
  const pauseUntilRef = useRef<number>(0);
  const isInteractingRef = useRef(false);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mouse drag support
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);

  const pauseTemporarily = useCallback((durationMs = 2800) => {
    isInteractingRef.current = true;
    setIsUserInteracting(true);
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
      setIsUserInteracting(false);
    }, durationMs);
  }, []);

  // Smooth Gentle Auto-slide loop (slides back and forth continuously)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const elapsed = time - lastTime;
      lastTime = time;

      if (
        isAutoScrollEnabled && 
        !isInteractingRef.current && 
        containerRef.current
      ) {
        const container = containerRef.current;
        const maxScroll = container.scrollWidth - container.clientWidth;

        // Only auto-slide if content overflows the view
        if (maxScroll > 15) {
          if (Date.now() > pauseUntilRef.current) {
            // Very smooth, gentle speed: ~0.55px per 16ms frame (~35px per second)
            const delta = scrollDirectionRef.current * (0.042 * Math.min(elapsed, 40));
            const prevScroll = container.scrollLeft;
            container.scrollLeft += delta;

            // Detect if container hit the edge boundary
            if (Math.abs(container.scrollLeft - prevScroll) < 0.05) {
              // Pause gently at edge for 1.4s, then smoothly reverse direction
              scrollDirectionRef.current = -scrollDirectionRef.current;
              pauseUntilRef.current = Date.now() + 1400;
            }
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
    };
  }, [isAutoScrollEnabled]);

  // Manual nudge buttons (left/right)
  const handleManualNudge = (direction: 'right' | 'left') => {
    pauseTemporarily(3500);
    if (!containerRef.current) return;
    const offset = direction === 'right' ? 160 : -160;
    containerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // Mouse Drag Handlers for Desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX;
    startScrollLeftRef.current = containerRef.current.scrollLeft;
    pauseTemporarily(3500);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX;
    const walk = (x - startXRef.current);
    containerRef.current.scrollLeft = startScrollLeftRef.current - walk;
    pauseTemporarily(3500);
  };

  const handleMouseUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      pauseTemporarily(2500);
    }
  };

  const getIcon = (name: BloggerPostTab['iconName']) => {
    switch (name) {
      case 'audio':
        return <Headphones className="w-3.5 h-3.5" />;
      case 'news':
        return <Bell className="w-3.5 h-3.5" />;
      case 'books':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'app':
        return <Smartphone className="w-3.5 h-3.5" />;
      case 'blogger':
        return <Globe className="w-3.5 h-3.5" />;
      default:
        return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const isTabActive = (tabUrl: string) => {
    if (currentUrl === tabUrl) return true;
    if (tabUrl.includes('Gold') && (currentUrl.includes('Gold') || currentUrl.includes('audio-library'))) return true;
    if (tabUrl.includes('News') && currentUrl.includes('News')) return true;
    if (tabUrl.includes('Books') && currentUrl.includes('book')) return true;
    if (tabUrl === BLOGGER_HOME_URL && currentUrl === BLOGGER_HOME_URL) return true;
    return false;
  };

  const handleTabClick = (tabUrl: string, e: React.MouseEvent<HTMLButtonElement>) => {
    onSelectTab(tabUrl);
    pauseTemporarily(4000);
    // Smoothly center the clicked tab in view
    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  return (
    <div
      className={`w-full border-b select-none transition-colors relative z-20 ${
        isDark
          ? 'bg-[#082c1a] border-[#d4af37]/30 text-amber-100'
          : 'bg-[#ebf2ee] border-emerald-900/10 text-[#064326]'
      }`}
      dir="rtl"
    >
      <div className="flex items-center justify-between px-1.5 py-1 gap-1 max-w-5xl mx-auto">
        {/* Right Manual Nudge Arrow Button */}
        <button
          onClick={() => handleManualNudge('right')}
          className={`p-1 rounded-md shrink-0 transition-all active:scale-90 ${
            isDark 
              ? 'text-amber-300/80 hover:text-white hover:bg-[#0e3f27]' 
              : 'text-[#064326] hover:bg-emerald-100'
          }`}
          title="دائیں سلائیڈ کریں (Slide Right)"
          aria-label="دائیں سلائیڈ کریں"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Scrollable & Auto-Sliding Tabs Container */}
        <div 
          className="relative flex-1 overflow-hidden"
          onMouseEnter={() => {
            isInteractingRef.current = true;
            setIsUserInteracting(true);
          }}
          onMouseLeave={() => {
            pauseTemporarily(2000);
          }}
        >
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={() => {
              isInteractingRef.current = true;
              setIsUserInteracting(true);
            }}
            onTouchMove={() => {
              pauseTemporarily(3500);
            }}
            onTouchEnd={() => {
              pauseTemporarily(2500);
            }}
            onWheel={() => {
              pauseTemporarily(3000);
            }}
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-2 cursor-grab active:cursor-grabbing"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Permanent Home Dashboard Tab */}
            {onSelectDashboard && (
              <button
                onClick={() => {
                  onSelectDashboard();
                  pauseTemporarily(3000);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-lalezar text-xs tracking-wide shrink-0 transition-all active:scale-95 cursor-pointer ${
                  activeView === 'dashboard'
                    ? 'bg-[#064326] text-white shadow-xs font-bold ring-1 ring-[#d4af37]'
                    : isDark
                    ? 'text-emerald-100 bg-[#0d2116] border border-[#d4af37]/25 hover:bg-[#133322]'
                    : 'text-[#064326] bg-white border border-emerald-900/15 hover:bg-emerald-50'
                }`}
              >
                <Home className={`w-3.5 h-3.5 ${activeView === 'dashboard' ? 'text-[#d4af37]' : 'text-[#064326] dark:text-[#d4af37]'}`} />
                <span className="whitespace-nowrap font-bold">ہوم ڈیش بورڈ</span>
              </button>
            )}

            {/* Native Audio Library Tab */}
            {onSelectLibrary && (
              <button
                onClick={() => {
                  onSelectLibrary();
                  pauseTemporarily(3000);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-lalezar text-xs tracking-wide shrink-0 transition-all active:scale-95 cursor-pointer ${
                  activeView === 'library'
                    ? 'bg-[#064326] text-white shadow-xs font-bold ring-1 ring-[#d4af37]'
                    : isDark
                    ? 'text-emerald-100 bg-[#0d2116] border border-[#d4af37]/25 hover:bg-[#133322]'
                    : 'text-[#064326] bg-white border border-emerald-900/15 hover:bg-emerald-50'
                }`}
              >
                <Headphones className={`w-3.5 h-3.5 ${activeView === 'library' ? 'text-[#d4af37]' : 'text-[#0a5d38] dark:text-emerald-400'}`} />
                <span className="whitespace-nowrap font-bold">فوری آڈیو لائبریری</span>
              </button>
            )}

            {tabs.map((tab) => {
              const active = activeView === 'webview' && isTabActive(tab.url);
              const isAppTab = tab.iconName === 'app';

              return (
                <button
                  key={tab.id}
                  onClick={(e) => handleTabClick(tab.url, e)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-lalezar text-xs tracking-wide shrink-0 transition-all active:scale-95 cursor-pointer ${
                    active
                      ? 'bg-[#064326] text-white shadow-xs font-bold ring-1 ring-[#d4af37]'
                      : isAppTab
                      ? isDark
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-600/40 hover:bg-emerald-900/60'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-400/50 hover:bg-emerald-200'
                      : isDark
                      ? 'text-amber-100/90 bg-[#0d2116] border border-[#d4af37]/25 hover:text-white hover:bg-[#133322]'
                      : 'text-[#064326] bg-white border border-emerald-900/15 hover:bg-emerald-50'
                  }`}
                  title={tab.title}
                >
                  <span className={active ? 'text-white' : isAppTab ? 'text-emerald-400' : 'text-[#b08d43]'}>
                    {getIcon(tab.iconName)}
                  </span>
                  <span className="whitespace-nowrap font-medium">{tab.title}</span>
                  {isAppTab && (
                    <span className="bg-emerald-500 text-white text-[9px] px-1 py-0.2 rounded font-sans leading-none font-bold">
                      APP
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Left Manual Nudge Arrow Button */}
        <button
          onClick={() => handleManualNudge('left')}
          className={`p-1 rounded-md shrink-0 transition-all active:scale-90 ${
            isDark 
              ? 'text-amber-300/80 hover:text-white hover:bg-[#382618]' 
              : 'text-[#8c6d2b] hover:text-[#3d2e21] hover:bg-[#dfd3bc]'
          }`}
          title="بائیں سلائیڈ کریں (Slide Left)"
          aria-label="بائیں سلائیڈ کریں"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Controls: Play/Pause Auto-Slide Toggle + Sync Button */}
        <div className="flex items-center gap-0.5 shrink-0 pr-1 border-r border-[#b08d43]/30 mr-0.5">
          {/* Auto-Slide Toggle (Pause/Play) */}
          <button
            onClick={() => setIsAutoScrollEnabled((prev) => !prev)}
            className={`p-1.5 rounded-lg transition-all active:scale-95 ${
              isDark
                ? isAutoScrollEnabled 
                  ? 'text-amber-300 hover:text-white hover:bg-[#382618]' 
                  : 'text-amber-500/50 hover:text-amber-300 hover:bg-[#382618]'
                : isAutoScrollEnabled
                ? 'text-[#8c6d2b] hover:text-[#3d2e21] hover:bg-[#dfd3bc]'
                : 'text-[#8c6d2b]/50 hover:text-[#8c6d2b] hover:bg-[#dfd3bc]'
            }`}
            title={isAutoScrollEnabled ? 'آٹو سلائیڈ روکیں (Pause Auto Slide)' : 'آٹو سلائیڈ چلائیں (Play Auto Slide)'}
            aria-label="آٹو سلائیڈ کا کنٹرول"
          >
            {isAutoScrollEnabled ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>

          {/* Sync/Refresh Button to update from Blogger feed */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`p-1.5 rounded-lg transition-all shrink-0 flex items-center gap-1 text-[11px] font-lalezar ${
                isDark
                  ? 'text-amber-300/90 hover:text-white hover:bg-[#382618]'
                  : 'text-[#8c6d2b] hover:text-[#3d2e21] hover:bg-[#dfd3bc]'
              } ${isRefreshing ? 'opacity-70' : 'active:scale-95'}`}
              title="بلاگر سے تمام پوسٹس اور فولڈرز تازہ کریں (Refresh Blogger Posts)"
              aria-label="بلاگر سے تازہ کریں"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#d4af37]' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

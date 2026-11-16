/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  BloggerPostTab, 
  DEFAULT_BLOGGER_POSTS_TABS, 
  BLOGGER_HOME_URL,
  GOLD_LIBRARY_URL 
} from '../data/appConfig';

// Cache keys
const CACHE_KEY = 'khanqah_blogger_tabs_cache_v4';
const CACHE_TIME_KEY = 'khanqah_blogger_tabs_time_v4';

// Helper to keep exact Blogger post title
function formatTabTitle(title: string): string {
  return title ? title.trim() : 'پوسٹ';
}

// Helper to choose appropriate icon
function detectIconName(title: string, content: string): BloggerPostTab['iconName'] {
  const combined = (title + ' ' + content).toLowerCase();
  
  if (
    combined.includes('app') || 
    combined.includes('apk') || 
    combined.includes('ایپ') || 
    combined.includes('انسٹال') || 
    combined.includes('ڈاؤنلوڈ') ||
    combined.includes('موبائل')
  ) {
    return 'app';
  }
  if (
    combined.includes('audio') || 
    combined.includes('gold') || 
    combined.includes('آڈیو') || 
    combined.includes('بیان') || 
    combined.includes('صوتی') ||
    combined.includes('mp3')
  ) {
    return 'audio';
  }
  if (
    combined.includes('book') || 
    combined.includes('کتاب') || 
    combined.includes('کتب') || 
    combined.includes('رسالہ') ||
    combined.includes('pdf')
  ) {
    return 'books';
  }
  if (
    combined.includes('news') || 
    combined.includes('خبر') || 
    combined.includes('اعلان') || 
    combined.includes('تازہ') ||
    combined.includes('اشتہار')
  ) {
    return 'news';
  }
  return 'post';
}

// Fetch Blogger feed using JSONP (completely bypasses CORS restrictions in all browsers)
export async function fetchLiveBloggerPosts(): Promise<BloggerPostTab[]> {
  return new Promise((resolve, reject) => {
    const callbackName = '__bloggerFeedCb_' + Math.floor(Math.random() * 1000000);
    const script = document.createElement('script');
    let settled = false;

    const cleanup = (isTimeoutOrError = false) => {
      clearTimeout(timeout);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (isTimeoutOrError) {
        // Leave a harmless no-op so a late-arriving cross-origin JSONP script never throws "Script error."
        // @ts-expect-error dynamic window callback
        window[callbackName] = () => {
          try {
            // @ts-expect-error dynamic window callback
            delete window[callbackName];
          } catch {}
        };
        setTimeout(() => {
          try {
            // @ts-expect-error dynamic window callback
            delete window[callbackName];
          } catch {}
        }, 30000);
      } else {
        try {
          // @ts-expect-error dynamic window callback
          delete window[callbackName];
        } catch {}
      }
    };

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup(true);
      reject(new Error('Blogger feed timeout'));
    }, 9000);

    // @ts-expect-error dynamic window callback
    window[callbackName] = (data: any) => {
      if (settled) return;
      settled = true;
      cleanup(false);
      try {
        const entries = data?.feed?.entry || [];
        const dynamicTabs: BloggerPostTab[] = [];

        for (const entry of entries) {
          const rawTitle = entry.title?.$t || 'پوسٹ';
          const content = entry.content?.$t || '';
          
          // Extract direct iframe url if embedded in post
          let targetUrl = '';
          const iframeMatch = content.match(/<iframe[^>]+src=["']([^"']+)["']/i);
          if (iframeMatch && iframeMatch[1]) {
            targetUrl = iframeMatch[1];
          } else {
            // Find alternate web link
            const altLink = entry.link?.find((l: any) => l.rel === 'alternate')?.href;
            targetUrl = altLink || BLOGGER_HOME_URL;
          }

          const id = entry.id?.$t || targetUrl;
          const icon = detectIconName(rawTitle, content);
          const formattedTitle = formatTabTitle(rawTitle);
          const cleanSnippet = content
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 120);

          dynamicTabs.push({
            id,
            title: formattedTitle,
            url: targetUrl,
            iconName: icon,
            isLivePost: true,
            published: entry.published?.$t,
            snippet: cleanSnippet || undefined,
          });
        }

        // Ensure Audio Library Gold Page is always the first tab at the top
        dynamicTabs.unshift({
          id: 'blogger-home',
          title: 'خانقاہ دارالفلاح (ہوم پیج)',
          url: BLOGGER_HOME_URL,
          iconName: 'blogger',
        });
        dynamicTabs.unshift({
          id: 'audio-library-gold-page',
          title: 'Audio Library Gold Page',
          url: GOLD_LIBRARY_URL,
          iconName: 'audio',
        });

        resolve(dynamicTabs);
      } catch (err) {
        reject(err);
      }
    };

    script.src = `https://khanqahdarulfalah.blogspot.com/feeds/posts/default?alt=json-in-script&callback=${callbackName}&max-results=50&_t=${Date.now()}`;
    script.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup(true);
      reject(new Error('Failed to load Blogger feed script'));
    };

    document.head.appendChild(script);
  });
}

export function useBloggerTabs() {
  const [tabs, setTabs] = useState<BloggerPostTab[]>(() => {
    // 1. Try to load from localStorage cache for instant UI rendering
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_BLOGGER_POSTS_TABS;
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(() => {
    try {
      return localStorage.getItem(CACHE_TIME_KEY);
    } catch {
      return null;
    }
  });

  const refreshPosts = useCallback(async (notifyUser?: (msg: string) => void) => {
    setIsRefreshing(true);
    try {
      const liveTabs = await fetchLiveBloggerPosts();
      if (liveTabs && liveTabs.length > 0) {
        setTabs(liveTabs);
        const nowStr = new Date().toLocaleTimeString('ur-PK', { hour: '2-digit', minute: '2-digit' });
        setLastUpdated(nowStr);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(liveTabs));
          localStorage.setItem(CACHE_TIME_KEY, nowStr);
        } catch {
          // storage quota safe
        }
        if (notifyUser) {
          notifyUser('بلاگر سے تمام پوسٹس اور لائبریری تازہ ہو گئی ہیں!');
        }
      }
    } catch (e) {
      console.warn('Could not fetch latest Blogger posts, using local cache:', e);
      if (notifyUser) {
        notifyUser('تازہ ترین پوسٹس لوڈ نہیں ہو سکیں، موجودہ ڈیٹا دکھایا جا رہا ہے');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Fetch on mount to ensure user always gets the latest posts from Blogger
  useEffect(() => {
    refreshPosts();
  }, [refreshPosts]);

  return {
    tabs,
    isRefreshing,
    lastUpdated,
    refreshPosts,
  };
}

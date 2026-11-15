import { useState, useEffect, useCallback } from 'react';

export interface GitHubHtmlPage {
  id: string;
  filename: string;
  title: string;
  url: string;
  iconName: 'audio' | 'books' | 'news' | 'clock' | 'page';
}

const GITHUB_CONTENTS_API = 'https://api.github.com/repos/naqshbandia/index.html/contents/';
const GITHUB_PAGES_BASE = 'https://naqshbandia.github.io/index.html/';
const GITHUB_CACHE_KEY = 'khanqah_github_html_pages_v1';

const EXCLUDED_EXACT = new Set([
  '222222.html',
  'admin-panel.html',
  'apk-install.html',
  'install.html',
  'index.html',
  'index1.html',
  'latest_update.txt.html',
]);

const EXCLUDED_KEYWORDS = [
  'calculator',
  'chak',
  'labour',
  'salary',
  'land area',
  'مزدوری',
  'admin',
];

const KNOWN_PAGE_META: Record<
  string,
  { title: string; iconName: GitHubHtmlPage['iconName'] }
> = {
  'gold file location.html': {
    title: 'آڈیو لائبریری گولڈ پیج',
    iconName: 'audio',
  },
  'gold-audio-page.html': {
    title: 'گولڈ آڈیو پیج',
    iconName: 'audio',
  },
  'audio-bayanat.html': {
    title: 'آڈیو بیانات پورٹل',
    iconName: 'audio',
  },
  'all-audio-bayanat.html': {
    title: 'تمام آڈیو بیانات',
    iconName: 'audio',
  },
  'bayanat-library.html': {
    title: 'بیانات لائبریری',
    iconName: 'audio',
  },
  'haftawar-bayanat.html': {
    title: 'ہفتہ وار بیانات',
    iconName: 'audio',
  },
  'islami_majalis.html': {
    title: 'اصلاحی مجالس',
    iconName: 'audio',
  },
  'telawat-hamd-naat.html': {
    title: 'تلاوت، حمد و نعت',
    iconName: 'audio',
  },
  'ramzan ul mubarak ki aham masail.html': {
    title: 'رمضان المبارک کے اہم مسائل',
    iconName: 'books',
  },
  'urdu-books-library.html': {
    title: 'اسلامی اردو کتب لائبریری',
    iconName: 'books',
  },
  'news-updates.html': {
    title: 'اعلانات و اشتہارات',
    iconName: 'news',
  },
  'khanqah-darul-falah-clock.html': {
    title: 'خانقاہ گھڑی و اوقاتِ نماز',
    iconName: 'clock',
  },
};

export const DEFAULT_GITHUB_HTML_PAGES: GitHubHtmlPage[] = [
  {
    id: 'gh-gold',
    filename: 'Gold file location.html',
    title: 'آڈیو لائبریری گولڈ پیج',
    url: `${GITHUB_PAGES_BASE}Gold%20file%20location.html`,
    iconName: 'audio',
  },
  {
    id: 'gh-haftawar',
    filename: 'Haftawar-Bayanat.html',
    title: 'ہفتہ وار بیانات',
    url: `${GITHUB_PAGES_BASE}Haftawar-Bayanat.html`,
    iconName: 'audio',
  },
  {
    id: 'gh-majalis',
    filename: 'ISLAMI_MAJALIS.html',
    title: 'اصلاحی مجالس',
    url: `${GITHUB_PAGES_BASE}ISLAMI_MAJALIS.html`,
    iconName: 'audio',
  },
  {
    id: 'gh-ramzan',
    filename: 'Ramzan ul Mubarak ki Aham Masail.html',
    title: 'رمضان المبارک کے اہم مسائل',
    url: `${GITHUB_PAGES_BASE}Ramzan%20ul%20Mubarak%20ki%20Aham%20Masail.html`,
    iconName: 'books',
  },
  {
    id: 'gh-books',
    filename: 'Urdu-Books-Library.html',
    title: 'اسلامی اردو کتب لائبریری',
    url: `${GITHUB_PAGES_BASE}Urdu-Books-Library.html`,
    iconName: 'books',
  },
  {
    id: 'gh-naat',
    filename: 'telawat-Hamd-naat.html',
    title: 'تلاوت، حمد و نعت',
    url: `${GITHUB_PAGES_BASE}telawat-Hamd-naat.html`,
    iconName: 'audio',
  },
  {
    id: 'gh-news',
    filename: 'News-Updates.html',
    title: 'اعلانات و اشتہارات',
    url: `${GITHUB_PAGES_BASE}News-Updates.html`,
    iconName: 'news',
  },
];

function isKhanqahHtmlFile(filename: string): boolean {
  const lower = filename.trim().toLowerCase();
  if (!lower.endsWith('.html')) return false;
  if (EXCLUDED_EXACT.has(lower)) return false;
  return !EXCLUDED_KEYWORDS.some((kw) => lower.includes(kw));
}

function inferIcon(filename: string): GitHubHtmlPage['iconName'] {
  const lower = filename.toLowerCase();
  if (lower.includes('book') || lower.includes('masail') || lower.includes('کتب')) return 'books';
  if (lower.includes('news') || lower.includes('اعلان') || lower.includes('update')) return 'news';
  if (lower.includes('clock') || lower.includes('نماز')) return 'clock';
  if (
    lower.includes('bayan') ||
    lower.includes('audio') ||
    lower.includes('majalis') ||
    lower.includes('naat') ||
    lower.includes('gold')
  ) {
    return 'audio';
  }
  return 'page';
}

function formatReadableTitle(filename: string): string {
  const key = filename.trim().toLowerCase();
  if (KNOWN_PAGE_META[key]) return KNOWN_PAGE_META[key].title;
  return filename
    .replace(/\.html$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchGitHubHtmlPages(): Promise<GitHubHtmlPage[]> {
  const res = await fetch(GITHUB_CONTENTS_API);
  if (!res.ok) throw new Error('GitHub API error');
  const items: any[] = await res.json();
  if (!Array.isArray(items)) return DEFAULT_GITHUB_HTML_PAGES;

  const pages: GitHubHtmlPage[] = [];
  for (const item of items) {
    const name = String(item?.name || '');
    if (item?.type !== 'file' || !isKhanqahHtmlFile(name)) continue;
    const key = name.trim().toLowerCase();
    const known = KNOWN_PAGE_META[key];
    pages.push({
      id: `gh-${name}`,
      filename: name,
      title: known ? known.title : formatReadableTitle(name),
      url: `${GITHUB_PAGES_BASE}${encodeURIComponent(name)}`,
      iconName: known ? known.iconName : inferIcon(name),
    });
  }

  return pages.length > 0 ? pages : DEFAULT_GITHUB_HTML_PAGES;
}

export function useGitHubHtmlPages() {
  const [pages, setPages] = useState<GitHubHtmlPage[]>(() => {
    try {
      const cached = localStorage.getItem(GITHUB_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_GITHUB_HTML_PAGES;
  });

  const [isSyncingGitHub, setIsSyncingGitHub] = useState(false);

  const syncGitHubPages = useCallback(async () => {
    setIsSyncingGitHub(true);
    try {
      const fresh = await fetchGitHubHtmlPages();
      if (fresh.length > 0) {
        setPages(fresh);
        try {
          localStorage.setItem(GITHUB_CACHE_KEY, JSON.stringify(fresh));
        } catch {}
      }
    } catch {
      // Retain cached / default pages gracefully
    } finally {
      setIsSyncingGitHub(false);
    }
  }, []);

  useEffect(() => {
    syncGitHubPages();
  }, [syncGitHubPages]);

  return {
    githubPages: pages,
    isSyncingGitHub,
    syncGitHubPages,
  };
}

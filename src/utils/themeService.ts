import { KHANQAH_THEME_HTML_URL } from '../data/appConfig';

export interface IslamicThemePalette {
  id: string;
  nameUrdu: string;
  nameEnglish: string;
  descriptionUrdu: string;
  lightBg: string;
  lightSurface: string;
  lightText: string;
  darkBg: string;
  darkSurface: string;
  primary: string;
  primaryHover: string;
  accent: string;
  led: string;
  panelBg: string;
  patternStrokeHex: string;
}

export const ISLAMIC_THEMES: IslamicThemePalette[] = [
  {
    id: 'emerald-sanctuary',
    nameUrdu: 'سبزِ مدینہ (اصل تھیم)',
    nameEnglish: 'Emerald Sanctuary',
    descriptionUrdu: 'مسجدِ نبویﷺ کا روایتی سبز و طلائی امتزاج',
    lightBg: '#f4f7f6',
    lightSurface: '#e8f1ec',
    lightText: '#11261b',
    darkBg: '#09150f',
    darkSurface: '#0c2317',
    primary: '#064326',
    primaryHover: '#095c34',
    accent: '#d4af37',
    led: '#00ff99',
    panelBg: '#03150c',
    patternStrokeHex: 'd4af37',
  },
  {
    id: 'nabawi-olive',
    nameUrdu: 'زیتون و گنبدِ خضرا',
    nameEnglish: 'Nabawi Olive & Dome',
    descriptionUrdu: 'پرسکون زیتونی سبز اور شاہی سنہری جھلک',
    lightBg: '#eff5ec',
    lightSurface: '#e2ede0',
    lightText: '#132415',
    darkBg: '#0b190f',
    darkSurface: '#122717',
    primary: '#1b5e20',
    primaryHover: '#237329',
    accent: '#c9a227',
    led: '#7fffb2',
    panelBg: '#081b0c',
    patternStrokeHex: 'c9a227',
  },
  {
    id: 'kaaba-onyx',
    nameUrdu: 'غلافِ کعبہ و سنہری',
    nameEnglish: 'Kaaba Kiswah Onyx',
    descriptionUrdu: 'موقر مشکین سیاہ اور خالص سنہری خطاطی',
    lightBg: '#f6f3eb',
    lightSurface: '#ece6d8',
    lightText: '#1c1812',
    darkBg: '#0f0d0a',
    darkSurface: '#1a1612',
    primary: '#221d17',
    primaryHover: '#332c23',
    accent: '#d4af37',
    led: '#ffd54f',
    panelBg: '#120f0b',
    patternStrokeHex: 'd4af37',
  },
  {
    id: 'haram-turquoise',
    nameUrdu: 'فیروزی حرم و موتی',
    nameEnglish: 'Haram Turquoise Mist',
    descriptionUrdu: 'ٹھنڈا فیروزی سنگِ مرمر اور عقیق سبز',
    lightBg: '#edf6f5',
    lightSurface: '#dceeed',
    lightText: '#0c2423',
    darkBg: '#051718',
    darkSurface: '#092628',
    primary: '#006156',
    primaryHover: '#007a6c',
    accent: '#cfb15b',
    led: '#4dd0e1',
    panelBg: '#031819',
    patternStrokeHex: '4dd0e1',
  },
  {
    id: 'quba-ivory',
    nameUrdu: 'مسجدِ قبا سفید موتی',
    nameEnglish: 'Quba Pearl Ivory',
    descriptionUrdu: 'گرم عاجی سفید اور کلاسیکی عنبری رنگ',
    lightBg: '#faf6ee',
    lightSurface: '#f1eadb',
    lightText: '#1d2418',
    darkBg: '#11160f',
    darkSurface: '#1a2216',
    primary: '#0c4a34',
    primaryHover: '#106245',
    accent: '#c29225',
    led: '#6ee7b7',
    panelBg: '#082418',
    patternStrokeHex: 'c29225',
  },
  {
    id: 'midnight-sapphire',
    nameUrdu: 'نیلگوں تہجد و چاندی',
    nameEnglish: 'Midnight Sapphire',
    descriptionUrdu: 'شبِ تہجد کی گہری نیلگوں فضا اور سنہری حاشیہ',
    lightBg: '#eef2f9',
    lightSurface: '#e0e8f5',
    lightText: '#101d36',
    darkBg: '#071122',
    darkSurface: '#0d1d38',
    primary: '#0f2c59',
    primaryHover: '#163d7a',
    accent: '#d4af37',
    led: '#7dd3fc',
    panelBg: '#050e20',
    patternStrokeHex: 'd4af37',
  },
  {
    id: 'madinah-sand',
    nameUrdu: 'ریگِ مدینہ و نخلستان',
    nameEnglish: 'Madinah Sand & Palm',
    descriptionUrdu: 'مدینہ منورہ کی سنہری ریت اور کھجور کا سبز رنگ',
    lightBg: '#f6f0e4',
    lightSurface: '#ebe1cd',
    lightText: '#221c12',
    darkBg: '#14110b',
    darkSurface: '#1f1a11',
    primary: '#19543e',
    primaryHover: '#216b4f',
    accent: '#c49a3a',
    led: '#a7f3d0',
    panelBg: '#0f1c14',
    patternStrokeHex: 'c49a3a',
  },
  {
    id: 'royal-burgundy',
    nameUrdu: 'زمرد و یاقوتِ حرم',
    nameEnglish: 'Royal Velvet & Gold',
    descriptionUrdu: 'عقیق و عنابی قالین اور سنہری محراب',
    lightBg: '#f7f0f2',
    lightSurface: '#efe2e6',
    lightText: '#291018',
    darkBg: '#16090e',
    darkSurface: '#241017',
    primary: '#5c162e',
    primaryHover: '#771d3c',
    accent: '#d4af37',
    led: '#fde68a',
    panelBg: '#230912',
    patternStrokeHex: 'd4af37',
  },
  {
    id: 'andalus-cedar',
    nameUrdu: 'اندلسی محراب و صنوبر',
    nameEnglish: 'Andalusian Cedar',
    descriptionUrdu: 'مسجدِ قرطبہ کا صنوبری سبز اور کانسی رنگ',
    lightBg: '#edf3ee',
    lightSurface: '#dde9df',
    lightText: '#13241c',
    darkBg: '#0a1612',
    darkSurface: '#12241e',
    primary: '#1b4d3e',
    primaryHover: '#246652',
    accent: '#c6923a',
    led: '#5eead4',
    panelBg: '#071c16',
    patternStrokeHex: 'c6923a',
  },
  {
    id: 'azam-golden-emerald',
    nameUrdu: 'سبزِ اعظم و روشن طلائی',
    nameEnglish: 'Radiant Emerald Gold',
    descriptionUrdu: 'گہرا خوشنما سبز بیک گراؤنڈ اور چمکتا سونا',
    lightBg: '#e7f3ec',
    lightSurface: '#d5eadf',
    lightText: '#0a2417',
    darkBg: '#041b10',
    darkSurface: '#082c1b',
    primary: '#04562e',
    primaryHover: '#06703c',
    accent: '#e0b32c',
    led: '#00ff99',
    panelBg: '#022212',
    patternStrokeHex: 'e0b32c',
  },
];

export const THEME_REMOTE_CACHE_KEY = 'khanqah_remote_theme_cache_v1';
export const THEME_LOCAL_OVERRIDE_KEY = 'khanqah_local_theme_override_v1';

export function getThemePaletteById(themeId?: string | null): IslamicThemePalette {
  return ISLAMIC_THEMES.find((t) => t.id === themeId) || ISLAMIC_THEMES[0];
}

export function loadLocalThemeOverride(): string {
  try {
    return localStorage.getItem(THEME_LOCAL_OVERRIDE_KEY) || 'auto';
  } catch {
    return 'auto';
  }
}

export function saveLocalThemeOverride(themeIdOrAuto: string): void {
  try {
    localStorage.setItem(THEME_LOCAL_OVERRIDE_KEY, themeIdOrAuto);
  } catch {}
}

export function loadCachedRemoteTheme(): IslamicThemePalette {
  try {
    const raw = localStorage.getItem(THEME_REMOTE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<IslamicThemePalette>;
      if (parsed && parsed.id) {
        const base = getThemePaletteById(parsed.id);
        return { ...base, ...parsed };
      }
    }
  } catch {}
  return ISLAMIC_THEMES[0];
}

function saveCachedRemoteTheme(theme: IslamicThemePalette): void {
  try {
    localStorage.setItem(THEME_REMOTE_CACHE_KEY, JSON.stringify(theme));
  } catch {}
}

function sanitizeHexColor(val: string | null | undefined): string | undefined {
  if (!val) return undefined;
  const trimmed = val.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : undefined;
}

export function parseKhanqahThemeHtml(html: string): IslamicThemePalette | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const el =
      doc.querySelector('#khanqah-active-theme') ||
      doc.querySelector('[data-theme]');
    if (!el) return null;

    const themeId = (el.getAttribute('data-theme') || '').trim();
    const base = getThemePaletteById(themeId);

    const customLightBg = sanitizeHexColor(el.getAttribute('data-light-bg'));
    const customLightSurface = sanitizeHexColor(el.getAttribute('data-light-surface'));
    const customDarkBg = sanitizeHexColor(el.getAttribute('data-dark-bg'));
    const customDarkSurface = sanitizeHexColor(el.getAttribute('data-dark-surface'));
    const customPrimary = sanitizeHexColor(el.getAttribute('data-primary'));
    const customAccent = sanitizeHexColor(el.getAttribute('data-accent'));
    const customLed = sanitizeHexColor(el.getAttribute('data-led'));
    const customPanelBg = sanitizeHexColor(el.getAttribute('data-panel-bg'));

    return {
      ...base,
      lightBg: customLightBg || base.lightBg,
      lightSurface: customLightSurface || base.lightSurface,
      darkBg: customDarkBg || base.darkBg,
      darkSurface: customDarkSurface || base.darkSurface,
      primary: customPrimary || base.primary,
      accent: customAccent || base.accent,
      led: customLed || base.led,
      panelBg: customPanelBg || base.panelBg,
    };
  } catch {
    return null;
  }
}

export async function fetchKhanqahRemoteTheme(): Promise<IslamicThemePalette | null> {
  // 1. Primary: Official GitHub Pages HTML (https://naqshbandia.github.io/index.html/khanqah-theme.html)
  try {
    const res = await fetch(`${KHANQAH_THEME_HTML_URL}?_t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const html = await res.text();
      const parsed = parseKhanqahThemeHtml(html);
      if (parsed) {
        saveCachedRemoteTheme(parsed);
        return parsed;
      }
    }
  } catch {}

  // 2. Fallback: Local bundled public/khanqah-theme.html
  try {
    const localUrl = `${import.meta.env.BASE_URL}khanqah-theme.html?_t=${Date.now()}`;
    const res = await fetch(localUrl, { cache: 'no-store' });
    if (res.ok) {
      const html = await res.text();
      const parsed = parseKhanqahThemeHtml(html);
      if (parsed) {
        saveCachedRemoteTheme(parsed);
        return parsed;
      }
    }
  } catch {}

  return null;
}

export function applyIslamicThemeToDocument(
  palette: IslamicThemePalette,
  isDark: boolean
): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--kdf-light-bg', palette.lightBg);
  root.style.setProperty('--kdf-light-surface', palette.lightSurface);
  root.style.setProperty('--kdf-light-text', palette.lightText);
  root.style.setProperty('--kdf-dark-bg', palette.darkBg);
  root.style.setProperty('--kdf-dark-surface', palette.darkSurface);
  root.style.setProperty('--kdf-primary', palette.primary);
  root.style.setProperty('--kdf-primary-hover', palette.primaryHover);
  root.style.setProperty('--kdf-accent', palette.accent);
  root.style.setProperty('--kdf-led', palette.led);
  root.style.setProperty('--kdf-panel-bg', palette.panelBg);
  root.style.setProperty('--primary-green', palette.primary);
  root.style.setProperty('--accent-gold', palette.accent);
  root.style.setProperty('--led-green', palette.led);
  root.style.setProperty('--bg-light', palette.lightBg);

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', isDark ? palette.darkBg : palette.primary);
  }
}

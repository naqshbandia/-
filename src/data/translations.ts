import { FarzKey, JamaatKey } from '../utils/prayerEngine';

export type AppLanguage =
  | 'ur'
  | 'ps'
  | 'en'
  | 'ar'
  | 'fa'
  | 'tr'
  | 'id'
  | 'bn'
  | 'hi'
  | 'fr'
  | 'es'
  | 'de'
  | 'ru'
  | 'zh';

export const DEFAULT_LANGUAGE: AppLanguage = 'ur';
export const LANG_STORAGE_KEY = 'khanqah_app_lang_v1';

const RTL_LANGUAGES = new Set<AppLanguage>(['ur', 'ps', 'ar', 'fa']);

export function isValidAppLanguage(val: string | null): val is AppLanguage {
  return (
    val === 'ur' ||
    val === 'ps' ||
    val === 'en' ||
    val === 'ar' ||
    val === 'fa' ||
    val === 'tr' ||
    val === 'id' ||
    val === 'bn' ||
    val === 'hi' ||
    val === 'fr' ||
    val === 'es' ||
    val === 'de' ||
    val === 'ru' ||
    val === 'zh'
  );
}

export function getDir(lang: AppLanguage): 'rtl' | 'ltr' {
  return RTL_LANGUAGES.has(lang) ? 'rtl' : 'ltr';
}

export function getDateLocale(lang: AppLanguage): string {
  switch (lang) {
    case 'ur':
      return 'ur-PK';
    case 'ps':
      return 'ps';
    case 'ar':
      return 'ar-SA';
    case 'fa':
      return 'fa-IR';
    case 'tr':
      return 'tr-TR';
    case 'id':
      return 'id-ID';
    case 'bn':
      return 'bn-BD';
    case 'hi':
      return 'hi-IN';
    case 'fr':
      return 'fr-FR';
    case 'es':
      return 'es-ES';
    case 'de':
      return 'de-DE';
    case 'ru':
      return 'ru-RU';
    case 'zh':
      return 'zh-CN';
    default:
      return 'en-US';
  }
}

export const LANGUAGE_OPTIONS: {
  code: AppLanguage;
  shortLabel: string;
  nativeLabel: string;
  englishHint: string;
}[] = [
  { code: 'ur', shortLabel: 'اردو', nativeLabel: 'اردو', englishHint: 'Urdu' },
  { code: 'ps', shortLabel: 'پښتو', nativeLabel: 'پښتو', englishHint: 'Pashto' },
  { code: 'en', shortLabel: 'EN', nativeLabel: 'English', englishHint: 'Global' },
  { code: 'ar', shortLabel: 'عربي', nativeLabel: 'العربية', englishHint: 'Arabic' },
  { code: 'fa', shortLabel: 'فارسی', nativeLabel: 'فارسی / دری', englishHint: 'Persian' },
  { code: 'tr', shortLabel: 'TR', nativeLabel: 'Türkçe', englishHint: 'Turkish' },
  { code: 'id', shortLabel: 'ID', nativeLabel: 'Bahasa Indonesia', englishHint: 'Malay/Indo' },
  { code: 'bn', shortLabel: 'বাংলা', nativeLabel: 'বাংলা', englishHint: 'Bengali' },
  { code: 'hi', shortLabel: 'हिन्दी', nativeLabel: 'हिन्दी', englishHint: 'Hindi' },
  { code: 'fr', shortLabel: 'FR', nativeLabel: 'Français', englishHint: 'French' },
  { code: 'es', shortLabel: 'ES', nativeLabel: 'Español', englishHint: 'Spanish' },
  { code: 'de', shortLabel: 'DE', nativeLabel: 'Deutsch', englishHint: 'German' },
  { code: 'ru', shortLabel: 'RU', nativeLabel: 'Русский', englishHint: 'Russian' },
  { code: 'zh', shortLabel: '中文', nativeLabel: '简体中文', englishHint: 'Chinese' },
];

const FARZ_NAMES: Record<AppLanguage, Record<FarzKey, string>> = {
  ur: { Fajr: 'فجر', Dhuhr: 'ظہر', Asr: 'عصر', Maghrib: 'مغرب', Isha: 'عشاء' },
  ps: { Fajr: 'سهار', Dhuhr: 'ماسپښین', Asr: 'مازیګر', Maghrib: 'ماښام', Isha: 'ماخوستن' },
  en: { Fajr: 'Fajr', Dhuhr: 'Dhuhr', Asr: 'Asr', Maghrib: 'Maghrib', Isha: 'Isha' },
  ar: { Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' },
  fa: { Fajr: 'صبح', Dhuhr: 'ظهر', Asr: 'عصر', Maghrib: 'مغرب', Isha: 'عشاء' },
  tr: { Fajr: 'İmsak', Dhuhr: 'Öğle', Asr: 'İkindi', Maghrib: 'Akşam', Isha: 'Yatsı' },
  id: { Fajr: 'Subuh', Dhuhr: 'Dzuhur', Asr: 'Ashar', Maghrib: 'Maghrib', Isha: 'Isya' },
  bn: { Fajr: 'ফজর', Dhuhr: 'যোহর', Asr: 'আসর', Maghrib: 'মাগরিব', Isha: 'এশা' },
  hi: { Fajr: 'फज्र', Dhuhr: 'ज़ोहर', Asr: 'अस्र', Maghrib: 'मग़रिब', Isha: 'इशा' },
  fr: { Fajr: 'Fajr', Dhuhr: 'Dhuhr', Asr: 'Asr', Maghrib: 'Maghrib', Isha: 'Isha' },
  es: { Fajr: 'Fajr', Dhuhr: 'Dhuhr', Asr: 'Asr', Maghrib: 'Maghrib', Isha: 'Isha' },
  de: { Fajr: 'Fajr', Dhuhr: 'Dhuhr', Asr: 'Asr', Maghrib: 'Maghrib', Isha: 'Isha' },
  ru: { Fajr: 'Фаджр', Dhuhr: 'Зухр', Asr: 'Аср', Maghrib: 'Магриб', Isha: 'Иша' },
  zh: { Fajr: '晨礼', Dhuhr: '晌礼', Asr: '晡礼', Maghrib: '昏礼', Isha: '宵礼' },
};

const JAMAAT_NAMES: Record<AppLanguage, Record<JamaatKey, string>> = {
  ur: { Fajr: 'فجر', Dhuhr: 'ظہر', Asr: 'عصر', Maghrib: 'مغرب', Isha: 'عشاء', Jummah: 'جمعہ' },
  ps: { Fajr: 'سهار', Dhuhr: 'ماسپښین', Asr: 'مازیګر', Maghrib: 'ماښام', Isha: 'ماخوستن', Jummah: 'جمعه' },
  en: { Fajr: 'Fajr', Dhuhr: 'Dhuhr', Asr: 'Asr', Maghrib: 'Maghrib', Isha: 'Isha', Jummah: 'Jummah' },
  ar: { Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء', Jummah: 'الجمعة' },
  fa: { Fajr: 'صبح', Dhuhr: 'ظهر', Asr: 'عصر', Maghrib: 'مغرب', Isha: 'عشاء', Jummah: 'جمعه' },
  tr: { Fajr: 'Sabah', Dhuhr: 'Öğle', Asr: 'İkindi', Maghrib: 'Akşam', Isha: 'Yatsı', Jummah: 'Cuma' },
  id: { Fajr: 'Subuh', Dhuhr: 'Dzuhur', Asr: 'Ashar', Maghrib: 'Maghrib', Isha: 'Isya', Jummah: 'Jumat' },
  bn: { Fajr: 'ফজর', Dhuhr: 'যোহর', Asr: 'আসর', Maghrib: 'মাগরিব', Isha: 'এশা', Jummah: 'জুমা' },
  hi: { Fajr: 'फज्र', Dhuhr: 'ज़ोहर', Asr: 'अस्र', Maghrib: 'मग़रिब', Isha: 'इशा', Jummah: 'जुमा' },
  fr: { Fajr: 'Fajr', Dhuhr: 'Dhuhr', Asr: 'Asr', Maghrib: 'Maghrib', Isha: 'Isha', Jummah: 'Jumuah' },
  es: { Fajr: 'Fajr', Dhuhr: 'Dhuhr', Asr: 'Asr', Maghrib: 'Maghrib', Isha: 'Isha', Jummah: 'Yumuah' },
  de: { Fajr: 'Fajr', Dhuhr: 'Dhuhr', Asr: 'Asr', Maghrib: 'Maghrib', Isha: 'Isha', Jummah: 'Dschuma' },
  ru: { Fajr: 'Фаджр', Dhuhr: 'Зухр', Asr: 'Аср', Maghrib: 'Магриб', Isha: 'Иша', Jummah: 'Джума' },
  zh: { Fajr: '晨礼', Dhuhr: '晌礼', Asr: '晡礼', Maghrib: '昏礼', Isha: '宵礼', Jummah: '主麻' },
};

const NAWAFIL_NAMES: Record<AppLanguage, Record<string, string>> = {
  ur: { Tahajjud: 'تہجد', Ishraq: 'اشراق', Chasht: 'چاشت (ضحیٰ)', Zawal: 'زوال (مکروہ)', Awwabin: 'اوابین' },
  ps: { Tahajjud: 'تهجد', Ishraq: 'اشراق', Chasht: 'څاښت (ضحیٰ)', Zawal: 'زوال (مکروه)', Awwabin: 'اوابین' },
  en: { Tahajjud: 'Tahajjud', Ishraq: 'Ishraq', Chasht: 'Duha (Chasht)', Zawal: 'Zawal (Makruh)', Awwabin: 'Awwabin' },
  ar: { Tahajjud: 'التهجد', Ishraq: 'الإشراق', Chasht: 'الضحى', Zawal: 'الزوال (مكروه)', Awwabin: 'الأوابين' },
  fa: { Tahajjud: 'تهجد', Ishraq: 'اشراق', Chasht: 'چاشت (ضحی)', Zawal: 'زوال (مکروه)', Awwabin: 'اوابین' },
  tr: { Tahajjud: 'Teheccüd', Ishraq: 'İşrak', Chasht: 'Kuşluk (Duha)', Zawal: 'Zeval (Kerahet)', Awwabin: 'Evvabin' },
  id: { Tahajjud: 'Tahajud', Ishraq: 'Isyraq', Chasht: 'Dhuha', Zawal: 'Zawal (Terlarang)', Awwabin: 'Awwabin' },
  bn: { Tahajjud: 'তাহাজ্জুদ', Ishraq: 'ইশরাক', Chasht: 'চাশত (দুহা)', Zawal: 'যাওয়াল (নিষিদ্ধ)', Awwabin: 'আওয়াবীন' },
  hi: { Tahajjud: 'तहज्जुद', Ishraq: 'इश्राक़', Chasht: 'चाश्त (ज़ुहा)', Zawal: 'ज़वाल (मक्रूह)', Awwabin: 'अव्वाबीन' },
  fr: { Tahajjud: 'Tahajjud', Ishraq: 'Ishraq', Chasht: 'Duha', Zawal: 'Zawal (Déconseillé)', Awwabin: 'Awwabin' },
  es: { Tahajjud: 'Tahajjud', Ishraq: 'Ishraq', Chasht: 'Duha', Zawal: 'Zawal (Prohibido)', Awwabin: 'Awwabin' },
  de: { Tahajjud: 'Tahajjud', Ishraq: 'Ischraq', Chasht: 'Duha', Zawal: 'Zawal (Verboten)', Awwabin: 'Awwabin' },
  ru: { Tahajjud: 'Тахаджуд', Ishraq: 'Ишрак', Chasht: 'Духа', Zawal: 'Заваль (Запрет)', Awwabin: 'Аввабин' },
  zh: { Tahajjud: '夜功', Ishraq: '日出拜', Chasht: '上午拜', Zawal: '正午禁时', Awwabin: '归主拜' },
};

export function getFarzLabel(lang: AppLanguage, key: FarzKey): string {
  return FARZ_NAMES[lang][key] || FARZ_NAMES.ur[key];
}

export function getJamaatLabel(lang: AppLanguage, key: JamaatKey): string {
  return JAMAAT_NAMES[lang][key] || JAMAAT_NAMES.ur[key];
}

export function getNawafilLabel(lang: AppLanguage, key: string): string {
  return NAWAFIL_NAMES[lang][key] || NAWAFIL_NAMES.ur[key] || key;
}

export interface UIStrings {
  appName: string;
  appSubtitle: string;
  sheikhFullTitle: string;
  headerMenuTitle: string;
  headerHomeTitle: string;
  headerDesktopMode: string;
  headerMobileMode: string;
  headerThemeLight: string;
  headerThemeDark: string;
  headerSearchTitle: string;
  headerLanguageLabel: string;
  toastDesktopMode: string;
  toastMobileMode: string;
  toastLangChanged: string;

  tickerBadge: string;
  hijriLoading: string;
  tabFarz: string;
  tabNawafil: string;
  tabJamaat: string;
  nextPrayer: string;
  untilPrefix: string;
  farzLoading: string;
  nawafilLoading: string;
  sunriseLabel: string;
  zawalNote: string;
  myMosqueDefault: string;
  myMosqueScheduleLabel: string;
  editTimesBtn: string;
  saveCloseBtn: string;
  resetDefaultBtn: string;
  resetDefaultNotice: string;
  mosqueNameLabel: string;
  mosqueNamePlaceholder: string;
  jamaatSuffix: string;
  modeAutoLabel: string;
  modeCustomLabel: string;
  minuteUnit: string;
  fixedBadge: string;
  khanqahScheduleTitle: string;
  officialBadge: string;
  refreshBtn: string;
  refreshingBtn: string;
  khanqahScheduleRefreshed: string;
  khanqahScheduleCached: string;

  mixlrTitle: string;
  mixlrSubtitle: string;
  mixlrBtn: string;
  mixlrOfflineToast: string;
  liveNotifyActive: string;
  changeBtn: string;
  turnOffBtn: string;
  enableLiveNotifyBtn: string;
  emailPlaceholder: string;
  turnOnBtn: string;
  laterBtn: string;
  invalidEmailToast: string;
  savedEmailToast: string;
  clearedEmailToast: string;

  latestBayanatTitle: string;
  latestBayanatSub: string;
  viewAllBayanat: string;
  newBadge: string;
  newShortBadge: string;
  playLabel: string;
  listenLabel: string;
  playingLabel: string;
  downloadLabel: string;
  loadingLabel: string;
  shareLabel: string;

  foldersHeading: string;
  refreshFoldersTitle: string;
  audioLibraryTitle: string;
  audioLibrarySubSuffix: string;
  whatsappGroupsTitle: string;
  whatsappGroupsSub: string;

  footerFolderKhanqah: string;
  footerFolderKhanqahSub: string;
  footerFolderSheikh: string;
  footerFolderSheikhSub: string;
  footerFolderTerms: string;
  footerFolderTermsSub: string;
  footerFolderPrivacy: string;
  footerFolderPrivacySub: string;
  footerFolderContact: string;
  footerFolderContactSub: string;
  giftShareAppBtn: string;
  giftShareToast: string;
  devCtaBtn: string;
  copyrightLine: string;

  drawerCloseTitle: string;
  drawerLightTheme: string;
  drawerDarkTheme: string;
  drawerUpdate: string;
  drawerSwitchToMobile: string;
  drawerSwitchToDesktop: string;
  drawerDesktopTag: string;
  drawerMobileTag: string;
  drawerDownloadApk: string;
  drawerSec1: string;
  drawerItemHome: string;
  drawerItemAllBayanat: string;
  drawerItemGoldAudio: string;
  drawerItemBooks: string;
  drawerItemNews: string;
  drawerItemWebsite: string;
  drawerSec2: string;
  drawerItemIntroKhanqah: string;
  drawerItemIntroSheikh: string;
  drawerItemTerms: string;
  drawerItemPrivacy: string;
  drawerSec3: string;
  drawerItemWaGroups: string;
  drawerJoinTag: string;
  drawerItemContact: string;
  drawerItemAbout: string;

  bannerInstallPrompt: string;
  bannerInstallApk: string;
  bannerWebApp: string;
  bannerApkDownloading: string;
  bannerModalTitle: string;
  bannerDownloadApkBtn: string;
  bannerStep1Text: string;
  bannerStep2Text: string;
  bannerStep3Text: string;
  closeBtn: string;

  searchPlaceholder: string;
  clearBtn: string;
  filterLabel: string;
  filterAll: string;
  filterFolders: string;
  filterBayanat: string;
  filterIslahi: string;
  filterDars: string;
  filterPosts: string;
  resultsAvailable: string;
  searchHint: string;
  noResults: string;
  openPost: string;
  downloadWholeFolder: string;
  filesWord: string;
  downloadingText: string;
  modalOkClose: string;
  modalKhanqahTitle: string;
  modalSheikhTitle: string;
  modalContactTitle: string;
  modalWaGroupsTitle: string;
  modalAboutTitle: string;
  modalTermsTitle: string;
  modalPrivacyTitle: string;
}

const ENGLISH_BASE: UIStrings = {
  appName: 'Khanqah Darul Falah',
  appSubtitle: 'Silsila Aaliya Naqshbandiya Mujaddidiya',
  sheikhFullTitle: 'Sheikh-ul-Hadees Hazrat Maulana Peer Muhammad Jamshaid Naqshbandi Mujaddidi (D.B.)',
  headerMenuTitle: 'Menu',
  headerHomeTitle: 'Home Dashboard',
  headerDesktopMode: 'Desktop',
  headerMobileMode: 'Mobile',
  headerThemeLight: 'Switch to Light Theme',
  headerThemeDark: 'Switch to Dark Theme',
  headerSearchTitle: 'Search',
  headerLanguageLabel: 'Select Language',
  toastDesktopMode: 'Desktop mode enabled',
  toastMobileMode: 'Mobile mode enabled',
  toastLangChanged: 'Language switched to English',

  tickerBadge: 'Notice',
  hijriLoading: 'Loading Hijri date...',
  tabFarz: 'Obligatory',
  tabNawafil: 'Nawafil & Sunnah',
  tabJamaat: "Jama'at Times",
  nextPrayer: 'Next',
  untilPrefix: 'to',
  farzLoading: 'Loading obligatory prayer times...',
  nawafilLoading: 'Loading Nawafil timings...',
  sunriseLabel: 'Sunrise:',
  zawalNote: 'Prayer is prohibited during Makruh Zawal (10 mins before Dhuhr)',
  myMosqueDefault: 'My Mosque',
  myMosqueScheduleLabel: "My Mosque Jama'at Schedule",
  editTimesBtn: 'Edit Times',
  saveCloseBtn: 'Save & Close',
  resetDefaultBtn: 'Default',
  resetDefaultNotice: 'Mosque schedule reset to defaults.',
  mosqueNameLabel: 'Mosque Name:',
  mosqueNamePlaceholder: 'e.g., Jamia Masjid...',
  jamaatSuffix: "Jama'at",
  modeAutoLabel: 'After Adhan (mins)',
  modeCustomLabel: 'Fixed Time',
  minuteUnit: 'min',
  fixedBadge: 'Fixed',
  khanqahScheduleTitle: "Khanqah Darul Falah Jama'at Schedule",
  officialBadge: 'Official',
  refreshBtn: 'Refresh',
  refreshingBtn: 'Updating...',
  khanqahScheduleRefreshed: "Khanqah Darul Falah Jama'at timings updated!",
  khanqahScheduleCached: 'Showing saved timings.',

  mixlrTitle: 'Live Audio Broadcast (Mixlr)',
  mixlrSubtitle: 'No live audio is streaming right now — it will play automatically once live',
  mixlrBtn: 'Live Audio (Mixlr)',
  mixlrOfflineToast: 'No live broadcast is active right now; audio will start automatically once live.',
  liveNotifyActive: 'Live notification active:',
  changeBtn: 'Change',
  turnOffBtn: 'Disable',
  enableLiveNotifyBtn: 'Enable Live Bayan Notifications',
  emailPlaceholder: 'Enter your Gmail address...',
  turnOnBtn: 'Enable',
  laterBtn: 'Later',
  invalidEmailToast: 'Please enter a valid Gmail address',
  savedEmailToast: 'JazakAllah! Your Gmail is saved for live bayan alerts.',
  clearedEmailToast: 'Notification email removed.',

  latestBayanatTitle: 'Latest Uploaded Bayanat',
  latestBayanatSub: 'Most recently added recordings (highlighted NEW for 7 days)',
  viewAllBayanat: 'View All Bayanat',
  newBadge: 'NEW',
  newShortBadge: 'NEW',
  playLabel: 'Play',
  listenLabel: 'Play',
  playingLabel: 'Playing',
  downloadLabel: 'Download',
  loadingLabel: 'Loading...',
  shareLabel: 'Share',

  foldersHeading: 'Folders & Islamic Library',
  refreshFoldersTitle: 'Refresh Folders',
  audioLibraryTitle: 'Audio Library (MP3)',
  audioLibrarySubSuffix: 'Bayanat · Offline Download',
  whatsappGroupsTitle: 'WhatsApp Groups',
  whatsappGroupsSub: 'Official Channel & Groups',

  footerFolderKhanqah: 'Khanqah Intro',
  footerFolderKhanqahSub: 'Mission & Center',
  footerFolderSheikh: 'Sheikh Bio',
  footerFolderSheikhSub: 'Life & Services',
  footerFolderTerms: 'Terms & Rules',
  footerFolderTermsSub: 'Usage Policy',
  footerFolderPrivacy: 'Privacy Policy',
  footerFolderPrivacySub: 'Data Safety',
  footerFolderContact: 'Contact Us',
  footerFolderContactSub: 'WhatsApp & Social',
  giftShareAppBtn: 'Gift & Share This App With Friends',
  giftShareToast: 'Sharing app as a gift on WhatsApp...',
  devCtaBtn: 'Need Guidance, Website or Mobile App Development? Click Here',
  copyrightLine: 'Khanqah Darul Falah · All Rights Reserved © 2026',

  drawerCloseTitle: 'Close',
  drawerLightTheme: 'Light Theme',
  drawerDarkTheme: 'Dark Theme',
  drawerUpdate: 'Refresh',
  drawerSwitchToMobile: 'Switch to Mobile Mode',
  drawerSwitchToDesktop: 'Enable Desktop Mode',
  drawerDesktopTag: 'Desktop',
  drawerMobileTag: 'Mobile',
  drawerDownloadApk: 'Download Android APK App',
  drawerSec1: 'Pages & Audio Library',
  drawerItemHome: '1. Home Dashboard',
  drawerItemAllBayanat: '2. All Bayanat (By Folder)',
  drawerItemGoldAudio: '3. Gold Audio Page & Majalis',
  drawerItemBooks: '4. Islamic Urdu Books Library',
  drawerItemNews: '5. News & Announcements',
  drawerItemWebsite: '6. Official Website (Blogger)',
  drawerSec2: 'Introduction & Policies',
  drawerItemIntroKhanqah: '7. Intro: Khanqah Darul Falah',
  drawerItemIntroSheikh: '8. Intro: Sheikh Peer M. Jamshaid',
  drawerItemTerms: '9. Terms & Conditions',
  drawerItemPrivacy: '10. Privacy Policy',
  drawerSec3: 'Contact & Community',
  drawerItemWaGroups: 'WhatsApp Groups & Channel',
  drawerJoinTag: 'Join',
  drawerItemContact: 'Contact Us',
  drawerItemAbout: 'About Application',

  bannerInstallPrompt: 'Install Official Khanqah Darul Falah Android App',
  bannerInstallApk: 'Install (APK)',
  bannerWebApp: 'Web App',
  bannerApkDownloading: 'Official Android APK download started...',
  bannerModalTitle: 'Khanqah Darul Falah App Installation',
  bannerDownloadApkBtn: 'Download APK',
  bannerStep1Text: 'Tap Download APK below to install directly on Android.',
  bannerStep2Text: 'Or tap browser menu (⋮) / Share and select "Add to Home screen".',
  bannerStep3Text: 'The app will appear on your home screen with the official Khanqah logo.',
  closeBtn: 'Close',

  searchPlaceholder: 'Search bayan title, folder, date (2026), venue or post...',
  clearBtn: 'Clear',
  filterLabel: 'Filter:',
  filterAll: 'All',
  filterFolders: 'Folders',
  filterBayanat: 'All Bayanat',
  filterIslahi: 'Islahi Majalis',
  filterDars: 'Dars-e-Quran',
  filterPosts: 'Books & Posts',
  resultsAvailable: 'Results found:',
  searchHint: 'Download or share directly on WhatsApp',
  noResults: 'No matching results found. Try another keyword or date.',
  openPost: 'Open Post',
  downloadWholeFolder: 'Download Whole Folder',
  filesWord: 'files',
  downloadingText: 'Downloading...',
  modalOkClose: 'OK (Close)',
  modalKhanqahTitle: 'Introduction: Khanqah Darul Falah',
  modalSheikhTitle: 'Introduction: Sheikh Maulana M. Jamshaid (D.B.)',
  modalContactTitle: 'Contact Information',
  modalWaGroupsTitle: 'Official WhatsApp Groups & Channel',
  modalAboutTitle: 'About Application',
  modalTermsTitle: 'Terms & Conditions',
  modalPrivacyTitle: 'Privacy Policy',
};

export const UI_STRINGS: Record<AppLanguage, UIStrings> = {
  ur: {
    appName: 'خانقاہ دارالفلاح',
    appSubtitle: 'سلسلہ عالیہ نقشبندیہ مجددیہ',
    sheikhFullTitle: 'شیخ الحدیث حضرت مولانا پیر محمد جمشید نقشبندی مجددی دامت برکاتہم',
    headerMenuTitle: 'مینو (Menu)',
    headerHomeTitle: 'ہوم ڈیش بورڈ',
    headerDesktopMode: 'ڈیسک ٹاپ',
    headerMobileMode: 'موبائل موڈ',
    headerThemeLight: 'نارمل (لائٹ) تھیم لگائیں',
    headerThemeDark: 'ڈارک تھیم لگائیں',
    headerSearchTitle: 'تلاش (Search)',
    headerLanguageLabel: 'زبان منتخب کریں',
    toastDesktopMode: 'ڈیسک ٹاپ موڈ فعال کر دیا گیا ہے',
    toastMobileMode: 'موبائل موڈ فعال کر دیا گیا ہے',
    toastLangChanged: 'اردو زبان فعال کر دی گئی ہے',

    tickerBadge: 'پیغام',
    hijriLoading: 'ہجری تاریخ لوڈ ہو رہی ہے...',
    tabFarz: 'فرض نمازیں',
    tabNawafil: 'دیگر نمازیں',
    tabJamaat: 'جماعت اوقات',
    nextPrayer: 'اگلی نماز',
    untilPrefix: 'تا',
    farzLoading: 'فرض نمازوں کے اوقات لوڈ ہو رہے ہیں...',
    nawafilLoading: 'نوافل کے اوقات لوڈ ہو رہے ہیں...',
    sunriseLabel: 'طلوعِ آفتاب:',
    zawalNote: 'مکروہ زوال کے وقت (ظہر سے 10 منٹ قبل) نماز ممنوع ہے',
    myMosqueDefault: 'میری مسجد',
    myMosqueScheduleLabel: 'اپنی مسجد کے باجماعت اوقات',
    editTimesBtn: 'اوقات سیٹ / تبدیل کریں',
    saveCloseBtn: 'محفوظ / بند کریں',
    resetDefaultBtn: 'ڈیفالٹ',
    resetDefaultNotice: 'مسجد کے اوقات ڈیفالٹ سیٹنگ پر بحال کر دیے گئے۔',
    mosqueNameLabel: 'اپنی مسجد کا نام:',
    mosqueNamePlaceholder: 'مثلاً جامع مسجد رحمانیہ...',
    jamaatSuffix: 'جماعت',
    modeAutoLabel: 'اذان کے بعد (منٹ)',
    modeCustomLabel: 'مقررہ وقت',
    minuteUnit: 'منٹ',
    fixedBadge: 'مقررہ',
    khanqahScheduleTitle: 'خانقاہ دارالفلاح کے باجماعت اوقات',
    officialBadge: 'آفیشل',
    refreshBtn: 'تازہ کریں',
    refreshingBtn: 'تازہ جاری...',
    khanqahScheduleRefreshed: 'خانقاہ دارالفلاح کے باجماعت اوقات تازہ ہو گئے!',
    khanqahScheduleCached: 'موجودہ محفوظ شدہ اوقات دکھائے جا رہے ہیں۔',

    mixlrTitle: 'لائیو آڈیو بیان (Mixlr)',
    mixlrSubtitle: 'اس وقت کوئی لائیو آڈیو بیان نشر نہیں ہو رہا — نشر ہوتے ہی یہاں براہِ راست چلے گا',
    mixlrBtn: 'لائیو آڈیو نشریات (Mixlr)',
    mixlrOfflineToast: 'اس وقت کوئی لائیو آڈیو نشر نہیں ہو رہا؛ شروع ہوتے ہی خودکار طور پر یہاں آڈیو چلے گا۔',
    liveNotifyActive: 'لائیو نوٹیفیکیشن فعال ہے:',
    changeBtn: 'تبدیل کریں',
    turnOffBtn: 'بند کریں',
    enableLiveNotifyBtn: 'لائیو بیان نوٹیفیکیشن آن کریں',
    emailPlaceholder: 'اپنی Gmail یہاں لکھیں...',
    turnOnBtn: 'آن کریں',
    laterBtn: 'بعد میں',
    invalidEmailToast: 'براہ کرم درست Gmail پتہ درج کریں',
    savedEmailToast: 'جزاک اللہ! لائیو بیان نوٹیفیکیشن کے لیے آپ کی Gmail محفوظ ہو گئی ہے۔',
    clearedEmailToast: 'نوٹیفیکیشن ای میل ہٹا دیا گیا ہے۔',

    latestBayanatTitle: 'تازہ ترین اپلوڈ شدہ بیانات',
    latestBayanatSub: 'سب سے آخر میں شامل کیے گئے بیانات (7 دن تک "نیا" نشان کے ساتھ)',
    viewAllBayanat: 'تمام بیانات دیکھیں',
    newBadge: 'NEW · نیا',
    newShortBadge: 'نیا',
    playLabel: 'پلے',
    listenLabel: 'سنیں',
    playingLabel: 'چل رہا',
    downloadLabel: 'ڈاؤنلوڈ',
    loadingLabel: 'لوڈنگ...',
    shareLabel: 'شیئر',

    foldersHeading: 'فولڈرز اور اسلامی لائبریری',
    refreshFoldersTitle: 'فولڈرز تازہ کریں',
    audioLibraryTitle: 'آڈیو لائبریری (MP3)',
    audioLibrarySubSuffix: 'بیانات · آف لائن ڈاؤنلوڈ',
    whatsappGroupsTitle: 'واٹس ایپ گروپس',
    whatsappGroupsSub: 'آفیشل چینل و گروپس',

    footerFolderKhanqah: 'تعارفِ خانقاہ',
    footerFolderKhanqahSub: 'مرکز و مقاصد',
    footerFolderSheikh: 'تعارفِ شیخ',
    footerFolderSheikhSub: 'سوانح و خدمات',
    footerFolderTerms: 'شرائط و ضوابط',
    footerFolderTermsSub: 'اصولِ استعمال',
    footerFolderPrivacy: 'پرائیویسی پالیسی',
    footerFolderPrivacySub: 'مکمل رازداری',
    footerFolderContact: 'رابطہ کریں',
    footerFolderContactSub: 'واٹس ایپ و چینلز',
    giftShareAppBtn: 'یہ ایپ دوستوں کو بطورِ ہدیہ شیئر کریں',
    giftShareToast: 'واٹس ایپ پر دوستوں کو ایپ بطورِ ہدیہ شیئر کریں...',
    devCtaBtn: 'رہنمائی یا مشورہ کے لیے اور کاروباری ویب سائٹس یا ایپ بنانے کے لیے یہاں کلک کریں',
    copyrightLine: 'خانقاہ دارالفلاح · تمام حقوق محفوظ ہیں © 2026',

    drawerCloseTitle: 'بند کریں',
    drawerLightTheme: 'لائٹ تھیم',
    drawerDarkTheme: 'ڈارک تھیم',
    drawerUpdate: 'اپ ڈیٹ',
    drawerSwitchToMobile: 'موبائل موڈ پر جائیں (نارمل سائز)',
    drawerSwitchToDesktop: 'ڈیسک ٹاپ موڈ آن کریں',
    drawerDesktopTag: 'ڈیسک ٹاپ',
    drawerMobileTag: 'موبائل',
    drawerDownloadApk: 'اینڈرائڈ APK ایپ ڈاؤنلوڈ کریں',
    drawerSec1: 'صفحات و آڈیو لائبریری',
    drawerItemHome: '1. ہوم ڈیش بورڈ',
    drawerItemAllBayanat: '2. تمام بیانات (فولڈر وائز)',
    drawerItemGoldAudio: '3. گولڈ آڈیو پیج و مجالس',
    drawerItemBooks: '4. اسلامی اردو کتب لائبریری',
    drawerItemNews: '5. خبریں اور اعلانات',
    drawerItemWebsite: '6. آفیشل ویب سائٹ (بلاگر)',
    drawerSec2: 'تعارف و پالیسیاں',
    drawerItemIntroKhanqah: '7. خانقاہ دارالفلاح کا تعارف',
    drawerItemIntroSheikh: '8. تعارف شیخ مولانا محمد جمشید صاحب',
    drawerItemTerms: '9. شرائط و ضوابط (Terms)',
    drawerItemPrivacy: '10. پرائیویسی پالیسی (Privacy)',
    drawerSec3: 'رابطہ و کمیونٹی',
    drawerItemWaGroups: 'واٹس ایپ گروپس و چینل',
    drawerJoinTag: 'جوائن',
    drawerItemContact: 'رابطہ کریں (Contact Us)',
    drawerItemAbout: 'ایپلیکیشن کے بارے میں',

    bannerInstallPrompt: 'خانقاہ دارالفلاح آفیشل اینڈرائڈ ایپ انسٹال کریں',
    bannerInstallApk: 'انسٹال کریں (APK)',
    bannerWebApp: 'ویب ایپ',
    bannerApkDownloading: 'آفیشل Android APK فائل ڈاؤنلوڈ شروع ہو گئی ہے...',
    bannerModalTitle: 'خانقاہ دارالفلاح ایپ انسٹالیشن',
    bannerDownloadApkBtn: 'APK ڈاؤنلوڈ کریں',
    bannerStep1Text: 'براہِ راست Android APK ڈاؤنلوڈ کرنے کے لیے نیچے ڈاؤنلوڈ APK بٹن دبائیں۔',
    bannerStep2Text: 'یا کروم کے تین نقطوں (⋮) یا شیئر سے "Add to Home screen" منتخب کریں۔',
    bannerStep3Text: 'ایپ خانقاہ دارالفلاح کے لوگو کے ساتھ آپ کے موبائل میں محفوظ ہو جائے گی۔',
    closeBtn: 'بند کریں',

    searchPlaceholder: 'بیان، کتاب، اشتہار، فولڈر یا تاریخ (2026) تلاش کریں...',
    clearBtn: 'صاف کریں',
    filterLabel: 'فلٹر:',
    filterAll: 'سب مواد',
    filterFolders: 'فولڈرز',
    filterBayanat: 'تمام بیانات',
    filterIslahi: 'اصلاحی مجالس',
    filterDars: 'دروسِ قرآن',
    filterPosts: 'کتب و اشتہارات',
    resultsAvailable: 'دستیاب نتائج:',
    searchHint: 'اسی صفحے سے ڈاؤنلوڈ یا واٹس ایپ پر شیئر کریں',
    noResults: 'کوئی نتیجہ نہیں ملا۔ دوسرا لفظ، تاریخ یا مقام تلاش کیجیے۔',
    openPost: 'پوسٹ کھولیں',
    downloadWholeFolder: 'پورا فولڈر ڈاؤنلوڈ کریں',
    filesWord: 'فائلیں',
    downloadingText: 'ڈاؤنلوڈ جاری ہے...',
    modalOkClose: 'ٹھیک ہے (بند کریں)',
    modalKhanqahTitle: 'خانقاہ دارالفلاح کا تعارف',
    modalSheikhTitle: 'تعارف شیخ حضرت مولانا پیر محمد جمشید صاحب',
    modalContactTitle: 'رابطہ کریں (Contact Information)',
    modalWaGroupsTitle: 'آفیشل واٹس ایپ گروپس و چینل',
    modalAboutTitle: 'ایپلیکیشن کے بارے میں (About App)',
    modalTermsTitle: 'شرائط و ضوابط (Terms & Conditions)',
    modalPrivacyTitle: 'پرائیویسی پالیسی (Privacy Policy)',
  },

  ps: {
    appName: 'خانقاہ دارالفلاح',
    appSubtitle: 'سلسله عالیه نقشبندیه مجددیه',
    sheikhFullTitle: 'شیخ الحدیث حضرت مولانا پیر محمد جمشید نقشبندی مجددی دامت برکاتهم',
    headerMenuTitle: 'مینو (Menu)',
    headerHomeTitle: 'کور پاڼه',
    headerDesktopMode: 'ډیسک ټاپ',
    headerMobileMode: 'موبایل حالت',
    headerThemeLight: 'روښانه بڼه فعاله کړئ',
    headerThemeDark: 'تیاره (تور) بڼه فعاله کړئ',
    headerSearchTitle: 'لټون (Search)',
    headerLanguageLabel: 'ژبه وټاکئ',
    toastDesktopMode: 'ډیسک ټاپ حالت فعال شو',
    toastMobileMode: 'موبایل حالت فعال شو',
    toastLangChanged: 'پښتو ژبه فعاله شوه',

    tickerBadge: 'خبرتیا',
    hijriLoading: 'هجري نېټه لوډ کېږي...',
    tabFarz: 'فرض لمونځونه',
    tabNawafil: 'نفل او وختونه',
    tabJamaat: 'جماعت وختونه',
    nextPrayer: 'راتلونکی',
    untilPrefix: 'تر',
    farzLoading: 'د فرض لمونځونو وختونه لوډ کېږي...',
    nawafilLoading: 'د نوافل وختونه لوډ کېږي...',
    sunriseLabel: 'لمر خاته:',
    zawalNote: 'د زوال په وخت کې (له ماسپښین ۱۰ دقیقې مخکې) لمونځ منع دی',
    myMosqueDefault: 'زما جومات',
    myMosqueScheduleLabel: 'زما د جومات د جماعت وختونه',
    editTimesBtn: 'وختونه بدل کړئ',
    saveCloseBtn: 'خوندي او بند کړئ',
    resetDefaultBtn: 'اصلي حالت',
    resetDefaultNotice: 'د جومات وختونه اصلي حالت ته راوګرځول شول.',
    mosqueNameLabel: 'د جومات نوم:',
    mosqueNamePlaceholder: 'د بېلګې په توګه: جامع جومات...',
    jamaatSuffix: 'جماعت',
    modeAutoLabel: 'له اذان وروسته (دقیقې)',
    modeCustomLabel: 'ټاکلی وخت',
    minuteUnit: 'دقیقې',
    fixedBadge: 'ټاکلی',
    khanqahScheduleTitle: 'د خانقاہ دارالفلاح د جماعت وختونه',
    officialBadge: 'رسمي',
    refreshBtn: 'تازه کول',
    refreshingBtn: 'تازه کېږي...',
    khanqahScheduleRefreshed: 'د خانقاہ دارالفلاح د جماعت وختونه تازه شول!',
    khanqahScheduleCached: 'خوندي شوي وختونه ښودل کېږي.',

    mixlrTitle: 'ژوندۍ آډیو خپرونه (Mixlr)',
    mixlrSubtitle: 'اوس کوم ژوندی بیان نه خپرېږي — د پیل سره سم به دلته په خپله چالان شي',
    mixlrBtn: 'ژوندۍ خپرونه (Mixlr)',
    mixlrOfflineToast: 'اوسمهال ژوندۍ خپرونه نشته؛ کله چې پیل شي دلته به په خپله واورېدل شي.',
    liveNotifyActive: 'ژوندۍ خبرتیا فعاله ده:',
    changeBtn: 'بدلول',
    turnOffBtn: 'بندول',
    enableLiveNotifyBtn: 'د ژوندي بیان خبرتیا فعاله کړئ',
    emailPlaceholder: 'خپل Gmail دلته ولیکئ...',
    turnOnBtn: 'فعالول',
    laterBtn: 'وروسته',
    invalidEmailToast: 'مهرباني وکړئ سم Gmail پته ولیکئ',
    savedEmailToast: 'جزاک الله! ستاسو Gmail د ژوندي بیان خبرتیا لپاره خوندي شو.',
    clearedEmailToast: 'د خبرتیا برېښنالیک لرې شو.',

    latestBayanatTitle: 'تازه پورته شوي بیانونه',
    latestBayanatSub: 'تر ټولو نوي اضافه شوي بیانونه (تر ۷ ورځو پورې د نوي نښې سره)',
    viewAllBayanat: 'ټول بیانونه وګورئ',
    newBadge: 'نوی · NEW',
    newShortBadge: 'نوی',
    playLabel: 'پلی',
    listenLabel: 'اورېدل',
    playingLabel: 'چالان دی',
    downloadLabel: 'ډاونلوډ',
    loadingLabel: 'لوډ کېږي...',
    shareLabel: 'شریکول',

    foldersHeading: 'فولډرونه او اسلامي کتابتون',
    refreshFoldersTitle: 'فولډرونه تازه کړئ',
    audioLibraryTitle: 'آډیو کتابتون (MP3)',
    audioLibrarySubSuffix: 'بیانونه · آفلاین ډاونلوډ',
    whatsappGroupsTitle: 'واټساپ ګروپونه',
    whatsappGroupsSub: 'رسمي چینل او ګروپونه',

    footerFolderKhanqah: 'د خانقاہ پېژندنه',
    footerFolderKhanqahSub: 'مرکز او موخې',
    footerFolderSheikh: 'د شیخ پېژندنه',
    footerFolderSheikhSub: 'ژوندلیک او خدمتونه',
    footerFolderTerms: 'شرایط او اصول',
    footerFolderTermsSub: 'د کارونې اصول',
    footerFolderPrivacy: 'محرمیت پالیسي',
    footerFolderPrivacySub: 'بشپړ محرمیت',
    footerFolderContact: 'اړیکه ونیسئ',
    footerFolderContactSub: 'واټساپ او چینلونه',
    giftShareAppBtn: 'دا اپلیکیشن له ملګرو سره د ډالۍ په توګه شریک کړئ',
    giftShareToast: 'په واټساپ کې ملګرو ته د اپلیکیشن شریکول...',
    devCtaBtn: 'د لارښوونې، ویب سایټ یا موبایل اپلیکیشن جوړولو لپاره دلته کلیک وکړئ',
    copyrightLine: 'خانقاہ دارالفلاح · ټول حقونه خوندي دي © 2026',

    drawerCloseTitle: 'بندول',
    drawerLightTheme: 'روښانه بڼه',
    drawerDarkTheme: 'تیاره بڼه',
    drawerUpdate: 'تازه کول',
    drawerSwitchToMobile: 'موبایل حالت ته لاړ شئ',
    drawerSwitchToDesktop: 'ډیسک ټاپ حالت فعال کړئ',
    drawerDesktopTag: 'ډیسک ټاپ',
    drawerMobileTag: 'موبایل',
    drawerDownloadApk: 'د انډرایډ APK اپلیکیشن ډاونلوډ کړئ',
    drawerSec1: 'پاڼې او آډیو کتابتون',
    drawerItemHome: '1. کور پاڼه (ډیش بورډ)',
    drawerItemAllBayanat: '2. ټول بیانونه (د فولډر له مخې)',
    drawerItemGoldAudio: '3. گولډ آډیو پاڼه او مجالس',
    drawerItemBooks: '4. اسلامي کتابتون',
    drawerItemNews: '5. خبرونه او اعلانونه',
    drawerItemWebsite: '6. رسمي ویب پاڼه (بلاګر)',
    drawerSec2: 'پېژندنه او پالیسۍ',
    drawerItemIntroKhanqah: '7. د خانقاہ دارالفلاح پېژندنه',
    drawerItemIntroSheikh: '8. د شیخ مولانا محمد جمشید صاحب پېژندنه',
    drawerItemTerms: '9. شرایط او اصول (Terms)',
    drawerItemPrivacy: '10. د محرمیت پالیسي (Privacy)',
    drawerSec3: 'اړیکه او ټولنه',
    drawerItemWaGroups: 'واټساپ ګروپونه او چینل',
    drawerJoinTag: 'شامل شئ',
    drawerItemContact: 'اړیکه ونیسئ',
    drawerItemAbout: 'د اپلیکیشن په اړه',

    bannerInstallPrompt: 'د خانقاہ دارالفلاح رسمي انډرایډ اپلیکیشن نصب کړئ',
    bannerInstallApk: 'نصبول (APK)',
    bannerWebApp: 'ویب ایپ',
    bannerApkDownloading: 'د رسمي انډرایډ APK ډاونلوډ پیل شو...',
    bannerModalTitle: 'د خانقاہ دارالفلاح اپلیکیشن نصبول',
    bannerDownloadApkBtn: 'APK ډاونلوډ کړئ',
    bannerStep1Text: 'د انډرایډ APK مستقیم نصبولو لپاره لاندې بټن کېکاږئ.',
    bannerStep2Text: 'یا د براوزر مینو (⋮) / شریکولو څخه "Add to Home screen" غوره کړئ.',
    bannerStep3Text: 'دا اپلیکیشن به د خانقاہ د لوګو سره ستاسو په موبایل کې خوندي شي.',
    closeBtn: 'بندول',

    searchPlaceholder: 'د بیان نوم، فولډر، نېټه (2026)، ځای یا اعلان ولټوئ...',
    clearBtn: 'پاکول',
    filterLabel: 'فلټر:',
    filterAll: 'ټول مواد',
    filterFolders: 'فولډرونه',
    filterBayanat: 'ټول بیانونه',
    filterIslahi: 'اصلاحي مجالس',
    filterDars: 'د قرآن درسونه',
    filterPosts: 'کتابونه او اعلانونه',
    resultsAvailable: 'موندل شوې پایلې:',
    searchHint: 'همدې پاڼې څخه ډاونلوډ یا پر واټساپ شریک کړئ',
    noResults: 'کومه پایله ونه موندل شوه. بله کلمه یا نېټه ولټوئ.',
    openPost: 'پوسټ پرانیزئ',
    downloadWholeFolder: 'ټول فولډر ډاونلوډ کړئ',
    filesWord: 'فایلونه',
    downloadingText: 'ډاونلوډ روان دی...',
    modalOkClose: 'سمه ده (بندول)',
    modalKhanqahTitle: 'د خانقاہ دارالفلاح پېژندنه',
    modalSheikhTitle: 'د شیخ حضرت مولانا پیر محمد جمشید صاحب پېژندنه',
    modalContactTitle: 'اړیکه ونیسئ (Contact Info)',
    modalWaGroupsTitle: 'رسمي واټساپ ګروپونه او چینل',
    modalAboutTitle: 'د اپلیکیشن په اړه',
    modalTermsTitle: 'شرایط او اصول',
    modalPrivacyTitle: 'د محرمیت پالیسي',
  },

  en: ENGLISH_BASE,

  ar: {
    appName: 'خانقاہ دار الفلاح',
    appSubtitle: 'السلسلة العالية النقشبندية المجددية',
    sheikhFullTitle: 'شيخ الحديث فضيلة الشيخ محمد جمشيد النقشبندي المجددي حفظه الله',
    headerMenuTitle: 'القائمة',
    headerHomeTitle: 'الرئيسية',
    headerDesktopMode: 'سطح المكتب',
    headerMobileMode: 'الجوال',
    headerThemeLight: 'الوضع النهاري',
    headerThemeDark: 'الوضع الليلي',
    headerSearchTitle: 'بحث',
    headerLanguageLabel: 'اختر اللغة',
    toastDesktopMode: 'تم تفعيل وضع سطح المكتب',
    toastMobileMode: 'تم تفعيل وضع الجوال',
    toastLangChanged: 'تم التبديل إلى اللغة العربية',

    tickerBadge: 'إعلان',
    hijriLoading: 'جارٍ تحميل التاريخ الهجري...',
    tabFarz: 'الصلوات المفروضة',
    tabNawafil: 'النوافل والأوقات',
    tabJamaat: 'أوقات الجماعة',
    nextPrayer: 'القادمة',
    untilPrefix: 'إلى',
    farzLoading: 'جارٍ تحميل مواقيت الصلوات...',
    nawafilLoading: 'جارٍ تحميل أوقات النوافل...',
    sunriseLabel: 'الشروق:',
    zawalNote: 'تُكره الصلاة عند الزوال (قبل الظهر بـ 10 دقائق)',
    myMosqueDefault: 'مسجدي',
    myMosqueScheduleLabel: 'أوقات الجماعة في مسجدي',
    editTimesBtn: 'تعديل الأوقات',
    saveCloseBtn: 'حفظ وإغلاق',
    resetDefaultBtn: 'افتراضي',
    resetDefaultNotice: 'تمت استعادة الأوقات الافتراضية.',
    mosqueNameLabel: 'اسم المسجد:',
    mosqueNamePlaceholder: 'مثال: الجامع الكبير...',
    jamaatSuffix: 'جماعة',
    modeAutoLabel: 'بعد الأذان (دقائق)',
    modeCustomLabel: 'وقت محدد',
    minuteUnit: 'د',
    fixedBadge: 'محدد',
    khanqahScheduleTitle: 'أوقات الجماعة في خانقاہ دار الفلاح',
    officialBadge: 'رسمي',
    refreshBtn: 'تحديث',
    refreshingBtn: 'جارٍ التحديث...',
    khanqahScheduleRefreshed: 'تم تحديث أوقات الجماعة!',
    khanqahScheduleCached: 'يتم عرض الأوقات المحفوظة حالياً.',

    mixlrTitle: 'البث الصوتي المباشر (Mixlr)',
    mixlrSubtitle: 'لا يوجد بث مباشر حالياً — سيعمل الصوت تلقائياً فور بدء البث',
    mixlrBtn: 'البث المباشر (Mixlr)',
    mixlrOfflineToast: 'لا يوجد بث مباشر حالياً؛ سيعمل تلقائياً فور بدء البث.',
    liveNotifyActive: 'إشعار البث المباشر مفعّل:',
    changeBtn: 'تغيير',
    turnOffBtn: 'إيقاف',
    enableLiveNotifyBtn: 'تفعيل إشعارات البث المباشر',
    emailPlaceholder: 'أدخل بريد Gmail الخاص بك...',
    turnOnBtn: 'تفعيل',
    laterBtn: 'لاحقاً',
    invalidEmailToast: 'يرجى إدخال بريد Gmail صحيح',
    savedEmailToast: 'جزاكم الله خيراً! تم حفظ بريدكم لإشعارات البث.',
    clearedEmailToast: 'تمت إزالة البريد الإلكتروني.',

    latestBayanatTitle: 'أحدث المحاضرات والدروس المرفوعة',
    latestBayanatSub: 'أحدث التسجيلات المضافة (مع شارة جديد لمدة 7 أيام)',
    viewAllBayanat: 'عرض جميع المحاضرات',
    newBadge: 'جديد · NEW',
    newShortBadge: 'جديد',
    playLabel: 'تشغيل',
    listenLabel: 'استماع',
    playingLabel: 'قيد التشغيل',
    downloadLabel: 'تحميل',
    loadingLabel: 'تحميل...',
    shareLabel: 'مشاركة',

    foldersHeading: 'المجلدات والمكتبة الإسلامية',
    refreshFoldersTitle: 'تحديث المجلدات',
    audioLibraryTitle: 'المكتبة الصوتية (MP3)',
    audioLibrarySubSuffix: 'تسجيلات · تحميل مباشر',
    whatsappGroupsTitle: 'مجموعات الواتساب',
    whatsappGroupsSub: 'القناة والمجموعات الرسمية',

    footerFolderKhanqah: 'عن الخانقاه',
    footerFolderKhanqahSub: 'المركز والرسالة',
    footerFolderSheikh: 'سيرة الشيخ',
    footerFolderSheikhSub: 'النشأة والخدمات',
    footerFolderTerms: 'الشروط والأحكام',
    footerFolderTermsSub: 'ضوابط الاستخدام',
    footerFolderPrivacy: 'سياسة الخصوصية',
    footerFolderPrivacySub: 'حماية البيانات',
    footerFolderContact: 'تواصل معنا',
    footerFolderContactSub: 'واتساب والقنوات',
    giftShareAppBtn: 'أهدِ وشارك هذا التطبيق مع أصدقائك',
    giftShareToast: 'مشاركة التطبيق كهدية عبر واتساب...',
    devCtaBtn: 'للاستفسار أو تصميم المواقع والتطبيقات الاحترافية اضغط هنا',
    copyrightLine: 'خانقاہ دار الفلاح · جميع الحقوق محفوظة © 2026',

    drawerCloseTitle: 'إغلاق',
    drawerLightTheme: 'الوضع النهاري',
    drawerDarkTheme: 'الوضع الليلي',
    drawerUpdate: 'تحديث',
    drawerSwitchToMobile: 'وضع الجوال',
    drawerSwitchToDesktop: 'وضع سطح المكتب',
    drawerDesktopTag: 'سطح المكتب',
    drawerMobileTag: 'الجوال',
    drawerDownloadApk: 'تحميل تطبيق الأندرويد (APK)',
    drawerSec1: 'الصفحات والمكتبة الصوتية',
    drawerItemHome: '1. الصفحة الرئيسية',
    drawerItemAllBayanat: '2. جميع المحاضرات',
    drawerItemGoldAudio: '3. الصفحة الذهبية والمجالس',
    drawerItemBooks: '4. مكتبة الكتب الإسلامية',
    drawerItemNews: '5. الأخبار والإعلانات',
    drawerItemWebsite: '6. الموقع الرسمي (بلوجر)',
    drawerSec2: 'التعريف والسياسات',
    drawerItemIntroKhanqah: '7. التعريف بخانقاه دار الفلاح',
    drawerItemIntroSheikh: '8. سيرة الشيخ محمد جمشيد',
    drawerItemTerms: '9. الشروط والأحكام',
    drawerItemPrivacy: '10. سياسة الخصوصية',
    drawerSec3: 'التواصل والمجتمع',
    drawerItemWaGroups: 'مجموعات وقناة الواتساب',
    drawerJoinTag: 'انضمام',
    drawerItemContact: 'تواصل معنا',
    drawerItemAbout: 'عن التطبيق',

    bannerInstallPrompt: 'ثبّت تطبيق خانقاه دار الفلاح الرسمي للأندرويد',
    bannerInstallApk: 'تثبيت (APK)',
    bannerWebApp: 'تطبيق الويب',
    bannerApkDownloading: 'بدأ تحميل ملف APK الرسمي...',
    bannerModalTitle: 'تثبيت تطبيق خانقاه دار الفلاح',
    bannerDownloadApkBtn: 'تحميل APK',
    bannerStep1Text: 'اضغط على تحميل APK أدناه لتنزيل التطبيق مباشرة على الأندرويد.',
    bannerStep2Text: 'أو افتح قائمة المتصفح (⋮) واختر "إضافة إلى الشاشة الرئيسية".',
    bannerStep3Text: 'سيُحفظ التطبيق على شاشة هاتفك بالشعار الرسمي للخانقاه.',
    closeBtn: 'إغلاق',

    searchPlaceholder: 'ابحث باسم المحاضرة، المجلد، التاريخ (2026)، أو المنشور...',
    clearBtn: 'مسح',
    filterLabel: 'تصفية:',
    filterAll: 'الكل',
    filterFolders: 'المجلدات',
    filterBayanat: 'جميع المحاضرات',
    filterIslahi: 'المجالس الإصلاحية',
    filterDars: 'دروس القرآن',
    filterPosts: 'الكتب والإعلانات',
    resultsAvailable: 'النتائج المتوفرة:',
    searchHint: 'حمّل أو شارك مباشرة عبر واتساب',
    noResults: 'لم يتم العثور على نتائج. جرّب كلمة أو تاريخاً آخر.',
    openPost: 'فتح المنشور',
    downloadWholeFolder: 'تحميل المجلد كاملاً',
    filesWord: 'ملفات',
    downloadingText: 'جارٍ التحميل...',
    modalOkClose: 'حسناً (إغلاق)',
    modalKhanqahTitle: 'التعريف بخانقاه دار الفلاح',
    modalSheikhTitle: 'سيرة فضيلة الشيخ محمد جمشيد حفظه الله',
    modalContactTitle: 'معلومات التواصل',
    modalWaGroupsTitle: 'مجموعات وقناة الواتساب الرسمية',
    modalAboutTitle: 'عن التطبيق',
    modalTermsTitle: 'الشروط والأحكام',
    modalPrivacyTitle: 'سياسة الخصوصية',
  },

  fa: {
    ...ENGLISH_BASE,
    appName: 'خانقاہ دارالفلاح',
    appSubtitle: 'سلسله عالیه نقشبندیه مجددیه',
    sheikhFullTitle: 'شیخ الحدیث حضرت مولانا پیر محمد جمشید نقشبندی مجددی دامت برکاتهم',
    headerMenuTitle: 'منو',
    headerHomeTitle: 'صفحه اصلی',
    headerDesktopMode: 'دسکتاپ',
    headerMobileMode: 'موبایل',
    headerThemeLight: 'حالت روشن',
    headerThemeDark: 'حالت تاریک',
    headerSearchTitle: 'جستجو',
    headerLanguageLabel: 'انتخاب زبان',
    toastDesktopMode: 'حالت دسکتاپ فعال شد',
    toastMobileMode: 'حالت موبایل فعال شد',
    toastLangChanged: 'زبان فارسی فعال شد',
    tickerBadge: 'اطلاعیه',
    hijriLoading: 'در حال بارگذاری تاریخ هجری...',
    tabFarz: 'نمازهای فرض',
    tabNawafil: 'نوافل و اوقات',
    tabJamaat: 'اوقات جماعت',
    nextPrayer: 'بعدی',
    untilPrefix: 'تا',
    farzLoading: 'در حال بارگذاری اوقات نماز...',
    nawafilLoading: 'در حال بارگذاری اوقات نوافل...',
    sunriseLabel: 'طلوع آفتاب:',
    zawalNote: 'در وقت زوال (۱۰ دقیقه قبل از ظهر) نماز خواندن مکروه است',
    myMosqueDefault: 'مسجد من',
    myMosqueScheduleLabel: 'اوقات جماعت مسجد من',
    editTimesBtn: 'ویرایش اوقات',
    saveCloseBtn: 'ذخیره و بستن',
    resetDefaultBtn: 'پیش‌فرض',
    khanqahScheduleTitle: 'اوقات جماعت خانقاہ دارالفلاح',
    officialBadge: 'رسمی',
    refreshBtn: 'بروزرسانی',
    refreshingBtn: 'در حال بروزرسانی...',
    mixlrTitle: 'پخش زنده صوتی (Mixlr)',
    mixlrSubtitle: 'در حال حاضر پخش زنده وجود ندارد — به محض شروع بطور خودکار پخش می‌شود',
    mixlrBtn: 'پخش زنده (Mixlr)',
    enableLiveNotifyBtn: 'فعال‌سازی اعلان پخش زنده',
    latestBayanatTitle: 'تازه‌ترین بیانات بارگذاری شده',
    latestBayanatSub: 'جدیدترین فایل‌های صوتی (با نشان جدید به مدت ۷ روز)',
    viewAllBayanat: 'مشاهده همه بیانات',
    newBadge: 'جدید · NEW',
    newShortBadge: 'جدید',
    playLabel: 'پخش',
    listenLabel: 'شنیدن',
    playingLabel: 'در حال پخش',
    downloadLabel: 'دانلود',
    loadingLabel: 'بارگذاری...',
    shareLabel: 'اشتراک',
    foldersHeading: 'پوشه‌ها و کتابخانه اسلامی',
    audioLibraryTitle: 'کتابخانه صوتی (MP3)',
    audioLibrarySubSuffix: 'بیانات · دانلود آفلاین',
    whatsappGroupsTitle: 'گروه‌های واتساپ',
    whatsappGroupsSub: 'کانال و گروه‌های رسمی',
    footerFolderKhanqah: 'معرفی خانقاہ',
    footerFolderKhanqahSub: 'مرکز و اهداف',
    footerFolderSheikh: 'معرفی شیخ',
    footerFolderSheikhSub: 'زندگی‌نامه و خدمات',
    footerFolderTerms: 'شرایط و ضوابط',
    footerFolderTermsSub: 'قوانین استفاده',
    footerFolderPrivacy: 'حریم خصوصی',
    footerFolderPrivacySub: 'امنیت داده‌ها',
    footerFolderContact: 'تماس با ما',
    footerFolderContactSub: 'واتساپ و شبکه‌ها',
    giftShareAppBtn: 'این برنامه را به دوستان خود هدیه و اشتراک بگذارید',
    devCtaBtn: 'برای مشاوره و طراحی وب‌سایت یا اپلیکیشن کلیک کنید',
    copyrightLine: 'خانقاہ دارالفلاح · تمامی حقوق محفوظ است © 2026',
    closeBtn: 'بستن',
    modalOkClose: 'تأیید (بستن)',
    modalKhanqahTitle: 'معرفی خانقاہ دارالفلاح',
    modalSheikhTitle: 'معرفی شیخ مولانا محمد جمشید',
    modalContactTitle: 'تماس با ما',
    modalWaGroupsTitle: 'گروه‌ها و کانال رسمی واتساپ',
    modalAboutTitle: 'درباره برنامه',
    modalTermsTitle: 'شرایط و ضوابط',
    modalPrivacyTitle: 'حریم خصوصی',
  },

  tr: {
    ...ENGLISH_BASE,
    appName: 'Hankâh Darül Felah',
    headerMenuTitle: 'Menü',
    headerHomeTitle: 'Ana Sayfa',
    headerDesktopMode: 'Masaüstü',
    headerMobileMode: 'Mobil',
    headerThemeLight: 'Açık Tema',
    headerThemeDark: 'Koyu Tema',
    headerSearchTitle: 'Ara',
    headerLanguageLabel: 'Dil Seçin',
    toastDesktopMode: 'Masaüstü modu etkinleştirildi',
    toastMobileMode: 'Mobil mod etkinleştirildi',
    toastLangChanged: 'Türkçe dili seçildi',
    tickerBadge: 'Duyuru',
    hijriLoading: 'Hicri tarih yükleniyor...',
    tabFarz: 'Farz Namazlar',
    tabNawafil: 'Nafile Vakitler',
    tabJamaat: 'Cemaat Vakitleri',
    nextPrayer: 'Sıradaki',
    untilPrefix: '–',
    sunriseLabel: 'Güneş:',
    zawalNote: 'Kerahet vakti (Öğleden 10 dk önce) namaz kılınmaz',
    myMosqueDefault: 'Camim',
    myMosqueScheduleLabel: 'Camimin Cemaat Vakitleri',
    editTimesBtn: 'Düzenle',
    saveCloseBtn: 'Kaydet ve Kapat',
    resetDefaultBtn: 'Varsayılan',
    khanqahScheduleTitle: 'Hankâh Darül Felah Cemaat Vakitleri',
    officialBadge: 'Resmi',
    refreshBtn: 'Yenile',
    refreshingBtn: 'Güncelleniyor...',
    mixlrTitle: 'Canlı Ses Yayını (Mixlr)',
    mixlrSubtitle: 'Şu anda canlı yayın yok — başladığında burada otomatik çalacaktır',
    mixlrBtn: 'Canlı Yayın (Mixlr)',
    enableLiveNotifyBtn: 'Canlı Yayın Bildirimlerini Aç',
    latestBayanatTitle: 'En Son Yüklenen Sohbetler',
    latestBayanatSub: 'En yeni kayıtlar (7 gün boyunca YENİ etiketiyle)',
    viewAllBayanat: 'Tüm Sohbetler',
    newBadge: 'YENİ',
    newShortBadge: 'YENİ',
    playLabel: 'Oynat',
    listenLabel: 'Dinle',
    playingLabel: 'Çalıyor',
    downloadLabel: 'İndir',
    loadingLabel: 'Yükleniyor...',
    shareLabel: 'Paylaş',
    foldersHeading: 'Klasörler ve İslami Kütüphane',
    audioLibraryTitle: 'Ses Kütüphanesi (MP3)',
    audioLibrarySubSuffix: 'Sohbet · Çevrimdışı İndirme',
    whatsappGroupsTitle: 'WhatsApp Grupları',
    whatsappGroupsSub: 'Resmi Kanal ve Gruplar',
    footerFolderKhanqah: 'Hankâh Hakkında',
    footerFolderKhanqahSub: 'Merkez ve Misyon',
    footerFolderSheikh: 'Şeyh Biyografisi',
    footerFolderSheikhSub: 'Hayatı ve Hizmetleri',
    footerFolderTerms: 'Kullanım Şartları',
    footerFolderTermsSub: 'Kurallar',
    footerFolderPrivacy: 'Gizlilik Politikası',
    footerFolderPrivacySub: 'Veri Güvenliği',
    footerFolderContact: 'İletişim',
    footerFolderContactSub: 'WhatsApp ve Sosyal',
    giftShareAppBtn: 'Bu Uygulamayı Arkadaşlarınıza Hediye Edin',
    devCtaBtn: 'Web Sitesi veya Mobil Uygulama Geliştirme İçin Tıklayın',
    copyrightLine: 'Hankâh Darül Felah · Tüm Hakları Saklıdır © 2026',
    closeBtn: 'Kapat',
    modalOkClose: 'Tamam (Kapat)',
    modalKhanqahTitle: 'Hankâh Darül Felah Hakkında',
    modalSheikhTitle: 'Şeyh Mevlana Muhammed Cemşid Hakkında',
    modalContactTitle: 'İletişim Bilgileri',
    modalWaGroupsTitle: 'Resmi WhatsApp Grupları',
    modalAboutTitle: 'Uygulama Hakkında',
    modalTermsTitle: 'Kullanım Şartları',
    modalPrivacyTitle: 'Gizlilik Politikası',
  },

  id: {
    ...ENGLISH_BASE,
    appName: 'Khanqah Darul Falah',
    headerMenuTitle: 'Menu',
    headerHomeTitle: 'Beranda',
    headerDesktopMode: 'Desktop',
    headerMobileMode: 'Seluler',
    headerThemeLight: 'Mode Terang',
    headerThemeDark: 'Mode Gelap',
    headerSearchTitle: 'Cari',
    headerLanguageLabel: 'Pilih Bahasa',
    toastDesktopMode: 'Mode Desktop diaktifkan',
    toastMobileMode: 'Mode Seluler diaktifkan',
    toastLangChanged: 'Bahasa Indonesia diaktifkan',
    tickerBadge: 'Info',
    hijriLoading: 'Memuat tanggal Hijriah...',
    tabFarz: 'Shalat Wajib',
    tabNawafil: 'Sunnah & Waktu',
    tabJamaat: 'Jadwal Jamaah',
    nextPrayer: 'Berikutnya',
    untilPrefix: 's/d',
    sunriseLabel: 'Terbit:',
    zawalNote: 'Dilarang shalat saat waktu Zawal (10 menit sebelum Dzuhur)',
    myMosqueDefault: 'Masjid Saya',
    myMosqueScheduleLabel: 'Jadwal Jamaah Masjid Saya',
    editTimesBtn: 'Ubah Jadwal',
    saveCloseBtn: 'Simpan & Tutup',
    resetDefaultBtn: 'Default',
    khanqahScheduleTitle: 'Jadwal Jamaah Khanqah Darul Falah',
    officialBadge: 'Resmi',
    refreshBtn: 'Segarkan',
    mixlrTitle: 'Siaran Audio Langsung (Mixlr)',
    mixlrSubtitle: 'Belum ada siaran langsung — akan otomatis diputar saat siaran dimulai',
    mixlrBtn: 'Audio Langsung (Mixlr)',
    enableLiveNotifyBtn: 'Aktifkan Notifikasi Siaran Langsung',
    latestBayanatTitle: 'Ceramah Terbaru',
    latestBayanatSub: 'Rekaman terbaru (ditandai BARU selama 7 hari)',
    viewAllBayanat: 'Lihat Semua',
    newBadge: 'BARU',
    newShortBadge: 'BARU',
    playLabel: 'Putar',
    listenLabel: 'Putar',
    playingLabel: 'Memutar',
    downloadLabel: 'Unduh',
    loadingLabel: 'Memuat...',
    shareLabel: 'Bagikan',
    foldersHeading: 'Folder & Perpustakaan Islam',
    audioLibraryTitle: 'Pustaka Audio (MP3)',
    audioLibrarySubSuffix: 'Ceramah · Unduh Offline',
    whatsappGroupsTitle: 'Grup WhatsApp',
    whatsappGroupsSub: 'Saluran & Grup Resmi',
    footerFolderKhanqah: 'Profil Khanqah',
    footerFolderKhanqahSub: 'Pusat & Misi',
    footerFolderSheikh: 'Biografi Syaikh',
    footerFolderSheikhSub: 'Riwayat & Dakwah',
    footerFolderTerms: 'Syarat & Ketentuan',
    footerFolderTermsSub: 'Aturan Pakai',
    footerFolderPrivacy: 'Kebijakan Privasi',
    footerFolderPrivacySub: 'Keamanan Data',
    footerFolderContact: 'Hubungi Kami',
    footerFolderContactSub: 'WhatsApp & Sosial',
    giftShareAppBtn: 'Hadiahkan & Bagikan Aplikasi Ini',
    devCtaBtn: 'Butuh Pembuatan Website atau Aplikasi? Klik di Sini',
    copyrightLine: 'Khanqah Darul Falah · Hak Cipta Dilindungi © 2026',
    closeBtn: 'Tutup',
    modalOkClose: 'Oke (Tutup)',
  },

  bn: {
    ...ENGLISH_BASE,
    appName: 'খানকাহ দারুল ফালাহ',
    headerMenuTitle: 'মেনু',
    headerHomeTitle: 'হোম',
    headerDesktopMode: 'ডেস্কটপ',
    headerMobileMode: 'মোবাইল',
    headerThemeLight: 'লাইট থিম',
    headerThemeDark: 'ডার্ক থিম',
    headerSearchTitle: 'অনুসন্ধান',
    headerLanguageLabel: 'ভাষা নির্বাচন করুন',
    toastLangChanged: 'বাংলা ভাষা সক্রিয় করা হয়েছে',
    tickerBadge: 'বিজ্ঞপ্তি',
    tabFarz: 'ফরয নামায',
    tabNawafil: 'নফল ও ওয়াক্ত',
    tabJamaat: 'জামাতের সময়',
    nextPrayer: 'পরবর্তী',
    untilPrefix: 'থেকে',
    sunriseLabel: 'সূর্যোদয়:',
    myMosqueDefault: 'আমার মসজিদ',
    editTimesBtn: 'সময় পরিবর্তন',
    saveCloseBtn: 'সংরক্ষণ করুন',
    khanqahScheduleTitle: 'খানকাহ দারুল ফালাহ জামাতের সময়সূচী',
    officialBadge: 'অফিশিয়াল',
    refreshBtn: 'রিফ্রেশ',
    mixlrTitle: 'লাইভ অডিও সম্প্রচার (Mixlr)',
    mixlrBtn: 'লাইভ অডিও (Mixlr)',
    latestBayanatTitle: 'সর্বশেষ আপলোডকৃত বয়ানসমূহ',
    viewAllBayanat: 'সব বয়ান দেখুন',
    newBadge: 'নতুন',
    newShortBadge: 'নতুন',
    playLabel: 'চালান',
    listenLabel: 'শুনুন',
    playingLabel: 'চলছে',
    downloadLabel: 'ডাউনলোড',
    shareLabel: 'শেয়ার',
    foldersHeading: 'ফোল্ডার ও ইসলামি লাইব্রেরি',
    audioLibraryTitle: 'অডিও লাইব্রেরি (MP3)',
    whatsappGroupsTitle: 'হোয়াটসঅ্যাপ গ্রুপ',
    footerFolderKhanqah: 'খানকাহ পরিচিতি',
    footerFolderSheikh: 'শায়খ পরিচিতি',
    footerFolderTerms: 'শর্তাবলী',
    footerFolderPrivacy: 'গোপনীয়তা নীতি',
    footerFolderContact: 'যোগাযোগ',
    giftShareAppBtn: 'বন্ধুদের সাথে অ্যাপটি উপহার হিসেবে শেয়ার করুন',
    copyrightLine: 'খানকাহ দারুল ফালাহ · সর্বস্বত্ব সংরক্ষিত © 2026',
    closeBtn: 'বন্ধ করুন',
    modalOkClose: 'ঠিক আছে',
  },

  hi: {
    ...ENGLISH_BASE,
    appName: 'ख़ानक़ाह दारुल फ़लाह',
    headerMenuTitle: 'मेनू',
    headerHomeTitle: 'होम',
    headerDesktopMode: 'डेस्कटॉप',
    headerMobileMode: 'मोबाइल',
    headerThemeLight: 'लाइट थीम',
    headerThemeDark: 'डार्क थीम',
    headerSearchTitle: 'खोजें',
    headerLanguageLabel: 'भाषा चुनें',
    toastLangChanged: 'हिन्दी भाषा सक्रिय हो गई है',
    tickerBadge: 'सूचना',
    tabFarz: 'फ़र्ज़ नमाज़ें',
    tabNawafil: 'नवाफ़िल व समय',
    tabJamaat: 'जमाअत समय',
    nextPrayer: 'अगली',
    untilPrefix: 'तक',
    sunriseLabel: 'सूर्योदय:',
    myMosqueDefault: 'मेरी मस्जिद',
    editTimesBtn: 'समय बदलें',
    saveCloseBtn: 'सहेजें',
    khanqahScheduleTitle: 'ख़ानक़ाह दारुल फ़लाह जमाअत समय',
    officialBadge: 'आधिकारिक',
    refreshBtn: 'रीफ़्रेश',
    mixlrTitle: 'लाइव ऑडियो प्रसारण (Mixlr)',
    mixlrBtn: 'लाइव ऑडियो (Mixlr)',
    latestBayanatTitle: 'नवीनतम बयानात',
    viewAllBayanat: 'सभी बयानात देखें',
    newBadge: 'नया',
    newShortBadge: 'नया',
    playLabel: 'चलाएं',
    listenLabel: 'सुनें',
    playingLabel: 'चल रहा',
    downloadLabel: 'डाउनलोड',
    shareLabel: 'शेयर',
    foldersHeading: 'फ़ोल्डर और इस्लामी लाइब्रेरी',
    audioLibraryTitle: 'ऑडियो लाइब्रेरी (MP3)',
    whatsappGroupsTitle: 'व्हाट्सएप ग्रुप',
    footerFolderKhanqah: 'ख़ानक़ाह परिचय',
    footerFolderSheikh: 'शैख़ परिचय',
    footerFolderTerms: 'नियम व शर्तें',
    footerFolderPrivacy: 'गोपनीयता नीति',
    footerFolderContact: 'संपर्क करें',
    giftShareAppBtn: 'दोस्तों को यह ऐप उपहार के रूप में शेयर करें',
    copyrightLine: 'ख़ानक़ाह दारुल फ़लाह · सर्वाधिकार सुरक्षित © 2026',
    closeBtn: 'बंद करें',
    modalOkClose: 'ठीक है',
  },

  fr: {
    ...ENGLISH_BASE,
    headerMenuTitle: 'Menu',
    headerHomeTitle: 'Accueil',
    headerDesktopMode: 'Bureau',
    headerMobileMode: 'Mobile',
    headerThemeLight: 'Thème clair',
    headerThemeDark: 'Thème sombre',
    headerSearchTitle: 'Rechercher',
    headerLanguageLabel: 'Choisir la langue',
    toastLangChanged: 'Langue changée en Français',
    tickerBadge: 'Annonce',
    tabFarz: 'Prières Obligatoires',
    tabNawafil: 'Prières Surérogatoires',
    tabJamaat: 'Heures de Congrégation',
    nextPrayer: 'Suivante',
    untilPrefix: 'à',
    sunriseLabel: 'Lever du soleil :',
    myMosqueDefault: 'Ma Mosquée',
    editTimesBtn: 'Modifier',
    saveCloseBtn: 'Enregistrer',
    khanqahScheduleTitle: 'Horaires de Khanqah Darul Falah',
    officialBadge: 'Officiel',
    refreshBtn: 'Actualiser',
    mixlrTitle: 'Audio en Direct (Mixlr)',
    mixlrBtn: 'Direct (Mixlr)',
    latestBayanatTitle: 'Derniers Discours Audio',
    viewAllBayanat: 'Tout voir',
    newBadge: 'NOUVEAU',
    newShortBadge: 'NOUVEAU',
    playLabel: 'Lire',
    listenLabel: 'Écouter',
    playingLabel: 'En cours',
    downloadLabel: 'Télécharger',
    shareLabel: 'Partager',
    foldersHeading: 'Dossiers & Bibliothèque Islamique',
    audioLibraryTitle: 'Bibliothèque Audio (MP3)',
    whatsappGroupsTitle: 'Groupes WhatsApp',
    footerFolderKhanqah: 'À propos du Khanqah',
    footerFolderSheikh: 'Bio du Cheikh',
    footerFolderTerms: 'Conditions',
    footerFolderPrivacy: 'Confidentialité',
    footerFolderContact: 'Contact',
    giftShareAppBtn: 'Offrir et partager cette application',
    closeBtn: 'Fermer',
    modalOkClose: 'OK',
  },

  es: {
    ...ENGLISH_BASE,
    headerMenuTitle: 'Menú',
    headerHomeTitle: 'Inicio',
    headerDesktopMode: 'Escritorio',
    headerMobileMode: 'Móvil',
    headerThemeLight: 'Tema claro',
    headerThemeDark: 'Tema oscuro',
    headerSearchTitle: 'Buscar',
    headerLanguageLabel: 'Seleccionar idioma',
    toastLangChanged: 'Idioma cambiado a Español',
    tickerBadge: 'Aviso',
    tabFarz: 'Oraciones Obligatorias',
    tabNawafil: 'Nafl y Horarios',
    tabJamaat: 'Horarios de Congregación',
    nextPrayer: 'Siguiente',
    untilPrefix: 'a',
    sunriseLabel: 'Amanecer:',
    myMosqueDefault: 'Mi Mezquita',
    editTimesBtn: 'Editar',
    saveCloseBtn: 'Guardar',
    khanqahScheduleTitle: 'Horarios de Khanqah Darul Falah',
    officialBadge: 'Oficial',
    refreshBtn: 'Actualizar',
    mixlrTitle: 'Audio en Vivo (Mixlr)',
    mixlrBtn: 'En Vivo (Mixlr)',
    latestBayanatTitle: 'Últimos Discursos Subidos',
    viewAllBayanat: 'Ver todos',
    newBadge: 'NUEVO',
    newShortBadge: 'NUEVO',
    playLabel: 'Reproducir',
    listenLabel: 'Escuchar',
    playingLabel: 'Reproduciendo',
    downloadLabel: 'Descargar',
    shareLabel: 'Compartir',
    foldersHeading: 'Carpetas y Biblioteca Islámica',
    audioLibraryTitle: 'Biblioteca de Audio (MP3)',
    whatsappGroupsTitle: 'Grupos de WhatsApp',
    footerFolderKhanqah: 'Sobre el Khanqah',
    footerFolderSheikh: 'Biografía del Sheij',
    footerFolderTerms: 'Términos',
    footerFolderPrivacy: 'Privacidad',
    footerFolderContact: 'Contacto',
    giftShareAppBtn: 'Compartir esta aplicación como regalo',
    closeBtn: 'Cerrar',
    modalOkClose: 'Aceptar',
  },

  de: {
    ...ENGLISH_BASE,
    headerMenuTitle: 'Menü',
    headerHomeTitle: 'Startseite',
    headerDesktopMode: 'Desktop',
    headerMobileMode: 'Mobil',
    headerThemeLight: 'Helles Design',
    headerThemeDark: 'Dunkles Design',
    headerSearchTitle: 'Suchen',
    headerLanguageLabel: 'Sprache wählen',
    toastLangChanged: 'Sprache auf Deutsch geändert',
    tickerBadge: 'Hinweis',
    tabFarz: 'Pflichtgebete',
    tabNawafil: 'Freiwillige Gebete',
    tabJamaat: 'Gemeinschaftszeiten',
    nextPrayer: 'Nächstes',
    untilPrefix: 'bis',
    sunriseLabel: 'Sonnenaufgang:',
    myMosqueDefault: 'Meine Moschee',
    editTimesBtn: 'Bearbeiten',
    saveCloseBtn: 'Speichern',
    khanqahScheduleTitle: 'Khanqah Darul Falah Gebetszeiten',
    officialBadge: 'Offiziell',
    refreshBtn: 'Aktualisieren',
    mixlrTitle: 'Live-Audioübertragung (Mixlr)',
    mixlrBtn: 'Live-Audio (Mixlr)',
    latestBayanatTitle: 'Neueste Vorträge',
    viewAllBayanat: 'Alle ansehen',
    newBadge: 'NEU',
    newShortBadge: 'NEU',
    playLabel: 'Abspielen',
    listenLabel: 'Anhören',
    playingLabel: 'Läuft',
    downloadLabel: 'Herunterladen',
    shareLabel: 'Teilen',
    foldersHeading: 'Ordner & Islamische Bibliothek',
    audioLibraryTitle: 'Audiobibliothek (MP3)',
    whatsappGroupsTitle: 'WhatsApp-Gruppen',
    footerFolderKhanqah: 'Über Khanqah',
    footerFolderSheikh: 'Über den Scheich',
    footerFolderTerms: 'Bedingungen',
    footerFolderPrivacy: 'Datenschutz',
    footerFolderContact: 'Kontakt',
    giftShareAppBtn: 'Diese App als Geschenk teilen',
    closeBtn: 'Schließen',
    modalOkClose: 'OK',
  },

  ru: {
    ...ENGLISH_BASE,
    headerMenuTitle: 'Меню',
    headerHomeTitle: 'Главная',
    headerDesktopMode: 'ПК',
    headerMobileMode: 'Мобильный',
    headerThemeLight: 'Светлая тема',
    headerThemeDark: 'Тёмная тема',
    headerSearchTitle: 'Поиск',
    headerLanguageLabel: 'Выберите язык',
    toastLangChanged: 'Выбран русский язык',
    tickerBadge: 'Объявление',
    tabFarz: 'Обязательные намазы',
    tabNawafil: 'Нафиль и время',
    tabJamaat: 'Время джамаата',
    nextPrayer: 'След.',
    untilPrefix: 'до',
    sunriseLabel: 'Восход:',
    myMosqueDefault: 'Моя мечеть',
    editTimesBtn: 'Изменить',
    saveCloseBtn: 'Сохранить',
    khanqahScheduleTitle: 'Расписание джамаата Ханках Даруль Фалах',
    officialBadge: 'Офиц.',
    refreshBtn: 'Обновить',
    mixlrTitle: 'Прямой аудиоэфир (Mixlr)',
    mixlrBtn: 'Прямой эфир (Mixlr)',
    latestBayanatTitle: 'Последние лекции',
    viewAllBayanat: 'Все лекции',
    newBadge: 'НОВОЕ',
    newShortBadge: 'НОВОЕ',
    playLabel: 'Слушать',
    listenLabel: 'Слушать',
    playingLabel: 'Играет',
    downloadLabel: 'Скачать',
    shareLabel: 'Поделиться',
    foldersHeading: 'Папки и Исламская библиотека',
    audioLibraryTitle: 'Аудиобиблиотека (MP3)',
    whatsappGroupsTitle: 'Группы WhatsApp',
    footerFolderKhanqah: 'О Ханкахе',
    footerFolderSheikh: 'О Шейхе',
    footerFolderTerms: 'Условия',
    footerFolderPrivacy: 'Конфиденц.',
    footerFolderContact: 'Контакты',
    giftShareAppBtn: 'Поделиться приложением с друзьями',
    closeBtn: 'Закрыть',
    modalOkClose: 'ОК',
  },

  zh: {
    ...ENGLISH_BASE,
    headerMenuTitle: '菜单',
    headerHomeTitle: '首页',
    headerDesktopMode: '桌面版',
    headerMobileMode: '手机版',
    headerThemeLight: '浅色主题',
    headerThemeDark: '深色主题',
    headerSearchTitle: '搜索',
    headerLanguageLabel: '选择语言',
    toastLangChanged: '已切换为简体中文',
    tickerBadge: '公告',
    tabFarz: '主命拜',
    tabNawafil: '副功与时刻',
    tabJamaat: '聚礼时间',
    nextPrayer: '下一拜',
    untilPrefix: '至',
    sunriseLabel: '日出:',
    myMosqueDefault: '我的清真寺',
    editTimesBtn: '修改时间',
    saveCloseBtn: '保存关闭',
    khanqahScheduleTitle: 'Khanqah Darul Falah 聚礼时间表',
    officialBadge: '官方',
    refreshBtn: '刷新',
    mixlrTitle: '在线音频直播 (Mixlr)',
    mixlrBtn: '音频直播 (Mixlr)',
    latestBayanatTitle: '最新上传讲座',
    viewAllBayanat: '查看全部',
    newBadge: '最新',
    newShortBadge: '新',
    playLabel: '播放',
    listenLabel: '收听',
    playingLabel: '播放中',
    downloadLabel: '下载',
    shareLabel: '分享',
    foldersHeading: '文件夹与伊斯兰图书馆',
    audioLibraryTitle: '音频库 (MP3)',
    whatsappGroupsTitle: 'WhatsApp 群组',
    footerFolderKhanqah: '关于道堂',
    footerFolderSheikh: '长老简介',
    footerFolderTerms: '使用条款',
    footerFolderPrivacy: '隐私政策',
    footerFolderContact: '联系我们',
    giftShareAppBtn: '将此应用分享给朋友',
    closeBtn: '关闭',
    modalOkClose: '确定',
  },
};

export interface DonationLabels {
  folderTitle: string;
  folderSub: string;
  drawerLabel: string;
  modalTitle: string;
  institutionBadge: string;
  introLine: string;
  sadqaNote: string;
  detailsHeading: string;
  bankLabel: string;
  easyPaisaLabel: string;
  nameLabel: string;
  whatsappLabel: string;
  websiteLabel: string;
  hadeesHeading: string;
  hadeesText: string;
  hadeesRef: string;
  openFormBtn: string;
  backToGuideBtn: string;
  openExternalBtn: string;
  openHtmlPageBtn: string;
  copiedLabel: string;
  copyLabel: string;
}

export function getDonationLabels(lang: AppLanguage): DonationLabels {
  if (lang === 'ps') {
    return {
      folderTitle: 'عطیات او صدقه جاریه',
      folderSub: 'بینک، ایزی پیسه او فارم',
      drawerLabel: 'عطیات او صدقه جاریه (فارم)',
      modalTitle: '🕌 خانقاه و مدرسه دارالفلاح — عطیات',
      institutionBadge: '🕌 خانقاه و مدرسه دارالفلاح',
      introLine: 'الحمدلله! خانقاه و مدرسه دارالفلاح نزد ملک آډه میراخیل، بنو یو دینی، روحاني او تعلیمي اداره ده.',
      sadqaNote: 'ستاسو ورکړل شوی مال صدقهٔ جاریه ده. راځئ! پدې نیک کار کې برخه واخلئ.',
      detailsHeading: '🤝 عطیات او اړیکه',
      bankLabel: 'بینک (IBAN):',
      easyPaisaLabel: 'ایزی پیسه:',
      nameLabel: 'نوم:',
      whatsappLabel: 'واټساپ:',
      websiteLabel: 'ویب پاڼه وګورئ',
      hadeesHeading: '📖 حدیث مبارکه',
      hadeesText: '«صدقه ګناهونه داسې وژني لکه اوبه چې اور وژني»',
      hadeesRef: '(ترمذي)',
      openFormBtn: 'فارم ډک کړئ',
      backToGuideBtn: '🔙 بیرته لارښوونې ته لاړ شئ',
      openExternalBtn: 'که فارم دلته نه خلاصېږي نو په براوزر کې یې خلاص کړئ ↗',
      openHtmlPageBtn: 'مکمل HTML پاڼه خلاصه کړئ',
      copiedLabel: 'کاپي شو ✓',
      copyLabel: 'کاپي',
    };
  }
  if (lang === 'ar') {
    return {
      folderTitle: 'التبرعات والصدقة الجارية',
      folderSub: 'البنك، إيزي بيسا والاستمارة',
      drawerLabel: 'التبرعات والصدقة الجارية',
      modalTitle: '🕌 خانقاه ومدرسة دار الفلاح — التبرعات',
      institutionBadge: '🕌 خانقاه ومدرسة دار الفلاح',
      introLine: 'الحمد لله! خانقاه ومدرسة دار الفلاح قرب ملك أده ميراخيل، بنو مؤسسة دينية وروحية وتعليمية.',
      sadqaNote: 'ما تنفقونه هو صدقة جارية؛ ساهموا معنا في هذا الخير.',
      detailsHeading: '🤝 الحسابات والتواصل',
      bankLabel: 'الحساب البنكي:',
      easyPaisaLabel: 'إيزي بيسا:',
      nameLabel: 'الاسم:',
      whatsappLabel: 'واتساب:',
      websiteLabel: 'زيارة الموقع',
      hadeesHeading: '📖 حديث شريف',
      hadeesText: '«الصدقة تطفئ الخطيئة كما يطفئ الماء النار»',
      hadeesRef: '(رواه الترمذي)',
      openFormBtn: 'تعبئة الاستمارة الآن',
      backToGuideBtn: '🔙 العودة إلى التعليمات',
      openExternalBtn: 'فتح الاستمارة مباشرة في المتصفح ↗',
      openHtmlPageBtn: 'فتح صفحة HTML الكاملة',
      copiedLabel: 'تم النسخ ✓',
      copyLabel: 'نسخ',
    };
  }
  if (lang === 'ur' || lang === 'fa') {
    return {
      folderTitle: 'عطیات و صدقہ جاریہ',
      folderSub: 'بینک، ایزی پیسہ و فارم',
      drawerLabel: 'عطیات و صدقہ جاریہ (فارم)',
      modalTitle: '🕌 خانقاہ و مدرسہ دارالفلاح — عطیات',
      institutionBadge: '🕌 خانقاہ و مدرسہ دارالفلاح',
      introLine: 'الحمدللہ! خانقاہ و مدرسہ دارالفلاح نزد ملک آڈہ میراخیل، بنوں ایک دینی، روحانی اور تعلیمی ادارہ ہے۔',
      sadqaNote: 'آپ کا دیا ہوا مال صدقۂ جاریہ ہے۔ آئیے! اس کارِ خیر میں شریک ہوں۔',
      detailsHeading: '🤝 عطیات اور رابطہ',
      bankLabel: 'بینک:',
      easyPaisaLabel: 'ایزی پیسہ:',
      nameLabel: 'نام:',
      whatsappLabel: 'واٹس ایپ:',
      websiteLabel: '🌐 ویب سائٹ دیکھیں',
      hadeesHeading: '📖 حدیث مبارکہ',
      hadeesText: '«صدقہ گناہوں کو اس طرح بجھا دیتا ہے جیسے پانی آگ کو بجھاتا ہے»',
      hadeesRef: '(ترمذی)',
      openFormBtn: 'فارم بھر دیجئے',
      backToGuideBtn: '🔙 واپس ہدایت پر جائیں',
      openExternalBtn: 'اگر فارم یہاں ظاہر نہ ہو تو براہِ راست کھولیں ↗',
      openHtmlPageBtn: 'مکمل HTML صفحہ دیکھیں',
      copiedLabel: 'کاپی ہو گیا ✓',
      copyLabel: 'کاپی',
    };
  }
  return {
    folderTitle: 'Donations & Sadaqah',
    folderSub: 'Bank, EasyPaisa & Form',
    drawerLabel: 'Donations & Sadaqah Form',
    modalTitle: '🕌 Khanqah & Madrasa Darul Falah — Donations',
    institutionBadge: '🕌 Khanqah & Madrasa Darul Falah',
    introLine: 'Alhamdulillah! Khanqah & Madrasa Darul Falah (near Malik Adda, Mirakhel, Bannu) is a spiritual and Islamic educational center.',
    sadqaNote: 'Your contribution is Sadaqah Jariyah. Join us in supporting this noble cause.',
    detailsHeading: '🤝 Donation Accounts & Contact',
    bankLabel: 'Bank IBAN:',
    easyPaisaLabel: 'EasyPaisa:',
    nameLabel: 'Name:',
    whatsappLabel: 'WhatsApp:',
    websiteLabel: '🌐 Visit Website',
    hadeesHeading: '📖 Hadith Mubarak',
    hadeesText: '"Charity extinguishes sin just as water extinguishes fire."',
    hadeesRef: '(Tirmidhi)',
    openFormBtn: 'Fill Out Donation Form',
    backToGuideBtn: '🔙 Back to Instructions',
    openExternalBtn: 'Open Form Directly in Browser ↗',
    openHtmlPageBtn: 'Open Full HTML Page',
    copiedLabel: 'Copied ✓',
    copyLabel: 'Copy',
  };
}

export interface AutoSilentLabels {
  folderTitle: string;
  folderSub: string;
  drawerLabel: string;
}

export function getAutoSilentLabels(lang: AppLanguage): AutoSilentLabels {
  if (lang === 'ps') {
    return {
      folderTitle: 'د لمانځه آټو سائلنټ',
      folderSub: 'خپلکاره خاموشي سیټنګ',
      drawerLabel: 'د لمانځه آټو سائلنټ موډ (لارښود)',
    };
  }
  if (lang === 'ar') {
    return {
      folderTitle: 'صامت الصلاة التلقائي',
      folderSub: 'جدول الصمت التلقائي',
      drawerLabel: 'وضع الصامت التلقائي للصلاة',
    };
  }
  if (lang === 'ur' || lang === 'fa') {
    return {
      folderTitle: 'نماز آٹو سائلنٹ',
      folderSub: 'خودکار خاموشی سیٹنگ',
      drawerLabel: 'نماز آٹو سائلنٹ موڈ (گائیڈ)',
    };
  }
  return {
    folderTitle: 'Prayer Auto Silent',
    folderSub: 'Auto DND Schedule',
    drawerLabel: 'Prayer Auto Silent Mode',
  };
}



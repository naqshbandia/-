export const ANDROID_PACKAGE_NAME = "com.khanqahdarulfalah.app";
export const ANDROID_APP_NAME = "Khanqah Darul Falah";
export const ANDROID_APP_NAME_URDU = "خانقاہ دارالفلاح";

// Official Verified Android APK Download Link on Archive.org
export const OFFICIAL_APK_URL = "https://archive.org/download/khanqah-darul-falah/%20khanqah%20Darul%20falah.apk";

// Official Sheikh / Khanqah Top Title Calligraphy Banner
export const SHEIKH_TITLE_BANNER_URL = "https://archive.org/download/20260422_20260422_1213/%D8%B4%DB%8C%D8%AE%20%D8%B5%D8%A7%D8%AD%D8%A8%20%D9%84%D9%88%DA%AF%D9%88%20%D9%84%DA%A9%DA%91%DB%8C%20%D9%88%D8%A7%D9%84%D8%A7.png";

// Direct Clean URLs (with ZERO empty gap and instant loading)
export const GOLD_LIBRARY_URL = "https://naqshbandia.github.io/index.html/Gold%20file%20location.html";
export const NEWS_UPDATES_URL = "https://naqshbandia.github.io/index.html/News-Updates.html";
export const URDU_BOOKS_URL = "https://naqshbandia.github.io/index.html/Urdu-Books-Library.html";
export const HAFTAWAR_BAYANAT_URL = "https://naqshbandia.github.io/index.html/Haftawar-Bayanat.html";
export const ISLAMI_MAJALIS_URL = "https://naqshbandia.github.io/index.html/ISLAMI_MAJALIS.html";
export const TELAWAT_HAMD_NAAT_URL = "https://naqshbandia.github.io/index.html/telawat-Hamd-naat.html";

// Blogger Official Website
export const BLOGGER_HOME_URL = "https://khanqahdarulfalah.blogspot.com/";
export const BLOGGER_FEED_URL = "https://khanqahdarulfalah.blogspot.com/feeds/posts/default?alt=json";
export const OFFICIAL_WEBSITE_URL = GOLD_LIBRARY_URL;

export interface BloggerPostTab {
  id: string;
  title: string;
  url: string;
  iconName: 'audio' | 'news' | 'books' | 'blogger' | 'app' | 'post';
  isLivePost?: boolean;
  published?: string;
  snippet?: string;
}

export const DEFAULT_BLOGGER_POSTS_TABS: BloggerPostTab[] = [
  {
    id: 'audio-library-gold-page',
    title: 'Audio Library Gold Page',
    url: GOLD_LIBRARY_URL,
    iconName: 'audio',
  },
  {
    id: 'blogger-home',
    title: 'خانقاہ دارالفلاح (ہوم پیج)',
    url: BLOGGER_HOME_URL,
    iconName: 'blogger',
  },
  {
    id: 'news-updates',
    title: 'News updates',
    url: NEWS_UPDATES_URL,
    iconName: 'news',
  },
  {
    id: 'islamic-urdu-book-library',
    title: 'Islamic Urdu book library',
    url: URDU_BOOKS_URL,
    iconName: 'books',
  },
];

export const BLOGGER_POSTS_TABS = DEFAULT_BLOGGER_POSTS_TABS;

// Official WhatsApp Channel and Group Links for Sheikh-ul-Hadees Hazrat Maulana Peer Muhammad Jamshed (D.B.)
export interface WhatsAppLinkItem {
  id: string;
  title: string;
  subTitle: string;
  url: string;
  type: 'channel' | 'group' | 'contact';
  badge: string;
  description: string;
}

export const WHATSAPP_DIRECT_CHAT_URL = "https://api.whatsapp.com/send?phone=923369757393";

export const OFFICIAL_WHATSAPP_LINKS: WhatsAppLinkItem[] = [
  {
    id: 'wa-channel',
    title: 'واٹس ایپ چینل (خانقاہ دارالفلاح)',
    subTitle: 'Official WhatsApp Channel',
    url: 'https://whatsapp.com/channel/0029VaHFtAKDDmFU33nD360K',
    type: 'channel',
    badge: 'واٹس ایپ چینل',
    description: 'تمام بیانات، آڈیوز، اعلانات اور روحانی پیغامات کی باقاعدہ نشریات',
  },
  {
    id: 'wa-islah-tarbiyat',
    title: 'اصلاح وتربیت',
    subTitle: 'WhatsApp Group - Islah-o-Tarbiyat',
    url: 'https://chat.whatsapp.com/F8R7NYrrC9y8Qh3ahZjbKP',
    type: 'group',
    badge: 'اصلاح وتربیت',
    description: 'اصلاحی بیانات، مواعظِ حسنہ، باطنی تزکیہ اور قلبی تربیت',
  },
  {
    id: 'wa-dars-quran',
    title: 'درس قرآن',
    subTitle: 'WhatsApp Group - Dars-e-Quran',
    url: 'https://chat.whatsapp.com/LMrsIec0blR3YgPgtj7pZw',
    type: 'group',
    badge: 'درس قرآن',
    description: 'درسِ قرآن مجید، تفاسیر، نکات اور قرآنی معارف',
  },
  {
    id: 'wa-dard-e-dil',
    title: 'دردِ دل',
    subTitle: 'WhatsApp Group - Dard-e-Dil',
    url: 'https://chat.whatsapp.com/KOMhllk91BM6XagfBrHnAD',
    type: 'group',
    badge: 'دردِ دل',
    description: 'احوالِ قلب، کیفیاتِ سلوک، دردِ دل اور روحانی ارشادات',
  },
  {
    id: 'wa-majlis-mohabbat',
    title: 'مجلس محبت الٰہی',
    subTitle: 'WhatsApp Group - Majlis-e-Mohabbat-e-Ilahi',
    url: 'https://chat.whatsapp.com/LfAEjp6PNFXExk9VfnnGuy?s=sh&p=a&mlu=3',
    type: 'group',
    badge: 'مجلس محبت الٰہی',
    description: 'محبتِ الٰہی، عشقِ رسولﷺ اور مجالسِ ذکر و مراقبہ',
  },
  {
    id: 'wa-khanqah-general',
    title: 'خانقاہ دارالفلاح (عمومی رابطہ و بیانات)',
    subTitle: 'WhatsApp Group - General Announcements',
    url: 'https://chat.whatsapp.com/DvTQSQgBY047UpvZaG4j1n',
    type: 'group',
    badge: 'عمومی گروپ',
    description: 'خانقاہ دارالفلاح کے عمومی اعلانات، خطابات اور رابطہ',
  },
];

import React from 'react';
import { X, MessageCircle, Youtube, Facebook, ExternalLink, User, Sparkles, ShieldCheck, FileText, HeartHandshake, Copy, Check, Globe, Upload, Send, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { ANDROID_PACKAGE_NAME, OFFICIAL_WEBSITE_URL, OFFICIAL_WHATSAPP_LINKS, WHATSAPP_DIRECT_CHAT_URL, BLOGGER_HOME_URL } from '../data/appConfig';
import {
  AppLanguage,
  DEFAULT_LANGUAGE,
  UI_STRINGS,
  getDir,
  getDonationLabels,
} from '../data/translations';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isDark?: boolean;
  lang?: AppLanguage;
  children: React.ReactNode;
}

export const BaseModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  isDark = true,
  lang = DEFAULT_LANGUAGE,
  children,
}) => {
  if (!isOpen) return null;
  const t = UI_STRINGS[lang];
  const dir = getDir(lang);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      dir={dir}
    >
      <div
        className={`border-2 border-[#d4af37] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors ${
          dir === 'ltr' ? 'text-left' : 'text-right'
        } ${
          isDark ? 'bg-[#0c2116] text-emerald-50' : 'bg-white text-[#11261b]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`border-b border-[#d4af37]/40 px-5 py-3.5 flex items-center justify-between ${
            isDark ? 'bg-[#062e1b]' : 'bg-[#ebf2ee]'
          }`}
        >
          <h3 className="text-lg sm:text-xl font-bold font-lalezar tracking-wide flex items-center gap-2 text-[#064326] dark:text-[#d4af37]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#b08d43] hover:bg-[#d4af37]/20 transition-colors cursor-pointer"
            title={t.closeBtn}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto text-sm leading-relaxed space-y-4">
          {children}
        </div>

        {/* Modal Footer */}
        <div
          className={`border-t border-[#d4af37]/30 px-5 py-3 flex justify-end ${
            isDark ? 'bg-[#08170f]' : 'bg-[#f4f7f6]'
          }`}
        >
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-[#064326] hover:bg-[#095c34] text-white font-lalezar text-sm rounded-lg shadow-xs border border-[#d4af37]/50 transition-all active:scale-95 cursor-pointer"
          >
            {t.modalOkClose}
          </button>
        </div>
      </div>
    </div>
  );
};

// 1. خانقاہ دارالفلاح کا تعارف
export const IntroKhanqahModal: React.FC<{ isOpen: boolean; onClose: () => void; isDark?: boolean; lang?: AppLanguage }> = ({ isOpen, onClose, isDark = true, lang = DEFAULT_LANGUAGE }) => {
  const t = UI_STRINGS[lang];
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={t.modalKhanqahTitle} isDark={isDark} lang={lang}>
      <div className="space-y-4 font-lalezar text-base leading-relaxed">
        <div className={`p-3 border border-[#b08d43]/40 rounded-xl text-center ${isDark ? 'bg-[#382618]/70' : 'bg-amber-100/60'}`}>
          <p className="text-[#b08d43] text-2xl font-bold">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
          <p className="text-xs mt-1 font-sans opacity-70">KHANQAH DAR-UL-FALAH DIGITAL ISLAMIC CENTER</p>
        </div>

        {lang === 'ps' ? (
          <>
            <p className="text-justify">
              <strong>خانقاه دارالفلاح</strong> یو ستر دینی، روحانی او اصلاحی مرکز دی چې موخه یې د زړونو تزکیه، د نبوي سنتوﷺ ژوندي کول او د الله رب العزت په یاد زړونه آبادول دي.
            </p>

            <div className={`p-3 rounded-lg border-r-4 border-[#b08d43] space-y-2 text-sm ${isDark ? 'bg-[#18110b]' : 'bg-amber-50'}`}>
              <h4 className="text-amber-500 font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#b08d43]" />
                مهم فعالیتونه او څانګې:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs font-sans leading-relaxed">
                <li>اوونیزې د ذکر او مراقبې مجلسونه</li>
                <li>اصلاحي بیانات او د زړونو روحاني روزنه</li>
                <li>د قرآن کریم او احادیثو مبارکو درسونه</li>
                <li>دستارِ فضیلت او کلني روحاني غونډې</li>
                <li>ډیجیټل آډیو کتابتون او اسلامي کتابونه</li>
              </ul>
            </div>

            <p className="text-xs opacity-80">
              د خانقاه دارالفلاح فیض د شیخ الحدیث حضرت مولانا پیر محمد جمشید نقشبندي مجددي دامت برکاتهم تر سرپرستۍ لاندې په ټوله نړۍ کې خپرېږي.
            </p>
          </>
        ) : lang === 'ur' || lang === 'fa' ? (
          <>
            <p className="text-justify">
              <strong>خانقاہ دارالفلاح</strong> ایک ممتاز دینی، روحانی اور اصلاحی مرکز ہے جس کی بنیاد تشنگانِ معرفت و تزکیہ نفس کی روحانی پیاس بجھانے، سنتِ نبویﷺ کے مطابق زندگیوں کو سنوارنے اور قلوب کو اللہ رب العزت کی یاد سے معمور کرنے کے لیے رکھی گئی ہے۔
            </p>

            <div className={`p-3 rounded-lg border-r-4 border-[#b08d43] space-y-2 text-sm ${isDark ? 'bg-[#18110b]' : 'bg-amber-50'}`}>
              <h4 className="text-amber-500 font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#b08d43]" />
                اہم سرگرمیاں اور شعبہ جات:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs font-sans leading-relaxed">
                <li>ہفتہ وار مجالسِ ذکر و مراقبہ</li>
                <li>اصلاحی بیانات اور احوال و قلوب کا تزکیہ</li>
                <li>درسِ قرآن مجید اور احادیثِ مبارکہ کی تعلیم</li>
                <li>دستارِ فضیلت اور سالانہ روحانی اجتماعات</li>
                <li>ڈیجیٹل آڈیو لائبریری اور اسلامی اردو کتب کی اشاعت</li>
              </ul>
            </div>

            <p className="text-xs opacity-80">
              خانقاہ دارالفلاح کا فیض شیخ الحدیث حضرت مولانا پیر محمد جمشید نقشبندی مجددی دامت برکاتہم کی سرپرستی میں دنیا بھر میں عام ہو رہا ہے۔
            </p>
          </>
        ) : lang === 'ar' ? (
          <>
            <p className="text-sm">
              <strong>خانقاه دار الفلاح</strong> مركز ديني وروحي وإصلاحي مخصص لتزكية النفوس وإحياء السنة النبوية الشريفة ونشر العلوم الإسلامية الأصيلة وذكر الله تعالى.
            </p>
            <div className={`p-3 rounded-lg border-r-4 border-[#b08d43] space-y-2 text-xs ${isDark ? 'bg-[#18110b]' : 'bg-amber-50'}`}>
              <h4 className="text-amber-500 font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#b08d43]" />
                أهم الأنشطة والأقسام:
              </h4>
              <ul className="list-disc list-inside space-y-1 leading-relaxed">
                <li>مجالس الذكر والمراقبة الأسبوعية</li>
                <li>الدروس والمواعظ الإصلاحية وتزكية القلوب</li>
                <li>دروس القرآن الكريم والحديث النبوي الشريف</li>
                <li>حفلات التكريم والاجتماعات السنوية</li>
                <li>المكتبة الصوتية الرقمية والكتب الإسلامية</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <p className="font-sans text-sm">
              <strong>Khanqah Darul Falah</strong> is an Islamic spiritual and reformative center dedicated to purifying hearts (Tazkiyah), reviving the blessed Sunnah, and spreading authentic Islamic knowledge.
            </p>
            <div className={`p-3 rounded-lg border-l-4 border-[#b08d43] space-y-2 text-xs font-sans ${isDark ? 'bg-[#18110b]' : 'bg-amber-50'}`}>
              <h4 className="text-amber-500 font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#b08d43]" />
                Key Activities & Departments:
              </h4>
              <ul className="list-disc list-inside space-y-1 leading-relaxed">
                <li>Weekly Dhikr & Muraqaba gatherings (Majalis)</li>
                <li>Islahi Bayanat and spiritual mentorship</li>
                <li>Dars-e-Quran and Hadith instruction</li>
                <li>Dastar-e-Fazilat & annual gatherings</li>
                <li>Digital MP3 Audio Library & Islamic Urdu books</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </BaseModal>
  );
};

// 11. عطیات و صدقہ جاریہ (Donations & Sadqa-e-Jariya Form Modal)
const DONATION_FORM_URL = 'https://khanqahdarulfalah.blogspot.com/p/donation-page-form-part.html';
const SHEIKH_ARCHIVE_PNG = 'https://ia801004.us.archive.org/12/items/1743133488972_202509/Website-Logo--1761190197926.png';
const SADAQAH_FORM_LOGO = 'https://archive.org/download/1743133488972_202509/%D8%B5%D8%AF%D8%A7%D8%A6%DB%92-%D9%81%D9%82%DB%8C%D8%B1%D8%A7%D9%86%DB%81--1771060659812.png';
const FORMSUBMIT_AJAX_URL = 'https://formsubmit.co/ajax/khanqahdarulfalah@gmail.com';
const PRESET_AMOUNTS = ['10', '50', '100', '200', '500', '1000'];

export const DonationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  lang?: AppLanguage;
  onNotify?: (msg: string) => void;
}> = ({ isOpen, onClose, isDark = true, lang = DEFAULT_LANGUAGE, onNotify }) => {
  const [showForm, setShowForm] = React.useState(false);
  const [copiedKey, setCopiedKey] = React.useState<'iban' | 'ep' | null>(null);
  const [imgError, setImgError] = React.useState(false);
  const [formLogoError, setFormLogoError] = React.useState(false);

  // Native form fields (NO father_name / ولدیت, NO QR code)
  const [userName, setUserName] = React.useState('');
  const [cityVillage, setCityVillage] = React.useState('');
  const [pledgeRelation, setPledgeRelation] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [helpType, setHelpType] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [screenshotFile, setScreenshotFile] = React.useState<File | null>(null);
  const [submitState, setSubmitState] = React.useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = React.useState('');

  const labels = getDonationLabels(lang);

  const handleCopy = (val: string, key: 'iban' | 'ep') => {
    navigator.clipboard
      ?.writeText(val)
      .then(() => {
        setCopiedKey(key);
        if (onNotify) onNotify(`${val} — ${labels.copiedLabel}`);
        setTimeout(() => setCopiedKey(null), 2200);
      })
      .catch(() => {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2200);
      });
  };

  const handleClose = () => {
    setShowForm(false);
    setSubmitState('idle');
    setStatusMessage('');
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setScreenshotFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setSubmitState('error');
      setStatusMessage('فائل کا سائز 10MB سے زیادہ نہیں ہونا چاہیے۔');
      e.target.value = '';
      setScreenshotFile(null);
      return;
    }
    setSubmitState('idle');
    setStatusMessage('');
    setScreenshotFile(file);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !cityVillage.trim() || !pledgeRelation || !phone.trim() || !helpType || !amount.trim()) {
      setSubmitState('error');
      setStatusMessage('براہِ کرم تمام ضروری خانے پُر کریں۔');
      return;
    }

    setSubmitState('submitting');
    setStatusMessage('براہِ کرم انتظار فرمائیں، آپ کا فارم بھیجا جا رہا ہے...');

    const formData = new FormData();
    formData.append('user_name', userName.trim());
    formData.append('city_village', cityVillage.trim());
    formData.append('pledge_relation', pledgeRelation);
    formData.append('phone', phone.trim());
    formData.append('help_type', helpType);
    formData.append('amount', amount.trim());
    formData.append('_subject', `نیا عطیہ فارم — ${userName.trim()} (${helpType} · Rs ${amount.trim()})`);
    formData.append('_captcha', 'false');
    formData.append('_template', 'table');
    if (screenshotFile) {
      formData.append('transaction_screenshot', screenshotFile);
    }

    try {
      const response = await fetch(FORMSUBMIT_AJAX_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (response.ok && (data?.success === 'true' || data?.success === true || !data?.message)) {
        setSubmitState('success');
        setStatusMessage('جزاک اللہ! آپ کی معلومات اور رسید کامیابی سے بھیج دی گئی ہے۔ اللہ آپ کی نیکی قبول فرمائے۔');
        if (onNotify) onNotify('عطیات فارم کامیابی سے جمع ہو گیا! جزاک اللہ');
        setUserName('');
        setCityVillage('');
        setPledgeRelation('');
        setPhone('');
        setHelpType('');
        setAmount('');
        setScreenshotFile(null);
      } else {
        setSubmitState('error');
        setStatusMessage(
          data?.message ||
            'فارم بھیجنے میں دشواری پیش آئی۔ براہِ کرم نیچے واٹس ایپ بٹن سے تفصیل اور اسکرین شاٹ بھیج دیں۔'
        );
      }
    } catch {
      setSubmitState('error');
      setStatusMessage('انٹرنیٹ یا سرور کی خرابی کی وجہ سے فارم نہیں جا سکا۔ براہِ کرم واٹس ایپ کے ذریعے اسکرین شاٹ بھیجیں۔');
    }
  };

  const whatsappReceiptUrl = React.useMemo(() => {
    const lines = [
      'السلام علیکم ورحمۃ اللہ وبرکاتہ',
      '🕌 *خانقاہ و مدرسہ دارالفلاح — عطیات فارم*',
      `• *نام:* ${userName || '—'}`,
      `• *شہر / گاؤں:* ${cityVillage || '—'}`,
      `• *بیعت کا تعلق:* ${pledgeRelation || '—'}`,
      `• *واٹس ایپ / فون:* ${phone || '—'}`,
      `• *تعاون کی نوعیت:* ${helpType || '—'}`,
      `• *رقم (روپے):* ${amount || '—'}`,
      'نوٹ: میں رقم ادا کرنے کا اسکرین شاٹ ساتھ بھیج رہا ہوں۔',
    ].join('\n');
    return `https://api.whatsapp.com/send?phone=923369757393&text=${encodeURIComponent(lines)}`;
  }, [userName, cityVillage, pledgeRelation, phone, helpType, amount]);

  const inputClassName = `w-full rounded-xl border px-3 py-2 text-xs sm:text-sm outline-none transition-colors ${
    isDark
      ? 'bg-[#081b11] border-[#d4af37]/40 text-emerald-50 placeholder:text-emerald-200/40 focus:border-[#00ff99]'
      : 'bg-white border-emerald-700/25 text-[#11261b] placeholder:text-slate-400 focus:border-[#2e7d32]'
  }`;

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title={labels.modalTitle} isDark={isDark} lang={lang}>
      <div className="space-y-3.5 text-center">
        {!showForm ? (
          <>
            {!imgError && (
              <div className="flex justify-center">
                <img
                  src={SHEIKH_ARCHIVE_PNG}
                  alt="حضرت شیخ صاحب"
                  onError={() => setImgError(true)}
                  className="max-w-full w-[260px] h-auto object-contain mx-auto"
                />
              </div>
            )}

            <div>
              <span className="inline-block px-3.5 py-1 rounded-lg bg-[#064326] text-[#d4af37] border border-[#d4af37]/60 text-sm font-bold shadow-xs">
                {labels.institutionBadge}
              </span>
            </div>

            <p className="text-xs sm:text-sm font-semibold leading-relaxed">
              {labels.introLine}
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-300 font-bold leading-relaxed">
              {labels.sadqaNote}
            </p>

            {/* Donation Bank & EasyPaisa Card */}
            <div
              className={`rounded-2xl border p-3 space-y-2 text-xs sm:text-sm ${
                isDark
                  ? 'bg-[#081b11] border-[#d4af37]/40 text-emerald-50'
                  : 'bg-[#f8faf9] border-[#064326]/20 text-[#11261b]'
              }`}
            >
              <div className="inline-block px-3 py-0.5 rounded-md bg-[#009970] text-white text-xs font-bold">
                {labels.detailsHeading}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                <span className="font-bold">{labels.bankLabel}</span>
                <span dir="ltr" className="font-mono font-bold text-[#064326] dark:text-[#00ff99] select-all break-all">
                  PK61BAHL2021008100453301
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('PK61BAHL2021008100453301', 'iban')}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#064326] hover:bg-[#095c34] text-white border border-[#d4af37]/50 text-[10px] font-bold cursor-pointer"
                >
                  {copiedKey === 'iban' ? <Check className="w-3 h-3 text-[#00ff99]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'iban' ? labels.copiedLabel : labels.copyLabel}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span className="font-bold">{labels.easyPaisaLabel}</span>
                <span dir="ltr" className="font-mono font-bold text-[#064326] dark:text-[#00ff99] select-all">
                  03369757393
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('03369757393', 'ep')}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#064326] hover:bg-[#095c34] text-white border border-[#d4af37]/50 text-[10px] font-bold cursor-pointer"
                >
                  {copiedKey === 'ep' ? <Check className="w-3 h-3 text-[#00ff99]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'ep' ? labels.copiedLabel : labels.copyLabel}</span>
                </button>
              </div>

              <div className="text-xs">
                <span className="font-bold">{labels.nameLabel}</span> پیر حضرت مولانا محمد جمشید صاحب
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-xs">
                <a
                  href={WHATSAPP_DIRECT_CHAT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#25D366] hover:bg-[#1faa4e] text-white font-bold"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white" />
                  <span>{labels.whatsappLabel} 03369757393</span>
                </a>
                <a
                  href={BLOGGER_HOME_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#009970]/40 text-[#009970] dark:text-[#00ff99] font-bold hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{labels.websiteLabel}</span>
                </a>
              </div>
            </div>

            {/* Hadees Blockquote */}
            <div className="space-y-1.5">
              <div className="inline-block px-3 py-0.5 rounded-md bg-[#00a78e] text-white text-xs font-bold">
                {labels.hadeesHeading}
              </div>
              <blockquote
                className={`border-r-4 border-[#00a78e] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  isDark ? 'bg-[#081b11] text-emerald-100' : 'bg-[#f3faf7] text-[#11261b]'
                }`}
              >
                {labels.hadeesText}{' '}
                <strong className="text-[#8c6514] dark:text-[#d4af37]">{labels.hadeesRef}</strong>
              </blockquote>
            </div>

            {/* Open Form Sparkling Button + Standalone HTML Page Link */}
            <div className="pt-1 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="khanqah-shine-btn inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#2e7d32] hover:bg-[#1b5e20] text-white text-sm sm:text-base font-bold border-2 border-[#d4af37] shadow-lg active:scale-95 transition-transform cursor-pointer"
              >
                <HeartHandshake className="w-4 h-4 text-[#d4af37]" />
                <span>{labels.openFormBtn}</span>
              </button>

              <a
                href={`${import.meta.env.BASE_URL}khanqah-donation.html`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-[#064326] dark:text-[#d4af37] hover:underline inline-flex items-center gap-1"
              >
                <span>{labels.openHtmlPageBtn}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </>
        ) : (
          <div className="space-y-3 text-right" dir="rtl">
            {/* Form Logo */}
            {!formLogoError && (
              <div className={`rounded-xl p-2 border-b-2 border-[#2e7d32] text-center ${isDark ? 'bg-[#081b11]' : 'bg-white'}`}>
                <img
                  src={SADAQAH_FORM_LOGO}
                  alt="خانقاہ دارالفلاح لوگو"
                  onError={() => setFormLogoError(true)}
                  className="max-w-[200px] h-auto mx-auto"
                />
              </div>
            )}

            <div className="text-center">
              <h4 className="text-base sm:text-lg font-bold text-[#2e7d32] dark:text-[#d4af37]">
                عطیات و صدقات فارم
              </h4>
              <p className="text-[11px] opacity-75">
                پیسے ادا کرنے کے بعد اسکرین شاٹ منسلک کر کے فارم ارسال کریں
              </p>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-2.5">
              <div>
                <label className="block text-xs font-bold mb-1">نام (Name)</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="مثال: محمد احمد"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">شہر یا گاؤں (City/Village)</label>
                <input
                  type="text"
                  required
                  value={cityVillage}
                  onChange={(e) => setCityVillage(e.target.value)}
                  placeholder="مثال: بنوں، میراخیل"
                  className={inputClassName}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold mb-1">بیعت کا تعلق</label>
                  <select
                    required
                    value={pledgeRelation}
                    onChange={(e) => setPledgeRelation(e.target.value)}
                    className={inputClassName}
                  >
                    <option value="">-- منتخب کریں --</option>
                    <option value="بیعت ہیں">بیعت ہیں</option>
                    <option value="نہیں ہیں">نہیں ہیں</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">واٹس ایپ / موبائل نمبر</label>
                  <input
                    type="tel"
                    dir="ltr"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="03xxxxxxxxx"
                    className={`${inputClassName} text-right`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">تعاون کی نوعیت</label>
                <select
                  required
                  value={helpType}
                  onChange={(e) => setHelpType(e.target.value)}
                  className={inputClassName}
                >
                  <option value="">-- قسم منتخب کریں --</option>
                  <option value="زکوٰۃ">زکوٰۃ</option>
                  <option value="صدقہ">صدقہ</option>
                  <option value="ہدیہ شیخ صاحب">ہدیہ شیخ صاحب</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">رقم (روپے)</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_AMOUNTS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                        amount === preset
                          ? 'bg-[#2e7d32] text-white border-[#d4af37]'
                          : isDark
                          ? 'bg-[#081b11] text-emerald-100 border-[#d4af37]/30 hover:border-[#d4af37]'
                          : 'bg-emerald-50 text-[#11261b] border-emerald-700/20 hover:bg-emerald-100'
                      }`}
                    >
                      Rs {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  required
                  dir="ltr"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="مثال: 500"
                  className={`${inputClassName} text-right`}
                />
              </div>

              {/* Screenshot Upload */}
              <div
                className={`rounded-xl border border-dashed p-3 space-y-1.5 ${
                  isDark ? 'bg-[#081b11] border-[#d4af37]/50' : 'bg-[#f4fbf5] border-[#2e7d32]/50'
                }`}
              >
                <label className="flex items-center gap-1.5 text-xs font-bold text-[#2e7d32] dark:text-[#00ff99]">
                  <Upload className="w-4 h-4 shrink-0" />
                  <span>پیمنٹ کی رسید یا اسکرین شاٹ اپلوڈ کریں (لازمی نہیں، 10MB تک)</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-xs file:ml-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#2e7d32] file:text-white file:font-bold file:cursor-pointer cursor-pointer"
                />
                {screenshotFile && (
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-[#00ff99]">
                    منتخب فائل: {screenshotFile.name}
                  </p>
                )}
                <p className="text-[11px] opacity-75">
                  پیسے ادا کرنے کے بعد اسکرین شاٹ لے کر یہاں بھیج دیں تاکہ تصدیق میں آسانی رہے۔
                </p>
              </div>

              {submitState !== 'idle' && (
                <div
                  className={`rounded-xl p-2.5 text-xs font-bold flex items-start gap-2 ${
                    submitState === 'success'
                      ? 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-200 border border-emerald-500/40'
                      : submitState === 'error'
                      ? 'bg-rose-600/20 text-rose-700 dark:text-rose-200 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/40'
                  }`}
                >
                  {submitState === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{statusMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitState === 'submitting'}
                className="w-full py-2.5 px-4 rounded-xl bg-[#2e7d32] hover:bg-[#1b5e20] disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md border border-[#d4af37]/60 cursor-pointer active:scale-98 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>{submitState === 'submitting' ? 'بھیجا جا رہا ہے...' : 'تفصیلات اور اسکرین شاٹ ارسال کریں'}</span>
              </button>
            </form>

            {/* 1-Tap WhatsApp Receipt Backup + Navigation Links */}
            <div className="pt-1 flex flex-col items-center gap-2">
              <a
                href={whatsappReceiptUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#1faa4e] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>واٹس ایپ پر اسکرین شاٹ اور تفصیل بھیجیں (03369757393)</span>
              </a>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#009688] hover:bg-[#00796b] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>{labels.backToGuideBtn}</span>
                </button>
                <a
                  href={`${import.meta.env.BASE_URL}khanqah-donation-form.html`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-[#064326] dark:text-[#d4af37] hover:underline inline-flex items-center gap-1"
                >
                  <span>علیحدہ فارم صفحہ</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={DONATION_FORM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-[#064326] dark:text-[#d4af37] hover:underline inline-flex items-center gap-1"
                >
                  <span>بلاگر لنک</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
};


// 2. شیخ حضرت مولانا محمد جمشید صاحب نقشبندی مجددی دامت برکاتہم کا تعارف
export const IntroSheikhModal: React.FC<{ isOpen: boolean; onClose: () => void; isDark?: boolean; lang?: AppLanguage }> = ({ isOpen, onClose, isDark = true, lang = DEFAULT_LANGUAGE }) => {
  const t = UI_STRINGS[lang];
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={t.modalSheikhTitle} isDark={isDark} lang={lang}>
      <div className="space-y-4 font-lalezar text-base leading-relaxed">
        <div className={`text-center p-3 border border-[#b08d43]/50 rounded-xl ${isDark ? 'bg-[#382618]' : 'bg-amber-100/70'}`}>
          <User className="w-10 h-10 text-[#b08d43] mx-auto mb-1" />
          <h3 className="text-xl font-bold">
            {t.sheikhFullTitle}
          </h3>
          <p className="text-xs text-[#b08d43] font-sans">دامت برکاتہم العالیہ</p>
        </div>

        {lang === 'ps' ? (
          <>
            <p className="text-justify">
              شیخ الحدیث حضرت مولانا پیر محمد جمشید صاحب نقشبندي مجددي دامت برکاتهم د سلسلې عالیې نقشبندیې مجددیې ستر لارښود، روحاني مصلح او د حدیثو او سلوک جلیل القدر عالم دي.
            </p>
            <div className={`p-3 rounded-lg border-r-4 border-emerald-600 space-y-2 text-xs font-sans ${isDark ? 'bg-[#18110b]' : 'bg-emerald-50 text-emerald-950'}`}>
              <p className="font-bold text-emerald-600 font-lalezar text-sm">د طریقې عالیې نقشبندیې مجددیې لارښوونې:</p>
              <p className="leading-relaxed">
                نوموړي خپل ژوند د دین دعوت، د ټولنې اصلاح، باطني تزکیې او د شریعت او سنتو د پابندۍ لپاره وقف کړی دی. د هغه په بیانونو کې پر اتباعِ سنت، محبتِ رسولﷺ او اخلاص خاص ټینګار کېږي.
              </p>
            </div>
          </>
        ) : lang === 'ur' || lang === 'fa' ? (
          <>
            <p className="text-justify">
              شیخ الحدیث حضرت مولانا پیر محمد جمشید صاحب نقشبندی مجددی دامت برکاتہم عصرِ حاضر میں سلسلہ عالیہ نقشبندیہ مجددیہ کے عظیم پیشوا، صاحبِ دل مصلح اور علومِ حدیث و سلوک کے جلیل القدر عالم ہیں۔
            </p>

            <div className={`p-3 rounded-lg border-r-4 border-emerald-600 space-y-2 text-xs font-sans ${isDark ? 'bg-[#18110b]' : 'bg-emerald-50 text-emerald-950'}`}>
              <p className="font-bold text-emerald-600 font-lalezar text-sm">طریقۂ عالیہ نقشبندیہ مجددیہ کی تعلیمات:</p>
              <p className="leading-relaxed">
                آپ نے اپنی زندگی کو دعوتِ دین، اصلاحِ معاشرہ، تزکیہ باطن اور شریعت و سنت کی پابندی کے لیے وقف کر رکھا ہے۔ آپ کے علمی و اصلاحی خطابات میں اتباعِ سنت، حبِّ رسولﷺ، اخلاصِ نیت اور اللہ تعالیٰ کے ساتھ سچا تعلق قائم کرنے پر خاص زور دیا جاتا ہے۔
              </p>
            </div>

            <p className="text-xs opacity-80">
              آپ کے خطابات روزانہ اور ہفتہ وار بنیادوں پر آڈیو لائبریری اور واٹس ایپ چینلز کے ذریعے نشر کیے جاتے ہیں۔
            </p>
          </>
        ) : lang === 'ar' ? (
          <p className="text-sm leading-relaxed">
            شيخ الحديث فضيلة الشيخ محمد جمشيد النقشبندي المجددي حفظه الله عالم جليل في علوم الحديث والسلوك، ومرشد في الطريقة النقشبندية المجددية، يكرّس حياته للدعوة إلى الالتزام بالشريعة والسنة النبوية وتزكية الباطن والإخلاص لله تعالى.
          </p>
        ) : (
          <p className="font-sans text-sm leading-relaxed">
            Sheikh-ul-Hadees Hazrat Maulana Peer Muhammad Jamshaid Naqshbandi Mujaddidi (Damat Barakatuhum) is an eminent scholar of Hadith, spiritual guide in the Naqshbandi Mujaddidi order, and dedicated reformer calling people to adherence to Shari&apos;ah, Sunnah, sincerity, and closeness to Allah.
          </p>
        )}
      </div>
    </BaseModal>
  );
};

// 5. رابطہ کریں
export const ContactModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  isDark?: boolean;
  lang?: AppLanguage;
  onOpenWhatsAppGroups?: () => void;
}> = ({ isOpen, onClose, isDark = true, lang = DEFAULT_LANGUAGE, onOpenWhatsAppGroups }) => {
  const t = UI_STRINGS[lang];
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={t.modalContactTitle} isDark={isDark} lang={lang}>
      <div className="space-y-3.5 text-sm">
        <p className="font-lalezar text-center mb-1 text-sm sm:text-base">
          خانقاہ دارالفلاح سے رابطے، آفیشل واٹس ایپ گروپس اور سوشل میڈیا میں شمولیت کے لنکس:
        </p>

        {/* Highlighted WhatsApp Groups Banner */}
        <div className="p-3 bg-gradient-to-r from-emerald-900/50 to-[#25D366]/20 border border-emerald-500/60 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold shadow-xs">
                <MessageCircle className="w-4 h-4 fill-white" />
              </span>
              <div>
                <h4 className="font-bold text-emerald-400 font-lalezar text-base">
                  تمام آفیشل واٹس ایپ گروپس (4 گروپس + چینل)
                </h4>
                <p className="text-[11px] opacity-80">بیانات، اعلانات اور روزانہ کے روحانی پیغامات</p>
              </div>
            </div>
            {onOpenWhatsAppGroups && (
              <button
                onClick={() => {
                  onClose();
                  onOpenWhatsAppGroups();
                }}
                className="px-3 py-1.5 bg-[#25D366] hover:bg-[#1faa4e] text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-95"
              >
                سب دیکھیں
              </button>
            )}
          </div>

          {/* Quick Links inside Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs font-sans">
            <a
              href="https://whatsapp.com/channel/0029VaHFtAKDDmFU33nD360K"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-600/40 text-emerald-200 transition-colors"
            >
              <span className="font-semibold">📢 واٹس ایپ چینل</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </a>
            <a
              href="https://chat.whatsapp.com/F8R7NYrrC9y8Qh3ahZjbKP"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-600/40 text-emerald-200 transition-colors"
            >
              <span className="font-semibold">👥 اصلاح وتربیت</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </a>
            <a
              href="https://chat.whatsapp.com/LMrsIec0blR3YgPgtj7pZw"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-600/40 text-emerald-200 transition-colors"
            >
              <span className="font-semibold">👥 درس قرآن</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </a>
            <a
              href="https://chat.whatsapp.com/KOMhllk91BM6XagfBrHnAD"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-600/40 text-emerald-200 transition-colors"
            >
              <span className="font-semibold">👥 دردِ دل</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </a>
            <a
              href="https://chat.whatsapp.com/LfAEjp6PNFXExk9VfnnGuy?s=sh&p=a&mlu=3"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-600/40 text-emerald-200 transition-colors sm:col-span-2"
            >
              <span className="font-semibold">👥 مجلس محبت الٰہی</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </a>
          </div>
        </div>

        {/* Direct WhatsApp Call/Chat */}
        <a
          href={WHATSAPP_DIRECT_CHAT_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between p-3 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-600/60 rounded-xl transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md">
              <MessageCircle className="w-5 h-5 fill-white" />
            </div>
            <div>
              <p className="font-bold text-emerald-300 font-lalezar text-base">براہ راست واٹس ایپ رابطہ</p>
              <p className="text-xs text-emerald-200 font-sans">شیخ صاحب سے واٹس ایپ پر رابطہ کریں</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-emerald-400" />
        </a>

        {/* YouTube */}
        <a
          href="https://youtube.com/@peermolanamuhammadjamshedn1391"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between p-3 bg-red-950/40 hover:bg-red-900/60 border border-red-700/50 rounded-xl transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
              <Youtube className="w-5 h-5 fill-white" />
            </div>
            <div>
              <p className="font-bold text-red-300 font-lalezar text-base">آفیشل یوٹیوب چینل</p>
              <p className="text-xs opacity-75">ویڈیو بیانات و مجالس</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-red-400" />
        </a>

        {/* Facebook */}
        <a
          href="https://www.facebook.com/profile.php?id=100068373408345"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between p-3 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-700/50 rounded-xl transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Facebook className="w-5 h-5 fill-white" />
            </div>
            <div>
              <p className="font-bold text-blue-300 font-lalezar text-base">فیس بک آفیشل پیج</p>
              <p className="text-xs opacity-75">پوسٹس، تصاویر اور اعلانات</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-blue-400" />
        </a>
      </div>
    </BaseModal>
  );
};

// 6. واٹس ایپ گروپس اور چینل کا خصوصی ماڈل
export const WhatsAppGroupsModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  isDark?: boolean;
  lang?: AppLanguage;
}> = ({ isOpen, onClose, isDark = true, lang = DEFAULT_LANGUAGE }) => {
  const t = UI_STRINGS[lang];
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 2500);
    }).catch(() => {
      // Fallback
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={t.modalWaGroupsTitle} isDark={isDark} lang={lang}>
      <div className="space-y-4">
        {/* Banner introduction */}
        <div className={`p-3.5 rounded-xl border border-emerald-500/50 text-center space-y-1.5 ${
          isDark ? 'bg-gradient-to-b from-emerald-950/80 to-[#18110b]' : 'bg-emerald-50/90 text-emerald-950'
        }`}>
          <div className="w-12 h-12 mx-auto rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg">
            <MessageCircle className="w-6 h-6 fill-white" />
          </div>
          <h4 className="font-bold font-lalezar text-lg text-emerald-400">
            شیخ الحدیث حضرت مولانا پیر محمد جمشید نقشبندی مجددی (دامت برکاتہم)
          </h4>
          <p className="text-xs leading-relaxed opacity-90 font-sans">
            حضرت اقدس کے تمام آفیشل واٹس ایپ گروپس اور چینل کی فہرست درج ذیل ہے۔ نیچے دیے گئے بٹن پر کلک کرکے باآسانی گروپ میں شامل ہو سکتے ہیں:
          </p>
        </div>

        {/* Groups and Channel List */}
        <div className="space-y-3">
          {OFFICIAL_WHATSAPP_LINKS.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition-all ${
                item.type === 'channel'
                  ? 'border-emerald-500 bg-emerald-950/40 shadow-sm'
                  : isDark
                  ? 'border-[#b08d43]/40 bg-[#2b1b11] hover:border-[#b08d43]'
                  : 'border-[#b08d43]/40 bg-white hover:border-[#b08d43] shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-sans ${
                    item.type === 'channel'
                      ? 'bg-[#25D366] text-white shadow-xs'
                      : 'bg-[#b08d43] text-white'
                  }`}>
                    {item.badge}
                  </span>
                  <h5 className="font-bold font-lalezar text-base text-[#b08d43]">
                    {item.title}
                  </h5>
                </div>
              </div>

              <p className="text-[11px] font-sans text-gray-400 mb-1" dir="ltr">
                {item.subTitle}
              </p>

              <p className="text-xs leading-relaxed opacity-85 mb-3 font-sans">
                {item.description}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 bg-[#25D366] hover:bg-[#1faa4e] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>{item.type === 'channel' ? 'چینل فالو کریں' : 'گروپ میں شامل ہوں'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => handleCopyLink(item.url, item.id)}
                  className={`py-2 px-3 border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
                    copiedId === item.id
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : isDark
                      ? 'border-[#b08d43]/40 hover:bg-[#b08d43]/20 text-amber-200'
                      : 'border-[#b08d43]/40 hover:bg-amber-100 text-[#3d2e21]'
                  }`}
                  title="لنک کاپی کریں"
                >
                  {copiedId === item.id ? (
                    <>
                      <span>کاپی ہو گیا!</span>
                    </>
                  ) : (
                    <>
                      <span>لنک کاپی</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Direct Contact Phone */}
        <div className={`p-3 rounded-xl border border-emerald-600/40 flex items-center justify-between ${
          isDark ? 'bg-emerald-950/30' : 'bg-emerald-50/80'
        }`}>
          <div>
            <p className="font-bold font-lalezar text-sm text-emerald-400">براہِ راست واٹس ایپ رابطہ</p>
            <p className="text-xs text-emerald-200 font-sans">شیخ صاحب سے براہِ راست واٹس ایپ میسج</p>
          </div>
          <a
            href={WHATSAPP_DIRECT_CHAT_URL}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-[#25D366] hover:bg-[#1faa4e] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
          >
            <span>میسج بھیجیں</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </BaseModal>
  );
};



// 8. ایپلیکیشن کے بارے میں
export const AboutAppModal: React.FC<{ isOpen: boolean; onClose: () => void; isDark?: boolean; lang?: AppLanguage }> = ({
  isOpen,
  onClose,
  isDark = true,
  lang = DEFAULT_LANGUAGE,
}) => {
  const t = UI_STRINGS[lang];
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={t.modalAboutTitle} isDark={isDark} lang={lang}>
      <div className="space-y-4 font-lalezar text-sm">
        <div className={`text-center p-4 border border-[#b08d43]/50 rounded-2xl ${isDark ? 'bg-[#382618]' : 'bg-amber-100/70'}`}>
          <img
            src={`${import.meta.env.BASE_URL}kdf-logo-v4.webp`}
            alt={t.appName}
            className="w-24 h-24 mx-auto mb-2 rounded-2xl shadow-xl object-cover"
          />
          <h3 className="text-2xl font-bold">{t.appName}</h3>
          <p className="text-xs text-[#b08d43] font-sans">Khanqah Darul Falah Mobile Application</p>
          <div className="inline-block px-3 py-1 bg-[#b08d43]/20 border border-[#b08d43]/50 rounded-full text-xs text-[#b08d43] mt-2 font-sans font-bold">
            Version 1.0.0 (Release)
          </div>
        </div>

        <div className={`p-3 rounded-xl border border-[#b08d43]/30 space-y-2 text-xs font-sans ${isDark ? 'bg-[#18110b]' : 'bg-amber-50'}`} dir="ltr">
          <div className="flex justify-between py-1 border-b border-[#b08d43]/20">
            <span className="text-[#b08d43] font-bold">Package Name:</span>
            <span className="select-all font-mono">{ANDROID_PACKAGE_NAME}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#b08d43]/20">
            <span className="text-[#b08d43] font-bold">Target Website:</span>
            <span>{OFFICIAL_WEBSITE_URL}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[#b08d43] font-bold">Features:</span>
            <span>14 Languages (Urdu, Pashto, English, Arabic &amp; more), Offline Retry, 1-Click Bayan &amp; Folder Downloads, Light/Dark Theme</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs leading-relaxed opacity-85 font-sans">
            {lang === 'ps'
              ? 'دا رسمي اپلیکېشن د خانقاه دارالفلاح آډیو بیانات، اسلامي کتابونه، د لمونځونو مهالوېش، ژوندۍ خبرتیاوې او د یو کلیک MP3 ډاونلوډ آسانتیا په ۱۴ ژبو کې وړاندې کوي.'
              : lang === 'ur' || lang === 'fa'
              ? 'یہ ایپلیکیشن اصل ویب سائٹ کے تمام صفحات، آڈیو فولڈرز، مجالس، کتب اور بیانات کو بغیر کسی ردوبدل کے اصلی حالت میں پیش کرتی ہے، نیز اس میں اسمارٹ سرچ بار، فولڈر ڈاؤنلوڈ اور نارمل/ڈارک تھیم کی سہولت شامل ہے۔'
              : lang === 'ar'
              ? 'يقدّم هذا التطبيق الرسمي مجلدات خانقاه دار الفلاح الصوتية والكتب الإسلامية ومواقيت الصلاة وإشعارات البث المباشر والتحميل بضغطة واحدة.'
              : 'This official app presents Khanqah Darul Falah audio folders, Islamic books, prayer schedules, live notifications, and 1-click MP3 downloads across 14 global and regional languages.'}
          </p>
        </div>
      </div>
    </BaseModal>
  );
};

// 9. شرائط و ضوابط (Terms & Conditions)
export const TermsModal: React.FC<{ isOpen: boolean; onClose: () => void; isDark?: boolean; lang?: AppLanguage }> = ({
  isOpen,
  onClose,
  isDark = true,
  lang = DEFAULT_LANGUAGE,
}) => {
  const t = UI_STRINGS[lang];
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={t.modalTermsTitle} isDark={isDark} lang={lang}>
      <div className="space-y-3.5 text-xs sm:text-sm leading-relaxed">
        <div className={`p-3 rounded-xl border border-[#d4af37]/40 flex items-center gap-2.5 ${isDark ? 'bg-[#081b11]' : 'bg-[#ebf2ee]'}`}>
          <FileText className="w-5 h-5 text-[#064326] dark:text-[#d4af37] shrink-0" />
          <p className="font-bold text-[#064326] dark:text-[#d4af37]">
            {lang === 'ps'
              ? 'د خانقاه دارالفلاح ډیجیټل خدمتونو د کارولو اصول او شرایط'
              : lang === 'ur' || lang === 'fa'
              ? 'خانقاہ دارالفلاح ڈیجیٹل سروسز کے استعمال کے اصول و ضوابط'
              : lang === 'ar'
              ? 'ضوابط وشروط استخدام خدمات خانقاه دار الفلاح الرقمية'
              : 'Terms of Use for Khanqah Darul Falah Digital Services'}
          </p>
        </div>

        {lang === 'ps' ? (
          <ul className="space-y-2 list-disc list-inside opacity-90">
            <li><strong>موخه:</strong> پدې اپلیکېشن کې ټول اصلاحي بیانات، د قرآن درسونه او کتابونه یوازې د دینی او روحاني ګټې لپاره په وړیا توګه وړاندې کېږي.</li>
            <li><strong>شریکول:</strong> تاسو کولی شئ هر بیان یا کتاب په بشپړه امانتدارۍ او اصلي سرلیک سره د صدقه جاریې په نیت له دوستانو سره شریک کړئ.</li>
            <li><strong>د بدلون بندیز:</strong> په آډیو یا لیکلي موادو کې پرېکون، تحریف یا ناسمه نسبت ورکول شرعاً او اخلاقاً اجازه نلري.</li>
            <li><strong>آرکائیو لنکونه:</strong> ټولې آډیوګانې د Archive.org او رسمي بلاګ سره نښلول شوي ترڅو په یو کلیک یې خوندي کړئ.</li>
          </ul>
        ) : lang === 'ur' || lang === 'fa' ? (
          <ul className="space-y-2 list-disc list-inside opacity-90">
            <li>
              <strong>مقصدِ اشاعت:</strong> اس ایپ اور ویب سائٹ میں موجود تمام اصلاحی بیانات، دروسِ قرآن، مجالسِ ذکر اور کتب خالصتاً دینی، علمی اور اصلاحی فائدے کے لیے بلا معاوضہ فراہم کی گئی ہیں۔
            </li>
            <li>
              <strong>ثوابِ جاریہ کے لیے شیئرنگ:</strong> آپ کسی بھی بیان یا کتاب کو مکمل امانت داری اور اصل عنوان کے ساتھ سالکین و احباب میں واٹس ایپ یا دیگر ذرائع سے شیئر کر سکتے ہیں۔
            </li>
            <li>
              <strong>رد و بدل کی ممانعت:</strong> کسی بھی آڈیو بیان یا تحریر میں کاٹ چھانٹ، تحریف یا غلط نسبت کرنے کی شرعاً اور اخلاقاً اجازت نہیں۔
            </li>
            <li>
              <strong>آرکائیو و آن لائن لنکس:</strong> تمام آڈیوز Archive.org اور خانقاہ کے آفیشل بلاگ سے منسلک ہیں، جنہیں آپ 1-کلک کے ذریعے اپنے موبائل میں آف لائن سننے کے لیے محفوظ کر سکتے ہیں۔
            </li>
          </ul>
        ) : lang === 'ar' ? (
          <ul className="space-y-2 list-disc list-inside opacity-90">
            <li><strong>الهدف:</strong> جميع المحاضرات ودروس القرآن والكتب مقدمة مجاناً للنفع الديني والإصلاحي الخالص.</li>
            <li><strong>المشاركة:</strong> يُسمح بمشاركة التسجيلات والكتب بأمانة مع الحفاظ على عناوينها الأصلية صدقةً جارية.</li>
            <li><strong>منع التحريف:</strong> لا يُسمح باقتطاع أو تحريف أي تسجيل صوتي أو نصي أو نسبته لغير أهله.</li>
            <li><strong>روابط الأرشيف:</strong> ترتبط الصوتيات بأرشيف Archive.org ومدونتنا الرسمية للتحميل والاستماع دون اتصال.</li>
          </ul>
        ) : (
          <ul className="space-y-2 list-disc list-inside opacity-90 font-sans text-xs sm:text-sm">
            <li><strong>Purpose:</strong> All bayanat, Quran lessons, and Islamic books are provided free of cost solely for religious and spiritual benefit.</li>
            <li><strong>Sharing:</strong> You may freely share recordings and links intact with proper attribution as Sadaqah Jariyah.</li>
            <li><strong>Integrity:</strong> Altering, trimming out of context, or misattributing any audio or written material is strictly prohibited.</li>
            <li><strong>Archive Links:</strong> Audio files are hosted on Archive.org and our official blog for 1-click offline listening.</li>
          </ul>
        )}
      </div>
    </BaseModal>
  );
};

// 10. پرائیویسی پالیسی (Privacy Policy)
export const PrivacyPolicyModal: React.FC<{ isOpen: boolean; onClose: () => void; isDark?: boolean; lang?: AppLanguage }> = ({
  isOpen,
  onClose,
  isDark = true,
  lang = DEFAULT_LANGUAGE,
}) => {
  const t = UI_STRINGS[lang];
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={t.modalPrivacyTitle} isDark={isDark} lang={lang}>
      <div className="space-y-3.5 text-xs sm:text-sm leading-relaxed">
        <div className={`p-3 rounded-xl border border-emerald-600/40 flex items-center gap-2.5 ${isDark ? 'bg-emerald-950/40' : 'bg-emerald-50'}`}>
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="font-bold text-emerald-800 dark:text-emerald-300">
            {lang === 'ps'
              ? 'ستاسو د محرمیت بشپړه ساتنه او هیڅ ډول تعقیب نشته'
              : lang === 'ur' || lang === 'fa'
              ? 'آپ کی معلومات کی مکمل حفاظت اور رازداری کی یقین دہانی'
              : lang === 'ar'
              ? 'حماية كاملة لخصوصيتك وعدم جمع أي بيانات شخصية'
              : 'Full Protection of Your Privacy & Zero Tracking'}
          </p>
        </div>

        {lang === 'ps' ? (
          <ul className="space-y-2 list-disc list-inside opacity-90">
            <li><strong>شخصي معلومات نه راټولېږي:</strong> دا اپلیکېشن له کاروونکو څخه هیڅ اعلاناتي معلومات، موقعیت یا پټ معلومات نه راټولوي.</li>
            <li><strong>یوازې محلي ذخیره:</strong> ستاسو د ژبې انتخاب، رنګ (تور/سپین) او د لمونځونو وختونه یوازې ستاسو په موبایل کې خوندي پاتې کېږي.</li>
            <li><strong>له اعلانونو پاک چاپېریال:</strong> دا اپلیکېشن بشپړ غیر تجارتي او له اعلانونو پاک دی.</li>
            <li><strong>اړیکه:</strong> د محرمیت اړوند هرې پوښتنې لپاره د اپلیکېشن دننه رسمی واټساپ له لارې اړیکه نیولی شئ.</li>
          </ul>
        ) : lang === 'ur' || lang === 'fa' ? (
          <ul className="space-y-2 list-disc list-inside opacity-90">
            <li>
              <strong>کوئی ذاتی ڈیٹا اکٹھا نہیں کیا جاتا:</strong> خانقاہ دارالفلاح ایپ صارفین سے کوئی اشتہاری ڈیٹا، لوکیشن ٹریکنگ یا خفیہ معلومات اکٹھی نہیں کرتی۔
            </li>
            <li>
              <strong>مقامی اسٹوریج (Local Storage):</strong> آپ کا تھیم انتخاب (لائٹ/ڈارک)، زبان، محفوظ شدہ نوٹیفیکیشن ای میل، اور اوقاتِ نماز کا کیش صرف آپ کے اپنے موبائل میں محفوظ رہتا ہے۔
            </li>
            <li>
              <strong>اشتہارات سے پاک ماحول:</strong> یہ ایپلیکیشن مکمل طور پر غیر تجارتی اور اشتہارات سے پاک ہے تاکہ سالکین یکسوئی کے ساتھ دینی بیانات سن سکیں۔
            </li>
            <li>
              <strong>رابطہ:</strong> پرائیویسی سے متعلق کسی بھی سوال کے لیے ایپ میں موجود آفیشل واٹس ایپ رابطہ بٹن کے ذریعے رابطہ کیا جا سکتا ہے۔
            </li>
          </ul>
        ) : lang === 'ar' ? (
          <ul className="space-y-2 list-disc list-inside opacity-90">
            <li><strong>عدم جمع البيانات الشخصية:</strong> لا يجمع التطبيق أي بيانات إعلانية أو تتبع للموقع الجغرافي أو معلومات خاصة.</li>
            <li><strong>التخزين المحلي فقط:</strong> تبقى إعدادات اللغة والمظهر والبريد الإلكتروني وأوقات الصلاة محفوظة على جهازك فقط.</li>
            <li><strong>خالٍ تماماً من الإعلانات:</strong> تطبيق غير تجاري ومجاني بالكامل دون أي إعلانات مزعجة.</li>
            <li><strong>التواصل:</strong> يمكنك مراسلتنا في أي وقت عبر رابط الواتساب الرسمي لأي استفسار حول الخصوصية.</li>
          </ul>
        ) : (
          <ul className="space-y-2 list-disc list-inside opacity-90 font-sans text-xs sm:text-sm">
            <li><strong>No Personal Data Collection:</strong> This app does not collect advertising identifiers, location tracking, or personal telemetry.</li>
            <li><strong>Local Storage Only:</strong> Your theme, language selection, notification email, and prayer cache remain strictly on your device.</li>
            <li><strong>Ad-Free Experience:</strong> Completely non-commercial and free from third-party advertisements.</li>
            <li><strong>Contact:</strong> Reach us anytime via the official WhatsApp link inside the app for privacy inquiries.</li>
          </ul>
        )}
      </div>
    </BaseModal>
  );
};



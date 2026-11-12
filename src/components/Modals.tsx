import React from 'react';
import { X, MessageCircle, Youtube, Facebook, ExternalLink, User, Sparkles, Copy, Check } from 'lucide-react';
import { ANDROID_PACKAGE_NAME, OFFICIAL_WEBSITE_URL, OFFICIAL_WHATSAPP_LINKS } from '../data/appConfig';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isDark?: boolean;
  children: React.ReactNode;
}

export const BaseModal: React.FC<ModalProps> = ({ isOpen, onClose, title, isDark = true, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
      <div 
        className={`border-2 border-[#b08d43] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-right flex flex-col max-h-[90vh] transition-colors ${
          isDark ? 'bg-[#251910] text-amber-100' : 'bg-[#fdfaf3] text-[#2c1f15]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`border-b border-[#b08d43]/50 px-5 py-3.5 flex items-center justify-between ${
            isDark ? 'bg-[#382618]' : 'bg-[#f0e3cc]'
          }`}
        >
          <h3 className="text-xl font-bold font-lalezar tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#b08d43]"></span>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-amber-500 hover:text-[#b08d43] hover:bg-[#b08d43]/20 transition-colors"
            title="بند کریں"
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
          className={`border-t border-[#b08d43]/30 px-5 py-3 flex justify-end ${
            isDark ? 'bg-[#1b120a]' : 'bg-[#f7f0e1]'
          }`}
        >
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-gradient-to-r from-[#b08d43] to-[#8c6d2b] hover:from-[#c29c4c] hover:to-[#9f7d33] text-white font-lalezar text-sm rounded-lg shadow-md transition-all active:scale-95"
          >
            ٹھیک ہے (بند کریں)
          </button>
        </div>
      </div>
    </div>
  );
};

// 1. خانقاہ دارالفلاح کا تعارف
export const IntroKhanqahModal: React.FC<{ isOpen: boolean; onClose: () => void; isDark?: boolean }> = ({ isOpen, onClose, isDark = true }) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="خانقاہ دارالفلاح کا تعارف" isDark={isDark}>
      <div className="space-y-4 font-lalezar text-base leading-relaxed">
        <div className={`p-3 border border-[#b08d43]/40 rounded-xl text-center ${isDark ? 'bg-[#382618]/70' : 'bg-amber-100/60'}`}>
          <p className="text-[#b08d43] text-2xl font-bold">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
          <p className="text-xs mt-1 font-sans opacity-70">KHANQAH DAR-UL-FALAH DIGITAL ISLAMIC CENTER</p>
        </div>

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
      </div>
    </BaseModal>
  );
};

// 2. شیخ حضرت مولانا محمد جمشید صاحب نقشبندی مجددی دامت برکاتہم کا تعارف
export const IntroSheikhModal: React.FC<{ isOpen: boolean; onClose: () => void; isDark?: boolean }> = ({ isOpen, onClose, isDark = true }) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="تعارف شیخ حضرت مولانا پیر محمد جمشید صاحب" isDark={isDark}>
      <div className="space-y-4 font-lalezar text-base leading-relaxed">
        <div className={`text-center p-3 border border-[#b08d43]/50 rounded-xl ${isDark ? 'bg-[#382618]' : 'bg-amber-100/70'}`}>
          <User className="w-10 h-10 text-[#b08d43] mx-auto mb-1" />
          <h3 className="text-xl font-bold">
            شیخ الحدیث حضرت مولانا پیر محمد جمشید نقشبندی مجددی
          </h3>
          <p className="text-xs text-[#b08d43] font-sans">دامت برکاتہم العالیہ</p>
        </div>

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
      </div>
    </BaseModal>
  );
};

// 5. رابطہ کریں
export const ContactModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  isDark?: boolean;
  onOpenWhatsAppGroups?: () => void;
}> = ({ isOpen, onClose, isDark = true, onOpenWhatsAppGroups }) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="رابطہ کریں (Contact Information)" isDark={isDark}>
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
          href="https://api.whatsapp.com/send?phone=923329106002"
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
              <p className="text-xs text-emerald-200 font-sans" dir="ltr">+92 332 9106002</p>
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
}> = ({ isOpen, onClose, isDark = true }) => {
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
    <BaseModal isOpen={isOpen} onClose={onClose} title="آفیشل واٹس ایپ گروپس و چینل" isDark={isDark}>
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
            <p className="text-xs text-emerald-200 font-sans" dir="ltr">+92 332 9106002</p>
          </div>
          <a
            href="https://api.whatsapp.com/send?phone=923329106002"
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
export const AboutAppModal: React.FC<{ isOpen: boolean; onClose: () => void; isDark?: boolean }> = ({
  isOpen,
  onClose,
  isDark = true,
}) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="ایپلیکیشن کے بارے میں (About App)" isDark={isDark}>
      <div className="space-y-4 font-lalezar text-sm">
        <div className={`text-center p-4 border border-[#b08d43]/50 rounded-2xl ${isDark ? 'bg-[#382618]' : 'bg-amber-100/70'}`}>
          <div className="w-16 h-16 mx-auto mb-2 rounded-2xl bg-[#b08d43] text-white flex items-center justify-center shadow-lg font-lalezar text-2xl font-bold">
            فلاح
          </div>
          <h3 className="text-2xl font-bold">خانقاہ دارالفلاح</h3>
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
            <span>Lalezar Font, Offline Retry, 1-Click Bayan & Folder Downloads, Light/Dark Theme</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs leading-relaxed opacity-85 font-sans">
            یہ ایپلیکیشن اصل ویب سائٹ کے تمام صفحات، آڈیو فولڈرز، مجالس، کتب اور بیانات کو بغیر کسی ردوبدل کے اصلی حالت میں پیش کرتی ہے، نیز اس میں اسمارٹ سرچ بار، لال زار فونٹ، فولڈر ڈاؤنلوڈ اور نارمل/ڈارک تھیم کی سہولت شامل ہے۔
          </p>
        </div>
      </div>
    </BaseModal>
  );
};

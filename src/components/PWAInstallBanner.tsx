import React, { useState } from 'react';
import { Download, X, Check, Share, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { OFFICIAL_APK_URL } from '../data/appConfig';
import {
  AppLanguage,
  DEFAULT_LANGUAGE,
  UI_STRINGS,
  getDir,
} from '../data/translations';

interface Props {
  isDark: boolean;
  onNotify?: (msg: string) => void;
  lang?: AppLanguage;
}

export const PWAInstallBanner: React.FC<Props> = ({
  isDark,
  onNotify,
  lang = DEFAULT_LANGUAGE,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const t = UI_STRINGS[lang];
  const dir = getDir(lang);

  if (isInstalled || isDismissed) {
    return null;
  }

  const handleAPKDownload = () => {
    if (onNotify) {
      onNotify(t.bannerApkDownloading);
    }
  };

  const handlePWAInstall = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowHelpModal(true);
    } else {
      setShowHelpModal(true);
    }
  };

  return (
    <>
      <div
        className={`w-full px-3 py-1.5 border-b text-xs font-lalezar transition-all ${
          isDark
            ? 'bg-[#072616] border-[#d4af37]/40 text-emerald-50'
            : 'bg-[#e8f1ec] border-emerald-900/15 text-[#064326]'
        }`}
        dir={dir}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={`${import.meta.env.BASE_URL}kdf-logo-v4.webp`}
              alt={t.appName}
              className="w-7 h-7 rounded-xl shadow-xs object-cover shrink-0"
            />
            <span className="truncate text-xs font-bold">
              {t.bannerInstallPrompt}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isInstallable && (
              <button
                onClick={handlePWAInstall}
                className="inline-flex px-3 py-1.5 bg-[#064326] hover:bg-[#095c34] text-white font-bold rounded-lg shadow-xs border border-[#d4af37]/70 items-center gap-1 active:scale-95 transition-all text-xs whitespace-nowrap cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>{t.bannerWebApp}</span>
              </button>
            )}

            {/* Direct Archive.org APK Download / Install Link */}
            <a
              href={OFFICIAL_APK_URL}
              download="khanqah-Darul-falah.apk"
              onClick={handleAPKDownload}
              className={`px-2.5 py-1.5 font-bold rounded-lg shadow-xs flex items-center gap-1 active:scale-95 transition-all text-xs whitespace-nowrap ${
                isInstallable
                  ? 'bg-[#d4af37] hover:bg-[#c29b29] text-[#051a0f]'
                  : 'bg-[#064326] hover:bg-[#095c34] text-white border border-[#d4af37]/60'
              }`}
            >
              <Download className={`w-3.5 h-3.5 ${isInstallable ? 'text-[#051a0f]' : 'text-[#d4af37]'}`} />
              <span>{t.bannerInstallApk}</span>
            </a>

            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-md opacity-60 hover:opacity-100 hover:bg-black/10 transition-colors cursor-pointer"
              title={t.closeBtn}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Guided Install Instructions Modal */}
      {showHelpModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          dir={dir}
        >
          <div
            className={`w-full max-w-sm rounded-2xl border-2 border-[#d4af37] shadow-2xl p-5 space-y-3.5 ${
              dir === 'ltr' ? 'text-left' : 'text-right'
            } ${
              isDark ? 'bg-[#0c2116] text-emerald-50' : 'bg-white text-[#11261b]'
            }`}
          >
            <div className="flex items-center justify-between border-b border-[#d4af37]/30 pb-2">
              <div className="flex items-center gap-2">
                <img
                  src={`${import.meta.env.BASE_URL}kdf-logo-v4.webp`}
                  alt={t.appName}
                  className="w-8 h-8 rounded-xl shadow-xs object-cover"
                />
                <h3 className="font-bold font-lalezar text-base text-[#064326] dark:text-[#d4af37]">
                  {t.bannerModalTitle}
                </h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg hover:bg-black/10 opacity-70 hover:opacity-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-600/30 flex items-start gap-2">
                <span className="font-bold text-[#064326] dark:text-[#d4af37] shrink-0">1.</span>
                <span>{t.bannerStep1Text}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-[#d4af37]/30 flex items-start gap-2">
                <span className="font-bold text-[#b08d43] shrink-0">2.</span>
                <span>
                  {t.bannerStep2Text}{' '}
                  <Share className="w-3 h-3 inline text-emerald-600 mx-0.5" />
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2 text-emerald-700 dark:text-emerald-300">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{t.bannerStep3Text}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={OFFICIAL_APK_URL}
                download="khanqah-Darul-falah.apk"
                onClick={handleAPKDownload}
                className="flex-1 py-2 bg-[#064326] hover:bg-[#095c34] text-white font-lalezar text-xs rounded-xl shadow-md text-center font-bold"
              >
                {t.bannerDownloadApkBtn}
              </a>
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-[#d4af37] text-[#051a0f] font-lalezar text-xs rounded-xl font-bold cursor-pointer"
              >
                {t.closeBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

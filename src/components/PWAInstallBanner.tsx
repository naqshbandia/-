/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Share } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface Props {
  isDark: boolean;
}

export const PWAInstallBanner: React.FC<Props> = ({ isDark }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // If already running as an installed PWA or dismissed, hide
  if (isInstalled || isDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // General Android / Chrome instruction fallback
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {/* Sleek golden install strip right below the top header */}
      <div
        className={`w-full px-3 py-1.5 border-b flex items-center justify-between text-xs font-lalezar transition-all animate-in slide-in-from-top-1 ${
          isDark
            ? 'bg-gradient-to-r from-[#2c1d12] via-[#3a2718] to-[#2c1d12] border-[#b08d43]/50 text-amber-100'
            : 'bg-gradient-to-r from-[#fef8ed] via-[#f7ebd4] to-[#fef8ed] border-[#b08d43]/40 text-[#2c1f15]'
        }`}
        dir="rtl"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={`${import.meta.env.BASE_URL}app-logo.webp`}
            alt="خانقاہ دارالفلاح لوگو"
            className="w-7 h-7 rounded-full border border-[#d4af37] shadow-xs object-cover shrink-0"
          />
          <span className="truncate text-xs font-semibold">
            خانقاہ دارالفلاح آفیشل اینڈرائڈ ایپ انسٹال کریں
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1 bg-gradient-to-r from-[#b08d43] to-[#8c6d2b] hover:from-[#c29c4c] hover:to-[#9f7d33] text-white font-bold rounded-lg shadow-sm flex items-center gap-1 active:scale-95 transition-all text-xs"
          >
            <Download className="w-3 h-3" />
            <span>انسٹال کریں</span>
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-black/10 transition-colors"
            title="بعد میں"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Guided Install Instructions Modal (for iOS or manual Chrome prompt) */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          dir="rtl"
        >
          <div
            className={`w-full max-w-sm rounded-2xl border-2 border-[#b08d43] shadow-2xl p-5 text-right space-y-3.5 ${
              isDark ? 'bg-[#22160d] text-amber-50' : 'bg-white text-[#2c1f15]'
            }`}
          >
            <div className="flex items-center justify-between border-b border-[#b08d43]/30 pb-2">
              <div className="flex items-center gap-2">
                <img
                  src={`${import.meta.env.BASE_URL}app-logo.webp`}
                  alt="خانقاہ دارالفلاح"
                  className="w-8 h-8 rounded-full border border-[#d4af37] shadow-xs object-cover"
                />
                <h3 className="font-bold font-lalezar text-base text-[#b08d43]">
                  خانقاہ دارالفلاح ایپ انسٹالیشن
                </h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-lg hover:bg-black/10 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs leading-relaxed opacity-90 font-medium">
              یہ ایپ بالکل مفت ہے اور گوگل پلے اسٹور کی فیس کے بغیر آپ کے موبائل کی ہوم اسکرین پر ایک اصلی ایپ کی طرح محفوظ ہو جاتی ہے:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-[#b08d43]/30 flex items-start gap-2">
                <span className="font-bold text-amber-500 shrink-0">1.</span>
                <span>
                  کروم براؤزر کے اوپر دائیں کونے میں موجود <strong>تین نقطوں (⋮)</strong> یا شیئر (<Share className="w-3 h-3 inline text-emerald-500" />) پر کلک کریں۔
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-[#b08d43]/30 flex items-start gap-2">
                <span className="font-bold text-amber-500 shrink-0">2.</span>
                <span>
                  لسٹ میں سے <strong>&quot;Install app&quot;</strong> یا <strong>&quot;Add to Home screen&quot; (ہوم اسکرین پر شامل کریں)</strong> پر کلک کریں۔
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2 text-emerald-600 dark:text-emerald-400">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  ایپ خودبخود خانقاہ دارالفلاح کے نام اور لوگو کے ساتھ آپ کے موبائل کے ہوم پر انسٹال ہو جائے گی!
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 bg-[#b08d43] hover:bg-[#96742e] text-white font-lalezar text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              سمجھ گیا، شکریہ
            </button>
          </div>
        </div>
      )}
    </>
  );
};

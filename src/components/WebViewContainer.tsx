import React, { useRef, useState, useEffect } from 'react';
import { WifiOff, RotateCw, ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { GOLD_LIBRARY_URL, BLOGGER_HOME_URL } from '../data/appConfig';

interface Props {
  currentUrl: string;
  onUrlChange: (newUrl: string) => void;
  onBackRequest: () => void;
  isDark: boolean;
}

export const WebViewContainer: React.FC<Props> = ({
  currentUrl,
  onUrlChange,
  onBackRequest,
  isDark,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(30);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasError, setHasError] = useState(false);
  const [historyStack, setHistoryStack] = useState<string[]>([currentUrl]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showExitToast, setShowExitToast] = useState(false);
  const lastBackPressRef = useRef<number>(0);

  // Monitor Network Connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setHasError(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setHasError(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update history when currentUrl changes externally
  useEffect(() => {
    if (historyStack[historyIndex] !== currentUrl) {
      setHistoryStack((prev) => [...prev.slice(0, historyIndex + 1), currentUrl]);
      setHistoryIndex((prev) => prev + 1);
    }
    setIsLoading(true);
    setProgress(35);
    setHasError(!navigator.onLine);

    const timer1 = setTimeout(() => setProgress(75), 350);
    const timer2 = setTimeout(() => {
      setIsLoading(false);
      setProgress(100);
    }, 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [currentUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setProgress(100);
    setHasError(false);
  };

  const handleRetry = () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      setHasError(true);
      return;
    }
    setHasError(false);
    setIsLoading(true);
    setProgress(30);
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl;
    }
  };

  const handleGoBack = () => {
    if (historyIndex > 0) {
      const prevUrl = historyStack[historyIndex - 1];
      setHistoryIndex((prev) => prev - 1);
      onUrlChange(prevUrl);
    } else {
      // At root - simulate Android double-back to exit prevention
      const now = Date.now();
      if (now - lastBackPressRef.current < 2500) {
        setShowExitToast(false);
        onBackRequest();
      } else {
        lastBackPressRef.current = now;
        setShowExitToast(true);
        setTimeout(() => setShowExitToast(false), 2200);
      }
    }
  };

  const handleGoForward = () => {
    if (historyIndex < historyStack.length - 1) {
      const nextUrl = historyStack[historyIndex + 1];
      setHistoryIndex((prev) => prev + 1);
      onUrlChange(nextUrl);
    }
  };

  const handleGoHome = () => {
    onUrlChange(GOLD_LIBRARY_URL);
  };

  // If on Blogger Dynamic Views homepage, trim the top empty search gap if needed
  const isBloggerDynamicView = currentUrl.includes('blogspot.com') && !currentUrl.includes('Gold');

  return (
    <div className="relative flex-1 w-full h-full flex flex-col bg-[#eee] overflow-hidden select-none">
      {/* Top Loading Progress Bar */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 z-30 h-1 bg-[#20150d]/30 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#b08d43] via-[#ffd700] to-[#b08d43] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Main WebView Frame */}
      {!hasError && isOnline ? (
        <div className="relative flex-1 w-full h-full bg-white overflow-hidden">
          <iframe
            ref={iframeRef}
            src={currentUrl}
            title="Khanqah Darul Falah Content"
            onLoad={handleIframeLoad}
            onError={() => setHasError(true)}
            className={`w-full border-none transition-all ${
              isBloggerDynamicView
                ? 'h-[calc(100%+115px)] -mt-[115px]'
                : 'h-full mt-0'
            }`}
            allow="autoplay; encrypted-media; fullscreen"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads allow-modals"
          />
        </div>
      ) : (
        /* Offline Error Layout */
        <div className={`flex-1 flex flex-col items-center justify-center p-6 text-center ${isDark ? 'bg-[#18110b] text-amber-100' : 'bg-[#fdfaf3] text-[#3d2e21]'}`} dir="rtl">
          <div className="w-20 h-20 rounded-full bg-amber-100/50 border-2 border-[#b08d43] flex items-center justify-center mb-4 text-[#b08d43] shadow-md animate-bounce">
            <WifiOff className="w-10 h-10" />
          </div>

          <h3 className="text-2xl font-bold font-lalezar mb-2">
            انٹرنیٹ کنکشن موجود نہیں ہے
          </h3>
          <p className="text-sm font-sans max-w-sm mb-6 leading-relaxed opacity-80">
            براہ کرم اپنا موبائل ڈیٹا یا وائی فائی کنکشن چیک کیجیے تاکہ خانقاہ دارالفلاح کی ویب سائٹ اور بیانات لوڈ ہو سکیں۔
          </p>

          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#b08d43] to-[#8c6d2b] hover:from-[#c29c4c] hover:to-[#9f7d33] text-white font-lalezar text-base rounded-xl shadow-lg transition-all active:scale-95"
          >
            <RotateCw className="w-4 h-4" />
            دوبارہ کوشش کریں (Retry)
          </button>
        </div>
      )}

      {/* Android Bottom Navigation Bar */}
      <div
        className={`border-t h-11 px-4 flex items-center justify-between shrink-0 transition-colors ${
          isDark
            ? 'bg-[#241910] border-[#b08d43]/40 text-amber-300/80'
            : 'bg-[#f5eedc] border-[#b08d43]/50 text-[#3d2e21]'
        }`}
        dir="ltr"
      >
        <button
          onClick={handleGoBack}
          className="p-1.5 rounded-lg hover:text-[#b08d43] active:scale-95 transition-all flex items-center gap-1 font-lalezar"
          title="پیچھے جائیں (Back)"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs hidden xs:inline">بیک</span>
        </button>

        <button
          onClick={handleGoHome}
          className="p-1.5 rounded-lg hover:text-[#b08d43] active:scale-95 transition-all flex items-center gap-1 font-lalezar"
          title="ہوم پیج (Home)"
        >
          <Home className="w-4 h-4" />
          <span className="text-xs hidden xs:inline">ہوم</span>
        </button>

        <button
          onClick={handleRetry}
          className="p-1.5 rounded-lg hover:text-[#b08d43] active:scale-95 transition-all"
          title="ریفریش کریں (Reload)"
        >
          <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={handleGoForward}
          disabled={historyIndex >= historyStack.length - 1}
          className="p-1.5 rounded-lg hover:text-[#b08d43] active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 font-lalezar"
          title="آگے جائیں (Forward)"
        >
          <span className="text-xs hidden xs:inline">فارورڈ</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Android Toast */}
      {showExitToast && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 bg-black/90 text-amber-200 text-sm font-lalezar px-5 py-2 rounded-full shadow-2xl border border-[#b08d43] animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
          باہر نکلنے کے لیے دوبارہ بیک دبائیں
        </div>
      )}
    </div>
  );
};

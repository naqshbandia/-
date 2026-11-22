import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BellOff,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  Save,
  RotateCcw,
  MessageCircle,
  Share2,
  Smartphone,
  FileDown,
  Image as ImageIcon,
  Play,
  Pause,
  Info,
} from 'lucide-react';
import { BaseModal } from './Modals';
import { downloadAutoSilentGuideJpg } from '../utils/autoSilentJpg';
import {
  AppLanguage,
  DEFAULT_LANGUAGE,
  getDir,
} from '../data/translations';
import {
  JamaatKey,
  JamaatScheduleItem,
  PrayerCache,
  resolveJamaatTime24,
  formatTo12Hour,
} from '../utils/prayerEngine';

export interface AutoSilentSlot {
  key: JamaatKey;
  labelUrdu: string;
  start: string;
  end: string;
  enabled: boolean;
}

const AUTO_SILENT_STORAGE_KEY = 'khanqah_auto_silent_schedule_v1';

function shiftMinutes24(time24: string, deltaMinutes: number): string {
  const [hStr, mStr] = (time24 || '12:00').split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return time24;
  let total = (h * 60 + m + deltaMinutes) % (24 * 60);
  if (total < 0) total += 24 * 60;
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function buildDefaultAutoSilentSlots(
  officialSchedule?: Record<JamaatKey, JamaatScheduleItem>,
  prayerData?: PrayerCache | null
): AutoSilentSlot[] {
  const specs: { key: JamaatKey; labelUrdu: string; fallback: string; before: number; after: number }[] = [
    { key: 'Fajr', labelUrdu: '🌅 فجر (Fajr)', fallback: '06:00', before: -10, after: 20 },
    { key: 'Dhuhr', labelUrdu: '☀️ ظہر (Dhuhr)', fallback: '13:30', before: -10, after: 20 },
    { key: 'Asr', labelUrdu: '🌤️ عصر (Asr)', fallback: '16:00', before: -10, after: 20 },
    { key: 'Maghrib', labelUrdu: '🌇 مغرب (Maghrib)', fallback: '17:20', before: -5, after: 20 },
    { key: 'Isha', labelUrdu: '🌙 عشاء (Isha)', fallback: '19:00', before: -10, after: 25 },
    { key: 'Jummah', labelUrdu: '🕌 جمعہ (Jummah)', fallback: '13:30', before: -30, after: 30 },
  ];

  return specs.map((spec) => {
    const base24 =
      officialSchedule && officialSchedule[spec.key]
        ? resolveJamaatTime24(spec.key, officialSchedule[spec.key], prayerData || null)
        : spec.fallback;
    return {
      key: spec.key,
      labelUrdu: spec.labelUrdu,
      start: shiftMinutes24(base24, spec.before),
      end: shiftMinutes24(base24, spec.after),
      enabled: true,
    };
  });
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  lang?: AppLanguage;
  officialSchedule?: Record<JamaatKey, JamaatScheduleItem>;
  prayerData?: PrayerCache | null;
  onNotify?: (msg: string) => void;
}

export const AutoSilentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  isDark = true,
  lang = DEFAULT_LANGUAGE,
  officialSchedule,
  prayerData,
  onNotify,
}) => {
  const dir = getDir(lang);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isExportingJpg, setIsExportingJpg] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const totalSlides = 4;

  // Automatic smooth slide transition (pauses when modal closes or user pauses)
  useEffect(() => {
    if (!isOpen || !isAutoPlaying) return;
    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [isOpen, isAutoPlaying]);

  const defaultSlots = useMemo(
    () => buildDefaultAutoSilentSlots(officialSchedule, prayerData),
    [officialSchedule, prayerData]
  );

  const [slots, setSlots] = useState<AutoSilentSlot[]>(() => {
    try {
      const raw = localStorage.getItem(AUTO_SILENT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Array<Partial<AutoSilentSlot> & { name?: string }>;
        if (Array.isArray(parsed) && parsed.length === 6) {
          return defaultSlots.map((def, i) => {
            const item = parsed[i] || {};
            return {
              key: (item.key as JamaatKey) || def.key,
              labelUrdu: item.labelUrdu || item.name || def.labelUrdu,
              start: item.start || def.start,
              end: item.end || def.end,
              enabled: typeof item.enabled === 'boolean' ? item.enabled : true,
            };
          });
        }
      }
    } catch {}
    return defaultSlots;
  });

  const [savedNotice, setSavedNotice] = useState(false);

  const updateSlot = (idx: number, patch: Partial<AutoSilentSlot>) => {
    setSlots((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
    setSavedNotice(false);
  };

  const handleSaveSchedule = () => {
    try {
      localStorage.setItem(AUTO_SILENT_STORAGE_KEY, JSON.stringify(slots));
    } catch {}
    setSavedNotice(true);
    if (onNotify) {
      onNotify('نمازوں کا آٹو سائلنٹ شیڈول محفوظ ہو گیا!');
    }
  };

  const handleResetToKhanqah = () => {
    const fresh = buildDefaultAutoSilentSlots(officialSchedule, prayerData);
    setSlots(fresh);
    try {
      localStorage.setItem(AUTO_SILENT_STORAGE_KEY, JSON.stringify(fresh));
    } catch {}
    setSavedNotice(true);
    if (onNotify) {
      onNotify('شیڈول خانقاہ کے اوقات کے مطابق تازہ کر دیا گیا!');
    }
  };

  const handleOpenDeviceSoundSettings = () => {
    // Best-effort Android Intent URI for DND / Sound Settings on Android WebView/Chrome
    try {
      window.location.href = 'intent:#Intent;action=android.settings.ZEN_MODE_SETTINGS;end';
      if (onNotify) {
        onNotify('موبائل کی Do Not Disturb سیٹنگ کھولی جا رہی ہے...');
      }
    } catch {
      if (onNotify) {
        onNotify('براہِ کرم موبائل Settings > Sound > Do Not Disturb خود کھول کر سیٹ کریں۔');
      }
    }
  };

  const handleDownloadHtmlGuide = async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}khanqah-auto-silent.html?_t=${Date.now()}`);
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'khanqah-auto-silent.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (onNotify) {
        onNotify('آٹو سائلنٹ HTML فائل ڈاؤنلوڈ ہو گئی!');
      }
    } catch {
      if (onNotify) {
        onNotify('HTML فائل ڈاؤنلوڈ کرنے میں دشواری پیش آئی۔');
      }
    }
  };

  const handleDownloadJpgGuide = async () => {
    setIsExportingJpg(true);
    try {
      await downloadAutoSilentGuideJpg(slots);
      if (onNotify) {
        onNotify('آٹو سائلنٹ گائیڈ JPG تصویر ڈاؤنلوڈ ہو گئی — اب گیلری یا واٹس ایپ پر دیکھ سکتے ہیں!');
      }
    } catch {
      if (onNotify) {
        onNotify('JPG تصویر بنانے میں دشواری پیش آئی۔');
      }
    } finally {
      setIsExportingJpg(false);
    }
  };

  const whatsappShareUrl = useMemo(() => {
    const lines = [
      '🔕 *نماز آٹو سائلنٹ موڈ — صدقۂ جاریہ*',
      '',
      'مسجد میں نماز کے دوران موبائل کی گھنٹی بجنے سے بچنے کے لیے اپنے موبائل کی Settings → Sound → Do Not Disturb → Schedules میں درج ذیل اوقات سیٹ کر کے محفوظ کر لیں:',
      '',
      ...slots
        .filter((s) => s.enabled)
        .map((s) => `• ${s.labelUrdu}: ${formatTo12Hour(s.start)} تا ${formatTo12Hour(s.end)}`),
      '',
      '🤲 ایک بار سیٹنگ کر لیں تو روزانہ نماز کے وقت موبائل خودکار طور پر سائلنٹ ہو جایا کرے گا۔',
    ].join('\n');
    return `https://wa.me/?text=${encodeURIComponent(lines)}`;
  }, [slots]);

  const goPrev = () => {
    setIsAutoPlaying(false);
    setCurrentSlide((s) => (s === 0 ? totalSlides - 1 : s - 1));
  };
  const goNext = () => {
    setIsAutoPlaying(false);
    setCurrentSlide((s) => (s + 1) % totalSlides);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="🔕 نماز آٹو سائلنٹ موڈ (خودکار خاموشی)"
      isDark={isDark}
      lang={lang}
      compact
    >
      <div className="space-y-2.5 text-xs" dir={dir}>
        {/* Sadaqah Jariyah Intro */}
        <div
          className={`p-2.5 rounded-xl border border-[#d4af37]/45 text-center space-y-1 ${
            isDark ? 'bg-[#081b11] text-emerald-50' : 'bg-[#f4f9f6] text-[#11261b]'
          }`}
        >
          <p className="font-bold text-[#064326] dark:text-[#d4af37] text-xs">
            مسجد میں نماز کے دوران موبائل کی گھنٹی سے مکمل نجات
          </p>
          <p className="text-[11px] opacity-90 leading-relaxed">
            صرف ایک بار نیچے دی گئی تصویری ہدایات (1 سے 4) کے مطابق اپنے موبائل میں شیڈول بنا کر محفوظ کر لیں، روزانہ نماز کے وقت موبائل خودکار طور پر سائلنٹ ہو جائے گا۔
          </p>
        </div>

        {/* Step Number Pills (1, 2, 3, 4) */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { idx: 0, label: '1️⃣ سیٹنگز' },
            { idx: 1, label: '2️⃣ شیڈول' },
            { idx: 2, label: '3️⃣ 6 نمازیں' },
            { idx: 3, label: '4️⃣ محفوظ' },
          ].map((step) => (
            <button
              key={step.idx}
              type="button"
              onClick={() => {
                setIsAutoPlaying(false);
                setCurrentSlide(step.idx);
              }}
              className={`py-1.5 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                currentSlide === step.idx
                  ? 'bg-[#d4af37] text-[#051a0f] border-white shadow-sm'
                  : isDark
                  ? 'bg-[#08180f] text-emerald-100 border-[#d4af37]/30 hover:border-[#d4af37]'
                  : 'bg-white text-[#064326] border-emerald-900/15 hover:bg-emerald-50'
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>

        {/* Swipeable / Sliding Visual Phone Screenshot Carousel */}
        <div
          className={`rounded-2xl border border-[#d4af37]/50 overflow-hidden ${
            isDark ? 'bg-[#06130c]' : 'bg-[#eef4f0]'
          }`}
          onTouchStart={(e) => {
            touchStartX.current = e.changedTouches[0].screenX;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const diff = e.changedTouches[0].screenX - touchStartX.current;
            touchStartX.current = null;
            if (diff < -40) goNext();
            else if (diff > 40) goPrev();
          }}
        >
          <div className="overflow-hidden" dir="ltr">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {/* Slide 1: Settings -> Sound -> Do Not Disturb */}
              <div className="w-full shrink-0 p-3 space-y-2.5" dir={dir}>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#064326] dark:text-[#d4af37] text-xs sm:text-sm">
                    مرحلہ 1: Do Not Disturb کھولیں
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-[#d4af37] text-[#051a0f] font-extrabold text-[10.5px]">
                    تصویر 1 / 4
                  </span>
                </div>

                <div
                  className="max-w-[280px] mx-auto rounded-2xl bg-[#0f172a] border-2 border-slate-600 p-2.5 text-slate-100 shadow-lg font-sans"
                  dir="ltr"
                >
                  <div className="w-14 h-1 bg-slate-600 rounded-full mx-auto mb-2" />
                  <div className="flex justify-between text-[9.5px] text-slate-400 border-b border-white/10 pb-1 mb-2">
                    <span>05:30 AM</span>
                    <span>⚙ Settings › Sound</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 flex justify-between items-center">
                      <span>🔊 Volume &amp; Ringtone</span>
                      <span className="opacity-50">›</span>
                    </div>
                    <div className="px-2.5 py-2 rounded-lg bg-[#064326] border border-[#d4af37] flex justify-between items-center shadow-md">
                      <div>
                        <div className="font-bold text-white">🌙 Do Not Disturb</div>
                        <div className="text-[9.5px] text-emerald-200">خاموشی اور اوقاتِ کار سیٹنگ</div>
                      </div>
                      <span className="text-[#d4af37] font-bold">👈</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 flex justify-between items-center">
                      <span>📅 Schedules / Auto Start</span>
                      <span className="opacity-50">›</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed px-2.5 py-1.5 rounded-lg border-r-3 border-[#d4af37] bg-black/5 dark:bg-white/5">
                  موبائل کی <strong>Settings</strong> میں جا کر <strong>Sound &amp; Vibration</strong> کھولیں اور <strong>Do Not Disturb</strong> (یا Samsung میں Modes &amp; Routines) پر کلک کریں۔
                </p>
              </div>

              {/* Slide 2: Add Schedule & Auto Start / Start-End */}
              <div className="w-full shrink-0 p-3 space-y-2.5" dir={dir}>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#064326] dark:text-[#d4af37] text-xs sm:text-sm">
                    مرحلہ 2: Start اور End ٹائم بنائیں
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-[#d4af37] text-[#051a0f] font-extrabold text-[10.5px]">
                    تصویر 2 / 4
                  </span>
                </div>

                <div
                  className="max-w-[280px] mx-auto rounded-2xl bg-[#0f172a] border-2 border-slate-600 p-2.5 text-slate-100 shadow-lg font-sans"
                  dir="ltr"
                >
                  <div className="w-14 h-1 bg-slate-600 rounded-full mx-auto mb-2" />
                  <div className="flex justify-between text-[9.5px] text-slate-400 border-b border-white/10 pb-1 mb-2">
                    <span>Schedules</span>
                    <span className="text-[#00ff99]">Auto Start ✓</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="px-2.5 py-1.5 rounded-lg bg-[#064326] border border-[#d4af37] flex justify-between items-center">
                      <div>
                        <div className="font-bold">🕌 Fajr Prayer (فجر)</div>
                        <div className="text-[9.5px] text-emerald-200">
                          Start: {formatTo12Hour(slots[0]?.start || '05:50')} · End: {formatTo12Hour(slots[0]?.end || '06:20')}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#00e676] text-[#051a0f] font-bold text-[9px]">ON</span>
                    </div>
                    <div className="flex justify-center gap-1 py-1">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <span
                          key={i}
                          className="w-5 h-5 rounded-full bg-[#064326] border border-[#d4af37] text-[9px] font-bold flex items-center justify-center"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                    <div className="py-1.5 rounded-lg bg-[#064326] border border-[#d4af37] text-center font-bold text-[10.5px]">
                      ✓ Save Schedule (روزانہ خودکار آن)
                    </div>
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed px-2.5 py-1.5 rounded-lg border-r-3 border-[#d4af37] bg-black/5 dark:bg-white/5">
                  <strong>+ Add Schedule</strong> دبا کر نماز کا نام لکھیں، <strong>Start Time</strong> اور <strong>End Time</strong> منتخب کر کے ہفتے کے ساتوں دن آن کریں اور <strong>Save</strong> کریں۔
                </p>
              </div>

              {/* Slide 3: All 6 Prayer Schedules Preview */}
              <div className="w-full shrink-0 p-3 space-y-2.5" dir={dir}>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#064326] dark:text-[#d4af37] text-xs sm:text-sm">
                    مرحلہ 3: پانچ نمازوں و جمعہ کے 6 شیڈول
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-[#d4af37] text-[#051a0f] font-extrabold text-[10.5px]">
                    تصویر 3 / 4
                  </span>
                </div>

                <div
                  className="max-w-[290px] mx-auto rounded-2xl bg-[#0f172a] border-2 border-slate-600 p-2 text-slate-100 shadow-lg font-sans"
                  dir="ltr"
                >
                  <div className="flex justify-between text-[9px] text-slate-400 border-b border-white/10 pb-1 mb-1.5">
                    <span>Prayer Auto-Silent List</span>
                    <span className="text-[#00ff99]">{slots.filter((s) => s.enabled).length} / 6 Active</span>
                  </div>
                  <div className="space-y-1">
                    {slots.map((s) => (
                      <div
                        key={s.key}
                        className={`px-2 py-1 rounded-lg bg-slate-800/90 flex items-center justify-between text-[10px] ${
                          s.enabled ? 'opacity-100' : 'opacity-45'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold truncate">{s.labelUrdu}</div>
                          <div className="text-[9px] text-emerald-300 tabular-nums">
                            {formatTo12Hour(s.start)} → {formatTo12Hour(s.end)}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold ${
                            s.enabled ? 'bg-[#00e676] text-[#051a0f]' : 'bg-slate-600 text-slate-200'
                          }`}
                        >
                          {s.enabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed px-2.5 py-1.5 rounded-lg border-r-3 border-[#d4af37] bg-black/5 dark:bg-white/5">
                  اسی طرح فجر، ظہر، عصر، مغرب، عشاء (روزانہ) اور جمعہ (صرف جمعہ کے دن) کے <strong>6 شیڈول</strong> بنا کر آن کر دیں۔
                </p>
              </div>

              {/* Slide 4: Calls Mute & Final Confirmation */}
              <div className="w-full shrink-0 p-3 space-y-2.5" dir={dir}>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#064326] dark:text-[#d4af37] text-xs sm:text-sm">
                    مرحلہ 4: کالز بند رکھیں اور محفوظ کریں
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-[#d4af37] text-[#051a0f] font-extrabold text-[10.5px]">
                    تصویر 4 / 4
                  </span>
                </div>

                <div
                  className="max-w-[280px] mx-auto rounded-2xl bg-[#0f172a] border-2 border-slate-600 p-2.5 text-slate-100 shadow-lg font-sans"
                  dir="ltr"
                >
                  <div className="w-14 h-1 bg-slate-600 rounded-full mx-auto mb-2" />
                  <div className="space-y-1.5 text-[11px]">
                    <div className="px-2.5 py-2 rounded-lg bg-[#064326] border border-[#d4af37] flex justify-between items-center">
                      <div>
                        <div className="font-bold">📵 Calls &amp; Messages</div>
                        <div className="text-[9.5px] text-emerald-200">Allow None (نماز میں گھنٹی بند)</div>
                      </div>
                      <Check className="w-4 h-4 text-[#00ff99]" />
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 flex justify-between items-center">
                      <div>
                        <div className="font-bold">🔔 Notifications &amp; Media</div>
                        <div className="text-[9.5px] text-slate-300">Muted automatically</div>
                      </div>
                      <Check className="w-4 h-4 text-[#00ff99]" />
                    </div>
                    <div className="py-1.5 rounded-lg bg-[#d4af37] text-[#051a0f] text-center font-extrabold text-[10.5px]">
                      ✨ سیٹنگ مکمل! اب نماز سکون سے ادا کریں
                    </div>
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed px-2.5 py-1.5 rounded-lg border-r-3 border-[#d4af37] bg-black/5 dark:bg-white/5">
                  آخر میں یقینی بنائیں کہ <strong>Calls</strong> "Allow None / Mute" پر ہو اور <strong>Repeat Caller</strong> بند ہو تاکہ عین جماعت میں بھی فون نہ بجے۔
                </p>
              </div>
            </div>
          </div>

          {/* Slider Controls with Auto-Play Toggle */}
          <div
            className={`px-3 py-2 flex items-center justify-between gap-2 border-t border-[#d4af37]/30 ${
              isDark ? 'bg-[#08180f]' : 'bg-white'
            }`}
          >
            <button
              type="button"
              onClick={goPrev}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#064326] text-white text-[11px] font-bold border border-[#d4af37]/50 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              <span>پچھلا</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAutoPlaying((p) => !p)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10.5px] font-bold cursor-pointer transition-colors ${
                isAutoPlaying
                  ? 'bg-[#d4af37] text-[#051a0f] border-[#d4af37]'
                  : isDark
                  ? 'bg-white/10 text-emerald-100 border-[#d4af37]/40'
                  : 'bg-emerald-50 text-[#064326] border-emerald-800/25'
              }`}
              title={isAutoPlaying ? 'خودکار سلائیڈ روکیں' : 'خودکار سلائیڈ چلائیں'}
            >
              {isAutoPlaying ? (
                <>
                  <Pause className="w-3 h-3" />
                  <span>خودکار ({currentSlide + 1}/{totalSlides})</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  <span>چلائیں ({currentSlide + 1}/{totalSlides})</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#064326] text-white text-[11px] font-bold border border-[#d4af37]/50 cursor-pointer"
            >
              <span>اگلا</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Editable 6-Prayer Start & End Times Table */}
        <div
          className={`p-3 rounded-2xl border border-[#d4af37]/45 space-y-2 ${
            isDark ? 'bg-[#08180f]' : 'bg-[#f8fbf9]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-[#064326] dark:text-[#d4af37] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>اپنی مسجد کا Start &amp; End شیڈول سیٹ کریں</span>
            </span>
            <button
              type="button"
              onClick={handleResetToKhanqah}
              className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#064326] dark:text-emerald-300 hover:underline cursor-pointer"
              title="خانقاہ کے اوقات پر ری سیٹ کریں"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ری سیٹ</span>
            </button>
          </div>

          <div className="space-y-1.5">
            {slots.map((slot, idx) => (
              <div
                key={slot.key}
                className={`grid grid-cols-[1.15fr_1fr_1fr_auto] items-center gap-1.5 p-1.5 rounded-xl border ${
                  isDark
                    ? 'bg-[#0d2217] border-[#d4af37]/20'
                    : 'bg-white border-emerald-900/10'
                }`}
              >
                <span className="font-bold text-[11px] truncate">{slot.labelUrdu}</span>
                <input
                  type="time"
                  value={slot.start}
                  onChange={(e) => updateSlot(idx, { start: e.target.value })}
                  className={`rounded-lg border px-1 py-1 text-[11px] text-center font-sans ${
                    isDark
                      ? 'bg-[#06130c] border-[#d4af37]/35 text-[#00ff99]'
                      : 'bg-[#f4f7f6] border-emerald-800/20 text-[#064326]'
                  }`}
                  dir="ltr"
                />
                <input
                  type="time"
                  value={slot.end}
                  onChange={(e) => updateSlot(idx, { end: e.target.value })}
                  className={`rounded-lg border px-1 py-1 text-[11px] text-center font-sans ${
                    isDark
                      ? 'bg-[#06130c] border-[#d4af37]/35 text-[#00ff99]'
                      : 'bg-[#f4f7f6] border-emerald-800/20 text-[#064326]'
                  }`}
                  dir="ltr"
                />
                <input
                  type="checkbox"
                  checked={slot.enabled}
                  onChange={(e) => updateSlot(idx, { enabled: e.target.checked })}
                  className="w-4 h-4 accent-[#064326] cursor-pointer"
                  aria-label={slot.labelUrdu}
                />
              </div>
            ))}
          </div>

          {savedNotice && (
            <div className="text-center text-[11px] font-bold text-emerald-600 dark:text-[#00ff99]">
              ✓ شیڈول محفوظ ہو گیا — تصویر نمبر 3 میں بھی اپڈیٹ ہو چکا ہے!
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleSaveSchedule}
              className="py-2 px-3 rounded-xl bg-[#064326] hover:bg-[#095c34] text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-[#d4af37]/70 shadow-sm cursor-pointer active:scale-95 transition-all"
            >
              <Save className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>شیڈول محفوظ کریں</span>
            </button>

            <button
              type="button"
              onClick={handleOpenDeviceSoundSettings}
              className="py-2 px-3 rounded-xl bg-[#d4af37] hover:bg-[#c29b29] text-[#051a0f] font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition-all"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>موبائل DND سیٹنگ کھولیں</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noreferrer"
              className="sm:col-span-2 py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#1faa4e] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>واٹس ایپ صدقۂ جاریہ شیئر</span>
              <Share2 className="w-3 h-3" />
            </a>

            <button
              type="button"
              onClick={handleDownloadJpgGuide}
              disabled={isExportingJpg}
              className="py-2 px-3 rounded-xl bg-[#0b4f2e] hover:bg-[#0e663b] text-white border border-[#d4af37]/60 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all disabled:opacity-60"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>{isExportingJpg ? 'JPG بن رہی ہے...' : 'JPG تصویر ڈاؤنلوڈ کریں'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtmlGuide}
              className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all ${
                isDark
                  ? 'bg-white/10 hover:bg-white/15 border-[#d4af37]/40 text-[#d4af37]'
                  : 'bg-white hover:bg-emerald-50 border-[#064326]/25 text-[#064326]'
              }`}
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>HTML گائیڈ ڈاؤنلوڈ کریں</span>
            </button>
          </div>

          {/* Transparent Note on Why Phone OS Requires DND Setting */}
          <div
            className={`p-2 rounded-xl border text-[10.5px] leading-relaxed flex items-start gap-1.5 ${
              isDark
                ? 'bg-emerald-950/60 border-[#d4af37]/30 text-emerald-100'
                : 'bg-amber-50 border-amber-300/60 text-[#11261b]'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-[#d4af37] shrink-0 mt-0.5" />
            <span>
              <strong>اہم وضاحت:</strong> اینڈرائیڈ سکیورٹی کی وجہ سے ویب ایپ خودکار طور پر موبائل کی گھنٹی بند نہیں کر سکتی؛ اس لیے اوپر{' '}
              <strong>موبائل DND سیٹنگ کھولیں</strong> دبا کر یا Settings → Do Not Disturb میں جا کر یہ وقت صرف ایک بار محفوظ کر لیں۔
            </span>
          </div>
        </div>

        {/* Android Brand Quick Tips */}
        <div
          className={`p-2.5 rounded-xl border text-[10.5px] leading-relaxed ${
            isDark
              ? 'bg-[#08150e] border-[#d4af37]/25 text-emerald-100/85'
              : 'bg-amber-50/70 border-[#d4af37]/35 text-[#11261b]'
          }`}
        >
          <div className="font-bold text-[#8c6514] dark:text-[#d4af37] mb-0.5 flex items-center gap-1">
            <BellOff className="w-3 h-3" />
            <span>مختلف موبائلز میں سیٹنگ کا نام:</span>
          </div>
          <div>• <b>Samsung:</b> Settings → Modes &amp; Routines / Do Not Disturb</div>
          <div>• <b>Xiaomi / Redmi / Poco:</b> Settings → Sound → Do Not Disturb → Schedule</div>
          <div>• <b>Oppo / Vivo / Infinix / Tecno:</b> Settings → Sound → Do Not Disturb → Schedules</div>
        </div>
      </div>
    </BaseModal>
  );
};

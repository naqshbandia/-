import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, X, Loader2 } from 'lucide-react';
import { BayanItem } from '../data/bayanatData';
import { downloadSingleBayan, subscribeToDownloads } from '../utils/downloadHelper';

interface Props {
  currentBayan: BayanItem | null;
  onClose: () => void;
  onNotify?: (message: string) => void;
  isDark: boolean;
}

export const AudioPlayerBar: React.FC<Props> = ({ currentBayan, onClose, onNotify, isDark }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [activeDownloadIds, setActiveDownloadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsub = subscribeToDownloads((ids) => setActiveDownloadIds(ids));
    return unsub;
  }, []);

  useEffect(() => {
    if (currentBayan && audioRef.current) {
      audioRef.current.src = currentBayan.audioUrl;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [currentBayan]);

  if (!currentBayan) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleDownload = () => {
    downloadSingleBayan(currentBayan, (msg) => {
      if (onNotify) onNotify(msg);
    });
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 border-t-2 border-[#b08d43] shadow-2xl p-2 sm:p-3 transition-colors ${
        isDark
          ? 'bg-gradient-to-t from-[#1b120a] to-[#2d1e13] text-amber-100'
          : 'bg-gradient-to-t from-[#f5eedc] to-[#fcf9f2] text-[#3d2e21]'
      }`}
      dir="rtl"
    >
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="max-w-4xl mx-auto flex flex-col gap-1.5">
        {/* Title and Controls Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Audio Info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-[#b08d43] to-[#8c6d2b] hover:from-[#c29c4c] hover:to-[#9f7d33] text-white flex items-center justify-center shadow-md shrink-0 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>

            <div className="min-w-0 flex-1">
              <h4 className="text-sm sm:text-base font-bold font-lalezar truncate leading-tight">
                {currentBayan.urduTitle || currentBayan.title}
              </h4>
              <p className="text-[11px] font-lalezar text-[#b08d43] truncate">
                {currentBayan.collectionUrdu}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 shrink-0" dir="ltr">
            <button
              onClick={toggleSpeed}
              className="px-2 py-0.5 rounded bg-[#b08d43]/20 text-[#b08d43] text-[10px] font-mono border border-[#b08d43]/40"
              title="رفتار تبدیل کریں"
            >
              {playbackRate}x
            </button>

            <button
              onClick={toggleMute}
              className="p-1.5 rounded text-amber-500 hover:text-[#b08d43]"
              title={isMuted ? 'آواز کھولیں' : 'میوٹ کریں'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Direct Memory Download Button - NO OTHER PAGE OPENED */}
            <button
              onClick={handleDownload}
              disabled={activeDownloadIds.has(currentBayan.id)}
              className={`px-2.5 py-1 text-white font-lalezar text-xs rounded-md shadow flex items-center gap-1 transition-all active:scale-95 ${
                activeDownloadIds.has(currentBayan.id)
                  ? 'bg-amber-600 cursor-wait opacity-90'
                  : 'bg-[#25D366] hover:bg-[#1faa4e]'
              }`}
              title="موبائل میموری میں خودکار ڈاؤنلوڈ کریں (بغیر کوئی اور پیج کھولے)"
            >
              {activeDownloadIds.has(currentBayan.id) ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>ڈاؤنلوڈ...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>ڈاؤنلوڈ</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded text-red-500 hover:text-red-400"
              title="پلیئر بند کریں"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Seek Bar and Timers */}
        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono" dir="ltr">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-[#b08d43]/30 rounded-lg appearance-none cursor-pointer accent-[#b08d43]"
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

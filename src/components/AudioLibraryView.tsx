import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { BayanItem } from '../data/bayanatData';
import {
  ARCHIVE_COLLECTIONS,
  ArchiveFolderSummary,
} from '../utils/archiveService';
import {
  FallbackFolderTrack,
  generateFolderWidgetHtml,
} from '../utils/folderHtmlGenerator';
import { AppLanguage, DEFAULT_LANGUAGE, getDir } from '../data/translations';

interface Props {
  onPlayAudio?: (bayan: BayanItem) => void;
  onPauseFloatingAudio?: () => void;
  onNotify?: (message: string) => void;
  onNavigateUrl?: (url: string) => void;
  onSwitchToWebView?: () => void;
  isDark: boolean;
  currentPlayingBayanId?: string | null;
  bayanatList?: BayanItem[];
  archiveFolders?: ArchiveFolderSummary[];
  initialFolderId?: string;
  lang?: AppLanguage;
}

export interface FolderInfo {
  id: string;
  title: string;
  urdu: string;
  category: string;
  count: number;
}

interface FolderHtmlFrameProps {
  folder: FolderInfo;
  isSingleFocus: boolean;
  registerIframeRef: (folderId: string, el: HTMLIFrameElement | null) => void;
  iframeHeight: number;
  fallbackTracks: FallbackFolderTrack[];
}

const FolderHtmlWidgetFrame: React.FC<FolderHtmlFrameProps> = ({
  folder,
  isSingleFocus,
  registerIframeRef,
  iframeHeight,
  fallbackTracks,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [shouldRenderFrame, setShouldRenderFrame] = useState<boolean>(isSingleFocus);

  useEffect(() => {
    if (isSingleFocus || shouldRenderFrame) return;
    const el = hostRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShouldRenderFrame(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRenderFrame(true);
          io.disconnect();
        }
      },
      { rootMargin: '500px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isSingleFocus, shouldRenderFrame]);

  const srcDocHtml = useMemo(() => {
    if (!shouldRenderFrame) return '';
    return generateFolderWidgetHtml({
      archiveId: folder.id,
      title: folder.urdu,
      itemsPerPage: isSingleFocus ? 10 : 6,
      embedId: folder.id,
      fallbackTracks,
    });
  }, [folder.id, folder.urdu, isSingleFocus, shouldRenderFrame, fallbackTracks]);

  const setRef = useCallback(
    (el: HTMLIFrameElement | null) => {
      registerIframeRef(folder.id, el);
    },
    [folder.id, registerIframeRef]
  );

  return (
    <div ref={hostRef} className="w-full">
      {shouldRenderFrame ? (
        <iframe
          ref={setRef}
          srcDoc={srcDocHtml}
          title={folder.urdu}
          scrolling="no"
          sandbox="allow-scripts allow-same-origin allow-downloads allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
          className="w-full border-0 block bg-transparent overflow-hidden transition-[height] duration-200"
          style={{ height: `${Math.max(200, iframeHeight)}px` }}
        />
      ) : (
        <div
          className="w-full rounded-[16px] border-2 border-[#d4af37] bg-[#fffdf8] dark:bg-[#0b1f14] overflow-hidden shadow-sm"
          style={{ minHeight: '220px' }}
        >
          <div className="bg-gradient-to-l from-[#004d00] via-[#007300] to-[#004d00] text-white px-4 py-2.5 border-b-[3px] border-[#d4af37] text-center text-sm font-bold">
            {folder.urdu}
          </div>
          <div className="py-12 text-center text-xs opacity-70">
            بیانات لوڈ ہو رہے ہیں...
          </div>
        </div>
      )}
    </div>
  );
};

export const AudioLibraryView: React.FC<Props> = ({
  onPauseFloatingAudio,
  bayanatList = [],
  archiveFolders,
  initialFolderId = 'all',
  lang = DEFAULT_LANGUAGE,
}) => {
  const dir = getDir(lang);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(initialFolderId);

  const iframeRefs = useRef<Map<string, HTMLIFrameElement>>(new Map());
  const [iframeHeights, setIframeHeights] = useState<Record<string, number>>({});

  useEffect(() => {
    setSelectedFolderId(initialFolderId || 'all');
  }, [initialFolderId]);

  const registerIframeRef = useCallback((folderId: string, el: HTMLIFrameElement | null) => {
    if (el) {
      iframeRefs.current.set(folderId, el);
    } else {
      iframeRefs.current.delete(folderId);
    }
  }, []);

  // Coordinate auto-resize height + cross-folder audio playback
  useEffect(() => {
    const handleMessage = (ev: MessageEvent) => {
      const data = ev.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'kdf-iframe-height' && typeof data.id === 'string') {
        const nextH = Math.ceil(Number(data.height) || 0);
        if (nextH > 40) {
          setIframeHeights((prev) => {
            if (prev[data.id] === nextH) return prev;
            return { ...prev, [data.id]: nextH };
          });
        }
      } else if (data.type === 'kdf-audio-play' && typeof data.id === 'string') {
        onPauseFloatingAudio?.();
        iframeRefs.current.forEach((frame, fid) => {
          if (fid !== data.id) {
            try {
              frame.contentWindow?.postMessage(
                { type: 'kdf-pause-all', exceptId: data.id },
                '*'
              );
            } catch {
              // Ignore
            }
          }
        });
      }
    };

    const handlePauseFromOutside = () => {
      iframeRefs.current.forEach((frame) => {
        try {
          frame.contentWindow?.postMessage({ type: 'kdf-pause-all', exceptId: '__none__' }, '*');
        } catch {
          // Ignore
        }
      });
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('kdf-pause-folder-iframes', handlePauseFromOutside);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('kdf-pause-folder-iframes', handlePauseFromOutside);
    };
  }, [onPauseFloatingAudio]);

  // Build ordered folder list merging all Archive audio collections & discovered folders
  const folderGroups = useMemo<FolderInfo[]>(() => {
    const map = new Map<string, FolderInfo>();

    for (const [id, meta] of Object.entries(ARCHIVE_COLLECTIONS)) {
      map.set(id, {
        id,
        title: meta.title,
        urdu: meta.urdu,
        category: meta.category,
        count: 0,
      });
    }

    if (Array.isArray(archiveFolders)) {
      for (const af of archiveFolders) {
        if (af.mediatype !== 'audio') continue;
        const existing = map.get(af.id);
        if (existing) {
          existing.urdu = af.urdu || existing.urdu;
          existing.count = Math.max(existing.count, af.itemCount || 0);
        } else {
          map.set(af.id, {
            id: af.id,
            title: af.title,
            urdu: af.urdu || af.title,
            category: af.category || 'Islahi',
            count: af.itemCount || 0,
          });
        }
      }
    }

    const bayanatCounts = new Map<string, number>();
    for (const b of bayanatList) {
      bayanatCounts.set(b.collectionId, (bayanatCounts.get(b.collectionId) || 0) + 1);
      if (!map.has(b.collectionId)) {
        map.set(b.collectionId, {
          id: b.collectionId,
          title: b.collectionTitle,
          urdu: b.collectionUrdu,
          category: b.category,
          count: 0,
        });
      }
    }
    bayanatCounts.forEach((cnt, cid) => {
      const entry = map.get(cid);
      if (entry) {
        entry.count = Math.max(entry.count, cnt);
      }
    });

    return Array.from(map.values());
  }, [bayanatList, archiveFolders]);

  const tracksByFolder = useMemo(() => {
    const map = new Map<string, FallbackFolderTrack[]>();
    for (const b of bayanatList) {
      const list = map.get(b.collectionId) || [];
      list.push({
        name: b.filename,
        title: b.urduTitle || b.title,
        size: b.size,
        mtime: b.mtime,
      });
      map.set(b.collectionId, list);
    }
    return map;
  }, [bayanatList]);

  const displayedFolders = useMemo(() => {
    if (selectedFolderId === 'all') return folderGroups;
    return folderGroups.filter((f) => f.id === selectedFolderId);
  }, [folderGroups, selectedFolderId]);

  return (
    <div
      className="kdf-app-canvas flex-1 w-full h-full flex flex-col overflow-y-auto select-none transition-colors duration-200 font-modern"
      dir={dir}
    >
      <div className="w-full max-w-md mx-auto px-3 py-3 space-y-5 pb-10">
        {displayedFolders.map((folder) => (
          <FolderHtmlWidgetFrame
            key={folder.id}
            folder={folder}
            isSingleFocus={displayedFolders.length === 1}
            registerIframeRef={registerIframeRef}
            iframeHeight={iframeHeights[folder.id] || 420}
            fallbackTracks={tracksByFolder.get(folder.id) || []}
          />
        ))}
      </div>
    </div>
  );
};

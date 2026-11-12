import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, BookOpen, Calendar, Play, Download, Filter, Folder, FolderDown, Check, Loader2 } from 'lucide-react';
import { BAYANAT_DATABASE, BLOG_POSTS, BayanItem, BlogPostItem } from '../data/bayanatData';
import { downloadSingleBayan, downloadFolderBayanat, subscribeToDownloads } from '../utils/downloadHelper';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateUrl: (url: string) => void;
  onPlayAudio?: (bayan: BayanItem) => void;
  onNotify?: (message: string) => void;
  isDark: boolean;
}

export type UnifiedSearchResult = 
  | { type: 'post'; data: BlogPostItem }
  | { type: 'bayan'; data: BayanItem };

export interface FolderGroup {
  id: string;
  title: string;
  urdu: string;
  category: string;
  items: BayanItem[];
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[يى]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[هھة]/g, 'ہ')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/_/g, ' ')
    .trim();
}

export const SmartSearchBar: React.FC<Props> = ({
  isOpen,
  onClose,
  onNavigateUrl,
  onPlayAudio,
  onNotify,
  isDark,
}) => {
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'folders' | 'bayanat' | 'islahi' | 'dars' | 'posts'>('all');
  const [downloadingFolderId, setDownloadingFolderId] = useState<string | null>(null);
  const [folderProgress, setFolderProgress] = useState<{ current: number; total: number; title: string } | null>(null);
  const [activeDownloadIds, setActiveDownloadIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = subscribeToDownloads((activeIds) => {
      setActiveDownloadIds(activeIds);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Compute Folders
  const foldersList = useMemo<FolderGroup[]>(() => {
    const map = new Map<string, FolderGroup>();
    for (const b of BAYANAT_DATABASE) {
      if (!map.has(b.collectionId)) {
        map.set(b.collectionId, {
          id: b.collectionId,
          title: b.collectionTitle,
          urdu: b.collectionUrdu,
          category: b.category,
          items: [],
        });
      }
      map.get(b.collectionId)!.items.push(b);
    }
    return Array.from(map.values());
  }, []);

  const searchResults = useMemo(() => {
    const q = normalizeText(query);
    if (!q) {
      if (selectedFilter === 'all') return [];
    }

    const results: UnifiedSearchResult[] = [];

    // Search Posts
    if (selectedFilter === 'all' || selectedFilter === 'posts') {
      for (const post of BLOG_POSTS) {
        const titleMatch = normalizeText(post.title).includes(q) || normalizeText(post.urduTitle).includes(q);
        const descMatch = normalizeText(post.description).includes(q);
        const catMatch = normalizeText(post.category).includes(q);
        const dateMatch = post.published.includes(q);

        if (!q || titleMatch || descMatch || catMatch || dateMatch) {
          results.push({ type: 'post', data: post });
        }
      }
    }

    // Search Bayanat
    if (selectedFilter !== 'posts' && selectedFilter !== 'folders') {
      for (const bayan of BAYANAT_DATABASE) {
        if (selectedFilter === 'islahi' && bayan.category !== 'Islahi') continue;
        if (selectedFilter === 'dars' && bayan.category !== 'Dars') continue;

        const titleMatch = normalizeText(bayan.title).includes(q);
        const collectionMatch = normalizeText(bayan.collectionUrdu).includes(q) || normalizeText(bayan.collectionTitle).includes(q);
        const filenameMatch = normalizeText(bayan.filename).includes(q);
        const dateMatch = (bayan.mtime || '').includes(q) || bayan.title.includes(q);

        if (!q || titleMatch || collectionMatch || filenameMatch || dateMatch) {
          results.push({ type: 'bayan', data: bayan });
        }
      }
    }

    return results;
  }, [query, selectedFilter]);

  if (!isOpen) return null;

  const handleSelectPost = (url: string) => {
    onNavigateUrl(url);
    onClose();
  };

  const handleSelectBayan = (bayan: BayanItem) => {
    if (onPlayAudio) {
      onPlayAudio(bayan);
    }
    onClose();
  };

  const handleDownloadSingle = async (e: React.MouseEvent, bayan: BayanItem) => {
    e.stopPropagation();
    await downloadSingleBayan(bayan, (msg) => {
      if (onNotify) onNotify(msg);
    });
  };

  const handleDownloadWholeFolder = async (e: React.MouseEvent, folder: FolderGroup) => {
    e.stopPropagation();
    if (downloadingFolderId) return;

    setDownloadingFolderId(folder.id);
    if (onNotify) {
      onNotify(`فولڈر ڈاؤنلوڈ شروع: ${folder.urdu} (${folder.items.length} بیانات)`);
    }

    await downloadFolderBayanat(
      folder.urdu,
      folder.items,
      (current, total, title) => {
        setFolderProgress({ current, total, title });
      },
      () => {
        setDownloadingFolderId(null);
        setFolderProgress(null);
        if (onNotify) {
          onNotify(`فولڈر "${folder.urdu}" کے تمام بیانات میموری میں ڈاؤنلوڈ ہو گئے!`);
        }
      }
    );
  };

  return (
    <div
      className={`absolute top-0 left-0 right-0 z-40 border-b-2 border-[#b08d43] shadow-2xl animate-in slide-in-from-top-3 duration-200 transition-colors ${
        isDark ? 'bg-[#251910] text-amber-100' : 'bg-[#fcf9f2] text-[#2c1f15]'
      }`}
      dir="rtl"
    >
      <div className="max-w-4xl mx-auto p-3">
        {/* Search Input Box */}
        <div
          className={`flex items-center gap-2 border border-[#b08d43]/60 rounded-xl px-3 py-2 shadow-inner transition-colors ${
            isDark ? 'bg-[#181009]' : 'bg-white'
          }`}
        >
          <Search className="w-5 h-5 text-[#b08d43] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بیان، عنوان، تاریخ، مقام (مثلاً: حسن خیل، اصلاحی، ذکر، دارالہدیٰ) تلاش کریں..."
            className="w-full bg-transparent border-none outline-hidden text-sm font-lalezar leading-normal placeholder-gray-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-amber-400 hover:text-white"
              title="صاف کریں"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#b08d43] hover:bg-[#8c6d2b] text-white text-xs rounded-lg font-lalezar tracking-wide shadow-sm"
          >
            بند کریں
          </button>
        </div>

        {/* Folder Download Ongoing Banner */}
        {folderProgress && (
          <div className="mt-2 p-2.5 bg-emerald-950 border border-emerald-500 rounded-xl flex items-center justify-between text-xs text-emerald-200 font-lalezar animate-pulse">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>
                فولڈر ڈاؤنلوڈ جاری ہے: {folderProgress.current} / {folderProgress.total} ({folderProgress.title})
              </span>
            </div>
            <span className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded-full text-white font-sans">
              {Math.round((folderProgress.current / folderProgress.total) * 100)}%
            </span>
          </div>
        )}

        {/* Quick Filter Badges */}
        <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 text-xs font-lalezar no-scrollbar">
          <span className="text-amber-500 text-[11px] shrink-0 flex items-center gap-1 pl-1">
            <Filter className="w-3.5 h-3.5" />
            فلٹر:
          </span>
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1 rounded-lg shrink-0 transition-all ${
              selectedFilter === 'all'
                ? 'bg-[#b08d43] text-white shadow-sm'
                : isDark
                ? 'bg-[#1e140d] text-amber-200/70 border border-[#b08d43]/30'
                : 'bg-amber-100/70 text-[#3d2e21] border border-[#b08d43]/30'
            }`}
          >
            سب مواد
          </button>

          {/* Dedicated Folders Tab */}
          <button
            onClick={() => setSelectedFilter('folders')}
            className={`px-3 py-1 rounded-lg shrink-0 transition-all flex items-center gap-1.5 ${
              selectedFilter === 'folders'
                ? 'bg-[#b08d43] text-white shadow-sm'
                : isDark
                ? 'bg-[#1e140d] text-amber-200/70 border border-[#b08d43]/30'
                : 'bg-amber-100/70 text-[#3d2e21] border border-[#b08d43]/30'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            فولڈرز ڈاؤنلوڈ ({foldersList.length})
          </button>

          <button
            onClick={() => setSelectedFilter('bayanat')}
            className={`px-3 py-1 rounded-lg shrink-0 transition-all ${
              selectedFilter === 'bayanat'
                ? 'bg-[#b08d43] text-white shadow-sm'
                : isDark
                ? 'bg-[#1e140d] text-amber-200/70 border border-[#b08d43]/30'
                : 'bg-amber-100/70 text-[#3d2e21] border border-[#b08d43]/30'
            }`}
          >
            تمام بیانات ({BAYANAT_DATABASE.length})
          </button>

          <button
            onClick={() => setSelectedFilter('islahi')}
            className={`px-3 py-1 rounded-lg shrink-0 transition-all ${
              selectedFilter === 'islahi'
                ? 'bg-[#b08d43] text-white shadow-sm'
                : isDark
                ? 'bg-[#1e140d] text-amber-200/70 border border-[#b08d43]/30'
                : 'bg-amber-100/70 text-[#3d2e21] border border-[#b08d43]/30'
            }`}
          >
            اصلاحی مجالس
          </button>

          <button
            onClick={() => setSelectedFilter('dars')}
            className={`px-3 py-1 rounded-lg shrink-0 transition-all ${
              selectedFilter === 'dars'
                ? 'bg-[#b08d43] text-white shadow-sm'
                : isDark
                ? 'bg-[#1e140d] text-amber-200/70 border border-[#b08d43]/30'
                : 'bg-amber-100/70 text-[#3d2e21] border border-[#b08d43]/30'
            }`}
          >
            دروسِ قرآن
          </button>

          <button
            onClick={() => setSelectedFilter('posts')}
            className={`px-3 py-1 rounded-lg shrink-0 transition-all ${
              selectedFilter === 'posts'
                ? 'bg-[#b08d43] text-white shadow-sm'
                : isDark
                ? 'bg-[#1e140d] text-amber-200/70 border border-[#b08d43]/30'
                : 'bg-amber-100/70 text-[#3d2e21] border border-[#b08d43]/30'
            }`}
          >
            کتب و اعلانات
          </button>
        </div>

        {/* FOLDERS VIEW (Download entire folders) */}
        {selectedFilter === 'folders' && (
          <div className="mt-2 max-h-[60vh] overflow-y-auto space-y-2">
            <div
              className={`p-2 rounded-lg text-xs font-lalezar ${
                isDark ? 'bg-[#1e140d] text-amber-300' : 'bg-amber-100/60 text-[#3d2e21]'
              }`}
            >
              کسی بھی فولڈر کے تمام بیانات ایک ساتھ موبائل میموری میں ڈاؤنلوڈ کرنے کے لیے &quot;پورا فولڈر ڈاؤنلوڈ کریں&quot; دبائیں۔
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {foldersList.map((folder) => {
                const isDownloading = downloadingFolderId === folder.id;
                return (
                  <div
                    key={folder.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                      isDark
                        ? 'bg-[#18110b] border-[#b08d43]/40 hover:border-[#b08d43]'
                        : 'bg-white border-[#b08d43]/30 shadow-sm hover:border-[#b08d43]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-300 font-sans border border-emerald-600/30">
                          {folder.items.length} بیانات
                        </span>
                        <Folder className="w-5 h-5 text-[#b08d43]" />
                      </div>
                      <h4 className="text-base font-bold font-lalezar leading-tight mb-1">
                        {folder.urdu}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-sans line-clamp-1">
                        {folder.title}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleDownloadWholeFolder(e, folder)}
                      disabled={isDownloading}
                      className="mt-3 w-full py-2 px-3 bg-gradient-to-r from-[#b08d43] to-[#8c6d2b] hover:from-[#c29c4c] hover:to-[#9f7d33] text-white font-lalezar text-xs rounded-lg shadow flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-60"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>ڈاؤنلوڈ جاری ہے...</span>
                        </>
                      ) : (
                        <>
                          <FolderDown className="w-3.5 h-3.5" />
                          <span>پورا فولڈر ڈاؤنلوڈ کریں ({folder.items.length} فائلیں)</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RESULTS OVERLAY LIST (Individual Bayanat with direct 1-click Download button) */}
        {selectedFilter !== 'folders' && (query.trim().length > 0 || selectedFilter !== 'all') && (
          <div
            className={`mt-2 max-h-[60vh] overflow-y-auto border border-[#b08d43]/40 rounded-xl divide-y divide-[#b08d43]/20 shadow-xl ${
              isDark ? 'bg-[#18110b]' : 'bg-white'
            }`}
          >
            <div
              className={`px-3 py-1.5 text-xs font-lalezar flex justify-between items-center sticky top-0 z-10 border-b border-[#b08d43]/20 ${
                isDark ? 'bg-[#20150d] text-[#d4af37]' : 'bg-amber-100/90 text-[#3d2e21]'
              }`}
            >
              <span>دستیاب نتائج: {searchResults.length}</span>
              <span className="text-[10px] font-sans opacity-70">
                براہ راست میموری میں ڈاؤنلوڈ کے لیے ڈاؤنلوڈ بٹن دبائیں
              </span>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-6 text-center text-gray-400 font-lalezar text-base">
                کوئی نتیجہ نہیں ملا۔ دوسرا لفظ یا تاریخ تلاش کیجیے۔
              </div>
            ) : (
              searchResults.map((item, idx) => {
                if (item.type === 'post') {
                  const post = item.data;
                  return (
                    <div
                      key={`post-${post.id}-${idx}`}
                      onClick={() => handleSelectPost(post.url)}
                      className={`p-3 cursor-pointer transition-colors flex items-start justify-between gap-3 group ${
                        isDark ? 'hover:bg-[#281b11]' : 'hover:bg-amber-50/80'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-amber-900/40 border border-[#b08d43]/40 text-[#d4af37] flex items-center justify-center shrink-0 mt-0.5">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base font-bold font-lalezar leading-tight group-hover:text-[#b08d43] transition-colors">
                            {post.urduTitle || post.title}
                          </h4>
                          <p className="text-xs text-gray-400 font-sans line-clamp-1 mt-0.5">
                            {post.description}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-amber-500/70 mt-1 font-sans">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {post.published}
                            </span>
                            <span className="text-[#b08d43] font-lalezar">پوسٹ کھولیں</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  const bayan = item.data;
                  return (
                    <div
                      key={`bayan-${bayan.id}-${idx}`}
                      onClick={() => handleSelectBayan(bayan)}
                      className={`p-2.5 cursor-pointer transition-colors flex items-center justify-between gap-2 group ${
                        isDark ? 'hover:bg-[#281b11]' : 'hover:bg-amber-50/80'
                      }`}
                    >
                      {/* Left side in RTL: Title & Info */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          onClick={() => handleSelectBayan(bayan)}
                          className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-600/50 text-emerald-400 flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform"
                          title="سنیں"
                        >
                          <Play className="w-3.5 h-3.5 fill-emerald-400 ml-0.5" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base font-bold font-lalezar leading-tight group-hover:text-[#b08d43] transition-colors truncate">
                            {bayan.urduTitle || bayan.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                            <span className="font-lalezar text-[#b08d43] truncate">
                              {bayan.collectionUrdu}
                            </span>
                            {bayan.length && (
                              <span className="font-sans text-[10px]">
                                {Math.floor(parseFloat(bayan.length) / 60)} منٹ
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right side in RTL: Direct 1-Click Download Button into Device Memory */}
                      <button
                        onClick={(e) => handleDownloadSingle(e, bayan)}
                        disabled={activeDownloadIds.has(bayan.id)}
                        className={`px-3 py-1.5 active:scale-95 text-white font-lalezar text-xs rounded-lg shadow-sm flex items-center gap-1.5 shrink-0 transition-all ${
                          activeDownloadIds.has(bayan.id)
                            ? 'bg-amber-600 cursor-wait opacity-90'
                            : 'bg-[#25D366] hover:bg-[#1faa4e]'
                        }`}
                        title="موبائل میموری میں خودکار ڈاؤنلوڈ کریں (بغیر کوئی اور پیج کھولے)"
                      >
                        {activeDownloadIds.has(bayan.id) ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>ڈاؤنلوڈ جاری...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>ڈاؤنلوڈ</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                }
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

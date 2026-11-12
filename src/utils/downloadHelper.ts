import { BayanItem } from '../data/bayanatData';

// Track currently active downloads by Bayan ID so buttons can show spinners
const activeDownloads = new Set<string>();
const listeners = new Set<(activeIds: Set<string>) => void>();

export function subscribeToDownloads(callback: (activeIds: Set<string>) => void) {
  listeners.add(callback);
  callback(new Set(activeDownloads));
  return () => {
    listeners.delete(callback);
  };
}

function notifyListeners() {
  const current = new Set(activeDownloads);
  listeners.forEach((cb) => cb(current));
}

export function isBayanDownloading(bayanId: string): boolean {
  return activeDownloads.has(bayanId);
}

/**
 * Sanitizes a filename for Android / iOS / Desktop storage
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Downloads a single Bayan MP3 file directly into the device's storage/memory.
 * STRICT GUARANTEE: Never navigates away, never opens another page, tab, or external player.
 */
export async function downloadSingleBayan(
  bayan: BayanItem,
  onNotify?: (message: string) => void,
  onProgress?: (percent: number) => void
): Promise<boolean> {
  const rawTitle = (bayan.urduTitle || bayan.title || 'bayan').trim();
  let filename = sanitizeFilename(bayan.filename || rawTitle);
  if (!filename.toLowerCase().endsWith('.mp3')) {
    filename += '.mp3';
  }

  // Prevent duplicate concurrent download of the same file
  if (activeDownloads.has(bayan.id)) {
    if (onNotify) {
      onNotify(`یہ بیان پہلے سے ڈاؤنلوڈ ہو رہا ہے: ${rawTitle}`);
    }
    return false;
  }

  activeDownloads.add(bayan.id);
  notifyListeners();

  if (onNotify) {
    onNotify(`ڈاؤنلوڈ شروع ہو رہا ہے: ${rawTitle}...`);
  }

  try {
    // Direct fetch of MP3 binary blob using CORS with redirect follow
    const response = await fetch(bayan.audioUrl, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        Accept: 'audio/mpeg,audio/*,*/*',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    // Read response as Blob
    const blob = await response.blob();
    const mp3Blob = new Blob([blob], { type: 'audio/mpeg' });

    // Create a local blob URL - Same-Origin guaranteed, honored by all browsers
    const blobUrl = URL.createObjectURL(mp3Blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    link.setAttribute('download', filename);

    // Append and trigger direct browser download without opening any page
    document.body.appendChild(link);
    link.click();

    // Clean up
    setTimeout(() => {
      try {
        document.body.removeChild(link);
      } catch {}
      URL.revokeObjectURL(blobUrl);
    }, 15000);

    if (onNotify) {
      onNotify(`ڈاؤنلوڈ مکمل! بیان موبائل میموری میں محفوظ ہو گیا: ${rawTitle}`);
    }

    return true;
  } catch (err) {
    console.warn('Direct blob fetch failed, using silent hidden iframe download:', err);

    // STRICT SAFETY FALLBACK: Use a completely hidden iframe so the current page NEVER changes and no new tab opens
    try {
      let hiddenFrame = document.getElementById('kh_download_silent_frame') as HTMLIFrameElement;
      if (!hiddenFrame) {
        hiddenFrame = document.createElement('iframe');
        hiddenFrame.id = 'kh_download_silent_frame';
        hiddenFrame.style.display = 'none';
        hiddenFrame.style.width = '0px';
        hiddenFrame.style.height = '0px';
        hiddenFrame.style.position = 'fixed';
        hiddenFrame.style.top = '-9999px';
        hiddenFrame.style.left = '-9999px';
        hiddenFrame.style.opacity = '0';
        hiddenFrame.style.pointerEvents = 'none';
        document.body.appendChild(hiddenFrame);
      }

      // Trigger download via hidden iframe
      hiddenFrame.src = bayan.audioUrl;

      if (onNotify) {
        onNotify(`ڈاؤنلوڈ شروع کر دیا گیا ہے: ${rawTitle}`);
      }
      return true;
    } catch (fallbackErr) {
      console.error('Silent download failed:', fallbackErr);
      if (onNotify) {
        onNotify(`ڈاؤنلوڈ میں مسئلہ پیش آیا۔ براہِ کرم انٹرنیٹ کنکشن چیک کیجیے۔`);
      }
      return false;
    }
  } finally {
    activeDownloads.delete(bayan.id);
    notifyListeners();
  }
}

/**
 * Downloads all Bayanat of a folder sequentially into device memory
 */
export async function downloadFolderBayanat(
  folderTitle: string,
  bayans: BayanItem[],
  onProgress?: (current: number, total: number, filename: string) => void,
  onComplete?: () => void
) {
  if (!bayans || bayans.length === 0) return;

  for (let i = 0; i < bayans.length; i++) {
    const bayan = bayans[i];
    const cleanTitle = bayan.urduTitle || bayan.title;
    if (onProgress) {
      onProgress(i + 1, bayans.length, cleanTitle);
    }

    await downloadSingleBayan(bayan);
    // Pause between files so the browser doesn't block parallel downloads
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  if (onComplete) {
    onComplete();
  }
}

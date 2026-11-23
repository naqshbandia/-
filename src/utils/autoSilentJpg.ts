import type { AutoSilentSlot } from '../components/AutoSilentModal';
import { formatTo12Hour } from './prayerEngine';

const A4_WIDTH = 1240;
const A4_HEIGHT = 1754;

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function renderAutoSilentPosterCanvas(
  slots: AutoSilentSlot[]
): Promise<HTMLCanvasElement> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {}
  }

  const width = A4_WIDTH;
  const height = A4_HEIGHT;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  // Crisp Paper-White / Soft Ivory Background (prints razor-sharp on A4 paper & PDF)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Subtle decorative warm cream tint in corners/inner margin
  ctx.fillStyle = '#fbfdfc';
  drawRoundedRect(ctx, 28, 28, width - 56, height - 56, 30);
  ctx.fill();

  // Outer Royal Emerald Border + Inner Gold Accent Frame
  ctx.strokeStyle = '#064326';
  ctx.lineWidth = 7;
  drawRoundedRect(ctx, 28, 28, width - 56, height - 56, 30);
  ctx.stroke();

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 42, 42, width - 84, height - 84, 22);
  ctx.stroke();

  // Top Header Box (Royal Emerald with Gold Border)
  ctx.fillStyle = '#064326';
  drawRoundedRect(ctx, 64, 62, width - 128, 178, 22);
  ctx.fill();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.direction = 'rtl';

  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 28px Tajawal, "Noto Sans Arabic", sans-serif';
  ctx.fillText('🕌 خانقاہ دارالفلاح — صدقۂ جاریہ مسجد اشتہار', width / 2, 112);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px Tajawal, "Noto Sans Arabic", sans-serif';
  ctx.fillText('نماز آٹو سائلنٹ موڈ گائیڈ', width / 2, 168);

  ctx.fillStyle = '#d1fae5';
  ctx.font = 'bold 23px Tajawal, "Noto Sans Arabic", sans-serif';
  ctx.fillText('مسجد میں نماز کے دوران موبائل کی گھنٹی سے بچنے کے لیے صرف ایک بار یہ سیٹنگ کر لیں', width / 2, 214);

  // 4 Visual Steps Cards (2x2 Grid)
  const steps = [
    {
      num: '1',
      title: 'مرحلہ 1: Do Not Disturb کھولیں',
      line1: 'موبائل کی Settings → Sound & Vibration',
      line2: 'کھول کر Do Not Disturb پر کلک کریں',
    },
    {
      num: '2',
      title: 'مرحلہ 2: Start و End ٹائم بنائیں',
      line1: 'Schedules میں + Add دبا کر نماز کا نام لکھیں،',
      line2: 'Start اور End وقت و روزانہ کے دن منتخب کریں',
    },
    {
      num: '3',
      title: 'مرحلہ 3: 5 نمازیں + جمعہ شیڈول',
      line1: 'فجر، ظہر، عصر، مغرب، عشاء (روزانہ) اور',
      line2: 'جمعہ (صرف جمعہ) کے 6 شیڈول آن کر دیں',
    },
    {
      num: '4',
      title: 'مرحلہ 4: کالز بند رکھ کر Save کریں',
      line1: 'DND میں Calls کو "Allow None / Mute" رکھیں',
      line2: 'تاکہ جماعت کے دوران کوئی گھنٹی نہ بجے',
    },
  ];

  const cardW = 542;
  const cardH = 186;
  const startX = 64;
  const gapX = 28;
  const startY = 264;
  const gapY = 20;

  steps.forEach((step, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    // Right column first for RTL reading order
    const x = col === 0 ? startX + cardW + gapX : startX;
    const y = startY + row * (cardH + gapY);

    ctx.fillStyle = '#f4f9f6';
    drawRoundedRect(ctx, x, y, cardW, cardH, 20);
    ctx.fill();
    ctx.strokeStyle = '#064326';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Gold step number badge
    ctx.fillStyle = '#064326';
    drawRoundedRect(ctx, x + cardW - 64, y + 18, 46, 46, 12);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(step.num, x + cardW - 41, y + 50);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#064326';
    ctx.font = 'bold 27px Tajawal, "Noto Sans Arabic", sans-serif';
    ctx.fillText(step.title, x + cardW - 78, y + 49);

    ctx.fillStyle = '#11261b';
    ctx.font = '600 22px Tajawal, "Noto Sans Arabic", sans-serif';
    ctx.fillText(step.line1, x + cardW - 22, y + 106);
    ctx.fillText(step.line2, x + cardW - 22, y + 144);
  });

  // 6-Prayer Start & End Table Box
  const tableY = 678;
  const tableH = 618;
  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, 64, tableY, width - 128, tableH, 22);
  ctx.fill();
  ctx.strokeStyle = '#064326';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Table Title Header Strip
  ctx.fillStyle = '#e8f3ec';
  drawRoundedRect(ctx, 76, tableY + 12, width - 152, 86, 16);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#064326';
  ctx.font = 'bold 31px Tajawal, "Noto Sans Arabic", sans-serif';
  ctx.fillText('🕰️ نمازوں کا Start اور End ٹائم شیڈول', width / 2, tableY + 52);

  ctx.fillStyle = '#855808';
  ctx.font = 'bold 21px Tajawal, "Noto Sans Arabic", sans-serif';
  ctx.fillText('اپنے موبائل کی Do Not Disturb شیڈول سیٹنگ میں یہ اوقات درج کریں', width / 2, tableY + 84);

  const rowStartY = tableY + 112;
  const rowH = 74;
  slots.forEach((slot, idx) => {
    const ry = rowStartY + idx * (rowH + 8);
    ctx.fillStyle = slot.enabled ? '#f5faf7' : '#f8fafc';
    drawRoundedRect(ctx, 88, ry, width - 176, rowH, 14);
    ctx.fill();
    ctx.strokeStyle = slot.enabled ? 'rgba(6, 67, 38, 0.35)' : 'rgba(100, 116, 139, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Right: Prayer label
    ctx.textAlign = 'right';
    ctx.fillStyle = '#064326';
    ctx.font = 'bold 28px Tajawal, "Noto Sans Arabic", sans-serif';
    ctx.fillText(slot.labelUrdu, width - 116, ry + 48);

    // Left: Start -> End 12h time
    ctx.textAlign = 'left';
    ctx.direction = 'ltr';
    ctx.fillStyle = slot.enabled ? '#043920' : '#64748b';
    ctx.font = 'bold 27px sans-serif';
    const timeText = slot.enabled
      ? `${formatTo12Hour(slot.start)}  →  ${formatTo12Hour(slot.end)}`
      : 'OFF';
    ctx.fillText(timeText, 116, ry + 48);
    ctx.direction = 'rtl';
  });

  // Important Imam Namaz Time Update Note Box (Highlighted Warm Amber/Gold)
  const noteY = 1316;
  const noteH = 162;
  ctx.fillStyle = '#fffbeb';
  drawRoundedRect(ctx, 64, noteY, width - 128, noteH, 20);
  ctx.fill();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#92400e';
  ctx.font = 'bold 28px Tajawal, "Noto Sans Arabic", sans-serif';
  ctx.fillText('📌 اہم نوٹ: مسجد کے اوقاتِ نماز کی تبدیلی کا خیال رکھیں', width / 2, noteY + 46);

  ctx.fillStyle = '#11261b';
  ctx.font = 'bold 23px Tajawal, "Noto Sans Arabic", sans-serif';
  ctx.fillText(
    'اگر آپ کی مسجد کے امام صاحب کسی نماز کی جماعت کا وقت تبدیل فرمائیں، تو آپ بھی',
    width / 2,
    noteY + 94
  );
  ctx.fillText(
    'اپنے موبائل کے شیڈول میں اس نماز کا وقت ضرور تبدیل کر لیں تاکہ ہر نماز میں موبائل بروقت خاموش رہے۔',
    width / 2,
    noteY + 132
  );

  // Footer Brand Tips & Mosque Wall Attribution
  const footerY = 1498;
  const footerH = 194;
  ctx.fillStyle = '#064326';
  drawRoundedRect(ctx, 64, footerY, width - 128, footerH, 20);
  ctx.fill();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 22px Tajawal, "Noto Sans Arabic", sans-serif';
  ctx.fillText('📱 Samsung: Modes & Routines  |  Xiaomi / Oppo / Vivo / Infinix: Sound → Do Not Disturb', width / 2, footerY + 48);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 27px Tajawal, "Noto Sans Arabic", sans-serif';
  ctx.fillText('🤲 اس اشتہار کو مسجد کے دروازے یا نوٹس بورڈ پر لگائیں اور ثوابِ جاریہ میں شریک ہوں', width / 2, footerY + 104);

  ctx.fillStyle = '#a7f3d0';
  ctx.font = 'bold 22px Tajawal, "Noto Sans Arabic", sans-serif';
  ctx.fillText('خانقاہ دارالفلاح — نزد ملک آڈہ میراخیل، بنوں', width / 2, footerY + 154);

  return canvas;
}

function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to encode JPG'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      0.95
    );
  });
}

function buildA4PdfFromJpeg(
  jpegBytes: Uint8Array,
  imgW: number,
  imgH: number
): Blob {
  const encoder = new TextEncoder();
  const pageW = 595.28;
  const pageH = 841.89;
  const contentStream = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`;
  const contentBytes = encoder.encode(contentStream);

  const chunks: BlobPart[] = [];
  let offset = 0;
  const offsets: number[] = [0];

  const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    return copy.buffer;
  };

  const pushStr = (s: string) => {
    const b = encoder.encode(s);
    chunks.push(toArrayBuffer(b));
    offset += b.length;
  };

  const pushBytes = (b: Uint8Array) => {
    chunks.push(toArrayBuffer(b));
    offset += b.length;
  };

  pushStr('%PDF-1.4\n');
  pushBytes(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  offsets[1] = offset;
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  offsets[2] = offset;
  pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  offsets[3] = offset;
  pushStr(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  offsets[4] = offset;
  pushStr(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  pushBytes(jpegBytes);
  pushStr('\nendstream\nendobj\n');

  offsets[5] = offset;
  pushStr(`5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`);
  pushBytes(contentBytes);
  pushStr('endstream\nendobj\n');

  const xrefOffset = offset;
  pushStr('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i++) {
    pushStr(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  }
  pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  return new Blob(chunks, { type: 'application/pdf' });
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function generateAutoSilentGuideJpgBlob(
  slots: AutoSilentSlot[]
): Promise<Blob> {
  const canvas = await renderAutoSilentPosterCanvas(slots);
  return canvasToJpegBlob(canvas);
}

export async function downloadAutoSilentGuideJpg(
  slots: AutoSilentSlot[]
): Promise<'downloaded'> {
  const blob = await generateAutoSilentGuideJpgBlob(slots);
  triggerDownload(blob, 'khanqah-auto-silent-guide-A4.jpg');
  return 'downloaded';
}

export async function downloadAutoSilentGuidePdf(
  slots: AutoSilentSlot[]
): Promise<'downloaded'> {
  const canvas = await renderAutoSilentPosterCanvas(slots);
  const jpgBlob = await canvasToJpegBlob(canvas);
  const jpgBuffer = await jpgBlob.arrayBuffer();
  const pdfBlob = buildA4PdfFromJpeg(
    new Uint8Array(jpgBuffer),
    canvas.width,
    canvas.height
  );
  triggerDownload(pdfBlob, 'khanqah-auto-silent-poster-A4.pdf');
  return 'downloaded';
}

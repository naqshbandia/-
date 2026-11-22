import type { AutoSilentSlot } from '../components/AutoSilentModal';
import { formatTo12Hour } from './prayerEngine';

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

export async function generateAutoSilentGuideJpgBlob(
  slots: AutoSilentSlot[]
): Promise<Blob> {
  const width = 1080;
  const height = 1520;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  // Deep Islamic Emerald Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#042616');
  bgGrad.addColorStop(0.5, '#071b10');
  bgGrad.addColorStop(1, '#03150b');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Outer Gold Border
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 8;
  drawRoundedRect(ctx, 24, 24, width - 48, height - 48, 34);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, 38, 38, width - 76, height - 76, 26);
  ctx.stroke();

  // Top Header Box
  ctx.fillStyle = '#064326';
  drawRoundedRect(ctx, 56, 58, width - 112, 170, 26);
  ctx.fill();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.direction = 'rtl';

  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 28px Tajawal, "Noto Sans Arabic", sans-serif';
  ctx.fillText('🕌 خانقاہ دارالفلاح — صدقۂ جاریہ گائیڈ', width / 2, 110);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px Tajawal, "Noto Sans Arabic", sans-serif';
  ctx.fillText('نماز آٹو سائلنٹ موڈ سیٹنگ', width / 2, 165);

  ctx.fillStyle = '#a7f3d0';
  ctx.font = 'bold 23px Tajawal, "Noto Sans Arabic", sans-serif';
  ctx.fillText('ایک بار موبائل میں سیٹ کریں — ہر نماز میں موبائل خود سائلنٹ ہوگا', width / 2, 206);

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

  const cardW = 466;
  const cardH = 178;
  const startX = 62;
  const gapX = 24;
  const startY = 256;
  const gapY = 22;

  steps.forEach((step, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    // Right column first for RTL aesthetic
    const x = col === 0 ? startX + cardW + gapX : startX;
    const y = startY + row * (cardH + gapY);

    ctx.fillStyle = '#0c2819';
    drawRoundedRect(ctx, x, y, cardW, cardH, 22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.65)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Step number badge
    ctx.fillStyle = '#d4af37';
    drawRoundedRect(ctx, x + cardW - 62, y + 18, 44, 44, 12);
    ctx.fill();

    ctx.fillStyle = '#051a0f';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(step.num, x + cardW - 40, y + 49);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 25px Tajawal, "Noto Sans Arabic", sans-serif';
    ctx.fillText(step.title, x + cardW - 76, y + 48);

    ctx.fillStyle = '#ecfdf5';
    ctx.font = '600 21px Tajawal, "Noto Sans Arabic", sans-serif';
    ctx.fillText(step.line1, x + cardW - 22, y + 102);
    ctx.fillText(step.line2, x + cardW - 22, y + 138);
  });

  // 6-Prayer Start & End Table Box
  const tableY = 665;
  ctx.fillStyle = '#0a2115';
  drawRoundedRect(ctx, 56, tableY, width - 112, 600, 26);
  ctx.fill();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 31px Tajawal, "Noto Sans Arabic", sans-serif';
  ctx.fillText('🕰️ نمازوں کا Start اور End ٹائم شیڈول', width / 2, tableY + 52);

  ctx.fillStyle = '#a7f3d0';
  ctx.font = '600 20px Tajawal, "Noto Sans Arabic", sans-serif';
  ctx.fillText('اپنے موبائل کی Do Not Disturb شیڈول سیٹنگ میں یہ اوقات درج کریں', width / 2, tableY + 88);

  const rowStartY = tableY + 116;
  const rowH = 74;
  slots.forEach((slot, idx) => {
    const ry = rowStartY + idx * (rowH + 6);
    ctx.fillStyle = slot.enabled ? '#0f3321' : '#0a1c12';
    drawRoundedRect(ctx, 84, ry, width - 168, rowH, 16);
    ctx.fill();
    ctx.strokeStyle = slot.enabled ? 'rgba(0, 255, 153, 0.45)' : 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Right: Prayer label
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px Tajawal, "Noto Sans Arabic", sans-serif';
    ctx.fillText(slot.labelUrdu, width - 110, ry + 47);

    // Left: Start -> End 12h time
    ctx.textAlign = 'left';
    ctx.direction = 'ltr';
    ctx.fillStyle = slot.enabled ? '#00ff99' : '#94a3b8';
    ctx.font = 'bold 25px sans-serif';
    const timeText = slot.enabled
      ? `${formatTo12Hour(slot.start)}  →  ${formatTo12Hour(slot.end)}`
      : 'OFF';
    ctx.fillText(timeText, 112, ry + 47);
    ctx.direction = 'rtl';
  });

  // Footer Brands & Blessing
  const footerY = 1290;
  ctx.fillStyle = '#064326';
  drawRoundedRect(ctx, 56, footerY, width - 112, 165, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 23px Tajawal, "Noto Sans Arabic", sans-serif';
  ctx.fillText('📱 Samsung: Modes & Routines | Xiaomi / Oppo / Vivo: Sound → Do Not Disturb', width / 2, footerY + 46);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 25px Tajawal, "Noto Sans Arabic", sans-serif';
  ctx.fillText('🤲 اس پیغام کو آگے شیئر کریں تاکہ نمازیوں کی نمازیں سکون سے ادا ہوں', width / 2, footerY + 95);

  ctx.fillStyle = '#a7f3d0';
  ctx.font = '600 20px Tajawal, "Noto Sans Arabic", sans-serif';
  ctx.fillText('خانقاہ دارالفلاح — نزد ملک آڈہ میراخیل، بنوں', width / 2, footerY + 135);

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
      0.94
    );
  });
}

export async function downloadAutoSilentGuideJpg(
  slots: AutoSilentSlot[]
): Promise<'shared' | 'downloaded'> {
  const blob = await generateAutoSilentGuideJpgBlob(slots);
  const fileName = 'khanqah-auto-silent-guide.jpg';
  const file = new File([blob], fileName, { type: 'image/jpeg' });

  // Always save a clean download copy in browser/WebView
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);

  // Also offer Web Share if available and user prefers? Keeping direct download reliable like HTML!
  void file;
  return 'downloaded';
}

export interface DonationReceiptPayload {
  userName: string;
  cityVillage: string;
  pledgeRelation: string;
  otherSheikhName?: string;
  phone: string;
  helpType: string;
  amount: string;
  screenshotFile?: File | null;
}

function loadLocalImageFile(file: File): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        resolve(null);
        return;
      }
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = reader.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.trim().split(/\s+/);
  if (words.length === 0) return ['—'];
  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    const test = `${current} ${words[i]}`;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

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
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function renderDonationReceiptCanvas(
  payload: DonationReceiptPayload
): Promise<HTMLCanvasElement> {
  const width = 900;
  const padX = 48;
  const contentW = width - padX * 2;

  const screenshotImg = payload.screenshotFile
    ? await loadLocalImageFile(payload.screenshotFile)
    : null;

  const bayatDisplay =
    payload.pledgeRelation === 'کسی اور سے' && payload.otherSheikhName?.trim()
      ? `کسی اور سے (${payload.otherSheikhName.trim()})`
      : payload.pledgeRelation || '—';

  const rows: { label: string; value: string }[] = [
    { label: 'نام', value: payload.userName.trim() || '—' },
    { label: 'شہر / گاؤں', value: payload.cityVillage.trim() || '—' },
    { label: 'بیعت کی نوعیت', value: bayatDisplay },
    { label: 'موبائل / واٹس ایپ', value: payload.phone.trim() || '—' },
    { label: 'تعاون کی نوعیت', value: payload.helpType || '—' },
    { label: 'رقم (روپے)', value: payload.amount.trim() ? `${payload.amount.trim()} روپے` : '—' },
  ];

  // Pre-measure wrapped lines
  const measureCanvas = document.createElement('canvas');
  const mCtx = measureCanvas.getContext('2d')!;
  mCtx.font = 'bold 24px "Tajawal", "Noto Nastaliq Urdu", Tahoma, sans-serif';
  const valueMaxW = contentW - 250;

  const rowLayouts = rows.map((row) => {
    const lines = wrapTextLines(mCtx, row.value, valueMaxW);
    const rowH = Math.max(66, 26 + lines.length * 36);
    return { ...row, lines, rowH };
  });

  const rowsTotalHeight = rowLayouts.reduce((sum, r) => sum + r.rowH + 10, 0);

  let screenshotBoxH = 0;
  let drawImgW = 0;
  let drawImgH = 0;
  if (screenshotImg) {
    const maxImgW = contentW - 40;
    const maxImgH = 420;
    const ratio = Math.min(maxImgW / screenshotImg.width, maxImgH / screenshotImg.height, 1);
    drawImgW = Math.round(screenshotImg.width * ratio);
    drawImgH = Math.round(screenshotImg.height * ratio);
    screenshotBoxH = drawImgH + 92;
  }

  const headerHeight = 190;
  const footerHeight = 96;
  const totalHeight = 36 + headerHeight + 24 + rowsTotalHeight + (screenshotBoxH ? screenshotBoxH + 20 : 0) + footerHeight + 28;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d')!;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, totalHeight);

  // Outer emerald & gold frame
  ctx.strokeStyle = '#064326';
  ctx.lineWidth = 8;
  drawRoundedRect(ctx, 16, 16, width - 32, totalHeight - 32, 24);
  ctx.stroke();

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 26, 26, width - 52, totalHeight - 52, 18);
  ctx.stroke();

  // Header Banner
  const hdrY = 44;
  ctx.fillStyle = '#064326';
  drawRoundedRect(ctx, padX, hdrY, contentW, headerHeight, 18);
  ctx.fill();

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2.5;
  drawRoundedRect(ctx, padX, hdrY, contentW, headerHeight, 18);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.direction = 'rtl';

  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 34px "Tajawal", Tahoma, sans-serif';
  ctx.fillText('خانقاہ و مدرسہ دارالفلاح', width / 2, hdrY + 58);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px "Tajawal", Tahoma, sans-serif';
  ctx.fillText('عطیات و صدقات فارم رسید', width / 2, hdrY + 106);

  const nowStr = new Date().toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  ctx.fillStyle = '#a7f3d0';
  ctx.font = '600 18px "Tajawal", Tahoma, sans-serif';
  ctx.fillText(`تاریخ و وقت: ${nowStr}`, width / 2, hdrY + 152);

  // Rows
  let curY = hdrY + headerHeight + 24;
  rowLayouts.forEach((row, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? '#f4fbf6' : '#ffffff';
    drawRoundedRect(ctx, padX, curY, contentW, row.rowH, 12);
    ctx.fill();

    ctx.strokeStyle = 'rgba(6, 67, 38, 0.22)';
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, padX, curY, contentW, row.rowH, 12);
    ctx.stroke();

    // Label on the right (RTL)
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#064326';
    ctx.font = 'bold 22px "Tajawal", Tahoma, sans-serif';
    ctx.fillText(`${row.label}:`, padX + contentW - 20, curY + 40);

    // Value on the left/center-right
    ctx.fillStyle = '#11261b';
    ctx.font = 'bold 23px "Tajawal", Tahoma, sans-serif';
    row.lines.forEach((line, lIdx) => {
      ctx.fillText(line, padX + contentW - 220, curY + 40 + lIdx * 36);
    });

    curY += row.rowH + 10;
  });

  // Attached payment screenshot preview
  if (screenshotImg && screenshotBoxH > 0) {
    curY += 6;
    ctx.fillStyle = '#f8faf9';
    drawRoundedRect(ctx, padX, curY, contentW, screenshotBoxH, 14);
    ctx.fill();

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, padX, curY, contentW, screenshotBoxH, 14);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#064326';
    ctx.font = 'bold 21px "Tajawal", Tahoma, sans-serif';
    ctx.fillText('منسلک پیمنٹ اسکرین شاٹ', width / 2, curY + 38);

    const imgX = Math.round((width - drawImgW) / 2);
    const imgY = curY + 56;
    ctx.drawImage(screenshotImg, imgX, imgY, drawImgW, drawImgH);
    curY += screenshotBoxH + 14;
  }

  // Footer box
  ctx.fillStyle = '#ebf2ee';
  drawRoundedRect(ctx, padX, curY, contentW, footerHeight - 16, 14);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#064326';
  ctx.font = 'bold 20px "Tajawal", Tahoma, sans-serif';
  ctx.fillText('نزد ملک آڈہ میراخیل، بنوں · واٹس ایپ: 03369757393', width / 2, curY + 34);
  ctx.fillStyle = '#8c6514';
  ctx.font = '600 17px "Tajawal", Tahoma, sans-serif';
  ctx.fillText('جزاک اللہ خیراً — اللہ تعالیٰ آپ کا صدقہ و تعاون قبول فرمائے', width / 2, curY + 64);

  return canvas;
}

function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('JPG conversion failed'));
      },
      'image/jpeg',
      0.92
    );
  });
}

function buildPdfFromJpeg(
  jpegBytes: Uint8Array,
  imgWidth: number,
  imgHeight: number
): Blob {
  const encoder = new TextEncoder();
  const pageW = 595; // A4 width in pt
  const pageH = 842; // A4 height in pt
  const margin = 24;
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2;
  const scale = Math.min(maxW / imgWidth, maxH / imgHeight);
  const drawW = imgWidth * scale;
  const drawH = imgHeight * scale;
  const drawX = (pageW - drawW) / 2;
  const drawY = pageH - margin - drawH;

  const contentStream = `q\n${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${drawX.toFixed(2)} ${drawY.toFixed(2)} cm\n/Im0 Do\nQ\n`;

  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let byteOffset = 0;

  const pushText = (str: string) => {
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    byteOffset += bytes.length;
  };
  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    byteOffset += bytes.length;
  };

  pushText('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  offsets[1] = byteOffset;
  pushText('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  offsets[2] = byteOffset;
  pushText('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  offsets[3] = byteOffset;
  pushText(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  offsets[4] = byteOffset;
  pushText(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  pushBytes(jpegBytes);
  pushText('\nendstream\nendobj\n');

  offsets[5] = byteOffset;
  pushText(
    `5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`
  );

  const xrefOffset = byteOffset;
  pushText('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i++) {
    pushText(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  }

  pushText(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const merged = new Uint8Array(byteOffset);
  let pos = 0;
  for (const chunk of chunks) {
    merged.set(chunk, pos);
    pos += chunk.length;
  }

  return new Blob([merged], { type: 'application/pdf' });
}

export async function exportReceiptFile(
  payload: DonationReceiptPayload,
  format: 'jpg' | 'pdf'
): Promise<File> {
  const canvas = await renderDonationReceiptCanvas(payload);
  const jpgBlob = await canvasToJpegBlob(canvas);
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === 'jpg') {
    return new File([jpgBlob], `khanqah-donation-${stamp}.jpg`, {
      type: 'image/jpeg',
    });
  }

  const jpgBytes = new Uint8Array(await jpgBlob.arrayBuffer());
  const pdfBlob = buildPdfFromJpeg(jpgBytes, canvas.width, canvas.height);
  return new File([pdfBlob], `khanqah-donation-${stamp}.pdf`, {
    type: 'application/pdf',
  });
}

export function triggerFileDownload(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function shareOrDownloadReceiptFile(
  file: File,
  title: string,
  text: string
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  try {
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title,
        text,
      });
      return 'shared';
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return 'cancelled';
    }
  }

  triggerFileDownload(file);
  return 'downloaded';
}

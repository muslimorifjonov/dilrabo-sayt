/**
 * Rasmni yuklashdan oldin brauzerda tayyorlash (iPhone uchun xavfsiz):
 *  - HEIC/HEIF → (Safari native yoki heic2any) → dekod
 *  - EXIF burilishi to‘g‘ri qo‘llanadi
 *  - canvas faqat chiqish o‘lchamida (lg ≤ 1920px, sm ≤ 720px)
 *  - WebP (0.82 / 0.78), qo‘llab-quvvatlanmasa JPEG 0.85 (oq fon bilan)
 *  - qayta kodlash EXIF/GPS ma’lumotlarini o‘chiradi
 */

export const MAX_INPUT_BYTES = 25 * 1024 * 1024;
export const LG_MAX = 1920;
export const SM_MAX = 720;

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const ACCEPTED_EXT = /\.(jpe?g|png|webp|heic|heif)$/i;
const HEIC_EXT = /\.(heic|heif)$/i;

export type ImageErrorCode = 'not-image' | 'too-large' | 'decode';

export class ImageError extends Error {
  readonly code: ImageErrorCode;
  constructor(code: ImageErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = 'ImageError';
  }
}

export interface PreparedImage {
  lg: Blob;
  sm: Blob;
  ext: 'webp' | 'jpg';
  contentType: 'image/webp' | 'image/jpeg';
  width: number;
  height: number;
}

export function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  return type === 'image/heic' || type === 'image/heif' || HEIC_EXT.test(file.name);
}

/** Fayl turini va hajmini tekshiradi. Xato bo‘lsa kodini qaytaradi. */
export function validateFile(file: File): ImageErrorCode | null {
  const type = file.type.toLowerCase();
  const typeOk = type ? ACCEPTED_TYPES.includes(type) : false;
  // Ba’zan (ayniqsa HEIC) type bo‘sh yoki 'application/octet-stream' keladi — kengaytmaga qaraymiz
  const extOk = ACCEPTED_EXT.test(file.name);
  if (!typeOk && !(extOk && (type === '' || type === 'application/octet-stream'))) {
    return 'not-image';
  }
  if (file.size > MAX_INPUT_BYTES) return 'too-large';
  return null;
}

interface Decoded {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

async function decodeWithBitmap(blob: Blob): Promise<Decoded> {
  const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  return {
    source: bitmap,
    width: bitmap.width,
    height: bitmap.height,
    release: () => bitmap.close(),
  };
}

async function decodeWithImg(blob: Blob): Promise<Decoded> {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  try {
    await img.decode();
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
  return {
    source: img,
    width: img.naturalWidth,
    height: img.naturalHeight,
    release: () => URL.revokeObjectURL(url),
  };
}

async function decode(blob: Blob): Promise<Decoded> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await decodeWithBitmap(blob);
    } catch {
      /* eski Safari — <img> zaxirasi */
    }
  }
  return decodeWithImg(blob);
}

async function heicToJpeg(file: Blob): Promise<Blob> {
  const { default: heic2any } = await import('heic2any');
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
  const blob = Array.isArray(result) ? result[0] : result;
  if (!blob) throw new ImageError('decode');
  return blob;
}

async function decodeFile(file: File): Promise<Decoded> {
  if (isHeic(file)) {
    // Safari HEIC’ni o‘zi o‘qiy oladi — avval shuni sinaymiz (tezroq, xotira tejaladi)
    try {
      return await decode(file);
    } catch {
      const jpeg = await heicToJpeg(file);
      return decode(jpeg);
    }
  }
  return decode(file);
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

let webpSupport: Promise<boolean> | null = null;

/** Brauzer canvas’dan WebP kodlay oladimi (eski Safari — yo‘q) */
export function supportsWebpEncode(): Promise<boolean> {
  webpSupport ??= (async () => {
    const c = document.createElement('canvas');
    c.width = 2;
    c.height = 2;
    const blob = await toBlob(c, 'image/webp', 0.8);
    c.width = 0;
    c.height = 0;
    return blob?.type === 'image/webp';
  })();
  return webpSupport;
}

function fitSize(width: number, height: number, max: number): { w: number; h: number } {
  const scale = Math.min(1, max / Math.max(width, height)); // kichik rasm kattalashtirilmaydi
  return { w: Math.max(1, Math.round(width * scale)), h: Math.max(1, Math.round(height * scale)) };
}

async function render(
  decoded: Decoded,
  max: number,
  webp: boolean,
  webpQuality: number,
): Promise<{ blob: Blob; type: 'image/webp' | 'image/jpeg'; w: number; h: number }> {
  const { w, h } = fitSize(decoded.width, decoded.height, max);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { alpha: webp });
  if (!ctx) throw new ImageError('decode');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const draw = (whiteBg: boolean) => {
    ctx.clearRect(0, 0, w, h);
    if (whiteBg) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(decoded.source, 0, 0, w, h);
  };

  try {
    if (webp) {
      draw(false);
      const blob = await toBlob(canvas, 'image/webp', webpQuality);
      if (blob && blob.type === 'image/webp') return { blob, type: 'image/webp', w, h };
    }
    // JPEG zaxira: shaffof joylar qora bo‘lib qolmasligi uchun oq fon
    draw(true);
    const jpeg = await toBlob(canvas, 'image/jpeg', 0.85);
    if (!jpeg) throw new ImageError('decode');
    return { blob: jpeg, type: 'image/jpeg', w, h };
  } finally {
    // iOS’da xotirani darhol bo‘shatish
    canvas.width = 0;
    canvas.height = 0;
  }
}

/** Bitta faylni tayyorlaydi: lg + sm. Fayllarni ketma-ket chaqiring (bir vaqtda bittadan). */
export async function prepareImage(file: File): Promise<PreparedImage> {
  const invalid = validateFile(file);
  if (invalid) throw new ImageError(invalid);

  let decoded: Decoded;
  try {
    decoded = await decodeFile(file);
  } catch (error) {
    if (error instanceof ImageError) throw error;
    throw new ImageError('decode', String(error));
  }

  try {
    if (!(decoded.width > 0 && decoded.height > 0)) throw new ImageError('decode');
    const webp = await supportsWebpEncode();
    let lg = await render(decoded, LG_MAX, webp, 0.82);
    let sm = await render(decoded, SM_MAX, lg.type === 'image/webp', 0.78);
    if (sm.type !== lg.type) {
      // ikkala versiya bir xil formatda bo‘lishi shart (kengaytma bitta)
      lg = await render(decoded, LG_MAX, false, 0.82);
      sm = await render(decoded, SM_MAX, false, 0.78);
    }
    return {
      lg: lg.blob,
      sm: sm.blob,
      ext: lg.type === 'image/webp' ? 'webp' : 'jpg',
      contentType: lg.type,
      width: lg.w,
      height: lg.h,
    };
  } finally {
    decoded.release();
  }
}

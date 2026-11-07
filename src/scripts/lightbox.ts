/**
 * PhotoSwipe v5 — faqat rasm bosilganda dinamik yuklanadi (ommaviy sahifa JS’i yengil qoladi).
 * Fon och (fil suyagi + blur), tugmalar --ink rangida.
 */
import type PhotoSwipeClass from 'photoswipe';
import type { ClientStrings } from './env';
import { prefersReducedMotion } from './env';

export interface LightboxItem {
  src: string;
  width: number;
  height: number;
  alt: string;
  title?: string;
  caption?: string;
  element?: HTMLElement;
}

interface PhotoSwipeModule {
  default: typeof PhotoSwipeClass;
}

let loading: Promise<PhotoSwipeModule> | null = null;

function loadPhotoSwipe() {
  // PhotoSwipe CSS global.css ichida (alohida so‘rov yo‘q)
  loading ??= import('photoswipe');
  return loading;
}

/** Hover/fokusda oldindan yuklab qo‘yish */
export function warmLightbox(): void {
  void loadPhotoSwipe().catch(() => {
    loading = null;
  });
}

export async function openLightbox(
  items: LightboxItem[],
  index: number,
  strings: ClientStrings['lightbox'],
  trigger?: HTMLElement,
): Promise<void> {
  let mod: PhotoSwipeModule;
  try {
    mod = await loadPhotoSwipe();
  } catch (error) {
    loading = null;
    console.warn('[lightbox] yuklab bo‘lmadi', error);
    const item = items[index];
    if (item) window.open(item.src, '_blank', 'noopener');
    return;
  }
  const PhotoSwipe = mod.default;
  const reduce = prefersReducedMotion();

  const pswp = new PhotoSwipe({
    dataSource: items.map((it) => ({
      src: it.src,
      width: it.width,
      height: it.height,
      alt: it.alt,
      element: it.element,
      thumbCropped: true,
      title: it.title,
      caption: it.caption,
    })),
    index,
    bgOpacity: 0.96,
    showHideAnimationType: reduce ? 'none' : 'zoom',
    showAnimationDuration: 380,
    hideAnimationDuration: 320,
    closeTitle: strings.close,
    zoomTitle: strings.zoom,
    arrowPrevTitle: strings.prev,
    arrowNextTitle: strings.next,
    padding: { top: 64, bottom: 110, left: 12, right: 12 },
    wheelToZoom: true,
    // Fokus aniq bosilgan rasmga qaytadi (Safari tugmani bosganda fokuslamaydi)
    returnFocus: false,
    imageClickAction: 'zoom-or-close',
    tapAction: 'toggle-controls',
  });

  pswp.on('uiRegister', () => {
    pswp.ui?.registerElement({
      name: 'custom-caption',
      order: 9,
      isButton: false,
      appendTo: 'root',
      html: '',
      onInit: (el) => {
        el.classList.add('pswp-caption');
        const render = () => {
          const data = pswp.currSlide?.data as { title?: string; caption?: string } | undefined;
          el.replaceChildren();
          if (data?.title) {
            const strong = document.createElement('strong');
            strong.textContent = data.title;
            el.append(strong);
          }
          if (data?.caption) {
            const span = document.createElement('span');
            span.textContent = data.caption;
            el.append(span);
          }
        };
        pswp.on('change', render);
        render();
      },
    });
  });

  pswp.on('destroy', () => trigger?.focus({ preventScroll: true }));

  pswp.init();
}

import everest from '../../assets/imgs/Everest.jpg';
import pokhara from '../../assets/imgs/Pokhara.jpg';
import kathmandu from '../../assets/imgs/Kathmandu.jpg';
import manang from '../../assets/imgs/Manang.jpg';
import lumbini from '../../assets/imgs/Lumbini .jpg';
import festival from '../../assets/imgs/Pokhare_street_festival.png';
import music from '../../assets/imgs/music.jpg';
import img1 from '../../assets/imgs/image-01.jpg';
import img2 from '../../assets/imgs/image-02.jpg';
import img3 from '../../assets/imgs/image-03.jpg';
import img4 from '../../assets/imgs/image-04.jpg';

const FALLBACKS = [img1, img2, img3, img4, everest, pokhara];

/** Bundled artwork keyed by destination / package / activity slug fragments. */
const SLUG_IMAGE: Record<string, string> = {
  pokhara,
  kathmandu,
  mustang: manang,
  chitwan: img3,
  'everest-region': everest,
  everest: everest,
  lumbini,
  annapurna: manang,
  trishuli: img2,
  paragliding: img4,
  rafting: img2,
  trekking: everest,
  cultural: festival,
  'jungle-safari': img3,
  wildlife: img3,
  camping: img1,
  music,
  festival,
};

/**
 * Turn whatever the API gives us for an image field into a usable URL:
 * absolute URLs pass through (fixing the occasional `/media/http…` double
 * prefix), `/media/...` paths get the API host prepended, and bundled
 * `assets` paths are left alone.
 */
export function resolveMediaUrl(imagePath?: string | null): string {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) {
    const mediaHttp = imagePath.indexOf('/media/http');
    if (mediaHttp !== -1) return decodeURIComponent(imagePath.substring(mediaHttp + 7));
    return imagePath;
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/';
  const mediaBase = apiBase.replace(/\/api\/?$/, '');
  if (imagePath.startsWith('/media/')) return `${mediaBase}${imagePath}`;
  if (imagePath.includes('event_images/') || imagePath.includes('_gallery/')) {
    return `${mediaBase}/media/${imagePath}`;
  }
  if (imagePath.startsWith('/assets/imgs')) return `/src${imagePath}`;
  return imagePath;
}

/** Deterministic bundled fallback for a slug / title when the API has no image. */
export function fallbackImage(seed?: string | null): string {
  if (!seed) return FALLBACKS[0];
  const key = seed.toLowerCase();
  for (const [frag, url] of Object.entries(SLUG_IMAGE)) {
    if (key.includes(frag)) return url;
  }
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return FALLBACKS[Math.abs(hash) % FALLBACKS.length];
}

/** The URL to actually render: the API image if present, else a bundled one. */
export function imageOrFallback(
  imagePath: string | null | undefined,
  seed?: string | null
): string {
  return resolveMediaUrl(imagePath) || fallbackImage(seed);
}

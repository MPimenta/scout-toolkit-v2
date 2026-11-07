import type { MetadataRoute } from 'next';

/**
 * Web app manifest (openspec: mobile-pwa). Manifest colours must be literals, so
 * they are mirrored here from the tokens in `src/app/globals.css`;
 * tests/unit/pwa/manifest.test.ts fails if they drift.
 */
export const PWA_THEME_COLOR = '#154697'; // --primary (light)
export const PWA_BACKGROUND_COLOR = '#ffffff'; // --background (light)
export const PWA_DARK_THEME_COLOR = '#0a1b24'; // --background (dark)

export function buildManifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Kit de Atividades',
    // Provisional: awaiting copy approval (design.md, open questions).
    short_name: 'Kit Atividades',
    description: 'Uma plataforma para Dirigentes escotistas navegarem atividades e criarem programas',
    start_url: '/home?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'pt',
    theme_color: PWA_THEME_COLOR,
    background_color: PWA_BACKGROUND_COLOR,
    icons: [
      { src: '/brand/pwa/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/pwa/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/brand/pwa/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Atividades', url: '/activities?source=pwa' },
      { name: 'Programas', url: '/programs?source=pwa' },
    ],
  };
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Playwright runs its own dev servers with a separate build dir so they never
  // clash with a developer's `npm run dev` (see playwright.config.ts).
  distDir: process.env['NEXT_DIST_DIR'] || '.next',
  images: {
    domains: ['uploadthing.com', 'lh3.googleusercontent.com', 'cdn.orgo.space', 'eaep.escoteiros.pt'],
  },
  // experimental: {
  //   optimizeCss: true,
  // },
};

export default nextConfig;

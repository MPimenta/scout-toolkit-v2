/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server for the container image (Azure App Service).
  output: 'standalone',
  // Playwright runs its own dev servers with a separate build dir so they never
  // clash with a developer's `npm run dev` (see playwright.config.ts).
  distDir: process.env['NEXT_DIST_DIR'] || '.next',
  images: {
    domains: ['lh3.googleusercontent.com', 'cdn.orgo.space', 'eaep.escoteiros.pt'],
  },
  // experimental: {
  //   optimizeCss: true,
  // },
};

export default nextConfig;

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors - Escoteiros de Portugal
        primary: {
          DEFAULT: '#7cb342', // Pantone 383 C - Vibrant yellow-green
          foreground: '#0a0a0a',
        },
        secondary: {
          DEFAULT: '#1a365d', // Pantone 280 C - Deep dark blue
          foreground: '#f8fafc',
        },
        accent: '#7cb342', // Same as primary
        'accent-dark': '#1a365d', // Same as secondary
      },
      fontFamily: {
        'atkinson': ['Atkinson', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

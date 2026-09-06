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
          DEFAULT: '#00A5A5', // Pantone 7716 C
          foreground: '#0a0a0a',
        },
        secondary: {
          DEFAULT: '#154697', // Pantone 2945 C
          foreground: '#f8fafc',
        },
        accent: '#00A5A5',
        'accent-dark': '#154697',
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

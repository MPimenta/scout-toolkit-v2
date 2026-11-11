/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "var(--gutter)",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Brand variants (see docs/design-system.md)
        "blue-dark": "hsl(var(--blue-dark))",
        "blue-tint": "hsl(var(--blue-tint))",
        "teal-dark": "hsl(var(--teal-dark))",
        "teal-light": "hsl(var(--teal-light))",
        "teal-tint": "hsl(var(--teal-tint))",
        "near-black": "hsl(var(--near-black))",
        // Division colours: identify divisions only (DivisionPill)
        division: {
          "cub-scouts": {
            DEFAULT: "hsl(var(--division-cub-scouts))",
            foreground: "hsl(var(--division-cub-scouts-foreground))",
          },
          scouts: {
            DEFAULT: "hsl(var(--division-scouts))",
            foreground: "hsl(var(--division-scouts-foreground))",
          },
          adventurers: {
            DEFAULT: "hsl(var(--division-adventurers))",
            foreground: "hsl(var(--division-adventurers-foreground))",
          },
          rovers: {
            DEFAULT: "hsl(var(--division-rovers))",
            foreground: "hsl(var(--division-rovers-foreground))",
          },
          leaders: {
            DEFAULT: "hsl(var(--division-leaders))",
            foreground: "hsl(var(--division-leaders-foreground))",
            border: "hsl(var(--division-leaders-border))",
          },
          outline: "var(--division-outline)",
        },
      },
      // One 4 px radius for controls, cards, chips and callouts; panels only for heroes.
      borderRadius: {
        lg: "var(--radius)",
        md: "var(--radius)",
        sm: "var(--radius)",
        panel: "var(--radius-panel)",
      },
      boxShadow: {
        "card-hover": "var(--shadow-card-hover)",
        menu: "var(--shadow-menu)",
        callout: "var(--shadow-callout)",
      },
      // Scale: 0.75, 0.875, 1, 1.25 rem, then two fluid display sizes.
      fontSize: {
        display: ["clamp(1.5rem, 4vw, 2rem)", { lineHeight: "1.15" }],
        hero: ["clamp(2.1rem, 6vw, 3rem)", { lineHeight: "1.1" }],
      },
      transitionDuration: {
        DEFAULT: "180ms",
        ui: "var(--duration-ui)",
      },
      backgroundImage: {
        // The two sanctioned gradients (Brand Book p. 41); palette colours only.
        "gradient-brand": "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))",
        "gradient-brand-vertical":
          "linear-gradient(180deg, hsl(var(--accent)), hsl(var(--blue-dark)))",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
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
        success: {
          DEFAULT: "hsl(var(--success))",
          soft: "hsl(var(--success-soft))",
          "soft-foreground": "hsl(var(--success-soft-foreground))",
          foreground: "hsl(var(--success-soft-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          soft: "hsl(var(--warning-soft))",
          "soft-foreground": "hsl(var(--warning-soft-foreground))",
          foreground: "hsl(var(--warning-soft-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          soft: "hsl(var(--info-soft))",
          "soft-foreground": "hsl(var(--info-soft-foreground))",
          foreground: "hsl(var(--info-soft-foreground))",
        },
        // GC Pallet brand palette — semantic tokens that flip on dark mode
        gcpallet: {
          primary: {
            DEFAULT: "hsl(var(--gcpallet-primary))",
            foreground: "hsl(var(--gcpallet-primary-foreground))",
          },
          accent: {
            DEFAULT: "hsl(var(--gcpallet-accent))",
            foreground: "hsl(var(--gcpallet-accent-foreground))",
          },
          secondary: {
            DEFAULT: "hsl(var(--gcpallet-secondary))",
            foreground: "hsl(var(--gcpallet-secondary-foreground))",
          },
          muted: {
            DEFAULT: "hsl(var(--gcpallet-muted))",
            foreground: "hsl(var(--gcpallet-muted-foreground))",
          },
          card: {
            DEFAULT: "hsl(var(--gcpallet-card))",
            foreground: "hsl(var(--gcpallet-card-foreground))",
          },
          "info-soft": {
            DEFAULT: "hsl(var(--gcpallet-info-soft))",
            foreground: "hsl(var(--gcpallet-info-soft-foreground))",
          },
        },
      },
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 1px 0 rgb(0 0 0 / 0.03)",
        lg: "0 8px 24px -8px rgb(0 0 0 / 0.10), 0 2px 6px 0 rgb(0 0 0 / 0.04)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        display: ["2.25rem", { lineHeight: "2.5rem", fontWeight: "700" }],
        h1: ["1.875rem", { lineHeight: "2.25rem", fontWeight: "700" }],
        h2: ["1.5rem", { lineHeight: "2rem", fontWeight: "600" }],
        h3: ["1.25rem", { lineHeight: "1.75rem", fontWeight: "600" }],
        body: ["0.9375rem", { lineHeight: "1.5rem", fontWeight: "400" }],
        "body-strong": ["0.9375rem", { lineHeight: "1.5rem", fontWeight: "600" }],
        label: ["0.6875rem", { lineHeight: "1rem", fontWeight: "600" }],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-from-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in-from-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "slide-in-from-left": "slide-in-from-left 240ms cubic-bezier(0.4,0,0.2,1)",
        "slide-in-from-right": "slide-in-from-right 240ms cubic-bezier(0.4,0,0.2,1)",
      },
    },
  },
  plugins: [],
};

export default config;
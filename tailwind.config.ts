import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
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
        forgeia: {
          primary: "hsl(var(--forgeia-primary))",
          primary600: "hsl(var(--forgeia-primary-600))",
          primary400: "hsl(var(--forgeia-primary-400))",
          accent: "hsl(var(--forgeia-accent))",
          accent600: "hsl(var(--forgeia-accent-600))",
          cyan: "hsl(var(--forgeia-cyan))",
          graphite: "hsl(var(--forgeia-graphite))",
          ink: "hsl(var(--forgeia-ink))",
          surface: "hsl(var(--forgeia-surface))",
          elevated: "hsl(var(--forgeia-elevated))",
          border: "hsl(var(--forgeia-border))",
          text: "hsl(var(--forgeia-text))",
          muted: "hsl(var(--forgeia-muted))",
          success: "hsl(var(--forgeia-success))",
          warning: "hsl(var(--forgeia-warning))",
          danger: "hsl(var(--forgeia-danger))",
        },
      },
      boxShadow: {
        card: "0 8px 24px rgba(0,0,0,0.25)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

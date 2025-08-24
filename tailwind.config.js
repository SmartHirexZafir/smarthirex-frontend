/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      // wider max widths to avoid huge empty margins on large monitors
      screens: { "2xl": "1600px", "3xl": "1800px", "4xl": "1920px" },
    },
    extend: {
      // extra breakpoints for ultra-wide layouts
      screens: { "3xl": "1800px", "4xl": "1920px" },

      // Typography families wired to CSS variables set by next/font (see layout.tsx)
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "ui-sans-serif", "system-ui"],
        display: [
          "var(--font-orbitron)",
          "var(--font-space-grotesk)",
          "ui-sans-serif",
        ],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular"],
      },

      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
      },

      backgroundImage: {
        "luxe-aurora":
          "linear-gradient(135deg, hsl(var(--g1)) 0%, hsl(var(--g2)) 50%, hsl(var(--g3)) 100%)",
        "luxe-radial":
          "radial-gradient(120% 85% at 20% -10%, hsl(var(--g1)/0.7) 0%, transparent 65%), radial-gradient(100% 70% at 100% 0%, hsl(var(--g2)/0.6) 0%, transparent 55%), radial-gradient(100% 80% at 80% 120%, hsl(var(--g3)/0.55) 0%, transparent 60%)",
        "luxe-conic":
          "conic-gradient(from 180deg at 50% 50%, hsl(var(--g1)), hsl(var(--g2)), hsl(var(--g3)), hsl(var(--g1)))",
      },

      boxShadow: {
        soft: "0 8px 30px rgba(0,0,0,0.28)",
        lux: "0 1px 0 rgba(255,255,255,0.08) inset, 0 20px 50px rgba(0,0,0,0.55)",
        glow:
          "0 0 0 1px rgba(255,255,255,0.05), 0 0 24px hsl(var(--primary) / 0.55)",
        // cooler neon (no magenta): uses primary + secondary
        neon:
          "0 0 12px hsl(var(--primary)/0.7), 0 0 28px hsl(var(--secondary)/0.55)",
        "elev-1":
          "0 2px 8px rgba(0,0,0,0.45), 0 1px 1px rgba(255,255,255,0.04) inset",
        "elev-2": "0 14px 40px rgba(0,0,0,0.55)",
        "inner-highlight": "inset 0 1px 0 rgba(255,255,255,0.08)",
      },

      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
        full: "9999px",
      },

      transitionTimingFunction: {
        lux: "cubic-bezier(.21,.86,.24,.99)", // smooth, premium
      },

      keyframes: {
        "subtle-float": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "pulse-neon": {
          "0%,100%": { filter: "drop-shadow(0 0 0 hsl(var(--primary)/0))" },
          "50%": { filter: "drop-shadow(0 0 18px hsl(var(--primary)/0.7))" },
        },
        "aurora-shift": {
          "0%": { transform: "translate3d(0,0,0) rotate(0deg)" },
          "50%": { transform: "translate3d(2%, -2%, 0) rotate(2deg)" },
          "100%": { transform: "translate3d(0,0,0) rotate(0deg)" },
        },
        "fade-in": { from: { opacity: 0 }, to: { opacity: 1 } },
        "blur-in": {
          from: { filter: "blur(12px)", opacity: 0.2 },
          to: { filter: "blur(0)", opacity: 1 },
        },
        "rise-in": {
          from: { transform: "translateY(16px)", opacity: 0 },
          to: { transform: "translateY(0)", opacity: 1 },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },

      animation: {
        "subtle-float": "subtle-float 6s ease-in-out infinite",
        "pulse-neon": "pulse-neon 4s ease-in-out infinite",
        "aurora-slow": "aurora-shift 24s ease-in-out infinite",
        "fade-in": "fade-in .5s ease-out both",
        "blur-in": "blur-in .6s ease-out both",
        "rise-in": "rise-in .6s lux both",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    // Optionally add `tailwindcss-animate` if you have it installed.
  ],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Light/Dark is driven globally by toggling the `light` class on <html>
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx,js,jsx,mdx}",
    "./components/**/*.{ts,tsx,js,jsx,mdx}",
    "./pages/**/*.{ts,tsx,js,jsx,mdx}",
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: { "2xl": "1440px", "3xl": "1680px", "4xl": "1920px" },
    },
    extend: {
      // Responsive breakpoints used project-wide
      screens: { sm: "480px", xl: "1280px", "3xl": "1680px", "4xl": "1920px" },

      /* Global fonts map to CSS variables set in globals.css */
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-inter)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-ibm-plex-mono)", "ui-monospace", "SFMono-Regular"],
      },

      /* Color tokens pull from CSS variables (Neon Eclipse) */
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        success: { DEFAULT: "hsl(var(--success))", foreground: "hsl(var(--success-foreground))" },
        warning: { DEFAULT: "hsl(var(--warning))", foreground: "hsl(var(--warning-foreground))" },
        info: { DEFAULT: "hsl(var(--info))", foreground: "hsl(var(--info-foreground))" },
      },

      /* Radii that match the global CSS variables */
      borderRadius: { lg: "0.9rem", xl: "1.25rem", "2xl": "1.75rem", "3xl": "2.25rem" },

      /* Shadows used by global primitives (card, modal, etc.) */
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.25)",
        lux: "0 1px 0 rgba(255,255,255,0.06) inset, 0 24px 60px rgba(0,0,0,0.05)",
        glow: "0 0 0 1px rgba(255,255,255,0.05), 0 0 24px hsl(var(--primary)/.5)",
        "elev-1": "0 2px 10px rgba(0,0,0,0.35)",
        "elev-2": "0 18px 50px rgba(0,0,0,0.55)",
      },

      /* Custom easing functions for unified transitions */
      transitionTimingFunction: {
        lux: "cubic-bezier(.21,.86,.24,.99)",
        spring: "cubic-bezier(.16,1,.3,1)",
      },

      /* Keyframes used in globals.css (keep names in sync) */
      keyframes: {
        "subtle-float": { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-4px)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        "fade-in": { from: { opacity: 0 }, to: { opacity: 1 } },
        "rise-in": { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
      animation: {
        "subtle-float": "subtle-float 6s ease-in-out infinite",
        shimmer: "shimmer 1.8s linear infinite",
        "fade-in": "fade-in .5s ease-out both",
        "rise-in": "rise-in .6s lux both",
      },

      /* Backgrounds used by the global aurora + grid utilities */
      backgroundImage: {
        // New global aurora for the **Neon Eclipse** theme
        "neon-eclipse":
          "radial-gradient(1200px 800px at 15% -10%, hsl(var(--g1)/.16), transparent 60%), radial-gradient(1000px 700px at 110% -10%, hsl(var(--g2)/.14), transparent 55%), radial-gradient(1000px 900px at 85% 110%, hsl(var(--g3)/.12), transparent 60%)",

        // Alias for backward compatibility (old class names)
        "luxe-aurora":
          "radial-gradient(1200px 800px at 15% -10%, hsl(var(--g1)/.12), transparent 60%), radial-gradient(1000px 700px at 110% -10%, hsl(var(--g2)/.10), transparent 55%), radial-gradient(1000px 900px at 85% 110%, hsl(var(--g3)/.10), transparent 60%)",

        // Subtle grid used by filters/history panels
        "neon-grid":
          "linear-gradient(to right, hsl(var(--grid)/.18) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--grid)/.18) 1px, transparent 1px)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};

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
      padding: "1rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
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
      backgroundImage: {
        "luxe-aurora": "linear-gradient(135deg, hsl(var(--g1)) 0%, hsl(var(--g2)) 55%, hsl(var(--g3)) 100%)",
        "luxe-radial":
          "radial-gradient(120% 85% at 20% -10%, hsl(var(--g1)) 0%, transparent 60%), radial-gradient(100% 70% at 100% 0%, hsl(var(--g2)) 0%, transparent 55%), radial-gradient(100% 80% at 80% 120%, hsl(var(--g3)) 0%, transparent 60%)",
      },
      boxShadow: {
        soft: "0 8px 30px rgba(0,0,0,0.18)",
        glow: "0 0 0 8px hsl(var(--primary) / 0.15)",
        "elev-1": "0 1px 2px rgba(0,0,0,0.3), 0 1px 1px rgba(0,0,0,0.2)",
        "elev-2": "0 8px 24px rgba(0,0,0,0.35)",
      },
      borderRadius: { "2xl": "1rem", "3xl": "1.5rem" },
      keyframes: {
        "subtle-float": { "0%,100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-2px)" } },
      },
      animation: {
        "subtle-float": "subtle-float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};

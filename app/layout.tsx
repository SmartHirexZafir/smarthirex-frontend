import type { Metadata, Viewport } from "next";
import { Orbitron, Space_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";

/* --- Premium Futuristic Fonts --- */
const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SmartHirex — Nebula Luxe Pro",
  description:
    "Ultra-modern AI recruitment platform with a world-class Nebula Luxe Pro UI: glossy glassmorphism, neon glows, and luxury motion.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#050810" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css"
          rel="stylesheet"
        />
      </head>
      <body
        className={`page-shell antialiased bg-background text-foreground
          ${orbitron.variable} ${spaceGrotesk.variable} ${geistMono.variable}
          min-h-screen flex flex-col`}
      >
        {/* Ambient background (soft, non-repetitive cool gradient + texture) */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06] gradient-ink" />
          <div className="absolute inset-0 noise-overlay" />
        </div>

        {/* Skip link for accessibility */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-full focus:bg-black/70 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>

        {/* Premium Glass Nav — full width, more prominent, centered links */}
        <nav className="nav full-bleed">
          <div className="container max-w-[1600px] py-5 md:py-6">
            <div className="grid grid-cols-2 md:grid-cols-3 items-center gap-4">
              {/* Left: Brand */}
              <div className="flex items-center gap-3">
                <span className="text-2xl md:text-[28px] font-extrabold gradient-text glow leading-none">
                  SmartHirex
                </span>
              </div>

              {/* Center: Links (equal spacing) */}
              <div className="hidden md:flex items-center justify-center gap-8">
                <a className="nav-item" href="/features">Features</a>
                <a className="nav-item" href="/pricing">Pricing</a>
              </div>

              {/* Right: CTA */}
              <div className="flex items-center justify-end">
                <a className="btn btn-primary" href="/signup">
                  <i className="ri-rocket-2-line" />
                  Get Started
                </a>
              </div>

              {/* Mobile menu button (kept on small screens) */}
              <button className="md:hidden icon-btn justify-self-end" aria-label="Open Menu">
                <i className="ri-menu-5-line" />
              </button>
            </div>
          </div>
        </nav>

        {/* Main — no container here, so sections aren’t “mid-restricted”.
            Each section can decide: use its own container OR add `full-bleed` for edge-to-edge. */}
        <main id="main" className="flex-1 w-full">
          {children}
        </main>

        {/* Footer (minimal & luxe) */}
        <footer className="w-full">
          <div className="container max-w-[1600px] px-4 sm:px-6 lg:px-8 py-10 text-sm text-[hsl(var(--muted-foreground))]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p>© {new Date().getFullYear()} SmartHirex. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <a className="nav-item" href="/privacy">Privacy</a>
                <a className="nav-item" href="/terms">Terms</a>
                <a className="nav-item" href="/contact">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

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
          font-sans
          ${orbitron.variable} ${spaceGrotesk.variable} ${geistMono.variable}`}
      >
        {/* Ambient background layers: aurora + noise + subtle conic sheen */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-luxe-radial animate-aurora-slow" />
          <div className="absolute inset-0 opacity-[0.07] bg-luxe-conic" />
          <div className="absolute inset-0 noise-overlay" />
        </div>

        {/* Skip link for accessibility */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-full focus:bg-black/70 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>

        {/* Premium Glass Nav */}
        <nav className="nav">
          <div className="container flex items-center justify-between py-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-extrabold gradient-text glow">SmartHirex</span>
              <span className="hidden md:inline-block rounded-full px-3 py-1 text-[12px] bg-[hsl(var(--muted)/0.6)] gradient-border">
                Nebula Luxe Pro
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a className="nav-item" href="/features">Features</a>
              <a className="nav-item" href="/pricing">Pricing</a>
              <a className="btn btn-primary" href="/login">
                <i className="ri-rocket-2-line" />
                Get Started
              </a>
            </div>
            <button className="md:hidden icon-btn" aria-label="Open Menu">
              <i className="ri-menu-5-line" />
            </button>
          </div>
        </nav>

        {/* Main */}
        <main id="main" className="container py-10 md:py-12">
          {children}
        </main>

        {/* Footer (minimal & luxe) */}
        <footer className="container py-10 text-sm text-[hsl(var(--muted-foreground))]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} SmartHirex. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a className="nav-item" href="/privacy">Privacy</a>
              <a className="nav-item" href="/terms">Terms</a>
              <a className="nav-item" href="/contact">Contact</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

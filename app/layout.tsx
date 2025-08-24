import type { Metadata, Viewport } from "next";
import { Orbitron, Space_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";
import HeaderGate from "./components/HeaderGate"; // shows marketing header only on landing pages
import Footer from "../components/Footer";         // ✅ your global footer

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
        {/* Ambient background */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06] gradient-ink" />
          <div className="absolute inset-0 noise-overlay" />
        </div>

        {/* Skip link */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-full focus:bg-black/70 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>

        {/* Marketing header ONLY on landing/marketing routes */}
        <HeaderGate>
          <nav className="nav full-bleed">
            <div className="container max-w-[1600px] py-5 md:py-6">
              <div className="grid grid-cols-2 md:grid-cols-3 items-center gap-4">
                {/* Left: Brand */}
                <div className="flex items-center gap-3">
                  <span className="text-2xl md:text-[28px] font-extrabold gradient-text glow leading-none">
                    SmartHirex
                  </span>
                </div>

                {/* Center: Links */}
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

                {/* Mobile menu */}
                <button className="md:hidden icon-btn justify-self-end" aria-label="Open Menu">
                  <i className="ri-menu-5-line" />
                </button>
              </div>
            </div>
          </nav>
        </HeaderGate>

        {/* Main content */}
        <main id="main" className="flex-1 w-full">
          {children}
        </main>

        {/* ✅ Your landing footer, now global across every page */}
        <Footer />
      </body>
    </html>
  );
}

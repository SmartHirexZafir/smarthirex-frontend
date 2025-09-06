// app/layout.tsx
import "@fortawesome/fontawesome-free/css/all.min.css";
import "remixicon/fonts/remixicon.css";

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Inter, IBM_Plex_Mono } from "next/font/google";

import { AppHeaderGate, MarketingHeaderGate } from "./components/HeaderGate";

//   - components/navigation/AppHeader.tsx = MARKETING header
//   - components/AppHeader.tsx            = APP header
import MarketingHeader from "@/components/navigation/AppHeader";
import AppHeader from "@/components/AppHeader";

// Single footer (shared site-wide)
import Footer from "@/components/Footer";

// Toast + route progress + suspense fallback
import Toaster from "@/components/system/Toaster";
import RouteLoader from "@/components/system/RouteLoader";
import LoaderOverlay from "@/components/system/LoaderOverlay";

import { Suspense } from "react";

/** Google fonts (expose as CSS variables used by Tailwind & globals.css) */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: {
    default: "Smart HireX",
    template: "%s — Smart HireX",
  },
  description:
    "Smart HireX is an AI-powered recruitment platform that lets you upload resumes, analyze candidates, and filter the best matches with intelligent scoring and chat assistance.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    title: "Smart HireX",
    description:
      "AI-powered recruitment assistant for smarter hiring. Upload, analyze, and filter resumes instantly with Smart HireX.",
    url: "https://example.com",
    siteName: "Smart HireX",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart HireX",
    description:
      "AI-powered recruitment assistant for smarter hiring. Upload, analyze, and filter resumes instantly with Smart HireX.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
  category: "technology",
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#050810" },
  ],
};

/** No-FOUC theme setter — runs before paint.
 *  Global-only theming: default is Dark (Neon Eclipse); add `light` class to <html> for Light.
 */
const themeScript = `
  try {
    const stored = localStorage.getItem("theme");
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    const desired = stored || (prefersLight ? "light" : "dark");
    const el = document.documentElement;
    if (desired === "light") el.classList.add("light"); else el.classList.remove("light");
  } catch {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${plexMono.variable}`}
    >
      <head>
        {/* Preconnect for faster font fetch */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Prevent color-scheme flash and ensure global theme is applied before paint */}
        <script id="theme-script" dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>

      {/* Global-only UI surface and background; no page-level backgrounds */}
      <body className="min-h-screen flex flex-col page-aurora">
        {/* a11y skip link */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-full focus:bg-black/70 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>

        {/* Toasts & route-progress are global; they must wrap headers + content so z-index stacks correctly */}
        <Toaster>
          <RouteLoader />

          {/* Headers via gates (marketing vs. in-app) — both inherit global nav styles */}
          <MarketingHeaderGate>
            <MarketingHeader />
          </MarketingHeaderGate>
          <AppHeaderGate>
            <AppHeader />
          </AppHeaderGate>

          {/* Main content area (flex-1 keeps the single Footer stuck to bottom across all pages) */}
          <main id="main" className="flex-1 w-full">
            <Suspense fallback={<LoaderOverlay fullscreen />}>{children}</Suspense>
          </main>
        </Toaster>

        {/* One shared footer across the entire site */}
        <Footer />

        {/* Portal roots for modals/dropdowns if any component needs a stable DOM mount */}
        <div id="portal-root" />
        <div id="overlay-root" />
      </body>
    </html>
  );
}

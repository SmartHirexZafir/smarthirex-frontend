import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import "./globals.css";

const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-pacifico",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartHirex - AI-Powered Recruitment Platform",
  description:
    "Next-generation AI-powered recruitment platform that transforms how companies find and hire talent. Upload, Filter, Score & Schedule — all in one platform.",
  // ⛔️ themeColor must NOT be here
};

export const viewport: Viewport = {
  // ✅ move themeColor here
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css"
          rel="stylesheet"
        />
      </head>
      <body
        className={`page-shell antialiased bg-background text-foreground ${geistSans.variable} ${geistMono.variable} ${pacifico.variable}`}
      >
        {/* Top nav example (optional) */}
        {/* <nav className="nav">
          <div className="container flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold gradient-text">SmartHirex</span>
            </div>
            <div className="flex items-center gap-6">
              <a className="nav-item" href="/features">Features</a>
              <a className="nav-item" href="/pricing">Pricing</a>
              <a className="btn-primary" href="/login">Get Started</a>
            </div>
          </div>
        </nav> */}

        <div className="container py-8">{children}</div>
      </body>
    </html>
  );
}

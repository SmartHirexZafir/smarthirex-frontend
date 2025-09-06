import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer full-bleed">
      <div className="app-container py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand (same logo + name everywhere) */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2 group" aria-label="Smart HireX Home">
              <Image
                src="/web-logo.png"
                alt="Smart HireX logo"
                width={28}
                height={28}
                priority
                className="rounded-lg ring-1 ring-border"
              />
              <span className="text-xl font-extrabold gradient-text leading-none">Smart HireX</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground max-w-sm">
              AI-powered recruitment that helps you upload resumes, analyze candidates, and shortlist the best matches with intelligent scoring and chat assistance.
            </p>
          </div>

          {/* Product */}
          <nav aria-label="Product" className="grid gap-2 text-sm">
            <h3 className="font-semibold mb-2 text-foreground">Product</h3>
            <Link className="nav-item" href="/features">Features</Link>
            <Link className="nav-item" href="/pricing">Pricing</Link>
            <Link className="nav-item" href="/docs">Docs</Link>
          </nav>

          {/* Company */}
          <nav aria-label="Company" className="grid gap-2 text-sm">
            <h3 className="font-semibold mb-2 text-foreground">Company</h3>
            <Link className="nav-item" href="/about">About</Link>
            <Link className="nav-item" href="/careers">Careers</Link>
            <Link className="nav-item" href="/press">Press</Link>
          </nav>

          {/* Resources */}
          <nav aria-label="Resources" className="grid gap-2 text-sm">
            <h3 className="font-semibold mb-2 text-foreground">Resources</h3>
            <Link className="nav-item" href="/docs">Documentation</Link>
            <Link className="nav-item" href="/guides">Guides</Link>
            <Link className="nav-item" href="/support">Support</Link>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {year} Smart HireX. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/status" className="hover:text-foreground">Status</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

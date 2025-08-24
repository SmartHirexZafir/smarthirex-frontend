'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden text-foreground bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--card))] to-[hsl(var(--card))]">
      {/* Subtle dotted pattern (decorative) */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff' fill-opacity='0.9'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Soft gradient glows */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-[0.15] bg-[hsl(var(--primary))] mix-blend-screen" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-[0.15] bg-[hsl(var(--secondary))] mix-blend-screen" />
      </div>

      <div className="relative container">
        {/* Main Footer Content */}
        <div className="py-16 grid md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl grid place-items-center shadow-soft bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-white">
                <i className="ri-brain-line text-xl" />
              </div>
              <span className="text-3xl font-bold tracking-tight gradient-text">
                SmartHirex
              </span>
            </Link>

            <p className="text-[hsl(var(--muted-foreground))] text-base md:text-lg mb-8 max-w-md leading-relaxed">
              Revolutionizing recruitment with AI-powered solutions that help companies find, evaluate,
              and hire the best talent faster than ever before.
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              <a
                href="#"
                className="w-11 h-11 rounded-xl grid place-items-center ring-1 ring-border glass hover:bg-background/70 transition-all"
                aria-label="Open Twitter"
                title="Twitter"
              >
                <i className="ri-twitter-x-line text-lg" />
              </a>
              <a
                href="#"
                className="w-11 h-11 rounded-xl grid place-items-center ring-1 ring-border glass hover:bg-background/70 transition-all"
                aria-label="Open LinkedIn"
                title="LinkedIn"
              >
                <i className="ri-linkedin-fill text-lg" />
              </a>
              <a
                href="#"
                className="w-11 h-11 rounded-xl grid place-items-center ring-1 ring-border glass hover:bg-background/70 transition-all"
                aria-label="Open Facebook"
                title="Facebook"
              >
                <i className="ri-facebook-fill text-lg" />
              </a>
              <a
                href="#"
                className="w-11 h-11 rounded-xl grid place-items-center ring-1 ring-border glass hover:bg-background/70 transition-all"
                aria-label="Open YouTube"
                title="YouTube"
              >
                <i className="ri-youtube-fill text-lg" />
              </a>
              <a
                href="#"
                className="w-11 h-11 rounded-xl grid place-items-center ring-1 ring-border glass hover:bg-background/70 transition-all"
                aria-label="Open Instagram"
                title="Instagram"
              >
                <i className="ri-instagram-line text-lg" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-lg mb-5 text-foreground">Product</h4>
            <ul className="space-y-3">
              <li><Link href="/upload" className="footer-link">Resume Upload</Link></li>
              <li><Link href="/history" className="footer-link">Search History</Link></li>
              <li><Link href="/meetings" className="footer-link">Meeting Hub</Link></li>
              <li><Link href="/candidate/1" className="footer-link">Candidate View</Link></li>
              <li><Link href="/analytics" className="footer-link">Analytics</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-lg mb-5 text-foreground">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="footer-link">About Us</Link></li>
              <li><Link href="/careers" className="footer-link">Careers</Link></li>
              <li><Link href="/blog" className="footer-link">Blog</Link></li>
              <li><Link href="/news" className="footer-link">News</Link></li>
              <li><Link href="/investors" className="footer-link">Investors</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-lg mb-5 text-foreground">Support</h4>
            <ul className="space-y-3">
              <li><Link href="/help" className="footer-link">Help Center</Link></li>
              <li><Link href="/contact" className="footer-link">Contact Us</Link></li>
              <li><Link href="/documentation" className="footer-link">Documentation</Link></li>
              <li><Link href="/community" className="footer-link">Community</Link></li>
              <li><Link href="/status" className="footer-link">System Status</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-border py-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Stay Updated</h3>
              <p className="text-[hsl(var(--muted-foreground))]">
                Get the latest updates on AI recruitment trends and SmartHirex features.
              </p>
            </div>
            <form className="flex gap-4" onSubmit={(e) => e.preventDefault()} aria-label="Newsletter signup">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 h-12 px-4 rounded-xl bg-background/60 ring-1 ring-border text-foreground placeholder-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-colors"
                aria-label="Email address"
              />
              <button
                type="submit"
                className="btn btn-primary h-12 px-6 whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-border py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[hsl(var(--muted-foreground))] text-sm">
              © {new Date().getFullYear()} SmartHirex. All rights reserved. Made with ❤️ for better hiring.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-[hsl(var(--muted-foreground))] hover:text-foreground text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-[hsl(var(--muted-foreground))] hover:text-foreground text-sm transition-colors">
                Terms of Service
              </Link>
              <Link href="/security" className="text-[hsl(var(--muted-foreground))] hover:text-foreground text-sm transition-colors">
                Security
              </Link>
              <Link href="/cookies" className="text-[hsl(var(--muted-foreground))] hover:text-foreground text-sm transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer link utility (scoped) */}
      <style jsx>{`
        .footer-link {
          display: inline-block;
          color: hsl(var(--muted-foreground));
          transition: color .2s ease, transform .2s ease;
        }
        .footer-link:hover {
          color: hsl(var(--foreground));
          transform: translateX(4px);
        }
      `}</style>
    </footer>
  );
}

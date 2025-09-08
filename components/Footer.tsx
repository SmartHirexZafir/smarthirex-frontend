'use client';

import Link from 'next/link';
import Logo from '@/components/ui/Logo';

export default function Footer() {
  return (
    <footer className="relative text-foreground bg-card">
      <div className="container">
        {/* Main Footer Content */}
        <div className="py-16 grid md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 mb-6">
              <Logo />
            </Link>

            <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-md leading-relaxed">
              Revolutionizing recruitment with AI-powered solutions that help companies find, evaluate,
              and hire the best talent faster than ever before.
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              <a
                href="#"
                className="nav-item w-11 h-11 rounded-xl grid place-items-center ring-1 ring-border hover:bg-muted/40 transition-all"
                aria-label="Open Twitter"
                title="Twitter"
              >
                <i className="ri-twitter-x-line text-lg" />
              </a>
              <a
                href="#"
                className="nav-item w-11 h-11 rounded-xl grid place-items-center ring-1 ring-border hover:bg-muted/40 transition-all"
                aria-label="Open LinkedIn"
                title="LinkedIn"
              >
                <i className="ri-linkedin-fill text-lg" />
              </a>
              <a
                href="#"
                className="nav-item w-11 h-11 rounded-xl grid place-items-center ring-1 ring-border hover:bg-muted/40 transition-all"
                aria-label="Open Facebook"
                title="Facebook"
              >
                <i className="ri-facebook-fill text-lg" />
              </a>
              <a
                href="#"
                className="nav-item w-11 h-11 rounded-xl grid place-items-center ring-1 ring-border hover:bg-muted/40 transition-all"
                aria-label="Open YouTube"
                title="YouTube"
              >
                <i className="ri-youtube-fill text-lg" />
              </a>
              <a
                href="#"
                className="nav-item w-11 h-11 rounded-xl grid place-items-center ring-1 ring-border hover:bg-muted/40 transition-all"
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
              <li>
                <Link href="/upload" className="nav-item transition-transform duration-200 hover:translate-x-1">
                  Resume Upload
                </Link>
              </li>
              <li>
                <Link href="/history" className="nav-item transition-transform duration-200 hover:translate-x-1">
                  Search History
                </Link>
              </li>
              <li>
                <Link href="/meetings" className="nav-item transition-transform duration-200 hover:translate-x-1">
                  Meeting Hub
                </Link>
              </li>
              <li>
                <Link href="/candidate/1" className="nav-item transition-transform duration-200 hover:translate-x-1">
                  Candidate View
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="nav-item transition-transform duration-200 hover:translate-x-1">
                  Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-lg mb-5 text-foreground">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="nav-item transition-transform duration-200 hover:translate-x-1">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="nav-item transition-transform duration-200 hover:translate-x-1">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/blog" className="nav-item transition-transform duration-200 hover:translate-x-1">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/news" className="nav-item transition-transform duration-200 hover:translate-x-1">
                  News
                </Link>
              </li>
              <li>
                <Link href="/investors" className="nav-item transition-transform duration-200 hover:translate-x-1">
                  Investors
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-lg mb-5 text-foreground">Support</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="nav-item transition-transform duration-200 hover:translate-x-1">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="nav-item transition-transform duration-200 hover:translate-x-1">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/documentation" className="nav-item transition-transform duration-200 hover:translate-x-1">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/community" className="nav-item transition-transform duration-200 hover:translate-x-1">
                  Community
                </Link>
              </li>
              <li>
                <Link href="/status" className="nav-item transition-transform duration-200 hover:translate-x-1">
                  System Status
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-border py-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Stay Updated</h3>
              <p className="text-muted-foreground">
                Get the latest updates on AI recruitment trends and Smart HireX features.
              </p>
            </div>
            <form className="flex gap-4" onSubmit={(e) => e.preventDefault()} aria-label="Newsletter signup">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 h-12 px-4 rounded-xl bg-background/60 ring-1 ring-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                aria-label="Email address"
              />
              <button type="submit" className="btn btn-primary h-12 px-6 whitespace-nowrap">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-border py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Smart HireX. All rights reserved. Made with ❤️ for better hiring.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="nav-item text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="nav-item text-sm">
                Terms of Service
              </Link>
              <Link href="/security" className="nav-item text-sm">
                Security
              </Link>
              <Link href="/cookies" className="nav-item text-sm">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

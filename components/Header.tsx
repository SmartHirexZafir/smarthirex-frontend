'use client';

import Link from 'next/link';
import { useState } from 'react';
import Logo from './ui/Logo';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="nav">
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 group" aria-label="SmartHirex Home">
              <Logo />
            </Link>
          </div>

          {/* Desktop CTA (Login intentionally removed) */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/signup"
              className="btn btn-primary"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border hover:bg-muted/40 transition-colors"
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            <i className="ri-menu-line text-2xl text-foreground/80"></i>
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <nav
            id="mobile-menu"
            className="md:hidden border-t border-border py-6 glass-strong bg-background/90"
            role="navigation"
            aria-label="Mobile Navigation"
          >
            <div className="flex flex-col gap-4">
              {/* Login intentionally removed on mobile as well */}
              <Link
                href="/signup"
                className="btn btn-primary w-full text-center"
              >
                Sign Up
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

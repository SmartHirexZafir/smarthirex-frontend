'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import ThemeToggle from './ui/ThemeToogle';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="nav full-bleed" role="banner">
      <div className="app-container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Brand — use the same logo + name everywhere; remove extra dot/decoration */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center gap-2 group"
              aria-label="Smart HireX Home"
            >
              <Image
                src="/web-logo.png"
                alt="Smart HireX logo"
                width={28}
                height={28}
                priority
                className="rounded-lg ring-1 ring-border"
              />
              <span className="text-[22px] md:text-[24px] font-extrabold gradient-text leading-none">
                Smart HireX
              </span>
            </Link>
          </div>

          {/* Right-side actions (Login intentionally removed; global theme toggle kept) */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link href="/signup" className="btn btn-primary">
              Sign Up
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden icon-btn"
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            <i className="ri-menu-line text-xl" aria-hidden="true" />
          </button>
        </div>

        {/* Mobile menu (Login removed here as well) */}
        {isMenuOpen && (
          <nav
            id="mobile-menu"
            className="md:hidden mt-3 overflow-hidden rounded-2xl ring-1 ring-border bg-card p-2 animate-rise-in"
            role="navigation"
            aria-label="Mobile Navigation"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between rounded-xl bg-muted/30 p-2">
                <span className="text-sm text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
              <Link href="/signup" className="btn btn-primary w-full text-center">
                Sign Up
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

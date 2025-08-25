import Link from "next/link";

export default function Footer() {
  return (
    <footer className="full-bleed border-t border-white/10">
      <div className="container max-w-[1600px] py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="text-xl font-bold gradient-text">Nebula Luxe Pro</div>
            <p className="mt-3 text-sm text-muted-foreground max-w-sm">
              A future-proof design system focused on accessibility, performance, and premium aesthetics.
            </p>
          </div>

          <nav aria-label="Products" className="grid gap-2 text-sm">
            <h3 className="font-semibold mb-2">Product</h3>
            <Link className="nav-item" href="/features">Features</Link>
            <Link className="nav-item" href="/roadmap">Roadmap</Link>
            <Link className="nav-item" href="/changelog">Changelog</Link>
          </nav>

          <nav aria-label="Company" className="grid gap-2 text-sm">
            <h3 className="font-semibold mb-2">Company</h3>
            <Link className="nav-item" href="/about">About</Link>
            <Link className="nav-item" href="/careers">Careers</Link>
            <Link className="nav-item" href="/press">Press</Link>
          </nav>

          <nav aria-label="Resources" className="grid gap-2 text-sm">
            <h3 className="font-semibold mb-2">Resources</h3>
            <Link className="nav-item" href="/docs">Docs</Link>
            <Link className="nav-item" href="/guides">Guides</Link>
            <Link className="nav-item" href="/support">Support</Link>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Nebula Luxe Pro. All rights reserved.</p>
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

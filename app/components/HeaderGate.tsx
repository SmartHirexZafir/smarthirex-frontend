'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

/** Marketing/landing routes par hi children (global header) dikhaye. */
export default function HeaderGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';

  const isMarketing =
    pathname === '/' ||
    pathname.startsWith('/features') ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/signup');

  if (!isMarketing) return null;
  return <>{children}</>;
}

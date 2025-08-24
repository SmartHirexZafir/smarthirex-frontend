"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface User {
  firstName: string;
  lastName: string;
  jobTitle?: string;
  company?: string;
  email: string;
}

const NAV = [
  { label: "Upload CVs", href: "/upload", icon: "ri-upload-cloud-2-line" },
  { label: "History", href: "/history", icon: "ri-history-line" },
  { label: "Tests", href: "/meetings", icon: "ri-file-text-line" },
];

export default function AppHeader() {
  const pathname = usePathname() || "/";
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const getUserInitials = () => {
    if (user?.firstName || user?.lastName) {
      return `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();
    }
    return "JD";
  };
  const getUserName = () =>
    user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "John Doe";
  const getUserSubtext = () => user?.jobTitle || user?.company || "HR Manager";

  return (
    <nav className="nav full-bleed sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/70 shadow-glow">
      <div className="container max-w-[1600px] py-5 md:py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 items-center gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[hsl(var(--g1))] to-[hsl(var(--g3))] flex items-center justify-center text-white shadow-glow">
              <i className="ri-briefcase-line text-lg" />
            </div>
            <span className="text-2xl md:text-[28px] font-extrabold gradient-text glow leading-none">
              SmartHirex
            </span>
          </div>

          {/* Center nav */}
          <div className="hidden md:flex items-center justify-center gap-6">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="nav-item"
                  aria-current={active ? "page" : undefined}
                >
                  <i className={`${item.icon} mr-2`} />
                  {item.label}
                </a>
              );
            })}
          </div>

          {/* Profile */}
          <div className="flex items-center justify-end relative">
            <button
              onClick={() => setShowProfileDropdown((s) => !s)}
              className="surface glass border border-border rounded-xl px-2 py-2 flex items-center gap-3 hover:shadow-glow transition-all"
              aria-haspopup="menu"
              aria-expanded={showProfileDropdown}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--g3))] to-[hsl(var(--g1))] text-white font-semibold flex items-center justify-center shadow-glow">
                {getUserInitials()}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-sm font-medium">{getUserName()}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{getUserSubtext()}</p>
              </div>
              <i className="ri-arrow-down-s-line text-[hsl(var(--muted-foreground))]" />
            </button>

            {showProfileDropdown && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-56 surface glass border border-border rounded-xl shadow-glow py-2 z-50"
              >
                <a className="nav-item block px-4 py-2" href="#">
                  <i className="ri-user-line mr-2" />
                  Profile
                </a>
                <a className="nav-item block px-4 py-2" href="#">
                  <i className="ri-settings-line mr-2" />
                  Settings
                </a>
                <hr className="my-2 border-border" />
                <a className="nav-item block px-4 py-2 text-[hsl(var(--destructive))]" href="#">
                  <i className="ri-logout-circle-line mr-2" />
                  Logout
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

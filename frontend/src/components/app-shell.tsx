"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { SiteHeader } from "@/components/site-header";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isAuthPage = pathname === "/account";

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <div className={isAuthPage ? "app-shell auth-shell" : "app-shell"}>
      {isAuthPage ? null : (
        <>
          <div className="mobile-topbar">
            <Link className="mobile-topbar-brand" href="/" aria-label="FinTrack AI home">
              <span className="site-brand-mark logo-mark" aria-hidden="true">
                <img src="/fintrack-logo-mark.png" alt="" />
              </span>
              <span className="mobile-topbar-title">FinTrack AI</span>
            </Link>
            <button
              className="mobile-menu-button"
              type="button"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open navigation"
            >
              <span className="nav-icon" aria-hidden="true">menu</span>
            </button>
          </div>
          {isMobileOpen ? (
            <div className="mobile-nav-backdrop" onClick={() => setIsMobileOpen(false)} />
          ) : null}
          <SiteHeader isMobileOpen={isMobileOpen} />
        </>
      )}
      {children}
    </div>
  );
}

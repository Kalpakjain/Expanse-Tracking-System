"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/categories", label: "Categories", icon: "category" },
  { href: "/reports", label: "Analytics", icon: "insights" },
  { href: "/receipts", label: "Receipts", icon: "receipt_long" },
  { href: "/bank-connections", label: "Bank Connections", icon: "link" },
  { href: "/savings-transfer", label: "Savings Transfer", icon: "savings" },
  { href: "/whatsapp-notifications", label: "Notifications", icon: "notifications" },
  { href: "/account", label: "Account", icon: "account_circle" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <aside className="site-header">
      <div className="site-header-inner">
        <Link className="site-brand" href="/">
          <span className="site-brand-mark">FT</span>
          <span>
            <strong>FinTrack AI</strong>
            <span className="site-brand-copy">Plan, track, and report with clarity.</span>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                className={isActive ? "site-nav-link site-nav-link-active" : "site-nav-link"}
                href={link.href}
              >
                <span className="nav-icon" aria-hidden="true">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="site-footer-actions">
          <a className="button button-primary" href="/?newExpense=1">
            <span className="nav-icon" aria-hidden="true">add</span>
            Add Expense
          </a>
          <Link className="site-nav-link" href="/about">
            <span className="nav-icon" aria-hidden="true">help</span>
            Help Center
          </Link>
        </div>
      </div>
    </aside>
  );
}

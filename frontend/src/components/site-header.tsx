"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/categories", label: "Categories", icon: "category" },
  { href: "/reports", label: "Analytics", icon: "insights" },
  { href: "/receipts", label: "Receipts", icon: "receipt_long" },
  { href: "/bank-connections", label: "Bank Connections", icon: "link" },
  { href: "/savings-transfer", label: "Savings Transfer", icon: "savings" },
  { href: "/whatsapp-notifications", label: "Notifications", icon: "notifications" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={isCollapsed ? "site-header site-header-collapsed" : "site-header"}>
      <div className="site-header-inner">
        <div className="site-header-top">
          <Link className="site-brand" href="/" title="FinTrack AI">
            <span className="site-brand-mark logo-mark" aria-hidden="true">
              <img src="/fintrack-logo-mark.png" alt="" />
            </span>
            <span className="site-brand-text">
              <strong className="brand-wordmark" aria-label="FinTrack AI">
                <span className="brand-fin">Fin</span>
                <span className="brand-track">Track</span>
                <span className="brand-ai">AI</span>
              </strong>
              <span className="site-brand-copy">Smart Expense Tracker</span>
            </span>
          </Link>
          <button
            className="sidebar-toggle"
            type="button"
            onClick={() => setIsCollapsed((current) => !current)}
            aria-label={isCollapsed ? "Open side panel" : "Close side panel"}
            title={isCollapsed ? "Open side panel" : "Close side panel"}
          >
            <span className="nav-icon" aria-hidden="true">{isCollapsed ? "menu_open" : "menu"}</span>
          </button>
        </div>

        <nav className="site-nav" aria-label="Primary">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                className={isActive ? "site-nav-link site-nav-link-active" : "site-nav-link"}
                href={link.href}
                title={link.label}
              >
                <span className="nav-icon" aria-hidden="true">{link.icon}</span>
                <span className="site-nav-label">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="site-footer-actions">
          <a className="button button-primary" href="/?newExpense=1">
            <span className="nav-icon" aria-hidden="true">add</span>
            <span className="site-nav-label">Add Expense</span>
          </a>
          <Link className="site-nav-link" href="/about" title="Help Center">
            <span className="nav-icon" aria-hidden="true">help</span>
            <span className="site-nav-label">Help Center</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}

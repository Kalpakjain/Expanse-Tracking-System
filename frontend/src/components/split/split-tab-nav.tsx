"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const splitTabs = [
  { href: "/split", label: "Overview" },
  { href: "/split/groups", label: "Groups" },
  { href: "/split/friends", label: "Friends" },
  { href: "/split/activity", label: "Activity" },
];

export function SplitTabNav() {
  const pathname = usePathname();

  return (
    <nav className="split-tab-nav" aria-label="Split expense sections">
      {splitTabs.map((tab) => {
        const isActive = tab.href === "/split" ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link className={isActive ? "split-tab-active" : ""} href={tab.href} key={tab.href}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

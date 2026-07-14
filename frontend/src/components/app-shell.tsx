"use client";

import { usePathname } from "next/navigation";

import { SiteHeader } from "@/components/site-header";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/account";

  return (
    <div className={isAuthPage ? "app-shell auth-shell" : "app-shell"}>
      {isAuthPage ? null : <SiteHeader />}
      {children}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { getCurrentUser, getStoredAuthToken } from "@/lib/api";

type AuthGateProps = {
  children: React.ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isChecking, setIsChecking] = useState(true);
  const isAccountPage = pathname === "/account";

  useEffect(() => {
    let isActive = true;

    async function verifySession() {
      const token = getStoredAuthToken();
      if (!token) {
        if (!isAccountPage) {
          const query = searchParams.toString();
          const currentPath = query ? `${pathname}?${query}` : pathname;
          router.replace(`/account?next=${encodeURIComponent(currentPath)}`);
        }
        if (isActive) {
          setIsChecking(false);
        }
        return;
      }

      try {
        await getCurrentUser();
        if (isActive) {
          setIsChecking(false);
        }
      } catch {
        if (!isAccountPage) {
          router.replace(`/account?next=${encodeURIComponent(pathname)}`);
        }
        if (isActive) {
          setIsChecking(false);
        }
      }
    }

    void verifySession();

    return () => {
      isActive = false;
    };
  }, [isAccountPage, pathname, router, searchParams]);

  if (isChecking && !isAccountPage) {
    return (
      <main className="auth-lock-screen">
        <section className="panel auth-lock-card">
          <span className="eyebrow">Secure workspace</span>
          <h1>Checking your session...</h1>
          <p>Sign in is required before opening the expense dashboard.</p>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}

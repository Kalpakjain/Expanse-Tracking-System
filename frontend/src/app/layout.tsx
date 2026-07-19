import { Suspense, type ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/app-shell";
import { AuthGate } from "@/components/auth-gate";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Expense Tracker",
  description: "Track spending, receipts, and smart insights.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Suspense>
          <AuthGate>
            <AppShell>{children}</AppShell>
          </AuthGate>
        </Suspense>
      </body>
    </html>
  );
}

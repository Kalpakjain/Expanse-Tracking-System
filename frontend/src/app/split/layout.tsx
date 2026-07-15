import type { ReactNode } from "react";

import { SplitTabNav } from "@/components/split/split-tab-nav";

export default function SplitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="split-layout-shell">
      <SplitTabNav />
      {children}
    </div>
  );
}

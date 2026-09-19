"use client";

import { BackendProvider } from "./BackendStatus";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <BackendProvider>
      <div className="app-stage">
        <div className="app-frame">
          {children}
        </div>
      </div>
    </BackendProvider>
  );
}

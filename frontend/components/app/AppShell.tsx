"use client";

import { usePathname, useRouter } from "next/navigation";
import { DemoSessionProvider } from "@/lib/demo-session";
import { BackendProvider } from "./BackendStatus";

/**
 * The simulated device.
 *
 * The shell owns only what a phone's OS owns — the bezel, status bar and home
 * gesture. It deliberately renders no tab bar: each of the three apps (Inbox,
 * FLOW, PausePay) brings its own navigation, the same way real apps do. A
 * single shared tab bar spanning all of them was what made the old build read
 * as one app with three tabs rather than three apps that talk to each other.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const atHome = pathname === "/app";

  return (
    <BackendProvider>
      <DemoSessionProvider>
        <div className="app-stage">
          <div className="app-device">
            <span className="app-hw app-hw--silent" aria-hidden="true" />
            <span className="app-hw app-hw--vol-up" aria-hidden="true" />
            <span className="app-hw app-hw--vol-down" aria-hidden="true" />
            <span className="app-hw app-hw--power" aria-hidden="true" />
            <div className="app-frame">
              <header className="app-statusbar" aria-hidden="true">
                <span className="app-statusbar__time">9:41</span>
                <span className="app-island" />
                <span className="app-statusbar__sys">
                  <span className="app-sig" />
                  <span className="app-wifi" />
                  <span className="app-batt" />
                </span>
              </header>

              <div className="app-screen">{children}</div>

              {/* Home gesture — the only way back out of an app, as on a real phone. */}
              <button
                type="button"
                className="app-home-indicator"
                onClick={() => router.push("/app")}
                disabled={atHome}
                aria-label="Go to home screen"
              />
            </div>
          </div>
        </div>
      </DemoSessionProvider>
    </BackendProvider>
  );
}

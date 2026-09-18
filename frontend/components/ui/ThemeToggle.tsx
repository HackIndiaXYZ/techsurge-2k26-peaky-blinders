"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const label = mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Change color theme";

  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <span className="theme-toggle__icons" aria-hidden="true">
        <Sun className={isDark ? "theme-icon" : "theme-icon is-active"} size={17} strokeWidth={1.75} />
        <Moon className={isDark ? "theme-icon is-active" : "theme-icon"} size={17} strokeWidth={1.75} />
      </span>
    </button>
  );
}

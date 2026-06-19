"use client";

import { useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import { ThemeContext } from "./ThemeProvider";

// Routes whose layout already renders a theme toggle in the TopBar — no need
// to show the floating duplicate there.
const ROUTES_WITH_TOPBAR_TOGGLE = ["/dashboard", "/admin", "/mentor"];

export default function FloatingThemeToggle() {
  const pathname = usePathname();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [mounted, setMounted] = useState(false);
  const [hover, setHover] = useState(false);

  // Defer the icon's first render to after mount so SSR (which always picks
  // the default-dark Sun) doesn't briefly contradict the client when light
  // mode was chosen. The container itself is fine to render server-side.
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!pathname) return null;
  if (ROUTES_WITH_TOPBAR_TOGGLE.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label="Toggle theme"
      title="Toggle theme"
      style={{
        position: "fixed",
        bottom: 30,
        left: 30,
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: "var(--color-bg-3)",
        border: `1px solid ${hover ? "var(--color-primary)" : "var(--color-border)"}`,
        color: hover ? "var(--color-primary)" : "var(--color-text-2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "var(--shadow-md)",
        zIndex: 999,
        transition: "border-color var(--transition-fast), color var(--transition-fast), transform var(--transition-fast)",
        transform: hover ? "translateY(-2px)" : "none",
      }}
    >
      {mounted ? (isDarkMode ? <Sun size={18} /> : <Moon size={18} />) : null}
    </button>
  );
}

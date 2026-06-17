"use client";
import { ConfigProvider, theme, App } from "antd";
import { createContext, useState, useEffect } from "react";

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: true,
  toggleTheme: () => {},
});

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The inline themeBootstrap script in app/layout.tsx runs in the browser
  // BEFORE React hydrates and sets data-theme="light" on <html> when the user
  // has opted into light mode (saved choice or OS prefers-color-scheme).
  // We read that attribute here so our initial state matches what the user
  // already sees on the screen — no FOUC, no AntD-config flap.
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document === "undefined") return true;
    return document.documentElement.getAttribute("data-theme") !== "light";
  });

  // Keep the attribute in sync with state after the initial paint (e.g. when
  // the user clicks the toggle).
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("seal_theme", next ? "dark" : "light");
      } catch {
        // Safari private mode / quota exceeded — runtime toggle still works,
        // it just won't persist across reloads.
      }
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <ConfigProvider
        theme={{
          algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: '#6366f1',
            colorBgContainer: isDarkMode ? '#111827' : '#ffffff',
            colorBgElevated: isDarkMode ? '#1f2937' : '#f8fafc',
            colorBorder: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.3)',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            colorTextBase: isDarkMode ? '#f1f5f9' : '#0f172a',
          },
        }}
      >
        <App>
          {children}
        </App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

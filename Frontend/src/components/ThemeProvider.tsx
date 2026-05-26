"use client";
import { ConfigProvider, theme, App } from "antd";
import { createContext, useContext, useState, useEffect } from "react";

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: true,
  toggleTheme: () => {},
});

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Read from localStorage on mount
    const saved = localStorage.getItem("seal_theme");
    if (saved === "light") {
      setIsDarkMode(false);
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("seal_theme", next ? "dark" : "light");
      if (next) {
        document.documentElement.removeAttribute("data-theme");
      } else {
        document.documentElement.setAttribute("data-theme", "light");
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

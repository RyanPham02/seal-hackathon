import type { Metadata } from "next";
import Script from "next/script";
import ThemeProvider from "../components/ThemeProvider";
import AuthProvider from "../components/AuthProvider";
import AIChatbotWrapper from "../components/AIChatbotWrapper";
import FloatingThemeToggle from "../components/FloatingThemeToggle";
import "./globals.css";

const themeBootstrap = `
(function() {
  try {
    var saved = localStorage.getItem('seal_theme');
    var theme = saved
      ? saved
      : (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) { /* private mode / disabled storage: fall through to default dark */ }
})();
`;

export const metadata: Metadata = {
  title: "SEAL – Software Engineering Hackathon Management System",
  description:
    "SEAL (Software Engineering Agile League) is an academic hackathon management platform for FPT University's annual SE competition, supporting event management, team registration, judging, and analytics.",
  keywords: ["hackathon", "SEAL", "FPT", "software engineering", "competition"],
  authors: [{ name: "SEAL System" }],
  openGraph: {
    title: "SEAL Hackathon Management System",
    description: "Manage hackathon events, teams, submissions, and judging seamlessly.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <FloatingThemeToggle />
            <AIChatbotWrapper />
          </AuthProvider>
        </ThemeProvider>

        {/* Google Translate container */}
        <div id="google_translate_element" style={{ opacity: 0, position: "absolute", zIndex: -1, pointerEvents: "none" }} />

        {/* Google Translate scripts */}
        <Script id="google-translate-init" strategy="afterInteractive">
          {`
            function googleTranslateElementInit() {
              new window.google.translate.TranslateElement({pageLanguage: 'en'}, 'google_translate_element');
            }
          `}
        </Script>
        <Script src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" strategy="afterInteractive" />
      </body>
    </html>
  );
}
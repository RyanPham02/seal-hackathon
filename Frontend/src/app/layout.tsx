import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

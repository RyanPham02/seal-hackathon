"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import styles from "../dashboard/layout.module.css";
import { useAuth } from "@/components/AuthProvider";

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed]       = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, loggingOut } = useAuth();

  useEffect(() => {
    // Skip during logout so the caller's chosen destination wins the race.
    if (loggingOut || isLoading) return;
    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!user.roles.includes("Mentor") && !user.roles.includes("Admin")) {
      router.push("/dashboard");
    }
  }, [loggingOut, isLoading, user, router, pathname]);

  const allowed = !!user && (user.roles.includes("Mentor") || user.roles.includes("Admin"));

  // Block rendering until the mentor role is verified — prevents a flash of
  // the mentor shell for non-mentors or unauthenticated visitors.
  if (isLoading || !allowed) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "var(--color-bg, #0f0f1a)",
          color: "var(--color-text-2, #a0aec0)",
          flexDirection: "column",
          gap: "1rem",
          fontSize: "0.95rem",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            border: "3px solid rgba(99,102,241,0.3)",
            borderTop: "3px solid #6366f1",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        Verifying access...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <TopBar
        onMenuToggle={() => setMobileOpen(!mobileOpen)}
        sidebarCollapsed={collapsed}
      />
      <main
        className={styles.main}
        style={{
          marginLeft: collapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)",
          paddingTop: "var(--topbar-height)",
        }}
      >
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}

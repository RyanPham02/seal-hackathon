"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import styles from "../dashboard/layout.module.css";
import { App } from "antd";
import { useAuth } from "@/components/AuthProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { message } = App.useApp();
  const { user, isLoading, loggingOut } = useAuth();

  // /admin/login lives under this layout but must remain reachable without an
  // active session — otherwise the gate traps it on a permanent spinner
  // (chicken-and-egg: must be logged in as admin to log in as admin).
  const isPublicAdminRoute = pathname === "/admin/login";

  useEffect(() => {
    // Suppress the redirect while a logout is in flight — the caller of
    // logout() has its own destination in mind (e.g. "/") and we'd otherwise
    // race them and win, dumping the user on /admin/login.
    if (loggingOut || isPublicAdminRoute || isLoading) return;
    if (!user) {
      router.push("/admin/login");
      return;
    }
    if (!user.roles.includes("Admin")) {
      message.error("Access denied. Admin privileges required.");
      router.push("/dashboard");
    }
  }, [loggingOut, isPublicAdminRoute, isLoading, user, router, message]);

  // The login page renders without the shell — no Sidebar/TopBar around it.
  if (isPublicAdminRoute) {
    return <>{children}</>;
  }

  // Block rendering until the role is verified — prevents flash of admin
  // content for non-admin users.
  if (isLoading || !user || !user.roles.includes("Admin")) {
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

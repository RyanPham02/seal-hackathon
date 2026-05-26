"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import styles from "./layout.module.css";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed]       = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);

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

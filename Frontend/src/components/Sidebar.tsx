"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Calendar, Users, FileText, Trophy, BarChart3,
  Bell, Settings, ChevronLeft, ChevronRight, LogOut, BookOpen,
  Cloud, Tag, Target, Send, Star, Shield, Menu, X,
} from "lucide-react";
import styles from "./Sidebar.module.css";

const NAV_SECTIONS = [
  {
    title: "Main",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",       href: "/dashboard" },
      { icon: Bell,            label: "Notifications",   href: "/dashboard/notifications" },
    ],
  },
  {
    title: "Events",
    items: [
      { icon: Calendar, label: "Events",    href: "/dashboard/events" },
      { icon: Tag,      label: "Tracks",    href: "/dashboard/tracks" },
      { icon: Users,    label: "Teams",     href: "/dashboard/teams" },
      { icon: Send,     label: "Submissions", href: "/dashboard/submissions" },
    ],
  },
  {
    title: "Judging",
    items: [
      { icon: Target,  label: "Scoring",   href: "/dashboard/judging" },
      { icon: Trophy,  label: "Rankings",  href: "/dashboard/rankings" },
      { icon: Star,    label: "Prizes",    href: "/dashboard/prizes" },
    ],
  },
  {
    title: "Content",
    items: [
      { icon: FileText, label: "Documents", href: "/dashboard/documents" },
      { icon: Cloud,    label: "Storage",   href: "/dashboard/storage" },
      { icon: BookOpen, label: "Analytics", href: "/dashboard/analytics" },
    ],
  },
  {
    title: "System",
    items: [
      { icon: Shield,   label: "System Alerts",  href: "/dashboard/system-notifications" },
      { icon: Settings, label: "Settings",        href: "/dashboard/settings" },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className={styles.overlay} onClick={onMobileClose} />
      )}

      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${mobileOpen ? styles.mobileOpen : ""}`}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Trophy size={20} />
          </div>
          {!collapsed && (
            <div className={styles.logoText}>
              <span className={styles.logoName}>SEAL</span>
              <span className={styles.logoSub}>Hackathon Hub</span>
            </div>
          )}
          <button className={styles.collapseBtn} onClick={onToggle}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className={styles.section}>
              {!collapsed && (
                <span className={styles.sectionTitle}>{section.title}</span>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navItem} ${active ? styles.active : ""}`}
                    onClick={onMobileClose}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={styles.navIcon}>
                      <Icon size={18} />
                    </span>
                    {!collapsed && (
                      <span className={styles.navLabel}>{item.label}</span>
                    )}
                    {active && <span className={styles.activeBar} />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className={styles.footer}>
          <div className={styles.userAvatar}>
            <div className="avatar-placeholder" style={{ width: 36, height: 36, fontSize: "0.85rem" }}>C</div>
          </div>
          {!collapsed && (
            <div className={styles.userInfo}>
              <span className={styles.userName}>Chi Le</span>
              <span className={styles.userRole}>Event Coordinator</span>
            </div>
          )}
          <button className={styles.logoutBtn} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}

"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Calendar, Users, FileText, Trophy, BarChart3,
  Bell, Settings, ChevronLeft, ChevronRight, LogOut, BookOpen,
  Cloud, Tag, Target, Send, Star, Shield, Menu, X, Search
} from "lucide-react";
import styles from "./Sidebar.module.css";

const NAV_SECTIONS = [
  {
    title: "Main",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",       href: "/dashboard" },
    ],
  },
  {
    title: "Events",
    items: [
      { icon: Calendar, label: "Events",    href: "/dashboard/events" },
      { icon: Tag,      label: "Tracks",    href: "/dashboard/tracks" },
      { icon: Users,    label: "Teams",     href: "/dashboard/teams" },
      { icon: Search,   label: "Matchmaking", href: "/dashboard/matchmaking" },
      { icon: Send,     label: "Submissions", href: "/dashboard/submissions" },
    ],
  },
  {
    title: "Judging",
    items: [
      { icon: FileText,label: "Criteria",  href: "/dashboard/criteria" },
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
      { icon: Users,    label: "User Approvals", href: "/dashboard/users" },
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
  const router = useRouter();
  const isAdminPortal = pathname.startsWith("/admin");
  const [currentUser, setCurrentUser] = useState({ name: "Loading...", role: "Member", email: "" });
  const [avatar, setAvatar] = useState<string | null>(null);

  const loadUser = () => {
    const stored = localStorage.getItem("currentUser");
    if (stored) {
      try { 
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
        setAvatar(localStorage.getItem(`avatar_${parsed.email}`));
      } catch(e){}
    } else {
      const defaultUser = { name: "Hải Trần", role: "Member", email: "hai@student.fpt.edu.vn" };
      setCurrentUser(defaultUser);
      setAvatar(localStorage.getItem(`avatar_${defaultUser.email}`));
    }
  };

  useEffect(() => {
    loadUser();
    window.addEventListener("storage", loadUser);
    return () => window.removeEventListener("storage", loadUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    router.push("/auth/login");
  };

  const visibleSections = NAV_SECTIONS.map(section => {
    if (isAdminPortal) {
      if (section.title === "Main") return { ...section, items: [{ icon: LayoutDashboard, label: "Admin Dashboard", href: "/admin" }] };
      if (section.title === "Events") return { ...section, items: [{ icon: Calendar, label: "Events", href: "/admin/events" }] };
      if (section.title === "System") return { ...section, items: [
        { icon: Users, label: "User Approvals", href: "/admin/users" },
        { icon: Shield, label: "System Alerts", href: "/admin/system-notifications" },
        { icon: Settings, label: "Settings", href: "/admin/settings" }
      ]};
      if (section.title === "Judging") return { ...section, items: [{ icon: FileText, label: "Criteria", href: "/admin/criteria" }] };
      return null;
    } else if (pathname.startsWith("/mentor")) {
      if (section.title === "Main") return { ...section, items: [{ icon: LayoutDashboard, label: "Mentor Dashboard", href: "/mentor" }] };
      if (section.title === "Events") return { ...section, items: [{ icon: Users, label: "My Teams", href: "/mentor/teams" }] };
      return null;
    } else {
      if (section.title === "System") return { ...section, items: section.items.filter(item => item.label === "Settings") };
      if (section.title === "Judging") return { ...section, items: section.items.filter(item => item.label !== "Criteria") };
      return section;
    }
  }).filter(section => section && section.items.length > 0);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className={styles.overlay} onClick={onMobileClose} />
      )}

      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${mobileOpen ? styles.mobileOpen : ""}`}>
        {/* Logo */}
        <div className={styles.logo} style={collapsed ? { justifyContent: "center", padding: "1.25rem 0" } : {}}>
          {!collapsed && (
            <>
              <div className={styles.logoIcon}>
                <Trophy size={20} />
              </div>
              <div className={styles.logoText}>
                <span className={styles.logoName}>SEAL</span>
                <span className={styles.logoSub}>Hackathon Hub</span>
              </div>
            </>
          )}
          <button className={styles.collapseBtn} onClick={onToggle} style={collapsed ? { margin: 0, padding: '0.5rem' } : {}}>
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {visibleSections.map((section) => (
            <div key={section!.title} className={styles.section}>
              {!collapsed && (
                <span className={styles.sectionTitle}>{section!.title}</span>
              )}
              {section!.items.map((item) => {
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
          <Link href="/dashboard/profile" style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, textDecoration: "none", minWidth: 0, overflow: "hidden" }}>
            <div className={styles.userAvatar}>
              {avatar ? (
                <img src={avatar} alt="Avatar" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div className="avatar-placeholder" style={{ width: 36, height: 36, fontSize: "0.85rem", textTransform: 'uppercase' }}>
                  {currentUser.name.charAt(0)}
                </div>
              )}
            </div>
            {!collapsed && (
              <div className={styles.userInfo} style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                <span className={styles.userName} style={{ color: "var(--color-text)", display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{currentUser.name}</span>
                <span className={styles.userRole} style={{ display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{currentUser.role}</span>
              </div>
            )}
          </Link>
          <button className={styles.logoutBtn} title="Logout" onClick={handleLogout} style={{ flexShrink: 0 }}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}

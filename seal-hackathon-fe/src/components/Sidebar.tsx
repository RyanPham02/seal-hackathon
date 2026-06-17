"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Trophy,
  Settings,
  ChevronLeft,
  LogOut,
  BookOpen,
  Cloud,
  Tag,
  Target,
  Send,
  Star,
  Menu,
  Search,
  Bell,
} from "lucide-react";
import styles from "./Sidebar.module.css";
import { useAuth } from "./AuthProvider";

type NavItem = {
  icon: React.ElementType;
  label: string;
  href: string;
  roles: string[] | null;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const ALL_NAV_SECTIONS: NavSection[] = [
  {
    title: "Main",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", roles: null },
    ],
  },
  {
    title: "Events",
    items: [
      { icon: Calendar, label: "Events", href: "/dashboard/events", roles: null },
      { icon: Tag, label: "Tracks", href: "/dashboard/tracks", roles: null },
      { icon: Users, label: "Teams", href: "/dashboard/teams", roles: null },
      {
        icon: Search,
        label: "Matchmaking",
        href: "/dashboard/matchmaking",
        roles: ["Member", "TeamLeader"],
      },
      {
        icon: Send,
        label: "Submissions",
        href: "/dashboard/submissions",
        roles: ["Member", "TeamLeader"],
      },
    ],
  },
  {
    title: "Judging",
    items: [
      { icon: FileText, label: "Criteria", href: "/admin/criteria", roles: ["Admin"] },
      { icon: Target, label: "Scoring", href: "/dashboard/judging", roles: ["Judge", "Admin"] },
      { icon: Trophy, label: "Rankings", href: "/dashboard/rankings", roles: null },
      { icon: Star, label: "Prizes", href: "/dashboard/prizes", roles: null },
    ],
  },
  {
    title: "Content",
    items: [
      { icon: FileText, label: "Documents", href: "/dashboard/documents", roles: null },
      { icon: Cloud, label: "Storage", href: "/dashboard/storage", roles: null },
      {
        icon: BookOpen,
        label: "Analytics",
        href: "/dashboard/analytics",
        roles: ["Admin", "Judge"],
      },
    ],
  },
  {
    title: "System",
    items: [
      { icon: Users, label: "User Approvals", href: "/admin/users", roles: ["Admin"] },
      { icon: FileText, label: "Audit Logs", href: "/admin/audit-logs", roles: ["Admin"] },
      {
        icon: Bell,
        label: "System Notifications",
        href: "/admin/system-notifications",
        roles: ["Admin"],
      },
      { icon: Settings, label: "Settings", href: "/dashboard/settings", roles: null },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: currentUser, logout } = useAuth();

  const isAdminPortal = pathname.startsWith("/admin");

  const [avatar, setAvatar] = useState<string | null>(null);

  // Avatar is a UI-only per-email preference; never drives identity/authz.
  useEffect(() => {
    if (!currentUser) {
      setAvatar(null);
      return;
    }
    setAvatar(localStorage.getItem(`avatar_${currentUser.email}`));
  }, [currentUser]);

  const handleLogout = async () => {
    // Capture role BEFORE logout — once logout() resolves, currentUser is null.
    // Admins land on the public landing page; non-admins go back to login so
    // they can hop back into their dashboard quickly.
    const wasAdmin = currentUser?.roles.includes("Admin") ?? false;
    await logout();
    router.push(wasAdmin ? "/" : "/auth/login");
  };

  const userRoles = currentUser?.roles?.length
    ? currentUser.roles
    : currentUser?.role
      ? [currentUser.role]
      : [];

  const visibleSections = ALL_NAV_SECTIONS.map((section): NavSection | null => {
    if (isAdminPortal) {
      if (section.title === "Main") {
        return {
          ...section,
          items: [
            {
              icon: LayoutDashboard,
              label: "Admin Dashboard",
              href: "/admin",
              roles: ["Admin"],
            },
          ],
        };
      }

      if (section.title === "Events") {
        return {
          ...section,
          items: [
            { icon: Calendar, label: "Events", href: "/admin/events", roles: ["Admin"] },
            { icon: Users, label: "Teams", href: "/admin/teams", roles: ["Admin"] },
            { icon: Tag, label: "Tracks", href: "/admin/tracks", roles: ["Admin"] },
            { icon: Star, label: "Prizes", href: "/admin/prizes", roles: ["Admin"] },
          ],
        };
      }

      if (section.title === "System") {
        return {
          ...section,
          items: [
            { icon: Users, label: "User Approvals", href: "/admin/users", roles: ["Admin"] },
            { icon: FileText, label: "Audit Logs", href: "/admin/audit-logs", roles: ["Admin"] },
            {
              icon: Bell,
              label: "System Notifications",
              href: "/admin/system-notifications",
              roles: ["Admin"],
            },
            { icon: Settings, label: "Settings", href: "/admin/settings", roles: ["Admin"] },
          ],
        };
      }

      if (section.title === "Judging") {
        return {
          ...section,
          items: [
            { icon: FileText, label: "Criteria", href: "/admin/criteria", roles: ["Admin"] },
            { icon: Target, label: "Assignments", href: "/admin/assignments", roles: ["Admin"] },
            {
              icon: Trophy,
              label: "Scoring Queue",
              href: "/admin/judging",
              roles: ["Admin"],
            },
          ],
        };
      }

      return null;
    }

    if (pathname.startsWith("/mentor")) {
      if (section.title === "Main") {
        return {
          ...section,
          items: [
            {
              icon: LayoutDashboard,
              label: "Mentor Dashboard",
              href: "/mentor",
              roles: ["Mentor", "Admin"],
            },
          ],
        };
      }

      if (section.title === "Events") {
        return {
          ...section,
          items: [
            {
              icon: Users,
              label: "My Teams",
              href: "/mentor/teams",
              roles: ["Mentor", "Admin"],
            },
          ],
        };
      }

      return null;
    }

    const filteredItems = section.items.filter((item) => {
      const isAdmin = userRoles.includes("Admin");

      if (!isAdmin) {
        if (section.title === "System" && item.label !== "Settings") return false;
        if (section.title === "Judging" && item.label === "Criteria") return false;
      }

      if (item.roles && !item.roles.some((role) => userRoles.includes(role))) {
        return false;
      }

      return true;
    });

    return { ...section, items: filteredItems };
  }).filter((section): section is NavSection => Boolean(section && section.items.length > 0));

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/admin") return pathname === "/admin";

    return pathname.startsWith(href);
  };

  if (!currentUser) return null;

  const profileHref = currentUser.roles?.includes("Admin")
    ? "/admin/profile"
    : "/dashboard/profile";

  const displayName =
    currentUser.name ||
    currentUser.fullName ||
    currentUser.email ||
    "User";

  return (
    <>
      {mobileOpen && (
        <div className={styles.overlay} onClick={onMobileClose} />
      )}

      <aside
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${
          mobileOpen ? styles.mobileOpen : ""
        }`}
      >
        <div
          className={styles.logo}
          style={
            collapsed
              ? { justifyContent: "center", padding: "1.25rem 0" }
              : {}
          }
        >
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

          <button
            className={styles.collapseBtn}
            onClick={onToggle}
            style={collapsed ? { margin: 0, padding: "0.5rem" } : {}}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className={styles.nav}>
          {visibleSections.map((section) => (
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

        <div className={styles.footer}>
          <Link
            href={profileHref}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              flex: 1,
              textDecoration: "none",
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <div className={styles.userAvatar}>
              {avatar ? (
                <img
                  src={avatar}
                  alt="Avatar"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  className="avatar-placeholder"
                  style={{
                    width: 36,
                    height: 36,
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                  }}
                >
                  {displayName.charAt(0)}
                </div>
              )}
            </div>

            {!collapsed && (
              <div
                className={styles.userInfo}
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                <span
                  className={styles.userName}
                  style={{
                    color: "var(--color-text)",
                    display: "block",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayName}
                </span>

                <span
                  className={styles.userRole}
                  style={{
                    display: "block",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                >
                  {currentUser.role || currentUser.roles?.[0]}
                </span>
              </div>
            )}
          </Link>

          <button
            className={styles.logoutBtn}
            title="Logout"
            aria-label="Logout"
            onClick={handleLogout}
            style={{ flexShrink: 0 }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
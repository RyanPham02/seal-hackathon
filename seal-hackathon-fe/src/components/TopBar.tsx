"use client";

import { useState, useRef, useEffect, useContext, useCallback } from "react";
import { Search, Bell, Menu, Sun, Moon, ChevronDown, Settings, User, LogOut, Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { App, Dropdown } from "antd";
import Link from "next/link";
import styles from "./TopBar.module.css";
import { ThemeContext } from "./ThemeProvider";
import { useAuth } from "./AuthProvider";
import { apiRequest } from "@/lib/api";
import { ALL_LANGUAGES } from "@/lib/languages";

interface TopBarProps {
  onMenuToggle: () => void;
  sidebarCollapsed: boolean;
}

type NotificationDto = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export default function TopBar({ onMenuToggle, sidebarCollapsed }: TopBarProps) {
  const router = useRouter();
  const { message } = App.useApp();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { user: currentUser, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [themeIconMounted, setThemeIconMounted] = useState(false);
  useEffect(() => setThemeIconMounted(true), []);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ type: string; title: string; link: string }[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [language, setLanguage] = useState("en");
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const searchEventsRef = useRef<{ eventId: string; eventName: string }[] | null>(null);
  const latestQueryRef = useRef("");

  const changeLanguage = (langCode: string) => {
    let select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
    if (!select) {
      const google = (window as unknown as {
        google?: { translate?: { TranslateElement?: new (options: { pageLanguage: string }, element: string) => unknown } };
      }).google;
      if (google?.translate?.TranslateElement) {
        try {
          new google.translate.TranslateElement({ pageLanguage: "en" }, "google_translate_element");
          setTimeout(() => {
            select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
            if (select) {
              select.value = langCode;
              select.dispatchEvent(new Event("change"));
            }
          }, 150);
          return;
        } catch (err) {
          console.error("Dynamic translate init failed:", err);
        }
      }
    }

    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event("change"));
    }
  };

  const languageItems = ALL_LANGUAGES.map((item) => ({
    key: item.key,
    label: item.label,
    onClick: () => {
      setLanguage(item.key);
      changeLanguage(item.key);
    },
  }));

  const loadNotifications = useCallback(async () => {
    try {
      setNotifications(await apiRequest<NotificationDto[]>("/notifications"));
    } catch {
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setAvatar(null);
      return;
    }
    setAvatar(localStorage.getItem(`avatar_${currentUser.email}`));
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchResults([]);
    };

    document.addEventListener("mousedown", handleClickOutside);
    const id = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    const intervalId = setInterval(() => {
      void loadNotifications();
    }, 15000);

    return () => {
      window.clearTimeout(id);
      clearInterval(intervalId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [loadNotifications]);

  const markAllRead = async () => {
    try {
      await apiRequest("/notifications/read-all", { method: "POST" });
      await loadNotifications();
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not mark notifications as read.");
    }
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    latestQueryRef.current = q;

    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    if (searchEventsRef.current === null) {
      try {
        searchEventsRef.current = await apiRequest<{ eventId: string; eventName: string }[]>("/Events");
      } catch {
        searchEventsRef.current = [];
      }
      if (latestQueryRef.current !== q) return;
    }

    const qLower = q.toLowerCase();
    const matches = searchEventsRef.current
      .filter((ev) => ev.eventName.toLowerCase().includes(qLower))
      .slice(0, 6)
      .map((ev) => ({ type: "Event", title: ev.eventName, link: `/dashboard/events/${ev.eventId}` }));

    setSearchResults(
      matches.length > 0 ? matches : [{ type: "Empty", title: `No results for "${q}"`, link: "#" }],
    );
  };

  const handleLogout = async () => {
    const wasAdmin = currentUser?.roles.includes("Admin") ?? false;
    await logout();
    router.push(wasAdmin ? "/" : "/auth/login");
  };

  if (!currentUser) return null;

  return (
    <header
      className={styles.topbar}
      style={{ left: sidebarCollapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)" }}
    >
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuToggle} aria-label="Toggle navigation menu">
          <Menu size={20} />
        </button>
        <div className="search-bar" style={{ minWidth: 280, position: "relative" }} ref={searchRef}>
          <Search size={16} style={{ color: "var(--color-text-3)", flexShrink: 0 }} />
          <input
            className="search-input"
            placeholder="Search events..."
            aria-label="Search events"
            value={searchQuery}
            onChange={handleSearch}
          />
          {searchResults.length > 0 && (
            <div className="dropdown-menu" style={{ position: "absolute", top: "100%", left: 0, width: "100%", marginTop: "8px", zIndex: 100 }}>
              {searchResults.map((res, i) => (
                res.type === "Empty" ? (
                  <div key={i} className="dropdown-item" style={{ color: "var(--color-text-3)", cursor: "default" }}>
                    {res.title}
                  </div>
                ) : (
                  <Link key={i} href={res.link} className="dropdown-item" onClick={() => { setSearchResults([]); setSearchQuery(""); }}>
                    <span style={{ fontSize: "0.7rem", background: "#e2e8f0", color: "#475569", padding: "2px 6px", borderRadius: "4px", marginRight: "8px" }}>{res.type}</span>
                    {res.title}
                  </Link>
                )
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.right}>
        <Dropdown menu={{ items: languageItems, selectedKeys: [language], style: { maxHeight: 400, overflowY: "auto" } }} placement="bottomRight" trigger={["click"]}>
          <button className={styles.iconBtn} title="Change language" aria-label="Change language">
            <Languages size={18} />
          </button>
        </Dropdown>

        <button className={styles.iconBtn} onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
          {themeIconMounted ? (isDarkMode ? <Sun size={18} /> : <Moon size={18} />) : null}
        </button>

        <div className="dropdown" ref={notifRef}>
          <button
            className={styles.iconBtn}
            onClick={() => {
              const newOpen = !notifOpen;
              setNotifOpen(newOpen);
              setUserOpen(false);
              if (newOpen) {
                void loadNotifications();
              }
            }}
            style={{ position: "relative" }}
            aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notif-dot" />}
          </button>

          {notifOpen && (
            <div className={`dropdown-menu ${styles.notifPanel}`}>
              <div className={styles.notifHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span className={styles.notifTitle}>Notifications</span>
                  {unreadCount > 0 && <span className="badge badge-primary" style={{ marginLeft: "0.5rem" }}>{unreadCount} new</span>}
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ background: "none", border: "none", color: "var(--color-primary)", fontSize: "0.75rem", cursor: "pointer" }}>
                    Mark all as read
                  </button>
                )}
              </div>
              <div className={styles.notifList}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "1rem", textAlign: "center", color: "var(--color-text-3)", fontSize: "0.85rem" }}>
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div key={n.id} className={`${styles.notifItem} ${!n.isRead ? styles.unread : ""}`}>
                      <div className={styles.notifDot2} style={{ background: !n.isRead ? "var(--color-primary)" : "transparent" }} />
                      <div className={styles.notifBody}>
                        <span className={styles.notifItemTitle}>{n.title}</span>
                        <span className={styles.notifDesc}>{n.message}</span>
                        <span className={styles.notifTime}>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className={styles.notifFooter}>
                <Link href="/dashboard/notifications" onClick={() => setNotifOpen(false)}>
                  View all notifications -&gt;
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="dropdown" ref={userRef}>
          <button
            className={styles.userBtn}
            onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
          >
            {avatar ? (
              <img src={avatar} alt="Avatar" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: "0.8rem", textTransform: "uppercase" }}>
                {currentUser.name?.charAt(0) || "U"}
              </div>
            )}
            <div className={styles.userInfo}>
              <span className={styles.userName}>{currentUser.name || "User"}</span>
              <span className={styles.userRole}>{currentUser.role}</span>
            </div>
            <ChevronDown size={14} style={{ color: "var(--color-text-3)" }} />
          </button>

          {userOpen && (
            <div className="dropdown-menu">
              <Link href={currentUser.roles.includes("Admin") ? "/admin/profile" : "/dashboard/profile"} className="dropdown-item" onClick={() => setUserOpen(false)}>
                <User size={15} /> View Profile
              </Link>
              <Link href={currentUser.roles.includes("Admin") ? "/admin/settings" : "/dashboard/settings"} className="dropdown-item" onClick={() => setUserOpen(false)}>
                <Settings size={15} /> Settings
              </Link>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={handleLogout} style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}>
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
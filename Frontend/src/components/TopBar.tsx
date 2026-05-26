"use client";
import { useState, useRef, useEffect } from "react";
import { Search, Bell, Menu, Sun, Moon, ChevronDown, Settings, User, LogOut } from "lucide-react";
import styles from "./TopBar.module.css";
import Link from "next/link";

const SAMPLE_NOTIFS = [
  { id: 1, title: "New team registered", desc: "Team Alpha joined SEAL Spring 2026", time: "2m ago", unread: true },
  { id: 2, title: "Submission received", desc: "Team Beta submitted for Round 1", time: "15m ago", unread: true },
  { id: 3, title: "Score finalized", desc: "Judge completed scoring for Track A", time: "1h ago", unread: false },
  { id: 4, title: "New judge assigned", desc: "Dr. Nguyen assigned to Finals", time: "3h ago", unread: false },
];

interface TopBarProps {
  onMenuToggle: () => void;
  sidebarCollapsed: boolean;
}

export default function TopBar({ onMenuToggle, sidebarCollapsed }: TopBarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLDivElement>(null);

  const unreadCount = SAMPLE_NOTIFS.filter(n => n.unread).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setUserOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={styles.topbar}
      style={{ left: sidebarCollapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)" }}
    >
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuToggle}>
          <Menu size={20} />
        </button>
        <div className="search-bar" style={{ minWidth: 280 }}>
          <Search size={16} style={{ color: "var(--color-text-3)", flexShrink: 0 }} />
          <input className="search-input" placeholder="Search events, teams, documents…" />
        </div>
      </div>

      <div className={styles.right}>
        {/* Theme toggle */}
        <button className={styles.iconBtn} onClick={() => setDarkMode(!darkMode)} title="Toggle theme">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="dropdown" ref={notifRef}>
          <button
            className={styles.iconBtn}
            onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }}
            style={{ position: "relative" }}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notif-dot" />}
          </button>

          {notifOpen && (
            <div className={`dropdown-menu ${styles.notifPanel}`}>
              <div className={styles.notifHeader}>
                <span className={styles.notifTitle}>Notifications</span>
                <span className="badge badge-primary">{unreadCount} new</span>
              </div>
              <div className={styles.notifList}>
                {SAMPLE_NOTIFS.map(n => (
                  <div key={n.id} className={`${styles.notifItem} ${n.unread ? styles.unread : ""}`}>
                    <div className={styles.notifDot2} style={{ background: n.unread ? "var(--color-primary)" : "transparent" }} />
                    <div className={styles.notifBody}>
                      <span className={styles.notifItemTitle}>{n.title}</span>
                      <span className={styles.notifDesc}>{n.desc}</span>
                      <span className={styles.notifTime}>{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.notifFooter}>
                <Link href="/dashboard/notifications" onClick={() => setNotifOpen(false)}>
                  View all notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="dropdown" ref={userRef}>
          <button
            className={styles.userBtn}
            onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
          >
            <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: "0.8rem" }}>C</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>Chi Le</span>
              <span className={styles.userRole}>Coordinator</span>
            </div>
            <ChevronDown size={14} style={{ color: "var(--color-text-3)" }} />
          </button>

          {userOpen && (
            <div className="dropdown-menu">
              <Link href="/dashboard/settings" className="dropdown-item" onClick={() => setUserOpen(false)}>
                <User size={15} /> Profile & Settings
              </Link>
              <Link href="/dashboard/settings" className="dropdown-item" onClick={() => setUserOpen(false)}>
                <Settings size={15} /> Preferences
              </Link>
              <div className="dropdown-divider" />
              <Link href="/auth/login" className="dropdown-item danger">
                <LogOut size={15} /> Logout
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

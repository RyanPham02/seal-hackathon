"use client";
import { useState, useRef, useEffect, useContext } from "react";
import { Search, Bell, Menu, Sun, Moon, ChevronDown, Settings, User, LogOut, RefreshCw, Key } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./TopBar.module.css";
import Link from "next/link";
import { ThemeContext } from "./ThemeProvider";
import { App, Modal, Input } from "antd";

const DEFAULT_NOTIFS = [
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
  const router = useRouter();
  const { message } = App.useApp();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: "Loading...", role: "Member", email: "" });
  const [avatar, setAvatar] = useState<string | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ type: string; title: string; link: string }[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [password, setPassword] = useState("");

  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadCount = notifications.filter(n => n.unread).length;

  const loadUser = () => {
    const stored = localStorage.getItem("currentUser");
    if (stored) {
      try { 
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
        setAvatar(localStorage.getItem(`avatar_${parsed.email}`));
      } catch(e){}
    } else {
      const defaultUser = { name: "Hải Trần", email: "hai@student.fpt.edu.vn", role: "Member", id: "USR-001" };
      localStorage.setItem("currentUser", JSON.stringify(defaultUser));
      setCurrentUser(defaultUser);
      setAvatar(localStorage.getItem(`avatar_${defaultUser.email}`));
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setUserOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchResults([]);
    };
    document.addEventListener("mousedown", handleClickOutside);
    // Load notifications
    const loadNotifications = () => {
      const storedNotifs = localStorage.getItem("globalNotifications");
      if (storedNotifs) {
        setNotifications(JSON.parse(storedNotifs));
      } else {
        localStorage.setItem("globalNotifications", JSON.stringify(DEFAULT_NOTIFS));
        setNotifications(DEFAULT_NOTIFS);
      }
    };

    loadNotifications();
    loadUser(); // Load user on mount

    const handleStorageChange = () => {
      loadUser();
      loadNotifications();
    };

    window.addEventListener("storage", handleStorageChange);

    // Load saved accounts
    const updateSavedAccounts = () => {
      const regUsersRaw = localStorage.getItem("registeredUsers");
      if (regUsersRaw) {
        try { 
          const regUsers = JSON.parse(regUsersRaw);
          // Allow switching to any registered user EXCEPT Admin
          setSavedAccounts(regUsers.filter((u: any) => u.role !== "Admin"));
        } catch(e){}
      }
    };
    
    updateSavedAccounts();

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, unread: false }));
    setNotifications(updated);
    localStorage.setItem("globalNotifications", JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    
    // Giả lập tìm kiếm nhanh
    const results = [];
    const qLower = q.toLowerCase();
    
    // Always provide some dummy data if query > 2 chars to make it feel functional
    if (qLower.includes("team") || qLower.includes("cyb") || qLower.includes("hack")) {
      results.push({ type: "Team", title: `Team ${q} (Match)`, link: "/dashboard/teams/1" });
    }
    if (qLower.includes("event") || qLower.includes("fin")) {
      results.push({ type: "Event", title: "Grand Finale 2026", link: "/dashboard/events/EV-001" });
    }
    if (qLower.includes("track") || qLower.includes("ai")) {
      results.push({ type: "Track", title: "AI/ML Track", link: "/dashboard/tracks" });
    }
    if (results.length === 0) {
      results.push({ type: "Search", title: `Search for "${q}"`, link: "#" });
    }
    
    setSearchResults(results);
  };

  const handleSwitchAccountSubmit = () => {
    if (password !== selectedAccount.password) {
      message.error("Incorrect password for quick switch.");
      return;
    }
    if (selectedAccount.role === "Admin") {
      message.error("Security policy prevents quick-switching to Admin accounts.");
      return;
    }
    localStorage.setItem("currentUser", JSON.stringify(selectedAccount));
    window.location.reload();
  };

  const openSwitchModal = () => {
    setUserOpen(false);
    setSwitchModalOpen(true);
    setSelectedAccount(null);
    setPassword("");
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    router.push("/auth/login");
  };

  return (
    <header
      className={styles.topbar}
      style={{ left: sidebarCollapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)" }}
    >
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuToggle}>
          <Menu size={20} />
        </button>
        <div className="search-bar" style={{ minWidth: 280, position: 'relative' }} ref={searchRef}>
          <Search size={16} style={{ color: "var(--color-text-3)", flexShrink: 0 }} />
          <input 
            className="search-input" 
            placeholder="Search events, teams, documents…" 
            value={searchQuery}
            onChange={handleSearch}
          />
          {searchResults.length > 0 && (
            <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', left: 0, width: '100%', marginTop: '8px', zIndex: 100 }}>
              {searchResults.map((res, i) => (
                <Link key={i} href={res.link} className="dropdown-item" onClick={() => { setSearchResults([]); setSearchQuery(""); }}>
                  <span style={{ fontSize: '0.7rem', background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '4px', marginRight: '8px' }}>{res.type}</span>
                  {res.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.right}>
        {/* Theme toggle */}
        <button className={styles.iconBtn} onClick={toggleTheme} title="Toggle theme">
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
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
                  notifications.slice(0, 5).map(n => (
                    <div key={n.id} className={`${styles.notifItem} ${n.unread ? styles.unread : ""}`}>
                      <div className={styles.notifDot2} style={{ background: n.unread ? "var(--color-primary)" : "transparent" }} />
                      <div className={styles.notifBody}>
                        <span className={styles.notifItemTitle}>{n.title}</span>
                        <span className={styles.notifDesc}>{n.desc}</span>
                        <span className={styles.notifTime}>{n.time}</span>
                      </div>
                    </div>
                  ))
                )}
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
            {avatar ? (
              <img src={avatar} alt="Avatar" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: "0.8rem", textTransform: 'uppercase' }}>
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div className={styles.userInfo}>
              <span className={styles.userName}>{currentUser.name}</span>
              <span className={styles.userRole}>{currentUser.role}</span>
            </div>
            <ChevronDown size={14} style={{ color: "var(--color-text-3)" }} />
          </button>

          {userOpen && (
            <div className="dropdown-menu">
              <Link href={currentUser.role === "Admin" ? "/admin/profile" : "/dashboard/profile"} className="dropdown-item" onClick={() => setUserOpen(false)}>
                <User size={15} /> View Profile
              </Link>
              <Link href={currentUser.role === "Admin" ? "/admin/settings" : "/dashboard/settings"} className="dropdown-item" onClick={() => setUserOpen(false)}>
                <Settings size={15} /> Settings
              </Link>
              <button className="dropdown-item" onClick={openSwitchModal} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
                <RefreshCw size={15} /> Switch Account
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={handleLogout} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        title="Switch Account"
        open={switchModalOpen}
        onCancel={() => setSwitchModalOpen(false)}
        onOk={handleSwitchAccountSubmit}
        okText="Login"
        okButtonProps={{ disabled: !selectedAccount || !password }}
      >
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ color: "var(--color-text-2)", marginBottom: "1rem" }}>Select a saved account to switch to quickly.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {savedAccounts.filter(a => a.role !== "Admin").map((acc, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedAccount(acc)}
                style={{
                  display: "flex", alignItems: "center", gap: "1rem", padding: "1rem",
                  border: selectedAccount?.email === acc.email ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)", cursor: "pointer",
                  background: selectedAccount?.email === acc.email ? "rgba(99,102,241,0.1)" : "rgba(15,23,42,0.3)"
                }}
              >
                <div className="avatar-placeholder" style={{ width: 32, height: 32 }}>{acc.name.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{acc.name} {currentUser.email === acc.email && "(Current)"}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>{acc.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {selectedAccount && currentUser.email !== selectedAccount.email && (
          <div className="form-group" style={{ marginTop: "1rem" }}>
            <label className="form-label">Password for {selectedAccount.email}</label>
            <Input.Password 
              prefix={<Key size={14} style={{ color: "var(--color-text-3)", marginRight: 8 }} />} 
              placeholder="Enter password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              size="large"
            />
          </div>
        )}
      </Modal>
    </header>
  );
}

"use client";
import { useState, useEffect } from "react";
import { Bell, CheckCircle } from "lucide-react";
import { App } from "antd";

export default function UserNotificationsPage() {
  const { message } = App.useApp();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Merge standard mock notifications with the global ones sent by Admin
    const globalNotifs = JSON.parse(localStorage.getItem("globalNotifications") || "[]");
    setNotifications(globalNotifs);
  }, []);

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, unread: false }));
    setNotifications(updated);
    localStorage.setItem("globalNotifications", JSON.stringify(updated));
    message.success("All notifications marked as read.");
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Stay updated with system alerts and team activity</p>
        </div>
        <button className="btn btn-secondary" onClick={markAllRead}>
          <CheckCircle size={16} /> Mark all as read
        </button>
      </div>

      <div className="glass-card">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={48} className="empty-icon" />
            <div className="empty-title">No notifications</div>
            <div className="empty-desc">You're all caught up!</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {notifications.map(n => (
              <div 
                key={n.id} 
                style={{ 
                  display: "flex", gap: "1rem", padding: "1.25rem", 
                  borderBottom: "1px solid var(--color-border)",
                  background: n.unread ? "rgba(99,102,241,0.05)" : "transparent"
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.unread ? "var(--color-primary)" : "transparent", marginTop: 6 }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "1.05rem" }}>{n.title}</h4>
                  <p style={{ margin: "0 0 0.5rem 0", color: "var(--color-text-2)", fontSize: "0.95rem" }}>{n.desc}</p>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>{n.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

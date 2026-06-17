"use client";
import { useEffect, useState, useCallback } from "react";
import { Bell, CheckCircle } from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";

type NotificationDto = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export default function UserNotificationsPage() {
  const { message } = App.useApp();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await apiRequest<NotificationDto[]>("/notifications");
        if (active) {
          setNotifications(data);
        }
      } catch (err) {
        if (active) {
          message.error(err instanceof Error ? err.message : "Could not load notifications.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [message]);

  const refreshNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<NotificationDto[]>("/notifications");
      setNotifications(data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, [message]);

  const markAllRead = async () => {
    try {
      await apiRequest("/notifications/read-all", { method: "POST" });
      message.success("All notifications marked as read.");
      await refreshNotifications();
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not mark notifications as read.");
    }
  };

  const markRead = async (id: string) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: "POST" });
      await refreshNotifications();
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not update notification.");
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Stay updated with system alerts and team activity</p>
        </div>
        <button className="btn btn-secondary" onClick={markAllRead} disabled={notifications.every((item) => item.isRead)}>
          <CheckCircle size={16} /> Mark all as read
        </button>
      </div>

      <div className="glass-card">
        {loading ? (
          <div className="empty-state">
            <span className="spinner" />
            <div className="empty-title">Loading notifications</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={48} className="empty-icon" />
            <div className="empty-title">No notifications</div>
            <div className="empty-desc">You&apos;re all caught up!</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => !notification.isRead && markRead(notification.id)}
                style={{
                  display: "flex",
                  gap: "1rem",
                  padding: "1.25rem",
                  border: 0,
                  borderBottom: "1px solid var(--color-border)",
                  background: notification.isRead ? "transparent" : "rgba(99,102,241,0.05)",
                  textAlign: "left",
                  cursor: notification.isRead ? "default" : "pointer",
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: notification.isRead ? "transparent" : "var(--color-primary)", marginTop: 6 }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "1.05rem", color: "var(--color-text)" }}>{notification.title}</h4>
                  <p style={{ margin: "0 0 0.5rem 0", color: "var(--color-text-2)", fontSize: "0.95rem" }}>{notification.message}</p>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>{new Date(notification.createdAt).toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

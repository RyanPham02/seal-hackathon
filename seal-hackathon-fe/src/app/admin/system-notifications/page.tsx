"use client";
import { useState, useEffect } from "react";
import { Send, Bell, List } from "lucide-react";
import { App } from "antd";

export default function AdminSystemNotifications() {
  const { message } = App.useApp();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const notifs = JSON.parse(localStorage.getItem("globalNotifications") || "[]");
    setHistory(notifs);
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const newNotif = {
      id: Date.now(),
      title,
      desc,
      time: new Date().toLocaleTimeString(),
      unread: true
    };
    const updated = [newNotif, ...history];
    localStorage.setItem("globalNotifications", JSON.stringify(updated));
    setHistory(updated);
    setTitle("");
    setDesc("");
    message.success("System notification sent to all users!");
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">System Notifications</h1>
          <p className="page-subtitle">Broadcast messages to all users</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="glass-card">
          <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Send size={18} style={{ color: "var(--color-primary)" }} /> Send New Alert
          </h3>
          <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Notification Title</label>
              <input className="form-input" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. System Maintenance" />
            </div>
            <div className="form-group">
              <label className="form-label">Message Content</label>
              <textarea className="form-input" required rows={4} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Enter details..." />
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
              <Bell size={16} /> Broadcast Notification
            </button>
          </form>
        </div>

        <div className="glass-card">
          <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <List size={18} style={{ color: "var(--color-primary)" }} /> Recent Broadcasts
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {history.length === 0 ? (
              <p style={{ color: "var(--color-text-3)" }}>No notifications sent yet.</p>
            ) : (
              history.map(n => (
                <div key={n.id} style={{ padding: "1rem", background: "var(--color-surface-2)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{n.title}</div>
                  <div style={{ fontSize: "0.9rem", color: "var(--color-text-2)", marginBottom: "0.5rem" }}>{n.desc}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>Sent at: {n.time}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

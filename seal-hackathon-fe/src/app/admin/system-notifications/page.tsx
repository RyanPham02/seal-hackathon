"use client";
import { useState, useEffect } from "react";
import { Send, Bell, List, RefreshCw, Users } from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";

type BroadcastHistory = {
  broadcastId: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  recipientCount: number;
};

export default function AdminSystemNotifications() {
  const { message } = App.useApp();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [notifType, setNotifType] = useState("info");
  const [history, setHistory] = useState<BroadcastHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<BroadcastHistory[]>("/notifications/broadcast-history");
      setHistory(data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to load broadcast history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    apiRequest<BroadcastHistory[]>("/notifications/broadcast-history")
      .then((data) => {
        if (active) setHistory(data);
      })
      .catch((err) => {
        if (!active) return;
        message.error(err instanceof Error ? err.message : "Failed to load broadcast history.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [message]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await apiRequest<{ message: string; recipientCount: number }>("/notifications/broadcast", {
        method: "POST",
        body: JSON.stringify({ title, message: desc, type: notifType }),
      });
      message.success(`${res.message} (${res.recipientCount} recipients)`);
      setTitle("");
      setDesc("");
      setNotifType("info");
      window.dispatchEvent(new Event("storage"));
      await loadHistory();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to send broadcast.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">System Notifications</h1>
          <p className="page-subtitle">Broadcast messages to all users</p>
        </div>
        <button className="btn btn-secondary" onClick={loadHistory} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
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
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-input" value={notifType} onChange={e => setNotifType(e.target.value)}>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }} disabled={sending}>
              {sending ? <span className="spinner" /> : <><Bell size={16} /> Broadcast Notification</>}
            </button>
          </form>
        </div>

        <div className="glass-card">
          <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <List size={18} style={{ color: "var(--color-primary)" }} /> Recent Broadcasts
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-3)" }}>
                <span className="spinner" /> Loading…
              </div>
            ) : history.length === 0 ? (
              <p style={{ color: "var(--color-text-3)" }}>No notifications sent yet.</p>
            ) : (
              history.map(n => (
                <div key={n.broadcastId} style={{ padding: "1rem", background: "var(--color-surface-2)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                    <div style={{ fontWeight: 600 }}>{n.title}</div>
                    <span className="badge badge-neutral" style={{ fontSize: "0.7rem" }}>{n.type}</span>
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "var(--color-text-2)", marginBottom: "0.5rem" }}>{n.message}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--color-text-3)" }}>
                    <span>Sent: {new Date(n.createdAt).toLocaleString()}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Users size={11} /> {n.recipientCount} recipients</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

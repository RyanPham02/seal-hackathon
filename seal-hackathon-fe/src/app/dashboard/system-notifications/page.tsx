"use client";
import { AlertTriangle, Info, CheckCircle } from "lucide-react";

export default function SystemNotificationsPage() {
  const alerts = [
    { type: "warning", message: "High server load detected during team registrations.", time: "2 hours ago" },
    { type: "info", message: "Database backup completed successfully.", time: "5 hours ago" },
    { type: "success", message: "System update v1.2.0 deployed.", time: "1 day ago" },
  ];

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">System Alerts</h1>
          <p className="page-subtitle">Platform health and system-wide notifications</p>
        </div>
      </div>

      <div className="glass-card">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {alerts.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1rem", background: "rgba(15,23,42,0.4)", borderRadius: "var(--radius-md)", borderLeft: `3px solid ${a.type === 'warning' ? '#f59e0b' : a.type === 'success' ? '#10b981' : '#3b82f6'}` }}>
              {a.type === "warning" ? <AlertTriangle style={{ color: "#f59e0b" }} /> : a.type === "success" ? <CheckCircle style={{ color: "#10b981" }} /> : <Info style={{ color: "#3b82f6" }} />}
              <div>
                <div style={{ fontWeight: 600 }}>{a.message}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)", marginTop: "0.25rem" }}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";
import { Settings, Save, Shield, Bell } from "lucide-react";
import { App } from "antd";

export default function SettingsPage() {
  const { message } = App.useApp();
  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage system preferences and notifications</p>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><Shield size={18} style={{ color: "var(--color-primary)" }} /> Security</h3>
        <div className="form-group">
          <label className="form-label">Two-Factor Authentication (2FA)</label>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button className="btn btn-secondary">Enable 2FA</button>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>Add an extra layer of security to your account</span>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><Bell size={18} style={{ color: "var(--color-primary)" }} /> Email Notifications</h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {["Team invitations", "Event updates", "Submission results"].map(item => (
            <label key={item} style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
              <input type="checkbox" defaultChecked style={{ accentColor: "var(--color-primary)", width: 16, height: 16 }} />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn btn-primary" onClick={() => message.success("Settings saved successfully!")}><Save size={16} /> Save Changes</button>
      </div>
    </div>
  );
}

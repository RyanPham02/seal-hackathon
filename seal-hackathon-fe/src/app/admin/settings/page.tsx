"use client";
import { Settings, Save, Shield, Bell, Globe, Database } from "lucide-react";
import { App } from "antd";
import { useState } from "react";

export default function AdminSettingsPage() {
  const { message } = App.useApp();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  const handleSave = () => {
    message.loading({ content: "Saving settings...", key: "settings" });
    setTimeout(() => {
      message.success({ content: "Admin Settings saved successfully!", key: "settings" });
    }, 1000);
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Global Settings</h1>
          <p className="page-subtitle">Manage system-wide preferences, security, and configurations</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Globe size={18} style={{ color: "var(--color-primary)" }} /> Platform Configuration
          </h3>
          <div className="form-group">
            <label className="form-label">Maintenance Mode</label>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.5rem" }}>
              <button 
                className={`btn ${maintenanceMode ? "btn-primary" : "btn-secondary"}`} 
                style={{ background: maintenanceMode ? "var(--color-rose)" : "" }}
                onClick={() => setMaintenanceMode(!maintenanceMode)}
              >
                {maintenanceMode ? "Enabled (Platform Locked)" : "Disable Maintenance"}
              </button>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-3)", flex: 1 }}>
                Prevent non-admin users from accessing the platform during upgrades.
              </span>
            </div>
          </div>
          
          <div className="form-group" style={{ marginTop: "1.5rem" }}>
            <label className="form-label">Platform Name</label>
            <input className="form-input" defaultValue="SEAL Hackathon Hub" />
          </div>
        </div>

        <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Shield size={18} style={{ color: "var(--color-primary)" }} /> Admin Security
          </h3>
          <div className="form-group">
            <label className="form-label">Admin Two-Factor Authentication (2FA)</label>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.5rem" }}>
              <button className="btn btn-secondary">Enforce 2FA for all Admins</button>
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-3)", display: "block", marginTop: "0.5rem" }}>
              Requires all administrators to use an authenticator app.
            </span>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Bell size={18} style={{ color: "var(--color-primary)" }} /> Notification Routing
        </h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[
            "Notify Admins on new user registration", 
            "Notify Admins on team creation", 
            "Receive daily summary reports",
            "Send alert when judging criteria changes"
          ].map((item, idx) => (
            <label key={idx} style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
              <input type="checkbox" defaultChecked={idx === 0 || idx === 3} style={{ accentColor: "var(--color-primary)", width: 16, height: 16 }} />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem" }}>
        <button className="btn btn-primary" onClick={handleSave} style={{ padding: "0.7rem 2rem" }}>
          <Save size={16} /> Save All Changes
        </button>
      </div>
    </div>
  );
}

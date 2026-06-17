"use client";
import Link from "next/link";
import { Shield, Bell, Globe, User } from "lucide-react";

// Honest admin settings page: there is no backend settings API yet, so the
// previously fake controls (maintenance mode, 2FA, "Save All Changes" toast)
// are presented as planned features instead of silently doing nothing.
export default function AdminSettingsPage() {
  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Global Settings</h1>
          <p className="page-subtitle">System-wide preferences and configuration</p>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-1)" }}>
          <User size={18} style={{ color: "var(--color-primary)" }} /> Admin Account
        </h3>
        <p style={{ fontSize: "0.9rem", color: "var(--color-text-2)", marginBottom: "1rem" }}>
          Your admin name, avatar, and password are managed on your profile page.
        </p>
        <Link href="/admin/profile">
          <button className="btn btn-primary">Open Admin Profile</button>
        </Link>
      </div>

      <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-1)" }}>
          <Bell size={18} style={{ color: "var(--color-primary)" }} /> System Broadcasts
        </h3>
        <p style={{ fontSize: "0.9rem", color: "var(--color-text-2)", marginBottom: "1rem" }}>
          Send announcements to all users from the System Notifications page.
        </p>
        <Link href="/admin/system-notifications">
          <button className="btn btn-secondary">Open System Notifications</button>
        </Link>
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-1)" }}>
          <Globe size={18} style={{ color: "var(--color-primary)" }} /> Platform Configuration
          <span className="badge badge-neutral" style={{ marginLeft: "0.25rem" }}>Coming soon</span>
        </h3>
        <p style={{ fontSize: "0.9rem", color: "var(--color-text-2)", marginBottom: "1rem" }}>
          Maintenance mode and platform branding require backend support that is not implemented yet.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", opacity: 0.5 }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--color-text-1)" }}>
            <input type="checkbox" disabled style={{ width: 16, height: 16 }} />
            <span>Maintenance mode (lock platform for non-admins)</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--color-text-1)" }}>
            <input type="checkbox" disabled style={{ width: 16, height: 16 }} />
            <span><Shield size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />Enforce 2FA for all administrators</span>
          </label>
        </div>
      </div>
    </div>
  );
}

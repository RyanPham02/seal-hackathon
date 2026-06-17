"use client";
import Link from "next/link";
import { User, Lock, Bell, SunMoon } from "lucide-react";

// Honest settings page: it only lists what actually works today and points
// to the real flows (profile/password live on the Profile page, theme lives
// in the top bar). Server-side preferences are clearly marked as coming soon
// instead of pretending to save.
export default function SettingsPage() {
  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-1)" }}>
          <User size={18} style={{ color: "var(--color-primary)" }} /> Account
        </h3>
        <p style={{ fontSize: "0.9rem", color: "var(--color-text-2)", marginBottom: "1rem" }}>
          Your name, avatar, developer profile, and password are managed on your profile page.
        </p>
        <Link href="/dashboard/profile">
          <button className="btn btn-primary"><Lock size={15} /> Open Profile &amp; Password</button>
        </Link>
      </div>

      <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-1)" }}>
          <SunMoon size={18} style={{ color: "var(--color-primary)" }} /> Appearance
        </h3>
        <p style={{ fontSize: "0.9rem", color: "var(--color-text-2)", margin: 0 }}>
          Switch between dark and light mode with the sun/moon button in the top bar.
          Your choice is remembered on this device.
        </p>
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-1)" }}>
          <Bell size={18} style={{ color: "var(--color-primary)" }} /> Email Notifications
          <span className="badge badge-neutral" style={{ marginLeft: "0.25rem" }}>Coming soon</span>
        </h3>
        <p style={{ fontSize: "0.9rem", color: "var(--color-text-2)", marginBottom: "1rem" }}>
          Per-event email preferences are not available yet. In-app notifications are always on —
          check the bell icon in the top bar.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", opacity: 0.5 }}>
          {["Team invitations", "Event updates", "Submission results"].map(item => (
            <label key={item} style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--color-text-1)" }}>
              <input type="checkbox" disabled style={{ width: 16, height: 16 }} />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { User, Save, Upload, Mail, GraduationCap, Phone, Lock } from "lucide-react";
import { App } from "antd";
import { CurrentUser, apiRequest, fetchCurrentUser } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { PASSWORD_PATTERN, PASSWORD_RULE_MESSAGE } from "@/lib/constants";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export default function AdminProfilePage() {
  const { message } = App.useApp();
  const { refresh } = useAuth();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
        setAvatarUrl(localStorage.getItem(`avatar_${currentUser.email}`));
      })
      .catch((err) => message.error(err instanceof Error ? err.message : "Could not load profile."))
      .finally(() => setLoading(false));
  }, [message]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      await apiRequest<CurrentUser>("/Auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          fullName: user.fullName,
          phoneNumber: user.phoneNumber || null,
          studentCode: user.studentCode || null,
        }),
      });

      // Re-source from /Auth/me so the local user state never trusts a
      // hand-crafted client object — the cookie-backed server is the truth.
      const refreshed = await refresh();
      if (refreshed) setUser(refreshed);
      message.success("Profile updated successfully.");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > MAX_AVATAR_BYTES) {
      message.error("Avatar image must be smaller than 2 MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      try {
        localStorage.setItem(`avatar_${user.email}`, dataUrl);
      } catch {
        message.error("Could not save the avatar — local storage is full. Try a smaller image.");
        return;
      }
      setAvatarUrl(dataUrl);
      window.dispatchEvent(new Event("storage"));
      message.success("Avatar updated successfully.");
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      message.error("Password confirmation does not match.");
      return;
    }

    if (!PASSWORD_PATTERN.test(passwordForm.newPassword)) {
      message.error(PASSWORD_RULE_MESSAGE);
      return;
    }

    setSaving(true);
    try {
      await apiRequest("/Auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      message.success("Password changed successfully.");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <span className="spinner" />
        <div className="empty-title">Loading profile</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ maxWidth: 1100 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Profile</h1>
          <p className="page-subtitle">Manage your administrator account through the backend profile API</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div className="glass-card" style={{ flex: "1 1 250px", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", textAlign: "center" }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--color-primary)", padding: 4, background: "rgba(255,255,255,0.05)" }} />
          ) : (
            <div className="avatar-placeholder" style={{ width: 120, height: 120, fontSize: "3rem", borderRadius: "50%" }}>
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 style={{ fontSize: "1.2rem", margin: "0.25rem 0" }}>{user.fullName}</h3>
            <span className="badge badge-primary">{user.role}</span>
          </div>
          <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer", marginTop: "0.5rem" }}>
            <Upload size={14} /> Change Avatar
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
          </label>
        </div>

        <div className="glass-card" style={{ flex: "2 1 420px" }}>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label"><User size={13} style={{ display: "inline", marginRight: 4 }} /> Full Name</label>
                <input className="form-input" value={user.fullName || ""} onChange={(e) => setUser({ ...user, fullName: e.target.value, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label"><Mail size={13} style={{ display: "inline", marginRight: 4 }} /> Email Address</label>
                <input className="form-input" type="email" value={user.email || ""} disabled />
                <span className="form-hint">Email cannot be changed</span>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label"><Phone size={13} style={{ display: "inline", marginRight: 4 }} /> Phone Number</label>
                <input className="form-input" value={user.phoneNumber || ""} onChange={(e) => setUser({ ...user, phoneNumber: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label"><GraduationCap size={13} style={{ display: "inline", marginRight: 4 }} /> Staff/Student Code</label>
                <input className="form-input" value={user.studentCode || ""} onChange={(e) => setUser({ ...user, studentCode: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" /> : <><Save size={16} /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="glass-card" style={{ marginTop: "2rem" }}>
        <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
            <Lock size={18} /> Change Password
          </h3>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-input" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required />
            </div>
          </div>

          <div className="form-group" style={{ maxWidth: 380 }}>
            <label className="form-label">Confirm New Password</label>
            <input className="form-input" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-secondary" disabled={saving}>
              Change Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

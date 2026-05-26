"use client";
import { useState, useEffect } from "react";
import { User, Save, Upload, Mail, Book, GraduationCap, MapPin, Target } from "lucide-react";
import { App } from "antd";

export default function ProfilePage() {
  const { message } = App.useApp();
  const [user, setUser] = useState<any>({
    name: "Loading...",
    email: "",
    role: "Member",
    university: "",
    studentId: "",
    skills: "",
    bio: ""
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (stored) {
      try {
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
        setAvatarUrl(localStorage.getItem(`avatar_${parsedUser.email}`));
      } catch (e) {}
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("currentUser", JSON.stringify(user));
    message.success("Profile updated successfully!");
    // Dispatch a custom event to notify TopBar/Sidebar of changes
    window.dispatchEvent(new Event("storage"));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        localStorage.setItem(`avatar_${user.email}`, dataUrl);
        setAvatarUrl(dataUrl);
        // Force re-render of this component and others
        window.dispatchEvent(new Event("storage"));
        // Force local state update for immediate feedback
        setUser({ ...user, _t: Date.now() }); 
        message.success("Avatar updated successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Profile</h1>
          <p className="page-subtitle">View your administrator account information</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Avatar Section */}
        <div className="glass-card" style={{ flex: "1 1 250px", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", textAlign: "center" }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--color-primary)" }} />
          ) : (
            <div className="avatar-placeholder" style={{ width: 120, height: 120, fontSize: "2.5rem", borderRadius: "50%" }}>
              {user.name.charAt(0)}
            </div>
          )}
          <div>
            <h3 style={{ fontSize: "1.2rem", margin: "0.25rem 0" }}>{user.name}</h3>
            <span className="badge badge-primary">{user.role}</span>
          </div>
          <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
            <Upload size={14} /> Change Avatar
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
          </label>
        </div>

        {/* Profile Info Form */}
        <div className="glass-card" style={{ flex: "2 1 400px" }}>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label"><User size={13} style={{ display: 'inline', marginRight: 4 }} /> Full Name</label>
                <input className="form-input" value={user.name || ""} onChange={(e) => setUser({ ...user, name: e.target.value })} required disabled={user.role === "Admin"} />
              </div>
              <div className="form-group">
                <label className="form-label"><Mail size={13} style={{ display: 'inline', marginRight: 4 }} /> Email Address</label>
                <input className="form-input" type="email" value={user.email || ""} disabled />
                <span className="form-hint">Email cannot be changed</span>
              </div>
            </div>

            {user.role === "Admin" ? (
              <div style={{ marginTop: "1rem", color: "var(--color-rose)", fontSize: "0.85rem", textAlign: "right" }}>
                Administrator profile cannot be modified.
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

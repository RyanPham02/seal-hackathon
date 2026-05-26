"use client";
import { useState } from "react";
import { ChevronLeft, Users, UserPlus, LogOut, Crown, Mail, UserMinus, Target, CheckCircle } from "lucide-react";
import Link from "next/link";

const TEAM = {
  id: 1, name: "CodeCraft", track: "AI & Machine Learning", status: "active",
  event: "SEAL Spring 2026", registeredAt: "Apr 10, 2026",
  members: [
    { id: 1, name: "Nguyen Van A", email: "a.nv@fpt.edu.vn",   role: "Leader", university: "FPT",  studentId: "SE123456", joined: "Apr 10" },
    { id: 2, name: "Le Thi B",     email: "b.lt@fpt.edu.vn",   role: "Member", university: "FPT",  studentId: "SE123457", joined: "Apr 10" },
    { id: 3, name: "Tran Van C",   email: "c.tv@hcmut.edu.vn", role: "Member", university: "HCMUT",studentId: "1910xxx",  joined: "Apr 11" },
    { id: 4, name: "Pham Thi D",   email: "d.pt@fpt.edu.vn",   role: "Member", university: "FPT",  studentId: "SE123459", joined: "Apr 11" },
  ],
};

export default function TeamDetailPage({ params }: { params: { id: string } }) {
  const [tab, setTab] = useState("members");
  const [inviteEmail, setInviteEmail] = useState("");

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link href="/dashboard/teams"><button className="btn btn-ghost btn-sm btn-icon"><ChevronLeft size={16} /></button></Link>
            <h1 className="page-title">{TEAM.name}</h1>
            <span className="badge badge-success">Active</span>
          </div>
          <p className="page-subtitle">
            <Target size={13} style={{ marginRight: 4 }} />{TEAM.track} · {TEAM.event}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: "2rem" }}>
        {[
          { label: "Members",     val: TEAM.members.length,                                                          color: "#6366f1" },
          { label: "FPT Students",val: TEAM.members.filter(m => m.university==="FPT").length,                       color: "#10b981" },
          { label: "External",    val: TEAM.members.filter(m => m.university!=="FPT").length,                       color: "#f59e0b" },
          { label: "Available Slots", val: 5 - TEAM.members.length,                                                  color: "#06b6d4" },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-display)", color: s.color }}>{s.val}</div>
            <div style={{ fontSize: "0.82rem", color: "var(--color-text-3)", fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="tabs" style={{ marginBottom: "1.5rem" }}>
        {["members","invite","track"].map(t => (
          <button key={t} className={`tab-btn ${tab===t?"active":""}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {/* Members Tab */}
      {tab === "members" && (
        <div className="glass-card">
          <div className="section-header" style={{ marginBottom: "1rem" }}>
            <span className="section-title"><Users size={15} /> Team Members</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {TEAM.members.map(m => (
              <div key={m.id} style={{
                display: "flex", alignItems: "center", gap: "1rem",
                padding: "0.9rem 1rem",
                background: "rgba(15,23,42,0.5)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
              }}>
                <div className="avatar-placeholder" style={{ width: 40, height: 40, fontSize: "0.9rem", flexShrink: 0 }}>
                  {m.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                    <strong style={{ fontSize: "0.875rem" }}>{m.name}</strong>
                    {m.role === "Leader" && (
                      <span className="badge badge-warning" style={{ fontSize: "0.68rem" }}><Crown size={9} /> Leader</span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>
                    {m.email} · {m.university} ({m.studentId})
                  </div>
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>Joined {m.joined}</span>
                {m.role !== "Leader" && (
                  <button className="btn btn-danger btn-sm btn-icon" title="Kick member">
                    <UserMinus size={13} />
                  </button>
                )}
                {m.role === "Member" && (
                  <button className="btn btn-ghost btn-sm" title="Leave team">
                    <LogOut size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Tab */}
      {tab === "invite" && (
        <div className="glass-card" style={{ maxWidth: 520 }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Invite Member</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-2)", marginBottom: "1.5rem" }}>
            Send an invitation to a student&apos;s email address
          </p>
          {TEAM.members.length >= 5 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-3)" }}>
              <Users size={40} style={{ opacity: 0.3, display: "block", margin: "0 auto 1rem" }} />
              Team is full (5/5 members)
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <input className="form-input" type="email" placeholder="student@university.edu"
                    value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                  <button className="btn btn-primary" disabled={!inviteEmail}>
                    <UserPlus size={15} /> Invite
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select">
                  <option>Member</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Track Tab */}
      {tab === "track" && (
        <div className="glass-card" style={{ maxWidth: 520 }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "1.5rem" }}>Track Registration</h3>
          <div style={{
            padding: "1.25rem", background: "rgba(99,102,241,0.06)",
            border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-md)",
            marginBottom: "1.25rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <CheckCircle size={20} style={{ color: "#10b981" }} />
              <div>
                <div style={{ fontWeight: 700 }}>Currently Registered</div>
                <div style={{ fontSize: "0.82rem", color: "var(--color-text-2)", marginTop: "0.2rem" }}>
                  {TEAM.track} · {TEAM.event}
                </div>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Switch Track</label>
            <select className="form-select">
              <option>AI & Machine Learning (current)</option>
              <option>Web Development</option>
              <option>Mobile App</option>
              <option>Open Innovation</option>
            </select>
            <span className="form-hint">Track changes are only allowed before the registration deadline</span>
          </div>
          <button className="btn btn-primary" style={{ marginTop: "1rem" }}>Update Track</button>
        </div>
      )}
    </div>
  );
}

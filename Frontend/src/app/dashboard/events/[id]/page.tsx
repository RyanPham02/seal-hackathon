"use client";
import { useState } from "react";
import { ChevronLeft, Users, Target, UserCheck, Clock, Trophy, Edit2, Shield, Zap } from "lucide-react";
import Link from "next/link";

const EVENT = {
  id: 1, name: "SEAL Spring 2026", season: "Spring", year: 2026, status: "active",
  description: "Annual academic hackathon focusing on innovative software engineering solutions.",
  registrationDeadline: "Apr 20, 2026",
  rounds: [
    { id: 1, name: "Qualifying Round", status: "active",   topN: 10, deadline: "May 15, 2026", teams: 22, submissions: 18 },
    { id: 2, name: "Grand Finals",     status: "upcoming", topN: 5,  deadline: "May 30, 2026", teams: 0,  submissions: 0  },
  ],
  tracks: [
    { id: 1, name: "AI & Machine Learning", teams: 8, mentor: "Dr. Nguyen Van A", color: "#6366f1" },
    { id: 2, name: "Web Development",       teams: 6, mentor: "Dr. Le Thi B",     color: "#8b5cf6" },
    { id: 3, name: "Mobile App",            teams: 5, mentor: "Dr. Tran Van C",   color: "#06b6d4" },
    { id: 4, name: "Open Innovation",       teams: 3, mentor: "Unassigned",       color: "#f59e0b" },
  ],
  judges: [
    { name: "Prof. Nguyen Van X", type: "Internal", tracks: ["AI & ML"], status: "active" },
    { name: "Dr. Le Thi Y",       type: "Internal", tracks: ["Web Dev"], status: "active" },
    { name: "Mr. Tran Z",         type: "Guest",    tracks: ["Mobile"],  status: "pending" },
  ],
};

const STATUS_ROUND: Record<string, string> = { active: "badge-success", upcoming: "badge-primary", ended: "badge-neutral" };

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const [tab, setTab] = useState("overview");

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link href="/dashboard/events"><button className="btn btn-ghost btn-sm btn-icon"><ChevronLeft size={16} /></button></Link>
            <h1 className="page-title">{EVENT.name}</h1>
            <span className="badge badge-success">Live</span>
          </div>
          <p className="page-subtitle">{EVENT.description}</p>
        </div>
        <button className="btn btn-secondary"><Edit2 size={15} /> Edit Event</button>
      </div>

      {/* Quick Stats */}
      <div className="grid-4" style={{ marginBottom: "2rem" }}>
        {[
          { icon: Target, label: "Tracks",  val: EVENT.tracks.length,   color: "#6366f1" },
          { icon: Users,  label: "Teams",   val: EVENT.rounds[0].teams, color: "#8b5cf6" },
          { icon: UserCheck,label:"Judges", val: EVENT.judges.length,   color: "#06b6d4" },
          { icon: Clock,  label: "Rounds",  val: EVENT.rounds.length,   color: "#f59e0b" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: `${s.color}22` }}>
                <Icon size={20} style={{ color: s.color }} />
              </div>
              <div>
                <div className="stat-value" style={{ background: "none", WebkitTextFillColor: s.color, color: s.color }}>{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: "1.5rem" }}>
        {["overview","rounds","tracks","judges"].map(t => (
          <button key={t} className={`tab-btn ${tab===t?"active":""}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="grid-2">
          <div className="glass-card">
            <h4 style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "var(--color-text-2)" }}>KEY DATES</h4>
            {[
              { label: "Registration Deadline", val: EVENT.registrationDeadline },
              { label: "Qualifying Deadline",   val: EVENT.rounds[0].deadline },
              { label: "Finals Deadline",       val: EVENT.rounds[1].deadline },
            ].map(d => (
              <div key={d.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--color-border)", fontSize: "0.875rem" }}>
                <span style={{ color: "var(--color-text-2)" }}>{d.label}</span>
                <strong>{d.val}</strong>
              </div>
            ))}
          </div>
          <div className="glass-card">
            <h4 style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "var(--color-text-2)" }}>SUBMISSION PROGRESS</h4>
            {EVENT.rounds.map(r => (
              <div key={r.id} style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.4rem" }}>
                  <span style={{ fontWeight: 600 }}>{r.name}</span>
                  <span style={{ color: "var(--color-text-3)" }}>{r.submissions}/{r.teams} submitted</span>
                </div>
                <div className="progress">
                  <div className="progress-fill" style={{ width: r.teams > 0 ? `${(r.submissions/r.teams)*100}%` : "0%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rounds */}
      {tab === "rounds" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {EVENT.rounds.map((r, i) => (
            <div key={r.id} className="glass-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.85rem" }}>{i+1}</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{r.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-3)" }}>Deadline: {r.deadline}</div>
                  </div>
                </div>
                <span className={`badge ${STATUS_ROUND[r.status]}`}>{r.status.charAt(0).toUpperCase()+r.status.slice(1)}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", fontSize: "0.82rem" }}>
                <div><span style={{ color: "var(--color-text-3)" }}>Teams:</span> <strong>{r.teams}</strong></div>
                <div><span style={{ color: "var(--color-text-3)" }}>Submissions:</span> <strong>{r.submissions}</strong></div>
                <div><span style={{ color: "var(--color-text-3)" }}>Advance Top:</span> <strong>{r.topN}</strong></div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <Link href={`/dashboard/judging`}><button className="btn btn-secondary btn-sm">View Scores</button></Link>
                <Link href={`/dashboard/rankings`}><button className="btn btn-ghost btn-sm"><Trophy size={13}/> Rankings</button></Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tracks */}
      {tab === "tracks" && (
        <div className="grid-2">
          {EVENT.tracks.map(tr => (
            <Link key={tr.id} href={`/dashboard/tracks/${tr.id}`} style={{ textDecoration: "none" }}>
              <div className="glass-card" style={{ borderTop: `3px solid ${tr.color}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>{tr.name}</h4>
                  <span className="badge badge-primary"><Users size={10} /> {tr.teams}</span>
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--color-text-2)" }}>
                  <Zap size={12} style={{ color: tr.color, marginRight: 4 }} />Mentor: <strong style={{ color: tr.mentor === "Unassigned" ? "var(--color-rose)" : "var(--color-text)" }}>{tr.mentor}</strong>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Judges */}
      {tab === "judges" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
            <button className="btn btn-primary btn-sm"><UserCheck size={14} /> Assign Judge</button>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr>
                <th>Judge</th><th>Type</th><th>Tracks</th><th>Status</th><th>Action</th>
              </tr></thead>
              <tbody>
                {EVENT.judges.map((j, i) => (
                  <tr key={i}>
                    <td className="table-cell-primary"><div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <div className="avatar-placeholder" style={{ width: 30, height: 30, fontSize: "0.75rem" }}>{j.name[0]}</div>{j.name}
                    </div></td>
                    <td><span className={`badge ${j.type==="Internal"?"badge-cyan":"badge-warning"}`}><Shield size={10} /> {j.type}</span></td>
                    <td><div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>{j.tracks.map(t => <span key={t} className="badge badge-neutral">{t}</span>)}</div></td>
                    <td><span className={`badge ${j.status==="active"?"badge-success":"badge-warning"}`}>{j.status}</span></td>
                    <td><button className="btn btn-ghost btn-sm">Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useState } from "react";
import { Plus, Search, Users, Zap, ChevronRight, UserCheck } from "lucide-react";
import Link from "next/link";

const TEAMS = [
  { id: 1, name: "CodeCraft",    leader: "Nguyen Van A", members: 4, track: "AI & Machine Learning", status: "active",   university: "FPT",      submission: true },
  { id: 2, name: "InnovateSEAL", leader: "Le Thi B",     members: 3, track: "Web Development",       status: "active",   university: "Mixed",    submission: true },
  { id: 3, name: "AlphaCoders",  leader: "Tran Van C",   members: 5, track: "Mobile App",            status: "active",   university: "External", submission: false },
  { id: 4, name: "ByteBuilders", leader: "Pham Van D",   members: 4, track: "Open Innovation",       status: "active",   university: "FPT",      submission: false },
  { id: 5, name: "TechVision",   leader: "Vu Thi E",     members: 3, track: "AI & Machine Learning", status: "pending",  university: "FPT",      submission: false },
  { id: 6, name: "DevForge",     leader: "Hoang Van F",  members: 4, track: "Web Development",       status: "pending",  university: "External", submission: false },
];

const UNI_COLOR: Record<string, string> = { FPT: "badge-primary", Mixed: "badge-cyan", External: "badge-warning" };

export default function TeamsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = TEAMS.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.leader.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" ? true : filter === "pending" ? t.status === "pending" : filter === "submitted" ? t.submission : true;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Management</h1>
          <p className="page-subtitle">{TEAMS.length} teams · {TEAMS.filter(t => t.status === "pending").length} pending approval</p>
        </div>
        <Link href="/dashboard/teams/create">
          <button className="btn btn-primary"><Plus size={16} /> Create Team</button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: "2rem" }}>
        {[
          { label: "Total Teams",     val: TEAMS.length,                                 color: "#6366f1" },
          { label: "Active Teams",    val: TEAMS.filter(t=>t.status==="active").length,  color: "#10b981" },
          { label: "Submitted",       val: TEAMS.filter(t=>t.submission).length,         color: "#06b6d4" },
          { label: "Pending Approval",val: TEAMS.filter(t=>t.status==="pending").length, color: "#f59e0b" },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-display)", color: s.color }}>{s.val}</div>
            <div style={{ fontSize: "0.82rem", color: "var(--color-text-3)", fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
          <Search size={15} style={{ color: "var(--color-text-3)" }} />
          <input className="search-input" placeholder="Search teams or leaders…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="tabs">
          {[{k:"all",l:"All"},{k:"pending",l:"Pending"},{k:"submitted",l:"Submitted"}].map(f => (
            <button key={f.k} className={`tab-btn ${filter===f.k?"active":""}`} onClick={() => setFilter(f.k)}>{f.l}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead><tr>
            <th>Team</th><th>Leader</th><th>Members</th><th>Track</th><th>University</th><th>Submission</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id}>
                <td className="table-cell-primary">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div className="avatar-placeholder" style={{ width: 30, height: 30, fontSize: "0.72rem" }}>
                      {t.name.substring(0,2).toUpperCase()}
                    </div>
                    {t.name}
                  </div>
                </td>
                <td>{t.leader}</td>
                <td><span className="badge badge-neutral"><Users size={10} /> {t.members}</span></td>
                <td><span style={{ fontSize: "0.8rem" }}>{t.track}</span></td>
                <td><span className={`badge ${UNI_COLOR[t.university]}`}>{t.university}</span></td>
                <td>
                  {t.submission
                    ? <span className="badge badge-success">Submitted</span>
                    : <span className="badge badge-neutral">Pending</span>}
                </td>
                <td>
                  <span className={`badge ${t.status==="active"?"badge-success":"badge-warning"}`}>
                    {t.status.charAt(0).toUpperCase()+t.status.slice(1)}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <Link href={`/dashboard/teams/${t.id}`}>
                      <button className="btn btn-ghost btn-sm">View <ChevronRight size={12} /></button>
                    </Link>
                    {t.status === "pending" && (
                      <button className="btn btn-primary btn-sm"><UserCheck size={13} /> Approve</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <Users size={48} className="empty-icon" />
          <div className="empty-title">No teams found</div>
          <div className="empty-desc">Try adjusting your search or filter</div>
        </div>
      )}
    </div>
  );
}

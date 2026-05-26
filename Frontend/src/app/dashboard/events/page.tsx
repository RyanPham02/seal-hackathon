"use client";
import { useState } from "react";
import { Plus, Calendar, Users, Target, Clock, Search, Filter, ChevronRight, Zap, MoreVertical } from "lucide-react";
import Link from "next/link";

const EVENTS = [
  { id: 1, name: "SEAL Spring 2026",  season: "Spring", year: 2026, status: "active",   tracks: 4, teams: 22, judges: 8,  rounds: 2, startDate: "Apr 01", endDate: "May 30" },
  { id: 2, name: "SEAL Summer 2026",  season: "Summer", year: 2026, status: "upcoming", tracks: 3, teams: 0,  judges: 0,  rounds: 2, startDate: "Jun 15", endDate: "Aug 10" },
  { id: 3, name: "SEAL Fall 2025",    season: "Fall",   year: 2025, status: "ended",    tracks: 4, teams: 26, judges: 10, rounds: 2, startDate: "Oct 01", endDate: "Dec 01" },
  { id: 4, name: "SEAL Summer 2025",  season: "Summer", year: 2025, status: "ended",    tracks: 3, teams: 18, judges: 6,  rounds: 2, startDate: "Jun 10", endDate: "Aug 05" },
  { id: 5, name: "SEAL Spring 2025",  season: "Spring", year: 2025, status: "ended",    tracks: 4, teams: 20, judges: 8,  rounds: 2, startDate: "Mar 20", endDate: "May 25" },
];

const STATUS_BADGE: Record<string, string> = {
  active: "badge-success", upcoming: "badge-primary", ended: "badge-neutral",
};
const SEASON_COLOR: Record<string, string> = {
  Spring: "#10b981", Summer: "#f59e0b", Fall: "#f43f5e",
};

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = EVENTS.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" ? true : e.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hackathon Events</h1>
          <p className="page-subtitle">{EVENTS.length} events · {EVENTS.filter(e => e.status === "active").length} active</p>
        </div>
        <Link href="/dashboard/events/create">
          <button className="btn btn-primary"><Plus size={16} /> Create Event</button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid-4" style={{ marginBottom: "2rem" }}>
        {[
          { label: "Total Events",    value: EVENTS.length,                            color: "#6366f1" },
          { label: "Active Events",   value: EVENTS.filter(e=>e.status==="active").length,  color: "#10b981" },
          { label: "Total Teams",     value: EVENTS.reduce((s,e) => s+e.teams, 0),    color: "#8b5cf6" },
          { label: "Total Judges",    value: EVENTS.reduce((s,e) => s+e.judges, 0),   color: "#f59e0b" },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-display)", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.82rem", color: "var(--color-text-3)", fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
          <Search size={15} style={{ color: "var(--color-text-3)" }} />
          <input className="search-input" placeholder="Search events…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="tabs">
          {["all","active","upcoming","ended"].map(f => (
            <button key={f} className={`tab-btn ${filter===f?"active":""}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid-2">
        {filtered.map(ev => (
          <div key={ev.id} className="glass-card" style={{ position: "relative" }}>
            {/* Season accent */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg, ${SEASON_COLOR[ev.season]}, transparent)`,
              borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
            }} />

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.3rem" }}>{ev.name}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className={`badge ${STATUS_BADGE[ev.status]}`}>{ev.status.charAt(0).toUpperCase()+ev.status.slice(1)}</span>
                  <span className="badge badge-neutral"><Zap size={10} style={{ color: SEASON_COLOR[ev.season] }} /> {ev.season} {ev.year}</span>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm"><MoreVertical size={15} /></button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
              {[
                { icon: Target, label: "Tracks",  val: ev.tracks  },
                { icon: Users,  label: "Teams",   val: ev.teams   },
                { icon: Filter, label: "Rounds",  val: ev.rounds  },
                { icon: Clock,  label: "Judges",  val: ev.judges  },
              ].map(m => {
                const Icon = m.icon;
                return (
                  <div key={m.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: "var(--color-text-2)" }}>
                    <Icon size={13} style={{ color: "var(--color-text-3)" }} />
                    <span style={{ color: "var(--color-text-3)" }}>{m.label}:</span>
                    <strong style={{ color: "var(--color-text)" }}>{m.val}</strong>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
              <span style={{ fontSize: "0.76rem", color: "var(--color-text-3)" }}>
                <Calendar size={11} style={{ marginRight: 4 }} />{ev.startDate} → {ev.endDate}
              </span>
              <Link href={`/dashboard/events/${ev.id}`}>
                <button className="btn btn-secondary btn-sm">
                  Manage <ChevronRight size={13} />
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <Calendar size={48} className="empty-icon" />
          <div className="empty-title">No events found</div>
          <div className="empty-desc">Try adjusting your search or filter</div>
        </div>
      )}
    </div>
  );
}

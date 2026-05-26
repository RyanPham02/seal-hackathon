"use client";
import { useState } from "react";
import { Target, Clock, CheckCircle, AlertCircle, ChevronRight, Filter } from "lucide-react";
import Link from "next/link";

const QUEUE = [
  { id: 1, team: "CodeCraft",    track: "AI & ML",    round: "Qualifying", status: "pending",   deadline: "May 15" },
  { id: 2, team: "InnovateSEAL", track: "Web Dev",    round: "Qualifying", status: "scored",    deadline: "May 15" },
  { id: 3, team: "AlphaCoders",  track: "Mobile App", round: "Qualifying", status: "pending",   deadline: "May 15" },
  { id: 4, team: "ByteBuilders", track: "Open Innov", round: "Qualifying", status: "pending",   deadline: "May 15" },
  { id: 5, team: "TechVision",   track: "AI & ML",    round: "Qualifying", status: "locked",    deadline: "May 15" },
];

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <AlertCircle size={14} style={{ color: "#f59e0b" }} />,
  scored:  <Clock size={14} style={{ color: "#06b6d4" }} />,
  locked:  <CheckCircle size={14} style={{ color: "#10b981" }} />,
};

export default function JudgingQueuePage() {
  const [filter, setFilter] = useState("all");
  const filtered = QUEUE.filter(q => filter === "all" ? true : q.status === filter);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Scoring Queue</h1>
          <p className="page-subtitle">{QUEUE.filter(q => q.status === "pending").length} submissions awaiting your score</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid-3" style={{ marginBottom: "2rem" }}>
        {[
          { label: "Pending",  val: QUEUE.filter(q=>q.status==="pending").length, color: "#f59e0b" },
          { label: "In Draft", val: QUEUE.filter(q=>q.status==="scored").length,  color: "#06b6d4" },
          { label: "Locked",   val: QUEUE.filter(q=>q.status==="locked").length,  color: "#10b981" },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-display)", color: s.color }}>{s.val}</div>
            <div style={{ fontSize: "0.82rem", color: "var(--color-text-3)", fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="tabs" style={{ marginBottom: "1.5rem" }}>
        {["all","pending","scored","locked"].map(f => (
          <button key={f} className={`tab-btn ${filter===f?"active":""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {filtered.map(q => (
          <div key={q.id} className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem" }}>
            {STATUS_ICON[q.status]}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{q.team}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--color-text-3)", marginTop: "0.15rem" }}>
                {q.track} · {q.round} · Deadline: {q.deadline}
              </div>
            </div>
            <span className={`badge ${q.status==="pending"?"badge-warning":q.status==="locked"?"badge-success":"badge-cyan"}`}>
              {q.status.charAt(0).toUpperCase()+q.status.slice(1)}
            </span>
            <Link href={`/dashboard/judging/${q.id}`}>
              <button className={`btn btn-sm ${q.status==="locked"?"btn-ghost":"btn-primary"}`} disabled={q.status==="locked"}>
                {q.status==="locked" ? "Locked" : q.status==="scored" ? "Continue →" : "Score Now"} <ChevronRight size={13} />
              </button>
            </Link>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <Target size={48} className="empty-icon" />
          <div className="empty-title">No submissions in queue</div>
          <div className="empty-desc">You&apos;re all caught up!</div>
        </div>
      )}
    </div>
  );
}

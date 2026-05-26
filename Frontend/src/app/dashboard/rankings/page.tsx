"use client";
import { useState } from "react";
import { Trophy, Medal, Award, Download, Filter, TrendingUp } from "lucide-react";

const RANKINGS = [
  { rank: 1,  team: "CodeCraft",    track: "AI & ML",    score: 92.4, judges: 3, status: "finalist" },
  { rank: 2,  team: "TechVision",   track: "AI & ML",    score: 89.1, judges: 3, status: "finalist" },
  { rank: 3,  team: "InnovateSEAL", track: "Web Dev",    score: 87.8, judges: 3, status: "finalist" },
  { rank: 4,  team: "ByteBuilders", track: "Open Innov", score: 85.2, judges: 2, status: "advancing" },
  { rank: 5,  team: "DevForge",     track: "Web Dev",    score: 83.9, judges: 3, status: "advancing" },
  { rank: 6,  team: "AlphaCoders",  track: "Mobile App", score: 81.3, judges: 2, status: "advancing" },
  { rank: 7,  team: "ByteWave",     track: "Mobile App", score: 78.5, judges: 3, status: "eliminated" },
  { rank: 8,  team: "NexaCode",     track: "Open Innov", score: 75.2, judges: 2, status: "eliminated" },
];

const RANK_ICON: Record<number, React.ReactNode> = {
  1: <Trophy size={16} style={{ color: "#f59e0b" }} />,
  2: <Medal  size={16} style={{ color: "#94a3b8" }} />,
  3: <Award  size={16} style={{ color: "#b45309" }} />,
};

const STATUS_BADGE: Record<string, string> = {
  finalist:   "badge-warning",
  advancing:  "badge-success",
  eliminated: "badge-danger",
};

export default function RankingsPage() {
  const [trackFilter, setTrackFilter] = useState("All");
  const tracks = ["All", "AI & ML", "Web Dev", "Mobile App", "Open Innov"];

  const filtered = RANKINGS.filter(r => trackFilter === "All" ? true : r.track === trackFilter);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Rankings & Leaderboard</h1>
          <p className="page-subtitle">SEAL Spring 2026 · Qualifying Round</p>
        </div>
        <button className="btn btn-secondary"><Download size={15} /> Export CSV</button>
      </div>

      {/* Top 3 Podium */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", alignItems: "flex-end", justifyContent: "center" }}>
        {/* 2nd */}
        <div className="glass-card" style={{ flex: 1, textAlign: "center", borderTop: "3px solid #94a3b8", paddingTop: "1.5rem" }}>
          <div style={{ fontSize: "2rem" }}>🥈</div>
          <div style={{ fontWeight: 700, marginTop: "0.5rem" }}>{RANKINGS[1].team}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>{RANKINGS[1].track}</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "var(--font-display)", color: "#94a3b8", marginTop: "0.5rem" }}>
            {RANKINGS[1].score}
          </div>
        </div>
        {/* 1st */}
        <div className="glass-card" style={{ flex: 1, textAlign: "center", borderTop: "3px solid #f59e0b", paddingTop: "2rem", transform: "translateY(-12px)", boxShadow: "0 0 30px rgba(245,158,11,0.2)" }}>
          <div style={{ fontSize: "2.5rem" }}>🏆</div>
          <div style={{ fontWeight: 800, fontSize: "1.1rem", marginTop: "0.5rem", background: "linear-gradient(135deg,#f59e0b,#fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {RANKINGS[0].team}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>{RANKINGS[0].track}</div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, fontFamily: "var(--font-display)", color: "#f59e0b", marginTop: "0.5rem" }}>
            {RANKINGS[0].score}
          </div>
        </div>
        {/* 3rd */}
        <div className="glass-card" style={{ flex: 1, textAlign: "center", borderTop: "3px solid #b45309", paddingTop: "1.5rem" }}>
          <div style={{ fontSize: "2rem" }}>🥉</div>
          <div style={{ fontWeight: 700, marginTop: "0.5rem" }}>{RANKINGS[2].team}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>{RANKINGS[2].track}</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "var(--font-display)", color: "#b45309", marginTop: "0.5rem" }}>
            {RANKINGS[2].score}
          </div>
        </div>
      </div>

      {/* Track filter */}
      <div className="tabs" style={{ marginBottom: "1.5rem" }}>
        {tracks.map(t => (
          <button key={t} className={`tab-btn ${trackFilter===t?"active":""}`} onClick={() => setTrackFilter(t)}>{t}</button>
        ))}
      </div>

      {/* Full Rankings Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead><tr>
            <th>Rank</th><th>Team</th><th>Track</th><th>Score</th><th>Judges</th><th>Score Bar</th><th>Status</th>
          </tr></thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.rank}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    {RANK_ICON[r.rank] || <span style={{ color: "var(--color-text-3)", fontWeight: 700 }}>#{r.rank}</span>}
                    {r.rank <= 3 && <span style={{ fontWeight: 800, color: r.rank===1?"#f59e0b":r.rank===2?"#94a3b8":"#b45309" }}>#{r.rank}</span>}
                  </div>
                </td>
                <td className="table-cell-primary">{r.team}</td>
                <td><span className="badge badge-neutral">{r.track}</span></td>
                <td>
                  <span style={{ fontWeight: 800, fontSize: "1rem", fontFamily: "var(--font-display)", color: r.score >= 90 ? "#10b981" : r.score >= 80 ? "#f59e0b" : "#f43f5e" }}>
                    {r.score}
                  </span>
                </td>
                <td>{r.judges}</td>
                <td style={{ minWidth: 120 }}>
                  <div className="progress">
                    <div className="progress-fill" style={{ width: `${r.score}%`, background: `linear-gradient(90deg, #6366f1, #8b5cf6)` }} />
                  </div>
                </td>
                <td><span className={`badge ${STATUS_BADGE[r.status]}`}>{r.status.charAt(0).toUpperCase()+r.status.slice(1)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

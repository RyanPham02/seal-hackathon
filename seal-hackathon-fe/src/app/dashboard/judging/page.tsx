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
  const [activeTab, setActiveTab] = useState("queue"); // "queue" or "calibration"
  const [filter, setFilter] = useState("all");
  const filtered = QUEUE.filter(q => filter === "all" ? true : q.status === filter);
  const [calibrationDone, setCalibrationDone] = useState(false);

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">Scoring & Evaluation</h1>
          <p className="page-subtitle">Evaluate teams based on the SEAL criteria</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <button className={`btn ${activeTab === "queue" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("queue")}>
          <Target size={16} /> Scoring Queue
        </button>
        <button className={`btn ${activeTab === "calibration" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("calibration")}>
          <Filter size={16} /> Calibration Room
        </button>
      </div>

      {activeTab === "calibration" && (
        <div className="glass-card">
          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Calibration Round</h3>
          <p style={{ color: "var(--color-text-2)", marginBottom: "1.5rem", fontSize: "0.9rem", lineHeight: 1.5 }}>
            To ensure high inter-rater reliability, all judges are required to score a sample baseline submission before grading real teams. 
            Once submitted, your score will be compared against the expert consensus to help you calibrate your expectations.
          </p>

          {!calibrationDone ? (
            <div style={{ background: "rgba(15,23,42,0.4)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
              <div style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "1rem" }}>Sample Project: "EcoTrack Mobile App"</div>
              <ul style={{ paddingLeft: "1.5rem", marginBottom: "1.5rem", color: "var(--color-text-2)", fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: 6 }}>
                <li><strong>Technical:</strong> React Native + Firebase. Basic CRUD works, but map integration is buggy.</li>
                <li><strong>Innovation:</strong> Concept is common (carbon footprint tracker), but gamification adds a nice touch.</li>
                <li><strong>Presentation:</strong> Slide deck was well structured, but the live demo crashed once.</li>
              </ul>
              <button className="btn btn-primary" onClick={() => setCalibrationDone(true)}>
                Score this sample
              </button>
            </div>
          ) : (
            <div style={{ background: "rgba(16,185,129,0.1)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--color-emerald)", fontWeight: 700, fontSize: "1.1rem", marginBottom: "1rem" }}>
                <CheckCircle size={20} /> Calibration Completed!
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-2)", marginBottom: "1rem" }}>
                Your scoring behavior was analyzed. You tend to score <strong>slightly harsher</strong> on "Presentation" compared to the expert baseline. Please keep this in mind during the real evaluation to maintain fairness.
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab("queue")}>
                Go to Scoring Queue →
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "queue" && (
        <>
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
              <div className="empty-desc">You're all caught up!</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

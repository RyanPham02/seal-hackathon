"use client";
import { useState } from "react";
import { Target, Clock, MessageSquare, Lock, CheckCircle, ChevronLeft, Send, AlertCircle } from "lucide-react";
import Link from "next/link";

const CRITERIA = [
  { id: 1, name: "Technical Implementation", weight: 30, description: "Quality of code, architecture, and technical decisions" },
  { id: 2, name: "Innovation & Creativity",  weight: 25, description: "Originality and creative approach to the problem" },
  { id: 3, name: "Presentation & Demo",       weight: 25, description: "Clarity of presentation and quality of demo" },
  { id: 4, name: "Code Quality",             weight: 20, description: "Code readability, documentation, and best practices" },
];

const SUBMISSION = {
  team: "CodeCraft", track: "AI & Machine Learning", round: "Qualifying Round",
  event: "SEAL Spring 2026", repoUrl: "https://github.com/codecraft/seal-project",
  demoUrl: "https://demo.codecraft.app", reportUrl: "https://docs.google.com/presentation/...",
  submittedAt: "May 10, 2026 14:30",
};

export default function JudgingScorePage({ params }: { params: { id: string } }) {
  const [scores, setScores]   = useState<Record<number,number>>({ 1: 75, 2: 80, 3: 70, 4: 85 });
  const [comment, setComment] = useState("");
  const [locked, setLocked]   = useState(false);
  const [saving, setSaving]   = useState(false);

  const weightedTotal = CRITERIA.reduce((sum, c) => sum + (scores[c.id] ?? 0) * (c.weight / 100), 0);

  const handleLock = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setLocked(true); }, 1200);
  };

  const getScoreColor = (s: number) => s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : "#f43f5e";

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link href="/dashboard/judging"><button className="btn btn-ghost btn-sm btn-icon"><ChevronLeft size={16} /></button></Link>
            <h1 className="page-title">Score Submission</h1>
          </div>
          <p className="page-subtitle">{SUBMISSION.team} · {SUBMISSION.track} · {SUBMISSION.round}</p>
        </div>
        {locked && <span className="badge badge-success" style={{ padding: "0.4rem 0.8rem" }}><Lock size={12} /> Scores Locked</span>}
      </div>

      {/* Submission Links */}
      <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
        <h4 style={{ fontSize: "0.9rem", marginBottom: "1rem", color: "var(--color-text-2)" }}>SUBMISSION LINKS</h4>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {[
            { label: "GitHub Repository", url: SUBMISSION.repoUrl },
            { label: "Live Demo",         url: SUBMISSION.demoUrl },
            { label: "Report / Slides",   url: SUBMISSION.reportUrl },
          ].map(l => (
            <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
              {l.label} ↗
            </a>
          ))}
        </div>
        <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--color-text-3)" }}>
          <Clock size={11} style={{ marginRight: 4 }} />Submitted: {SUBMISSION.submittedAt}
        </div>
      </div>

      {/* Criteria Scoring */}
      <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h4 style={{ fontSize: "0.95rem" }}>Scoring Criteria</h4>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-display)", color: getScoreColor(weightedTotal) }}>
              {weightedTotal.toFixed(1)}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>Weighted Total</div>
          </div>
        </div>

        {locked && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "1.25rem" }}>
            <CheckCircle size={16} style={{ color: "#34d399" }} />
            <span style={{ fontSize: "0.875rem", color: "#34d399" }}>Scores have been finalized and locked.</span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {CRITERIA.map(c => (
            <div key={c.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{c.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)", marginTop: "0.15rem" }}>{c.description}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                  <span className="badge badge-neutral">{c.weight}%</span>
                  <div style={{
                    minWidth: 52, textAlign: "center",
                    fontSize: "1.3rem", fontWeight: 800, fontFamily: "var(--font-display)",
                    color: getScoreColor(scores[c.id] ?? 0),
                  }}>
                    {scores[c.id] ?? 0}
                  </div>
                </div>
              </div>
              <input
                type="range" min="0" max="100" step="1"
                className="score-slider"
                disabled={locked}
                value={scores[c.id] ?? 0}
                onChange={e => setScores({ ...scores, [c.id]: +e.target.value })}
                style={{ background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${scores[c.id] ?? 0}%, rgba(148,163,184,0.15) ${scores[c.id] ?? 0}%, rgba(148,163,184,0.15) 100%)` }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--color-text-3)", marginTop: "0.25rem" }}>
                <span>0 – Poor</span><span>50 – Average</span><span>100 – Excellent</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comments */}
      <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <MessageSquare size={16} style={{ color: "var(--color-primary)" }} />
          <h4 style={{ fontSize: "0.95rem" }}>Feedback & Comments</h4>
        </div>
        <textarea
          className="form-textarea"
          rows={4}
          placeholder="Provide constructive feedback for the team…"
          disabled={locked}
          value={comment}
          onChange={e => setComment(e.target.value)}
        />
      </div>

      {/* Actions */}
      {!locked ? (
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary">
            <Send size={15} /> Save Draft
          </button>
          <button className="btn btn-primary" onClick={handleLock} disabled={saving}>
            {saving ? <span className="spinner" /> : <><Lock size={15} /> Finalize & Lock Scores</>}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "flex-end" }}>
          <AlertCircle size={15} style={{ color: "var(--color-text-3)" }} />
          <span style={{ fontSize: "0.82rem", color: "var(--color-text-3)" }}>Scores are locked and cannot be changed</span>
        </div>
      )}
    </div>
  );
}

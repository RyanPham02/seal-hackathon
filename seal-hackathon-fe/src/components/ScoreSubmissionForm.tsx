"use client";
import { useEffect, useState } from "react";
import { Clock, MessageSquare, Lock, CheckCircle, ChevronLeft, Send, AlertCircle } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import Link from "next/link";
import { App } from "antd";
import { apiRequest } from "@/lib/api";

type CriterionItem = {
  criteriaId: string;
  criteriaName: string;
  description?: string | null;
  weight: number;
  maxScore: number;
  scoreValue: number | null;
  comment?: string | null;
};

type EvaluationData = {
  submissionId: string;
  repositoryUrl?: string | null;
  demoUrl?: string | null;
  slideUrl?: string | null;
  submittedAt: string;
  isLocked: boolean;
  team?: { teamId: string; teamName: string; category: string } | null;
  round?: { roundId: string; roundName: string } | null;
  criteria: CriterionItem[];
};

interface ScoreSubmissionFormProps {
  submissionId: string;
  backHref: string;
  readOnly?: boolean;
}

export default function ScoreSubmissionForm({ submissionId, backHref, readOnly = false }: ScoreSubmissionFormProps) {
  const { message, modal } = App.useApp();

  const [data, setData] = useState<EvaluationData | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingAction, setSavingAction] = useState<null | "draft" | "final">(null);
  const saving = savingAction !== null;

  const isLocked = locked || readOnly;

  useEffect(() => {
    let active = true;

    apiRequest<EvaluationData>(`/judge/scores/evaluation/${submissionId}`)
      .then((res) => {
        if (!active) return;
        setData(res);
        setLocked(res.isLocked);

        const initScores: Record<string, number> = {};
        const initComments: Record<string, string> = {};
        res.criteria.forEach((c) => {
          initScores[c.criteriaId] = c.scoreValue ?? 0;
          initComments[c.criteriaId] = c.comment ?? "";
        });
        setScores(initScores);
        setComments(initComments);
      })
      .catch((err) => {
        if (!active) return;
        message.error(err instanceof Error ? err.message : "Failed to load evaluation data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [submissionId, message]);

  const handleSave = async (finalize: boolean) => {
    if (!data || saving) return;
    setSavingAction(finalize ? "final" : "draft");
    try {
      const payload = {
        submissionId: data.submissionId,
        finalize,
        scores: data.criteria.map((c) => ({
          criteriaId: c.criteriaId,
          scoreValue: scores[c.criteriaId] ?? 0,
          comment: comments[c.criteriaId] || null,
        })),
      };
      const res = await apiRequest<{ message: string }>("/judge/scores/evaluation", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      message.success(res.message);
      if (finalize) setLocked(true);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to save scores.");
    } finally {
      setSavingAction(null);
    }
  };

  const confirmFinalize = () => {
    modal.confirm({
      title: "Finalize and lock scores?",
      content: "Once finalized, scores cannot be changed. Make sure all criteria are scored and your feedback is complete.",
      okText: "Finalize & Lock",
      okButtonProps: { danger: true },
      onOk: () => handleSave(true),
    });
  };

  const getScoreColor = (s: number) => s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : "#f43f5e";

  if (loading) {
    return (
      <div className="empty-state">
        <span className="spinner" />
        <div className="empty-title">Loading evaluation…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="empty-state">
        <AlertCircle size={48} className="empty-icon" />
        <div className="empty-title">Evaluation not available</div>
        <div className="empty-desc">Could not load evaluation data. You may not be assigned as a judge for this submission.</div>
        <Link href={backHref}><button className="btn btn-secondary" style={{ marginTop: "1rem" }}>← Back to Queue</button></Link>
      </div>
    );
  }

  // Mirror the backend formula in SubmissionService.GetTeamSubmissions:
  // Σ ((score / maxScore) * weight). Falls back to 100 if maxScore is 0/missing
  // to avoid divide-by-zero — matches the radarMax fallback below.
  const weightedTotal = data.criteria.reduce((sum, c) => {
    const maxScore = Number(c.maxScore) || 100;
    const score = scores[c.criteriaId] ?? 0;
    return sum + (score / maxScore) * Number(c.weight);
  }, 0);

  // Scale the radar axis to the actual rubric instead of a hardcoded 0–100.
  const radarMax = data.criteria.length
    ? Math.max(...data.criteria.map((c) => Number(c.maxScore) || 0)) || 100
    : 100;

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link href={backHref}><button className="btn btn-ghost btn-sm btn-icon" aria-label="Back to queue"><ChevronLeft size={16} /></button></Link>
            <h1 className="page-title">Score Submission</h1>
          </div>
          <p className="page-subtitle">{data.team?.teamName ?? "Unknown Team"} · {data.team?.category ?? ""} · {data.round?.roundName ?? ""}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {readOnly && <span className="badge badge-neutral" style={{ padding: "0.4rem 0.8rem", background: "rgba(56,189,248,0.1)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.2)" }}>Read-Only</span>}
          {locked && <span className="badge badge-success" style={{ padding: "0.4rem 0.8rem" }}><Lock size={12} style={{ marginRight: 4 }} /> Scores Locked</span>}
        </div>
      </div>

      {/* Submission Links */}
      <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
        <h4 style={{ fontSize: "0.9rem", marginBottom: "1rem", color: "var(--color-text-2)" }}>SUBMISSION LINKS</h4>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {data.repositoryUrl && (
            <a href={data.repositoryUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
              GitHub Repository ↗
            </a>
          )}
          {data.demoUrl && (
            <a href={data.demoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
              Live Demo ↗
            </a>
          )}
          {data.slideUrl && (
            <a href={data.slideUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
              Report / Slides ↗
            </a>
          )}
          {!data.repositoryUrl && !data.demoUrl && !data.slideUrl && (
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-3)" }}>No links provided</span>
          )}
        </div>
        <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--color-text-3)" }}>
          <Clock size={11} style={{ marginRight: 4 }} />Submitted: {new Date(data.submittedAt).toLocaleString()}
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

        {isLocked && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: readOnly ? "rgba(56,189,248,0.08)" : "rgba(16,185,129,0.08)", border: readOnly ? "1px solid rgba(56,189,248,0.2)" : "1px solid rgba(16,185,129,0.2)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "1.25rem" }}>
            {readOnly ? <AlertCircle size={16} style={{ color: "#38bdf8" }} /> : <CheckCircle size={16} style={{ color: "#34d399" }} />}
            <span style={{ fontSize: "0.875rem", color: readOnly ? "#38bdf8" : "#34d399" }}>
              {readOnly ? "Viewing scores (Admin Read-Only)" : "Scores have been finalized and locked."}
            </span>
          </div>
        )}

        {data.criteria.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 1.5rem", textAlign: "center" }}>
            <AlertCircle size={40} style={{ color: "#f59e0b", marginBottom: "1rem" }} />
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-text-1)", marginBottom: "0.5rem" }}>
              No Scoring Criteria Configured
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-3)", maxWidth: 450, margin: 0 }}>
              This round doesn't have any criteria defined yet. An Admin must configure criteria for this round before scoring can begin.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "2rem" }}>
            {/* Sliders */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {data.criteria.map(c => (
                <div key={c.criteriaId}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{c.criteriaName}</div>
                      {c.description && <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)", marginTop: "0.15rem" }}>{c.description}</div>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                      <span className="badge badge-neutral">{Number(c.weight)}%</span>
                      <div style={{ minWidth: 52, textAlign: "center", fontSize: "1.3rem", fontWeight: 800, fontFamily: "var(--font-display)", color: getScoreColor(scores[c.criteriaId] ?? 0) }}>
                        {scores[c.criteriaId] ?? 0}
                      </div>
                    </div>
                  </div>
                  <input
                    type="range" min="0" max={Number(c.maxScore)} step="1"
                    className="score-slider"
                    aria-label={`Score for ${c.criteriaName}`}
                    disabled={isLocked}
                    value={scores[c.criteriaId] ?? 0}
                    onChange={e => setScores({ ...scores, [c.criteriaId]: +e.target.value })}
                    style={{ background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${((scores[c.criteriaId] ?? 0) / Number(c.maxScore)) * 100}%, rgba(148,163,184,0.15) ${((scores[c.criteriaId] ?? 0) / Number(c.maxScore)) * 100}%, rgba(148,163,184,0.15) 100%)` }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--color-text-3)", marginTop: "0.25rem" }}>
                    <span>0 – Poor</span><span>{Math.round(Number(c.maxScore) / 2)} – Average</span><span>{Number(c.maxScore)} – Excellent</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Radar Chart */}
            <div style={{ background: "var(--color-surface-2)", borderRadius: "var(--radius-md)", padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <h4 style={{ fontSize: "0.85rem", color: "var(--color-text-2)", marginBottom: "1rem", alignSelf: "flex-start" }}>SCORE DISTRIBUTION</h4>
              <div style={{ width: "100%", height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.criteria.map(c => ({ subject: c.criteriaName.split(" ")[0], A: scores[c.criteriaId] ?? 0, fullMark: Number(c.maxScore) }))}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--color-text-3)", fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, radarMax]} tick={false} axisLine={false} />
                    <Radar name="Score" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: "auto", fontSize: "0.75rem", color: "var(--color-text-3)", textAlign: "center" }}>
                Visual representation of team performance across criteria
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Per-criterion Comments */}
      {data.criteria.length > 0 && (
        <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <MessageSquare size={16} style={{ color: "var(--color-primary)" }} />
            <h4 style={{ fontSize: "0.95rem" }}>Feedback &amp; Comments</h4>
          </div>
          {data.criteria.map(c => (
            <div key={c.criteriaId} style={{ marginBottom: "1rem" }}>
              <label style={{ fontWeight: 600, fontSize: "0.82rem", display: "block", marginBottom: "0.35rem" }}>{c.criteriaName}</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder={isLocked ? "No feedback provided." : `Feedback for ${c.criteriaName}…`}
                disabled={isLocked}
                value={comments[c.criteriaId] ?? ""}
                onChange={e => setComments({ ...comments, [c.criteriaId]: e.target.value })}
              />
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {data.criteria.length > 0 && (!isLocked ? (
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={() => handleSave(false)} disabled={saving}>
            {savingAction === "draft" ? <span className="spinner" /> : <><Send size={15} /> Save Draft</>}
          </button>
          <button className="btn btn-primary" onClick={confirmFinalize} disabled={saving}>
            {savingAction === "final" ? <span className="spinner" /> : <><Lock size={15} /> Finalize &amp; Lock Scores</>}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "flex-end" }}>
          <AlertCircle size={15} style={{ color: "var(--color-text-3)" }} />
          <span style={{ fontSize: "0.82rem", color: "var(--color-text-3)" }}>
            {readOnly ? "Viewing scores (Admin Read-Only)" : "Scores are locked and cannot be changed"}
          </span>
        </div>
      ))}
    </div>
  );
}

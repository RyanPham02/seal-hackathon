"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Upload, Link as LinkIcon, GitBranch, Play, FileText, CheckCircle, AlertCircle, RefreshCw, Award, MessageSquare } from "lucide-react";
import { App } from "antd";
import { apiRequest, fetchCurrentUser } from "@/lib/api";

type TeamDto = {
  teamId: string;
  teamName: string;
  status: string;
  leaderId: string;
  category: {
    categoryId: string;
    categoryName: string;
    eventName?: string | null;
  };
  currentRound: {
    roundId: string;
    roundName: string;
    submissionDeadline?: string | null;
  } | null;
};

type CriterionFeedbackDto = {
  criteriaName: string;
  scoreValue: number;
  maxScore: number;
  weight: number;
  comment?: string | null;
};

type JudgeFeedbackDto = {
  judgeName: string;
  totalScore: number;
  criteria: CriterionFeedbackDto[];
};

type EvaluationDto = {
  isScored: boolean;
  averageScore: number;
  judges: JudgeFeedbackDto[];
};

type SubmissionDto = {
  submissionId: string;
  repositoryUrl?: string | null;
  demoUrl?: string | null;
  slideUrl?: string | null;
  round: {
    roundId: string;
    roundName: string;
  };
  evaluation?: EvaluationDto | null;
};

export default function SubmissionsPage() {
  const { message } = App.useApp();
  const [form, setForm] = useState({
    repositoryUrl: "",
    demoUrl: "",
    slideUrl: "",
    videoUrl: "",
    description: "",
    consent: false,
  });
  const [team, setTeam] = useState<TeamDto | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadSubmissionContext = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const [user, myTeam] = await Promise.all([
        fetchCurrentUser(),
        apiRequest<TeamDto>("/teams/my-team"),
      ]);

      setCurrentUserId(user.id);
      setTeam(myTeam);

      if (myTeam.currentRound) {
        const submissions = await apiRequest<SubmissionDto[]>(`/submissions/team/${myTeam.teamId}`);
        const currentSubmission = submissions.find((item) => item.round.roundId === myTeam.currentRound?.roundId);

        if (currentSubmission) {
          setIsSubmitted(true);
          setEvaluation(currentSubmission.evaluation?.isScored ? currentSubmission.evaluation : null);
          setForm((current) => ({
            ...current,
            repositoryUrl: currentSubmission.repositoryUrl ?? "",
            demoUrl: currentSubmission.demoUrl ?? "",
            slideUrl: currentSubmission.slideUrl ?? "",
            videoUrl: "",
          }));
        } else {
          setIsSubmitted(false);
          setEvaluation(null);
        }
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load submission context.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSubmissionContext();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!team) {
      message.error("You need a team before submitting.");
      return;
    }

    if (!team.currentRound) {
      message.error("Your team has no active round to submit for.");
      return;
    }

    if (team.leaderId !== currentUserId) {
      message.error("Only the team leader can submit the project.");
      return;
    }

    if (!form.repositoryUrl || !form.slideUrl) {
      message.error("GitHub repository and slide/report links are required.");
      return;
    }

    if (!form.consent) {
      message.error("You must agree to the Team Consent and Hackathon Rules.");
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest("/submissions", {
        method: "POST",
        body: JSON.stringify({
          TeamId: team.teamId,
          RoundId: team.currentRound.roundId,
          RepositoryUrl: form.repositoryUrl.trim(),
          DemoUrl: (form.demoUrl || form.videoUrl).trim() || null,
          SlideUrl: form.slideUrl.trim(),
        }),
      });

      message.success("Project submitted successfully.");
      setIsSubmitted(true);
      await loadSubmissionContext();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not submit project.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <span className="spinner" />
        <div className="empty-title">Loading submission</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="empty-state">
        <AlertCircle size={48} className="empty-icon" />
        <div className="empty-title">Submission is not ready</div>
        <div className="empty-desc">{loadError}</div>
        <button className="btn btn-secondary" onClick={loadSubmissionContext}>
          <RefreshCw size={15} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Project Submission</h1>
          <p className="page-subtitle">
            {team?.teamName} {team?.currentRound ? `- ${team.currentRound.roundName}` : ""}
          </p>
        </div>
        {isSubmitted && <span className="badge badge-success"><CheckCircle size={14} style={{ marginRight: 4 }} /> Submitted</span>}
      </div>

      {evaluation && (
        <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Award size={18} style={{ color: "var(--color-primary)" }} /> Score & Feedback
            </h3>
            <span className="badge badge-success" style={{ fontSize: "1rem", padding: "0.35rem 0.85rem" }}>
              {evaluation.averageScore.toFixed(2)} pts
            </span>
          </div>
          <p style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "var(--color-text-2)" }}>
            Your submission has been evaluated by {evaluation.judges.length} judge{evaluation.judges.length > 1 ? "s" : ""}.
            The overall score is the average of the judges&apos; weighted totals.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {evaluation.judges.map((judge, judgeIndex) => (
              <div key={judgeIndex} style={{ border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <strong style={{ fontSize: "0.9rem" }}>{judge.judgeName}</strong>
                  <span className="badge badge-primary">{judge.totalScore.toFixed(2)} pts</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {judge.criteria.map((criterion, criterionIndex) => (
                    <div key={criterionIndex} style={{ fontSize: "0.85rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                        <span style={{ color: "var(--color-text-2)" }}>{criterion.criteriaName}</span>
                        <span>{criterion.scoreValue}/{criterion.maxScore} (weight {criterion.weight}%)</span>
                      </div>
                      {criterion.comment && (
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", marginTop: "0.25rem", color: "var(--color-text-2)", fontStyle: "italic" }}>
                          <MessageSquare size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                          <span>{criterion.comment}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card">
        {team?.currentRound && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.25rem",
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "1.25rem",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-3)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Competition</span>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-text-1)", marginTop: "0.25rem" }}>
                {team.category?.eventName || "SEAL Hackathon"}
              </div>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-3)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Active Round</span>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-text-1)", marginTop: "0.25rem" }}>
                {team.currentRound.roundName}
              </div>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-3)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Submission Deadline</span>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-warning)", marginTop: "0.25rem" }}>
                {team.currentRound.submissionDeadline
                  ? new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(team.currentRound.submissionDeadline))
                  : "No deadline set"}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.5rem" }}>
          <AlertCircle size={20} style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: 2 }} />
          <div>
            <h4 style={{ margin: "0 0 0.25rem 0", color: "var(--color-primary)", fontSize: "0.95rem" }}>Submission Guidelines</h4>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-2)", lineHeight: 1.5 }}>
              Backend currently stores repository, demo/video, and slide/report URLs. Notes and track text are not submitted until matching backend fields are added.
            </p>
          </div>
        </div>

        {team?.status !== "Approved" && (
          <div style={{ fontSize: "0.85rem", color: "var(--color-warning)", marginBottom: "1rem" }}>
            Only approved teams can submit. Current team status: {team?.status}.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="form-group">
            <label className="form-label"><GitBranch size={14} /> GitHub Repository URL <span style={{ color: "#ef4444" }}>*</span></label>
            <input className="form-input" type="url" placeholder="https://github.com/your-username/project-repo" required value={form.repositoryUrl} onChange={e => setForm({...form, repositoryUrl: e.target.value})} />
          </div>
          
          <div className="form-group">
            <label className="form-label"><Play size={14} /> Live Demo URL</label>
            <input className="form-input" type="url" placeholder="https://your-project-demo.vercel.app" value={form.demoUrl} onChange={e => setForm({...form, demoUrl: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label"><FileText size={14} /> Presentation / Report URL <span style={{ color: "#ef4444" }}>*</span></label>
            <input className="form-input" type="url" placeholder="Google Slides, Canva, or PDF link" required value={form.slideUrl} onChange={e => setForm({...form, slideUrl: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label"><LinkIcon size={14} /> Demo Video URL</label>
            <input className="form-input" type="url" placeholder="YouTube or Loom link" value={form.videoUrl} onChange={e => setForm({...form, videoUrl: e.target.value})} />
            <span className="form-hint">If Live Demo URL is empty, this video URL is sent as DemoUrl.</span>
          </div>

          <div className="form-group">
            <label className="form-label">Brief Description / Note for Judges</label>
            <textarea className="form-textarea" rows={4} placeholder="Not sent yet: backend does not have a matching submission description field." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>

          <div className="form-group" style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginTop: "0.5rem" }}>
            <input 
              type="checkbox" 
              id="consent" 
              style={{ marginTop: "0.25rem", width: "16px", height: "16px", cursor: "pointer" }} 
              checked={form.consent}
              onChange={e => setForm({...form, consent: e.target.checked})}
            />
            <label htmlFor="consent" style={{ fontSize: "0.9rem", color: "var(--color-text-2)", cursor: "pointer", lineHeight: 1.5 }}>
              <strong>Team Consent & Rules:</strong> I confirm that all team members have contributed to this project and we agree to the Hackathon Code of Conduct and official rules.
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <button type="submit" className="btn btn-primary" style={{ padding: "0.6rem 2rem" }} disabled={submitting || team?.status !== "Approved"}>
              {submitting ? <span className="spinner" /> : <><Upload size={16} /> {isSubmitted ? "Update Submission" : "Submit Project"}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { Target, ChevronRight, RefreshCw, ExternalLink, ShieldOff, CheckCircle, XCircle, Users, AlertCircle } from "lucide-react";
import Link from "next/link";
import { App } from "antd";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

type AssignedSubmission = {
  submissionId: string;
  repositoryUrl?: string | null;
  demoUrl?: string | null;
  slideUrl?: string | null;
  team: {
    teamId: string;
    teamName: string;
    category: string;
  };
  round: {
    roundId: string;
    roundName: string;
  };
};

type KickRequest = {
  kickRequestId: string;
  teamId: string;
  teamName: string;
  userId: string;
  userName: string;
  userEmail: string;
  reason: string;
  status: string;
  requestedAt: string;
};

export default function JudgingQueuePage() {
  const { message } = App.useApp();
  const { user, isLoading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<AssignedSubmission[]>([]);
  const [kickRequests, setKickRequests] = useState<KickRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const canJudge = user?.roles.some((r) => r === "Judge" || r === "Admin") ?? false;

  const loadKickRequests = async () => {
    if (!canJudge) return;
    try {
      const data = await apiRequest<KickRequest[]>("/judge/kick-requests");
      setKickRequests(data);
    } catch (err) {
      setKickRequests([]);
      console.error("Could not load kick requests:", err);
    }
  };

  const loadQueue = async () => {
    if (!canJudge) return;
    setLoading(true);
    try {
      const subData = await apiRequest<AssignedSubmission[]>("/judge/scores/my-assigned-submissions");
      setSubmissions(subData);
      await loadKickRequests();
    } catch (err) {
      setSubmissions([]);
      message.error(err instanceof Error ? err.message : "Could not load assigned submissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!canJudge) {
      setLoading(false);
      return;
    }

    let active = true;

    Promise.all([
      apiRequest<AssignedSubmission[]>("/judge/scores/my-assigned-submissions"),
      apiRequest<KickRequest[]>("/judge/kick-requests").catch(() => [] as KickRequest[])
    ])
      .then(([subData, kickData]) => {
        if (active) {
          setSubmissions(subData);
          setKickRequests(kickData);
        }
      })
      .catch((err) => {
        if (!active) return;
        setSubmissions([]);
        message.error(err instanceof Error ? err.message : "Could not load assigned submissions.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, canJudge, message]);

  const handleResolveKick = async (kickRequestId: string, action: "approve" | "reject") => {
    setResolvingId(kickRequestId);
    try {
      await apiRequest(`/judge/kick-requests/${kickRequestId}/${action}`, { method: "POST" });
      message.success(`Kick request ${action}d successfully.`);
      await loadKickRequests();
    } catch (err) {
      message.error(err instanceof Error ? err.message : `Could not resolve kick request.`);
    } finally {
      setResolvingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="empty-state">
        <span className="spinner" />
        <div className="empty-title">Verifying access</div>
      </div>
    );
  }

  if (!canJudge) {
    return (
      <div className="empty-state">
        <ShieldOff size={48} className="empty-icon" />
        <div className="empty-title">Access Denied</div>
        <div className="empty-desc">This page is only available to Judges and Admins.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">Judging Portal</h1>
          <p className="page-subtitle">Assigned submissions and team requests</p>
        </div>
        <button className="btn btn-secondary" onClick={loadQueue} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <div className="glass-card" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-display)", color: "#f59e0b" }}>{submissions.length}</div>
          <div style={{ fontSize: "0.82rem", color: "var(--color-text-3)", fontWeight: 500 }}>Assigned Submissions</div>
        </div>
        <div className="glass-card" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-display)", color: kickRequests.length > 0 ? "var(--color-warning)" : "var(--color-text-3)" }}>{kickRequests.length}</div>
          <div style={{ fontSize: "0.82rem", color: "var(--color-text-3)", fontWeight: 500 }}>Pending Kick Requests</div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <span className="spinner" />
          <div className="empty-title">Loading Portal Data</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Kick Requests Queue (Only displayed if there are pending requests) */}
          {kickRequests.length > 0 && (
            <div>
              <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", color: "var(--color-text-1)" }}>
                <AlertCircle size={20} style={{ color: "var(--color-warning)" }} /> Pending Kick Requests
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {kickRequests.map((request) => (
                  <div key={request.kickRequestId} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--color-text-1)" }}>
                            Request to Kick: {request.userName}
                          </span>
                          <span className="badge badge-neutral" style={{ fontSize: "0.72rem" }}>{request.userEmail}</span>
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)", marginTop: "0.25rem" }}>
                          Team: <strong style={{ color: "var(--color-text-2)" }}>{request.teamName}</strong> · Requested {new Date(request.requestedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          className="btn btn-sm"
                          style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}
                          onClick={() => handleResolveKick(request.kickRequestId, "approve")}
                          disabled={resolvingId !== null}
                        >
                          <CheckCircle size={14} style={{ marginRight: 4 }} /> Approve Kick
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: "rgba(244,63,94,0.15)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.3)" }}
                          onClick={() => handleResolveKick(request.kickRequestId, "reject")}
                          disabled={resolvingId !== null}
                        >
                          <XCircle size={14} style={{ marginRight: 4 }} /> Reject
                        </button>
                      </div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.02)", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-2)", fontSize: "0.88rem", color: "var(--color-text-2)" }}>
                      <strong>Reason:</strong> {request.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assigned Submissions Queue */}
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", color: "var(--color-text-1)" }}>
              <Target size={20} style={{ color: "var(--color-primary)" }} /> Assigned Submissions
            </h3>
            {submissions.length === 0 ? (
              <div className="empty-state">
                <Target size={48} className="empty-icon" />
                <div className="empty-title">No assigned submissions</div>
                <div className="empty-desc">Ask an admin to create judge assignments for your round/category.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {submissions.map((submission) => (
                  <div key={submission.submissionId} className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem" }}>
                    <Target size={16} style={{ color: "var(--color-primary)" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{submission.team.teamName}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--color-text-3)", marginTop: "0.15rem" }}>
                        {submission.team.category} - {submission.round.roundName}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {submission.repositoryUrl && (
                        <a className="btn btn-secondary btn-sm" href={submission.repositoryUrl} target="_blank" rel="noopener noreferrer">
                          Repo <ExternalLink size={12} />
                        </a>
                      )}
                      {submission.demoUrl && (
                        <a className="btn btn-secondary btn-sm" href={submission.demoUrl} target="_blank" rel="noopener noreferrer">
                          Demo <ExternalLink size={12} />
                        </a>
                      )}
                      {submission.slideUrl && (
                        <a className="btn btn-secondary btn-sm" href={submission.slideUrl} target="_blank" rel="noopener noreferrer">
                          Slides <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    <Link href={`/dashboard/judging/${submission.submissionId}`}>
                      <button className="btn btn-sm btn-primary">
                        Score <ChevronRight size={13} />
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


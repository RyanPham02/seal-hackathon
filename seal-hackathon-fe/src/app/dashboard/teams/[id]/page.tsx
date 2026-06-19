"use client";
import React, { use, useState, useEffect } from "react";
import { ChevronLeft, Users, Crown, Mail, Shield, BookOpen, Target, ExternalLink } from "lucide-react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  studentCode?: string | null;
  schoolName?: string | null;
  joined: string;
};

type Submission = {
  submissionId: string;
  repositoryUrl?: string | null;
  demoUrl?: string | null;
  slideUrl?: string | null;
  submittedAt: string;
  roundName: string;
};

type TeamData = {
  teamId: string;
  teamName: string;
  status: string;
  registeredAt: string;
  category: {
    categoryId: string;
    categoryName: string;
    eventId: string;
    eventName: string;
  };
  currentRound: {
    roundId: string;
    roundName: string;
  } | null;
  members: Member[];
  submissions: Submission[];
};

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState("members");
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    
    apiRequest<TeamData>(`/teams/${id}`)
      .then((data) => {
        if (active) {
          setTeam(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load team details.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="empty-state">
        <span className="spinner" />
        <div className="empty-title">Loading team details...</div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="empty-state">
        <Shield size={48} className="empty-icon" style={{ color: "var(--color-danger)" }} />
        <div className="empty-title">Access Denied / Error</div>
        <div className="empty-desc">{error || "Team not found."}</div>
        <Link href="/dashboard/teams" style={{ marginTop: "1rem" }}>
          <button className="btn btn-secondary"><ChevronLeft size={16} /> Back to Teams</button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link href="/dashboard/teams">
              <button className="btn btn-ghost btn-sm btn-icon"><ChevronLeft size={16} /></button>
            </Link>
            <h1 className="page-title">{team.teamName}</h1>
            <span className={`badge ${team.status === "Approved" ? "badge-success" : team.status === "Eliminated" ? "badge-danger" : "badge-warning"}`}>
              {team.status}
            </span>
          </div>
          <p className="page-subtitle">
            <Target size={13} style={{ marginRight: 4 }} />
            {team.category.categoryName} · {team.category.eventName}
          </p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: "1.5rem" }}>
        <button className={`tab-btn ${tab === "members" ? "active" : ""}`} onClick={() => setTab("members")}>
          <Users size={14} style={{ marginRight: 6 }} /> Members ({team.members.length})
        </button>
        <button className={`tab-btn ${tab === "submissions" ? "active" : ""}`} onClick={() => setTab("submissions")}>
          <BookOpen size={14} style={{ marginRight: 6 }} /> Submissions ({team.submissions.length})
        </button>
      </div>

      {tab === "members" && (
        <div className="glass-card">
          <div className="section-header" style={{ marginBottom: "1rem" }}>
            <span className="section-title"><Users size={15} /> Team Members</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {team.members.map((m) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.9rem 1rem", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}>
                <div className="avatar-placeholder" style={{ width: 40, height: 40, fontSize: "0.9rem", flexShrink: 0 }}>
                  {m.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                    <strong style={{ fontSize: "0.875rem" }}>{m.name}</strong>
                    {m.role === "Leader" && (
                      <span className="badge badge-warning" style={{ fontSize: "0.68rem" }}><Crown size={9} /> Leader</span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>
                    <Mail size={11} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                    {m.email} {m.studentCode ? `· Code: ${m.studentCode}` : ""} {m.schoolName ? `· ${m.schoolName}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "submissions" && (
        <div className="glass-card">
          <div className="section-header" style={{ marginBottom: "1rem" }}>
            <span className="section-title"><BookOpen size={15} /> Project Submissions</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {team.submissions.map((s) => (
              <div key={s.submissionId} style={{ padding: "1rem", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <strong style={{ fontSize: "0.9rem" }}>{s.roundName}</strong>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>
                    Submitted at: {new Date(s.submittedAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {s.repositoryUrl ? (
                    <a className="btn btn-secondary btn-sm" href={s.repositoryUrl} target="_blank" rel="noopener noreferrer">
                      Repository <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-3)", fontStyle: "italic" }}>No Repository</span>
                  )}
                  {s.demoUrl && (
                    <a className="btn btn-secondary btn-sm" href={s.demoUrl} target="_blank" rel="noopener noreferrer">
                      Demo <ExternalLink size={12} />
                    </a>
                  )}
                  {s.slideUrl && (
                    <a className="btn btn-secondary btn-sm" href={s.slideUrl} target="_blank" rel="noopener noreferrer">
                      Presentation <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}
            {team.submissions.length === 0 && (
              <div style={{ color: "var(--color-text-3)", fontSize: "0.85rem", fontStyle: "italic" }}>
                No submissions recorded for this team yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

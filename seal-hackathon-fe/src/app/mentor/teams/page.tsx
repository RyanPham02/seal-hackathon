"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Users, FileEdit, MessageSquare, Clipboard } from "lucide-react";
import { App, Modal, Input, Spin, Empty, Tag } from "antd";
import { apiRequest } from "@/lib/api";

interface SubmissionData {
  submissionId: string;
  repositoryUrl?: string | null;
  demoUrl?: string | null;
  slideUrl?: string | null;
  submittedAt: string;
  roundName: string;
}

interface MentorTeam {
  teamId: string;
  teamName: string;
  categoryName: string;
  eventName: string;
  status: string;
  membersCount: number;
  notes?: string | null;
  latestSubmission?: SubmissionData | null;
}

export default function MentorTeamsPage() {
  const { message } = App.useApp();
  const [teams, setTeams] = useState<MentorTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<MentorTeam | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<MentorTeam[]>("/mentor/teams");
      setTeams(data);
    } catch {
      message.error("Could not load assigned teams.");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    const trigger = async () => {
      await Promise.resolve();
      void loadTeams();
    };
    void trigger();
  }, [loadTeams]);

  const openReview = (team: MentorTeam) => {
    setSelectedTeam(team);
    setNote(team.notes || "");
    setReviewModal(true);
  };

  const handleSaveNote = async () => {
    if (!selectedTeam) return;
    setSubmitting(true);
    try {
      await apiRequest(`/mentor/teams/${selectedTeam.teamId}/notes`, {
        method: "POST",
        body: JSON.stringify({ notes: note })
      });
      message.success("Notes saved successfully!");
      setReviewModal(false);
      void loadTeams();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to save notes.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <Spin size="large" />
        <div className="empty-title">Loading teams...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Assigned Teams</h1>
          <p className="page-subtitle">View and evaluate the teams you are mentoring</p>
        </div>
      </div>

      {teams.length === 0 ? (
        <div className="glass-card" style={{ marginTop: "2rem", textAlign: "center", padding: "3rem 1rem" }}>
          <Empty description="You have not been assigned to mentor any teams yet." />
        </div>
      ) : (
        <div className="table-wrapper" style={{ marginTop: "2rem" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Team Name</th>
                <th>Track / Event</th>
                <th>Members</th>
                <th>Status</th>
                <th>Submission Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.teamId}>
                  <td className="table-cell-primary">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <div className="avatar-placeholder" style={{ width: 30, height: 30, fontSize: "0.72rem" }}>
                        {t.teamName.substring(0, 2).toUpperCase()}
                      </div>
                      {t.teamName}
                    </div>
                  </td>
                  <td>
                    <div>{t.categoryName}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>{t.eventName}</div>
                  </td>
                  <td>
                    <span className="badge badge-neutral">
                      <Users size={10} style={{ marginRight: 4 }} /> {t.membersCount}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${t.status === "Approved" ? "badge-success" : t.status === "Eliminated" ? "badge-danger" : "badge-warning"}`}>
                      {t.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {t.latestSubmission ? (
                      <div>
                        <Tag color="cyan">Submitted ({t.latestSubmission.roundName})</Tag>
                        <div style={{ fontSize: "0.72rem", color: "var(--color-text-3)", marginTop: 2 }}>
                          {new Date(t.latestSubmission.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <Tag color="default">No submissions</Tag>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => openReview(t)}>
                      {t.notes ? (
                        <>
                          <MessageSquare size={13} style={{ marginRight: 4 }} />
                          <span> Edit Note</span>
                        </>
                      ) : (
                        <>
                          <FileEdit size={13} style={{ marginRight: 4 }} />
                          <span> Add Note</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        title={`Review Notes for ${selectedTeam?.teamName}`}
        open={reviewModal}
        onCancel={() => setReviewModal(false)}
        onOk={handleSaveNote}
        confirmLoading={submitting}
        okText="Save Notes"
      >
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ color: "var(--color-text-2)", marginBottom: "1rem" }}>
            <Clipboard size={14} style={{ marginRight: 6, verticalAlign: 'middle', display: 'inline' }} />
            Record your advice, comments, and guidance for this team.
          </p>
          <Input.TextArea 
            rows={6} 
            placeholder="Enter your notes here..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}

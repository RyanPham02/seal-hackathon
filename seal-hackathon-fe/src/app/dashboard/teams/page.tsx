"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { Plus, Users, Shield, UserPlus, Trash2, RefreshCw, AlertCircle, Crown, ArrowRightLeft, GraduationCap } from "lucide-react";
import { App, Modal } from "antd";
import { useRouter } from "next/navigation";
import { CurrentUser, apiRequest, fetchCurrentUser } from "@/lib/api";

type TeamMember = {
  userId: string;
  fullName: string;
  email: string;
  studentCode?: string | null;
  role?: string;
};

type TeamDto = {
  teamId: string;
  teamName: string;
  status: string;
  leaderId: string;
  category: {
    categoryId: string;
    categoryName: string;
  };
  currentRound: {
    roundId: string;
    roundName: string;
  } | null;
  members: TeamMember[];
  mentor?: {
    id: string;
    fullName: string;
    email: string;
    schoolName?: string | null;
  } | null;
};

type EventDto = {
  eventId: string;
  eventName: string;
  categories: {
    categoryId: string;
    categoryName: string;
    teamCount: number;
  }[];
};

function parseMemberIds(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function TeamsPage() {
  const { message, modal } = App.useApp();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [myTeam, setMyTeam] = useState<TeamDto | null>(null);
  const [events, setEvents] = useState<EventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [initialMemberCodes, setInitialMemberCodes] = useState("");
  const [memberCodeToAdd, setMemberCodeToAdd] = useState("");
  const [draftTeamName, setDraftTeamName] = useState("");
  const [newLeaderCodeOrEmail, setNewLeaderCodeOrEmail] = useState("");

  // Mentor Selection states
  const [mentors, setMentors] = useState<{ id: string; fullName: string; email: string; schoolName?: string | null }[]>([]);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [loadingMentors, setLoadingMentors] = useState(false);

  const categories = useMemo(
    () =>
      events.flatMap((event) =>
        event.categories.map((category) => ({
          ...category,
          eventName: event.eventName,
        })),
      ),
    [events],
  );

  const isLeader = Boolean(myTeam && currentUser && myTeam.leaderId === currentUser.id);
  const canModifyMembers = isLeader && myTeam?.status === "Pending";

  const loadPage = async () => {
    setLoading(true);
    try {
      const [user, eventData] = await Promise.all([
        fetchCurrentUser(),
        apiRequest<EventDto[]>("/Events"),
      ]);

      setCurrentUser(user);
      setEvents(eventData);
      setCategoryId((current) => current || eventData.flatMap((event) => event.categories)[0]?.categoryId || "");

      try {
        const team = await apiRequest<TeamDto>("/teams/my-team");
        setMyTeam(team);
        setDraftTeamName(team.teamName);
      } catch (err) {
        const text = err instanceof Error ? err.message : "";
        if (!text.toLowerCase().includes("not joined") && !text.toLowerCase().includes("not found")) {
          throw err;
        }
        setMyTeam(null);
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load team data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const handleCreateTeam = async () => {
    const memberCodes = parseMemberIds(initialMemberCodes);

    if (!teamName.trim()) {
      message.error("Team name is required.");
      return;
    }

    if (!categoryId) {
      message.error("Select a category before creating a team.");
      return;
    }

    if (memberCodes.length < 2 || memberCodes.length > 4) {
      message.error("Add 2 to 4 member student codes or emails so the team has 3 to 5 members including you.");
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest("/teams", {
        method: "POST",
        body: JSON.stringify({
          teamName: teamName.trim(),
          categoryId,
          memberStudentCodesOrEmails: memberCodes,
        }),
      });

      message.success("Team registered and waiting for approval.");
      setTeamName("");
      setInitialMemberCodes("");
      await loadPage();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not create team.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async () => {
    if (!myTeam || !memberCodeToAdd.trim()) return;

    setSubmitting(true);
    try {
      await apiRequest("/teams/my-team/members", {
        method: "POST",
        body: JSON.stringify({ studentCodeOrEmail: memberCodeToAdd.trim() }),
      });

      message.success("Member added successfully.");
      setMemberCodeToAdd("");
      await loadPage();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not add member.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = (member: TeamMember) => {
    if (!myTeam) return;

    modal.confirm({
      title: "Remove member",
      content: `Remove ${member.fullName} from ${myTeam.teamName}?`,
      okText: "Remove",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiRequest(`/teams/my-team/members/${encodeURIComponent(member.studentCode || member.email)}`, { method: "DELETE" });
          message.success("Member removed successfully.");
          await loadPage();
        } catch (err) {
          message.error(err instanceof Error ? err.message : "Could not remove member.");
        }
      },
    });
  };

  const handleUpdateTeam = async () => {
    if (!myTeam || !draftTeamName.trim()) return;

    setSubmitting(true);
    try {
      await apiRequest("/teams/my-team", {
        method: "PUT",
        body: JSON.stringify({ teamName: draftTeamName.trim() }),
      });

      message.success("Team updated successfully.");
      await loadPage();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not update team.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveTeam = () => {
    modal.confirm({
      title: "Leave team",
      content: "Are you sure you want to leave this team?",
      okText: "Leave",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiRequest("/teams/leave", { method: "POST" });
          message.success("You have left the team.");
          await loadPage();
        } catch (err) {
          message.error(err instanceof Error ? err.message : "Could not leave team.");
        }
      },
    });
  };

  const handleTransferLeader = async () => {
    if (!myTeam || !newLeaderCodeOrEmail.trim()) return;

    setSubmitting(true);
    try {
      await apiRequest("/teams/transfer-leader", {
        method: "PUT",
        body: JSON.stringify({ newLeaderStudentCodeOrEmail: newLeaderCodeOrEmail.trim() }),
      });

      message.success("Team leader transferred successfully.");
      setNewLeaderCodeOrEmail("");
      await loadPage();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not transfer leader.");
    } finally {
      setSubmitting(false);
    }
  };

  const loadMentors = async () => {
    setLoadingMentors(true);
    try {
      const data = await apiRequest<{ id: string; fullName: string; email: string; schoolName?: string | null }[]>("/teams/mentors");
      setMentors(data);
    } catch {
      message.error("Could not load mentors list.");
    } finally {
      setLoadingMentors(false);
    }
  };

  const handleAssignMentor = async (mentorId: string) => {
    setSubmitting(true);
    try {
      await apiRequest("/teams/my-team/mentor", {
        method: "POST",
        body: JSON.stringify({ mentorUserId: mentorId }),
      });
      message.success("Mentor assigned successfully.");
      setShowMentorModal(false);
      await loadPage();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not assign mentor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMentor = () => {
    modal.confirm({
      title: "Remove mentor",
      content: "Are you sure you want to remove the mentor from your team?",
      okText: "Remove",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiRequest("/teams/my-team/mentor", { method: "DELETE" });
          message.success("Mentor removed successfully.");
          await loadPage();
        } catch (err) {
          message.error(err instanceof Error ? err.message : "Could not remove mentor.");
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="empty-state">
        <span className="spinner" />
        <div className="empty-title">Loading team</div>
      </div>
    );
  }

  if (!currentUser) return null;

  if (!myTeam) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div className="page-header" style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <Users size={32} style={{ color: "var(--color-primary)" }} />
          </div>
          <h1 className="page-title" style={{ justifyContent: "center" }}>You are not in a team</h1>
          <p className="page-subtitle">Register a team through the backend approval flow.</p>
        </div>

        <div className="glass-card" style={{ maxWidth: 560, margin: "0 auto" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Crown size={18} /> Create a Team
          </h3>

          <div className="form-group">
            <label className="form-label" htmlFor="teamName">Team Name</label>
            <input
              id="teamName"
              className="form-input"
              placeholder="Enter team name"
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="category">Category</label>
            <select
              id="category"
              className="form-input"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              disabled={categories.length === 0}
            >
              {categories.map((category) => (
                <option key={category.categoryId} value={category.categoryId}>
                  {category.eventName} - {category.categoryName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="memberIds">Member Student Codes or Emails</label>
            <textarea
              id="memberIds"
              className="form-input"
              rows={4}
              placeholder="Paste 2 to 4 approved student codes or emails, separated by commas or new lines"
              value={initialMemberCodes}
              onChange={(event) => setInitialMemberCodes(event.target.value)}
            />
          </div>

          <button className="btn btn-primary btn-lg" onClick={handleCreateTeam} disabled={submitting} style={{ width: "100%", justifyContent: "center" }}>
            {submitting ? <span className="spinner" /> : <><Plus size={18} /> Register Team</>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{myTeam.teamName}</h1>
          <p className="page-subtitle">
            {myTeam.category.categoryName}
            {myTeam.currentRound ? ` · ${myTeam.currentRound.roundName}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary" onClick={() => router.push("/dashboard/matchmaking")}>
            <Users size={16} style={{ marginRight: 4 }} /> Matchmaking
          </button>
          <button className="btn btn-secondary" onClick={loadPage} disabled={loading || submitting}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn btn-ghost danger" onClick={handleLeaveTeam} disabled={submitting}>
            Leave Team
          </button>
        </div>
      </div>

      {canModifyMembers && (
        <div className="glass-card" style={{ maxWidth: 520, marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Team Info</h3>
          <div className="form-group">
            <label className="form-label" htmlFor="draftTeamName">Team Name</label>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <input
                id="draftTeamName"
                className="form-input"
                value={draftTeamName}
                onChange={(event) => setDraftTeamName(event.target.value)}
              />
              <button className="btn btn-primary" onClick={handleUpdateTeam} disabled={submitting || !draftTeamName.trim()}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {canModifyMembers && myTeam.members.length > 1 && (
        <div className="glass-card" style={{ maxWidth: 520, marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ArrowRightLeft size={18} /> Transfer Leader
          </h3>
          <div className="form-group">
            <label className="form-label" htmlFor="newLeader">New Leader Student Code or Email</label>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <input
                id="newLeader"
                className="form-input"
                placeholder="Existing team member student code or email"
                value={newLeaderCodeOrEmail}
                onChange={(event) => setNewLeaderCodeOrEmail(event.target.value)}
              />
              <button className="btn btn-primary" disabled={!newLeaderCodeOrEmail.trim() || submitting} onClick={handleTransferLeader}>
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Users size={18} style={{ color: "var(--color-primary)" }} />
            Team Members ({myTeam.members.length}/5)
          </h3>
          <span className={`badge ${myTeam.status === "Pending" ? "badge-warning" : "badge-success"}`}>
            {myTeam.status.toUpperCase()}
          </span>
        </div>

        {myTeam.status !== "Pending" && (
          <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <AlertCircle size={14} style={{ color: "var(--color-warning)" }} /> Approved teams cannot be edited.
          </div>
        )}

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Email</th>
                {canModifyMembers && <th style={{ textAlign: "right" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {myTeam.members.map((member) => {
                const memberIsLeader = member.userId === myTeam.leaderId;

                return (
                  <tr key={member.userId}>
                    <td className="table-cell-primary">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: "0.8rem" }}>
                          {member.fullName.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 500 }}>{member.fullName}</span>
                        {member.userId === currentUser.id && <span className="badge badge-neutral">You</span>}
                      </div>
                    </td>
                    <td>
                      {memberIsLeader ? (
                        <span className="badge badge-primary"><Shield size={12} style={{ marginRight: 4 }} /> Leader</span>
                      ) : (
                        <span className="badge badge-neutral">Member</span>
                      )}
                    </td>
                    <td><span style={{ color: "var(--color-text-2)" }}>{member.email}</span></td>
                    {canModifyMembers && (
                      <td style={{ textAlign: "right" }}>
                        {!memberIsLeader && (
                          <button className="btn btn-ghost danger btn-sm" onClick={() => handleRemoveMember(member)} disabled={submitting}>
                            <Trash2 size={14} /> Remove
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Mentor Section */}
      <div className="glass-card" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <GraduationCap size={18} style={{ color: "var(--color-primary)" }} />
            Team Mentor
          </h3>
        </div>

        {myTeam.mentor ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div className="avatar-placeholder" style={{ width: 40, height: 40, fontSize: "1rem", background: "rgba(99,102,241,0.1)", color: "var(--color-primary)" }}>
                {myTeam.mentor.fullName.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>{myTeam.mentor.fullName}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)" }}>{myTeam.mentor.email}</div>
                {myTeam.mentor.schoolName && (
                  <div style={{ fontSize: "0.82rem", color: "var(--color-text-2)", marginTop: "0.2rem" }}>
                    {myTeam.mentor.schoolName}
                  </div>
                )}
              </div>
            </div>
            {isLeader && myTeam.status === "Pending" && (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-secondary btn-sm" onClick={() => { loadMentors(); setShowMentorModal(true); }}>
                  Change Mentor
                </button>
                <button className="btn btn-ghost danger btn-sm" onClick={handleRemoveMentor}>
                  Remove
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0" }}>
            <div style={{ color: "var(--color-text-3)", fontSize: "0.9rem" }}>
              No mentor selected yet.
            </div>
            {isLeader && myTeam.status === "Pending" && (
              <button className="btn btn-primary btn-sm" onClick={() => { loadMentors(); setShowMentorModal(true); }}>
                Choose Mentor
              </button>
            )}
          </div>
        )}
      </div>

      {canModifyMembers && (
        <div className="glass-card" style={{ maxWidth: 520, marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <UserPlus size={18} /> Add Member
          </h3>
          <div className="form-group">
            <label className="form-label" htmlFor="addMember">Student Code or Email</label>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <input
                id="addMember"
                className="form-input"
                placeholder="Approved student code or email"
                value={memberCodeToAdd}
                onChange={(event) => setMemberCodeToAdd(event.target.value)}
              />
              <button className="btn btn-primary" disabled={!memberCodeToAdd.trim() || submitting} onClick={handleAddMember}>
                <UserPlus size={15} /> Add
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        title="Select Team Mentor"
        open={showMentorModal}
        onCancel={() => setShowMentorModal(false)}
        footer={null}
        width={550}
        centered
        styles={{
          body: {
            maxHeight: "400px",
            overflowY: "auto",
            paddingTop: "1rem"
          }
        }}
      >
        {loadingMentors ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <span className="spinner" />
            <div style={{ marginTop: "0.5rem", color: "var(--color-text-3)" }}>Loading mentors...</div>
          </div>
        ) : mentors.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-3)" }}>
            No approved mentors found in the system.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {mentors.map((mentor) => (
              <div
                key={mentor.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1rem",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)"
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: "var(--color-text-1)" }}>{mentor.fullName}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)" }}>{mentor.email}</div>
                  {mentor.schoolName && (
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-2)", marginTop: "0.2rem" }}>
                      {mentor.schoolName}
                    </div>
                  )}
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={submitting}
                  onClick={() => handleAssignMentor(mentor.id)}
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

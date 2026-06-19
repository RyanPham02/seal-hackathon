"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { Plus, Users, Shield, UserPlus, Trash2, RefreshCw, AlertCircle, Crown, ArrowRightLeft, GraduationCap, LogOut } from "lucide-react";
import { App, Modal } from "antd";
import { useRouter } from "next/navigation";
import { CurrentUser, apiRequest, fetchCurrentUser } from "@/lib/api";

type TeamMember = {
  userId: string;
  fullName: string;
  email: string;
  studentCode?: string | null;
  role?: string;
  isKickPending?: boolean;
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
  eventStatus?: string | null;
  finalRank?: number | null;
  finalPrize?: string | null;
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
  judge?: {
    id: string;
    fullName: string;
    email: string;
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

type InvitationResponse = {
  id: string;
  teamId: string;
  teamName: string;
  inviterUserId: string;
  inviterUserName: string;
  inviteeUserId: string;
  inviteeUserName: string;
  inviteeUserEmail: string;
  status: string;
  message?: string;
  createdAt: string;
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
  const [receivedInvites, setReceivedInvites] = useState<InvitationResponse[]>([]);

  const [mentors, setMentors] = useState<{ id: string; fullName: string; email: string; schoolName?: string | null }[]>([]);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [loadingMentors, setLoadingMentors] = useState(false);

  // Kick Request states
  const [kickModalOpen, setKickModalOpen] = useState(false);
  const [memberToKick, setMemberToKick] = useState<TeamMember | null>(null);
  const [kickReason, setKickReason] = useState("");

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
  const canModifyMembers = isLeader && (myTeam?.status === "Pending" || myTeam?.status === "Eliminated");
  const canKickMembers = isLeader;

  const showActions = useMemo(() => {
    if (!myTeam || !currentUser) return false;
    return myTeam.members.some((member) => {
      const isMe = member.userId === currentUser.id;
      const memberIsLeader = member.userId === myTeam.leaderId;
      if (isMe) {
        return !memberIsLeader || myTeam.members.length === 1;
      }
      return canKickMembers;
    });
  }, [myTeam, currentUser, canKickMembers]);

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

      let hasTeam = false;
      try {
        const team = await apiRequest<TeamDto>("/teams/my-team");
        setMyTeam(team);
        setDraftTeamName(team.teamName);
        hasTeam = true;
      } catch (err) {
        const text = err instanceof Error ? err.message : "";
        if (!text.toLowerCase().includes("not joined") && !text.toLowerCase().includes("not found")) {
          throw err;
        }
        setMyTeam(null);
      }

      if (!hasTeam) {
        try {
          const invites = await apiRequest<InvitationResponse[]>("/teams/invitations/received");
          setReceivedInvites(invites.filter((inv) => inv.status === "Pending"));
        } catch {
          setReceivedInvites([]);
        }
      } else {
        setReceivedInvites([]);
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load team data.");
    } finally {
      setLoading(false);
    }
  };

  const reloadTeamOnly = async () => {
    try {
      const team = await apiRequest<TeamDto>("/teams/my-team");
      setMyTeam((currentTeam) => {
        if (JSON.stringify(currentTeam) !== JSON.stringify(team)) {
          return team;
        }
        return currentTeam;
      });
      setDraftTeamName((currentDraft) => {
        if (!currentDraft && team.teamName) {
          return team.teamName;
        }
        return currentDraft;
      });
      setReceivedInvites([]);
    } catch (err) {
      const text = err instanceof Error ? err.message : "";
      if (text.toLowerCase().includes("not joined") || text.toLowerCase().includes("not found")) {
        setMyTeam(null);
        try {
          const invites = await apiRequest<InvitationResponse[]>("/teams/invitations/received");
          setReceivedInvites((current) => {
            const pendingOnly = invites.filter((inv) => inv.status === "Pending");
            if (JSON.stringify(current) !== JSON.stringify(pendingOnly)) {
              return pendingOnly;
            }
            return current;
          });
        } catch {
          setReceivedInvites([]);
        }
      }
    }
  };

  const handleAcceptInvite = async (id: string, teamName: string) => {
    try {
      await apiRequest(`/teams/invitations/${id}/accept`, { method: "POST" });
      message.success(`You have successfully joined team ${teamName}!`);
      window.location.reload();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to accept invitation.");
    }
  };

  const handleDeclineInvite = async (id: string) => {
    try {
      await apiRequest(`/teams/invitations/${id}/reject`, { method: "POST" });
      message.success("Invitation declined.");
      const invites = await apiRequest<InvitationResponse[]>("/teams/invitations/received");
      setReceivedInvites(invites.filter((inv) => inv.status === "Pending"));
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to decline invitation.");
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      void reloadTeamOnly();
    }, 3000);

    const handleFocus = () => {
      void reloadTeamOnly();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
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

      message.success("Invitation sent successfully.");
      setMemberCodeToAdd("");
      await loadPage();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not invite member.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = (member: TeamMember) => {
    if (!myTeam) return;

    const isApprovedTeam = ["Approved", "Active", "Champion"].includes(myTeam.status);

    if (isApprovedTeam) {
      setMemberToKick(member);
      setKickReason("");
      setKickModalOpen(true);
    } else {
      modal.confirm({
        title: "Kick member",
        content: `Are you sure you want to kick ${member.fullName} from the team?`,
        okText: "Kick",
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await apiRequest(`/teams/my-team/members/${encodeURIComponent(member.studentCode || member.email)}`, { method: "DELETE" });
            message.success("Member kicked successfully.");
            await loadPage();
          } catch (err) {
            message.error(err instanceof Error ? err.message : "Could not kick member.");
          }
        },
      });
    }
  };

  const handleSubmitKickRequest = async () => {
    if (!myTeam || !memberToKick || !kickReason.trim()) return;

    setSubmitting(true);
    try {
      await apiRequest(`/teams/my-team/members/${memberToKick.userId}/kick-request`, {
        method: "POST",
        body: JSON.stringify({ reason: kickReason.trim() }),
      });
      message.success("Kick request submitted for Judge approval.");
      setKickModalOpen(false);
      setMemberToKick(null);
      setKickReason("");
      await loadPage();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not submit kick request.");
    } finally {
      setSubmitting(false);
    }
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
    const isDisband = isLeader && (myTeam?.status === "Champion" || myTeam?.status === "Eliminated" || myTeam?.eventStatus === "Completed");
    modal.confirm({
      title: isDisband ? "Disband team" : "Leave team",
      content: isDisband 
        ? "Are you sure you want to disband this team? All members will be removed and the team will be closed." 
        : "Are you sure you want to leave this team?",
      okText: isDisband ? "Disband" : "Leave",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiRequest("/teams/leave", { method: "POST" });
          message.success(isDisband ? "Team disbanded successfully." : "You have left the team.");
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

        {/* Pending Invitations Banner */}
        {receivedInvites.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem", maxWidth: 560, margin: "0 auto 2rem" }}>
            {receivedInvites.map((invite) => (
              <div
                key={invite.id}
                className="glass-card"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderLeft: "4px solid var(--color-primary)",
                  padding: "1.25rem 1.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: "rgba(99,102,241,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--color-primary)",
                    }}
                  >
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "1.1rem", color: "var(--color-text-1)" }}>
                      Team Invitation
                    </h4>
                    <p style={{ margin: "0.2rem 0 0", color: "var(--color-text-3)", fontSize: "0.9rem" }}>
                      <strong>{invite.inviterUserName}</strong> has invited you to join team <strong>{invite.teamName}</strong>.
                      {invite.message && <span style={{ fontStyle: "italic", display: "block", marginTop: "0.25rem", color: "var(--color-text-2)" }}>&quot;{invite.message}&quot;</span>}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAcceptInvite(invite.id, invite.teamName)}
                  >
                    Accept
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDeclineInvite(invite.id)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

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
            {isLeader && (myTeam.status === "Champion" || myTeam.status === "Eliminated" || myTeam.eventStatus === "Completed") ? "Disband Team" : "Leave Team"}
          </button>
        </div>
      </div>

      {/* Celebration / Final Results Banner */}
      {myTeam.finalRank && (
        <div
          className="glass-card"
          style={{
            background: myTeam.status === "Champion" || myTeam.finalRank === 1
              ? "linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)"
              : "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(79, 70, 229, 0.05) 100%)",
            borderColor: myTeam.status === "Champion" || myTeam.finalRank === 1
              ? "rgba(251, 191, 36, 0.4)"
              : "rgba(99, 102, 241, 0.4)",
            boxShadow: myTeam.status === "Champion" || myTeam.finalRank === 1
              ? "0 8px 32px 0 rgba(245, 158, 11, 0.15)"
              : "0 8px 32px 0 rgba(99, 102, 241, 0.1)",
            padding: "1.5rem 2rem",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              background: myTeam.status === "Champion" || myTeam.finalRank === 1
                ? "rgba(251, 191, 36, 0.2)"
                : "rgba(99, 102, 241, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: myTeam.status === "Champion" || myTeam.finalRank === 1 ? "#fbbf24" : "#6366f1",
              flexShrink: 0
            }}
          >
            <Crown size={28} style={{ animation: "pulse 2s infinite" }} />
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "1.35rem",
                fontWeight: 700,
                color: myTeam.status === "Champion" || myTeam.finalRank === 1 ? "#fbbf24" : "var(--color-text-1)",
                marginBottom: "0.25rem"
              }}
            >
              {myTeam.status === "Champion" || myTeam.finalRank === 1
                ? "Chúc mừng team bạn đã đạt Top 1!"
                : `Chúc mừng! Team của bạn đã đạt Hạng ${myTeam.finalRank}`}
            </h2>
            <p style={{ margin: 0, color: "var(--color-text-2)", fontSize: "0.95rem" }}>
              {myTeam.finalPrize ? (
                <>
                  Bạn nhận được giải thưởng: <strong>{myTeam.finalPrize}</strong>
                </>
              ) : (
                "Cảm ơn đội của bạn đã nỗ lực hết mình và hoàn thành xuất sắc cuộc thi!"
              )}
            </p>
          </div>
        </div>
      )}

      {/* Pending Received Invitations / Join Requests Banner */}
      {receivedInvites.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
          {receivedInvites.map((invite) => {
            const isJoinRequest = myTeam && myTeam.teamId === invite.teamId && myTeam.leaderId === currentUser?.id;
            return (
              <div
                key={invite.id}
                className="glass-card"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderLeft: "4px solid var(--color-primary)",
                  padding: "1.25rem 1.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: "rgba(99,102,241,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--color-primary)",
                    }}
                  >
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "1.1rem", color: "var(--color-text-1)" }}>
                      {isJoinRequest ? "Join Request" : "Team Invitation"}
                    </h4>
                    <p style={{ margin: "0.2rem 0 0", color: "var(--color-text-3)", fontSize: "0.9rem" }}>
                      <strong>{invite.inviterUserName}</strong> {isJoinRequest ? "has requested to join your team" : `has invited you to join team ${invite.teamName}`}.
                      {invite.message && <span style={{ fontStyle: "italic", display: "block", marginTop: "0.25rem", color: "var(--color-text-2)" }}>&quot;{invite.message}&quot;</span>}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAcceptInvite(invite.id, invite.teamName)}
                  >
                    Accept
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDeclineInvite(invite.id)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
          <span className={`badge ${
            myTeam.status === "Pending"
              ? "badge-warning"
              : ["Approved", "Active", "Champion"].includes(myTeam.status)
              ? "badge-success"
              : "badge-danger"
          }`}>
            {myTeam.status.toUpperCase()}
          </span>
        </div>

        {["Approved", "Active", "Champion"].includes(myTeam.status) && (
          <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <AlertCircle size={14} style={{ color: "var(--color-warning)" }} /> Approved teams are locked. Adding members is blocked, and kicking requires a reason & Judge approval.
          </div>
        )}

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Email</th>
                {showActions && <th style={{ textAlign: "right" }}>Actions</th>}
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
                    {showActions && (
                      <td style={{ textAlign: "right" }}>
                        {member.isKickPending ? (
                          <span className="badge badge-warning" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0.5rem" }}>
                            <AlertCircle size={12} /> Pending Judge Approval
                          </span>
                        ) : member.userId === currentUser.id ? (
                          (!memberIsLeader || myTeam.members.length === 1) && (
                            <button className="btn btn-ghost danger btn-sm btn-kick" onClick={handleLeaveTeam} disabled={submitting}>
                              <LogOut size={14} /> Leave
                            </button>
                          )
                        ) : (
                          !memberIsLeader && canKickMembers && (
                            <button className="btn btn-ghost danger btn-sm btn-kick" onClick={() => handleRemoveMember(member)} disabled={submitting}>
                              <Trash2 size={14} /> Kick
                            </button>
                          )
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

      {["Pending", "Approved", "Active", "Champion", "Rejected"].includes(myTeam.status) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          {/* Team Mentor Section */}
          <div className="glass-card" style={{ marginBottom: 0 }}>
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

          {/* Team Judge Section */}
          <div className="glass-card" style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Users size={18} style={{ color: "var(--color-primary)" }} />
                Team Judge / Manager
              </h3>
            </div>

            {myTeam.judge ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div className="avatar-placeholder" style={{ width: 40, height: 40, fontSize: "1rem", background: "rgba(99,102,241,0.1)", color: "var(--color-primary)" }}>
                  {myTeam.judge.fullName.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>
                    {myTeam.judge.fullName} <span style={{ color: "var(--color-text-3)", fontSize: "0.8rem", fontWeight: 400 }}>(Giám Khảo)</span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)" }}>{myTeam.judge.email}</div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", padding: "0.5rem 0" }}>
                <div style={{ color: "var(--color-text-3)", fontSize: "0.9rem" }}>
                  No judge assigned to this team yet.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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

      <Modal
        title="Request Member Kick"
        open={kickModalOpen}
        onCancel={() => {
          if (!submitting) {
            setKickModalOpen(false);
            setMemberToKick(null);
            setKickReason("");
          }
        }}
        onOk={handleSubmitKickRequest}
        okText="Submit Request"
        okButtonProps={{ danger: true, loading: submitting, disabled: !kickReason.trim() }}
        cancelButtonProps={{ disabled: submitting }}
        destroyOnHidden
        centered
      >
        <div style={{ paddingTop: "0.5rem" }}>
          <p style={{ marginBottom: "1rem", color: "var(--color-text-2)" }}>
            Since your team is already approved, you cannot kick members directly. You must submit a request with a reason to the assigned Judge for approval.
          </p>
          <div className="form-group">
            <label className="form-label" htmlFor="kickReasonInput">Reason for Kick</label>
            <textarea
              id="kickReasonInput"
              className="form-input"
              rows={3}
              placeholder="Provide a clear reason for kicking this member..."
              value={kickReason}
              onChange={(e) => setKickReason(e.target.value)}
              disabled={submitting}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

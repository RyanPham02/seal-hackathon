"use client";
import { useState, useEffect } from "react";
import { ChevronLeft, Users, UserPlus, LogOut, Crown, Mail, UserMinus, Target, CheckCircle, Search, Star, Zap, UserCheck, Shield } from "lucide-react";
import Link from "next/link";
import { databaseService } from "@/services/databaseService";
import { App, Modal, Select } from "antd";

export default function TeamDetailPage({ params }: { params: { id: string } }) {
  const { message } = App.useApp();
  const [tab, setTab] = useState("members");
  const [inviteEmail, setInviteEmail] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDisqualifyModalOpen, setIsDisqualifyModalOpen] = useState(false);
  const [disqualifyReason, setDisqualifyReason] = useState("");
  const [teamData, setTeamData] = useState<any>({
    id: 1, name: "CodeCraft", track: "AI & Machine Learning", status: "active",
    event: "SEAL Spring 2026", registeredAt: "Apr 10, 2026",
    members: [
      { id: "USR-001", name: "Hải Trần", email: "hai@student.fpt.edu.vn", role: "Leader", university: "FPT", studentId: "SE123456", joined: "Apr 10", skills: ["React", "Node.js"] },
      { id: "USR-002", name: "Le Thi B", email: "b.lt@fpt.edu.vn", role: "Member", university: "FPT", studentId: "SE123457", joined: "Apr 10", skills: ["Figma"] },
    ],
  });

  // Matchmaking State
  const [searchSkill, setSearchSkill] = useState("");
  const [matches, setMatches] = useState<any[]>([]);
  
  // Mentors State
  const [mentors, setMentors] = useState<any[]>([]);

  // Leave Modal State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [newLeaderId, setNewLeaderId] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (user) {
      const parsed = JSON.parse(user);
      setCurrentUser(parsed);
      if (parsed.role === "Admin") setIsAdmin(true);
    }
  }, []);

  const handleMatchmakingSearch = () => {
    const existingRoles = teamData.members.map((m: any) => m.role);
    const results = databaseService.getTop10BestMatches(existingRoles, searchSkill);
    setMatches(results);
  };

  const handleAutoFindMentors = () => {
    message.loading("Analyzing team skills and finding best mentors...", 1.5).then(() => {
      setMentors([
        { id: "MEN-1", name: "Dr. Nguyen", expertise: "AI/ML, Python", match: "98%" },
        { id: "MEN-2", name: "Mr. Tran", expertise: "System Design", match: "85%" }
      ]);
      message.success("Found suitable mentors based on your track!");
    });
  };

  const handleInvite = (targetName: string) => {
    message.success(`Invitation sent to ${targetName}. They will receive a notification.`);
    // Mocking notification to DB would go here
  };

  const handleLeaveTeam = () => {
    const isLeader = teamData.members.find((m: any) => m.id === currentUser?.id)?.role === "Leader";
    if (isLeader && teamData.members.length > 1) {
      setIsLeaveModalOpen(true);
    } else {
      message.success("You have left the team.");
      // Redirect or update DB
    }
  };

  const confirmLeave = () => {
    if (!newLeaderId) {
      message.error("Please select a new leader.");
      return;
    }
    message.success("Successfully assigned new leader and left the team.");
    setIsLeaveModalOpen(false);
  };

  const handleDisqualify = () => {
    if (!disqualifyReason.trim()) {
      message.error("Please provide a reason for disqualification.");
      return;
    }
    setTeamData({ ...teamData, status: "disqualified" });
    message.success("Team has been disqualified.");
    setIsDisqualifyModalOpen(false);
  };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link href="/dashboard/teams"><button className="btn btn-ghost btn-sm btn-icon"><ChevronLeft size={16} /></button></Link>
            <h1 className="page-title">{teamData.name}</h1>
            {teamData.status === "disqualified" ? (
              <span className="badge badge-danger" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>Disqualified</span>
            ) : (
              <span className="badge badge-success">Active</span>
            )}
          </div>
          <p className="page-subtitle">
            <Target size={13} style={{ marginRight: 4 }} />{teamData.track} · {teamData.event}
          </p>
        </div>
        {isAdmin && teamData.status !== "disqualified" && (
          <button className="btn btn-danger btn-sm" onClick={() => setIsDisqualifyModalOpen(true)}>
            <Shield size={14} /> Disqualify Team
          </button>
        )}
      </div>

      <div className="tabs" style={{ marginBottom: "1.5rem" }}>
        {["members", "invite", "matchmaking", "mentors", "track"].map(t => (
          <button key={t} className={`tab-btn ${tab===t?"active":""}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "members" && (
        <div className="glass-card">
          <div className="section-header" style={{ marginBottom: "1rem" }}>
            <span className="section-title"><Users size={15} /> Team Members</span>
            {teamData.members.some((m:any) => m.id === currentUser?.id) && (
              <button className="btn btn-danger btn-sm" onClick={handleLeaveTeam}>
                <LogOut size={14} /> Leave Team
              </button>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {teamData.members.map((m: any) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.9rem 1rem", background: "rgba(15,23,42,0.5)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}>
                <div className="avatar-placeholder" style={{ width: 40, height: 40, fontSize: "0.9rem", flexShrink: 0 }}>{m.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                    <strong style={{ fontSize: "0.875rem" }}>{m.name}</strong>
                    {m.role === "Leader" && <span className="badge badge-warning" style={{ fontSize: "0.68rem" }}><Crown size={9} /> Leader</span>}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>{m.email} · {m.university}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "matchmaking" && (
        <div className="glass-card">
          <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}><Zap size={18} style={{ display:'inline', marginRight: 8, color: '#f59e0b' }}/> Smart Matchmaking</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-2)", marginBottom: "1.5rem" }}>Find the best candidates based on missing skills and roles in your team.</p>
          
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
            <input className="form-input" style={{ flex: 1 }} placeholder="Search by skill (e.g., React, Python, UI/UX)..." value={searchSkill} onChange={e => setSearchSkill(e.target.value)} />
            <button className="btn btn-primary" onClick={handleMatchmakingSearch}><Search size={16} /> Find Matches</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {matches.map(m => (
              <div key={m.id} style={{ padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ margin: "0 0 0.25rem 0" }}>{m.name} <span className="badge badge-primary">{m.matchPercentage}% Match</span></h4>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>Role: {m.role} · Skills: {m.skills.join(", ")}</div>
                  <div style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "4px" }}>Why: {m.matchReasons?.join(", ")}</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => handleInvite(m.name)}><UserPlus size={14} /> Invite</button>
              </div>
            ))}
            {matches.length === 0 && <div style={{ color: "var(--color-text-3)", fontSize: "0.85rem" }}>Try searching for a skill to see recommendations.</div>}
          </div>
        </div>
      )}

      {tab === "mentors" && (
        <div className="glass-card">
          <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}><Star size={18} style={{ display:'inline', marginRight: 8, color: '#6366f1' }}/> Auto-find Mentors</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-2)", marginBottom: "1.5rem" }}>Our AI will recommend the best mentors based on your team's project track ({teamData.track}).</p>
          
          {mentors.length === 0 ? (
            <button className="btn btn-primary" onClick={handleAutoFindMentors}><Zap size={16}/> Auto-Find Mentors</button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {mentors.map(m => (
                <div key={m.id} style={{ padding: "1rem", background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: "0 0 0.25rem 0" }}>{m.name} <span className="badge badge-success">{m.match} Match</span></h4>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>Expertise: {m.expertise}</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => handleInvite(m.name)}><UserCheck size={14} /> Request Mentorship</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "invite" && (
        <div className="glass-card" style={{ maxWidth: 520 }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Invite Member manually</h3>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <input className="form-input" type="email" placeholder="student@university.edu" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
              <button className="btn btn-primary" disabled={!inviteEmail} onClick={() => handleInvite(inviteEmail)}><UserPlus size={15} /> Invite</button>
            </div>
          </div>
        </div>
      )}

      <Modal title="Assign New Leader" open={isLeaveModalOpen} onOk={confirmLeave} onCancel={() => setIsLeaveModalOpen(false)}>
        <p style={{ marginBottom: 16 }}>As the team leader, you must assign a new leader before you can leave the team.</p>
        <Select 
          style={{ width: '100%' }} 
          placeholder="Select a member" 
          onChange={(val) => setNewLeaderId(val)}
          options={teamData.members.filter((m:any) => m.id !== currentUser?.id).map((m:any) => ({ value: m.id, label: m.name }))}
        />
      </Modal>

      <Modal 
        title={<div style={{ color: "#ef4444", display: "flex", alignItems: "center", gap: 8 }}><Shield size={18} /> Disqualify Team</div>} 
        open={isDisqualifyModalOpen} 
        onOk={handleDisqualify} 
        onCancel={() => setIsDisqualifyModalOpen(false)}
        okText="Confirm Disqualification"
        okButtonProps={{ danger: true }}
      >
        <p style={{ marginBottom: 16 }}>You are about to disqualify <strong>{teamData.name}</strong>. This action will revoke their access to submit projects.</p>
        <div className="form-group">
          <label className="form-label">Reason for Disqualification <span style={{ color: "#ef4444" }}>*</span></label>
          <textarea 
            className="form-textarea" 
            rows={3} 
            placeholder="e.g., Plagiarism, violation of terms..." 
            value={disqualifyReason}
            onChange={(e) => setDisqualifyReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { Plus, Users, Shield, LogOut, Search, Zap, UserPlus, Star, UserCheck, AlertTriangle, Mail, Crown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { App, Modal } from "antd";
import { databaseService } from "@/services/databaseService";

export default function TeamsPage() {
  const router = useRouter();
  const { message, modal, notification } = App.useApp();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myTeam, setMyTeam] = useState<any>(null);
  const [tab, setTab] = useState("members");
  const [emptyTab, setEmptyTab] = useState("create");

  // Feature states
  const [inviteEmail, setInviteEmail] = useState("");
  const [searchSkill, setSearchSkill] = useState("");
  const [matches, setMatches] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [joinSearch, setJoinSearch] = useState("");
  const availableTeams = [
    { id: "T-1", name: "Cyber Ninjas", track: "Security", membersCount: 3, lookingFor: ["Frontend", "Design"] },
    { id: "T-2", name: "AI Innovators", track: "AI & ML", membersCount: 4, lookingFor: ["Backend"] },
    { id: "T-3", name: "Web3 Pioneers", track: "Blockchain", membersCount: 2, lookingFor: ["Smart Contract", "Fullstack"] }
  ];

  const handleRequestJoin = (team: any) => {
    message.loading({ content: `Sending join request to ${team.name}...`, key: "join" });
    setTimeout(() => {
      message.success({ content: `Request sent! The leader of ${team.name} will review your application.`, key: "join", duration: 5 });
    }, 1500);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
    setCurrentUser(user);

    const team = localStorage.getItem(`myTeam_${user.email}`);
    if (team) {
      setMyTeam(JSON.parse(team));
    }
  }, []);

  const saveTeam = (updatedTeam: any) => {
    localStorage.setItem(`myTeam_${currentUser.email}`, JSON.stringify(updatedTeam));
    setMyTeam(updatedTeam);
  };

  const handleCreateTeam = () => {
    const newTeam = {
      id: Date.now().toString(),
      name: "New Awesome Team",
      description: "We are going to win SEAL!",
      track: "AI & Machine Learning",
      status: "pending",
      members: [
        { id: `USR-${Date.now()}`, name: currentUser.name, role: "Leader", email: currentUser.email, skills: ["Management"] }
      ]
    };
    saveTeam(newTeam);
    message.success("Team created successfully! You are the Leader.");
  };

  const handleKick = (email: string) => {
    if (!myTeam) return;
    if (!isLeader) {
      message.error("Chỉ có Leader mới được quyền kick thành viên!");
      return;
    }
    modal.confirm({
      title: "Xác nhận",
      content: "Bạn có muốn kick người này hay không?",
      okText: "Có",
      cancelText: "Không",
      onOk: () => {
        const updatedMembers = myTeam.members.filter((m:any) => m.email !== email);
        const updatedTeam = { ...myTeam, members: updatedMembers };
        saveTeam(updatedTeam);
        message.success("Đã kick thành viên khỏi nhóm.");
      }
    });
  };

  const handleLeave = () => {
    if (!myTeam) return;
    const isLeader = myTeam.members.find((m:any) => m.email === currentUser.email)?.role === "Leader";
    
    if (isLeader && myTeam.members.length > 1) {
      modal.confirm({
        title: "Transfer Leadership Required",
        content: "You are the Leader. You must transfer leadership to another member or disband the team before leaving.",
        okText: "Disband Team",
        cancelText: "Cancel",
        onOk: () => {
          localStorage.removeItem(`myTeam_${currentUser.email}`);
          setMyTeam(null);
          message.success("Team disbanded successfully.");
        }
      });
    } else {
      modal.confirm({
        title: "Leave Team",
        content: "Are you sure you want to leave this team?",
        onOk: () => {
          localStorage.removeItem(`myTeam_${currentUser.email}`);
          setMyTeam(null);
          message.success("You have left the team.");
        }
      });
    }
  };

  // ----- NEW FEATURES -----

  const handleMatchmakingSearch = () => {
    if (!myTeam) return;
    const existingRoles = myTeam.members.map((m: any) => m.role);
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

  const isLeader = myTeam?.members?.find((m:any) => m.email === currentUser?.email)?.role === "Leader";

  const handleApproveMember = (email: string) => {
    const updatedMembers = myTeam.members.map((m: any) => m.email === email ? { ...m, status: "active" } : m);
    saveTeam({ ...myTeam, members: updatedMembers });
    message.success("Đã phê duyệt thành viên vào nhóm!");
  };

  const handleRejectMember = (email: string) => {
    const updatedMembers = myTeam.members.filter((m: any) => m.email !== email);
    saveTeam({ ...myTeam, members: updatedMembers });
    message.success("Đã từ chối thành viên.");
  };

  const handleInvite = (target: string, isMentor: boolean = false) => {
    if (myTeam.members.length >= 5) {
      message.error("Team is full (max 5 members).");
      return;
    }

    if (isMentor) {
      const hasMentor = myTeam.members.some((m: any) => m.role.includes("Mentor"));
      if (hasMentor) {
        message.error("Mỗi nhóm chỉ có thể kêu gọi 1 Mentor duy nhất!");
        return;
      }
    }

    const emailToAdd = target.includes('@') ? target : `${target.toLowerCase().replace(' ', '')}@example.com`;
    if (myTeam.members.some((m: any) => m.email === emailToAdd)) {
      message.error("Người dùng này đã có trong nhóm!");
      return;
    }
    
    message.info(`Sending email invitation to ${target}...`);
    
    setTimeout(() => {
      const isAccepted = Math.random() > 0.3; 
      if (isAccepted) {
        if (isLeader) {
          notification.success({
            message: "Invitation Accepted!",
            description: `${target} has accepted your invitation and joined the team!`,
            duration: 5,
            placement: "topRight"
          });
        } else {
          notification.info({
            message: "Chờ phê duyệt",
            description: `${target} đã đồng ý tham gia! Đang chờ Trưởng nhóm phê duyệt.`,
            duration: 6,
            placement: "topRight"
          });
        }
        
        const newMember = { 
          id: `USR-${Date.now()}`, 
          name: target.includes('@') ? target.split('@')[0] : target, 
          email: emailToAdd, 
          role: isMentor ? "Mentor" : "Member", 
          status: isLeader ? "active" : "pending_approval",
          skills: [searchSkill || "General"] 
        };
        const updatedTeam = { ...myTeam, members: [...myTeam.members, newMember] };
        saveTeam(updatedTeam);
      } else {
        const reasons = ["I'm in another team.", "I'm busy.", "Skills don't match."];
        const reason = reasons[Math.floor(Math.random() * reasons.length)];
        notification.error({
          message: "Invitation Declined",
          description: `${target} declined. Reason: "${reason}"`,
          duration: 7,
          placement: "topRight"
        });
      }
    }, 3000);
    setInviteEmail("");
  };

  const handleSOSMentor = () => {
    const hasMentor = myTeam.members.some((m: any) => m.role.includes("Mentor"));
    if (hasMentor) {
      message.error("Mỗi nhóm chỉ có thể kêu gọi 1 Mentor duy nhất!");
      return;
    }
    message.loading({ content: "Broadcasting SOS to all available mentors...", key: "sos" });
    setTimeout(() => {
      const availableMentors = ["Dr. Pham", "Prof. Le", "Mr. Hoang", "Ms. Nguyen"];
      const mentorName = availableMentors[Math.floor(Math.random() * availableMentors.length)];
      
      message.success({ content: `${mentorName} answered your SOS and joined your team to support!`, key: "sos", duration: 5 });
      
      const sosMentor = { 
        id: `MEN-SOS-${Date.now()}`, 
        name: mentorName, 
        email: "expert.mentor@seal.edu", 
        role: "Mentor (SOS)", 
        skills: ["Advising"] 
      };
      const updatedTeam = { ...myTeam, members: [...myTeam.members, sosMentor] };
      saveTeam(updatedTeam);
    }, 2500);
  };

  if (!currentUser) return null;

  if (!myTeam) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div className="page-header" style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <Users size={32} style={{ color: "var(--color-primary)" }} />
          </div>
          <h1 className="page-title" style={{ justifyContent: "center" }}>You are not in a team</h1>
          <p className="page-subtitle">Join an existing team as a member or create a new one to lead.</p>
        </div>

        <div className="tabs" style={{ marginBottom: "2rem", justifyContent: "center" }}>
          <button className={`tab-btn ${emptyTab==="create"?"active":""}`} onClick={() => setEmptyTab("create")}>
            <Crown size={16} style={{ marginRight: 6 }}/> Create a Team
          </button>
          <button className={`tab-btn ${emptyTab==="join"?"active":""}`} onClick={() => setEmptyTab("join")}>
            <Search size={16} style={{ marginRight: 6 }}/> Find a Team
          </button>
        </div>

        {emptyTab === "create" && (
          <div className="glass-card" style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Lead Your Own Team</h3>
            <p style={{ color: "var(--color-text-2)", marginBottom: "2rem" }}>Take charge, define the project vision, and invite other talented students to join your squad.</p>
            <button className="btn btn-primary btn-lg" onClick={handleCreateTeam} style={{ width: "100%", justifyContent: "center" }}>
              <Plus size={18} /> Create New Team
            </button>
          </div>
        )}

        {emptyTab === "join" && (
          <div className="glass-card" style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
              <input 
                className="form-input" 
                style={{ flex: 1 }} 
                placeholder="Search teams by name, track, or required skills..." 
                value={joinSearch} 
                onChange={e => setJoinSearch(e.target.value)} 
              />
              <button className="btn btn-primary"><Search size={16} /> Search</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {availableTeams.filter(t => 
                t.name.toLowerCase().includes(joinSearch.toLowerCase()) || 
                t.track.toLowerCase().includes(joinSearch.toLowerCase()) ||
                t.lookingFor.some(s => s.toLowerCase().includes(joinSearch.toLowerCase()))
              ).map(t => (
                <div key={t.id} style={{ padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "1.1rem" }}>{t.name} <span className="badge badge-neutral">{t.membersCount}/5 Members</span></h4>
                    <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)", marginBottom: "4px" }}>Track: <strong>{t.track}</strong></div>
                    <div style={{ fontSize: "0.8rem", color: "#10b981" }}>Looking for: {t.lookingFor.join(", ")}</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => handleRequestJoin(t)}><UserPlus size={14} /> Request to Join</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }



  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{myTeam.name}</h1>
          <p className="page-subtitle">{myTeam.description}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {isLeader && (
            <button className="btn btn-warning btn-sm" onClick={handleSOSMentor} style={{ background: "#ef4444", color: "white", border: "none" }}>
              <AlertTriangle size={14} /> SOS Mentor
            </button>
          )}
          <button className="btn btn-ghost danger" onClick={handleLeave}>
            <LogOut size={16} /> Leave Team
          </button>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: "1.5rem" }}>
        {["members", "invite", "matchmaking", "mentors"].map(t => (
          <button key={t} className={`tab-btn ${tab===t?"active":""}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "members" && (
        <div className="glass-card" style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users size={18} style={{ color: "var(--color-primary)" }} />
              Team Members ({myTeam.members.length}/5)
            </h3>
            <span className={`badge ${myTeam.status === "pending" ? "badge-warning" : "badge-success"}`}>
              {myTeam.status.toUpperCase()}
            </span>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Email</th>
                  {isLeader && <th style={{ textAlign: "right" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {myTeam.members.map((m: any, idx: number) => (
                  <tr key={idx}>
                    <td className="table-cell-primary">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: "0.8rem" }}>
                          {m.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 500 }}>{m.name}</span>
                        {m.email === currentUser.email && <span className="badge badge-neutral">You</span>}
                      </div>
                    </td>
                    <td>
                      {m.role === "Leader" && <span className="badge badge-primary"><Shield size={12} style={{ marginRight: 4 }} /> Leader</span>}
                      {m.role === "Member" && m.status === "pending_approval" && <span className="badge badge-warning">Pending Approval</span>}
                      {m.role === "Member" && m.status !== "pending_approval" && <span className="badge badge-neutral">Member</span>}
                      {m.role.includes("Mentor") && <span className="badge badge-success"><Star size={12} style={{ marginRight: 4 }} /> Mentor</span>}
                    </td>
                    <td><span style={{ color: "var(--color-text-2)" }}>{m.email}</span></td>
                    {isLeader && (
                      <td style={{ textAlign: "right" }}>
                        {m.email !== currentUser.email && m.status === "pending_approval" && (
                          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button className="btn btn-primary btn-sm" onClick={() => handleApproveMember(m.email)}>
                              Approve
                            </button>
                            <button className="btn btn-ghost danger btn-sm" onClick={() => handleRejectMember(m.email)}>
                              Reject
                            </button>
                          </div>
                        )}
                        {m.email !== currentUser.email && m.status !== "pending_approval" && (
                          <button className="btn btn-ghost danger btn-sm" onClick={() => handleKick(m.email)}>
                            Kick
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "matchmaking" && (
        <div className="glass-card">
          <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}><Zap size={18} style={{ display:'inline', marginRight: 8, color: '#f59e0b' }}/> Smart Matchmaking</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-2)", marginBottom: "1.5rem" }}>Search for specific skills your team is lacking, and send an invitation.</p>
          
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
            <input className="form-input" style={{ flex: 1 }} placeholder="Search by skill (e.g., React, Python, UI/UX)..." value={searchSkill} onChange={e => setSearchSkill(e.target.value)} />
            <button className="btn btn-primary" onClick={handleMatchmakingSearch}><Search size={16} /> Search</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {matches.map(m => (
              <div key={m.id} style={{ padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ margin: "0 0 0.25rem 0" }}>{m.name} <span className="badge badge-primary">{m.matchPercentage}% Match</span></h4>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>Role: {m.role} · Skills: {m.skills.join(", ")}</div>
                  <div style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "4px" }}>Why: {m.matchReasons?.join(", ")}</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => handleInvite(m.name)}><UserPlus size={14} /> Send Invite</button>
              </div>
            ))}
            {matches.length === 0 && <div style={{ color: "var(--color-text-3)", fontSize: "0.85rem" }}>Try searching for a skill to see recommendations.</div>}
          </div>
        </div>
      )}

      {tab === "mentors" && (
        <div className="glass-card">
          <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}><Star size={18} style={{ display:'inline', marginRight: 8, color: '#6366f1' }}/> Auto-find Mentors</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-2)", marginBottom: "1.5rem" }}>Our AI will recommend the best mentors based on your team's project track ({myTeam.track || "General"}).</p>
          
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
                  <button className="btn btn-primary btn-sm" onClick={() => handleInvite(m.name, true)}><UserCheck size={14} /> Request Mentorship</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "invite" && (
        <div className="glass-card" style={{ maxWidth: 520 }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Invite Member by Email</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-2)", marginBottom: "1.5rem" }}>Send a direct email invitation to a student to join your team.</p>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <input className="form-input" type="email" placeholder="student@university.edu" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
              <button className="btn btn-primary" disabled={!inviteEmail} onClick={() => handleInvite(inviteEmail)}><Mail size={15} /> Send Invite</button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

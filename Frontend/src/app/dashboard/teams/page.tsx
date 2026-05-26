"use client";
import { useState, useEffect } from "react";
import { Plus, Users, Shield, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { App, Modal } from "antd";

export default function TeamsPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myTeam, setMyTeam] = useState<any>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
    setCurrentUser(user);

    const team = localStorage.getItem(`myTeam_${user.email}`);
    if (team) {
      setMyTeam(JSON.parse(team));
    }
  }, []);

  const handleCreateTeam = () => {
    const newTeam = {
      id: Date.now().toString(),
      name: "New Awesome Team",
      description: "We are going to win SEAL!",
      status: "pending",
      members: [
        { name: currentUser.name, role: "Leader", email: currentUser.email }
      ]
    };
    localStorage.setItem(`myTeam_${currentUser.email}`, JSON.stringify(newTeam));
    setMyTeam(newTeam);
    message.success("Team created successfully! You are the Leader.");
  };

  const handleKick = (email: string) => {
    if (!myTeam) return;
    const updatedMembers = myTeam.members.filter((m:any) => m.email !== email);
    const updatedTeam = { ...myTeam, members: updatedMembers };
    localStorage.setItem(`myTeam_${currentUser.email}`, JSON.stringify(updatedTeam));
    setMyTeam(updatedTeam);
    message.success("Member removed from team.");
  };

  const handleLeave = () => {
    if (!myTeam) return;
    const isLeader = myTeam.members.find((m:any) => m.email === currentUser.email)?.role === "Leader";
    
    if (isLeader && myTeam.members.length > 1) {
      Modal.confirm({
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
      Modal.confirm({
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

  if (!currentUser) return null;

  if (!myTeam) {
    return (
      <div style={{ height: "calc(100vh - 150px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="empty-state" style={{ padding: "4rem 2rem", maxWidth: 500, margin: "0 auto", background: "var(--color-bg)", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-lg)" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <Users size={40} style={{ color: "var(--color-primary)" }} />
          </div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>You are not in a team</h2>
          <p style={{ color: "var(--color-text-2)", marginBottom: "2rem" }}>Join an existing team or create a new one to participate in the hackathon.</p>
          <button className="btn btn-primary btn-lg" onClick={handleCreateTeam} style={{ width: "100%", justifyContent: "center" }}>
            <Plus size={18} /> Create New Team
          </button>
        </div>
      </div>
    );
  }

  const isLeader = myTeam.members.find((m:any) => m.email === currentUser.email)?.role === "Leader";

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{myTeam.name}</h1>
          <p className="page-subtitle">{myTeam.description}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {isLeader && (
            <button className="btn btn-secondary" onClick={() => {
              if (myTeam.members.length >= 5) {
                message.error("Team is full (max 5 members).");
                return;
              }
              const mockMember = { name: `Student ${myTeam.members.length + 1}`, email: `student${myTeam.members.length + 1}@fpt.edu.vn`, role: "Member" };
              const updated = { ...myTeam, members: [...myTeam.members, mockMember] };
              localStorage.setItem(`myTeam_${currentUser.email}`, JSON.stringify(updated));
              setMyTeam(updated);
              message.success("Mock member added.");
            }}>
              <Plus size={16} /> Add Member (Mock)
            </button>
          )}
          <button className="btn btn-ghost danger" onClick={handleLeave}>
            <LogOut size={16} /> Leave Team
          </button>
        </div>
      </div>

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
                    {m.role === "Leader" ? (
                      <span className="badge badge-primary"><Shield size={12} style={{ marginRight: 4 }} /> Leader</span>
                    ) : (
                      <span className="badge badge-neutral">Member</span>
                    )}
                  </td>
                  <td><span style={{ color: "var(--color-text-2)" }}>{m.email}</span></td>
                  {isLeader && (
                    <td style={{ textAlign: "right" }}>
                      {m.email !== currentUser.email && (
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
    </div>
  );
}

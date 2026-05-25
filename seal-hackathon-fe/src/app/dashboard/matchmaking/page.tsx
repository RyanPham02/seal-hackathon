"use client";
import { useState, useEffect } from "react";
import { Search, Filter, UserPlus, MessageSquare, MapPin, GraduationCap, Code } from "lucide-react";
import { App } from "antd";

export default function MatchmakingPage() {
  const { message } = App.useApp();
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");

  useEffect(() => {
    // Load users from registeredUsers or use mocks
    const stored = localStorage.getItem("registeredUsers");
    let allUsers = [];
    if (stored) {
      allUsers = JSON.parse(stored).filter((u: any) => u.role !== "Admin");
    }
    
    // Add some realistic mock users if the DB is empty or too small
    if (allUsers.length < 3) {
      const mockUsers = [
        { name: "Nguyễn Văn A", email: "a.nv@fpt.edu.vn", university: "FPT University", skills: "React, Node.js, TypeScript", bio: "Looking for a team to build an awesome Web3 project." },
        { name: "Trần Thị B", email: "b.tt@fpt.edu.vn", university: "FPT University", skills: "UI/UX, Figma, Design", bio: "Passionate designer looking for a highly technical team." },
        { name: "Lê Văn C", email: "c.lv@student.hcmus.edu.vn", university: "HCMUS", skills: "Python, Machine Learning, AI", bio: "AI enthusiast. Let's build the future!" },
        { name: "Hoàng D", email: "d.h@fpt.edu.vn", university: "FPT University", skills: "Solidity, Web3, Smart Contracts", bio: "Blockchain dev. Seeking frontend developers." },
      ];
      
      // Merge avoiding duplicates by email
      mockUsers.forEach(mu => {
        if (!allUsers.find((u: any) => u.email === mu.email)) {
          allUsers.push(mu);
        }
      });
    }
    
    setUsers(allUsers);
  }, []);

  const handleInvite = (userName: string) => {
    message.success(`Invitation sent to ${userName}!`);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (u.bio && u.bio.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSkill = skillFilter === "" || 
                         (u.skills && u.skills.toLowerCase().includes(skillFilter.toLowerCase()));
    return matchesSearch && matchesSkill;
  });

  return (
    <div style={{ paddingBottom: "2rem" }}>
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title">Teammate Matchmaking</h1>
          <p className="page-subtitle">Find the perfect teammates based on skills, roles, and experience.</p>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: "2rem", padding: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <div className="search-bar" style={{ flex: "1 1 300px", maxWidth: "500px" }}>
            <Search size={16} style={{ color: "var(--color-text-3)" }} />
            <input 
              className="search-input" 
              placeholder="Search by name or bio..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: "1 1 200px" }}>
            <Filter size={16} style={{ color: "var(--color-text-3)" }} />
            <select 
              className="form-input" 
              style={{ width: "100%", cursor: "pointer" }}
              value={skillFilter}
              onChange={e => setSkillFilter(e.target.value)}
            >
              <option value="">All Skills / Roles</option>
              <option value="react">Frontend (React/Vue)</option>
              <option value="node">Backend (Node/Python)</option>
              <option value="design">UI/UX Design</option>
              <option value="ai">AI / Machine Learning</option>
              <option value="web3">Web3 / Blockchain</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {filteredUsers.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem 1rem" }}>
            <h3 style={{ color: "var(--color-text-2)" }}>No teammates found matching your criteria.</h3>
            <p style={{ color: "var(--color-text-3)", marginTop: "0.5rem" }}>Try adjusting your search or filters.</p>
          </div>
        ) : (
          filteredUsers.map((user, idx) => (
            <div key={idx} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1rem", transition: "transform 0.2s" }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div className="avatar-placeholder" style={{ width: 48, height: 48, fontSize: "1.2rem", flexShrink: 0 }}>
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: "0 0 0.2rem 0", fontSize: "1.1rem" }}>{user.name}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--color-text-3)", fontSize: "0.8rem" }}>
                    <GraduationCap size={12} /> {user.university || "University Student"}
                  </div>
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.9rem", color: "var(--color-text-2)", lineHeight: 1.5, marginBottom: "1rem", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {user.bio || "This user hasn't provided a bio yet, but they are looking for a team!"}
                </p>
                
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "auto" }}>
                  {(user.skills ? user.skills.split(",") : ["Enthusiastic Learner"]).map((skill: string, sIdx: number) => (
                    <span key={sIdx} style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", background: "rgba(99,102,241,0.1)", color: "var(--color-primary-2)", borderRadius: "99px", border: "1px solid rgba(99,102,241,0.2)" }}>
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
                <button className="btn btn-primary" style={{ flex: 1, padding: "0.6rem" }} onClick={() => handleInvite(user.name)}>
                  <UserPlus size={16} /> Send Invite
                </button>
                <button className="btn btn-secondary" style={{ padding: "0.6rem" }} onClick={() => message.info(`Chat initiated with ${user.name}`)}>
                  <MessageSquare size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

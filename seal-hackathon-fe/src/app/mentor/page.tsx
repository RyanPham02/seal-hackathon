import Link from "next/link";
import { Users, BookOpen, Clock } from "lucide-react";

export default function MentorDashboardPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mentor Dashboard</h1>
          <p className="page-subtitle">Welcome back! Manage your assigned teams and reviews.</p>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: "2rem" }}>
        <Link href="/mentor/teams" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="stat-icon" style={{ background: "rgba(99,102,241,0.15)", color: "var(--color-primary)" }}><Users size={24} /></div>
          <div>
            <div className="stat-value">My Teams</div>
            <div className="stat-label">View and review assigned teams</div>
          </div>
        </Link>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}><BookOpen size={24} /></div>
          <div>
            <div className="stat-value">Guidelines</div>
            <div className="stat-label">Read mentor instructions</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(244,63,94,0.15)", color: "#f43f5e" }}><Clock size={24} /></div>
          <div>
            <div className="stat-value">Schedule</div>
            <div className="stat-label">Upcoming review sessions</div>
          </div>
        </div>
      </div>
    </div>
  );
}

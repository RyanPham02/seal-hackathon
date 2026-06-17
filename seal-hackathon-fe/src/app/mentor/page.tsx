import Link from "next/link";
import { Users } from "lucide-react";

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
      </div>
    </div>
  );
}

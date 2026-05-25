import Link from "next/link";
import { Users, Shield, FileText } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Welcome to the SEAL System Administration Portal</p>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: "2rem" }}>
        <Link href="/admin/users" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="stat-icon" style={{ background: "rgba(99,102,241,0.15)", color: "var(--color-primary)" }}><Users size={24} /></div>
          <div>
            <div className="stat-value">User Approvals</div>
            <div className="stat-label">Manage registrations and guests</div>
          </div>
        </Link>
        
        <Link href="/admin/criteria" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="stat-icon" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}><FileText size={24} /></div>
          <div>
            <div className="stat-value">Criteria Templates</div>
            <div className="stat-label">Configure scoring rubrics</div>
          </div>
        </Link>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(244,63,94,0.15)", color: "#f43f5e" }}><Shield size={24} /></div>
          <div>
            <div className="stat-value">System Alerts</div>
            <div className="stat-label">Monitor system health</div>
          </div>
        </div>
      </div>
    </div>
  );
}

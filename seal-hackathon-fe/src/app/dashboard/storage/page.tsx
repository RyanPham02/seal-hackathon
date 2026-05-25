"use client";
import { Cloud, HardDrive, Database } from "lucide-react";

export default function StoragePage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cloud Storage</h1>
          <p className="page-subtitle">System storage usage and quotas</p>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: "2rem" }}>
        <div className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <Cloud style={{ color: "#6366f1" }} />
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>AWS S3</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>45.2 GB <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "var(--color-text-3)" }}>/ 100 GB</span></div>
          <div className="progress" style={{ marginTop: "1rem", height: 6 }}>
            <div className="progress-fill" style={{ width: "45.2%", background: "#6366f1" }} />
          </div>
        </div>
        
        <div className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <Database style={{ color: "#10b981" }} />
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>PostgreSQL</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>2.1 GB <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "var(--color-text-3)" }}>/ 10 GB</span></div>
          <div className="progress" style={{ marginTop: "1rem", height: 6 }}>
            <div className="progress-fill" style={{ width: "21%", background: "#10b981" }} />
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <HardDrive style={{ color: "#f59e0b" }} />
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>Cache (Redis)</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>840 MB <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "var(--color-text-3)" }}>/ 2 GB</span></div>
          <div className="progress" style={{ marginTop: "1rem", height: 6 }}>
            <div className="progress-fill" style={{ width: "42%", background: "#f59e0b" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

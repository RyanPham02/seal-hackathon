"use client";
import { FileText, Download, Upload, Folder, MoreVertical } from "lucide-react";

export default function DocumentsPage() {
  const docs = [
    { name: "SEAL_Hackathon_Rulebook.pdf", size: "2.4 MB", date: "May 10", type: "pdf" },
    { name: "Judging_Rubric_v2.xlsx", size: "1.1 MB", date: "May 12", type: "excel" },
    { name: "Sponsorship_Deck.pptx", size: "5.6 MB", date: "May 15", type: "powerpoint" },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents Library</h1>
          <p className="page-subtitle">Manage official hackathon resources</p>
        </div>
        <button className="btn btn-primary"><Upload size={15} /> Upload File</button>
      </div>

      <div className="grid-3" style={{ marginBottom: "2rem" }}>
        {["Rules & Guidelines", "Templates", "Marketing Assets"].map(folder => (
          <div key={folder} className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer" }}>
            <Folder size={24} style={{ color: "var(--color-primary)" }} />
            <div style={{ fontWeight: 600 }}>{folder}</div>
          </div>
        ))}
      </div>

      <div className="glass-card">
        <h4 style={{ marginBottom: "1rem" }}>Recent Files</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {docs.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", background: "rgba(15,23,42,0.4)", borderRadius: "var(--radius-md)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <FileText size={18} style={{ color: "var(--color-text-3)" }} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>{d.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>{d.size} · Uploaded {d.date}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-ghost btn-sm btn-icon"><Download size={14} /></button>
                <button className="btn btn-ghost btn-sm btn-icon"><MoreVertical size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

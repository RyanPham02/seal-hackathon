"use client";
import { useState } from "react";
import { Trophy, Gift, Award, Star, Medal } from "lucide-react";

const PRIZES = [
  { id: 1, title: "Grand Prize", amount: "$10,000", track: "All Tracks", description: "Best overall project in the hackathon", icon: <Trophy size={32} style={{ color: "#f59e0b" }} /> },
  { id: 2, title: "First Runner-up", amount: "$5,000", track: "All Tracks", description: "Second best overall project", icon: <Medal size={32} style={{ color: "#94a3b8" }} /> },
  { id: 3, title: "Best AI Integration", amount: "$2,000", track: "AI & Machine Learning", description: "Most innovative use of AI", icon: <Star size={32} style={{ color: "#10b981" }} /> },
  { id: 4, title: "Best UI/UX", amount: "$1,500", track: "Web & Mobile", description: "Outstanding design and user experience", icon: <Award size={32} style={{ color: "#8b5cf6" }} /> },
];

export default function PrizesPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hackathon Prizes</h1>
          <p className="page-subtitle">Rewards and categories for winning teams</p>
        </div>
      </div>

      <div className="grid-2">
        {PRIZES.map(p => (
          <div key={p.id} className="glass-card" style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", padding: "1.5rem" }}>
            <div style={{ width: 64, height: 64, background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {p.icon}
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <h3 style={{ fontSize: "1.25rem", margin: 0 }}>{p.title}</h3>
                <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-primary)", fontFamily: "var(--font-display)" }}>{p.amount}</span>
              </div>
              <span className="badge badge-neutral" style={{ marginBottom: "0.75rem", display: "inline-block" }}>{p.track}</span>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-2)", margin: 0, lineHeight: 1.5 }}>{p.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

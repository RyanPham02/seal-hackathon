"use client";
import { useState, useEffect } from "react";
import { Trophy, Award, Star, Medal, Gift } from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";

interface PrizeDto {
  prizeId: string;
  eventId: string;
  eventName: string;
  title: string;
  amount?: string | null;
  track?: string | null;
  description?: string | null;
  rank: number;
}

function prizeIcon(rank: number) {
  if (rank <= 1) return <Trophy size={32} style={{ color: "#f59e0b" }} />;
  if (rank === 2) return <Medal size={32} style={{ color: "#94a3b8" }} />;
  if (rank === 3) return <Star size={32} style={{ color: "#10b981" }} />;
  return <Award size={32} style={{ color: "#8b5cf6" }} />;
}

export default function PrizesPage() {
  const { message } = App.useApp();
  const [prizes, setPrizes] = useState<PrizeDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiRequest<PrizeDto[]>("/Prizes");
        setPrizes(data);
      } catch (err) {
        message.error(err instanceof Error ? err.message : "Could not load prizes.");
        setPrizes([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [message]);

  return (
    <div style={{ maxWidth: 1100, height: "calc(100vh - 100px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div>
          <h1 className="page-title">Hackathon Prizes</h1>
          <p className="page-subtitle">Rewards and categories for winning teams</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><Gift size={48} className="empty-icon" /><div className="empty-title">Loading prizes…</div></div>
      ) : prizes.length === 0 ? (
        <div className="empty-state"><Gift size={48} className="empty-icon" /><div className="empty-title">No prizes announced yet</div></div>
      ) : (
        <div className="glass-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem", overflowY: "auto", flex: 1, paddingRight: "0.5rem", paddingBottom: "2rem" }}>
          {prizes.map(p => (
            <div key={p.prizeId} className="glass-card" style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", padding: "1.5rem", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
              <div style={{ width: 64, height: 64, background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)" }}>
                {prizeIcon(p.rank)}
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", gap: "1rem" }}>
                  <h3 style={{ fontSize: "1.25rem", margin: 0, color: "var(--color-text-1)" }}>{p.title}</h3>
                  {p.amount && <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-primary)", fontFamily: "var(--font-display)", whiteSpace: "nowrap" }}>{p.amount}</span>}
                </div>
                <span className="glass-badge primary" style={{ marginBottom: "0.75rem", display: "inline-block" }}>{p.track || p.eventName}</span>
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-2)", margin: 0, lineHeight: 1.5 }}>{p.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

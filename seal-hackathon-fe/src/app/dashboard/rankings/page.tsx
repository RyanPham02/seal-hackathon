"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { Trophy, Medal, Award, Download, Crown, RefreshCw } from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";

type EventDto = {
  eventId: string;
  eventName: string;
  categories: {
    categoryId: string;
    categoryName: string;
  }[];
  rounds: {
    roundId: string;
    roundName: string;
    roundOrder: number;
  }[];
};

type RankingDto = {
  rank: number;
  submissionId: string;
  teamId: string;
  teamName: string;
  categoryName?: string;
  totalScore: number;
  submittedAt: string;
};

const RANK_ICON: Record<number, React.ReactNode> = {
  1: <Trophy size={16} style={{ color: "#f59e0b" }} />,
  2: <Medal size={16} style={{ color: "#94a3b8" }} />,
  3: <Award size={16} style={{ color: "#b45309" }} />,
};

export default function RankingsPage() {
  const { message } = App.useApp();
  const [events, setEvents] = useState<EventDto[]>([]);
  const [eventId, setEventId] = useState("");
  const [roundId, setRoundId] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [rankings, setRankings] = useState<RankingDto[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedEvent = useMemo(
    () => events.find((event) => event.eventId === eventId) ?? null,
    [events, eventId],
  );

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<EventDto[]>("/Events");
      setEvents(data);
      const firstEvent = data[0];
      if (!eventId) {
        setEventId(firstEvent?.eventId || "");
        setRoundId(firstEvent?.rounds?.[0]?.roundId || "");
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load events.");
    } finally {
      setLoading(false);
    }
  };

  const loadRankings = async () => {
    if (!roundId) {
      setRankings([]);
      return;
    }

    setLoading(true);
    try {
      const path =
        categoryId === "all"
          ? `/ranking/round/${roundId}`
          : `/ranking/category/${categoryId}/round/${roundId}`;
      setRankings(await apiRequest<RankingDto[]>(path));
    } catch (err) {
      setRankings([]);
      message.error(err instanceof Error ? err.message : "Could not load rankings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const handleEventChange = (nextEventId: string) => {
    const nextEvent = events.find((event) => event.eventId === nextEventId);
    setEventId(nextEventId);
    setRoundId(nextEvent?.rounds[0]?.roundId || "");
    setCategoryId("all");
  };

  useEffect(() => {
    void loadRankings();
  }, [roundId, categoryId]);

  const exportCsv = () => {
    const rows = [
      ["Rank", "Team", "Category", "Score", "Submitted At"],
      ...rankings.map((item) => [
        item.rank,
        item.teamName,
        item.categoryName ?? "",
        item.totalScore.toFixed(2),
        item.submittedAt,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "rankings.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const topThree = rankings.slice(0, 3);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Rankings & Leaderboard</h1>
          <p className="page-subtitle">
            {selectedEvent?.eventName ?? "Select an event"} {roundId ? "- Backend ranking" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <select className="form-input" style={{ width: 220 }} value={eventId} onChange={(event) => handleEventChange(event.target.value)} disabled={events.length === 0}>
            {events.map((event) => (
              <option key={event.eventId} value={event.eventId}>{event.eventName}</option>
            ))}
          </select>
          <select className="form-input" style={{ width: 180 }} value={roundId} onChange={(event) => setRoundId(event.target.value)} disabled={!selectedEvent?.rounds.length}>
            {selectedEvent?.rounds.map((round) => (
              <option key={round.roundId} value={round.roundId}>{round.roundName}</option>
            ))}
          </select>
          <select className="form-input" style={{ width: 180 }} value={categoryId} onChange={(event) => setCategoryId(event.target.value)} disabled={!selectedEvent?.categories.length}>
            <option value="all">All categories</option>
            {selectedEvent?.categories.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>
            ))}
          </select>
          <button className="btn btn-secondary btn-icon" onClick={loadRankings} disabled={loading || !roundId}>
            <RefreshCw size={15} />
          </button>
          <button className="btn btn-secondary" onClick={exportCsv} disabled={rankings.length === 0}>
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <span className="spinner" />
          <div className="empty-title">Loading rankings</div>
        </div>
      ) : !roundId ? (
        <div className="empty-state">
          <Trophy size={48} className="empty-icon" />
          <div className="empty-title">No round selected</div>
          <div className="empty-desc">Create at least one round before viewing rankings.</div>
        </div>
      ) : rankings.length === 0 ? (
        <div className="empty-state">
          <Trophy size={48} className="empty-icon" />
          <div className="empty-title">No ranking data</div>
          <div className="empty-desc">Rankings appear after teams submit and judges score them.</div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", alignItems: "flex-end", justifyContent: "center" }}>
            {topThree.map((item, index) => (
              <div key={item.submissionId} className="glass-card" style={{ flex: 1, textAlign: "center", borderTop: `3px solid ${item.rank === 1 ? "#f59e0b" : item.rank === 2 ? "#94a3b8" : "#b45309"}`, paddingTop: index === 0 ? "2rem" : "1.5rem", transform: item.rank === 1 ? "translateY(-12px)" : undefined }}>
                <div style={{ display: "flex", justifyContent: "center" }}><Crown size={item.rank === 1 ? 42 : 32} style={{ color: item.rank === 1 ? "#f59e0b" : item.rank === 2 ? "#94a3b8" : "#b45309" }} /></div>
                <div style={{ fontWeight: 800, marginTop: "0.5rem" }}>{item.teamName}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>{item.categoryName ?? "Category"}</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "var(--font-display)", color: item.rank === 1 ? "#f59e0b" : item.rank === 2 ? "#94a3b8" : "#b45309", marginTop: "0.5rem" }}>
                  {item.totalScore.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead><tr>
                <th>Rank</th><th>Team</th><th>Category</th><th>Score</th><th>Submitted</th><th>Score Bar</th>
              </tr></thead>
              <tbody>
                {rankings.map(r => (
                  <tr key={r.submissionId}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        {RANK_ICON[r.rank] || <span style={{ color: "var(--color-text-3)", fontWeight: 700 }}>#{r.rank}</span>}
                        {r.rank <= 3 && <span style={{ fontWeight: 800, color: r.rank===1?"#f59e0b":r.rank===2?"#94a3b8":"#b45309" }}>#{r.rank}</span>}
                      </div>
                    </td>
                    <td className="table-cell-primary">{r.teamName}</td>
                    <td><span className="badge badge-neutral">{r.categoryName ?? "N/A"}</span></td>
                    <td>
                      <span style={{ fontWeight: 800, fontSize: "1rem", fontFamily: "var(--font-display)", color: r.totalScore >= 80 ? "#10b981" : r.totalScore >= 60 ? "#f59e0b" : "#f43f5e" }}>
                        {r.totalScore.toFixed(2)}
                      </span>
                    </td>
                    <td>{new Date(r.submittedAt).toLocaleString()}</td>
                    <td style={{ minWidth: 120 }}>
                      <div className="progress">
                        <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, r.totalScore))}%`, background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

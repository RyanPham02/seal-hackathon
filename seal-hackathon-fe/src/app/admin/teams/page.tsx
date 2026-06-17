"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, Search, CheckCircle, XCircle, Shield, Filter, RefreshCw } from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";

type AdminTeam = {
  teamId: string;
  teamName: string;
  status: string;
  category?: { categoryName: string } | null;
  currentRound?: { roundName: string } | null;
  members: { userId: string; fullName: string; email: string }[];
};

export default function AdminTeamsPage() {
  const { message, modal } = App.useApp();
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  // Per-row action guard against double-clicks (`approve-<id>` / `reject-<id>`).
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const loadTeams = async () => {
    setLoading(true);
    try {
      setTeams(await apiRequest<AdminTeam[]>("/admin/teams"));
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load teams.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadTeams();
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const handleUpdateStatus = async (teamId: string, action: "approve" | "reject") => {
    if (busyAction) return;
    setBusyAction(`${action}-${teamId}`);
    try {
      await apiRequest(`/admin/teams/${teamId}/${action}`, { method: "PUT" });
      message.success(action === "approve" ? "Team approved." : "Team rejected.");
      await loadTeams();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not update team status.");
    } finally {
      setBusyAction(null);
    }
  };

  const confirmReject = (team: AdminTeam) => {
    modal.confirm({
      title: `Reject "${team.teamName}"?`,
      content: "The team will be marked as eliminated and removed from the competition flow.",
      okText: "Reject Team",
      okButtonProps: { danger: true },
      onOk: () => handleUpdateStatus(team.teamId, "reject"),
    });
  };

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const matchFilter = filter === "All" || team.status === filter;
      const haystack = `${team.teamName} ${team.category?.categoryName ?? ""} ${team.currentRound?.roundName ?? ""}`.toLowerCase();
      return matchFilter && haystack.includes(search.toLowerCase());
    });
  }, [filter, search, teams]);

  return (
    <div style={{ maxWidth: 1100 }}>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 className="page-title">Team Management</h1>
          <p className="page-subtitle">Review, approve, and reject registered teams</p>
        </div>
        <button className="btn btn-secondary" onClick={loadTeams} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="grid-4" style={{ marginBottom: "2rem" }}>
        {[
          { label: "All Teams", val: teams.length, color: "var(--color-primary)", filterValue: "All" },
          { label: "Pending", val: teams.filter((team) => team.status === "Pending").length, color: "#f59e0b", filterValue: "Pending" },
          { label: "Approved", val: teams.filter((team) => team.status === "Approved").length, color: "#10b981", filterValue: "Approved" },
          { label: "Eliminated", val: teams.filter((team) => team.status === "Eliminated").length, color: "#ef4444", filterValue: "Eliminated" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card"
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "1.25rem", cursor: "pointer", border: filter === stat.filterValue ? `1px solid ${stat.color}` : undefined }}
            onClick={() => setFilter(stat.filterValue)}
          >
            <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-display)", color: stat.color, lineHeight: 1 }}>{stat.val}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)", fontWeight: 500 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ marginBottom: "2rem", display: "flex", gap: "1rem", alignItems: "center" }}>
        <div className="input-with-icon" style={{ flex: 1 }}>
          <input
            className="form-input"
            placeholder="Search by team, category, or round..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "2.5rem" }}
          />
          <Search size={16} style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-3)" }} />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Filter size={16} style={{ color: "var(--color-text-3)" }} />
          <select className="form-input" style={{ width: "auto" }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Eliminated">Eliminated</option>
          </select>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="empty-state">
            <span className="spinner" />
            <div className="empty-title">Loading teams</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--color-border-1)" }}>
                <th style={{ padding: "1.25rem 1.5rem" }}>Team</th>
                <th style={{ padding: "1.25rem 1.5rem" }}>Category</th>
                <th style={{ padding: "1.25rem 1.5rem" }}>Members</th>
                <th style={{ padding: "1.25rem 1.5rem" }}>Status</th>
                <th style={{ padding: "1.25rem 1.5rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.map((team) => (
                <tr key={team.teamId} style={{ borderBottom: "1px solid var(--color-border-1)" }}>
                  <td style={{ padding: "1.25rem 1.5rem" }}>
                    <div style={{ fontWeight: 600 }}>{team.teamName}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>{team.currentRound?.roundName ?? "No round assigned"}</div>
                  </td>
                  <td style={{ padding: "1.25rem 1.5rem" }}>
                    <span className="badge badge-neutral">{team.category?.categoryName ?? "Uncategorized"}</span>
                  </td>
                  <td style={{ padding: "1.25rem 1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Users size={16} style={{ color: "var(--color-text-3)" }} />
                      <span>{team.members.length}/5</span>
                    </div>
                  </td>
                  <td style={{ padding: "1.25rem 1.5rem" }}>
                    <span className={`badge ${team.status === "Approved" ? "badge-success" : team.status === "Pending" ? "badge-warning" : "badge-danger"}`}>
                      {team.status}
                    </span>
                  </td>
                  <td style={{ padding: "1.25rem 1.5rem", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      {team.status !== "Approved" && (
                        <button
                          className="btn btn-sm"
                          style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", padding: "0.4rem 0.8rem", border: "1px solid rgba(16,185,129,0.2)" }}
                          disabled={busyAction !== null}
                          onClick={() => handleUpdateStatus(team.teamId, "approve")}
                        >
                          {busyAction === `approve-${team.teamId}` ? <span className="spinner" /> : <><CheckCircle size={14} /> Approve</>}
                        </button>
                      )}
                      {team.status !== "Eliminated" && (
                        <button
                          className="btn btn-sm"
                          style={{ background: "rgba(239,68,68,0.1)", color: "#fb7185", padding: "0.4rem 0.8rem", border: "1px solid rgba(239,68,68,0.2)" }}
                          disabled={busyAction !== null}
                          onClick={() => confirmReject(team)}
                        >
                          {busyAction === `reject-${team.teamId}` ? <span className="spinner" /> : <><XCircle size={14} /> Reject</>}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTeams.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--color-text-3)" }}>
                    <Shield size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
                    <div>No teams match the current filter.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

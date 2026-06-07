"use client";
import { use, useState, useEffect, useCallback } from "react";
import { ChevronLeft, Users, Target, Clock, Trophy, Zap } from "lucide-react";
import Link from "next/link";
import { Modal, Select, Input, App } from "antd";
import { apiRequest } from "@/lib/api";

interface RoundDto {
  roundId: string;
  roundName: string;
  roundOrder: number;
  maxTeamsAdvancing: number;
  submissionDeadline?: string | null;
}

interface CategoryDto {
  categoryId: string;
  categoryName: string;
  description?: string | null;
  teamCount: number;
}

interface EventDetailDto {
  eventId: string;
  eventName: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  status: string;
  categories: CategoryDto[];
  rounds: RoundDto[];
}

const STATUS_BADGE: Record<string, string> = {
  Ongoing: "badge-success",
  Active: "badge-success",
  Upcoming: "badge-primary",
  Ended: "badge-neutral",
  Completed: "badge-neutral",
};

const TRACK_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#f59e0b", "#f43f5e", "#10b981"];

function formatDate(value?: string | null) {
  if (!value) return "TBD";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "TBD" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { message } = App.useApp();
  const [tab, setTab] = useState("overview");
  const [event, setEvent] = useState<EventDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [regVisible, setRegVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [track, setTrack] = useState<string | undefined>(undefined);

  const fetchEvent = useCallback(() => (
    apiRequest<EventDetailDto>(`/Events/${id}`)
  ), [id]);

  const loadEvent = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEvent();
      setEvent(data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load event.");
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [fetchEvent, message]);

  useEffect(() => {
    let active = true;

    fetchEvent()
      .then((data) => {
        if (active) {
          setEvent(data);
        }
      })
      .catch((err) => {
        if (active) {
          message.error(err instanceof Error ? err.message : "Could not load event.");
          setEvent(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [fetchEvent, message]);

  const handleRegister = async () => {
    if (!teamName || !track) return;
    setSubmitting(true);
    try {
      await apiRequest("/teams", {
        method: "POST",
        body: JSON.stringify({ teamName, categoryId: track }),
      });
      message.success("Successfully registered your team for this hackathon!");
      setRegVisible(false);
      setTeamName("");
      setTrack(undefined);
      loadEvent();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not register team.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="empty-state"><Clock size={48} className="empty-icon" /><div className="empty-title">Loading event…</div></div>;
  }

  if (!event) {
    return (
      <div className="empty-state">
        <Target size={48} className="empty-icon" />
        <div className="empty-title">Event not found</div>
        <Link href="/dashboard/events"><button className="btn btn-secondary" style={{ marginTop: "1rem" }}>Back to Events</button></Link>
      </div>
    );
  }

  const totalTeams = event.categories.reduce((sum, c) => sum + (c.teamCount ?? 0), 0);
  const sortedRounds = [...event.rounds].sort((a, b) => a.roundOrder - b.roundOrder);

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link href="/dashboard/events"><button className="btn btn-ghost btn-sm btn-icon"><ChevronLeft size={16} /></button></Link>
            <h1 className="page-title">{event.eventName}</h1>
            <span className={`badge ${STATUS_BADGE[event.status] || "badge-neutral"}`}>{event.status}</span>
          </div>
          <p className="page-subtitle">{event.description || "No description provided."}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setRegVisible(true)} disabled={event.categories.length === 0}>
          <Users size={15} /> Register Now
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid-4" style={{ marginBottom: "2rem" }}>
        {[
          { icon: Target, label: "Tracks", val: event.categories.length, color: "#6366f1" },
          { icon: Users,  label: "Teams",  val: totalTeams,              color: "#8b5cf6" },
          { icon: Clock,  label: "Rounds", val: event.rounds.length,     color: "#06b6d4" },
          { icon: Trophy, label: "Status", val: event.status,            color: "#f59e0b" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: `${s.color}22` }}>
                <Icon size={20} style={{ color: s.color }} />
              </div>
              <div>
                <div className="stat-value" style={{ background: "none", WebkitTextFillColor: s.color, color: s.color }}>{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: "1.5rem" }}>
        {["overview", "rounds", "tracks"].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="grid-2">
          <div className="glass-card">
            <h4 style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "var(--color-text-2)" }}>KEY DATES</h4>
            {[
              { label: "Start Date", val: formatDate(event.startDate) },
              { label: "End Date", val: formatDate(event.endDate) },
              ...sortedRounds.map((r) => ({ label: `${r.roundName} Deadline`, val: formatDate(r.submissionDeadline) })),
            ].map((d, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--color-border)", fontSize: "0.875rem" }}>
                <span style={{ color: "var(--color-text-2)" }}>{d.label}</span>
                <strong>{d.val}</strong>
              </div>
            ))}
          </div>
          <div className="glass-card">
            <h4 style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "var(--color-text-2)" }}>TEAMS PER TRACK</h4>
            {event.categories.length === 0 && <div style={{ color: "var(--color-text-3)", fontSize: "0.85rem" }}>No tracks configured yet.</div>}
            {event.categories.map((c) => {
              const pct = totalTeams > 0 ? (c.teamCount / totalTeams) * 100 : 0;
              return (
                <div key={c.categoryId} style={{ marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.4rem" }}>
                    <span style={{ fontWeight: 600 }}>{c.categoryName}</span>
                    <span style={{ color: "var(--color-text-3)" }}>{c.teamCount} teams</span>
                  </div>
                  <div className="progress"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rounds */}
      {tab === "rounds" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {sortedRounds.length === 0 && <div className="empty-state"><Clock size={48} className="empty-icon" /><div className="empty-title">No rounds configured</div></div>}
          {sortedRounds.map((r, i) => (
            <div key={r.roundId} className="glass-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.85rem" }}>{i + 1}</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{r.roundName}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-3)" }}>Deadline: {formatDate(r.submissionDeadline)}</div>
                  </div>
                </div>
                <span className="badge badge-primary">Top {r.maxTeamsAdvancing}</span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <Link href={`/dashboard/judging`}><button className="btn btn-secondary btn-sm">View Scores</button></Link>
                <Link href={`/dashboard/rankings`}><button className="btn btn-ghost btn-sm"><Trophy size={13} /> Rankings</button></Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tracks */}
      {tab === "tracks" && (
        <div className="grid-2">
          {event.categories.length === 0 && <div className="empty-state"><Target size={48} className="empty-icon" /><div className="empty-title">No tracks configured</div></div>}
          {event.categories.map((tr, i) => (
            <div key={tr.categoryId} className="glass-card" style={{ borderTop: `3px solid ${TRACK_COLORS[i % TRACK_COLORS.length]}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>{tr.categoryName}</h4>
                <span className="badge badge-primary"><Users size={10} /> {tr.teamCount}</span>
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--color-text-2)" }}>
                <Zap size={12} style={{ color: TRACK_COLORS[i % TRACK_COLORS.length], marginRight: 4 }} />
                {tr.description || "No description."}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        title="Register for Hackathon"
        open={regVisible}
        onCancel={() => setRegVisible(false)}
        onOk={handleRegister}
        okText="Confirm Registration"
        confirmLoading={submitting}
        okButtonProps={{ disabled: !teamName || !track }}
      >
        <div style={{ marginBottom: "1rem", color: "var(--color-text-2)", fontSize: "0.9rem" }}>
          Please create a team name and select a track to participate in this hackathon.
        </div>
        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Team Name</label>
          <Input placeholder="Enter your awesome team name" value={teamName} onChange={e => setTeamName(e.target.value)} size="large" />
        </div>
        <div className="form-group">
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Select Track</label>
          <Select style={{ width: "100%" }} size="large" placeholder="Choose a competition track" value={track} onChange={setTrack}>
            {event.categories.map(c => (
              <Select.Option key={c.categoryId} value={c.categoryId}>{c.categoryName}</Select.Option>
            ))}
          </Select>
        </div>
      </Modal>
    </div>
  );
}

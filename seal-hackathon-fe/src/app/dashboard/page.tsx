"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Trophy, Users, Calendar, Target, TrendingUp, TrendingDown,
  Clock, ArrowRight, Zap, Award,
} from "lucide-react";
import Link from "next/link";
import styles from "./page.module.css";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { App } from "antd";

const STATUS_BADGE: Record<string, string> = {
  Active:    "badge-success",
  Ongoing:   "badge-success",
  Upcoming:  "badge-primary",
  Ended:     "badge-neutral",
  Completed: "badge-neutral",
  Cancelled: "badge-neutral",
};

const ACTIVITY_COLOR: Record<string, string> = {
  info: "#6366f1", success: "#10b981", warning: "#f59e0b", error: "#f43f5e",
};

function relativeTime(value: string) {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface EventRoundDto {
  roundName?: string;
  submissionDeadline?: string | null;
}

interface EventCategoryDto {
  teamCount?: number;
}

interface EventDto {
  eventId: string;
  eventName: string;
  status: string;
  rounds?: EventRoundDto[];
  categories?: EventCategoryDto[];
  endDate: string;
}

interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
}

interface ActivityItem {
  title: string;
  message: string;
  time: string;
  type: string;
}

interface DeadlineItem {
  event: string;
  task: string;
  date: string;
  urgent: boolean;
}

interface DashboardMetrics {
  activeEvents: number;
  totalEvents: number;
  totalTeams: number;
  totalTracks: number;
  upcomingEvent: string;
}

interface MappedEvent {
  id: string;
  name: string;
  status: string;
  currentRound?: string;
  teamsCount: number;
  tracksCount: number;
  endDate: string;
}

interface InvitationResponse {
  id: string;
  teamId: string;
  teamName: string;
  inviterUserId: string;
  inviterUserName: string;
  inviteeUserId: string;
  inviteeUserName: string;
  inviteeUserEmail: string;
  status: string;
  message?: string;
  createdAt: string;
}

interface TeamDto {
  teamId: string;
  teamName: string;
  leaderId: string;
}

export default function DashboardPage() {
  const { message } = App.useApp();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "active" | "upcoming">("all");
  const [events, setEvents] = useState<MappedEvent[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<InvitationResponse[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [myTeam, setMyTeam] = useState<TeamDto | null>(null);
  const userRoles = user?.roles ?? [];
  const isAdmin = userRoles.includes("Admin");
  const canJudge = isAdmin || userRoles.includes("Judge");
  const currentUserId = user?.id ?? null;

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await apiRequest<EventDto[]>("/Events");
        const mappedEvents = data.map((event) => ({
          id: event.eventId,
          name: event.eventName,
          status: event.status === "Ongoing" ? "Active" : event.status,
          currentRound: event.rounds?.[0]?.roundName,
          teamsCount: event.categories?.reduce((sum: number, category: EventCategoryDto) => sum + (category.teamCount ?? 0), 0) ?? 0,
          tracksCount: event.categories?.length ?? 0,
          endDate: event.endDate,
        }));

        setEvents(mappedEvents);
        setMetrics({
          activeEvents: mappedEvents.filter((event) => event.status === "Active").length,
          totalEvents: mappedEvents.length,
          totalTeams: mappedEvents.reduce((sum, event) => sum + event.teamsCount, 0),
          totalTracks: mappedEvents.reduce((sum, event) => sum + event.tracksCount, 0),
          upcomingEvent: mappedEvents[0]?.name ?? "SEAL Hackathon",
        });

        // Derive upcoming deadlines from event round submission deadlines
        const now = Date.now();
        const upcoming: DeadlineItem[] = data
          .flatMap((event) =>
            (event.rounds ?? [])
              .filter((r) => r.submissionDeadline)
              .map((r) => ({
                event: event.eventName,
                task: `${r.roundName ?? "Round"} – Submission Deadline`,
                rawDate: new Date(r.submissionDeadline as string),
              })),
          )
          .filter((d) => !Number.isNaN(d.rawDate.getTime()) && d.rawDate.getTime() >= now)
          .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime())
          .slice(0, 5)
          .map((d) => ({
            event: d.event,
            task: d.task,
            date: d.rawDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            urgent: d.rawDate.getTime() - now < 1000 * 60 * 60 * 24 * 7,
          }));
        setDeadlines(upcoming);
      } catch (err) {
        message.error(err instanceof Error ? err.message : "Could not load dashboard data.");
        setEvents([]);
        setMetrics({
          activeEvents: 0,
          totalEvents: 0,
          totalTeams: 0,
          totalTracks: 0,
          upcomingEvent: "SEAL Hackathon",
        });
      }
    };

    const loadActivity = async () => {
      try {
        const notifications = await apiRequest<NotificationDto[]>("/notifications");
        setActivities(
          notifications.slice(0, 6).map((n) => ({
            title: n.title,
            message: n.message,
            time: relativeTime(n.createdAt),
            type: n.type,
          })),
        );
      } catch {
        setActivities([]);
      }
    };

    const loadInvitations = async () => {
      try {
        const invites = await apiRequest<InvitationResponse[]>("/teams/invitations/received");
        setReceivedInvites(invites.filter((inv) => inv.status === "Pending"));
      } catch {
        setReceivedInvites([]);
      }
    };

    const loadMyTeam = async () => {
      try {
        const team = await apiRequest<TeamDto>("/teams/my-team");
        setMyTeam(team);
      } catch {
        setMyTeam(null);
      }
    };

    loadDashboard();
    loadActivity();
    loadInvitations();
    loadMyTeam();
  }, [message]);

  const filteredEvents = useMemo(() => {
    return events.filter(e =>
      activeTab === "all" ? true : e.status.toLowerCase() === activeTab.toLowerCase()
    );
  }, [activeTab, events]);

  const handleAcceptInvite = async (id: string, teamName: string) => {
    try {
      await apiRequest(`/teams/invitations/${id}/accept`, { method: "POST" });
      message.success(`You have successfully joined team ${teamName}!`);
      window.location.reload();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to accept invitation.");
    }
  };

  const handleDeclineInvite = async (id: string) => {
    try {
      await apiRequest(`/teams/invitations/${id}/reject`, { method: "POST" });
      message.success("Invitation declined.");
      const invites = await apiRequest<InvitationResponse[]>("/teams/invitations/received");
      setReceivedInvites(invites.filter((inv) => inv.status === "Pending"));
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to decline invitation.");
    }
  };

  const dynamicStats = [
    {
      label: "Active Events",    value: metrics?.activeEvents || "0",    icon: Calendar, color: "#6366f1",
      trend: "Current running", up: true,
    },
    {
      label: "Registered Teams", value: metrics?.totalTeams || "0",   icon: Users,   color: "#8b5cf6",
      trend: "Total in system",     up: true,
    },
    {
      label: "Total Events",     value: metrics?.totalEvents ?? "0",  icon: Award,   color: "#f59e0b",
      trend: "All time",         up: true,
    },
    {
      label: "Total Tracks",     value: metrics?.totalTracks ?? "0",  icon: Target,  color: "#06b6d4",
      trend: "Across events",    up: true,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: receivedInvites.length > 0 ? "1.5rem" : "2rem" }}>
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Welcome back · {metrics?.upcomingEvent || "SEAL Hackathon"} is live 🚀</p>
        </div>
        {isAdmin && (
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link href="/dashboard/events/create">
              <button className="btn btn-primary"><Calendar size={16} /> New Event</button>
            </Link>
          </div>
        )}
      </div>

      {/* Pending Invitations Banner */}
      {receivedInvites.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
          {receivedInvites.map((invite) => {
            const isJoinRequest = myTeam && myTeam.teamId === invite.teamId && myTeam.leaderId === currentUserId;
            return (
              <div
                key={invite.id}
                className="glass-card"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderLeft: "4px solid var(--color-primary)",
                  padding: "1.25rem 1.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: "rgba(99,102,241,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--color-primary)",
                    }}
                  >
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "1.1rem", color: "var(--color-text-1)" }}>
                      {isJoinRequest ? "Join Request" : "Team Invitation"}
                    </h4>
                    <p style={{ margin: "0.2rem 0 0", color: "var(--color-text-3)", fontSize: "0.9rem" }}>
                      <strong>{invite.inviterUserName}</strong> {isJoinRequest ? "has requested to join your team" : `has invited you to join team ${invite.teamName}`}.
                      {invite.message && <span style={{ fontStyle: "italic", display: "block", marginTop: "0.25rem", color: "var(--color-text-2)" }}>&quot;{invite.message}&quot;</span>}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAcceptInvite(invite.id, invite.teamName)}
                  >
                    Accept
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDeclineInvite(invite.id)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: "2rem" }}>
        {dynamicStats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: `${s.color}22` }}>
                <Icon size={22} style={{ color: s.color }} />
              </div>
              <div>
                <div className="stat-value gradient-text">{s.value}</div>
                <div className="stat-label">{s.label}</div>
                <div className={`stat-trend ${s.up ? "up" : "down"}`}>
                  {s.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {s.trend}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.mainGrid}>
        {/* Events Column */}
        <div className={styles.eventsCol}>
          <div className="section">
            <div className="section-header">
              <span className="section-title">
                <Calendar size={16} style={{ color: "var(--color-primary)" }} /> Hackathon Events
              </span>
              <Link href="/dashboard/events">
                <button className="btn btn-ghost btn-sm">View All <ArrowRight size={14} /></button>
              </Link>
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: "1rem" }}>
              {(["all", "active", "upcoming"] as const).map(t => (
                <button
                  key={t}
                  className={`tab-btn ${activeTab === t ? "active" : ""}`}
                  onClick={() => setActiveTab(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {filteredEvents.map((ev) => (
                <Link key={ev.id} href={`/dashboard/events/${ev.id}`} style={{ textDecoration: "none" }}>
                  <div className={`glass-card ${styles.eventCard}`}>
                    <div className={styles.eventTop}>
                      <h4 className={styles.eventName}>{ev.name}</h4>
                      <span className={`badge ${STATUS_BADGE[ev.status] || "badge-neutral"}`}>
                        {ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}
                      </span>
                    </div>
                    <p className={styles.eventRound}>
                      <Zap size={13} style={{ color: "var(--color-cyan)" }} />
                      Round: {ev.currentRound || "Registration"}
                    </p>
                    <div className={styles.eventMeta}>
                      <span><Users size={12} /> {ev.teamsCount || 0} teams</span>
                      <span><Target size={12} /> {ev.tracksCount || 0} tracks</span>
                      <span><Clock size={12} /> {new Date(ev.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
              {filteredEvents.length === 0 && (
                 <div className="empty-state">
                   <Calendar size={48} className="empty-icon" />
                   <div className="empty-title">No events found</div>
                 </div>
              )}
            </div>
          </div>

          {/* Upcoming deadlines */}
          <div className="section">
            <div className="section-header">
              <span className="section-title">
                <Clock size={16} style={{ color: "var(--color-amber)" }} /> Upcoming Deadlines
              </span>
            </div>
            <div className={styles.deadlineList}>
              {deadlines.length === 0 ? (
                <div style={{ padding: "1rem", color: "var(--color-text-3)", fontSize: "0.85rem" }}>No upcoming deadlines.</div>
              ) : deadlines.map((u, i) => (
                <div key={i} className={styles.deadlineItem}>
                  <div className={`${styles.deadlineDot} ${u.urgent ? styles.urgent : ""}`} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={styles.deadlineTask}>{u.task}</div>
                    <div className={styles.deadlineEvent}>{u.event}</div>
                  </div>
                  <span className={`badge ${u.urgent ? "badge-danger" : "badge-neutral"}`}>{u.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Column */}
        <div className={styles.activityCol}>
          {/* Quick links */}
          <div className="section">
            <div className="section-header">
              <span className="section-title"><Zap size={16} style={{ color: "var(--color-cyan)" }} /> Quick Actions</span>
            </div>
            <div className={styles.quickActions}>
              {[
                ...(isAdmin ? [{ label: "Create Event", href: "/dashboard/events/create", icon: Calendar, color: "#6366f1" }] : []),
                { label: "Register Team",   href: "/dashboard/teams",   icon: Users,   color: "#8b5cf6" },
                // Scoring is only accessible to Judges/Admins — don't tease it to Members.
                ...(canJudge ? [{ label: "Score Submissions", href: "/dashboard/judging", icon: Target, color: "#06b6d4" }] : []),
                { label: "View Rankings",   href: "/dashboard/rankings",       icon: Trophy,  color: "#f59e0b" },
                { label: "View Prizes",     href: "/dashboard/prizes",         icon: Award,   color: "#f43f5e" },
              ].map(q => {
                const Icon = q.icon;
                return (
                  <Link key={q.href} href={q.href} className={styles.quickBtn} style={{ "--q-color": q.color } as React.CSSProperties}>
                    <div className={styles.quickIcon}><Icon size={18} /></div>
                    <span>{q.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="section">
            <div className="section-header">
              <span className="section-title"><TrendingUp size={16} style={{ color: "var(--color-emerald)" }} /> Recent Activity</span>
            </div>
            <div className={styles.activityFeed}>
              {activities.length === 0 ? (
                <div style={{ padding: "1rem", color: "var(--color-text-3)", fontSize: "0.85rem" }}>No recent activity.</div>
              ) : activities.map((a, i) => {
                const color = ACTIVITY_COLOR[a.type] || "#6366f1";
                return (
                  <div key={i} className={styles.activityItem}>
                    <div className={styles.activityIcon} style={{ background: `${color}22` }}>
                      <Zap size={14} style={{ color }} />
                    </div>
                    <div className={styles.activityBody}>
                      <p className={styles.activityText}>
                        <strong style={{ color: "var(--color-text)" }}>{a.title}</strong> — {a.message}
                      </p>
                      <span className={styles.activityTime}>{a.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

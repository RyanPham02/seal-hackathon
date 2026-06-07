"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Users, Trophy, Layers, ArrowRight, Zap, Globe, Rocket, X, CheckCircle2, Target } from "lucide-react";
import styles from "./page.module.css";
import { apiRequest } from "@/lib/api";

interface RoundDto {
  roundId: string;
  roundName: string;
  roundOrder: number;
  submissionDeadline?: string | null;
}

interface CategoryDto {
  categoryId: string;
  categoryName: string;
  teamCount: number;
}

interface EventDto {
  eventId: string;
  eventName: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  status: string;
  categories: CategoryDto[];
  rounds: RoundDto[];
}

const STATUS_LABEL: Record<string, string> = {
  Ongoing: "Ongoing",
  Upcoming: "Upcoming",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

function badgeClass(status: string) {
  if (status === "Ongoing") return "badge-success";
  if (status === "Upcoming") return "badge-primary";
  return "badge-neutral";
}

function formatDate(value?: string | null) {
  if (!value) return "TBD";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "TBD" : d.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function dateRange(start: string, end: string) {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

export default function LandingPage() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComp, setSelectedComp] = useState<EventDto | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiRequest<EventDto[]>("/Events");
        setEvents(data);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className={styles.container}>
      {/* Background Decorative Elements */}
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>

      {/* Navbar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={styles.header}
      >
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Zap style={{ color: "#fff" }} size={20} />
          </div>
          <span className={styles.logoText}>
            SEAL <span style={{ color: "var(--color-primary-2)" }}>Hackathons</span>
          </span>
        </div>

        <div className={styles.navLinks}>
          <Link href="/auth/login" className="btn btn-ghost">
            Sign In
          </Link>
          <Link href="/auth/register" className="btn btn-primary">
            Register
          </Link>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className={styles.main}>

        {/* Hero Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={styles.hero}
        >
          <div className={styles.heroTag}>
            <Rocket size={16} />
            <span>Unleash Your Creative Potential</span>
          </div>
          <h1 className={styles.heroTitle}>
            Explore & Compete in <br/>
            <span className="gradient-text">World-Class Hackathons</span>
          </h1>
          <p className={styles.heroDesc}>
            Connect with top talent, showcase your skills, and build outstanding software solutions in globally recognized Hackathon competitions.
          </p>
        </motion.div>

        {/* Competitions Section */}
        <div className={styles.competitionsSection}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className={styles.sectionTitle}>
              <Globe style={{ color: "var(--color-primary-2)" }} />
              Featured Events
            </h2>
          </motion.div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-3)" }}>Loading events…</div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-3)" }}>No events available.</div>
          ) : (
            <div className="grid-3">
              {events.map((comp, index) => {
                const teamsCount = comp.categories.reduce((sum, c) => sum + (c.teamCount ?? 0), 0);
                const statusLabel = STATUS_LABEL[comp.status] || comp.status;
                return (
                  <motion.div
                    key={comp.eventId}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                    className="glass-card"
                    style={{ display: "flex", flexDirection: "column", height: "100%" }}
                  >
                    {/* Top Badge */}
                    <div className={styles.cardHeader}>
                      <span className={`badge ${badgeClass(comp.status)}`}>
                        <span className={styles.pingBadge}>
                          {comp.status === "Ongoing" && (
                            <span className={styles.pingAnim} style={{ backgroundColor: "var(--color-emerald)" }}></span>
                          )}
                          <span className={styles.pingDot} style={{ backgroundColor: comp.status === "Ongoing" ? "var(--color-emerald)" : comp.status === "Completed" ? "var(--color-text-3)" : "var(--color-primary-2)" }}></span>
                        </span>
                        {statusLabel}
                      </span>

                      <div className={styles.cardIconWrapper}>
                        <Trophy size={16} style={{ color: "var(--color-amber)" }} />
                      </div>
                    </div>

                    <h3 className={styles.cardTitle}>
                      {comp.eventName}
                    </h3>
                    <p className={styles.cardDesc}>
                      {comp.description || "No description available for this event."}
                    </p>

                    {/* Stats Grid */}
                    <div className={styles.statsGrid}>
                      <div className={styles.statItem}>
                        <div className={styles.statLabel}>
                          <Users size={12} /> Teams
                        </div>
                        <div className={styles.statValue}>{teamsCount}</div>
                      </div>

                      <div className={styles.statItem}>
                        <div className={styles.statLabel}>
                          <Target size={12} /> Tracks
                        </div>
                        <div className={styles.statValue}>{comp.categories.length}</div>
                      </div>

                      <div className={styles.statItem}>
                        <div className={styles.statLabel}>
                          <Layers size={12} /> Rounds
                        </div>
                        <div className={styles.statValue}>{comp.rounds.length} Round{comp.rounds.length !== 1 ? "s" : ""}</div>
                      </div>

                      <div className={styles.statItem}>
                        <div className={styles.statLabel}>
                          <Calendar size={12} /> Dates
                        </div>
                        <div className={styles.statValue} style={{ fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={dateRange(comp.startDate, comp.endDate)}>
                          {dateRange(comp.startDate, comp.endDate)}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div className={styles.cardAction}>
                        <button className="btn btn-secondary w-full" style={{ width: "100%", justifyContent: "center" }} onClick={() => setSelectedComp(comp)}>
                          View Details <ArrowRight size={16} style={{ marginLeft: "0.5rem" }} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedComp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setSelectedComp(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="modal-content"
              style={{ background: "var(--color-bg-2)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header" style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 className="modal-title" style={{ color: "var(--color-text)", fontSize: "1.5rem" }}>Event Details</h2>
                <button onClick={() => setSelectedComp(null)} className="btn-icon btn-ghost" style={{ padding: "0.25rem" }}>
                  <X size={24} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "var(--color-primary-2)", marginBottom: "0.5rem" }}>{selectedComp.eventName}</h3>
                  <p style={{ color: "var(--color-text-2)", fontSize: "0.95rem" }}>{selectedComp.description || "No description available for this event."}</p>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span className={`badge ${badgeClass(selectedComp.status)}`}>
                    {STATUS_LABEL[selectedComp.status] || selectedComp.status}
                  </span>
                  <span className="badge badge-neutral"><Users size={12} style={{ marginRight: "4px" }} /> {selectedComp.categories.reduce((sum, c) => sum + (c.teamCount ?? 0), 0)} team{selectedComp.categories.reduce((sum, c) => sum + (c.teamCount ?? 0), 0) !== 1 ? "s" : ""}</span>
                  <span className="badge badge-neutral"><Calendar size={12} style={{ marginRight: "4px" }} /> {dateRange(selectedComp.startDate, selectedComp.endDate)}</span>
                </div>

                {selectedComp.rounds.length > 0 && (
                  <div style={{ background: "rgba(99, 102, 241, 0.05)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
                    <h4 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.75rem" }}>
                      <Layers size={18} style={{ color: "var(--color-primary-2)" }} /> Round Information
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {[...selectedComp.rounds].sort((a, b) => a.roundOrder - b.roundOrder).map((r) => (
                        <div key={r.roundId} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                          <div style={{ marginTop: "2px", color: "var(--color-cyan)" }}><CheckCircle2 size={16} /></div>
                          <div>
                            <div style={{ fontWeight: 500, color: "var(--color-text)" }}>{r.roundName}</div>
                            <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)" }}>Deadline: {formatDate(r.submissionDeadline)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedComp.categories.length > 0 && (
                  <div style={{ background: "rgba(16, 185, 129, 0.05)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                    <h4 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.5rem" }}>
                      <Target size={18} style={{ color: "var(--color-emerald)" }} /> Competition Tracks
                    </h4>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {selectedComp.categories.map((c) => (
                        <span key={c.categoryId} className="badge badge-neutral">{c.categoryName} · {c.teamCount} team{c.teamCount !== 1 ? "s" : ""}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { Calendar, ChevronLeft, Plus, Trash2, GripVertical, Clock, Target } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { App } from "antd";
import { apiRequest, fetchCurrentUser } from "@/lib/api";
import { TRACKS_OPTIONS } from "@/lib/constants";

export default function CreateEventPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin role — redirect non-admin users
  useEffect(() => {
    fetchCurrentUser()
      .then((user) => {
        if (user.roles.includes("Admin")) {
          setIsAdmin(true);
          setAuthChecked(true);
        } else {
          message.error("Access denied. Only administrators can create events.");
          router.replace("/dashboard");
        }
      })
      .catch(() => {
        router.replace("/dashboard");
      });
  }, [router, message]);

  // Only fields the backend actually persists are collected here.
  const [form, setForm] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  });
  const [rounds, setRounds] = useState([
    { id: 1, name: "Qualifying Round", topN: "10", deadline: "" },
    { id: 2, name: "Grand Finals",     topN: "5",  deadline: "" },
  ]);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [criteria, setCriteria] = useState([
    { id: 1, name: "Technical Implementation", weight: 30 },
    { id: 2, name: "Innovation & Creativity",  weight: 25 },
    { id: 3, name: "Presentation & Demo",       weight: 25 },
    { id: 4, name: "Code Quality",             weight: 20 },
  ]);

  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);

  const addRound = () => setRounds([...rounds, { id: Date.now(), name: `Round ${rounds.length + 1}`, topN: "5", deadline: "" }]);
  const removeRound = (id: number) => setRounds(rounds.filter(r => r.id !== id));

  const addCriterion = () => setCriteria([...criteria, { id: Date.now(), name: "New Criterion", weight: 10 }]);
  const removeCriterion = (id: number) => setCriteria(criteria.filter(c => c.id !== id));

  const toggleTrack = (t: string) =>
    setSelectedTracks(sel => sel.includes(t) ? sel.filter(x => x !== t) : [...sel, t]);

  const handleCreateEvent = async () => {
    if (!form.name.trim()) {
      message.error("Step 1: please enter an event name.");
      setStep(1);
      return;
    }

    if (!form.startDate || !form.endDate) {
      message.error("Step 1: start date and end date are required.");
      setStep(1);
      return;
    }

    if (new Date(form.endDate) <= new Date(form.startDate)) {
      message.error("Step 1: end date must be after the start date.");
      setStep(1);
      return;
    }

    const roundsToCreate = rounds.filter((round) => round.name.trim() && round.deadline);
    if (roundsToCreate.length !== rounds.length) {
      message.error("Step 2: every round needs a name and submission deadline.");
      setStep(2);
      return;
    }

    if (selectedTracks.length === 0) {
      message.error("Step 3: select at least one track/category.");
      setStep(3);
      return;
    }

    if (criteria.some((c) => !c.name.trim())) {
      message.error("Step 4: every criterion needs a name.");
      setStep(4);
      return;
    }

    setSubmitting(true);
    try {
      const createdEvent = await apiRequest<{ id: string }>("/Events", {
        method: "POST",
        body: JSON.stringify({
          eventName: form.name.trim(),
          description: form.description.trim() || null,
          startDate: form.startDate,
          endDate: form.endDate,
        }),
      });

      // The event now exists; if any follow-up call fails we tell the admin
      // exactly what happened instead of letting a retry create a duplicate.
      try {
        const createdRounds = await Promise.all(roundsToCreate.map((round, index) =>
          apiRequest<{ roundId: string }>(`/events/${createdEvent.id}/rounds`, {
            method: "POST",
            body: JSON.stringify({
              roundName: round.name.trim(),
              submissionDeadline: round.deadline,
              roundOrder: index + 1,
              maxTeamsAdvancing: Number(round.topN) || 0,
            }),
          })
        ));

        await Promise.all(selectedTracks.map((track) =>
          apiRequest(`/events/${createdEvent.id}/categories`, {
            method: "POST",
            body: JSON.stringify({
              categoryName: track,
              description: null,
            }),
          })
        ));

        await Promise.all(createdRounds.flatMap((round) =>
          criteria.map((criterion) =>
            apiRequest(`/rounds/${round.roundId}/criteria`, {
              method: "POST",
              body: JSON.stringify({
                criteriaName: criterion.name.trim(),
                maxScore: 100,
                weight: criterion.weight,
              }),
            })
          )
        ));
      } catch (configErr) {
        message.warning(
          `The event was created, but part of its configuration failed: ${
            configErr instanceof Error ? configErr.message : "unknown error"
          }. Finish setting it up from Admin → Events instead of creating it again.`,
          8,
        );
        router.push("/dashboard/events");
        return;
      }

      message.success("Event created successfully.");
      router.push("/dashboard/events");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not create event.");
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading while checking role
  if (!authChecked) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: "1rem", color: "var(--color-text-2)" }}>
        <div style={{ width: 32, height: 32, border: "3px solid rgba(99,102,241,0.3)", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Verifying access...
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="page-header">
        <div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link href="/dashboard/events"><button className="btn btn-ghost btn-sm btn-icon" aria-label="Back to events"><ChevronLeft size={16} /></button></Link>
            <h1 className="page-title">Create New Event</h1>
          </div>
          <p className="page-subtitle">Configure your SEAL hackathon event</p>
        </div>
      </div>

      {/* Step Tabs */}
      <div className="tabs" style={{ marginBottom: "2rem" }}>
        {["Basic Info", "Rounds & Rules", "Tracks", "Criteria"].map((s, i) => (
          <button key={s} className={`tab-btn ${step === i+1 ? "active" : ""}`} onClick={() => setStep(i+1)}>{s}</button>
        ))}
      </div>

      {/* Step 1 – Basic Info */}
      {step === 1 && (
        <div className="glass-card">
          <h3 style={{ marginBottom: "1.5rem", fontSize: "1rem" }}>Event Details</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div className="form-group">
              <label className="form-label">Event Name *</label>
              <input className="form-input" placeholder="SEAL Spring 2026"
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows={3} placeholder="Describe the hackathon theme and goals…"
                value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input className="form-input" type="date"
                  value={form.startDate}
                  onChange={e => setForm({...form, startDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">End Date *</label>
                <input className="form-input" type="date"
                  value={form.endDate}
                  onChange={e => setForm({...form, endDate: e.target.value})} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 – Rounds */}
      {step === 2 && (
        <div className="glass-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1rem" }}>Competition Rounds</h3>
            <button className="btn btn-primary btn-sm" onClick={addRound}><Plus size={14} /> Add Round</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {rounds.map((r, i) => (
              <div key={r.id} style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                  <GripVertical size={16} style={{ color: "var(--color-text-3)", cursor: "grab" }} />
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary)", background: "rgba(99,102,241,0.1)", padding: "0.15rem 0.5rem", borderRadius: "var(--radius-sm)" }}>
                    Round {i+1}
                  </span>
                  <div className="form-group" style={{ flex: 1, gap: 0 }}>
                    <input className="form-input" style={{ padding: "0.4rem 0.75rem" }} placeholder="Round name"
                      value={r.name} onChange={e => setRounds(rounds.map(x => x.id===r.id ? {...x, name: e.target.value} : x))} />
                  </div>
                  {rounds.length > 1 && (
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => removeRound(r.id)} aria-label={`Remove round ${i + 1}`}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label"><Target size={11} /> Top N Teams to Advance</label>
                    <input className="form-input" type="number" min="1" placeholder="10"
                      value={r.topN} onChange={e => setRounds(rounds.map(x => x.id===r.id ? {...x, topN: e.target.value} : x))} />
                    <span className="form-hint">Top {r.topN || "?"} teams advance to next round</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label"><Clock size={11} /> Submission Deadline *</label>
                    <input className="form-input" type="date"
                      value={r.deadline} onChange={e => setRounds(rounds.map(x => x.id===r.id ? {...x, deadline: e.target.value} : x))} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 – Tracks */}
      {step === 3 && (
        <div className="glass-card">
          <h3 style={{ marginBottom: "0.5rem", fontSize: "1rem" }}>Competition Tracks</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-2)", marginBottom: "1.5rem" }}>Select the tracks for this hackathon event</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {TRACKS_OPTIONS.map(t => (
              <label key={t} style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.9rem 1rem",
                background: selectedTracks.includes(t) ? "rgba(99,102,241,0.08)" : "var(--color-surface-2)",
                border: `1px solid ${selectedTracks.includes(t) ? "rgba(99,102,241,0.4)" : "var(--color-border-2)"}`,
                borderRadius: "var(--radius-md)", cursor: "pointer", transition: "all 0.15s",
              }}>
                <input type="checkbox" checked={selectedTracks.includes(t)} onChange={() => toggleTrack(t)}
                  style={{ accentColor: "var(--color-primary)", width: 16, height: 16 }} />
                <span style={{ fontWeight: 500 }}>{t}</span>
                {selectedTracks.includes(t) && <span className="badge badge-primary" style={{ marginLeft: "auto" }}>Selected</span>}
              </label>
            ))}
          </div>
          {selectedTracks.length > 0 && (
            <p style={{ marginTop: "1rem", fontSize: "0.82rem", color: "var(--color-text-3)" }}>
              {selectedTracks.length} track{selectedTracks.length > 1 ? "s" : ""} selected
            </p>
          )}
        </div>
      )}

      {/* Step 4 – Criteria */}
      {step === 4 && (
        <div className="glass-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div>
              <h3 style={{ fontSize: "1rem" }}>Scoring Criteria</h3>
              <p style={{ fontSize: "0.8rem", color: totalWeight === 100 ? "var(--color-emerald)" : "var(--color-rose)", marginTop: "0.2rem" }}>
                Total weight: {totalWeight}% {totalWeight !== 100 ? "(must equal 100%)" : "✓"}
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={addCriterion}><Plus size={14} /> Add Criterion</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {criteria.map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.9rem 1rem", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}>
                <GripVertical size={15} style={{ color: "var(--color-text-3)", cursor: "grab", flexShrink: 0 }} />
                <input className="form-input" style={{ flex: 1 }} value={c.name}
                  onChange={e => setCriteria(criteria.map(x => x.id===c.id ? {...x, name: e.target.value} : x))} />
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                  <input className="form-input" type="number" min="0" max="100" style={{ width: 72 }}
                    value={c.weight} onChange={e => setCriteria(criteria.map(x => x.id===c.id ? {...x, weight: +e.target.value} : x))} />
                  <span style={{ fontSize: "0.875rem", color: "var(--color-text-2)" }}>%</span>
                </div>
                <button className="btn btn-danger btn-icon btn-sm" onClick={() => removeCriterion(c.id)} aria-label={`Remove criterion ${c.name}`}><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
        {step > 1 && <button className="btn btn-secondary" onClick={() => setStep(step-1)}>← Back</button>}
        {step < 4
          ? <button className="btn btn-primary" onClick={() => setStep(step+1)}>Continue →</button>
          : <button className="btn btn-primary" disabled={totalWeight !== 100 || submitting} onClick={handleCreateEvent}>
              {submitting ? <span className="spinner" /> : <><Calendar size={16} /> Create Event</>}
            </button>
        }
      </div>
    </div>
  );
}

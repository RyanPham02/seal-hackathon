"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Calendar, Clock, Save, AlertCircle, RefreshCw,
  Plus, Trash2, GripVertical, Target, ChevronRight,
} from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";

/* ─── Types ─── */
type RoundDto = {
  roundId: string;
  roundName: string;
  roundOrder: number;
  maxTeamsAdvancing: number;
  submissionDeadline: string | null;
};

type EventDto = {
  eventId: string;
  eventName: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  status: string;
  rounds: RoundDto[];
};

/* ─── Helpers ─── */
function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toApiDate(value: string) {
  return new Date(value).toISOString();
}

function toDisplayDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

/* ─── Create-form defaults ─── */
const INITIAL_EVENT_FORM = { eventName: "", description: "", startDate: "", endDate: "" };
const INITIAL_ROUND = () => ({ id: Date.now(), name: "", topN: "5", deadline: "" });
const TRACKS_OPTIONS = ["AI & Machine Learning", "Web Development", "Mobile App", "Cybersecurity", "Open Innovation"];

/* ════════════════════════════════════════════════════════════════ */
export default function AdminEventsPage() {
  const { message } = App.useApp();

  /* ── View toggle ── */
  const [view, setView] = useState<"list" | "create">("list");

  /* ── Events list ── */
  const [events, setEvents] = useState<EventDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [draftDeadlines, setDraftDeadlines] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ── Create form ── */
  const [eventForm, setEventForm] = useState(INITIAL_EVENT_FORM);
  const [rounds, setRounds] = useState([{ id: 1, name: "Qualifying Round", topN: "10", deadline: "" }]);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [createStep, setCreateStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  /* ─────────────── Load events ─────────────── */
  const loadEventsData = useCallback(
    async (active: { value: boolean }) => {
      try {
        const data = await apiRequest<EventDto[]>("/Events");
        if (!active.value) return;
        setEvents(data);
        setSelectedEventId((cur) => cur || data[0]?.eventId || "");
        setDraftDeadlines(
          data.reduce<Record<string, string>>((acc, ev) => {
            ev.rounds.forEach((r) => { acc[r.roundId] = toDateTimeLocal(r.submissionDeadline); });
            return acc;
          }, {}),
        );
      } catch (err) {
        if (!active.value) return;
        message.error(err instanceof Error ? err.message : "Could not load events.");
        setEvents([]);
        setSelectedEventId("");
      } finally {
        if (active.value) setLoading(false);
      }
    },
    [message],
  );

  useEffect(() => {
    const active = { value: true };
    // Defer out of the synchronous effect body (react-hooks/set-state-in-effect):
    // loadEventsData sets state only after an awaited fetch and respects the `active`
    // guard, so the microtask hop keeps observable behavior identical.
    void Promise.resolve().then(() => loadEventsData(active));
    return () => { active.value = false; };
  }, [loadEventsData]);

  const refreshEvents = useCallback(async () => {
    setLoading(true);
    const active = { value: true };
    await loadEventsData(active);
  }, [loadEventsData]);

  const selectedEvent = useMemo(
    () => events.find((ev) => ev.eventId === selectedEventId),
    [events, selectedEventId],
  );

  /* ─────────────── Save deadlines ─────────────── */
  const handleSave = async () => {
    if (!selectedEvent) return;
    const changed = selectedEvent.rounds.filter(
      (r) => draftDeadlines[r.roundId] !== toDateTimeLocal(r.submissionDeadline),
    );
    if (changed.length === 0) { message.info("No deadline changes to save."); return; }
    setSaving(true);
    try {
      await Promise.all(
        changed.map((r) =>
          apiRequest(`/events/${selectedEvent.eventId}/rounds/${r.roundId}`, {
            method: "PUT",
            body: JSON.stringify({
              roundName: r.roundName,
              submissionDeadline: toApiDate(draftDeadlines[r.roundId]),
              roundOrder: r.roundOrder,
              maxTeamsAdvancing: r.maxTeamsAdvancing,
            }),
          }),
        ),
      );
      message.success("Round deadlines updated successfully.");
      await refreshEvents();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not update round deadlines.");
    } finally {
      setSaving(false);
    }
  };

  /* ─────────────── Create event ─────────────── */
  const addRound = () => setRounds((rs) => [...rs, { ...INITIAL_ROUND(), name: `Round ${rs.length + 1}` }]);
  const removeRound = (id: number) => setRounds((rs) => rs.filter((r) => r.id !== id));
  const toggleTrack = (t: string) =>
    setSelectedTracks((sel) => (sel.includes(t) ? sel.filter((x) => x !== t) : [...sel, t]));

  const handleCreateEvent = async () => {
    if (!eventForm.eventName.trim()) { message.error("Please enter an event name."); return; }
    if (!eventForm.startDate || !eventForm.endDate) { message.error("Start date and end date are required."); return; }
    if (new Date(eventForm.endDate) <= new Date(eventForm.startDate)) { message.error("End date must be after start date."); return; }
    if (rounds.some((r) => !r.name.trim() || !r.deadline)) { message.error("Every round needs a name and submission deadline."); return; }

    setSubmitting(true);
    try {
      const created = await apiRequest<{ eventId?: string; id?: string }>("/Events", {
        method: "POST",
        body: JSON.stringify({
          eventName: eventForm.eventName.trim(),
          description: eventForm.description.trim() || null,
          startDate: toApiDate(eventForm.startDate),
          endDate: toApiDate(eventForm.endDate),
        }),
      });

      const eventId = created.eventId ?? created.id ?? "";

      await Promise.all(
        rounds.map((r, i) =>
          apiRequest(`/events/${eventId}/rounds`, {
            method: "POST",
            body: JSON.stringify({
              roundName: r.name.trim(),
              submissionDeadline: toApiDate(r.deadline),
              roundOrder: i + 1,
              maxTeamsAdvancing: Number(r.topN) || 0,
            }),
          }),
        ),
      );

      if (selectedTracks.length > 0) {
        await Promise.all(
          selectedTracks.map((track) =>
            apiRequest(`/events/${eventId}/categories`, {
              method: "POST",
              body: JSON.stringify({ categoryName: track, description: null }),
            }),
          ),
        );
      }

      message.success("Event created successfully.");
      setEventForm(INITIAL_EVENT_FORM);
      setRounds([{ id: 1, name: "Qualifying Round", topN: "10", deadline: "" }]);
      setSelectedTracks([]);
      setCreateStep(1);
      setView("list");
      await refreshEvents();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not create event.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ═══════════════════════════ RENDER ═══════════════════════════ */
  return (
    <div style={{ maxWidth: 900 }}>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Event Management</h1>
          <p className="page-subtitle">Create hackathon events and manage round pipelines</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {view === "list" ? (
            <>
              <button className="btn btn-secondary" onClick={() => { void refreshEvents(); }} disabled={loading || saving}>
                <RefreshCw size={16} /> Refresh
              </button>
              <button className="btn btn-primary" onClick={() => { setView("create"); setCreateStep(1); }}>
                <Plus size={16} /> New Event
              </button>
            </>
          ) : (
            <button className="btn btn-secondary" onClick={() => setView("list")}>
              ← Back to Events
            </button>
          )}
        </div>
      </div>

      {/* ─── LIST VIEW ─── */}
      {view === "list" && (
        <div className="glass-card">
          <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Calendar size={18} style={{ color: "var(--color-primary)" }} /> Event Pipeline Configuration
          </h3>

          {events.length === 0 && !loading ? (
            <div className="empty-state">
              <Calendar size={48} className="empty-icon" />
              <div className="empty-title">No events found</div>
              <p style={{ color: "var(--color-text-3)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                Click <strong>New Event</strong> to create your first hackathon event.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Event selector */}
              <div className="form-group">
                <label className="form-label">Select Event</label>
                <select
                  className="form-input"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  disabled={loading || saving}
                  style={{ cursor: "pointer", fontWeight: "bold" }}
                >
                  {events.map((ev) => (
                    <option key={ev.eventId} value={ev.eventId}>{ev.eventName}</option>
                  ))}
                </select>
              </div>

              {/* Selected event rounds */}
              {selectedEvent && (
                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
                  {/* Event info */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                    <div>
                      <h4 style={{ color: "var(--color-text)", marginBottom: "0.2rem" }}>{selectedEvent.eventName}</h4>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>
                        {toDisplayDate(selectedEvent.startDate)} → {toDisplayDate(selectedEvent.endDate)}
                      </span>
                    </div>
                    <span className="badge badge-primary">{selectedEvent.status}</span>
                  </div>

                  <h4 style={{ marginBottom: "1rem", color: "var(--color-text)" }}>Event Stages / Rounds</h4>

                  {selectedEvent.rounds.length === 0 && (
                    <div className="empty-state">
                      <Clock size={40} className="empty-icon" />
                      <div className="empty-title">No rounds configured</div>
                    </div>
                  )}

                  {selectedEvent.rounds.map((round, index) => (
                    <div
                      key={round.roundId}
                      style={{
                        display: "flex", alignItems: "center", gap: "1rem",
                        marginBottom: "1rem", background: "var(--color-surface-2)",
                        padding: "1rem", borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border-2)",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <label className="form-label" style={{ marginBottom: "0.3rem" }}>Round {index + 1} Name</label>
                        <input className="form-input" value={round.roundName} disabled style={{ opacity: 0.8 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label" style={{ marginBottom: "0.3rem" }}>Submission Deadline</label>
                        <div style={{ position: "relative" }}>
                          <Clock size={16} style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-3)" }} />
                          <input
                            type="datetime-local"
                            className="form-input"
                            style={{ paddingLeft: "2.2rem" }}
                            value={draftDeadlines[round.roundId] ?? ""}
                            onChange={(e) => setDraftDeadlines((cur) => ({ ...cur, [round.roundId]: e.target.value }))}
                            disabled={saving}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <AlertCircle size={14} style={{ color: "var(--color-warning)" }} />
                    Teams will be locked out of submissions past these deadlines.
                  </div>
                </div>
              )}

              {/* Save button */}
              {selectedEvent && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading} style={{ padding: "0.7rem 2rem" }}>
                    {saving ? <span className="spinner" /> : <><Save size={16} /> Save All Changes</>}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── CREATE VIEW ─── */}
      {view === "create" && (
        <div>
          {/* Step tabs */}
          <div className="tabs" style={{ marginBottom: "1.5rem" }}>
            {["Basic Info", "Rounds", "Tracks"].map((s, i) => (
              <button key={s} className={`tab-btn ${createStep === i + 1 ? "active" : ""}`} onClick={() => setCreateStep(i + 1)}>
                {i + 1}. {s}
              </button>
            ))}
          </div>

          {/* Step 1 – Basic Info */}
          {createStep === 1 && (
            <div className="glass-card">
              <h3 style={{ marginBottom: "1.5rem", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Calendar size={18} style={{ color: "var(--color-primary)" }} /> Event Details
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                <div className="form-group">
                  <label className="form-label">Event Name *</label>
                  <input
                    className="form-input"
                    placeholder="SEAL Spring 2026"
                    value={eventForm.eventName}
                    onChange={(e) => setEventForm({ ...eventForm, eventName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Describe the hackathon theme and goals…"
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input
                      className="form-input"
                      type="date"
                      value={eventForm.startDate}
                      onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date *</label>
                    <input
                      className="form-input"
                      type="date"
                      value={eventForm.endDate}
                      onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 – Rounds */}
          {createStep === 2 && (
            <div className="glass-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Clock size={18} style={{ color: "var(--color-primary)" }} /> Competition Rounds
                </h3>
                <button className="btn btn-primary btn-sm" onClick={addRound}>
                  <Plus size={14} /> Add Round
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {rounds.map((r, i) => (
                  <div key={r.id} style={{ background: "rgba(15,23,42,0.5)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                      <GripVertical size={16} style={{ color: "var(--color-text-3)" }} />
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary)", background: "rgba(99,102,241,0.1)", padding: "0.15rem 0.5rem", borderRadius: "var(--radius-sm)" }}>
                        Round {i + 1}
                      </span>
                      <div className="form-group" style={{ flex: 1, gap: 0 }}>
                        <input
                          className="form-input"
                          style={{ padding: "0.4rem 0.75rem" }}
                          placeholder="Round name"
                          value={r.name}
                          onChange={(e) => setRounds(rounds.map((x) => x.id === r.id ? { ...x, name: e.target.value } : x))}
                        />
                      </div>
                      {rounds.length > 1 && (
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => removeRound(r.id)}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div className="form-group">
                        <label className="form-label"><Target size={11} /> Top N Teams to Advance</label>
                        <input
                          className="form-input"
                          type="number"
                          placeholder="10"
                          value={r.topN}
                          onChange={(e) => setRounds(rounds.map((x) => x.id === r.id ? { ...x, topN: e.target.value } : x))}
                        />
                        <span className="form-hint">Top {r.topN || "?"} teams advance to next round</span>
                      </div>
                      <div className="form-group">
                        <label className="form-label"><Clock size={11} /> Submission Deadline *</label>
                        <input
                          className="form-input"
                          type="date"
                          value={r.deadline}
                          onChange={(e) => setRounds(rounds.map((x) => x.id === r.id ? { ...x, deadline: e.target.value } : x))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 – Tracks */}
          {createStep === 3 && (
            <div className="glass-card">
              <h3 style={{ marginBottom: "0.5rem", fontSize: "1rem" }}>Competition Tracks</h3>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-2)", marginBottom: "1.5rem" }}>
                Select the tracks for this hackathon (optional)
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {TRACKS_OPTIONS.map((t) => (
                  <label
                    key={t}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.75rem",
                      padding: "0.9rem 1rem", cursor: "pointer", transition: "all 0.15s",
                      background: selectedTracks.includes(t) ? "rgba(99,102,241,0.08)" : "rgba(15,23,42,0.4)",
                      border: `1px solid ${selectedTracks.includes(t) ? "rgba(99,102,241,0.4)" : "var(--color-border-2)"}`,
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTracks.includes(t)}
                      onChange={() => toggleTrack(t)}
                      style={{ accentColor: "var(--color-primary)", width: 16, height: 16 }}
                    />
                    <span style={{ fontWeight: 500 }}>{t}</span>
                    {selectedTracks.includes(t) && (
                      <span className="badge badge-primary" style={{ marginLeft: "auto" }}>Selected</span>
                    )}
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

          {/* Navigation buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
            {createStep > 1 && (
              <button className="btn btn-secondary" onClick={() => setCreateStep(createStep - 1)}>
                ← Back
              </button>
            )}
            {createStep < 3 ? (
              <button className="btn btn-primary" onClick={() => setCreateStep(createStep + 1)}>
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button className="btn btn-primary" disabled={submitting} onClick={handleCreateEvent}>
                {submitting ? <span className="spinner" /> : <><Calendar size={16} /> Create Event</>}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useState } from "react";
import { Calendar, Clock, Save, AlertCircle } from "lucide-react";
import { App } from "antd";

const MOCK_EVENTS = [
  { 
    id: "EV-001", 
    name: "SEAL Spring 2026", 
    rounds: [
      { id: "R-1", name: "Registration Phase", deadline: "2026-05-01T23:59" },
      { id: "R-2", name: "Idea Pitch (Round 1)", deadline: "2026-05-15T23:59" },
      { id: "R-3", name: "MVP Demo (Finale)", deadline: "2026-06-01T23:59" }
    ]
  },
  { 
    id: "EV-002", 
    name: "Global AI Summit", 
    rounds: [
      { id: "R-1", name: "Registration", deadline: "2026-08-01T23:59" },
      { id: "R-2", name: "Final Submission", deadline: "2026-09-01T23:59" }
    ]
  }
];

export default function AdminEventsPage() {
  const { message } = App.useApp();
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [selectedEventId, setSelectedEventId] = useState(MOCK_EVENTS[0].id);
  
  const selectedEvent = events.find(e => e.id === selectedEventId);

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEventId(e.target.value);
  };

  const updateRoundDeadline = (roundId: string, newDeadline: string) => {
    const updatedEvents = events.map(ev => {
      if (ev.id !== selectedEventId) return ev;
      return {
        ...ev,
        rounds: ev.rounds.map(r => r.id === roundId ? { ...r, deadline: newDeadline } : r)
      };
    });
    setEvents(updatedEvents);
  };

  const handleSave = () => {
    message.success("All round deadlines updated successfully!");
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Event & Round Configuration</h1>
          <p className="page-subtitle">Manage hackathon stages, multi-round pipelines, and deadlines</p>
        </div>
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Calendar size={18} style={{ color: "var(--color-primary)" }} /> Setup Event Pipeline
        </h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="form-group">
            <label className="form-label">Select Active Event</label>
            <select className="form-input" value={selectedEventId} onChange={handleEventChange} style={{ cursor: "pointer", fontWeight: "bold" }}>
              {events.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
            <h4 style={{ marginBottom: "1rem", color: "var(--color-text)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Event Stages / Rounds</span>
              <button className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>+ Add Round</button>
            </h4>
            
            {selectedEvent?.rounds.map((round, index) => (
              <div key={round.id} style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", background: "var(--color-surface-2)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-2)" }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ marginBottom: "0.3rem" }}>Round {index + 1} Name</label>
                  <input className="form-input" value={round.name} disabled style={{ opacity: 0.8 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ marginBottom: "0.3rem" }}>Submission Deadline</label>
                  <div style={{ position: "relative" }}>
                    <Clock size={16} style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-3)" }} />
                    <input 
                      type="datetime-local" 
                      className="form-input" 
                      style={{ paddingLeft: "2.2rem" }} 
                      value={round.deadline}
                      onChange={e => updateRoundDeadline(round.id, e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)", marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <AlertCircle size={14} style={{ color: "var(--color-warning)" }} /> Teams will automatically be locked out of submissions past these deadlines.
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button className="btn btn-primary" onClick={handleSave} style={{ padding: "0.7rem 2rem" }}>
              <Save size={16} /> Save All Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

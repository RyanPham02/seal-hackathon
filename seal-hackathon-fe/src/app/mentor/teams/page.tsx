"use client";
import { useState } from "react";
import { Users, FileEdit, MessageSquare } from "lucide-react";
import { App, Modal, Input } from "antd";

const MOCK_ASSIGNED_TEAMS = [
  { id: 1, name: "CodeCraft", track: "AI & Machine Learning", status: "active", members: 4 },
  { id: 2, name: "InnovateSEAL", track: "Web Development", status: "active", members: 3 },
];

export default function MentorTeamsPage() {
  const { message } = App.useApp();
  const [teams, setTeams] = useState(MOCK_ASSIGNED_TEAMS);
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [note, setNote] = useState("");
  const [notesDB, setNotesDB] = useState<Record<number, string>>({});

  const openReview = (team: any) => {
    setSelectedTeam(team);
    setNote(notesDB[team.id] || "");
    setReviewModal(true);
  };

  const handleSaveNote = () => {
    if (!selectedTeam) return;
    setNotesDB({ ...notesDB, [selectedTeam.id]: note });
    setReviewModal(false);
    message.success("Review notes saved successfully!");
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Assigned Teams</h1>
          <p className="page-subtitle">View and review teams you are mentoring</p>
        </div>
      </div>

      <div className="table-wrapper" style={{ marginTop: "2rem" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Team Name</th>
              <th>Track</th>
              <th>Members</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id}>
                <td className="table-cell-primary">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div className="avatar-placeholder" style={{ width: 30, height: 30, fontSize: "0.72rem" }}>
                      {t.name.substring(0,2).toUpperCase()}
                    </div>
                    {t.name}
                  </div>
                </td>
                <td><span style={{ fontSize: "0.8rem" }}>{t.track}</span></td>
                <td><span className="badge badge-neutral"><Users size={10} /> {t.members}</span></td>
                <td><span className="badge badge-success">{t.status.toUpperCase()}</span></td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => openReview(t)}>
                    {notesDB[t.id] ? <MessageSquare size={13} /> : <FileEdit size={13} />}
                    {notesDB[t.id] ? " Edit Note" : " Add Note"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        title={`Review Notes for ${selectedTeam?.name}`}
        open={reviewModal}
        onCancel={() => setReviewModal(false)}
        onOk={handleSaveNote}
        okText="Save Notes"
      >
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ color: "var(--color-text-2)", marginBottom: "1rem" }}>Write down your advice, feedback, and notes for this team.</p>
          <Input.TextArea 
            rows={6} 
            placeholder="Type your notes here..." 
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}

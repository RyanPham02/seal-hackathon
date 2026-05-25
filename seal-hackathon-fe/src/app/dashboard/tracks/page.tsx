"use client";
import { useState, useEffect } from "react";
import { databaseService } from "@/services/databaseService";
import { Tag, Users, Trophy, Target, Bot, Globe, Smartphone, Shield, Lightbulb, UserPlus } from "lucide-react";
import { App, Modal, Form, Select, Button } from "antd";

export default function TracksPage() {
  const { message } = App.useApp();
  const [tracks, setTracks] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);

  useEffect(() => {
    setTracks(databaseService.getTracks());
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      if (JSON.parse(userStr).role === "Admin") setIsAdmin(true);
    }
  }, []);

  const getIcon = (name: string) => {
    if (name === "Bot") return <Bot size={24} style={{ color: "#10b981" }} />;
    if (name === "Globe") return <Globe size={24} style={{ color: "#3b82f6" }} />;
    if (name === "Smartphone") return <Smartphone size={24} style={{ color: "#8b5cf6" }} />;
    if (name === "Shield") return <Shield size={24} style={{ color: "#ef4444" }} />;
    return <Lightbulb size={24} style={{ color: "#f59e0b" }} />;
  };

  const handleAssignMentor = (values: any) => {
    message.success(`Mentor ${values.mentor} assigned to ${selectedTrack.name} successfully!`);
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Competition Tracks</h1>
          <p className="page-subtitle">Specialized categories for the hackathon</p>
        </div>
      </div>

      <div className="grid-3">
        {tracks.map(t => (
          <div key={t.id} className="glass-card" style={{ padding: "1.5rem", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{ width: 48, height: 48, background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {getIcon(t.icon)}
              </div>
              <div>
                <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{t.name}</h3>
                <span className="badge badge-primary" style={{ marginTop: 4 }}>{t.id}</span>
              </div>
            </div>
            
            {isAdmin && (
              <Button 
                size="small" 
                style={{ position: "absolute", top: 16, right: 16 }}
                onClick={() => { setSelectedTrack(t); setIsModalOpen(true); }}
                icon={<UserPlus size={14} />}
              >
                Assign Mentor
              </Button>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-2)", fontSize: "0.85rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Users size={15} /> {t.teams} Teams
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#f59e0b" }}>
                <Trophy size={15} /> {t.maxPrize}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal 
        title={`Assign Mentor to ${selectedTrack?.name}`}
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleAssignMentor} style={{ marginTop: 20 }}>
          <Form.Item name="mentor" label="Select Mentor" rules={[{ required: true }]}>
            <Select placeholder="Choose a faculty member...">
              <Select.Option value="Dr. Thanh Nguyen">Dr. Thanh Nguyen (AI Expert)</Select.Option>
              <Select.Option value="Mr. Hung Le">Mr. Hung Le (Web Dev)</Select.Option>
              <Select.Option value="Ms. Lan Tran">Ms. Lan Tran (Security)</Select.Option>
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block>Assign Mentor</Button>
        </Form>
      </Modal>
    </div>
  );
}

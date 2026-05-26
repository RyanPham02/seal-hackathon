"use client";
import { useState, useEffect } from "react";
import { Users, UserPlus, CheckCircle, XCircle, Mail, Shield, Building2 } from "lucide-react";
import { App, Table, Tag, Button, Modal, Form, Input, Select, DatePicker } from "antd";

export default function UsersPage() {
  const { message } = App.useApp();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [users, setUsers] = useState([
    { id: "1", name: "Nguyen Anh Tuan", email: "tuanna@fpt.edu.vn", type: "Local (FPT)", status: "Pending", uni: "FPT University" },
    { id: "2", name: "Tran Thi Binh", email: "binhtt@gmail.com", type: "External", status: "Pending", uni: "HCMUT" },
    { id: "3", name: "Le Van Cuong", email: "cuonglv@fpt.edu.vn", type: "Local (FPT)", status: "Approved", uni: "FPT University" },
  ]);

  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role === "Admin") setIsAdmin(true);
    }
  }, []);

  const handleApprove = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: "Approved" } : u));
    message.success("User approved successfully");
  };

  const handleReject = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
    message.success("User rejected and removed");
  };

  const handleCreateJudge = (values: any) => {
    message.success(`Guest Judge ${values.name} created! Email sent with temporary credentials.`);
    setIsModalOpen(false);
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (t: string) => <b>{t}</b> },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => (
      <Tag color={t.includes("FPT") ? "orange" : "blue"}>{t}</Tag>
    )},
    { title: 'University', dataIndex: 'uni', key: 'uni' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (t: string) => (
      <Tag color={t === "Pending" ? "warning" : "success"}>{t}</Tag>
    )},
    {
      title: 'Action', key: 'action', render: (_: any, record: any) => (
        record.status === "Pending" ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="small" type="primary" onClick={() => handleApprove(record.id)} icon={<CheckCircle size={14} />}>Approve</Button>
            <Button size="small" danger onClick={() => handleReject(record.id)} icon={<XCircle size={14} />}>Reject</Button>
          </div>
        ) : <span style={{ color: "var(--color-text-3)" }}>No actions</span>
      )
    }
  ];

  if (!isAdmin) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Shield size={48} style={{ color: "var(--color-danger)", marginBottom: 16 }} />
        <h2>Access Denied</h2>
        <p>This page is restricted to Event Administrators only.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title"><Users size={28} /> User Management</h1>
          <p className="page-subtitle">Approve participants and manage guest judges</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <UserPlus size={16} /> Create Guest Judge
        </button>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <button className={`btn ${activeTab === "pending" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("pending")}>
          Pending Approvals
        </button>
        <button className={`btn ${activeTab === "approved" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("approved")}>
          Approved Users
        </button>
      </div>

      <div className="card">
        <Table 
          dataSource={activeTab === "pending" ? users.filter(u => u.status === "Pending") : users.filter(u => u.status === "Approved")} 
          columns={columns} 
          rowKey="id" 
          pagination={false}
        />
      </div>

      <Modal 
        title={<><Shield size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Create Guest Judge Account</>}
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleCreateJudge} style={{ marginTop: 20 }}>
          <Form.Item name="name" label="Judge Name" rules={[{ required: true }]}>
            <Input prefix={<Users size={16} />} placeholder="Dr. John Doe" />
          </Form.Item>
          <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<Mail size={16} />} placeholder="judge@example.com" />
          </Form.Item>
          <Form.Item name="company" label="Company / University" rules={[{ required: true }]}>
            <Input prefix={<Building2 size={16} />} placeholder="Tech Corp" />
          </Form.Item>
          <Form.Item name="expiration" label="Account Expiration" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <div style={{ color: "var(--color-text-3)", fontSize: "0.85rem", marginBottom: 20 }}>
            * Temporary credentials will be emailed securely. The account will only have access to assigned judging rounds.
          </div>
          <Button type="primary" htmlType="submit" block>Generate Account</Button>
        </Form>
      </Modal>
    </div>
  );
}

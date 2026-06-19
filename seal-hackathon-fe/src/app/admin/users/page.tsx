"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, CheckCircle, XCircle, Mail, Shield, Building2 } from "lucide-react";
import { App, Table, Tag, Button, Modal, Form, Input } from "antd";
import { apiRequest, fetchCurrentUser } from "@/lib/api";

interface UserItem {
  id: string;
  name: string;
  email: string;
  type: string;
  status: string;
  uni: string;
}

interface BackendUser {
  id: string;
  fullName: string;
  email: string;
  studentType?: string | null;
  roles?: string[];
  isApproved: boolean;
  schoolName?: string | null;
}

interface CreatedJudge {
  email: string;
  password: string;
  fullName?: string;
  company?: string;
}

interface CreateJudgeValues {
  name: string;
  email: string;
  company?: string;
}

export default function UsersPage() {
  const { message, modal } = App.useApp();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Per-row action guard (`approve-<id>` / `reject-<id>`) against double-clicks.
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [createdJudge, setCreatedJudge] = useState<CreatedJudge | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<BackendUser[]>("/admin/users");
      setUsers(data.map((user) => ({
        id: user.id,
        name: user.fullName,
        email: user.email,
        type: user.studentType ?? user.roles?.join(", ") ?? "Member",
        status: user.isApproved ? "Approved" : "Pending",
        uni: user.schoolName ?? "-",
      })));
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchCurrentUser()
      .then((user) => setIsAdmin(user.roles.includes("Admin")))
      .catch(() => setIsAdmin(false))
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (isAdmin) {
      const trigger = async () => {
        await Promise.resolve();
        void loadUsers();
      };
      void trigger();
    }
  }, [isAdmin, loadUsers]);

  const handleApprove = async (id: string) => {
    if (busyAction) return;
    setBusyAction(`approve-${id}`);
    try {
      await apiRequest(`/admin/users/${id}/approve`, { method: "PUT" });
      message.success("User approved successfully");
      await loadUsers();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not approve user.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleReject = (record: UserItem) => {
    modal.confirm({
      title: `Reject ${record.name}?`,
      content: "The user will be denied access to the platform.",
      okText: "Reject",
      okButtonProps: { danger: true },
      onOk: async () => {
        setBusyAction(`reject-${record.id}`);
        try {
          await apiRequest(`/admin/users/${record.id}/reject`, { method: "PUT" });
          message.success("User rejected successfully");
          await loadUsers();
        } catch (err) {
          message.error(err instanceof Error ? err.message : "Could not reject user.");
        } finally {
          setBusyAction(null);
        }
      },
    });
  };

  const handleCreateJudge = async (values: CreateJudgeValues) => {
    setSubmitting(true);
    try {
      const res = await apiRequest<CreatedJudge>("/admin/users/create-judge", {
        method: "POST",
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          company: values.company
        })
      });
      setCreatedJudge(res);
      message.success("Guest judge account generated successfully!");
      await loadUsers();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not create guest judge.");
    } finally {
      setSubmitting(false);
    }
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
      title: 'Action', key: 'action', render: (_: unknown, record: UserItem) => (
        record.status === "Pending" ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              size="small"
              type="primary"
              loading={busyAction === `approve-${record.id}`}
              disabled={busyAction !== null && busyAction !== `approve-${record.id}`}
              onClick={() => handleApprove(record.id)}
              icon={<CheckCircle size={14} />}
            >
              Approve
            </Button>
            <Button
              size="small"
              danger
              loading={busyAction === `reject-${record.id}`}
              disabled={busyAction !== null && busyAction !== `reject-${record.id}`}
              onClick={() => handleReject(record)}
              icon={<XCircle size={14} />}
            >
              Reject
            </Button>
          </div>
        ) : <span style={{ color: "var(--color-text-3)" }}>No actions</span>
      )
    }
  ];

  if (!authChecked) {
    return (
      <div className="empty-state">
        <span className="spinner" />
        <div className="empty-title">Checking access</div>
      </div>
    );
  }

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
          className="custom-antd-table"
          dataSource={activeTab === "pending" ? users.filter(u => u.status === "Pending") : users.filter(u => u.status === "Approved")} 
          columns={columns} 
          rowKey="id" 
          loading={loading}
          pagination={false}
        />
      </div>

      <Modal 
        title={<><Shield size={18} style={{ marginRight: 8, verticalAlign: 'middle', display: 'inline' }} /> Create Guest Judge Account</>}
        open={isModalOpen} 
        onCancel={() => { setIsModalOpen(false); setCreatedJudge(null); }}
        footer={null}
      >
        {createdJudge ? (
          <div style={{ padding: "10px 0" }}>
            <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
              <strong style={{ color: "#10b981", display: "block", marginBottom: "0.5rem" }}>Account Generated Successfully!</strong>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-2)", margin: 0 }}>
                Please copy the temporary credentials below. The password will only be shown once.
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label className="form-label">Email Address</label>
              <Input.Search
                value={createdJudge.email}
                enterButton="Copy"
                onSearch={() => {
                  navigator.clipboard.writeText(createdJudge.email);
                  message.success("Email copied!");
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Temporary Password</label>
              <Input.Search
                value={createdJudge.password}
                enterButton="Copy"
                onSearch={() => {
                  navigator.clipboard.writeText(createdJudge.password);
                  message.success("Password copied!");
                }}
              />
            </div>

            <Button type="primary" block style={{ marginTop: "1.5rem" }} onClick={() => { setIsModalOpen(false); setCreatedJudge(null); }}>
              Done
            </Button>
          </div>
        ) : (
          <Form layout="vertical" onFinish={handleCreateJudge} style={{ marginTop: 20 }}>
            <Form.Item name="name" label="Judge Name" rules={[{ required: true }]}>
              <Input prefix={<Users size={16} />} placeholder="Dr. John Doe" />
            </Form.Item>
            <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
              <Input prefix={<Mail size={16} />} placeholder="judge@example.com" />
            </Form.Item>
            <Form.Item name="company" label="Company / University" rules={[{ required: true }]}>
              <Input prefix={<Building2 size={16} />} placeholder="Tech Corp / FPT" />
            </Form.Item>
            <div style={{ color: "var(--color-text-3)", fontSize: "0.85rem", marginBottom: 20 }}>
              * Temporary credentials will be generated securely. You will need to copy and share them with the guest judge.
            </div>
            <Button type="primary" htmlType="submit" loading={submitting} block>Generate Account</Button>
          </Form>
        )}
      </Modal>
    </div>
  );
}

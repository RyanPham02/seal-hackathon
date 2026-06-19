"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FileText, Shield, Search, RefreshCw, Clock } from "lucide-react";
import { App, Table, Tag, Input } from "antd";
import { apiRequest, fetchCurrentUser } from "@/lib/api";

interface AuditLogItem {
  id: string;
  actorUserId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  description: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const { message } = App.useApp();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<AuditLogItem[]>("/admin/audit-logs");
      setLogs(data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load audit logs.");
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
      void loadLogs();
    }
  }, [isAdmin, loadLogs]);

  const filteredLogs = useMemo(() => {
    if (!searchText.trim()) return logs;
    const query = searchText.toLowerCase();
    return logs.filter((log) => {
      return (
        log.action.toLowerCase().includes(query) ||
        (log.actorName && log.actorName.toLowerCase().includes(query)) ||
        (log.actorEmail && log.actorEmail.toLowerCase().includes(query)) ||
        (log.description && log.description.toLowerCase().includes(query)) ||
        (log.entityType && log.entityType.toLowerCase().includes(query))
      );
    });
  }, [logs, searchText]);

  const columns = [
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (t: string) => (
        <span style={{ fontSize: "0.85rem", color: "var(--color-text-2)" }}>
          {new Date(t).toLocaleString()}
        </span>
      ),
      width: "180px",
    },
    {
      title: "Actor",
      key: "actor",
      render: (_: unknown, record: AuditLogItem) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{record.actorName || "System / Guest"}</div>
          {record.actorEmail && (
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>{record.actorEmail}</div>
          )}
        </div>
      ),
      width: "200px",
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (action: string) => {
        let color = "blue";
        if (action.includes("delete")) color = "volcano";
        else if (action.includes("create")) color = "green";
        else if (action.includes("update") || action.includes("edit")) color = "orange";
        else if (action.includes("login") || action.includes("auth")) color = "purple";
        return <Tag color={color}>{action}</Tag>;
      },
      width: "150px",
    },
    {
      title: "Target Type",
      dataIndex: "entityType",
      key: "entityType",
      render: (type: string | null) => (
        type ? <span className="badge badge-neutral">{type}</span> : "-"
      ),
      width: "120px",
    },
    {
      title: "Details",
      dataIndex: "description",
      key: "description",
      render: (desc: string) => (
        <span style={{ fontSize: "0.88rem", color: "var(--color-text-1)" }}>{desc}</span>
      ),
    },
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
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FileText size={28} /> System Audit Logs
          </h1>
          <p className="page-subtitle">View and audit system activity logs</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Input
            prefix={<Search size={16} style={{ color: "var(--color-text-3)" }} />}
            placeholder="Search logs..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <button className="btn btn-secondary btn-icon" onClick={loadLogs} disabled={loading} title="Refresh Logs">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      <div className="card">
        <Table
          className="custom-antd-table"
          dataSource={filteredLogs}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: false }}
        />
      </div>
    </div>
  );
}

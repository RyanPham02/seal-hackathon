"use client";
import React, { useEffect, useState } from "react";
import { Typography, Table, Button, Card, Tag, Input, App } from "antd";
import { StarOutlined, FileOutlined, SearchOutlined, EyeOutlined } from "@ant-design/icons";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

const { Title, Text } = Typography;

type EventDto = {
  eventId: string;
  eventName: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  status: string;
  rounds?: unknown[];
};

export default function UserEventsPage() {
  const { message } = App.useApp();
  const [events, setEvents] = useState<EventDto[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    apiRequest<EventDto[]>("/Events")
      .then((data) => {
        if (!active) return;
        setEvents(data);
      })
      .catch((err) => {
        if (!active) return;
        message.error(err instanceof Error ? err.message : "Could not load events.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [message]);

  const filteredEvents = events.filter(e =>
    e.eventName?.toLowerCase().includes(searchText.toLowerCase()) ||
    e.status?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "EVENT NAME",
      dataIndex: "eventName",
      key: "eventName",
      render: (text: string, record: EventDto) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ padding: "8px", background: "var(--color-surface-2)", borderRadius: "6px" }}>
            {record.status === "Active" ? <StarOutlined style={{color: "#60a5fa"}} /> : <FileOutlined style={{color: "#9ca3af"}} />}
          </div>
          <b>{text}</b>
        </div>
      )
    },
    {
      title: "DATES",
      key: "dates",
      render: (_: unknown, record: EventDto) => (
        <span>{new Date(record.startDate).toLocaleDateString()} - {new Date(record.endDate).toLocaleDateString()}</span>
      )
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (text: string) => (
        <Tag color={text === "Active" ? "processing" : "default"} style={{ borderRadius: "12px", padding: "2px 10px" }}>
          {text}
        </Tag>
      )
    },
    {
      title: "ROUNDS",
      key: "rounds",
      render: (_: unknown, record: EventDto) => <b>{record.rounds?.length ?? 0} Rounds</b>
    },
    {
      title: "ACTIONS",
      key: "actions",
      render: (_: unknown, record: EventDto) => (
        <Link href={`/dashboard/events/${record.eventId}`}>
          <Button type="primary" icon={<EyeOutlined />} style={{ borderRadius: "20px" }}>View & Participate</Button>
        </Link>
      )
    }
  ];

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Discover Hackathons</Title>
          <Text type="secondary">Browse hackathon events from the backend.</Text>
        </div>
        <Input
          placeholder="Search events..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300, borderRadius: "20px" }}
          prefix={<SearchOutlined />}
        />
      </div>

      <Card variant="borderless" styles={{ body: { padding: 0 } }} style={{ background: "transparent" }}>
        <Table
          columns={columns}
          dataSource={filteredEvents}
          pagination={{ pageSize: 10 }}
          rowKey="eventId"
          loading={loading}
          locale={{ emptyText: loading ? "Loading events..." : "No events found." }}
        />
      </Card>
    </div>
  );
}

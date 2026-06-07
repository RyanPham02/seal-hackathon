"use client";
import { useEffect, useState } from "react";
import { Typography, Table, Button, Space, Card, Drawer, Form, Input, InputNumber, App, Modal, Select, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { apiRequest } from "@/lib/api";

const { Title, Text } = Typography;

type EventDto = {
  eventId: string;
  eventName: string;
};

type PrizeDto = {
  prizeId: string;
  eventId: string;
  eventName: string;
  title: string;
  amount?: string | null;
  track?: string | null;
  description?: string | null;
  rank: number;
};

type PrizeFormValues = {
  title: string;
  amount?: string;
  track?: string;
  rank?: number;
  description?: string;
};

export default function AdminPrizesPage() {
  const { message } = App.useApp();
  const [events, setEvents] = useState<EventDto[]>([]);
  const [eventId, setEventId] = useState("");
  const [prizes, setPrizes] = useState<PrizeDto[]>([]);
  const [searchText, setSearchText] = useState("");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<PrizeFormValues>();

  const loadPrizes = async (selectedEventId: string) => {
    if (!selectedEventId) {
      setPrizes([]);
      return;
    }

    setLoading(true);
    try {
      setPrizes(await apiRequest<PrizeDto[]>(`/Prizes?eventId=${selectedEventId}`));
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load prizes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    apiRequest<EventDto[]>("/Events")
      .then((data) => {
        if (!active) return;
        setEvents(data);
        setEventId((current) => current || data[0]?.eventId || "");
      })
      .catch((err) => {
        if (active) message.error(err instanceof Error ? err.message : "Could not load events.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [message]);

  useEffect(() => {
    if (!eventId) return;

    let active = true;

    apiRequest<PrizeDto[]>(`/Prizes?eventId=${eventId}`)
      .then((data) => {
        if (active) setPrizes(data);
      })
      .catch((err) => {
        if (active) message.error(err instanceof Error ? err.message : "Could not load prizes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [eventId, message]);

  const showCreateDrawer = () => {
    setIsEditMode(false);
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ rank: prizes.length + 1 });
    setDrawerVisible(true);
  };

  const showEditDrawer = (record: PrizeDto) => {
    setIsEditMode(true);
    setEditingId(record.prizeId);
    form.setFieldsValue({
      title: record.title,
      amount: record.amount ?? undefined,
      track: record.track ?? undefined,
      rank: record.rank,
      description: record.description ?? undefined,
    });
    setDrawerVisible(true);
  };

  const handleDelete = (record: PrizeDto) => {
    Modal.confirm({
      title: `Delete prize "${record.title}"?`,
      okType: "danger",
      onOk: async () => {
        try {
          await apiRequest(`/Prizes/${record.prizeId}`, { method: "DELETE" });
          message.success("Prize deleted successfully.");
          await loadPrizes(eventId);
        } catch (err) {
          message.error(err instanceof Error ? err.message : "Could not delete prize.");
        }
      },
    });
  };

  const handleFinish = async (values: PrizeFormValues) => {
    if (!eventId) {
      message.error("Select an event first.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: values.title.trim(),
        amount: values.amount?.trim() || null,
        track: values.track?.trim() || null,
        description: values.description?.trim() || null,
        rank: values.rank ?? 0,
      };

      if (isEditMode && editingId) {
        await apiRequest(`/Prizes/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        message.success("Prize updated successfully.");
      } else {
        await apiRequest("/Prizes", {
          method: "POST",
          body: JSON.stringify({ ...payload, eventId }),
        });
        message.success("Prize created successfully.");
      }

      setDrawerVisible(false);
      await loadPrizes(eventId);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not save prize.");
    } finally {
      setSaving(false);
    }
  };

  const filteredPrizes = prizes.filter((p) =>
    p.title?.toLowerCase().includes(searchText.toLowerCase()) ||
    (p.track ?? "").toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "RANK",
      dataIndex: "rank",
      key: "rank",
      width: 80,
      sorter: (a: PrizeDto, b: PrizeDto) => a.rank - b.rank,
      defaultSortOrder: "ascend" as const,
      render: (rank: number) => <Tag color="gold">#{rank}</Tag>,
    },
    { title: "TITLE", dataIndex: "title", key: "title", render: (text: string) => <b>{text}</b> },
    { title: "AMOUNT", dataIndex: "amount", key: "amount", render: (a?: string | null) => a || <Text type="secondary">—</Text> },
    { title: "TRACK", dataIndex: "track", key: "track", render: (t?: string | null) => t || <Text type="secondary">—</Text> },
    {
      title: "ACTIONS",
      key: "actions",
      width: 110,
      render: (_: unknown, record: PrizeDto) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => showEditDrawer(record)} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Prize Management</Title>
          <Text type="secondary">Configure rewards for each event.</Text>
        </div>
        <Space wrap>
          <Select
            style={{ width: 260 }}
            placeholder="Select event"
            value={eventId || undefined}
            onChange={setEventId}
            options={events.map((event) => ({ value: event.eventId, label: event.eventName }))}
          />
          <Input
            placeholder="Search prizes..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260, borderRadius: "20px" }}
            prefix={<SearchOutlined />}
          />
          <Button icon={<ReloadOutlined />} onClick={() => loadPrizes(eventId)} disabled={!eventId || loading} />
          <Button type="primary" icon={<PlusOutlined />} onClick={showCreateDrawer} style={{ borderRadius: "20px" }} disabled={!eventId}>
            Create Prize
          </Button>
        </Space>
      </div>

      <Card variant="borderless" styles={{ body: { padding: 0 } }} style={{ background: "transparent" }}>
        <Table
          columns={columns}
          dataSource={filteredPrizes}
          pagination={{ pageSize: 10 }}
          rowKey="prizeId"
          loading={loading}
          locale={{ emptyText: eventId ? "No prizes for this event yet." : "Select an event first." }}
        />
      </Card>

      <Drawer
        title={isEditMode ? "Edit Prize" : "Create New Prize"}
        placement="right"
        width={480}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        extra={
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={() => form.submit()}>
              {isEditMode ? "Save Changes" : "Create Prize"}
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Form.Item name="title" label="Prize Title" rules={[{ required: true, message: "Please enter a prize title" }]}>
            <Input placeholder="e.g., Grand Prize" />
          </Form.Item>

          <Form.Item name="amount" label="Amount">
            <Input placeholder="e.g., $10,000" />
          </Form.Item>

          <Form.Item name="track" label="Track / Category">
            <Input placeholder="e.g., All Tracks or AI & Machine Learning" />
          </Form.Item>

          <Form.Item name="rank" label="Rank" tooltip="Lower number shows first (1 = top prize).">
            <InputNumber min={0} style={{ width: "100%" }} placeholder="1" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="What this prize is awarded for..." />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

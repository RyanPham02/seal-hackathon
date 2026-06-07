"use client";
import React, { useEffect, useState } from "react";
import { Typography, Table, Button, Space, Card, Drawer, Form, Input, App, Modal, Select } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { apiRequest } from "@/lib/api";

const { Title, Text } = Typography;

type EventDto = {
  eventId: string;
  eventName: string;
};

type CategoryDto = {
  categoryId: string;
  categoryName: string;
  description?: string | null;
};

export default function AdminTracksPage() {
  const { message } = App.useApp();
  const [events, setEvents] = useState<EventDto[]>([]);
  const [eventId, setEventId] = useState("");
  const [tracks, setTracks] = useState<CategoryDto[]>([]);
  const [searchText, setSearchText] = useState("");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();

  const loadTracks = async (selectedEventId: string) => {
    if (!selectedEventId) {
      setTracks([]);
      return;
    }

    setLoading(true);
    try {
      setTracks(await apiRequest<CategoryDto[]>(`/events/${selectedEventId}/categories`));
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load categories.");
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
  }, []);

  useEffect(() => {
    if (!eventId) {
      return;
    }

    let active = true;

    apiRequest<CategoryDto[]>(`/events/${eventId}/categories`)
      .then((data) => {
        if (active) setTracks(data);
      })
      .catch((err) => {
        if (active) message.error(err instanceof Error ? err.message : "Could not load categories.");
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
    setDrawerVisible(true);
  };

  const showEditDrawer = (record: CategoryDto) => {
    setIsEditMode(true);
    setEditingId(record.categoryId);
    form.setFieldsValue({
      categoryName: record.categoryName,
      description: record.description,
    });
    setDrawerVisible(true);
  };

  const handleDelete = (id: string) => {
    if (!eventId) return;

    Modal.confirm({
      title: "Are you sure you want to delete this track?",
      onOk: async () => {
        try {
          await apiRequest(`/events/${eventId}/categories/${id}`, { method: "DELETE" });
          message.success("Track deleted successfully.");
          await loadTracks(eventId);
        } catch (err) {
          message.error(err instanceof Error ? err.message : "Could not delete track.");
        }
      },
    });
  };

  const handleFinish = async (values: { categoryName: string; description?: string }) => {
    if (!eventId) {
      message.error("Select an event first.");
      return;
    }

    try {
      if (isEditMode && editingId) {
        await apiRequest(`/events/${eventId}/categories/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({
            categoryName: values.categoryName.trim(),
            description: values.description?.trim() || null,
          }),
        });
        message.success("Track updated successfully.");
      } else {
        await apiRequest(`/events/${eventId}/categories`, {
          method: "POST",
          body: JSON.stringify({
            categoryName: values.categoryName.trim(),
            description: values.description?.trim() || null,
          }),
        });
        message.success("Track created successfully.");
      }

      setDrawerVisible(false);
      await loadTracks(eventId);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not save track.");
    }
  };

  const filteredTracks = tracks.filter(t =>
    t.categoryName?.toLowerCase().includes(searchText.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "TRACK NAME",
      dataIndex: "categoryName",
      key: "categoryName",
      render: (text: string) => <b>{text}</b>
    },
    { title: "DESCRIPTION", dataIndex: "description", key: "description", ellipsis: true },
    {
      title: "ACTIONS",
      key: "actions",
      render: (_: unknown, record: CategoryDto) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => showEditDrawer(record)} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.categoryId)} />
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Track Management</Title>
          <Text type="secondary">Tracks are backed by event categories.</Text>
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
            placeholder="Search tracks..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260, borderRadius: "20px" }}
            prefix={<SearchOutlined />}
          />
          <Button icon={<ReloadOutlined />} onClick={() => loadTracks(eventId)} disabled={!eventId || loading} />
          <Button type="primary" icon={<PlusOutlined />} onClick={showCreateDrawer} style={{ borderRadius: "20px" }} disabled={!eventId}>
            Create Track
          </Button>
        </Space>
      </div>

      <Card variant="borderless" styles={{ body: { padding: 0 } }} style={{ background: "transparent" }}>
        <Table
          columns={columns}
          dataSource={filteredTracks}
          pagination={{ pageSize: 10 }}
          rowKey="categoryId"
          loading={loading}
          locale={{ emptyText: eventId ? "No tracks found for this event." : "Select an event first." }}
        />
      </Card>

      <Drawer
        title={isEditMode ? "Edit Track" : "Create New Track"}
        placement="right"
        width={480}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        extra={
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()}>
              {isEditMode ? "Save Changes" : "Create Track"}
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Form.Item name="categoryName" label="Track Name" rules={[{ required: true, message: "Please enter track name" }]}>
            <Input placeholder="e.g., AI & Machine Learning" />
          </Form.Item>
          
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Brief description of this track..." />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

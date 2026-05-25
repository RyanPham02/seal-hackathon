"use client";
import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Space, Card, Tag, Drawer, Form, Input, Select, InputNumber, App, DatePicker, Modal } from 'antd';
import { PlusOutlined, StarOutlined, FileOutlined, EditOutlined, DeleteOutlined, SearchOutlined, PlayCircleOutlined, PauseCircleOutlined, SoundOutlined, SettingOutlined } from '@ant-design/icons';
import { databaseService } from '../../../services/databaseService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function EventManagementPage() {
  const { message } = App.useApp();
  const [events, setEvents] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  // Round Management States
  const [roundsModalVisible, setRoundsModalVisible] = useState(false);
  const [selectedEventRounds, setSelectedEventRounds] = useState<any[]>([]);
  const [selectedEventName, setSelectedEventName] = useState('');

  const mockRoundsData = [
    { id: 'R1', name: 'Registration & Idea Submission', status: 'Closed' },
    { id: 'R2', name: 'Semi-Finals (Prototype)', status: 'Active' },
    { id: 'R3', name: 'Final Pitching', status: 'Draft' }
  ];

  useEffect(() => {
    setEvents(databaseService.getEvents());
  }, []);

  const showManageRounds = (record: any) => {
    setSelectedEventName(record.name);
    setSelectedEventRounds([...mockRoundsData]);
    setRoundsModalVisible(true);
  };

  const handleRoundAction = (roundId: string, action: string) => {
    message.success(`Round ${action.toLowerCase()} successfully!`);
    setSelectedEventRounds(prev => prev.map(r => {
      if (r.id === roundId) {
        if (action === 'Opened') return { ...r, status: 'Active' };
        if (action === 'Closed') return { ...r, status: 'Closed' };
        if (action === 'Published') return { ...r, status: 'Published' };
      }
      return r;
    }));
  };

  const roundColumns = [
    { title: 'ROUND NAME', dataIndex: 'name', key: 'name', render: (text: string) => <b>{text}</b> },
    { 
      title: 'STATUS', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Active' ? 'processing' : status === 'Closed' ? 'default' : status === 'Published' ? 'success' : 'warning'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          {record.status !== 'Active' && record.status !== 'Published' && (
            <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => handleRoundAction(record.id, 'Opened')}>Open</Button>
          )}
          {record.status === 'Active' && (
            <Button size="small" danger icon={<PauseCircleOutlined />} onClick={() => handleRoundAction(record.id, 'Closed')}>Close</Button>
          )}
          {record.status === 'Closed' && (
            <Button size="small" style={{ background: '#52c41a', color: 'white', borderColor: '#52c41a' }} icon={<SoundOutlined />} onClick={() => handleRoundAction(record.id, 'Published')}>Publish Results</Button>
          )}
        </Space>
      )
    }
  ];

  const showCreateDrawer = () => {
    setIsEditMode(false);
    setEditingId(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const showEditDrawer = (record: any) => {
    setIsEditMode(true);
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      season: record.season,
      status: record.status,
      roundsCount: record.roundsCount
    });
    setDrawerVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this event?',
      onOk: () => {
        databaseService.deleteEvent(id);
        setEvents(databaseService.getEvents());
        databaseService.logAction('Admin', `Deleted event ID ${id}`, 'delete');
        message.success('Event deleted successfully');
      }
    });
  };

  const handleFinish = (values: any) => {
    message.loading({ content: 'Saving event...', key: 'eventSave' });
    setTimeout(() => {
      if (isEditMode) {
        const updatedEvent = { ...events.find(e => e.id === editingId), ...values };
        databaseService.updateEvent(updatedEvent);
        databaseService.logAction('Admin', `Updated event ${updatedEvent.name}`, 'edit');
      } else {
        const newEvent = { ...values, id: Date.now().toString(), icon: 'file' };
        databaseService.addEvent(newEvent);
        databaseService.logAction('Admin', `Created new event ${newEvent.name}`, 'plus-circle');
      }
      setEvents(databaseService.getEvents());
      message.success({ content: `Event ${isEditMode ? 'updated' : 'created'} successfully!`, key: 'eventSave', duration: 2 });
      setDrawerVisible(false);
    }, 500);
  };

  const filteredEvents = events.filter(e => 
    e.name?.toLowerCase().includes(searchText.toLowerCase()) || 
    e.season?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    { 
      title: 'EVENT NAME', 
      dataIndex: 'name', 
      key: 'name', 
      render: (text: string, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', background: '#374151', borderRadius: '6px' }}>
            {record.icon === 'star' ? <StarOutlined style={{color: '#60a5fa'}} /> : <FileOutlined style={{color: '#9ca3af'}} />}
          </div>
          <b>{text}</b>
        </div>
      ) 
    },
    { title: 'SEASON', dataIndex: 'season', key: 'season' },
    { 
      title: 'STATUS', 
      dataIndex: 'status', 
      key: 'status',
      render: (text: string) => (
        <Tag color={text === 'Active' ? 'processing' : 'default'} style={{ borderRadius: '12px', padding: '2px 10px' }}>
          {text}
        </Tag>
      )
    },
    { 
      title: 'ROUNDS COUNT', 
      dataIndex: 'roundsCount', 
      key: 'roundsCount',
      render: (text: string) => <b>{text} Rounds</b>
    },
    { 
      title: 'ACTIONS', 
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button type="default" size="small" icon={<SettingOutlined />} onClick={() => showManageRounds(record)}>Rounds</Button>
          <Button type="text" icon={<EditOutlined />} onClick={() => showEditDrawer(record)} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Active Hackathons</Title>
          <Text type="secondary">Monitor and manage all historical and current hackathon events.</Text>
        </div>
        <Space>
          <Input 
            placeholder="Search events..." 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300, borderRadius: '20px' }}
            prefix={<SearchOutlined />}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={showCreateDrawer} style={{ borderRadius: '20px' }}>
            Create Event
          </Button>
        </Space>
      </div>

      <Card bordered={false} bodyStyle={{ padding: 0 }} style={{ background: 'transparent' }}>
        <Table 
          columns={columns} 
          dataSource={filteredEvents} 
          pagination={{ pageSize: 10 }} 
          rowKey="id" 
        />
      </Card>

      <Drawer
        title={isEditMode ? "Edit Event" : "Create New Event"}
        placement="right"
        width={480}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        extra={
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()}>
              {isEditMode ? 'Save Changes' : 'Create'}
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Form.Item name="name" label="Event Name" rules={[{ required: true, message: 'Please enter event name' }]}>
            <Input placeholder="e.g., SEAL Spring Hackathon" />
          </Form.Item>
          
          <Form.Item name="season" label="Season" rules={[{ required: true }]}>
            <Select placeholder="Select season">
              <Select.Option value="Spring 2025">Spring 2025</Select.Option>
              <Select.Option value="Summer 2025">Summer 2025</Select.Option>
              <Select.Option value="Fall 2025">Fall 2025</Select.Option>
            </Select>
          </Form.Item>

          <div style={{ padding: '10px 15px', background: '#1f2937', borderRadius: '8px', border: '1px solid #374151', marginBottom: '20px' }}>
            <Text strong style={{ display: 'block', marginBottom: '10px' }}>Event Phases (Timeline)</Text>
            
            <Form.Item label="1. Registration Phase">
              <RangePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item label="2. Submission Phase">
              <RangePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="3. Judging & Final Phase" style={{ marginBottom: 0 }}>
              <RangePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item name="status" label="Status" initialValue="Draft">
            <Select>
              <Select.Option value="Draft">Draft</Select.Option>
              <Select.Option value="Active">Active</Select.Option>
              <Select.Option value="Completed">Completed</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="roundsCount" label="Number of Rounds" initialValue={1}>
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Description">
            <Input.TextArea rows={4} placeholder="Internal notes about this event..." />
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        title={`Manage Rounds - ${selectedEventName}`}
        open={roundsModalVisible}
        onCancel={() => setRoundsModalVisible(false)}
        footer={null}
        width={700}
      >
        <Table 
          columns={roundColumns} 
          dataSource={selectedEventRounds} 
          pagination={false} 
          rowKey="id" 
        />
      </Modal>
    </div>
  );
}

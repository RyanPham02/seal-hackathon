"use client";
import { useState } from "react";
import { FileText, Plus, Trash2, Edit2, Copy, Save } from "lucide-react";
import { App, Table, Button, Modal, Form, Input, InputNumber, Tag } from "antd";

export default function CriteriaTemplatesPage() {
  const { message } = App.useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templates, setTemplates] = useState([
    {
      id: "T1",
      name: "SEAL Standard Hackathon",
      description: "Default scoring rubric for general software engineering hackathons.",
      criteria: [
        { name: "Technical Implementation", weight: 30 },
        { name: "Innovation & Creativity", weight: 25 },
        { name: "Presentation & Demo", weight: 25 },
        { name: "Code Quality", weight: 20 },
      ]
    },
    {
      id: "T2",
      name: "AI & Machine Learning Track",
      description: "Specialized rubric for AI models and data accuracy.",
      criteria: [
        { name: "Model Accuracy", weight: 35 },
        { name: "Innovation", weight: 20 },
        { name: "Real-world Application", weight: 25 },
        { name: "Performance/Latency", weight: 20 },
      ]
    }
  ]);

  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const handleCreateOrUpdate = (values: any) => {
    // Basic mock save
    message.success(`Template ${editingTemplate ? "updated" : "created"} successfully!`);
    setIsModalOpen(false);
  };

  const columns = [
    { title: 'Template Name', dataIndex: 'name', key: 'name', render: (t: string) => <b>{t}</b> },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { 
      title: 'Criteria breakdown', key: 'criteria', 
      render: (_: any, record: any) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {record.criteria.map((c: any, i: number) => (
            <Tag key={i} color="blue">{c.name} ({c.weight}%)</Tag>
          ))}
        </div>
      ) 
    },
    {
      title: 'Action', key: 'action', render: (_: any, record: any) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="small" onClick={() => { setEditingTemplate(record); setIsModalOpen(true); }} icon={<Edit2 size={14} />} />
          <Button size="small" icon={<Copy size={14} />} onClick={() => message.success("Template cloned!")} />
          <Button size="small" danger icon={<Trash2 size={14} />} />
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title"><FileText size={28} /> Scoring Criteria Templates</h1>
          <p className="page-subtitle">Manage reusable grading rubrics for events</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingTemplate(null); setIsModalOpen(true); }}>
          <Plus size={16} /> New Template
        </button>
      </div>

      <div className="card">
        <Table dataSource={templates} columns={columns} rowKey="id" pagination={false} />
      </div>

      <Modal 
        title={editingTemplate ? "Edit Template" : "Create New Template"}
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form layout="vertical" onFinish={handleCreateOrUpdate} initialValues={editingTemplate || {}}>
          <Form.Item name="name" label="Template Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Standard Hackathon Rubric" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Brief description of when to use this template" />
          </Form.Item>
          
          <div style={{ background: "rgba(15,23,42,0.5)", padding: 16, borderRadius: 8, marginBottom: 20 }}>
            <h4 style={{ marginBottom: 10 }}>Criteria List</h4>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-3)", marginBottom: 10 }}>
              (Mock view: In a real scenario, you would dynamically add/remove criteria rows here)
            </p>
            {editingTemplate ? editingTemplate.criteria.map((c: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <Input value={c.name} style={{ flex: 1 }} readOnly />
                <InputNumber value={c.weight} readOnly style={{ width: 80 }} addonAfter="%" />
              </div>
            )) : (
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <Input placeholder="Criterion Name" style={{ flex: 1 }} />
                <InputNumber placeholder="Weight" style={{ width: 80 }} addonAfter="%" />
              </div>
            )}
          </div>

          <Button type="primary" htmlType="submit" icon={<Save size={16} />} block>
            Save Template
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

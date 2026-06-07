"use client";
import { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import { App, Table, Tag } from "antd";
import { apiRequest } from "@/lib/api";

interface RoundDto {
  roundId: string;
  roundName: string;
}

interface EventDto {
  eventId: string;
  eventName: string;
  rounds: RoundDto[];
}

interface CriteriaDto {
  criteriaId: string;
  criteriaName: string;
  weight: number;
  maxScore: number;
  roundId: string;
}

interface CriteriaRow {
  key: string;
  event: string;
  round: string;
  criteria: CriteriaDto[];
}

export default function CriteriaPage() {
  const { message } = App.useApp();
  const [rows, setRows] = useState<CriteriaRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const events = await apiRequest<EventDto[]>("/Events");
        const built: CriteriaRow[] = [];

        await Promise.all(
          events.flatMap((event) =>
            (event.rounds ?? []).map(async (round) => {
              try {
                const criteria = await apiRequest<CriteriaDto[]>(`/rounds/${round.roundId}/criteria`);
                if (criteria.length > 0) {
                  built.push({
                    key: round.roundId,
                    event: event.eventName,
                    round: round.roundName,
                    criteria,
                  });
                }
              } catch {
                /* skip rounds whose criteria cannot be loaded */
              }
            }),
          ),
        );

        setRows(built);
      } catch (err) {
        message.error(err instanceof Error ? err.message : "Could not load criteria.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [message]);

  const columns = [
    { title: "Event", dataIndex: "event", key: "event", render: (t: string) => <b>{t}</b> },
    { title: "Round", dataIndex: "round", key: "round" },
    {
      title: "Criteria breakdown",
      key: "criteria",
      render: (_: unknown, record: CriteriaRow) => (
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {record.criteria.map((c) => (
            <Tag key={c.criteriaId} color="blue">{c.criteriaName} ({c.weight}%)</Tag>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title"><FileText size={28} /> Scoring Criteria</h1>
          <p className="page-subtitle">Grading rubric configured per event round</p>
        </div>
      </div>

      <div className="card">
        <Table
          dataSource={rows}
          columns={columns}
          rowKey="key"
          loading={loading}
          pagination={false}
          locale={{ emptyText: loading ? "Loading criteria…" : "No criteria configured yet. Add criteria when creating an event." }}
        />
      </div>
    </div>
  );
}

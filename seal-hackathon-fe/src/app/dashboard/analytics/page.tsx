"use client";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from "recharts";
import { Download, Info, TrendingUp } from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";

interface CriterionReliability {
  criteriaId: string;
  criterion: string;
  icc: number | null;
  agreement: string;
  avgScore: number;
}

interface JudgeAverage {
  judge: string;
  avgScore: number;
}

interface TeamVariance {
  team: string;
  judges: JudgeAverage[];
}

interface CriterionAverage {
  criterion: string;
  avgScore: number;
}

interface InterRaterAnalytics {
  overallIcc: number | null;
  judgeCount: number;
  submissionCount: number;
  criteriaCount: number;
  byCriterion: CriterionReliability[];
  variance: TeamVariance[];
  criterionAverages: CriterionAverage[];
}

const BAR_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e"];

export default function AnalyticsPage() {
  const { message } = App.useApp();
  const [data, setData] = useState<InterRaterAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiRequest<InterRaterAnalytics>("/Analytics/inter-rater");
        setData(res);
      } catch (err) {
        message.error(err instanceof Error ? err.message : "Could not load analytics.");
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [message]);

  const exportAnalyticsCSV = () => {
    if (!data) return;
    // Quote + escape cells, and neutralize leading formula characters (CSV injection).
    const csvCell = (cell: string | number) => {
      let value = String(cell);
      if (/^[=+\-@]/.test(value)) value = `'${value}`;
      return `"${value.replace(/"/g, '""')}"`;
    };
    const header = "Criterion,ICC,Agreement,AvgScore\n";
    const rows = data.byCriterion.map(d => [d.criterion, d.icc ?? "N/A", d.agreement, d.avgScore].map(csvCell).join(",")).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "analytics_export.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="empty-state"><TrendingUp size={48} className="empty-icon" /><div className="empty-title">Loading analytics…</div></div>;
  }

  if (!data || data.submissionCount === 0) {
    return (
      <div className="empty-state">
        <TrendingUp size={48} className="empty-icon" />
        <div className="empty-title">No scoring data yet</div>
        <p style={{ color: "var(--color-text-3)", marginTop: "0.5rem" }}>Inter-rater analytics appear once judges have scored submissions.</p>
      </div>
    );
  }

  // Build dynamic judge bars for the variance chart
  const judgeNames = Array.from(new Set(data.variance.flatMap(v => v.judges.map(j => j.judge))));
  const varianceRows = data.variance.map(v => {
    const row: Record<string, string | number> = { name: v.team };
    for (const j of v.judges) row[j.judge] = j.avgScore;
    return row;
  });

  const radarData = data.criterionAverages.map(c => ({ criterion: c.criterion, avgScore: c.avgScore }));

  return (
    <div style={{ maxWidth: 1100, height: "calc(100vh - 100px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div>
          <h1 className="page-title">Research & Analytics</h1>
          <p className="page-subtitle">Inter-Rater Reliability (ICC) Analysis</p>
        </div>
        <button className="btn btn-secondary" onClick={exportAnalyticsCSV}><Download size={15} style={{ marginRight: "0.5rem" }} /> Export CSV</button>
      </div>

      <div style={{ overflowY: "auto", flex: 1, paddingRight: "0.5rem" }}>
        {/* RQ Banner */}
        <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-lg)", padding: "1.25rem 1.5rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <Info size={18} style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: "0.25rem", color: "var(--color-text-1)" }}>Research Question</div>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-2)" }}>
                <strong style={{ color: "var(--color-text-1)" }}>RQ:</strong> How consistent are hackathon evaluation scores across different judges evaluating the same submission in academic software engineering competitions?
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="glass-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Overall ICC",     val: data.overallIcc != null ? data.overallIcc.toFixed(3) : "N/A", color: "#10b981", sub: "Intraclass Correlation" },
            { label: "Judges Analyzed", val: String(data.judgeCount),      color: "#6366f1", sub: "Scored submissions" },
            { label: "Submissions",     val: String(data.submissionCount), color: "#f59e0b", sub: "With scores" },
            { label: "Criteria",        val: String(data.criteriaCount),   color: "#06b6d4", sub: "Scored criteria" },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "var(--font-display)", color: s.color }}>{s.val}</div>
              <div style={{ fontWeight: 600, fontSize: "0.85rem", marginTop: "0.25rem", color: "var(--color-text-1)" }}>{s.label}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)", marginTop: "0.15rem" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="glass-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem", marginBottom: "2rem" }}>
          {/* ICC by Criterion */}
          <div className="glass-card">
            <h4 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-1)" }}>
              <TrendingUp size={16} style={{ color: "var(--color-primary)" }} /> ICC by Criterion
            </h4>
            {data.byCriterion.length === 0 && <div style={{ color: "var(--color-text-3)", fontSize: "0.85rem" }}>No criteria scored yet.</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {data.byCriterion.map(d => {
                const icc = d.icc ?? 0;
                return (
                  <div key={d.criteriaId}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: 500, color: "var(--color-text-2)" }}>{d.criterion}</span>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <span className={`glass-badge ${d.agreement === "Very High" ? "success" : d.agreement === "High" ? "primary" : d.agreement === "Moderate" ? "warning" : "danger"}`}>{d.agreement}</span>
                        <strong style={{ color: "var(--color-text-1)" }}>{d.icc ?? "N/A"}</strong>
                      </div>
                    </div>
                    <div className="progress" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="progress-fill" style={{
                        width: `${icc * 100}%`,
                        background: icc >= 0.8 ? "linear-gradient(90deg,#10b981,#34d399)" : icc >= 0.65 ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : "linear-gradient(90deg,#f59e0b,#fbbf24)",
                      }} />
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--color-text-3)", marginTop: "0.4rem" }}>
                      Avg score: {d.avgScore}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Radar: Average score by criterion */}
          <div className="glass-card">
            <h4 style={{ marginBottom: "1.25rem", color: "var(--color-text-1)" }}>Average Score by Criterion</h4>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(148,163,184,0.1)" />
                <PolarAngleAxis dataKey="criterion" tick={{ fill: "var(--color-text-3)", fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fill: "var(--color-text-3)", fontSize: 10 }} />
                <Radar name="Average Score" dataKey="avgScore" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-text-2)" }} />
                <Tooltip contentStyle={{ background: "var(--color-bg-3)", border: "1px solid var(--color-border)", borderRadius: 8, color: "var(--color-text)" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score Variance Chart */}
        <div className="glass-card" style={{ marginBottom: "1rem" }}>
          <h4 style={{ marginBottom: "1.25rem", color: "var(--color-text-1)" }}>Score Variance Across Judges (per Team)</h4>
          {varianceRows.length === 0 ? (
            <div style={{ color: "var(--color-text-3)", fontSize: "0.85rem" }}>No team scores yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={varianceRows} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="name" tick={{ fill: "var(--color-text-2)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--color-text-3)", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "var(--color-bg-3)", border: "1px solid var(--color-border)", borderRadius: 8, color: "var(--color-text)" }} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-text-2)" }} />
                {judgeNames.map((j, i) => (
                  <Bar key={j} dataKey={j} name={j} fill={BAR_COLORS[i % BAR_COLORS.length]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

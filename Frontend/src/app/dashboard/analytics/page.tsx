"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from "recharts";
import { Download, Info, TrendingUp } from "lucide-react";

const ICC_DATA = [
  { criterion: "Technical Implementation", icc: 0.81, alpha: 0.79, agreement: "High" },
  { criterion: "Innovation & Creativity",  icc: 0.62, alpha: 0.59, agreement: "Moderate" },
  { criterion: "Presentation & Demo",       icc: 0.74, alpha: 0.71, agreement: "High" },
  { criterion: "Code Quality",             icc: 0.88, alpha: 0.85, agreement: "Very High" },
];

const VARIANCE_DATA = [
  { name: "CodeCraft",    J1: 88, J2: 85, J3: 91 },
  { name: "TechVision",  J1: 82, J2: 90, J3: 87 },
  { name: "InnovateSEAL",J1: 79, J2: 84, J3: 83 },
  { name: "AlphaCoders", J1: 75, J2: 80, J3: 78 },
  { name: "ByteBuilders", J1: 86, J2: 82, J3: 88 },
];

const RADAR_DATA = [
  { criterion: "Technical", internalAvg: 82, guestAvg: 78 },
  { criterion: "Innovation", internalAvg: 74, guestAvg: 79 },
  { criterion: "Presentation", internalAvg: 80, guestAvg: 81 },
  { criterion: "Code Quality", internalAvg: 85, guestAvg: 76 },
];

const AGREE_COLOR: Record<string, string> = {
  "Very High": "badge-success",
  "High":      "badge-primary",
  "Moderate":  "badge-warning",
  "Low":       "badge-danger",
};

export default function AnalyticsPage() {
  const avgICC = (ICC_DATA.reduce((s, d) => s + d.icc, 0) / ICC_DATA.length).toFixed(3);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Research & Analytics</h1>
          <p className="page-subtitle">Inter-Rater Reliability (ICC) Analysis · SEAL Spring 2026</p>
        </div>
        <button className="btn btn-secondary"><Download size={15} /> Export CSV</button>
      </div>

      {/* RQ Banner */}
      <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-lg)", padding: "1.25rem 1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
          <Info size={18} style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>Research Question</div>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-2)" }}>
              <strong style={{ color: "var(--color-text)" }}>RQ:</strong> How consistent are hackathon evaluation scores across different judges evaluating the same submission in academic software engineering competitions?
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid-4" style={{ marginBottom: "2rem" }}>
        {[
          { label: "Overall ICC",       val: avgICC,  color: "#10b981",  sub: "Intraclass Correlation" },
          { label: "Avg Krippendorff α", val: "0.74",  color: "#6366f1",  sub: "Alpha coefficient" },
          { label: "Judges Analyzed",   val: "8",      color: "#06b6d4",  sub: "Internal + Guest" },
          { label: "Submissions",       val: "22",     color: "#f59e0b",  sub: "Qualifying Round" },
        ].map(s => (
          <div key={s.label} className="glass-card">
            <div style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "var(--font-display)", color: s.color }}>{s.val}</div>
            <div style={{ fontWeight: 600, fontSize: "0.85rem", marginTop: "0.25rem" }}>{s.label}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)", marginTop: "0.15rem" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: "2rem" }}>
        {/* ICC by Criterion */}
        <div className="glass-card">
          <h4 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <TrendingUp size={16} style={{ color: "var(--color-primary)" }} /> ICC by Criterion
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            {ICC_DATA.map(d => (
              <div key={d.criterion}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.4rem" }}>
                  <span style={{ fontWeight: 500 }}>{d.criterion}</span>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span className={`badge ${AGREE_COLOR[d.agreement]}`}>{d.agreement}</span>
                    <strong>{d.icc}</strong>
                  </div>
                </div>
                <div className="progress">
                  <div className="progress-fill" style={{
                    width: `${d.icc * 100}%`,
                    background: d.icc >= 0.8 ? "linear-gradient(90deg,#10b981,#34d399)" : d.icc >= 0.65 ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : "linear-gradient(90deg,#f59e0b,#fbbf24)",
                  }} />
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--color-text-3)", marginTop: "0.25rem" }}>
                  Krippendorff α: {d.alpha}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Radar: Internal vs Guest */}
        <div className="glass-card">
          <h4 style={{ marginBottom: "1.25rem" }}>Judge Type Comparison</h4>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="rgba(148,163,184,0.1)" />
              <PolarAngleAxis dataKey="criterion" tick={{ fill: "var(--color-text-3)", fontSize: 11 }} />
              <PolarRadiusAxis domain={[60, 100]} tick={{ fill: "var(--color-text-3)", fontSize: 10 }} />
              <Radar name="Internal Judge" dataKey="internalAvg" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
              <Radar name="Guest Judge"    dataKey="guestAvg"    stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-text-2)" }} />
              <Tooltip contentStyle={{ background: "var(--color-bg-3)", border: "1px solid var(--color-border)", borderRadius: 8, color: "var(--color-text)" }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Score Variance Chart */}
      <div className="glass-card">
        <h4 style={{ marginBottom: "1.25rem" }}>Score Variance Across Judges (per Team)</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={VARIANCE_DATA} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
            <XAxis dataKey="name" tick={{ fill: "var(--color-text-2)", fontSize: 12 }} />
            <YAxis domain={[60, 100]} tick={{ fill: "var(--color-text-3)", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "var(--color-bg-3)", border: "1px solid var(--color-border)", borderRadius: 8, color: "var(--color-text)" }} />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-text-2)" }} />
            <Bar dataKey="J1" name="Judge 1" fill="#6366f1" radius={[4,4,0,0]} />
            <Bar dataKey="J2" name="Judge 2" fill="#8b5cf6" radius={[4,4,0,0]} />
            <Bar dataKey="J3" name="Judge 3" fill="#06b6d4" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Cloud, HardDrive, FileText, Image as ImageIcon, FileArchive, FileCode, FileQuestion, RefreshCw, ChevronRight } from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";

interface StorageCategory {
  name: string;
  size: number;
  percentage: number;
}

interface StorageStats {
  totalSize: number;
  totalCount: number;
  quotaBytes: number;
  usedPercentage: number;
  categories: StorageCategory[];
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Images": ImageIcon,
  "PDFs": FileText,
  "Archives": FileArchive,
  "Code & Text": FileCode,
  "Others": FileQuestion,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Images": "#10b981", // Emerald
  "PDFs": "#06b6d4", // Teal
  "Archives": "#f59e0b", // Amber
  "Code & Text": "#8b5cf6", // Purple
  "Others": "#64748b", // Slate
};

export default function StoragePage() {
  const { message } = App.useApp();
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<StorageStats>("/Documents/storage-stats");
      setStats(data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load storage stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStats();
  }, []);

  if (loading) {
    return (
      <div className="empty-state">
        <span className="spinner" />
        <div className="empty-title">Calculating storage usage</div>
      </div>
    );
  }

  const totalUsed = stats?.totalSize ?? 0;
  const totalQuota = stats?.quotaBytes ?? 250 * 1024 * 1024;
  const remaining = Math.max(0, totalQuota - totalUsed);
  const usedPercent = stats?.usedPercentage ?? 0;

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Cloud size={28} /> Cloud Storage
          </h1>
          <p className="page-subtitle">Real-time system storage usage and limits</p>
        </div>
        <button className="btn btn-secondary btn-icon" onClick={loadStats} disabled={loading} title="Refresh Statistics">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Main Quota Card */}
      <div className="glass-card" style={{ marginBottom: "2rem", padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <HardDrive size={20} style={{ color: "var(--color-primary)" }} />
          <h3 style={{ margin: 0, color: "var(--color-text-1)" }}>Storage Quota</h3>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem", marginBottom: "0.75rem" }}>
          <span style={{ color: "var(--color-text-2)" }}>
            <strong style={{ color: "var(--color-text-1)", fontSize: "1.1rem" }}>
              {formatSize(totalUsed)}
            </strong>{" "}
            of {formatSize(totalQuota)} used
          </span>
          <span style={{ fontWeight: 600, color: "var(--color-primary-2)" }}>
            {usedPercent.toFixed(1)}%
          </span>
        </div>

        {/* Multi-segment/standard progress bar */}
        <div className="progress" style={{ height: "10px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "5px", overflow: "hidden", marginBottom: "1.5rem" }}>
          {stats && stats.categories.length > 0 ? (
            <div style={{ display: "flex", width: "100%", height: "100%" }}>
              {stats.categories.map((cat) => {
                const color = CATEGORY_COLORS[cat.name] || "#6366f1";
                // Convert category percentage relative to the overall quota
                const quotaPercent = (cat.size / totalQuota) * 100;
                if (quotaPercent <= 0) return null;
                return (
                  <div
                    key={cat.name}
                    style={{
                      width: `${quotaPercent}%`,
                      backgroundColor: color,
                      height: "100%",
                    }}
                    title={`${cat.name}: ${formatSize(cat.size)} (${cat.percentage.toFixed(1)}%)`}
                  />
                );
              })}
            </div>
          ) : (
            <div className="progress-fill" style={{ width: `${Math.min(100, usedPercent)}%`, background: "var(--color-primary)" }} />
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid-3" style={{ gap: "1rem" }}>
          <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-2)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)", textTransform: "uppercase", fontWeight: 600 }}>Total Files</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-1)", marginTop: "0.25rem" }}>{stats?.totalCount ?? 0}</div>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-2)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)", textTransform: "uppercase", fontWeight: 600 }}>Available Quota</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-1)", marginTop: "0.25rem" }}>{formatSize(remaining)}</div>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-2)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)", textTransform: "uppercase", fontWeight: 600 }}>Limit Limit</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-1)", marginTop: "0.25rem" }}>10 MB / File</div>
          </div>
        </div>
      </div>

      {/* Categories breakdown & manage link */}
      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <h3 style={{ marginBottom: "1.25rem", color: "var(--color-text-1)" }}>Storage Breakdown</h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
          {stats?.categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.name] || FileQuestion;
            const color = CATEGORY_COLORS[cat.name] || "#6366f1";
            return (
              <div key={cat.name} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ background: `${color}15`, color: color, padding: "0.5rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center" }}>
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--color-text-2)" }}>{cat.name}</span>
                    <span style={{ color: "var(--color-text-3)" }}>
                      {formatSize(cat.size)} ({cat.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="progress" style={{ height: "6px", background: "rgba(255, 255, 255, 0.05)" }}>
                    <div className="progress-fill" style={{ width: `${cat.percentage}%`, backgroundColor: color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ borderTop: "1px solid var(--color-border-1)", paddingTop: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--color-text-3)" }}>
            Need to free up space? You can delete your uploaded files anytime.
          </span>
          <Link href="/dashboard/documents">
            <button className="btn btn-primary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
              Manage Documents <ChevronRight size={14} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

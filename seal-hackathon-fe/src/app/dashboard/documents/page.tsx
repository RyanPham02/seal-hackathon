"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { FileText, Download, Upload, Trash2 } from "lucide-react";
import { App } from "antd";
import { apiRequest, apiUpload, apiDownload } from "@/lib/api";

interface DocumentDto {
  documentId: string;
  fileName: string;
  contentType: string;
  size: number;
  uploaderName?: string | null;
  uploadedAt: string;
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
}

function formatDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DocumentsPage() {
  const { message } = App.useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<DocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadDocs = useCallback(async () => {
    try {
      const data = await apiRequest<DocumentDto[]>("/Documents");
      setDocs(data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load documents.");
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    // Defer the load out of the synchronous effect body (react-hooks/set-state-in-effect):
    // loadDocs only sets state after an awaited fetch, and the microtask hop keeps that
    // off the render-commit path without changing observable behavior.
    void Promise.resolve().then(loadDocs);
  }, [loadDocs]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        await apiUpload("/Documents", fd);
        message.success("File uploaded successfully!");
        await loadDocs();
      } catch (err) {
        message.error(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    }
    if (e.target) e.target.value = "";
  };

  const handleDownload = async (doc: DocumentDto) => {
    try {
      const blob = await apiDownload(`/Documents/${doc.documentId}/download`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Download failed.");
    }
  };

  const handleDelete = async (doc: DocumentDto) => {
    try {
      await apiRequest(`/Documents/${doc.documentId}`, { method: "DELETE" });
      message.success("Document deleted.");
      await loadDocs();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  return (
    <div style={{ maxWidth: 1100, height: "calc(100vh - 100px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div>
          <h1 className="page-title">Documents Library</h1>
          <p className="page-subtitle">Manage official hackathon resources</p>
        </div>
        <div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
          <button className="btn btn-primary" onClick={handleUploadClick} disabled={uploading}>
            {uploading ? <span className="spinner" /> : <><Upload size={15} style={{ marginRight: "0.5rem" }} /> Upload File</>}
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", padding: 0 }}>
        <h4 style={{ padding: "1.25rem 1.5rem", margin: 0, borderBottom: "1px solid var(--color-border-1)", color: "var(--color-text-1)", background: "rgba(255,255,255,0.02)" }}>All Files</h4>
        <div style={{ display: "flex", flexDirection: "column", overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-3)" }}>Loading documents…</div>
          ) : docs.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-3)" }}>No documents found. Upload one to get started.</div>
          ) : docs.map((d, i) => (
            <div key={d.documentId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", borderBottom: i === docs.length - 1 ? "none" : "1px solid var(--color-border-1)", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <FileText size={18} style={{ color: "var(--color-primary-2)" }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--color-text-1)" }}>{d.fileName}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)", marginTop: "0.25rem" }}>
                    {formatSize(d.size)} · Uploaded {formatDate(d.uploadedAt)}{d.uploaderName ? ` · ${d.uploaderName}` : ""}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-sm" onClick={() => handleDownload(d)} style={{ background: "rgba(99,102,241,0.1)", color: "var(--color-primary-2)", padding: "0.4rem 0.8rem", border: "1px solid rgba(99,102,241,0.2)" }}>
                  <Download size={14} style={{ marginRight: 4 }} /> Download
                </button>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDelete(d)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

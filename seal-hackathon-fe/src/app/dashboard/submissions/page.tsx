"use client";
import { useState } from "react";
import { Upload, Link as LinkIcon, GitBranch, Play, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { App } from "antd";

export default function SubmissionsPage() {
  const { message } = App.useApp();
  const [form, setForm] = useState({
    repoUrl: "", demoUrl: "", reportUrl: "", videoUrl: "", description: "", track: "", consent: false
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.repoUrl || !form.reportUrl || !form.track) {
      message.error("GitHub Repo, Report links, and Track selection are required!");
      return;
    }
    if (!form.consent) {
      message.error("You must agree to the Team Consent and Hackathon Rules.");
      return;
    }
    
    // Simulate submission
    message.loading({ content: "Submitting project...", key: "submit" });
    setTimeout(() => {
      message.success({ content: "Project submitted successfully!", key: "submit" });
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Project Submission</h1>
          <p className="page-subtitle">Submit your final project materials for judging</p>
        </div>
        {isSubmitted && <span className="badge badge-success"><CheckCircle size={14} style={{ marginRight: 4 }} /> Submitted</span>}
      </div>

      {!isSubmitted ? (
        <div className="glass-card">
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.5rem" }}>
            <AlertCircle size={20} style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: 2 }} />
            <div>
              <h4 style={{ margin: "0 0 0.25rem 0", color: "var(--color-primary)", fontSize: "0.95rem" }}>Submission Guidelines</h4>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-2)", lineHeight: 1.5 }}>
                Ensure your repository is public or accessible to judges. Your presentation report must clearly state the problem, your solution, and technical architecture. You can update these links until the deadline.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="form-group">
              <label className="form-label"><GitBranch size={14} /> GitHub Repository URL <span style={{ color: "#ef4444" }}>*</span></label>
              <input className="form-input" type="url" placeholder="https://github.com/your-username/project-repo" required value={form.repoUrl} onChange={e => setForm({...form, repoUrl: e.target.value})} />
            </div>
            
            <div className="form-group">
              <label className="form-label"><Play size={14} /> Live Demo URL</label>
              <input className="form-input" type="url" placeholder="https://your-project-demo.vercel.app" value={form.demoUrl} onChange={e => setForm({...form, demoUrl: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label"><FileText size={14} /> Presentation / Report URL <span style={{ color: "#ef4444" }}>*</span></label>
              <input className="form-input" type="url" placeholder="Google Slides, Canva, or PDF link" required value={form.reportUrl} onChange={e => setForm({...form, reportUrl: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label"><LinkIcon size={14} /> Demo Video URL</label>
              <input className="form-input" type="url" placeholder="YouTube or Loom link (max 3 minutes)" value={form.videoUrl} onChange={e => setForm({...form, videoUrl: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Brief Description / Note for Judges</label>
              <textarea className="form-textarea" rows={4} placeholder="Any specific instructions on how to run your project..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Select Competing Track <span style={{ color: "#ef4444" }}>*</span></label>
              <select className="form-input" style={{ cursor: "pointer" }} required value={form.track} onChange={e => setForm({...form, track: e.target.value})}>
                <option value="">-- Choose a Track --</option>
                <option value="ai">AI & Machine Learning</option>
                <option value="web3">Web3 & Blockchain</option>
                <option value="mobile">Mobile App Development</option>
                <option value="open">Open Innovation</option>
              </select>
            </div>

            <div className="form-group" style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginTop: "0.5rem" }}>
              <input 
                type="checkbox" 
                id="consent" 
                style={{ marginTop: "0.25rem", width: "16px", height: "16px", cursor: "pointer" }} 
                checked={form.consent}
                onChange={e => setForm({...form, consent: e.target.checked})}
              />
              <label htmlFor="consent" style={{ fontSize: "0.9rem", color: "var(--color-text-2)", cursor: "pointer", lineHeight: 1.5 }}>
                <strong>Team Consent & Rules:</strong> I confirm that all team members have contributed to this project and we agree to the Hackathon Code of Conduct and official rules.
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button type="submit" className="btn btn-primary" style={{ padding: "0.6rem 2rem" }}>
                <Upload size={16} /> Submit Project
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <CheckCircle size={64} style={{ color: "#10b981", margin: "0 auto 1.5rem" }} />
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>Submission Received!</h2>
          <p style={{ color: "var(--color-text-2)", marginBottom: "2rem" }}>Your project has been successfully submitted for judging. Good luck!</p>
          <button className="btn btn-secondary" onClick={() => setIsSubmitted(false)}>Update Submission</button>
        </div>
      )}
    </div>
  );
}

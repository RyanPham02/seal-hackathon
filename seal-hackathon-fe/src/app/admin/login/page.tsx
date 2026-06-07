"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { App } from "antd";
import { Key, Mail, Shield } from "lucide-react";
import { apiRequest, saveAuthSession } from "@/lib/api";

export default function AdminLogin() {
  const router = useRouter();
  const { message } = App.useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = await apiRequest<{
        user: { id: string; fullName: string; email: string; roles: string[] };
      }>("/Auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const user = saveAuthSession(payload, true);

      if (!user.roles.includes("Admin")) {
        message.error("Access denied. Admin privileges required.");
        router.push("/dashboard");
        return;
      }

      message.success("Admin login successful.");
      router.push("/admin");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Admin login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg)", position: "relative" }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: 440, zIndex: 1, padding: "2.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 64, height: 64, background: "rgba(244,63,94,0.1)", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", border: "1px solid rgba(244,63,94,0.2)" }}>
            <Shield size={32} style={{ color: "#f43f5e" }} />
          </div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.5rem" }}>Admin Portal</h1>
          <p style={{ color: "var(--color-text-2)", fontSize: "0.9rem" }}>Uses the seeded backend admin account.</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-3)" }} />
              <input className="form-input" type="email" style={{ paddingLeft: "2.5rem" }} required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <Key size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-3)" }} />
              <input className="form-input" type="password" style={{ paddingLeft: "2.5rem" }} required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          <button type="submit" className="btn btn-danger" style={{ width: "100%", justifyContent: "center", padding: "0.8rem", marginTop: "0.5rem" }} disabled={loading}>
            {loading ? <span className="spinner" /> : "Secure Login"}
          </button>

          <button type="button" className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => router.push("/auth/login")}>
            Return to User Login
          </button>
        </form>
      </div>
    </div>
  );
}

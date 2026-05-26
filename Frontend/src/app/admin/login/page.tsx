"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Key, Mail } from "lucide-react";
import { App } from "antd";

export default function AdminLogin() {
  const router = useRouter();
  const { message } = App.useApp();
  const [email, setEmail] = useState("admin@seal.edu.vn");
  const [password, setPassword] = useState("admin123");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === "admin@seal.edu.vn" && password === "admin123") {
      const adminUser = {
        id: "ADM-001",
        name: "System Administrator",
        email: email,
        role: "Admin"
      };
      localStorage.setItem("currentUser", JSON.stringify(adminUser));
      message.success("Đăng nhập thành công với tư cách là quản trị viên");
      router.push("/admin");
    } else {
      message.error("Mật khẩu không chính xác. Vui lòng thử lại!");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg)", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "40%", height: "40%", background: "var(--color-primary)", filter: "blur(120px)", opacity: 0.1, borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "40%", height: "40%", background: "var(--color-rose)", filter: "blur(120px)", opacity: 0.1, borderRadius: "50%" }} />
      </div>

      <div className="glass-card" style={{ width: "100%", maxWidth: 440, zIndex: 1, padding: "2.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 64, height: 64, background: "rgba(244,63,94,0.1)", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", border: "1px solid rgba(244,63,94,0.2)" }}>
            <Shield size={32} style={{ color: "#f43f5e" }} />
          </div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.5rem" }}>Admin Portal</h1>
          <p style={{ color: "var(--color-text-2)", fontSize: "0.9rem" }}>Authorized personnel only.</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-3)" }} />
              <input className="form-input" type="email" style={{ paddingLeft: "2.5rem" }} required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <Key size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-3)" }} />
              <input className="form-input" type="password" style={{ paddingLeft: "2.5rem" }} required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>

          <button type="submit" className="btn btn-danger" style={{ width: "100%", justifyContent: "center", padding: "0.8rem", marginTop: "0.5rem" }}>
            Secure Login
          </button>
          
          <button type="button" className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => router.push('/auth/login')}>
            Return to User Login
          </button>
        </form>
      </div>
    </div>
  );
}

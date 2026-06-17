"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { App } from "antd";
import { Key, Mail, Shield } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

export default function AdminLogin() {
  const router = useRouter();
  const { message } = App.useApp();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiRequest("/Auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, remember: true }),
      });

      // Re-source identity from /Auth/me — the login response is not the
      // source of truth for role gates.
      const user = await refresh();
      if (!user) {
        message.error("Signed in, but the server did not return a user.");
        return;
      }

      if (!user.roles.includes("Admin")) {
        message.error("Truy cập bị từ chối. Yêu cầu quyền Quản trị viên.");
        router.push("/dashboard");
        return;
      }

      message.success("Quản trị viên đăng nhập thành công.");
      router.push("/admin");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Đăng nhập quản trị viên thất bại.");
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
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.5rem" }}>Cổng Quản trị viên</h1>
          <p style={{ color: "var(--color-text-2)", fontSize: "0.9rem" }}>Sử dụng tài khoản quản trị viên được tạo sẵn từ backend.</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="form-group">
            <label className="form-label">Địa chỉ Email</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-3)" }} />
              <input className="form-input" type="email" style={{ paddingLeft: "2.5rem" }} required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <div style={{ position: "relative" }}>
              <Key size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-3)" }} />
              <input className="form-input" type="password" style={{ paddingLeft: "2.5rem" }} required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          <button type="submit" className="btn btn-danger" style={{ width: "100%", justifyContent: "center", padding: "0.8rem", marginTop: "0.5rem" }} disabled={loading}>
            {loading ? <span className="spinner" /> : "Đăng nhập Bảo mật"}
          </button>

          <button type="button" className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => router.push("/auth/login")}>
            Quay lại Đăng nhập Người dùng
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Trophy, Mail, Lock, ArrowRight, Code2 } from "lucide-react";
import Link from "next/link";
import styles from "../auth.module.css";

// Demo credentials (mock – no backend yet)
const DEMO_EMAIL    = "admin@seal.edu.vn";
const DEMO_PASSWORD = "seal2026";

export default function LoginPage() {
  const router                  = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [form, setForm]         = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Mock auth — accept any email + any password (or specific demo creds)
    setTimeout(() => {
      setLoading(false);
      // Accept any non-empty credentials → go to dashboard
      if (form.email && form.password) {
        router.push("/dashboard");
      } else {
        setError("Vui lòng nhập email và mật khẩu.");
      }
    }, 1000);
  };

  return (
    <div className={styles.authBg}>
      {/* Decorative orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoWrap}>
          <div className={styles.logoIcon}><Trophy size={24} /></div>
          <span className={styles.logoText}>SEAL</span>
        </div>

        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to your SEAL account</p>

        {/* Demo hint */}
        <div style={{
          background: "rgba(99,102,241,0.08)",
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: "var(--radius-md)",
          padding: "0.75rem 1rem",
          fontSize: "0.78rem",
          color: "var(--color-text-2)",
          marginBottom: "0.5rem",
          lineHeight: 1.7,
        }}>
          <strong style={{ color: "var(--color-primary-2)" }}>🎯 Demo:</strong> Nhập bất kỳ email + password nào để vào dashboard
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <div className={styles.inputWrap}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                id="email"
                type="email"
                className={`form-input ${styles.inputWithIcon}`}
                placeholder="you@fpt.edu.vn"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                id="password"
                type={showPass ? "text" : "password"}
                className={`form-input ${styles.inputWithIcon} ${styles.inputWithTrail}`}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className={styles.forgotRow}>
            <Link href="/auth/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
          </div>

          {error && (
            <div style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)", borderRadius: "var(--radius-md)", padding: "0.65rem 1rem", fontSize: "0.82rem", color: "#fb7185" }}>
              {error}
            </div>
          )}

          <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} disabled={loading}>
            {loading ? <span className="spinner" /> : <><ArrowRight size={18} /> Sign In</>}
          </button>

          <div className={styles.dividerRow}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>or continue with</span>
            <span className={styles.dividerLine} />
          </div>

          <button type="button" className={`btn btn-secondary btn-lg ${styles.oauthBtn}`}>
            <Code2 size={18} /> GitHub
          </button>
        </form>

        <p className={styles.switchRow}>
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className={styles.switchLink}>Create one →</Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { App } from "antd";
import { ArrowRight, Code2, Eye, EyeOff, Lock, Mail, Trophy } from "lucide-react";
import { apiRequest, saveAuthSession } from "@/lib/api";
import styles from "../auth.module.css";

/**
 * Returns a safe internal redirect target, or the role-based fallback when the
 * requested redirect is missing or unsafe (external URL, protocol-relative,
 * or otherwise malformed). This prevents open-redirect attacks via the
 * `?redirect=` query param.
 */
function getSafeRedirect(value: string | null, fallback: string): string {
  if (!value) return fallback;
  // Must be an internal absolute path: starts with a single "/".
  // Reject protocol-relative ("//host") and backslash ("/\\host") variants,
  // and anything containing a scheme (e.g. "https:", "javascript:").
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.includes(":")) return fallback;
  return value;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const { message } = App.useApp();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "", remember: false });

  useEffect(() => {
    const stored = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
    if (stored) {
      let fallback = "/dashboard";
      try {
        const user = JSON.parse(stored);
        fallback = user.roles?.includes("Admin") ? "/admin" : "/dashboard";
      } catch {
        fallback = "/dashboard";
      }
      router.push(getSafeRedirect(redirectUrl, fallback));
    }
  }, [router, redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = await apiRequest<{
        user: { id: string; fullName: string; email: string; roles: string[] };
      }>("/Auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const currentUser = saveAuthSession(payload, form.remember);
      message.success("Logged in successfully!");

      const fallback = currentUser.roles.includes("Admin") ? "/admin" : "/dashboard";
      router.push(getSafeRedirect(redirectUrl, fallback));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Khong the dang nhap. Vui long thu lai.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authBg}>
      <div className={styles.splitContainer}>
        <div className={styles.leftSide}>
          <div className={styles.orb1} />
          <div className={styles.orb2} />

          <div className={styles.card}>
            <div className={styles.logoWrap}>
              <div className={styles.logoIcon}>
                <Trophy size={24} />
              </div>
              <span className={styles.logoText}>SEAL</span>
            </div>

            <h1 className={styles.title}>Welcome back</h1>
            <p className={styles.subtitle}>Sign in with your SEAL backend account</p>

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
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--color-text-2)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.remember}
                    onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                    style={{ accentColor: "var(--color-primary)" }}
                  />
                  Remember me
                </label>
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
            </form>

            <p className={styles.switchRow}>
              Don&apos;t have an account? <Link href="/auth/register" className={styles.switchLink}>Create new account</Link>
            </p>
          </div>
        </div>

        <div className={styles.rightSide}>
          <div className={styles.rightOverlay} />
          <div className={styles.rightContent}>
            <div className={styles.sloganIcon}>
              <Code2 size={24} color="white" />
            </div>
            <h1 className={styles.sloganTitle}>SEAL Hackathon</h1>
            <p className={styles.sloganDesc}>
              Manage events, teams, submissions, judging, and rankings from one connected system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

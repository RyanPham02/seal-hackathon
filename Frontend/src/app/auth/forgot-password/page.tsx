"use client";
import { useState } from "react";
import { Trophy, Mail, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import styles from "../auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState("");
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 1500);
  };

  return (
    <div className={styles.authBg}>
      <div className={styles.orb1} /><div className={styles.orb2} /><div className={styles.orb3} />
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <div className={styles.logoIcon}><Trophy size={24} /></div>
          <span className={styles.logoText}>SEAL</span>
        </div>

        {sent ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", border: "1px solid rgba(16,185,129,0.3)" }}>
              <CheckCircle size={32} style={{ color: "#34d399" }} />
            </div>
            <h1 className={styles.title} style={{ fontSize: "1.3rem" }}>Check your email</h1>
            <p className={styles.subtitle} style={{ marginBottom: "1.5rem" }}>
              We sent a password reset link to <strong style={{ color: "var(--color-text)" }}>{email}</strong>
            </p>
            <Link href="/auth/login">
              <button className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }}>
                Back to Login
              </button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className={styles.title} style={{ fontSize: "1.3rem" }}>Forgot password?</h1>
            <p className={styles.subtitle}>Enter your email and we&apos;ll send you a reset link</p>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">Email</label>
                <div className={styles.inputWrap}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input id="forgot-email" type="email" className={`form-input ${styles.inputWithIcon}`}
                    placeholder="you@fpt.edu.vn" value={email}
                    onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>
              <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} disabled={loading}>
                {loading ? <span className="spinner" /> : <><ArrowRight size={18} /> Send Reset Link</>}
              </button>
            </form>
            <p className={styles.switchRow}>
              Remember it? <Link href="/auth/login" className={styles.switchLink}>Sign in →</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

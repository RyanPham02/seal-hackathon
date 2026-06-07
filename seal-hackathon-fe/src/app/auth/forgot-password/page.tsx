"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { App } from "antd";
import { ArrowLeft, ArrowRight, CheckCircle, KeyRound, Lock, Mail, Trophy } from "lucide-react";
import { apiRequest } from "@/lib/api";
import styles from "../auth.module.css";

type Step = "email" | "otp" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const requestOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);

    try {
      await apiRequest("/Auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      message.success("OTP sent to your email.");
      setStep("otp");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      message.error("Password confirmation does not match.");
      return;
    }

    setLoading(true);

    try {
      await apiRequest("/Auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, otp, newPassword }),
      });

      message.success("Password reset successfully.");
      setStep("done");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authBg} style={{ justifyContent: "center", alignItems: "center" }}>
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      <div className={styles.card}>
        <button 
          onClick={() => router.push("/auth/login")} 
          className="btn btn-ghost" 
          style={{ position: "absolute", top: "1.5rem", left: "1.5rem", padding: "0.5rem" }}
          aria-label="Back to login"
        >
          <ArrowLeft size={20} />
        </button>

        <div className={styles.logoWrap}>
          <div className={styles.logoIcon}>
            <Trophy size={24} />
          </div>
          <span className={styles.logoText}>SEAL</span>
        </div>

        {step !== "done" && (
          <div className={styles.stepIndicator}>
            <div className={`${styles.step} ${step === "email" ? styles.active : styles.done}`}>1</div>
            <div className={styles.stepLine} />
            <div className={`${styles.step} ${step === "otp" ? styles.active : ""}`}>2</div>
          </div>
        )}

        {step === "email" && (
          <>
            <h1 className={styles.title} style={{ fontSize: "1.3rem" }}>Forgot password?</h1>
            <p className={styles.subtitle}>Enter your email and we will send you a 6-digit OTP</p>

            <form onSubmit={requestOtp} className={styles.form}>
              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">Email</label>
                <div className={styles.inputWrap}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input
                    id="forgot-email"
                    type="email"
                    className={`form-input ${styles.inputWithIcon}`}
                    placeholder="you@fpt.edu.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} disabled={loading}>
                {loading ? <span className="spinner" /> : <><ArrowRight size={18} /> Send OTP</>}
              </button>
            </form>

            <p className={styles.switchRow}>
              Remember it? <Link href="/auth/login" className={styles.switchLink}>Sign in</Link>
            </p>
          </>
        )}

        {step === "otp" && (
          <>
            <h1 className={styles.title} style={{ fontSize: "1.3rem" }}>Enter OTP</h1>
            <p className={styles.subtitle}>
              We sent a 6-digit code to <strong style={{ color: "var(--color-text)" }}>{email}</strong>
            </p>

            <form onSubmit={resetPassword} className={styles.form}>
              <div className="form-group">
                <label className="form-label" htmlFor="otp">OTP Code</label>
                <div className={styles.inputWrap}>
                  <KeyRound size={16} className={styles.inputIcon} />
                  <input
                    id="otp"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    className={`form-input ${styles.inputWithIcon}`}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => {
                      e.target.setCustomValidity("");
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                    }}
                    onInvalid={(e) => {
                      const target = e.target as HTMLInputElement;
                      if (target.validity.valueMissing) {
                        target.setCustomValidity("Please enter the OTP code.");
                      } else if (target.validity.patternMismatch) {
                        target.setCustomValidity("Invalid OTP. Please enter the 6-digit code.");
                      }
                    }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-password">New Password</label>
                <div className={styles.inputWrap}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input
                    id="new-password"
                    type="password"
                    pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{6,}$"
                    className={`form-input ${styles.inputWithIcon}`}
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => {
                      e.target.setCustomValidity("");
                      setNewPassword(e.target.value);
                    }}
                    onInvalid={(e) => {
                      const target = e.target as HTMLInputElement;
                      if (target.validity.valueMissing) {
                        target.setCustomValidity("Please enter a new password.");
                      } else if (target.validity.patternMismatch) {
                        target.setCustomValidity("Password must be at least 6 characters and include uppercase, lowercase, number, and special character.");
                      }
                    }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
                <div className={styles.inputWrap}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input
                    id="confirm-password"
                    type="password"
                    className={`form-input ${styles.inputWithIcon}`}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => {
                      e.target.setCustomValidity("");
                      setConfirmPassword(e.target.value);
                    }}
                    onInvalid={(e) => {
                      const target = e.target as HTMLInputElement;
                      if (target.validity.valueMissing) {
                        target.setCustomValidity("Please confirm your password.");
                      }
                    }}
                    required
                  />
                </div>
              </div>

              <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} disabled={loading}>
                {loading ? <span className="spinner" /> : <><CheckCircle size={18} /> Reset Password</>}
              </button>

              <button type="button" className="btn btn-ghost" style={{ justifyContent: "center" }} onClick={() => requestOtp()} disabled={loading}>
                Resend OTP
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", border: "1px solid rgba(16,185,129,0.3)" }}>
              <CheckCircle size={32} style={{ color: "#34d399" }} />
            </div>
            <h1 className={styles.title} style={{ fontSize: "1.3rem" }}>Password updated</h1>
            <p className={styles.subtitle} style={{ marginBottom: "1.5rem" }}>
              You can now sign in with your new password.
            </p>
            <button className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }} onClick={() => router.push("/auth/login")}>
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

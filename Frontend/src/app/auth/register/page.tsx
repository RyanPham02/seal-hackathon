"use client";
import { useState } from "react";
import { Trophy, User, Mail, Lock, GraduationCap, Building2, ArrowRight, ChevronLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import styles from "../auth.module.css";

type StudentType = "fpt" | "external" | "";

export default function RegisterPage() {
  const [step, setStep]           = useState(1);
  const [studentType, setStudentType] = useState<StudentType>("");
  const [loading, setLoading]     = useState(false);
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", confirmPassword: "",
    studentId: "", university: "",
  });

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) setStep(step + 1);
    else {
      setLoading(true);
      setTimeout(() => setLoading(false), 1500);
    }
  };

  return (
    <div className={styles.authBg}>
      <div className={styles.orb1} /><div className={styles.orb2} /><div className={styles.orb3} />

      <div className={styles.card} style={{ maxWidth: 460 }}>
        <div className={styles.logoWrap}>
          <div className={styles.logoIcon}><Trophy size={24} /></div>
          <span className={styles.logoText}>SEAL</span>
        </div>

        {/* Step indicator */}
        <div className={styles.stepIndicator}>
          {[1,2,3].map(s => (
            <>
              <div key={`step-${s}`} className={`${styles.step} ${step === s ? styles.active : step > s ? styles.done : ""}`}>
                {step > s ? <CheckCircle size={14} /> : s}
              </div>
              {s < 3 && <span key={`line-${s}`} className={styles.stepLine} />}
            </>
          ))}
        </div>

        <h1 className={styles.title} style={{ fontSize: "1.3rem", marginBottom: "0.25rem" }}>
          {step === 1 ? "Create your account" : step === 2 ? "Student Information" : "Almost done!"}
        </h1>
        <p className={styles.subtitle}>
          {step === 1 ? "Join SEAL Hackathon Platform" : step === 2 ? "Tell us about your student status" : "Review and confirm"}
        </p>

        <form onSubmit={handleNext} className={styles.form}>
          {/* Step 1: Credentials */}
          {step === 1 && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="fullName">Full Name</label>
                <div className={styles.inputWrap}>
                  <User size={16} className={styles.inputIcon} />
                  <input id="fullName" type="text" className={`form-input ${styles.inputWithIcon}`}
                    placeholder="Nguyen Van A" value={form.fullName}
                    onChange={e => setForm({...form, fullName: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">Email</label>
                <div className={styles.inputWrap}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input id="reg-email" type="email" className={`form-input ${styles.inputWithIcon}`}
                    placeholder="you@fpt.edu.vn" value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-pass">Password</label>
                <div className={styles.inputWrap}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input id="reg-pass" type="password" className={`form-input ${styles.inputWithIcon}`}
                    placeholder="••••••••" value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="confirm-pass">Confirm Password</label>
                <div className={styles.inputWrap}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input id="confirm-pass" type="password" className={`form-input ${styles.inputWithIcon}`}
                    placeholder="••••••••" value={form.confirmPassword}
                    onChange={e => setForm({...form, confirmPassword: e.target.value})} required />
                </div>
              </div>
            </>
          )}

          {/* Step 2: Student type */}
          {step === 2 && (
            <>
              <div className="form-group">
                <label className="form-label">Student Type</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioOption}>
                    <input type="radio" name="type" value="fpt" checked={studentType === "fpt"}
                      onChange={() => setStudentType("fpt")} />
                    <GraduationCap size={20} style={{ color: "var(--color-primary)" }} />
                    <div>
                      <div className={styles.radioLabel}>FPT University Student</div>
                      <div className={styles.radioSub}>Provide your FPT student ID</div>
                    </div>
                  </label>
                  <label className={styles.radioOption}>
                    <input type="radio" name="type" value="external" checked={studentType === "external"}
                      onChange={() => setStudentType("external")} />
                    <Building2 size={20} style={{ color: "var(--color-violet)" }} />
                    <div>
                      <div className={styles.radioLabel}>External University Student</div>
                      <div className={styles.radioSub}>Provide your university name + student ID</div>
                    </div>
                  </label>
                </div>
              </div>

              {studentType !== "" && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="sid">Student ID</label>
                    <input id="sid" type="text" className="form-input"
                      placeholder={studentType === "fpt" ? "SE123456" : "Your student ID"}
                      value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value})} required />
                  </div>
                  {studentType === "external" && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="uni">University Name</label>
                      <input id="uni" type="text" className="form-input"
                        placeholder="e.g. University of Science, HCMUT"
                        value={form.university} onChange={e => setForm({...form, university: e.target.value})} required />
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { label: "Name",       value: form.fullName },
                { label: "Email",      value: form.email },
                { label: "Student ID", value: form.studentId },
                { label: "Type",       value: studentType === "fpt" ? "FPT University" : `External – ${form.university}` },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                  <span style={{ color: "var(--color-text-3)" }}>{row.label}</span>
                  <span style={{ fontWeight: 600 }}>{row.value || "—"}</span>
                </div>
              ))}
              <div className="divider" />
              <p style={{ fontSize: "0.78rem", color: "var(--color-text-3)", textAlign: "center" }}>
                Your account will require approval from the Event Coordinator before you can participate.
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
            {step > 1 && (
              <button type="button" className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => setStep(step - 1)}>
                <ChevronLeft size={16} /> Back
              </button>
            )}
            <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 2, justifyContent: "center" }} disabled={loading}>
              {loading ? <span className="spinner" /> : step < 3 ? <><ArrowRight size={16} /> Continue</> : <><CheckCircle size={16} /> Create Account</>}
            </button>
          </div>
        </form>

        <p className={styles.switchRow}>
          Already have an account? <Link href="/auth/login" className={styles.switchLink}>Sign in →</Link>
        </p>
      </div>
    </div>
  );
}

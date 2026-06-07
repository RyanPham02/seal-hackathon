"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { App } from "antd";
import { ArrowLeft, Building2, CheckCircle, Code2, GraduationCap, Lock, Mail, Trophy, User } from "lucide-react";
import { apiRequest } from "@/lib/api";
import styles from "../auth.module.css";
import vnUniversities from "../../../data/vietnam_universities.json";

type StudentType = "fpt" | "external" | "";

export default function RegisterPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [studentType, setStudentType] = useState<StudentType>("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    studentId: "",
    university: "",
    customUniversity: "",
  });

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentType) {
      message.error("Please select a student type.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      message.error("Password confirmation does not match.");
      return;
    }

    if (studentType === "external") {
      if (!form.university.trim()) {
        message.error("Please select or enter your university.");
        return;
      }
      if (form.university === "Other / International" && !form.customUniversity.trim()) {
        message.error("Please specify your university name.");
        return;
      }
    }

    setStep("confirm");
  };

  const handleConfirmAndRegister = async () => {
    setLoading(true);
    try {
      const isCustomUniversity = form.university === "Other / International";
      const enteredUni = isCustomUniversity ? form.customUniversity : form.university;
      const isFpt = enteredUni.toLowerCase().includes("fpt");
      
      const finalSchoolName = studentType === "fpt"
        ? "FPT University"
        : isFpt
          ? `Local - ${enteredUni}`
          : `External - ${enteredUni}`;

      await apiRequest("/Auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          studentType: studentType === "fpt" ? 0 : 1,
          studentCode: form.studentId,
          schoolName: finalSchoolName,
        }),
      });

      message.success("Account created successfully. Please login.");
      router.push("/auth/login");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not create account.");
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

          <div className={styles.card} style={{ maxWidth: 460 }}>
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

            {step === "form" ? (
              <>
                <h1 className={styles.title} style={{ fontSize: "1.3rem", marginBottom: "0.25rem" }}>Create your account</h1>
                <p className={styles.subtitle}>Register through the backend API</p>

                <form onSubmit={handleReview} className={styles.form}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="fullName">Full Name</label>
                    <div className={styles.inputWrap}>
                      <User size={16} className={styles.inputIcon} />
                      <input id="fullName" type="text" className={`form-input ${styles.inputWithIcon}`} placeholder="Nguyen Van A" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-email">Email</label>
                    <div className={styles.inputWrap}>
                      <Mail size={16} className={styles.inputIcon} />
                      <input id="reg-email" type="email" className={`form-input ${styles.inputWithIcon}`} placeholder="you@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-pass">Password</label>
                    <div className={styles.inputWrap}>
                      <Lock size={16} className={styles.inputIcon} />
                      <input id="reg-pass" type="password" className={`form-input ${styles.inputWithIcon}`} placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="confirm-pass">Confirm Password</label>
                    <div className={styles.inputWrap}>
                      <Lock size={16} className={styles.inputIcon} />
                      <input id="confirm-pass" type="password" className={`form-input ${styles.inputWithIcon}`} placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Student Type</label>
                    <div className={styles.radioGroup}>
                      <label className={styles.radioOption}>
                        <input type="radio" name="type" value="fpt" checked={studentType === "fpt"} onChange={() => setStudentType("fpt")} required />
                        <GraduationCap size={20} style={{ color: "var(--color-primary)" }} />
                        <div>
                          <div className={styles.radioLabel}>FPT University Student</div>
                          <div className={styles.radioSub}>Use your FPT student code</div>
                        </div>
                      </label>
                      <label className={styles.radioOption}>
                        <input type="radio" name="type" value="external" checked={studentType === "external"} onChange={() => setStudentType("external")} required />
                        <Building2 size={20} style={{ color: "var(--color-violet)" }} />
                        <div>
                          <div className={styles.radioLabel}>External Student</div>
                          <div className={styles.radioSub}>Provide your school name</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {studentType && (
                    <>
                      <div className="form-group">
                        <label className="form-label" htmlFor="sid">Student ID</label>
                        <input id="sid" type="text" className="form-input" placeholder={studentType === "fpt" ? "SE123456" : "Your student ID"} value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required />
                      </div>

                      {studentType === "external" && (
                        <>
                          <div className="form-group">
                            <label className="form-label" htmlFor="uni">University Name</label>
                            <input id="uni" type="text" className="form-input" list="vn-universities" placeholder="Type to search your university..." value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} required />
                            <datalist id="vn-universities">
                              {vnUniversities.map((uni: string, idx: number) => (
                                <option key={idx} value={uni} />
                              ))}
                              <option value="Other / International" />
                            </datalist>
                          </div>

                          {form.university === "Other / International" && (
                            <div className="form-group">
                              <label className="form-label" htmlFor="customUni">Specify your University</label>
                              <input id="customUni" type="text" className="form-input" placeholder="Enter your international university name..." value={form.customUniversity} onChange={(e) => setForm({ ...form, customUniversity: e.target.value })} required />
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}

                  <button type="submit" className="btn btn-primary btn-lg" style={{ justifyContent: "center" }} disabled={!studentType}>
                    Continue <CheckCircle size={16} />
                  </button>
                </form>

                <p className={styles.switchRow}>
                  Already have an account? <Link href="/auth/login" className={styles.switchLink}>Sign in</Link>
                </p>
              </>
            ) : (
              <>
                <h1 className={styles.title} style={{ fontSize: "1.3rem", marginBottom: "0.25rem" }}>Confirm your details</h1>
                <p className={styles.subtitle}>Please verify your information before registering.</p>

                <div style={{ background: "rgba(15,23,42,0.5)", border: "1px solid var(--color-border-2)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1.5rem", fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-3)" }}>Full Name</span>
                    <strong style={{ color: "var(--color-text)" }}>{form.fullName}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-3)" }}>Email</span>
                    <strong style={{ color: "var(--color-text)" }}>{form.email}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-3)" }}>Student Type</span>
                    <strong style={{ color: "var(--color-text)" }}>{studentType === "fpt" ? "FPT University" : "External"}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-3)" }}>Student ID</span>
                    <strong style={{ color: "var(--color-text)" }}>{form.studentId}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-3)" }}>University</span>
                    <strong style={{ color: "var(--color-text)", textAlign: "right", maxWidth: "60%" }}>
                      {studentType === "fpt" 
                        ? "FPT University" 
                        : (() => {
                            const uni = form.university === "Other / International" ? form.customUniversity : form.university;
                            return uni.toLowerCase().includes("fpt") ? `Local - ${uni}` : `External - ${uni}`;
                          })()
                      }
                    </strong>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "1rem" }}>
                  <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setStep("form")} disabled={loading}>
                    Back to Edit
                  </button>
                  <button type="button" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={handleConfirmAndRegister} disabled={loading}>
                    {loading ? <span className="spinner" /> : <><CheckCircle size={16} /> Confirm</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.rightSide}>
          <div className={styles.rightOverlay} />
          <div className={styles.rightContent}>
            <div className={styles.sloganIcon}>
              <Code2 size={24} color="white" />
            </div>
            <h1 className={styles.sloganTitle}>Join SEAL</h1>
            <p className={styles.sloganDesc}>Create an account, wait for admin approval, then start building with your team.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { Trophy, User, Mail, Lock, GraduationCap, Building2, ArrowRight, ChevronLeft, CheckCircle, Code2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { App } from "antd";
import styles from "../auth.module.css";
import vnUniversities from "../../../data/vietnam_universities.json";

type StudentType = "fpt" | "external" | "international" | "";

export default function RegisterPage() {
  const { message } = App.useApp();
  const [step, setStep]           = useState(1);
  const [studentType, setStudentType] = useState<StudentType>("");
  const [loading, setLoading]     = useState(false);
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", confirmPassword: "",
    studentId: "", university: "",
  });
  const router = useRouter();

  const getFinalType = () => {
    if (studentType === "fpt") return "Local (FPT University)";
    if (studentType === "international") return `International - ${form.university}`;
    if (studentType === "external") {
      if (form.university.toLowerCase().includes("fpt")) {
        return `Local - ${form.university}`;
      }
      return `External - ${form.university}`;
    }
    return "Unknown";
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) setStep(step + 1);
    else {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        
        // Save the new user to the mock database
        const usersRaw = localStorage.getItem("registeredUsers");
        const users = usersRaw ? JSON.parse(usersRaw) : [];
        const newUser = {
          name: form.fullName,
          email: form.email,
          password: form.password,
          role: "Member",
          university: getFinalType(),
          studentId: form.studentId,
        };
        users.push(newUser);
        localStorage.setItem("registeredUsers", JSON.stringify(users));

        message.success("Account created successfully!");
        router.push("/auth/login");
      }, 1500);
    }
  };

  return (
    <div className={styles.authBg}>
      <div className={styles.splitContainer}>
        
        {/* LEFT SIDE: FORM */}
        <div className={styles.leftSide}>
          <div className={styles.orb1} /><div className={styles.orb2} />

          <div className={styles.card} style={{ maxWidth: 460 }}>
            <div className={styles.logoWrap}>
              <div className={styles.logoIcon}><Trophy size={24} /></div>
              <span className={styles.logoText}>SEAL</span>
            </div>

            {/* Step indicator */}
            <div className={styles.stepIndicator}>
              {[1,2,3].map(s => (
                <div key={`step-wrap-${s}`} style={{ display: 'flex', alignItems: 'center' }}>
                  <div className={`${styles.step} ${step === s ? styles.active : step > s ? styles.done : ""}`}>
                    {step > s ? <CheckCircle size={14} /> : s}
                  </div>
                  {s < 3 && <span className={styles.stepLine} style={{ width: '40px', margin: '0 8px' }} />}
                </div>
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
                        placeholder="you@email.com" value={form.email}
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
                          <div className={styles.radioSub}>Provide your FPT student ID (@fpt.edu.vn)</div>
                        </div>
                      </label>
                      <label className={styles.radioOption}>
                        <input type="radio" name="type" value="external" checked={studentType === "external"}
                          onChange={() => setStudentType("external")} />
                        <Building2 size={20} style={{ color: "var(--color-violet)" }} />
                        <div>
                          <div className={styles.radioLabel}>External / Local University</div>
                          <div className={styles.radioSub}>Select from list of universities in Vietnam</div>
                        </div>
                      </label>
                      <label className={styles.radioOption}>
                        <input type="radio" name="type" value="international" checked={studentType === "international"}
                          onChange={() => setStudentType("international")} />
                        <Code2 size={20} style={{ color: "var(--color-cyan)" }} />
                        <div>
                          <div className={styles.radioLabel}>International / Others</div>
                          <div className={styles.radioSub}>Type your custom university name</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {studentType !== "" && (
                    <>
                      <div className="form-group" style={{ marginTop: '0.5rem' }}>
                        <label className="form-label" htmlFor="sid">Student ID</label>
                        <input id="sid" type="text" className="form-input"
                          placeholder={studentType === "fpt" ? "SE123456" : "Your student ID"}
                          value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value})} required />
                      </div>
                      
                      {studentType === "external" && (
                        <div className="form-group">
                          <label className="form-label" htmlFor="uni">University Name</label>
                          <input 
                            id="uni" 
                            type="text" 
                            className="form-input"
                            list="vn-universities"
                            placeholder="Type to search your university..."
                            value={form.university} 
                            onChange={e => setForm({...form, university: e.target.value})} 
                            required 
                          />
                          <datalist id="vn-universities">
                            {vnUniversities.map((uni: string, idx: number) => (
                              <option key={idx} value={uni} />
                            ))}
                          </datalist>
                        </div>
                      )}

                      {studentType === "international" && (
                        <div className="form-group">
                          <label className="form-label" htmlFor="uni-custom">Custom University Name</label>
                          <input 
                            id="uni-custom" 
                            type="text" 
                            className="form-input"
                            placeholder="Enter your university name..."
                            value={form.university} 
                            onChange={e => setForm({...form, university: e.target.value})} 
                            required 
                          />
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
                    { label: "Type",       value: getFinalType() },
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
                <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 2, justifyContent: "center" }} disabled={loading || (step === 2 && studentType === "")}>
                  {loading ? <span className="spinner" /> : step < 3 ? <><ArrowRight size={16} /> Continue</> : <><CheckCircle size={16} /> Create Account</>}
                </button>
              </div>
            </form>

            <p className={styles.switchRow}>
              Already have an account? <Link href="/auth/login" className={styles.switchLink}>Sign in →</Link>
            </p>
          </div>
        </div>

        {/* RIGHT SIDE: SLOGAN (From Vite Project) */}
        <div className={styles.rightSide}>
          <div className={styles.rightOverlay}></div>
          
          <div className={styles.rightContent}>
              <div className={styles.sloganIcon}>
                  <Code2 size={24} color="white" />
              </div>
              <h1 className={styles.sloganTitle}>
                  Kiến tạo tương lai<br/>bằng công nghệ.
              </h1>
              <p className={styles.sloganDesc}>
                  Hệ sinh thái kết nối sinh viên đam mê lập trình, giúp bạn tối ưu hóa thời gian nghiên cứu, quản lý dự án hiệu quả và hiện thực hóa ý tưởng đột phá của mình.
              </p>

              {/* Testimonial block */}
              <div className={styles.testimonialCard}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex' }}>
                          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" style={{width: 36, height: 36, borderRadius: '50%', border: '2px solid #3b82f6', background: '#e2e8f0'}} />
                          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" alt="avatar" style={{width: 36, height: 36, borderRadius: '50%', border: '2px solid #3b82f6', marginLeft: '-14px', background: '#e2e8f0'}} />
                          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="avatar" style={{width: 36, height: 36, borderRadius: '50%', border: '2px solid #3b82f6', marginLeft: '-14px', background: '#e2e8f0'}} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24', marginLeft: '16px', fontSize: '20px' }}>
                          ★ ★ ★ ★ ★
                      </div>
                  </div>
                  <p style={{ color: '#f8fafc', fontStyle: 'italic', fontSize: '16px', lineHeight: 1.6, margin: 0, fontWeight: 300 }}>
                      &quot;SEAL Hackathon đã thay đổi hoàn toàn cách nhóm mình triển khai dự án. Tốc độ kết nối đồng đội và theo dõi tiến độ thực sự đáng kinh ngạc!&quot;
                  </p>
                  <div style={{ marginTop: '16px' }}>
                      <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 500 }}>— Nhóm TechTitans, Quán quân Mùa 1</span>
                  </div>
              </div>
          </div>
        </div>

      </div>
    </div>
  );
}

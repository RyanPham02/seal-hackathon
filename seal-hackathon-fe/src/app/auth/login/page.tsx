"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Trophy, Mail, Lock, ArrowRight, Code2 } from "lucide-react";
import Link from "next/link";
import { App } from "antd";
import styles from "../auth.module.css";

export default function LoginPage() {
  const router                  = useRouter();
  const { message }             = App.useApp();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [error, setError]       = useState("");
  const [form, setForm]         = useState({ email: "", password: "", remember: false });

  // Initialize mock DB on mount
  useEffect(() => {
    if (!localStorage.getItem("registeredUsers")) {
      localStorage.setItem("registeredUsers", JSON.stringify([
        { email: "admin@seal.edu.vn", password: "admin123", name: "System Admin", role: "Admin" },
        { email: "user@seal.edu.vn", password: "user123", name: "Demo User", role: "Member" }
      ]));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      
      const usersRaw = localStorage.getItem("registeredUsers");
      const users = usersRaw ? JSON.parse(usersRaw) : [];
      
      const foundUser = users.find((u: any) => u.email === form.email);
      
      if (!foundUser) {
        setError("Tài khoản chưa được đăng ký. Vui lòng đăng ký trước!");
      } else if (foundUser.password !== form.password) {
        setError("Mật khẩu không chính xác. Vui lòng thử lại!");
      } else {
        localStorage.setItem("currentUser", JSON.stringify(foundUser));
        
        if (form.remember) {
          // Implement "Remember Me" logic mock by setting a persistent token
          localStorage.setItem("seal_token", "dummy-persistent-token");
        } else {
          sessionStorage.setItem("seal_token", "dummy-session-token");
        }

        // Add to savedAccounts for quick switcher
        const saved = localStorage.getItem("savedAccounts");
        let savedAccs = saved ? JSON.parse(saved) : [];
        if (!savedAccs.some((a:any) => a.email === foundUser.email)) {
          savedAccs.push({ name: foundUser.name, email: foundUser.email, role: foundUser.role });
          localStorage.setItem("savedAccounts", JSON.stringify(savedAccs));
        }

        if (foundUser.role === "Admin") {
          message.success("Đăng nhập thành công với tư cách là quản trị viên");
          router.push("/admin");
        } else {
          message.success("Đăng nhập thành công!");
          router.push("/dashboard");
        }
      }
    }, 1000);
  };

  const handleGithubLogin = () => {
    setGithubLoading(true);
    message.loading({ content: 'Đang kết nối với GitHub...', key: 'github' });
    setTimeout(() => {
      message.loading({ content: 'Đang xác thực tài khoản...', key: 'github' });
      setTimeout(() => {
        message.success({ content: 'Đăng nhập GitHub thành công!', key: 'github', duration: 2 });
        router.push('/dashboard');
      }, 1500);
    }, 1000);
  };

  return (
    <div className={styles.authBg}>
      <div className={styles.splitContainer}>
        
        {/* LEFT SIDE: FORM */}
        <div className={styles.leftSide}>
          <div className={styles.orb1} />
          <div className={styles.orb2} />

          <div className={styles.card}>
            {/* Logo */}
            <div className={styles.logoWrap}>
              <div className={styles.logoIcon}><Trophy size={24} /></div>
              <span className={styles.logoText}>SEAL</span>
            </div>

            <h1 className={styles.title}>Welcome back</h1>
            <p className={styles.subtitle}>Sign in to your SEAL account</p>

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

              <div className={styles.forgotRow} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--color-text-2)", cursor: "pointer" }}>
                  <input type="checkbox" checked={form.remember} onChange={(e) => setForm({...form, remember: e.target.checked})} style={{ accentColor: "var(--color-primary)" }} />
                  Duy trì đăng nhập
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); alert("Đã gửi liên kết khôi phục mật khẩu vào email của bạn!"); }} className={styles.forgotLink}>Quên mật khẩu?</a>
              </div>

              {error && (
                <div style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)", borderRadius: "var(--radius-md)", padding: "0.65rem 1rem", fontSize: "0.82rem", color: "#fb7185" }}>
                  {error}
                </div>
              )}

              <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} disabled={loading || githubLoading}>
                {loading ? <span className="spinner" /> : <><ArrowRight size={18} /> Sign In</>}
              </button>

              <div className={styles.dividerRow}>
                <span className={styles.dividerLine} />
                <span className={styles.dividerText}>or continue with</span>
                <span className={styles.dividerLine} />
              </div>

              <button type="button" onClick={handleGithubLogin} disabled={loading || githubLoading} className={`btn btn-secondary btn-lg ${styles.oauthBtn}`}>
                {githubLoading ? <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> : <Code2 size={18} />} GitHub
              </button>
            </form>

            <p className={styles.switchRow}>
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className={styles.switchLink}>Create new account →</Link>
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

import React, { useState } from "react";
import { Radio, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";
import { authService } from "../services/api";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("admin@traffitrace.ai");
  const [password, setPassword] = useState("Admin@123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await authService.login(email, password);
      if (onLoginSuccess) onLoginSuccess();
      window.location.href = "/";
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password. Check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0b1329 0%, #1e293b 100%)",
      padding: "20px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "440px",
        background: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
        overflow: "hidden"
      }}>
        {/* Header Header Banner */}
        <div style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)",
          padding: "32px 28px",
          color: "white",
          textAlign: "center"
        }}>
          <div style={{
            width: "56px",
            height: "56px",
            background: "linear-gradient(135deg, #2563eb, #06b6d4)",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px auto",
            boxShadow: "0 8px 16px rgba(6, 182, 212, 0.4)"
          }}>
            <Radio size={30} color="white" />
          </div>
          <h1 style={{ fontSize: "1.45rem", fontWeight: 800, letterSpacing: "-0.02em" }}>TraffiTrace AI</h1>
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "4px" }}>
            Smart City ANPR Tracking & Traffic Analytics
          </p>
          <div style={{
            display: "inline-block",
            background: "rgba(56, 189, 248, 0.15)",
            color: "#38bdf8",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            borderRadius: "20px",
            padding: "2px 10px",
            fontSize: "0.72rem",
            fontWeight: 600,
            marginTop: "10px"
          }}>
            Smart India Hackathon 2026 • PS 26127
          </div>
        </div>

        {/* Form Body */}
        <div style={{ padding: "32px 28px" }}>
          {error && (
            <div style={{
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              color: "#991b1b",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "0.85rem",
              marginBottom: "20px"
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Official Email Address
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Mail size={18} style={{ position: "absolute", left: "12px", color: "#94a3b8" }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@traffitrace.ai"
                  style={{
                    width: "100%",
                    padding: "11px 12px 11px 40px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    outline: "none",
                    fontFamily: "var(--font-sans)"
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Password
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Lock size={18} style={{ position: "absolute", left: "12px", color: "#94a3b8" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "11px 42px 11px 40px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    outline: "none",
                    fontFamily: "var(--font-sans)"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8"
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "12px",
                justifyContent: "center",
                fontSize: "0.95rem",
                marginTop: "6px",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.35)"
              }}
            >
              {isLoading ? "Authenticating Grid..." : "Sign In to Command Center"}
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Demo Quick-fill Helper */}
          <div style={{
            marginTop: "24px",
            padding: "12px",
            background: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            fontSize: "0.78rem",
            color: "#475569"
          }}>
            <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "4px", display: "flex", alignItems: "center", gap: "5px" }}>
              <ShieldCheck size={14} color="#2563eb" /> SIH Demo Credentials:
            </div>
            <div>Admin: <code>admin@traffitrace.ai</code> / <code>Admin@123</code></div>
            <div>Officer: <code>officer@traffitrace.ai</code> / <code>Officer@123</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}

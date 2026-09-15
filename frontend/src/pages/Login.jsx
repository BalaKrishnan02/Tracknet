import React, { useState, useEffect } from "react";
import { Radio, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Server, CheckCircle2, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { authService, getApiBaseUrl, setApiBaseUrl, healthService } from "../services/api";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("admin@traffitrace.ai");
  const [password, setPassword] = useState("Admin@123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Backend host configuration state
  const [showHostConfig, setShowHostConfig] = useState(false);
  const [backendUrl, setBackendUrl] = useState(getApiBaseUrl());
  const [healthStatus, setHealthStatus] = useState(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  useEffect(() => {
    // Auto check current backend health on mount
    checkBackendHealth(getApiBaseUrl());
  }, []);

  const checkBackendHealth = async (url) => {
    setIsCheckingHealth(true);
    try {
      const data = await healthService.check(url);
      setHealthStatus({ ok: true, data });
    } catch (err) {
      setHealthStatus({ ok: false, error: err.message || "Failed to connect" });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleSaveBackendUrl = () => {
    setApiBaseUrl(backendUrl);
    checkBackendHealth(backendUrl);
    setError("");
  };

  const handleInstantDemo = (role = "admin") => {
    authService.demoLogin(role);
    if (onLoginSuccess) onLoginSuccess();
    window.location.href = "/";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await authService.login(email, password);
      if (onLoginSuccess) onLoginSuccess();
      window.location.href = "/";
    } catch (err) {
      if (!err.response || err.code === "ERR_NETWORK") {
        setError(
          `Cannot reach backend server at "${getApiBaseUrl()}". Click 'Configure Backend Host' below to update your backend URL, or use 'Instant Demo Access' to explore.`
        );
      } else {
        setError(err.response?.data?.detail || "Invalid email or password. Check credentials.");
      }
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
        maxWidth: "460px",
        background: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
        overflow: "hidden"
      }}>
        {/* Header Header Banner */}
        <div style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)",
          padding: "28px 24px",
          color: "white",
          textAlign: "center"
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            background: "#ffffff",
            borderRadius: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 14px auto",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
            padding: "4px",
            border: "2px solid rgba(56, 189, 248, 0.4)",
            overflow: "hidden"
          }}>
            <img
              src="/logo.png"
              alt="TrackNet Logo"
              style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "14px" }}
            />
          </div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 800, letterSpacing: "-0.02em" }}>TrackNet</h1>
          <p style={{ fontSize: "0.85rem", color: "#38bdf8", marginTop: "4px", fontWeight: 600 }}>
            TRACK TODAY | TRANSFORM TOMORROW
          </p>
          <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "2px" }}>
            AI-Powered Vehicle Tracking for Smarter, Safer Cities
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
        <div style={{ padding: "28px 24px" }}>
          {error && (
            <div style={{
              background: "#fef2f2",
              borderLeft: "4px solid #ef4444",
              color: "#991b1b",
              padding: "10px 14px",
              borderRadius: "6px",
              fontSize: "0.82rem",
              marginBottom: "16px",
              lineHeight: 1.4
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Official Email
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
                    padding: "10px 12px 10px 40px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.88rem",
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
                    padding: "10px 40px 10px 40px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.88rem",
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
                padding: "11px",
                justifyContent: "center",
                fontSize: "0.92rem",
                marginTop: "4px",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.35)",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              {isLoading ? "Authenticating Grid..." : "Sign In to Command Center"}
              <ArrowRight size={17} />
            </button>

            {/* Instant Demo Access Button */}
            <button
              type="button"
              onClick={() => handleInstantDemo("admin")}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1.5px solid #2563eb",
                background: "#eff6ff",
                color: "#1d4ed8",
                fontWeight: 600,
                fontSize: "0.88rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                transition: "all 0.2s"
              }}
            >
              <Sparkles size={16} color="#2563eb" />
              Instant Demo Access (Explore Platform)
            </button>
          </form>

          {/* Backend Connection & Host Drawer */}
          <div style={{
            marginTop: "18px",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            overflow: "hidden"
          }}>
            <button
              type="button"
              onClick={() => setShowHostConfig(!showHostConfig)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#f8fafc",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#334155"
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Server size={14} color="#64748b" />
                Backend & Database Link
              </span>
              <span style={{
                fontSize: "0.7rem",
                padding: "2px 8px",
                borderRadius: "12px",
                fontWeight: 700,
                background: healthStatus?.ok ? "#dcfce7" : "#fee2e2",
                color: healthStatus?.ok ? "#15803d" : "#b91c1c"
              }}>
                {isCheckingHealth ? "Checking..." : healthStatus?.ok ? "Online" : "Disconnected"}
              </span>
            </button>

            {showHostConfig && (
              <div style={{ padding: "14px", background: "#ffffff", borderTop: "1px solid #e2e8f0", fontSize: "0.78rem" }}>
                <label style={{ display: "block", color: "#475569", fontWeight: 600, marginBottom: "4px" }}>
                  Backend API URL:
                </label>
                <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                  <input
                    type="text"
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    placeholder="https://tracknet-backend.onrender.com/api"
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.78rem",
                      fontFamily: "var(--font-mono)"
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveBackendUrl}
                    style={{
                      padding: "6px 12px",
                      background: "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => checkBackendHealth(backendUrl)}
                    title="Test Connection"
                    style={{
                      padding: "6px 10px",
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>

                {healthStatus?.ok ? (
                  <div style={{ color: "#166534", background: "#f0fdf4", padding: "6px 10px", borderRadius: "4px", fontSize: "0.72rem" }}>
                    ✓ Connected: {healthStatus.data?.app} v{healthStatus.data?.version} (Database: {healthStatus.data?.database} / {healthStatus.data?.database_type})
                  </div>
                ) : (
                  <div style={{ color: "#991b1b", background: "#fef2f2", padding: "6px 10px", borderRadius: "4px", fontSize: "0.72rem" }}>
                    ✗ Backend host unreachable at current URL. Set your cloud backend URL (e.g. Render/Railway) above.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Demo Quick-fill Helper */}
          <div style={{
            marginTop: "16px",
            padding: "10px 12px",
            background: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            fontSize: "0.76rem",
            color: "#475569"
          }}>
            <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "3px", display: "flex", alignItems: "center", gap: "5px" }}>
              <ShieldCheck size={13} color="#2563eb" /> Pre-Configured Credentials:
            </div>
            <div>Admin: <code>admin@traffitrace.ai</code> / <code>Admin@123</code></div>
            <div>Officer: <code>officer@traffitrace.ai</code> / <code>Officer@123</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}

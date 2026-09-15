import React from "react";
import { ShieldCheck, Lock, Database, Clock, EyeOff, UserCheck } from "lucide-react";

export default function Settings() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>System Settings & Privacy by Design</h2>
        <p style={{ fontSize: "0.82rem", color: "#64748b" }}>
          Compliance, data retention policies, role-based access control, and audit security
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Privacy by Design Card */}
        <div className="card">
          <div className="card-title">
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={18} color="#10b981" /> Privacy by Design & Safeguards
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "0.85rem", color: "#334155" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <EyeOff size={18} color="#2563eb" style={{ marginTop: "2px" }} />
              <div>
                <b>Analyst-Level License Plate Masking</b>
                <p style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  Traffic analysts only see aggregated statistics and masked plates (e.g. <code>TN31****89</code>).
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <Lock size={18} color="#2563eb" style={{ marginTop: "2px" }} />
              <div>
                <b>Restricted Watchlist & Trajectory Access</b>
                <p style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  Only authorized Admins and Traffic Officers can access detailed vehicle tracking and add watchlist targets.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <Clock size={18} color="#2563eb" style={{ marginTop: "2px" }} />
              <div>
                <b>Configurable Data Retention Period</b>
                <p style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  Historical telemetry and raw video crops automatically purged after 30 days.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* System & Architecture Info */}
        <div className="card">
          <div className="card-title">
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Database size={18} color="#2563eb" /> Deployment & Mode Configuration
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Hackathon Problem Statement:</span>
              <b>SIH 2026 – PS ID 26127</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Current Operating Mode:</span>
              <span className="badge badge-exact">DEMO_MODE=true (Active)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>AI Engine Mode:</span>
              <b>Modular Dual Mode (OCR Typo Tolerance)</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Database Engine:</span>
              <b>PostgreSQL / SQLite Zero-Config</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

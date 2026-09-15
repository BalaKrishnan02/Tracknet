import React from "react";

export default function CameraStatusCard({ label, value, subtext, color = "#2563eb", icon: Icon }) {
  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "10px",
      padding: "16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      display: "flex",
      alignItems: "center",
      gap: "14px"
    }}>
      <div style={{
        width: "44px",
        height: "44px",
        borderRadius: "10px",
        background: `${color}15`,
        color: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }}>
        {Icon && <Icon size={22} />}
      </div>
      <div>
        <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", fontFamily: "var(--font-sans)" }}>
          {value}
        </div>
        <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>{label}</div>
        {subtext && <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "2px" }}>{subtext}</div>}
      </div>
    </div>
  );
}

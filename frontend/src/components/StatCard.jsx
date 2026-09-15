import React from "react";

export default function StatCard({ label, value, icon: Icon, color = "#2563eb", subtitle }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ color: color, backgroundColor: `${color}15` }}>
        {Icon && <Icon size={22} />}
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {subtitle && <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "2px" }}>{subtitle}</div>}
      </div>
    </div>
  );
}

import React from "react";
import { Plus, Check, ShieldAlert, Route, ArrowRight, Gauge, Layers } from "lucide-react";

export default function CameraRecommendationCard({
  rec,
  onPropose,
  isProposing = false,
  isProposed = false
}) {
  const priorityColor =
    rec.priority === "CRITICAL" ? "#ef4444" :
    rec.priority === "HIGH" ? "#f97316" :
    rec.priority === "MEDIUM" ? "#eab308" : "#10b981";

  return (
    <div style={{
      background: "#ffffff",
      border: `1.5px solid ${priorityColor}40`,
      borderRadius: "10px",
      padding: "16px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
      display: "flex",
      flexDirection: "column",
      gap: "10px"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              background: `${priorityColor}15`,
              color: priorityColor,
              border: `1px solid ${priorityColor}40`,
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "0.72rem",
              fontWeight: 800
            }}>
              {rec.priority} PRIORITY
            </span>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
              Placement Score: <b style={{ color: "#0f172a", fontSize: "0.95rem" }}>{rec.placement_score}/100</b>
            </span>
          </div>
          <h4 style={{ fontSize: "0.98rem", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
            {rec.location_name}
          </h4>
        </div>

        <button
          onClick={() => onPropose(rec)}
          disabled={isProposing || isProposed}
          style={{
            background: isProposed ? "#10b981" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "8px 14px",
            fontSize: "0.78rem",
            fontWeight: 600,
            cursor: isProposed ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            whiteSpace: "nowrap"
          }}
        >
          {isProposed ? (
            <>
              <Check size={14} /> Proposed
            </>
          ) : (
            <>
              <Plus size={14} /> {isProposing ? "Saving..." : "Add as Proposed Camera"}
            </>
          )}
        </button>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "6px",
        background: "#f8fafc",
        padding: "8px",
        borderRadius: "6px",
        fontSize: "0.75rem",
        color: "#475569"
      }}>
        <div>Road: <b>{rec.road_type}</b></div>
        <div>Direction: <b>{rec.recommended_direction}</b></div>
        <div>Lanes: <b>{rec.lanes} lanes</b></div>
        <div>Traffic: <b>{rec.traffic_level}</b> ({(rec.estimated_daily_volume || 25000).toLocaleString()} veh/d)</div>
      </div>

      <div>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
          Recommendation Drivers & Placement Analysis:
        </div>
        <ul style={{ paddingLeft: "16px", fontSize: "0.74rem", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
          {rec.reasons.map((r, idx) => (
            <li key={idx}>{r}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

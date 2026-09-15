import React from "react";
import { MapPin, Clock, Gauge, ArrowDown } from "lucide-react";

export default function TrajectoryTimeline({ points = [] }) {
  if (!points || points.length === 0) {
    return <div style={{ padding: "20px", color: "#64748b", textAlign: "center" }}>No trajectory steps found</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "10px 0" }}>
      {points.map((pt, idx) => {
        const timeStr = new Date(pt.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        const isProbable = pt.match_type === "Probable Match";

        return (
          <React.Fragment key={idx}>
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
              padding: "14px",
              borderRadius: "10px",
              background: isProbable ? "#fffbeb" : "#ffffff",
              border: isProbable ? "1.5px dashed #f59e0b" : "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: isProbable ? "#f59e0b" : "#2563eb",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.85rem",
                flexShrink: 0
              }}>
                {pt.sequence_number || idx + 1}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
                      {pt.camera_code} - {pt.camera_name}
                    </div>
                    {(pt.city || pt.camera_location) && (
                      <div style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                        <MapPin size={12} /> {pt.city ? `${pt.city} • ` : ""}{pt.camera_location || "City Node"}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
                    <Clock size={14} />
                    {timeStr}
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginTop: "6px" }}>
                  <span className="plate-badge">{pt.raw_ocr_text || pt.plate_number}</span>
                  
                  <span className={`badge ${isProbable ? "badge-probable" : "badge-exact"}`}>
                    {pt.match_type || "Exact Match"} ({Math.round((pt.match_score || 1.0) * 100)}%)
                  </span>

                  <span style={{ fontSize: "0.78rem", color: "#475569" }}>
                    Type: <b>{pt.vehicle_type} ({pt.vehicle_color})</b>
                  </span>

                  <span style={{ fontSize: "0.78rem", color: "#475569", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Gauge size={13} /> {pt.estimated_speed} km/h
                  </span>
                </div>

                {isProbable && (
                  <div style={{ fontSize: "0.72rem", color: "#b45309", marginTop: "6px", background: "#fef3c7", padding: "4px 8px", borderRadius: "4px" }}>
                    ? AI Matcher: Fuzzy OCR match linked with target query (OCR Typo Tolerance).
                  </div>
                )}
              </div>
            </div>

            {idx < points.length - 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "-6px 0", color: "#94a3b8" }}>
                <ArrowDown size={18} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

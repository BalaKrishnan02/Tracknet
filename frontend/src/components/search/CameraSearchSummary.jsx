import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Camera } from "lucide-react";

export default function CameraSearchSummary({ summary = [], targetPlate = "" }) {
  if (!summary || summary.length === 0) return null;

  return (
    <div className="card" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Camera size={18} color="#2563eb" />
          <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>Multi-Camera Search Status Summary</span>
        </div>
        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
          Target: <b className="plate-badge" style={{ fontSize: "0.82rem", padding: "2px 8px" }}>{targetPlate}</b>
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
        {summary.map((cam) => {
          const isFound = cam.status === "FOUND";
          const isProbable = cam.status === "PROBABLE";
          const isNotFound = cam.status === "NOT FOUND";

          let bg = "#f1f5f9";
          let border = "#cbd5e1";
          let textColor = "#475569";
          let icon = <XCircle size={15} color="#94a3b8" />;

          if (isFound) {
            bg = "#ecfdf5";
            border = "#a7f3d0";
            textColor = "#065f46";
            icon = <CheckCircle2 size={15} color="#059669" />;
          } else if (isProbable) {
            bg = "#fffbeb";
            border = "#fde68a";
            textColor = "#92400e";
            icon = <AlertTriangle size={15} color="#d97706" />;
          }

          return (
            <div
              key={cam.camera_code}
              style={{
                background: bg,
                border: `1.5px solid ${border}`,
                borderRadius: "8px",
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "4px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "#0f172a", fontFamily: "var(--font-mono)" }}>
                  {cam.camera_code}
                </span>
                {icon}
              </div>
              <div style={{ fontSize: "0.74rem", fontWeight: 700, color: textColor }}>
                {cam.status}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

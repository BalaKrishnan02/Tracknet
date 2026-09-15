import React from "react";
import { Link } from "react-router-dom";
import { Clock, Camera, Eye, Car } from "lucide-react";

export default function PlateGallery({ detections = [], onSelectDetection }) {
  if (!detections || detections.length === 0) {
    return <div style={{ color: "#64748b", fontSize: "0.85rem", padding: "20px 0", textAlign: "center" }}>No plate detections recorded for this video.</div>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "14px" }}>
      {detections.map((det) => {
        const confPct = Math.round((det.ocr_confidence || 0.95) * 100);
        return (
          <div
            key={det.id}
            className="card"
            style={{
              padding: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              border: "1px solid #e2e8f0",
              transition: "transform 0.15s, box-shadow 0.15s"
            }}
          >
            {/* Visual Plate Crop Thumbnail */}
            <div
              style={{
                height: "64px",
                background: "#0f172a",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                border: "1.5px solid #334155"
              }}
            >
              {det.plate_image ? (
                <img
                  src={det.plate_image}
                  alt={det.plate_number}
                  style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
              ) : null}
              <span
                style={{
                  display: det.plate_image ? "none" : "block",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 800,
                  fontSize: "1rem",
                  color: "#f8fafc",
                  letterSpacing: "0.08em"
                }}
              >
                {det.raw_ocr_text || det.plate_number}
              </span>
            </div>

            {/* Plate Info Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="plate-badge" style={{ fontSize: "0.9rem", padding: "2px 8px" }}>
                {det.plate_number}
              </span>
              <span
                className="badge"
                style={{
                  background: confPct >= 90 ? "#ecfdf5" : "#fffbeb",
                  color: confPct >= 90 ? "#065f46" : "#92400e",
                  fontSize: "0.72rem"
                }}
              >
                {confPct}% OCR
              </span>
            </div>

            {/* Metadata Chips */}
            <div style={{ fontSize: "0.74rem", color: "#64748b", display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Car size={13} color="#2563eb" /> {det.vehicle_type} ({det.vehicle_color})
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Clock size={13} /> Time: <b style={{ fontFamily: "var(--font-mono)", color: "#0f172a" }}>{det.video_timestamp_seconds ? `${Math.floor(det.video_timestamp_seconds / 60)}:${Math.floor(det.video_timestamp_seconds % 60).toString().padStart(2, '0')}` : "00:00"}</b>
              </div>
            </div>

            {/* Action */}
            <Link
              to={`/detections/${det.id}`}
              className="btn-secondary"
              style={{
                marginTop: "4px",
                padding: "5px 8px",
                fontSize: "0.75rem",
                justifyContent: "center",
                textDecoration: "none"
              }}
            >
              <Eye size={13} /> View Detection
            </Link>
          </div>
        );
      })}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Video, ShieldCheck, Activity, MapPin, Gauge, Radio, ArrowLeft, ArrowUpRight } from "lucide-react";
import { networkService } from "../services/networkApi";

export default function CameraDetails() {
  const [searchParams] = useSearchParams();
  const codeParam = searchParams.get("code") || "CAM01";
  const [camera, setCamera] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    networkService.getCamerasMap({ limit: 500 }).then((cams) => {
      const found = cams.find((c) => c.camera_code === codeParam) || cams[0];
      setCamera(found);
      setLoading(false);
    });
  }, [codeParam]);

  if (loading || !camera) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading Camera Details...</div>;
  }

  const isOnline = camera.status === "Active" || camera.status === "Online";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Link to="/active-cameras" className="btn-secondary" style={{ padding: "6px 10px" }}>
          <ArrowLeft size={16} /> Back to Registry
        </Link>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>Camera Node Telemetry: {camera.camera_code}</h2>
          <p style={{ fontSize: "0.78rem", color: "#64748b" }}>{camera.name}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "20px" }}>
        {/* Stream Preview & Status */}
        <div className="card" style={{ display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
          <div style={{
            height: "320px",
            background: "#0b1329",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white"
          }}>
            <div style={{ textAlign: "center" }}>
              <Radio size={36} color="#38bdf8" style={{ margin: "0 auto 8px auto" }} />
              <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>ANPR Live Video Feed Stream</div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{camera.stream_url || "RTSP Stream Active"}</div>
              <div style={{ marginTop: "12px" }}>
                <span className={`badge ${isOnline ? "badge-online" : "badge-offline"}`}>
                  ? {camera.status} Stream
                </span>
              </div>
            </div>

            <div style={{
              position: "absolute",
              bottom: "12px",
              left: "14px",
              fontSize: "0.75rem",
              fontFamily: "var(--font-mono)",
              background: "rgba(0,0,0,0.7)",
              padding: "4px 8px",
              borderRadius: "4px"
            }}>
              FPS: 30.0 | Source: {camera.camera_source || "DEMO_VIDEO"}
            </div>
          </div>

          <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Stream Manager Health: Optimal</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Frame Extraction Queue: Active</div>
            </div>
            <Link to={`/search?plate=TN31AB4589`} className="btn-primary" style={{ fontSize: "0.8rem" }}>
              Search Vehicles <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {/* Technical Specs & Placement Metrics */}
        <div className="card">
          <div className="card-title">Technical Specifications & Location Meta</div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.82rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>State & City:</span>
              <b>{camera.city}, {camera.state}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Zone / Sector:</span>
              <b>{camera.zone || "Central Zone"}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Road Type:</span>
              <b>{camera.road_type}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Location Category:</span>
              <b>{camera.location_type}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>GPS Coordinates:</span>
              <b style={{ fontFamily: "var(--font-mono)" }}>{camera.latitude.toFixed(4)}, {camera.longitude.toFixed(4)}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Lanes Covered:</span>
              <b>{camera.lanes_covered} Lanes ({camera.direction})</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Daily Traffic Volume:</span>
              <b>{(camera.estimated_daily_volume || 25000).toLocaleString()} vehicles/day</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#64748b" }}>Placement Score:</span>
              <b style={{ color: "#2563eb" }}>{camera.placement_score} / 100 ({camera.placement_priority})</b>
            </div>
          </div>

          {camera.placement_reason && (
            <div style={{ marginTop: "14px", padding: "10px", background: "#f8fafc", borderRadius: "6px", fontSize: "0.75rem", color: "#475569" }}>
              <b>Placement Analysis:</b> {camera.placement_reason}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

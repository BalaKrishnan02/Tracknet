import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Clock, Route, ArrowLeft, ArrowDown, MapPin, Gauge, Video, CheckCircle2, AlertTriangle } from "lucide-react";
import { multiCameraSearchService } from "../services/api";

export default function VehicleTimeline() {
  const [searchParams] = useSearchParams();
  const plate = (searchParams.get("plate") || "TN31AB4589").toUpperCase();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await multiCameraSearchService.search({
          plate_number: plate,
          include_probable_matches: true
        });
        setData(res);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load vehicle timeline.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [plate]);

  if (loading) {
    return <div className="card" style={{ padding: "40px", textAlign: "center" }}>Reconstructing chronological vehicle timeline...</div>;
  }

  if (error || !data) {
    return (
      <div className="card" style={{ padding: "30px" }}>
        <div style={{ color: "#991b1b", marginBottom: "14px" }}>{error || "No timeline available."}</div>
        <Link to="/vehicle-search" className="btn-secondary">
          <ArrowLeft size={14} /> Back to Search
        </Link>
      </div>
    );
  }

  const waypoints = data.trajectory?.waypoints || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "860px", margin: "0 auto" }}>
      {/* Top Header Card */}
      <div className="card" style={{ background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)", border: "1px solid #bae6fd" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="plate-badge" style={{ fontSize: "1.25rem", padding: "4px 14px" }}>
                {data.target_plate}
              </span>
              <span className="badge badge-exact">Chronological Multi-Camera Timeline</span>
            </div>
            <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "6px" }}>
              Total Journey Window: <b>{data.first_seen} → {data.last_seen}</b> ({data.trajectory?.journey_duration_minutes} mins) • Total Distance: <b>{data.trajectory?.estimated_distance_km} km</b>
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <Link to={`/vehicle-search/results?plate=${plate}`} className="btn-secondary" style={{ textDecoration: "none" }}>
              <ArrowLeft size={14} /> Back to Results Table
            </Link>
            <Link to={`/vehicle-search/trajectory?plate=${plate}`} className="btn-primary" style={{ textDecoration: "none" }}>
              <Route size={14} /> View On GIS Map
            </Link>
          </div>
        </div>
      </div>

      {/* Step-by-Step Vertical Timeline */}
      <div className="card">
        <div className="card-title">
          <span>Sequential Multi-Camera Sighting Timeline</span>
          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Strictly sorted by absolute timestamp ASC</span>
        </div>

        {waypoints.length === 0 ? (
          <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
            No sightings recorded for this vehicle.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0px", position: "relative", padding: "10px 0" }}>
            {waypoints.map((pt, idx) => {
              const isProbable = pt.match_type === "PROBABLE MATCH";
              const isLast = idx === waypoints.length - 1;

              return (
                <div key={idx} style={{ display: "flex", gap: "18px", position: "relative" }}>
                  {/* Left Sequence Marker Column */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: isProbable ? "#d97706" : "#2563eb",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "0.9rem",
                        boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
                        zIndex: 2
                      }}
                    >
                      {idx + 1}
                    </div>

                    {!isLast && (
                      <div
                        style={{
                          width: "3px",
                          background: "#cbd5e1",
                          flex: 1,
                          minHeight: "45px",
                          margin: "4px 0",
                          borderRadius: "2px"
                        }}
                      />
                    )}
                  </div>

                  {/* Right Sighting Card */}
                  <div
                    style={{
                      flex: 1,
                      background: isProbable ? "#fffbeb" : "#ffffff",
                      border: isProbable ? "1.5px dashed #f59e0b" : "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "14px",
                      marginBottom: "16px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>
                            {pt.camera_code}
                          </span>
                          <span style={{ color: "#64748b", fontSize: "0.85rem", fontWeight: 600 }}>
                            {pt.camera_name || pt.location_name}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#2563eb", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px", fontWeight: 600 }}>
                          <MapPin size={13} /> {pt.location_name} ({pt.city})
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-mono)", fontSize: "0.92rem", fontWeight: 700, color: "#0f172a", background: "#f1f5f9", padding: "4px 10px", borderRadius: "6px" }}>
                        <Clock size={14} color="#2563eb" />
                        {pt.detection_time_str}
                      </div>
                    </div>

                    {/* OCR Sighting Tag */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                      <span className="plate-badge" style={{ fontSize: "0.85rem" }}>
                        {pt.raw_ocr_text || pt.plate_number}
                      </span>

                      <span className={`badge ${isProbable ? "badge-probable" : "badge-exact"}`}>
                        {pt.match_type} ({Math.round(pt.match_confidence || 100)}%)
                      </span>

                      <span style={{ fontSize: "0.78rem", color: "#475569" }}>
                        Type: <b>{pt.vehicle_type} ({pt.vehicle_color})</b>
                      </span>

                      <span style={{ fontSize: "0.78rem", color: "#475569", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Gauge size={13} /> {pt.estimated_speed} km/h
                      </span>

                      {pt.leg_distance_km > 0 && (
                        <span style={{ fontSize: "0.76rem", color: "#2563eb", fontWeight: 600 }}>
                          +{pt.leg_distance_km} km from previous camera
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

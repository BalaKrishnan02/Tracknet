import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Route, Search, MapPin, Clock, Gauge, ShieldAlert, ArrowLeft } from "lucide-react";
import MapView from "../components/MapView";
import TrajectoryTimeline from "../components/TrajectoryTimeline";
import { vehicleService } from "../services/api";

export default function TrajectoryMap() {
  const [searchParams, setSearchParams] = useSearchParams();
  const plateParam = searchParams.get("plate") || "TN31AB4589";
  const [plate, setPlate] = useState(plateParam);
  const [trajectory, setTrajectory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTrajectory = async (targetPlate) => {
    const p = targetPlate || plate;
    if (!p) return;
    setLoading(true);
    setError("");

    try {
      const data = await vehicleService.getTrajectory(p);
      setTrajectory(data);
      setSearchParams({ plate: p });
    } catch (err) {
      setError(err.response?.data?.detail || `No trajectory found for ${p}`);
      setTrajectory(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (plateParam) {
      fetchTrajectory(plateParam);
    }
  }, [plateParam]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "calc(100vh - 100px)" }}>
      {/* Top Search & Controller Bar */}
      <div className="card" style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Route size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>GIS Trajectory Reconstruction Engine</h2>
              <p style={{ fontSize: "0.75rem", color: "#64748b" }}>Multi-camera spatiotemporal tracking with OCR typo tolerance</p>
            </div>
          </div>

          {/* Quick Search */}
          <form onSubmit={(e) => { e.preventDefault(); fetchTrajectory(plate); }} style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="Registration Plate..."
              style={{
                padding: "7px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: "0.85rem",
                width: "160px"
              }}
            />
            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "7px 14px", fontSize: "0.82rem" }}>
              <Search size={14} /> Reconstruct
            </button>
          </form>
        </div>

        {/* Quick Multi-City Shortcuts */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", fontSize: "0.76rem", color: "#475569", flexWrap: "wrap", borderTop: "1px solid #f1f5f9", paddingTop: "10px" }}>
          <span style={{ fontWeight: 600 }}>Explore Different Cities:</span>
          {[
            { plate: "TN31AB4589", city: "Pondicherry" },
            { plate: "DL01C9876", city: "New Delhi" },
            { plate: "KA05MJ4421", city: "Bengaluru" },
            { plate: "MH12DE5544", city: "Mumbai" },
            { plate: "TN72BK9087", city: "Chennai" },
            { plate: "TS09CD1122", city: "Hyderabad" },
            { plate: "WB02EF4433", city: "Kolkata" }
          ].map((demo) => (
            <button
              key={demo.plate}
              type="button"
              onClick={() => { setPlate(demo.plate); fetchTrajectory(demo.plate); }}
              style={{
                background: plate === demo.plate ? "#eff6ff" : "#ffffff",
                border: plate === demo.plate ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                color: plate === demo.plate ? "#1d4ed8" : "#334155",
                borderRadius: "5px",
                padding: "2px 7px",
                fontFamily: "var(--font-mono)",
                fontSize: "0.74rem",
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <span>{demo.plate}</span>
              <span style={{ color: "#2563eb", fontWeight: 700 }}>({demo.city})</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "10px 16px", borderRadius: "8px", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {/* Main Split Layout: Leaflet GIS Map + Trajectory Details Sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "16px", flex: 1, minHeight: 0 }}>
        {/* Leaflet GIS Map */}
        <div className="card" style={{ padding: "0", display: "flex", flexDirection: "column", overflow: "hidden", height: "100%" }}>
          <MapView
            trajectoryPoints={trajectory?.points || []}
            height="100%"
          />
        </div>

        {/* Route Details and Sequential Waypoints */}
        <div className="card" style={{ display: "flex", flexDirection: "column", overflowY: "auto", height: "100%" }}>
          {trajectory ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Header Box */}
              <div style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="plate-badge" style={{ fontSize: "1.1rem" }}>{trajectory.plate_number}</span>
                  <span className={`badge ${trajectory.match_status === "Probable Match" ? "badge-probable" : "badge-exact"}`}>
                    {trajectory.match_status} ({Math.round(trajectory.overall_confidence * 100)}%)
                  </span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "6px" }}>
                  {trajectory.vehicle_type} ({trajectory.vehicle_color}) • {trajectory.total_detections} Camera Sightings • <b style={{ color: "#2563eb" }}>📍 {trajectory.city || trajectory.points?.[0]?.city || "Smart City Node"}</b>
                </div>
                {trajectory.is_watchlisted && (
                  <div style={{ background: "#fee2e2", color: "#991b1b", padding: "6px 10px", borderRadius: "6px", fontSize: "0.75rem", marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <ShieldAlert size={14} /> <b>Watchlist:</b> {trajectory.watchlist_reason}
                  </div>
                )}
              </div>

              {/* Spatiotemporal Summary */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "#f8fafc", padding: "10px", borderRadius: "8px", fontSize: "0.75rem" }}>
                <div>
                  <span style={{ color: "#64748b" }}>Distance:</span> <b>{trajectory.estimated_distance_km} km</b>
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>Duration:</span> <b>{trajectory.journey_duration_minutes} mins</b>
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>Avg Speed:</span> <b>{trajectory.estimated_avg_speed_kmh} km/h</b>
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>Waypoints:</span> <b>{trajectory.points.length} nodes</b>
                </div>
              </div>

              {/* Waypoint Chronology */}
              <div>
                <h4 style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px", color: "#334155" }}>
                  Sequential Trajectory Path
                </h4>
                <TrajectoryTimeline points={trajectory.points} />
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "#64748b", margin: "auto", padding: "20px" }}>
              <Route size={32} style={{ opacity: 0.4, margin: "0 auto 8px auto" }} />
              <div>Enter a vehicle registration number to reconstruct its trajectory.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

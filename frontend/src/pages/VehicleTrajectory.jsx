import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Route, Clock, ArrowLeft, Search, Gauge, ShieldAlert } from "lucide-react";
import MapView from "../components/MapView";
import TrajectoryTimeline from "../components/TrajectoryTimeline";
import { multiCameraSearchService } from "../services/api";

export default function VehicleTrajectory() {
  const [searchParams] = useSearchParams();
  const plateParam = (searchParams.get("plate") || "TN31AB4589").toUpperCase();
  const [plate, setPlate] = useState(plateParam);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadTrajectory = async (targetPlate) => {
    const p = targetPlate || plate;
    if (!p) return;
    setLoading(true);
    setError("");

    try {
      const res = await multiCameraSearchService.search({
        plate_number: p,
        include_probable_matches: true
      });
      setData(res);
    } catch (err) {
      setError(err.response?.data?.detail || `No trajectory found for ${p}`);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (plateParam) {
      loadTrajectory(plateParam);
    }
  }, [plateParam]);

  const trajectory = data?.trajectory;
  const waypoints = trajectory?.waypoints || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "calc(100vh - 90px)" }}>
      {/* Top Controller Bar */}
      <div className="card" style={{ padding: "12px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link to={`/vehicle-search/results?plate=${plate}`} className="btn-secondary" style={{ padding: "6px 12px", textDecoration: "none" }}>
              <ArrowLeft size={14} /> Back to Results
            </Link>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>Multi-Camera GIS Trajectory Map</h2>
              <p style={{ fontSize: "0.74rem", color: "#64748b" }}>Chronological route reconstruction connecting camera nodes</p>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); loadTrajectory(plate); }} style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="Registration Plate..."
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: "0.85rem",
                width: "160px"
              }}
            />
            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
              <Search size={14} /> Reconstruct
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "10px 16px", borderRadius: "8px", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {/* Split Map View + Trajectory Sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1.9fr 1fr", gap: "16px", flex: 1, minHeight: 0 }}>
        {/* Leaflet Map Card */}
        <div className="card" style={{ padding: "0", display: "flex", flexDirection: "column", overflow: "hidden", height: "100%" }}>
          <MapView
            trajectoryPoints={waypoints}
            height="100%"
          />
        </div>

        {/* Right Details Panel */}
        <div className="card" style={{ display: "flex", flexDirection: "column", overflowY: "auto", height: "100%" }}>
          {data ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Target Banner */}
              <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="plate-badge" style={{ fontSize: "1.15rem" }}>{data.target_plate}</span>
                  <span className="badge badge-exact">{data.total_matches} Sightings</span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "4px" }}>
                  Route: <b>{trajectory?.start_camera}</b> → <b>{trajectory?.end_camera}</b>
                </div>
              </div>

              {/* Section 23 Metric Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "#f8fafc", padding: "10px", borderRadius: "8px", fontSize: "0.75rem" }}>
                <div>First Seen: <b>{data.first_seen}</b></div>
                <div>Last Seen: <b>{data.last_seen}</b></div>
                <div>Total Journey: <b>{trajectory?.journey_duration_minutes} mins</b></div>
                <div>Est. Distance: <b>{trajectory?.estimated_distance_km} km</b></div>
                <div>Avg Speed: <b>{trajectory?.estimated_avg_speed_kmh} km/h</b></div>
                <div>Cameras: <b>{data.camera_count} nodes</b></div>
                <div>Exact Matches: <b style={{ color: "#059669" }}>{data.exact_matches}</b></div>
                <div>Probable Matches: <b style={{ color: "#d97706" }}>{data.probable_matches}</b></div>
              </div>

              {/* Waypoints Sequence */}
              <div>
                <h4 style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: "8px", color: "#334155" }}>
                  Numbered GIS Waypoints
                </h4>
                <TrajectoryTimeline points={waypoints} />
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "#64748b", margin: "auto", padding: "20px" }}>
              <Route size={32} style={{ opacity: 0.4, margin: "0 auto 8px auto" }} />
              <div>Enter a vehicle registration to reconstruct spatiotemporal route.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

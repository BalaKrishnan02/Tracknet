import React, { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Car, Calendar, Clock, Gauge, Route, AlertTriangle, ShieldCheck, ArrowRight } from "lucide-react";
import { vehicleService } from "../services/api";
import TrajectoryTimeline from "../components/TrajectoryTimeline";

export default function VehicleSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPlate = searchParams.get("plate") || "TN31AB4589";
  const [queryPlate, setQueryPlate] = useState(initialPlate);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (plateToSearch) => {
    const p = plateToSearch || queryPlate;
    if (!p) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await vehicleService.search(p);
      setResult(data);
      setSearchParams({ plate: p });
    } catch (err) {
      setError(err.response?.data?.detail || `No vehicle history or detections found for ${p}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Search Input Hero Card */}
      <div className="card" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)", border: "1px solid #bae6fd" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
          City-Wide ANPR Vehicle Search & Trajectory Reconstructor
        </h2>
        <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "16px" }}>
          Search any vehicle registration plate across all CCTV nodes to aggregate chronological sightings and spatiotemporal routes.
        </p>

        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} style={{ display: "flex", gap: "10px", maxWidth: "600px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={18} style={{ position: "absolute", left: "14px", top: "12px", color: "#94a3b8" }} />
            <input
              type="text"
              value={queryPlate}
              onChange={(e) => setQueryPlate(e.target.value.toUpperCase())}
              placeholder="e.g. TN31AB4589 or PY01AZ1234"
              style={{
                width: "100%",
                padding: "10px 14px 10px 42px",
                borderRadius: "8px",
                border: "1.5px solid #93c5fd",
                fontSize: "1rem",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                outline: "none",
                letterSpacing: "0.05em"
              }}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "0 24px" }}>
            {loading ? "Reconstructing..." : "Search Vehicle"}
          </button>
        </form>

        {/* Quick Demo Shortcuts */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "14px", fontSize: "0.78rem", color: "#475569", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600 }}>Multi-City Demo Targets:</span>
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
              onClick={() => { setQueryPlate(demo.plate); handleSearch(demo.plate); }}
              style={{
                background: "#ffffff",
                border: "1px solid #94a3b8",
                borderRadius: "6px",
                padding: "3px 8px",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <span>{demo.plate}</span>
              <span style={{ color: "#2563eb", fontWeight: 700, fontSize: "0.72rem" }}>({demo.city})</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "14px", borderRadius: "8px", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {/* Trajectory Reconstruction Output */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Summary KPI Banner */}
          <div className="card" style={{ borderLeft: "4px solid #2563eb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="plate-badge" style={{ fontSize: "1.2rem", padding: "4px 12px" }}>
                    {result.plate_number}
                  </span>
                  <span className={`badge ${result.match_status === "Probable Match" ? "badge-probable" : "badge-exact"}`} style={{ fontSize: "0.8rem" }}>
                    {result.match_status} ({Math.round(result.overall_confidence * 100)}%)
                  </span>
                  {result.is_watchlisted && (
                    <span className="badge badge-critical" style={{ fontSize: "0.8rem" }}>
                      <AlertTriangle size={13} /> {result.watchlist_reason || "Watchlisted Target"}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "6px" }}>
                  Vehicle: <b>{result.vehicle_type} ({result.vehicle_color})</b> | Sightings: <b>{result.total_detections} cameras</b> | Region: <b style={{ color: "#2563eb" }}>📍 {result.city || (result.points?.[0]?.city) || "Smart City Node"}</b>
                </div>
              </div>

              <Link to={`/trajectory?plate=${result.plate_number}`} className="btn-primary">
                <Route size={16} /> Open Full GIS Trajectory Map <ArrowRight size={15} />
              </Link>
            </div>

            {/* Metrics Breakdown Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", marginTop: "20px" }}>
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.72rem", color: "#64748b" }}>First Seen</div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#0f172a", fontFamily: "var(--font-mono)" }}>
                  {new Date(result.first_seen).toLocaleTimeString()}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{result.start_camera}</div>
              </div>

              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Last Seen</div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#0f172a", fontFamily: "var(--font-mono)" }}>
                  {new Date(result.last_seen).toLocaleTimeString()}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{result.end_camera}</div>
              </div>

              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Est. Total Distance</div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#0f172a" }}>
                  {result.estimated_distance_km} km
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Spatiotemporal Haversine</div>
              </div>

              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Journey Duration</div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#0f172a" }}>
                  {result.journey_duration_minutes} mins
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Total transit window</div>
              </div>

              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Average Speed</div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#0f172a" }}>
                  {result.estimated_avg_speed_kmh} km/h
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Kinematically feasible</div>
              </div>
            </div>
          </div>

          {/* Chronological Sightings Timeline */}
          <div className="card">
            <div className="card-title">
              <span>Chronological Detection Sightings Across City</span>
              <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{result.points.length} sightings recorded</span>
            </div>
            <TrajectoryTimeline points={result.points} />
          </div>
        </div>
      )}
    </div>
  );
}

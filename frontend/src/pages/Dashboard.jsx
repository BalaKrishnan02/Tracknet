import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Car,
  Video,
  AlertTriangle,
  Activity,
  TrendingUp,
  MapPin,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Search,
  Globe2,
  Sliders,
  Layers
} from "lucide-react";
import StatCard from "../components/StatCard";
import MapView from "../components/MapView";
import { dashboardService, cameraService } from "../services/api";
import { liveWs } from "../services/websocket";

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [liveTicker, setLiveTicker] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [sumRes, camRes] = await Promise.all([
        dashboardService.getSummary(),
        cameraService.getAll()
      ]);
      setSummary(sumRes);
      setCameras(camRes);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to live WebSocket feed
    const unsubscribe = liveWs.subscribe((data) => {
      if (data.type === "NEW_DETECTION" && data.detection) {
        setLiveTicker((prev) => [data.detection, ...prev.slice(0, 9)]);
        
        // Update summary counter
        setSummary((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            total_vehicles_today: prev.total_vehicles_today + 1,
            recent_detections: [data.detection, ...(prev.recent_detections || []).slice(0, 9)],
            total_alerts: data.alert ? prev.total_alerts + 1 : prev.total_alerts
          };
        });
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading AI Command Center Dashboard...</div>;
  }

  const detectionsToDisplay = liveTicker.length > 0 ? liveTicker : (summary?.recent_detections || []);

  const totalReg = summary?.total_registered_cameras || summary?.total_cameras || 165;
  const activeAnpr = summary?.active_anpr_cameras || summary?.active_cameras || 125;
  const statesCov = summary?.states_covered || 16;
  const citiesCov = summary?.cities_covered || 24;
  const offlineCams = summary?.offline_cameras || 8;
  const propCams = summary?.proposed_cameras || 23;
  const critCams = summary?.critical_traffic_cameras || 6;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* KPI Cards Grid with Enriched Active ANPR Camera stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        <StatCard
          label="Vehicles Detected Today"
          value={summary?.total_vehicles_today?.toLocaleString() || "548"}
          icon={Car}
          color="#2563eb"
          subtitle="Real-time multi-camera ANPR"
        />
        
        {/* REPLACED: Active ANPR Cameras with Enriched Metrics */}
        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => navigate("/active-cameras")}>
          <div className="stat-icon" style={{ color: "#10b981", backgroundColor: "#10b98115" }}>
            <Video size={22} />
          </div>
          <div>
            <div className="stat-value">{activeAnpr} / {totalReg}</div>
            <div className="stat-label">Active ANPR Cameras</div>
            <div style={{ fontSize: "0.72rem", color: "#10b981", fontWeight: 600, marginTop: "2px" }}>
              {statesCov} States • {citiesCov} Cities Covered
            </div>
            <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "1px" }}>
              Offline: {offlineCams} | Proposed: {propCams}
            </div>
          </div>
        </div>

        <StatCard
          label="Total Active Alerts"
          value={summary?.total_alerts || "3"}
          icon={AlertTriangle}
          color="#ef4444"
          subtitle={`${summary?.unread_alerts || 1} unreviewed watchlist hits`}
        />
        
        <StatCard
          label="Avg City Congestion"
          value={summary?.avg_traffic_level || "Medium"}
          icon={Activity}
          color="#f59e0b"
          subtitle={`${critCams} critical chokepoints`}
        />

        <StatCard
          label="Top Congested Area"
          value={summary?.most_congested_area || "Central Bus Terminus"}
          icon={MapPin}
          color="#8b5cf6"
          subtitle="Peak delay +4 mins"
        />
      </div>

      {/* Quick Navigation Action Strip */}
      <div style={{
        display: "flex",
        gap: "12px",
        background: "#ffffff",
        border: "1px solid var(--border-subtle)",
        borderRadius: "10px",
        padding: "12px 18px",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Globe2 size={20} color="#2563eb" />
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>
            India-Wide ANPR Camera Network & Strategic Planning Module Active
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/india-network" className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.78rem" }}>
            <Globe2 size={14} /> National Camera Map
          </Link>
          <Link to="/active-cameras" className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.78rem" }}>
            <Video size={14} /> Active ANPR Registry
          </Link>
          <Link to="/city-planning" className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.78rem" }}>
            <Sliders size={14} /> City Placement Engine
          </Link>
          <Link to="/coverage-analysis" className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.78rem" }}>
            <Layers size={14} /> Coverage Gaps
          </Link>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Live Real-Time Feed */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "20px" }}>
        {/* City GIS Map */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="card-title">
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <MapPin size={18} color="#2563eb" /> City Surveillance Camera Grid
            </span>
            <Link to="/india-network" style={{ fontSize: "0.75rem", color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
              View All India Map ?
            </Link>
          </div>
          <div style={{ height: "380px", borderRadius: "8px", overflow: "hidden" }}>
            <MapView cameras={cameras} zoom={13} height="100%" />
          </div>
          <div style={{ display: "flex", gap: "16px", marginTop: "12px", fontSize: "0.78rem", color: "#64748b" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#0f172a", border: "2px solid #38bdf8" }}></span>
              Online CCTV Nodes ({cameras.length})
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }}></span>
              Warning (0)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#94a3b8" }}></span>
              Offline (0)
            </span>
          </div>
        </div>

        {/* Live Detections Feed Ticker */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="card-title">
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={18} color="#10b981" /> Real-Time ANPR Stream
            </span>
            <span className="status-dot-pulse"></span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", maxHeight: "380px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {detectionsToDisplay.map((det, idx) => (
              <div
                key={det.id || idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: det.is_watchlisted ? "#fef2f2" : "#f8fafc",
                  border: det.is_watchlisted ? "1px solid #fecaca" : "1px solid #e2e8f0",
                  transition: "all 0.2s"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="plate-badge">{det.plate_number}</span>
                    {det.is_watchlisted && (
                      <span className="badge badge-critical" style={{ fontSize: "0.68rem" }}>
                        <ShieldAlert size={12} /> Watchlist
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                    {det.camera_code} • {det.camera_location || det.camera_name}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#334155" }}>
                    {det.vehicle_type} ({det.vehicle_color})
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
                    {det.timestamp ? new Date(det.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Just now"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Detections Full Table */}
      <div className="card">
        <div className="card-title">
          <span>Recent ANPR Detections Log</span>
          <Link to="/search" className="btn-secondary" style={{ fontSize: "0.78rem" }}>
            <Search size={14} /> Search Vehicle Trajectory
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Plate Number</th>
                <th>Raw OCR</th>
                <th>Confidence</th>
                <th>Vehicle Type</th>
                <th>Camera Node</th>
                <th>Location</th>
                <th>Speed</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(summary?.recent_detections || []).map((d) => (
                <tr key={d.id}>
                  <td>
                    <span className="plate-badge">{d.plate_number}</span>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "#475569" }}>
                    {d.raw_ocr_text || d.plate_number}
                  </td>
                  <td>
                    <span className="badge badge-exact">{Math.round((d.ocr_confidence || 0.95) * 100)}%</span>
                  </td>
                  <td>
                    {d.vehicle_type} <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>({d.vehicle_color})</span>
                  </td>
                  <td><b>{d.camera_code}</b></td>
                  <td>{d.camera_location}</td>
                  <td>{d.estimated_speed} km/h</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                    {new Date(d.timestamp).toLocaleTimeString()}
                  </td>
                  <td>
                    <Link
                      to={`/trajectory?plate=${d.plate_number}`}
                      className="btn-secondary"
                      style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                    >
                      Track Route <ArrowUpRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

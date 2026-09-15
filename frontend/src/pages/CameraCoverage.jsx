import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layers, ShieldCheck, ArrowUpRight, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { networkService } from "../services/networkApi";

export default function CameraCoverage() {
  const [rankings, setRankings] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([networkService.getCityRankings(), networkService.getCoverageGaps()])
      .then(([rkRes, gpRes]) => {
        setRankings(rkRes);
        setGaps(gpRes);
      })
      .catch((err) => console.error("Error loading coverage:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Calculating Coverage Metrics...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>City Camera Coverage Analysis & Surveillance Blindspots</h2>
        <p style={{ fontSize: "0.82rem", color: "#64748b" }}>
          Benchmarking municipal ANPR coverage scores, blindspots on priority corridors, and network readiness
        </p>
      </div>

      {/* City Traffic Network Ranking */}
      <div className="card">
        <div className="card-title">
          <span>City Traffic Network Ranking (DEMO / SIMULATED DATA)</span>
          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{rankings.length} Cities Evaluated</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>City</th>
                <th>State</th>
                <th>Active / Total Cams</th>
                <th>Daily Traffic Volume</th>
                <th>Congestion Density</th>
                <th>Coverage Score</th>
                <th>Network Priority</th>
                <th>Planning Action</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r) => (
                <tr key={r.rank}>
                  <td>
                    <span style={{
                      fontWeight: 800,
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: r.rank <= 3 ? "#eff6ff" : "#f8fafc",
                      color: r.rank <= 3 ? "#2563eb" : "#64748b",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.8rem"
                    }}>
                      {r.rank}
                    </span>
                  </td>
                  <td><b>{r.city}</b></td>
                  <td>{r.state}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: "#10b981" }}>{r.active_cameras}</span>
                    <span style={{ color: "#94a3b8" }}> / {r.total_cameras}</span>
                  </td>
                  <td>{r.traffic_volume.toLocaleString()} veh/day</td>
                  <td>
                    <span className={`badge ${
                      r.congestion_level === "Critical" ? "badge-critical" :
                      r.congestion_level === "High" ? "badge-high" : "badge-medium"
                    }`}>
                      {r.congestion_level}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ flex: 1, height: "6px", width: "60px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${r.coverage_score}%`,
                          background: r.coverage_score >= 75 ? "#10b981" : (r.coverage_score >= 50 ? "#f59e0b" : "#ef4444")
                        }} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: "0.8rem" }}>{r.coverage_score}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${r.priority === "High Priority" ? "badge-review" : "badge-online"}`}>
                      {r.priority}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/city-planning?city=${r.city}&state=${r.state}`}
                      className="btn-secondary"
                      style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                    >
                      Analyze City <ArrowUpRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Identified Coverage Blindspots Table */}
      <div className="card">
        <div className="card-title">
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={18} color="#ef4444" /> Strategic Coverage Blindspots (Proposed ANPR Priority Nodes)
          </span>
          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{gaps.length} Chokepoint Blindspots</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Location / Landmark</th>
                <th>City & State</th>
                <th>Road Category</th>
                <th>Placement Score</th>
                <th>Priority</th>
                <th>Analysis Reason</th>
              </tr>
            </thead>
            <tbody>
              {gaps.slice(0, 10).map((g, idx) => (
                <tr key={idx}>
                  <td><span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>{g.camera_code}</span></td>
                  <td><b>{g.location}</b></td>
                  <td>{g.city}, {g.state}</td>
                  <td>{g.road_type}</td>
                  <td><b>{g.placement_score}/100</b></td>
                  <td>
                    <span className="badge badge-high">{g.placement_priority}</span>
                  </td>
                  <td style={{ fontSize: "0.75rem", color: "#64748b" }}>{g.reasons}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

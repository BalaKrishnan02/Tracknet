import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ShieldCheck, Check, Trash2, ArrowUpRight, Filter } from "lucide-react";
import { alertService } from "../services/api";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState("");

  const loadAlerts = async () => {
    try {
      const data = await alertService.getAll(null, filterPriority || null);
      setAlerts(data);
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [filterPriority]);

  const handleReview = async (id) => {
    try {
      await alertService.markReviewed(id);
      loadAlerts();
    } catch (err) {
      console.error("Error updating alert:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await alertService.delete(id);
      loadAlerts();
    } catch (err) {
      console.error("Error deleting alert:", err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Active Vehicle & Security Alerts</h2>
          <p style={{ fontSize: "0.82rem", color: "#64748b" }}>
            Real-time notifications triggered by watchlist hits, route anomalies, and traffic violations
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Filter size={16} color="#64748b" />
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>No alerts found for this filter.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Target Plate</th>
                  <th>Alert Type</th>
                  <th>Details & Message</th>
                  <th>Camera Node</th>
                  <th>Detection Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id} style={{ background: a.status === "Unreviewed" ? "#fffdf5" : "inherit" }}>
                    <td>
                      <span className={`badge ${a.priority === "Critical" ? "badge-critical" : (a.priority === "High" ? "badge-high" : "badge-medium")}`}>
                        {a.priority}
                      </span>
                    </td>
                    <td>
                      <span className="plate-badge">{a.plate_number}</span>
                    </td>
                    <td><b>{a.alert_type}</b></td>
                    <td style={{ maxWidth: "260px" }}>{a.message}</td>
                    <td>{a.camera_name}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>
                      {new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </td>
                    <td>
                      <span className={`badge ${a.status === "Reviewed" ? "badge-exact" : "badge-review"}`}>
                        {a.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <Link
                          to={`/trajectory?plate=${a.plate_number}`}
                          className="btn-secondary"
                          style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                          title="View Trajectory"
                        >
                          <ArrowUpRight size={13} /> Track
                        </Link>
                        {a.status === "Unreviewed" && (
                          <button
                            onClick={() => handleReview(a.id)}
                            className="btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "0.72rem", color: "#16a34a" }}
                            title="Mark Reviewed"
                          >
                            <Check size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="btn-secondary"
                          style={{ padding: "4px 8px", fontSize: "0.72rem", color: "#dc2626" }}
                          title="Dismiss"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

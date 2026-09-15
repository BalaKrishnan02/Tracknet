import React, { useState, useEffect } from "react";
import { Eye, Plus, Trash2, ShieldAlert, Check } from "lucide-react";
import { watchlistService } from "../services/api";

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plateNumber, setPlateNumber] = useState("");
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState("High");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadWatchlist = async () => {
    try {
      const data = await watchlistService.getAll();
      setWatchlist(data);
    } catch (err) {
      console.error("Failed to load watchlist:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!plateNumber || !reason) {
      setError("Please fill in plate number and reason.");
      return;
    }

    try {
      await watchlistService.add({
        plate_number: plateNumber.toUpperCase().trim(),
        reason: reason.trim(),
        priority: priority,
        status: "Active"
      });
      setSuccess(`Vehicle ${plateNumber.toUpperCase()} added to active watchlist.`);
      setPlateNumber("");
      setReason("");
      loadWatchlist();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add vehicle to watchlist.");
    }
  };

  const handleRemove = async (id) => {
    try {
      await watchlistService.remove(id);
      loadWatchlist();
    } catch (err) {
      console.error("Error removing watchlist entry:", err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Authorized Demo Watchlist Module</h2>
        <p style={{ fontSize: "0.82rem", color: "#64748b" }}>
          Manage flagged vehicles for automatic real-time alert triggering upon ANPR camera detection
        </p>
      </div>

      {/* Add Entry Card */}
      <div className="card">
        <div className="card-title">
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Plus size={18} color="#2563eb" /> Register Watchlist Target
          </span>
        </div>

        {error && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "8px 12px", borderRadius: "6px", fontSize: "0.82rem", marginBottom: "12px" }}>{error}</div>}
        {success && <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "8px 12px", borderRadius: "6px", fontSize: "0.82rem", marginBottom: "12px" }}>{success}</div>}

        <form onSubmit={handleAdd} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr auto", gap: "12px", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
              Plate Number
            </label>
            <input
              type="text"
              required
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
              placeholder="e.g. TN31AB4589"
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontFamily: "var(--font-mono)",
                fontWeight: 700
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
              Reason / Category
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Demo Security Watchlist / Inter-District Alert"
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
              Priority Level
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem"
              }}
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" style={{ padding: "9px 18px" }}>
            <Plus size={15} /> Add to Watchlist
          </button>
        </form>
      </div>

      {/* Active Watchlist Table */}
      <div className="card">
        <div className="card-title">
          <span>Active Watchlist Entries</span>
          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{watchlist.length} active registered vehicles</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Registration Plate</th>
                <th>Reason / Case File</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Added By</th>
                <th>Registered On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((w) => (
                <tr key={w.id}>
                  <td>
                    <span className="plate-badge">{w.plate_number}</span>
                  </td>
                  <td>{w.reason}</td>
                  <td>
                    <span className={`badge ${w.priority === "Critical" ? "badge-critical" : (w.priority === "High" ? "badge-high" : "badge-medium")}`}>
                      {w.priority}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-online">{w.status}</span>
                  </td>
                  <td>{w.added_by}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>
                    {new Date(w.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      onClick={() => handleRemove(w.id)}
                      className="btn-secondary"
                      style={{ padding: "4px 8px", fontSize: "0.72rem", color: "#dc2626" }}
                      title="Remove from Watchlist"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
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

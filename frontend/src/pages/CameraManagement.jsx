import React, { useState, useEffect } from "react";
import { Sliders, Plus, Edit2, Trash2, MapPin, CheckCircle } from "lucide-react";
import { cameraService } from "../services/api";

export default function CameraManagement() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cameraCode, setCameraCode] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("11.9500");
  const [longitude, setLongitude] = useState("79.8200");
  const [status, setStatus] = useState("Online");
  const [message, setMessage] = useState("");

  const loadCameras = async () => {
    try {
      const data = await cameraService.getAll();
      setCameras(data);
    } catch (err) {
      console.error("Failed to load cameras:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCameras();
  }, []);

  const handleAddCamera = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await cameraService.create({
        camera_code: cameraCode.toUpperCase(),
        name,
        location,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        status,
        stream_url: `/static/feeds/${cameraCode.toLowerCase()}_stream.mp4`
      });

      setMessage(`Camera ${cameraCode.toUpperCase()} registered successfully.`);
      setCameraCode("");
      setName("");
      setLocation("");
      loadCameras();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Failed to add camera.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this camera?")) return;
    try {
      await cameraService.delete(id);
      loadCameras();
    } catch (err) {
      console.error("Error deleting camera:", err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>CCTV Camera Infrastructure Management</h2>
        <p style={{ fontSize: "0.82rem", color: "#64748b" }}>
          Configure ANPR camera nodes, GPS coordinates, video stream endpoints, and active state
        </p>
      </div>

      {/* Add Camera Card */}
      <div className="card">
        <div className="card-title">
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Plus size={18} color="#2563eb" /> Register New Surveillance Camera Node
          </span>
        </div>

        {message && (
          <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "8px 12px", borderRadius: "6px", fontSize: "0.82rem", marginBottom: "12px" }}>
            {message}
          </div>
        )}

        <form onSubmit={handleAddCamera} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
              Camera ID Code
            </label>
            <input
              type="text"
              required
              value={cameraCode}
              onChange={(e) => setCameraCode(e.target.value.toUpperCase())}
              placeholder="e.g. CAM06"
              style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
              Camera Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Beach Promenade Gate"
              style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
              Location / Landmark
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Beach Road"
              style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
              Latitude
            </label>
            <input
              type="number"
              step="any"
              required
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
              Longitude
            </label>
            <input
              type="number"
              step="any"
              required
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ padding: "9px 18px" }}>
            <Plus size={15} /> Save Camera
          </button>
        </form>
      </div>

      {/* Cameras Table */}
      <div className="card">
        <div className="card-title">
          <span>Configured Camera Infrastructure</span>
          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{cameras.length} nodes active</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Camera Name</th>
                <th>Location</th>
                <th>GPS Latitude / Longitude</th>
                <th>Status</th>
                <th>Vehicles Counted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cameras.map((c) => (
                <tr key={c.id}>
                  <td><b>{c.camera_code}</b></td>
                  <td>{c.name}</td>
                  <td>{c.location}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>
                    {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}
                  </td>
                  <td>
                    <span className={`badge ${c.status === "Online" ? "badge-online" : "badge-offline"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td><b>{c.vehicle_count_today}</b></td>
                  <td>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="btn-secondary"
                      style={{ padding: "4px 8px", fontSize: "0.72rem", color: "#dc2626" }}
                    >
                      <Trash2 size={13} /> Delete
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

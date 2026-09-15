import React, { useState, useEffect } from "react";
import { MapPin, Activity, Info } from "lucide-react";
import MapView from "../components/MapView";
import { analyticsService, cameraService } from "../services/api";

export default function TrafficMap() {
  const [cameras, setCameras] = useState([]);
  const [trafficLocations, setTrafficLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([cameraService.getAll(), analyticsService.getTraffic()])
      .then(([camRes, traRes]) => {
        setCameras(camRes);
        setTrafficLocations(traRes.traffic_by_location || []);
      })
      .catch((err) => console.error("Error loading traffic map:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "calc(100vh - 100px)" }}>
      {/* Header Banner */}
      <div className="card" style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700 }}>City-Wide Traffic Intensity & Congestion Heatmap</h2>
            <p style={{ fontSize: "0.78rem", color: "#64748b" }}>
              Visualizes real-time density levels across all 5 monitored junctions
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "0.75rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10b981" }}></span> 0–30 Low
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#eab308" }}></span> 31–60 Medium
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#f97316" }}></span> 61–100 High
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444" }}></span> 100+ Critical
            </span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="card" style={{ padding: "0", flex: 1, overflow: "hidden" }}>
        <MapView
          cameras={cameras}
          heatPoints={trafficLocations.map((loc) => ({
            latitude: loc.latitude,
            longitude: loc.longitude,
            camera_name: loc.camera_name,
            location: loc.location,
            vehicle_count: loc.vehicle_count,
            congestion: loc.congestion_level
          }))}
          zoom={13}
          height="100%"
        />
      </div>
    </div>
  );
}

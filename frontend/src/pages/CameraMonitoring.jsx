import React, { useState, useEffect } from "react";
import { Video, Play, Square, Upload, CheckCircle, RefreshCw, Radio } from "lucide-react";
import { cameraService } from "../services/api";

export default function CameraMonitoring() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingStatus, setProcessingStatus] = useState({});
  const [uploadMessage, setUploadMessage] = useState("");

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

  const handleProcessFeed = async (camId) => {
    setProcessingStatus((prev) => ({ ...prev, [camId]: "processing" }));
    try {
      const res = await cameraService.processVideo(camId);
      setProcessingStatus((prev) => ({ ...prev, [camId]: "done", result: res }));
      loadCameras(); // refresh counts
      setTimeout(() => {
        setProcessingStatus((prev) => ({ ...prev, [camId]: null }));
      }, 5000);
    } catch (err) {
      setProcessingStatus((prev) => ({ ...prev, [camId]: "error" }));
    }
  };

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading Camera Grid...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>City CCTV Grid Feeds</h2>
          <p style={{ fontSize: "0.82rem", color: "#64748b" }}>
            Real-time multi-camera video feed processing and ANPR license plate extraction
          </p>
        </div>
        <button onClick={loadCameras} className="btn-secondary">
          <RefreshCw size={15} /> Refresh Grid
        </button>
      </div>

      {uploadMessage && (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "10px 16px", borderRadius: "8px", fontSize: "0.85rem" }}>
          {uploadMessage}
        </div>
      )}

      {/* Camera Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
        {cameras.map((cam) => {
          const isOnline = cam.status === "Online";
          const status = processingStatus[cam.id];

          return (
            <div key={cam.id} className="card" style={{ display: "flex", flexDirection: "column", padding: "0", overflow: "hidden" }}>
              {/* Simulated Camera Video Stream Preview Container */}
              <div style={{
                height: "190px",
                background: "#0b1329",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white"
              }}>
                {/* Scanline Animation Accent */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "radial-gradient(circle at 50% 50%, rgba(37,99,235,0.15) 0%, rgba(11,19,41,0.85) 100%)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: "12px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{
                      background: "rgba(15, 23, 42, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "0.72rem",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700
                    }}>
                      {cam.camera_code}
                    </span>

                    <span style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "0.72rem",
                      background: isOnline ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                      color: isOnline ? "#34d399" : "#f87171",
                      border: `1px solid ${isOnline ? "#059669" : "#dc2626"}`,
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontWeight: 600
                    }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isOnline ? "#10b981" : "#ef4444" }}></span>
                      {cam.status}
                    </span>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <Radio size={28} color="#38bdf8" style={{ margin: "0 auto 6px auto", opacity: 0.8 }} />
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>ANPR AI Feed Stream</div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#64748b", fontFamily: "var(--font-mono)" }}>
                    <span>FPS: 30.0</span>
                    <span>1080p HD</span>
                  </div>
                </div>
              </div>

              {/* Card Meta & Actions */}
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>{cam.name}</h3>
                  <p style={{ fontSize: "0.8rem", color: "#64748b" }}>{cam.location} • {cam.latitude.toFixed(4)}, {cam.longitude.toFixed(4)}</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.78rem" }}>
                  <div>
                    <div style={{ color: "#64748b" }}>Vehicles Today</div>
                    <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#0f172a" }}>{cam.vehicle_count_today}</div>
                  </div>
                  <div>
                    <div style={{ color: "#64748b" }}>Last Detection</div>
                    <div style={{ fontWeight: 600, color: "#334155", fontFamily: "var(--font-mono)" }}>{cam.last_detection || "Recent"}</div>
                  </div>
                </div>

                {status === "done" && (
                  <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "8px", borderRadius: "6px", fontSize: "0.75rem" }}>
                    ? Processed! Detected: <b>{status.result?.detected_plate}</b>
                  </div>
                )}

                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button
                    onClick={() => handleProcessFeed(cam.id)}
                    disabled={status === "processing"}
                    className="btn-primary"
                    style={{ flex: 1, padding: "8px", fontSize: "0.8rem", justifyContent: "center" }}
                  >
                    <Play size={14} /> {status === "processing" ? "Processing..." : "Run ANPR Scan"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

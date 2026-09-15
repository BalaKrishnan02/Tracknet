import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Play, Check, X, Clock, Video, Camera, MapPin, Gauge, Eye, Car } from "lucide-react";
import { multiCameraSearchService } from "../services/api";

export default function DetectionDetails() {
  const { id } = useParams();
  const [detection, setDetection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFeedback, setStatusFeedback] = useState("");
  const videoRef = useRef(null);

  const fetchDetection = async () => {
    try {
      setLoading(true);
      const data = await multiCameraSearchService.getDetectionDetails(id);
      setDetection(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load detection details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetection();
  }, [id]);

  const handleDecision = async (decision) => {
    try {
      await multiCameraSearchService.confirmMatch(detection.id, decision);
      setStatusFeedback(`Detection marked as ${decision === "CONFIRM" ? "CONFIRMED" : "REJECTED"}.`);
      fetchDetection();
    } catch (err) {
      alert("Error saving review: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleJumpVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = detection.jump_timestamp_seconds || 0;
      videoRef.current.play().catch(() => {});
    }
  };

  if (loading) {
    return <div className="card" style={{ padding: "40px", textAlign: "center" }}>Loading detection inspection...</div>;
  }

  if (error || !detection) {
    return (
      <div className="card" style={{ padding: "30px" }}>
        <div style={{ color: "#991b1b", marginBottom: "14px" }}>{error || "Detection not found."}</div>
        <Link to="/vehicle-search" className="btn-secondary">
          <ArrowLeft size={14} /> Back to Search
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "980px", margin: "0 auto" }}>
      {/* Breadcrumb Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link to={`/vehicle-search/results?plate=${detection.plate_number}`} className="btn-secondary" style={{ padding: "6px 12px", textDecoration: "none" }}>
            <ArrowLeft size={14} /> Back to Search Results
          </Link>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
            ANPR Detection Inspection: #{detection.id}
          </h1>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <Link to={`/vehicle-search/timeline?plate=${detection.plate_number}`} className="btn-secondary" style={{ textDecoration: "none" }}>
            <Clock size={14} /> View Timeline
          </Link>
          <Link to={`/vehicle-search/trajectory?plate=${detection.plate_number}`} className="btn-primary" style={{ textDecoration: "none" }}>
            <MapPin size={14} /> View Trajectory Map
          </Link>
        </div>
      </div>

      {statusFeedback && (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "10px 14px", borderRadius: "8px", fontSize: "0.82rem" }}>
          {statusFeedback}
        </div>
      )}

      {/* Top Header Card */}
      <div className="card" style={{ borderLeft: "4px solid #2563eb" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="plate-badge" style={{ fontSize: "1.3rem", padding: "4px 14px" }}>
                {detection.plate_number}
              </span>
              <span className="badge badge-exact" style={{ fontSize: "0.82rem" }}>
                Match Status: {detection.match_status}
              </span>
            </div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
              Captured at <b>{detection.camera_code}</b> ({detection.location_name}, {detection.city})
            </div>
          </div>

          {/* Review Decision Buttons */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => handleDecision("REJECT")}
              className="btn-secondary"
              style={{ color: "#991b1b", borderColor: "#fecaca" }}
            >
              <X size={14} /> Reject Match
            </button>
            <button
              onClick={() => handleDecision("CONFIRM")}
              className="btn-primary"
              style={{ background: "#059669" }}
            >
              <Check size={14} /> Confirm Match
            </button>
          </div>
        </div>
      </div>

      {/* Visual Crops Showcase: 3 Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        {/* Original Plate Crop */}
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>
            Original Plate Crop
          </div>
          <div style={{ height: "90px", background: "#0f172a", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid #334155" }}>
            <img
              src={detection.plate_image}
              alt="Plate Crop"
              style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </div>
          <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "6px" }}>
            Raw OCR: <b style={{ fontFamily: "var(--font-mono)" }}>{detection.raw_ocr_text}</b>
          </div>
        </div>

        {/* Processed Binary Plate Image */}
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>
            Processed Binary Plate (CLAHE + Otsu)
          </div>
          <div style={{ height: "90px", background: "#ffffff", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1.5px solid #cbd5e1" }}>
            <img
              src={detection.processed_plate_image_path || detection.plate_image}
              alt="Binary Plate"
              style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", filter: "contrast(180%) grayscale(100%)" }}
            />
          </div>
          <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "6px" }}>
            Confidence: <b style={{ color: "#059669" }}>{Math.round((detection.ocr_confidence || 0.95) * 100)}%</b>
          </div>
        </div>

        {/* Vehicle Full Crop */}
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>
            Vehicle Detection Bounding Frame
          </div>
          <div style={{ height: "90px", background: "#1e293b", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid #334155" }}>
            <img
              src={detection.vehicle_image}
              alt="Vehicle Frame"
              style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "cover" }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </div>
          <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "6px" }}>
            Class: <b>{detection.vehicle_type} ({detection.vehicle_color})</b>
          </div>
        </div>
      </div>

      {/* Complete Section 25 Field Table */}
      <div className="card">
        <div className="card-title">
          <span>Complete Spatiotemporal Detection Metadata</span>
          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Comprehensive ANPR sighting record</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Normalized Plate Number</div>
            <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a", fontFamily: "var(--font-mono)" }}>{detection.plate_number}</div>
          </div>

          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Raw OCR Text</div>
            <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#d97706", fontFamily: "var(--font-mono)" }}>{detection.raw_ocr_text || detection.plate_number}</div>
          </div>

          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>OCR Confidence</div>
            <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#059669" }}>{Math.round((detection.ocr_confidence || 0.95) * 100)}%</div>
          </div>

          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Vehicle Type & Color</div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>{detection.vehicle_type} ({detection.vehicle_color})</div>
          </div>

          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Estimated Speed</div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>{detection.estimated_speed} km/h</div>
          </div>

          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Camera Code & Name</div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>{detection.camera_code} - {detection.camera_name}</div>
          </div>

          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Location & City</div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>{detection.location_name} ({detection.city})</div>
          </div>

          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Absolute Sighting Time</div>
            <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#2563eb", fontFamily: "var(--font-mono)" }}>{detection.absolute_timestamp ? new Date(detection.absolute_timestamp).toLocaleTimeString() : "09:05:32"}</div>
          </div>

          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Video Source File</div>
            <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#0f172a", fontFamily: "var(--font-mono)" }}>{detection.video_name}</div>
          </div>

          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Video Timestamp (Frame)</div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a", fontFamily: "var(--font-mono)" }}>{detection.video_timestamp_str} (Frame #{detection.frame_number || 9843})</div>
          </div>
        </div>
      </div>

      {/* Embedded Video Player with Jump Controller */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Video size={18} color="#2563eb" />
            <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>CCTV Video Playback & Timestamp Verification</span>
          </div>

          <button onClick={handleJumpVideo} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.78rem" }}>
            <Play size={13} /> Jump to Detection ({detection.video_timestamp_str})
          </button>
        </div>

        <div style={{ background: "#000000", borderRadius: "8px", overflow: "hidden", maxHeight: "400px", display: "flex", justifyContent: "center" }}>
          <video
            ref={videoRef}
            src={detection.video_url || `/uploads/videos/${detection.video_name}`}
            controls
            style={{ width: "100%", maxHeight: "400px" }}
            poster={detection.vehicle_image}
          />
        </div>
      </div>
    </div>
  );
}

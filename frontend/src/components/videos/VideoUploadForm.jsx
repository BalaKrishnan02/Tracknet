import React, { useState } from "react";
import { Upload, Video, Camera, MapPin, Clock, Calendar, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { videoService } from "../../services/api";

const SAMPLE_PRESETS = [
  { code: "CAM01", name: "Railway Station Camera", city: "Puducherry", location: "Railway Station Junction", lat: 11.9360, lon: 79.8300, dir: "Northbound", time: "09:00:00" },
  { code: "CAM02", name: "Central Bus Terminus Camera", city: "Puducherry", location: "Bus Stand Commercial Area", lat: 11.9425, lon: 79.8250, dir: "Northbound", time: "09:00:00" },
  { code: "CAM03", name: "Gandhi Road Camera", city: "Puducherry", location: "Main Arterial Intersection", lat: 11.9480, lon: 79.8180, dir: "Northbound", time: "09:00:00" },
  { code: "CAM04", name: "Airport Expressway Camera", city: "Puducherry", location: "Expressway Toll Approach", lat: 11.9680, lon: 79.8020, dir: "Northbound", time: "09:00:00" },
];

export default function VideoUploadForm({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [cameraCode, setCameraCode] = useState("CAM01");
  const [cameraName, setCameraName] = useState("Railway Station Camera");
  const [city, setCity] = useState("Puducherry");
  const [state, setState] = useState("Puducherry");
  const [zone, setZone] = useState("Boulevard Town");
  const [locationName, setLocationName] = useState("Railway Station Junction");
  const [latitude, setLatitude] = useState(11.9360);
  const [longitude, setLongitude] = useState(79.8300);
  const [roadName, setRoadName] = useState("Railway Approach Road");
  const [direction, setDirection] = useState("Northbound");
  const [videoDate, setVideoDate] = useState("2026-09-09");
  const [videoStartTime, setVideoStartTime] = useState("09:00:00");

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const applyPreset = (preset) => {
    setCameraCode(preset.code);
    setCameraName(preset.name);
    setCity(preset.city);
    setLocationName(preset.location);
    setLatitude(preset.lat);
    setLongitude(preset.lon);
    setDirection(preset.dir);
    setVideoStartTime(preset.time);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatusMsg("");
      setErrorMsg("");
    }
  };

  const handleSubmit = async (autoAnalyze = false) => {
    if (!file) {
      setErrorMsg("Please choose a traffic video file (MP4, AVI, MOV, MKV).");
      return;
    }

    setUploading(true);
    setUploadProgress(20);
    setErrorMsg("");
    setStatusMsg("Uploading video and binding camera metadata...");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("camera_code", cameraCode);
    fd.append("camera_name", cameraName);
    fd.append("state", state);
    fd.append("city", city);
    fd.append("zone", zone);
    fd.append("location_name", locationName);
    fd.append("latitude", latitude);
    fd.append("longitude", longitude);
    fd.append("road_name", roadName);
    fd.append("direction", direction);
    fd.append("video_date", videoDate);
    fd.append("video_start_time", videoStartTime);
    fd.append("auto_analyze", autoAnalyze);

    try {
      setUploadProgress(70);
      const res = await videoService.upload(fd);
      setUploadProgress(100);
      setStatusMsg(autoAnalyze ? "Video uploaded and AI analysis initiated!" : "Video uploaded successfully!");
      setFile(null);
      if (onUploadSuccess) onUploadSuccess(res);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to upload video.");
    } finally {
      setUploading(false);
    }
  };

  const handleSeedDemoBundle = async () => {
    setUploading(true);
    setStatusMsg("Seeding SIH 4-Camera Video Bundle (CAM01 -> CAM02 -> CAM03 -> CAM04)...");
    setErrorMsg("");
    try {
      await videoService.seedDemoBundle();
      setStatusMsg("Successfully seeded all 4 CCTV videos! AI Analysis in progress.");
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to seed demo videos.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "18px", borderBottom: "1px solid #e2e8f0", paddingBottom: "14px" }}>
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
            <Upload size={20} color="#2563eb" /> Assign & Upload Camera Video
          </h2>
          <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "4px" }}>
            Upload raw CCTV/traffic camera video files and assign real-world geographic coordinates & start time for spatiotemporal ANPR tracking.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSeedDemoBundle}
          disabled={uploading}
          className="btn-primary"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", fontSize: "0.8rem", padding: "8px 14px" }}
        >
          <Sparkles size={15} /> Instant SIH 4-Camera Demo Bundle
        </button>
      </div>

      {statusMsg && (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "10px 14px", borderRadius: "8px", fontSize: "0.82rem", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={16} /> {statusMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "10px 14px", borderRadius: "8px", fontSize: "0.82rem", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      {/* Preset Camera Selector */}
      <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "18px" }}>
        <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>
          Quick Camera Presets (SIH Prototype Route):
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {SAMPLE_PRESETS.map((p) => (
            <button
              key={p.code}
              type="button"
              onClick={() => applyPreset(p)}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                border: cameraCode === p.code ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                background: cameraCode === p.code ? "#eff6ff" : "#ffffff",
                color: cameraCode === p.code ? "#1d4ed8" : "#334155",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {p.code}: {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* File Dropzone */}
      <div
        style={{
          border: "2px dashed #93c5fd",
          borderRadius: "10px",
          padding: "24px",
          textAlign: "center",
          background: "#f0f9ff",
          cursor: "pointer",
          marginBottom: "20px"
        }}
        onClick={() => document.getElementById("video-file-input").click()}
      >
        <input
          id="video-file-input"
          type="file"
          accept="video/mp4,video/avi,video/quicktime,video/x-matroska,.mp4,.avi,.mov,.mkv"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <Video size={36} color="#2563eb" style={{ margin: "0 auto 8px auto", opacity: 0.8 }} />
        <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.95rem" }}>
          {file ? file.name : "Click to browse or drop traffic video file here"}
        </div>
        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
          Supported formats: MP4, AVI, MOV, MKV (Full HD 1080p / 720p)
        </div>
      </div>

      {/* Camera and Geographic Parameters Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "20px" }}>
        <div>
          <label style={{ fontSize: "0.76rem", fontWeight: 600, color: "#475569" }}>Camera ID</label>
          <input
            type="text"
            className="input"
            value={cameraCode}
            onChange={(e) => setCameraCode(e.target.value)}
            placeholder="e.g. CAM01"
            style={{ width: "100%", marginTop: "4px", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
          />
        </div>

        <div>
          <label style={{ fontSize: "0.76rem", fontWeight: 600, color: "#475569" }}>Camera Name</label>
          <input
            type="text"
            className="input"
            value={cameraName}
            onChange={(e) => setCameraName(e.target.value)}
            placeholder="e.g. Railway Station Main Gate"
            style={{ width: "100%", marginTop: "4px", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
          />
        </div>

        <div>
          <label style={{ fontSize: "0.76rem", fontWeight: 600, color: "#475569" }}>City</label>
          <input
            type="text"
            className="input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={{ width: "100%", marginTop: "4px", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
          />
        </div>

        <div>
          <label style={{ fontSize: "0.76rem", fontWeight: 600, color: "#475569" }}>Location Junction</label>
          <input
            type="text"
            className="input"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="e.g. Railway Station Junction"
            style={{ width: "100%", marginTop: "4px", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
          />
        </div>

        <div>
          <label style={{ fontSize: "0.76rem", fontWeight: 600, color: "#475569" }}>Latitude</label>
          <input
            type="number"
            step="any"
            className="input"
            value={latitude}
            onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
            style={{ width: "100%", marginTop: "4px", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
          />
        </div>

        <div>
          <label style={{ fontSize: "0.76rem", fontWeight: 600, color: "#475569" }}>Longitude</label>
          <input
            type="number"
            step="any"
            className="input"
            value={longitude}
            onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
            style={{ width: "100%", marginTop: "4px", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
          />
        </div>

        <div>
          <label style={{ fontSize: "0.76rem", fontWeight: 600, color: "#475569" }}>Traffic Flow Direction</label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            style={{ width: "100%", marginTop: "4px", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white" }}
          >
            <option value="Northbound">Northbound</option>
            <option value="Southbound">Southbound</option>
            <option value="Eastbound">Eastbound</option>
            <option value="Westbound">Westbound</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: "0.76rem", fontWeight: 600, color: "#475569" }}>Video Recording Date</label>
          <input
            type="date"
            value={videoDate}
            onChange={(e) => setVideoDate(e.target.value)}
            style={{ width: "100%", marginTop: "4px", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
          />
        </div>

        <div>
          <label style={{ fontSize: "0.76rem", fontWeight: 600, color: "#475569" }}>Video Start Time (HH:MM:SS)</label>
          <input
            type="text"
            value={videoStartTime}
            onChange={(e) => setVideoStartTime(e.target.value)}
            placeholder="09:00:00"
            style={{ width: "100%", marginTop: "4px", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontFamily: "var(--font-mono)" }}
          />
        </div>
      </div>

      {/* Upload Progress Bar */}
      {uploading && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b", marginBottom: "4px" }}>
            <span>Processing Upload...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: `${uploadProgress}%`, height: "100%", background: "#2563eb", transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button
          type="button"
          disabled={uploading}
          onClick={() => handleSubmit(false)}
          className="btn-secondary"
          style={{ padding: "9px 20px" }}
        >
          Upload Video
        </button>

        <button
          type="button"
          disabled={uploading}
          onClick={() => handleSubmit(true)}
          className="btn-primary"
          style={{ padding: "9px 22px" }}
        >
          Upload & Analyze
        </button>
      </div>
    </div>
  );
}

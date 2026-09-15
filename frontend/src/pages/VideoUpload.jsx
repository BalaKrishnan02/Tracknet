import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UploadCloud, Video, ArrowRight, Play, CheckCircle2 } from "lucide-react";
import VideoUploadForm from "../components/videos/VideoUploadForm";
import { videoService } from "../services/api";

export default function VideoUpload() {
  const navigate = useNavigate();
  const [recentVideos, setRecentVideos] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchVideos = async () => {
    try {
      const data = await videoService.getAll();
      setRecentVideos(data || []);
    } catch (err) {
      console.error("Failed to load videos:", err);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleUploadSuccess = () => {
    fetchVideos();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Banner */}
      <div className="card" style={{ background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)", border: "1px solid #bfdbfe" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>
              CCTV Camera Video Ingestion Center
            </h1>
            <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "4px" }}>
              Upload recorded traffic feeds from multiple junction cameras. Assign spatial metadata (Camera ID, GPS, direction) and recording timestamps to reconstruct city-wide vehicle journeys.
            </p>
          </div>

          <Link to="/videos/analysis" className="btn-primary" style={{ textDecoration: "none" }}>
            <Play size={15} /> Go to Video Analysis Center <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Upload Form */}
      <VideoUploadForm onUploadSuccess={handleUploadSuccess} />

      {/* Recent Uploads Table */}
      {recentVideos.length > 0 && (
        <div className="card">
          <div className="card-title">
            <span>Uploaded Camera Videos ({recentVideos.length})</span>
            <Link to="/videos/analysis" style={{ fontSize: "0.8rem", color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
              View All in Analysis Hub →
            </Link>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ width: "100%", fontSize: "0.82rem" }}>
              <thead>
                <tr>
                  <th>Video File</th>
                  <th>Camera Code</th>
                  <th>Location</th>
                  <th>Recording Date & Time</th>
                  <th>Status</th>
                  <th>Detections</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentVideos.slice(0, 5).map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600 }}>{v.video_name}</td>
                    <td>
                      <span className="plate-badge" style={{ fontSize: "0.75rem", padding: "2px 6px" }}>
                        {v.camera_code}
                      </span>
                    </td>
                    <td>{v.location_name}</td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>
                      {v.video_date} {v.video_start_time}
                    </td>
                    <td>
                      <span className={`badge ${v.analysis_status === "COMPLETED" ? "badge-exact" : v.analysis_status === "ANALYZING" ? "badge-probable" : ""}`}>
                        {v.analysis_status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{v.detections_count || 0}</td>
                    <td>
                      <Link to="/videos/analysis" className="btn-secondary" style={{ padding: "3px 8px", fontSize: "0.75rem", textDecoration: "none" }}>
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, Upload, Search, RefreshCw, Sparkles, CheckCircle2, Video } from "lucide-react";
import VideoAnalysisCard from "../components/videos/VideoAnalysisCard";
import { videoService } from "../services/api";

export default function VideoAnalysis() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzingAll, setAnalyzingAll] = useState(false);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const data = await videoService.getAll();
      setVideos(data || []);
    } catch (err) {
      console.error("Failed to fetch videos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Poll progress if any video is currently ANALYZING
  useEffect(() => {
    const hasAnalyzing = videos.some((v) => v.analysis_status === "ANALYZING" || v.analysis_status === "QUEUED");
    if (!hasAnalyzing) return;

    const interval = setInterval(async () => {
      try {
        const data = await videoService.getAll();
        setVideos(data || []);
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [videos]);

  const handleAnalyze = async (videoId) => {
    try {
      await videoService.analyze(videoId);
      // Immediately set local status
      setVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, analysis_status: "ANALYZING", analysis_progress: 10 } : v))
      );
    } catch (err) {
      alert("Failed to start analysis: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleAnalyzeAll = async () => {
    setAnalyzingAll(true);
    try {
      for (const v of videos) {
        if (v.analysis_status !== "COMPLETED") {
          await videoService.analyze(v.id);
        }
      }
      fetchVideos();
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingAll(false);
    }
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm("Are you sure you want to remove this video and its detections?")) return;
    try {
      await videoService.delete(videoId);
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.detail || err.message));
    }
  };

  const completedCount = videos.filter((v) => v.analysis_status === "COMPLETED").length;
  const totalDetections = videos.reduce((acc, v) => acc + (v.detections_count || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Header Card */}
      <div className="card" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)", border: "1px solid #bbf7d0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>
              CCTV Video AI Analysis Hub
            </h1>
            <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "4px" }}>
              Analyze recorded camera streams through the OpenCV + YOLO vehicle/plate detection and PaddleOCR pipeline.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={fetchVideos}
              className="btn-secondary"
              style={{ padding: "8px 14px", fontSize: "0.82rem" }}
              title="Refresh status"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>

            <Link to="/videos/upload" className="btn-secondary" style={{ padding: "8px 14px", fontSize: "0.82rem", textDecoration: "none" }}>
              <Upload size={14} /> Upload More Videos
            </Link>

            {videos.length > 0 && (
              <button
                onClick={handleAnalyzeAll}
                disabled={analyzingAll}
                className="btn-primary"
                style={{ padding: "8px 16px", fontSize: "0.82rem" }}
              >
                <Play size={14} /> {analyzingAll ? "Queueing..." : "Analyze All Pending"}
              </button>
            )}

            {completedCount > 0 && (
              <Link
                to="/vehicle-search"
                className="btn-primary"
                style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", padding: "8px 16px", fontSize: "0.82rem", textDecoration: "none" }}
              >
                <Search size={14} /> Search Analyzed Videos
              </Link>
            )}
          </div>
        </div>

        {/* Global Progress Strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #e2e8f0" }}>
          <div>
            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Total Camera Videos</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>{videos.length}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Analysis Completed</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#059669" }}>{completedCount} / {videos.length}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Total Plate Detections Ingested</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#2563eb" }}>{totalDetections}</div>
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      {videos.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <Video size={48} color="#94a3b8" style={{ margin: "0 auto 12px auto" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>No CCTV Videos Uploaded Yet</h3>
          <p style={{ fontSize: "0.82rem", color: "#64748b", maxWidth: "450px", margin: "6px auto 16px auto" }}>
            Upload camera videos or seed the SIH 4-camera bundle to run the multi-camera ANPR pipeline.
          </p>
          <Link to="/videos/upload" className="btn-primary" style={{ padding: "8px 20px", textDecoration: "none", display: "inline-flex" }}>
            <Upload size={15} /> Upload Camera Video
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px" }}>
          {videos.map((video) => (
            <VideoAnalysisCard
              key={video.id}
              video={video}
              onAnalyze={handleAnalyze}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Search,
  Route,
  Clock,
  Video,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Play,
  ArrowRight,
  ShieldAlert,
  ArrowLeft,
  Check,
  X
} from "lucide-react";
import CameraSearchSummary from "../components/search/CameraSearchSummary";
import { multiCameraSearchService } from "../services/api";

export default function MultiCameraResults() {
  const [searchParams] = useSearchParams();
  const targetPlate = (searchParams.get("plate") || "TN31AB4589").toUpperCase();
  const includeProbable = searchParams.get("probable") !== "false";

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals state
  const [reviewModalData, setReviewModalData] = useState(null);
  const [videoModalData, setVideoModalData] = useState(null);
  const videoRef = useRef(null);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await multiCameraSearchService.search({
        plate_number: targetPlate,
        include_probable_matches: includeProbable,
        search_scope: "ALL"
      });
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to search across camera videos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [targetPlate, includeProbable]);

  const handleReviewDecision = async (detectionId, decision) => {
    try {
      await multiCameraSearchService.confirmMatch(detectionId, decision);
      setReviewModalData(null);
      fetchResults(); // Refresh data
    } catch (err) {
      alert("Failed to record decision: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleOpenVideoPlayer = (det) => {
    setVideoModalData(det);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = det.jump_timestamp_seconds || 0;
        videoRef.current.play().catch(() => {});
      }
    }, 300);
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: "50px", textAlign: "center" }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>Searching All Camera Videos...</div>
        <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "6px" }}>
          Scanning uploaded junction feeds for registration {targetPlate} with Levenshtein typo tolerance.
        </p>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="card" style={{ padding: "30px" }}>
        <div style={{ color: "#991b1b", marginBottom: "14px" }}>{error || "No search results returned."}</div>
        <Link to="/vehicle-search" className="btn-secondary">
          <ArrowLeft size={15} /> Back to Search
        </Link>
      </div>
    );
  }

  const detections = results.detections || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Banner Navigation & Quick Search Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link to="/vehicle-search" className="btn-secondary" style={{ padding: "6px 12px", textDecoration: "none" }}>
            <ArrowLeft size={14} /> Back to Search
          </Link>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
            Multi-Camera ANPR Search Results
          </h1>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link to={`/vehicle-search/timeline?plate=${targetPlate}`} className="btn-secondary" style={{ textDecoration: "none" }}>
            <Clock size={15} /> View Vehicle Timeline
          </Link>
          <Link to={`/vehicle-search/trajectory?plate=${targetPlate}`} className="btn-primary" style={{ textDecoration: "none" }}>
            <Route size={15} /> Open Trajectory Map <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Section 18: KPI Summary Banner */}
      <div className="card" style={{ borderLeft: "4px solid #2563eb" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="plate-badge" style={{ fontSize: "1.25rem", padding: "4px 14px" }}>
                {results.target_plate}
              </span>
              <span className="badge badge-exact" style={{ fontSize: "0.82rem" }}>
                Target Verified
              </span>
              {results.is_watchlisted && (
                <span className="badge badge-critical" style={{ fontSize: "0.82rem" }}>
                  <ShieldAlert size={13} /> {results.watchlist_reason || "Watchlist Target"}
                </span>
              )}
            </div>
            <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "6px" }}>
              Multi-camera spatiotemporal query across all analyzed CCTV feeds
            </div>
          </div>
        </div>

        {/* Section 18: Summary Numbers Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Search Plate</div>
            <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a", fontFamily: "var(--font-mono)" }}>
              {results.target_plate}
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Total Matches</div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#2563eb" }}>
              {results.total_matches}
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Exact Matches</div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#059669" }}>
              {results.exact_matches}
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Probable Matches</div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#d97706" }}>
              {results.probable_matches}
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Cameras Found</div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#4f46e5" }}>
              {results.camera_count}
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>First Seen</div>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a", fontFamily: "var(--font-mono)" }}>
              {results.first_seen || "—"}
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Last Seen</div>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a", fontFamily: "var(--font-mono)" }}>
              {results.last_seen || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Section 24: Camera Search Status Summary */}
      <CameraSearchSummary summary={results.camera_summary} targetPlate={results.target_plate} />

      {/* Section 19: Search Results Table */}
      <div className="card">
        <div className="card-title">
          <span>Multi-Camera Sightings Breakdown ({detections.length})</span>
          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Sorted chronologically by absolute video timestamp</span>
        </div>

        {detections.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
            No sightings found for {targetPlate} in uploaded camera videos.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ width: "100%", fontSize: "0.82rem" }}>
              <thead>
                <tr>
                  <th>Detected Plate</th>
                  <th>Match Type</th>
                  <th>Camera</th>
                  <th>Location</th>
                  <th>Video File</th>
                  <th>Detection Time</th>
                  <th>OCR Conf</th>
                  <th>Match Conf</th>
                  <th>Vehicle Type</th>
                  <th>Plate Crop</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {detections.map((det) => {
                  const isProbable = det.match_type === "PROBABLE MATCH";
                  return (
                    <tr key={det.id} style={{ background: isProbable ? "#fffbeb" : "inherit" }}>
                      <td>
                        <span className="plate-badge" style={{ fontSize: "0.82rem" }}>
                          {det.raw_ocr_text || det.plate_number}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isProbable ? "badge-probable" : "badge-exact"}`}>
                          {det.match_type}
                        </span>
                      </td>
                      <td>
                        <b style={{ color: "#2563eb" }}>{det.camera_code}</b>
                      </td>
                      <td>{det.location_name}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                        {det.video_name}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                        {det.detection_time_str}
                      </td>
                      <td>{det.ocr_confidence}%</td>
                      <td style={{ fontWeight: 700, color: isProbable ? "#d97706" : "#059669" }}>
                        {det.match_confidence}%
                      </td>
                      <td>{det.vehicle_type} ({det.vehicle_color})</td>
                      <td>
                        <img
                          src={det.plate_image}
                          alt="Plate"
                          style={{ height: "26px", borderRadius: "3px", border: "1px solid #cbd5e1" }}
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => handleOpenVideoPlayer(det)}
                            className="btn-secondary"
                            style={{ padding: "3px 8px", fontSize: "0.72rem" }}
                            title="Jump to video position (5s pre-roll)"
                          >
                            <Play size={12} /> Play
                          </button>

                          {isProbable && (
                            <button
                              onClick={() => setReviewModalData(det)}
                              className="btn-secondary"
                              style={{ padding: "3px 8px", fontSize: "0.72rem", background: "#fef3c7", borderColor: "#fde68a", color: "#92400e" }}
                            >
                              Review
                            </button>
                          )}

                          <Link
                            to={`/detections/${det.id}`}
                            className="btn-secondary"
                            style={{ padding: "3px 8px", fontSize: "0.72rem", textDecoration: "none" }}
                          >
                            <Eye size={12} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 20: Match Review Modal */}
      {reviewModalData && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="card" style={{ maxWidth: "560px", width: "100%", background: "white" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", marginBottom: "14px" }}>
              Operator ANPR Match Review
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "0.72rem", color: "#64748b" }}>TARGET PLATE</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", fontFamily: "var(--font-mono)" }}>
                  {results.target_plate}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.72rem", color: "#64748b" }}>DETECTED RAW OCR</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#d97706", fontFamily: "var(--font-mono)" }}>
                  {reviewModalData.raw_ocr_text || reviewModalData.plate_number}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
              <img
                src={reviewModalData.plate_image}
                alt="Plate Crop"
                style={{ height: "45px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
              />
              <div style={{ fontSize: "0.78rem", color: "#475569" }}>
                Similarity: <b>{reviewModalData.plate_similarity}%</b> | OCR Confidence: <b>{reviewModalData.ocr_confidence}%</b><br/>
                Camera: <b>{reviewModalData.camera_code}</b> ({reviewModalData.location_name})
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setReviewModalData(null)}
                className="btn-secondary"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleReviewDecision(reviewModalData.id, "REJECT")}
                className="btn-secondary"
                style={{ color: "#991b1b", borderColor: "#fecaca" }}
              >
                <X size={14} /> Reject Match
              </button>

              <button
                type="button"
                onClick={() => handleReviewDecision(reviewModalData.id, "CONFIRM")}
                className="btn-primary"
                style={{ background: "#059669" }}
              >
                <Check size={14} /> Confirm Match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section 21: Video Player Match Jump Modal */}
      {videoModalData && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="card" style={{ maxWidth: "780px", width: "100%", background: "#0f172a", color: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Video size={18} color="#38bdf8" />
                <span style={{ fontWeight: 700, fontSize: "1rem" }}>
                  {videoModalData.camera_code} ({videoModalData.location_name}) — Video Match Jump
                </span>
              </div>
              <button
                onClick={() => setVideoModalData(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.2rem" }}
              >
                ✕
              </button>
            </div>

            {/* Video Player */}
            <div style={{ background: "#000000", borderRadius: "8px", overflow: "hidden", maxHeight: "420px", display: "flex", justifyContent: "center" }}>
              <video
                ref={videoRef}
                src={`/uploads/videos/${videoModalData.video_name}`}
                controls
                style={{ width: "100%", maxHeight: "420px" }}
                poster={videoModalData.vehicle_image}
              />
            </div>

            {/* Jump and detection details info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", fontSize: "0.8rem", color: "#94a3b8" }}>
              <div>
                Detection Video Time: <b style={{ color: "#38bdf8", fontFamily: "var(--font-mono)" }}>{videoModalData.video_timestamp_str}</b> (Playback jumped ~5s prior to sighting)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="plate-badge" style={{ fontSize: "0.85rem" }}>
                  {videoModalData.raw_ocr_text || videoModalData.plate_number}
                </span>
                <span className="badge badge-exact">{videoModalData.match_type}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

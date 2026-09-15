import React, { useState, useEffect } from "react";
import { Sliders, Search, Check, Plus, AlertTriangle, Layers, MapPin, Gauge } from "lucide-react";
import CameraRecommendationCard from "../components/cameras/CameraRecommendationCard";
import MapView from "../components/MapView";
import { networkService, cameraPlanningService } from "../services/networkApi";

export default function CityCameraPlanning() {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState("Tamil Nadu");
  const [selectedCity, setSelectedCity] = useState("Chennai");

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [cityCameras, setCityCameras] = useState([]);
  const [proposedStatus, setProposedStatus] = useState({});
  const [message, setMessage] = useState("");

  // Load States on mount
  useEffect(() => {
    networkService.getStates().then((stList) => {
      setStates(stList);
      const defState = stList.find((s) => s.name === "Tamil Nadu") || stList[0];
      if (defState) {
        setSelectedState(defState.name);
        networkService.getStateCities(defState.id).then((ctList) => {
          setCities(ctList);
          if (ctList.length > 0) setSelectedCity(ctList[0].name);
        });
      }
    });
  }, []);

  const handleStateChange = async (sName) => {
    setSelectedState(sName);
    const stObj = states.find((s) => s.name === sName);
    if (stObj) {
      const ctList = await networkService.getStateCities(stObj.id);
      setCities(ctList);
      if (ctList.length > 0) setSelectedCity(ctList[0].name);
    }
  };

  const runCityAnalysis = async () => {
    if (!selectedState || !selectedCity) return;
    setAnalyzing(true);
    setMessage("");

    try {
      const [analysis, cams] = await Promise.all([
        cameraPlanningService.analyzeCity(selectedState, selectedCity),
        networkService.getCamerasMap({ city: selectedCity })
      ]);

      setAnalysisResult(analysis);
      setCityCameras(cams);
    } catch (err) {
      console.error("Error analyzing city placement:", err);
      setMessage("Failed to run city placement analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleProposeCamera = async (rec) => {
    setProposedStatus((prev) => ({ ...prev, [rec.location_name]: "saving" }));
    try {
      const res = await cameraPlanningService.proposeCamera({
        location_name: rec.location_name,
        city: selectedCity,
        state: selectedState,
        latitude: rec.latitude,
        longitude: rec.longitude,
        road_type: rec.road_type,
        location_type: rec.location_type,
        placement_score: rec.placement_score,
        priority: rec.priority,
        placement_reason: rec.reasons.join("; "),
        lanes_covered: rec.lanes,
        direction: rec.recommended_direction,
        estimated_daily_volume: rec.estimated_daily_volume,
        traffic_level: rec.traffic_level
      });

      setProposedStatus((prev) => ({ ...prev, [rec.location_name]: "done" }));
      setMessage(res.message);

      // Refresh cameras map for city
      const updatedCams = await networkService.getCamerasMap({ city: selectedCity });
      setCityCameras(updatedCams);
    } catch (err) {
      console.error("Error proposing camera:", err);
      setProposedStatus((prev) => ({ ...prev, [rec.location_name]: "error" }));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Hero Selector Card */}
      <div className="card" style={{ background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)", border: "1px solid #bfdbfe" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
          City ANPR Camera Placement Recommendation Engine
        </h2>
        <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "2px", marginBottom: "16px" }}>
          Evaluates city road geometry, entry/exit choke points, traffic volumes, accident blackspots, and surveillance gaps to calculate weighted Camera Placement Scores (0–100).
        </p>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b", fontWeight: 700, marginBottom: "2px" }}>
              SELECT STATE
            </label>
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #93c5fd", fontWeight: 600, fontSize: "0.85rem", minWidth: "180px" }}
            >
              {states.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b", fontWeight: 700, marginBottom: "2px" }}>
              SELECT TARGET CITY
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #93c5fd", fontWeight: 600, fontSize: "0.85rem", minWidth: "180px" }}
            >
              {cities.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ alignSelf: "flex-end" }}>
            <button
              onClick={runCityAnalysis}
              disabled={analyzing}
              className="btn-primary"
              style={{ padding: "9px 24px", fontSize: "0.85rem" }}
            >
              {analyzing ? "Analyzing Road Network..." : "ANALYZE CITY PLACEMENT"}
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "10px 16px", borderRadius: "8px", fontSize: "0.85rem" }}>
          ? {message}
        </div>
      )}

      {/* Analysis Output Layout */}
      {analysisResult && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* City Profile KPI Strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "14px" }}>
            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Coverage Score</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#2563eb" }}>
                {analysisResult.coverage_score}%
              </div>
              <span className={`badge ${analysisResult.coverage_score >= 75 ? "badge-online" : "badge-review"}`} style={{ fontSize: "0.68rem" }}>
                {analysisResult.coverage_status}
              </span>
            </div>

            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Existing Cameras</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>
                {analysisResult.existing_camera_count}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#10b981", fontWeight: 600 }}>
                {analysisResult.active_camera_count} Active • {analysisResult.proposed_camera_count} Proposed
              </div>
            </div>

            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Coverage Gaps</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ef4444" }}>
                {analysisResult.coverage_gaps}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Priority road blindspots</div>
            </div>

            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Recommended Additions</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f59e0b" }}>
                +{analysisResult.recommended_camera_count}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#64748b" }}>High / Critical priority</div>
            </div>
          </div>

          {/* Map + Recommendations Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "20px" }}>
            {/* Map */}
            <div className="card" style={{ padding: 0, overflow: "hidden", minHeight: "480px" }}>
              <MapView
                cameras={cityCameras}
                center={cityCameras.length > 0 ? [cityCameras[0].latitude, cityCameras[0].longitude] : [13.0827, 80.2707]}
                zoom={12}
                height="100%"
              />
            </div>

            {/* Recommendations List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", maxHeight: "560px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>
                  Top Recommended ANPR Locations
                </h3>
                <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Ranked by Placement Score</span>
              </div>

              {analysisResult.recommendations.map((rec, idx) => (
                <CameraRecommendationCard
                  key={idx}
                  rec={rec}
                  onPropose={handleProposeCamera}
                  isProposing={proposedStatus[rec.location_name] === "saving"}
                  isProposed={proposedStatus[rec.location_name] === "done"}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

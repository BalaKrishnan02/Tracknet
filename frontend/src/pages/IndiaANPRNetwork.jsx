import React, { useState, useEffect } from "react";
import { MapPin, Filter, Layers, Radio, ChevronRight, Activity, Eye, ShieldCheck } from "lucide-react";
import IndiaNetworkMap from "../components/maps/IndiaNetworkMap";
import { networkService } from "../services/networkApi";

export default function IndiaANPRNetwork() {
  const [summary, setSummary] = useState(null);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [coverageGaps, setCoverageGaps] = useState([]);

  // Filter selections
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedZone, setSelectedZone] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterTraffic, setFilterTraffic] = useState("All");
  const [showGaps, setShowGaps] = useState(false);

  const [loading, setLoading] = useState(true);

  // Initial load: India summary, states, and nationwide camera markers
  useEffect(() => {
    Promise.all([
      networkService.getIndiaSummary(),
      networkService.getStates(),
      networkService.getCamerasMap({ limit: 500 }),
      networkService.getCoverageGaps()
    ])
      .then(([sumRes, stRes, camRes, gapRes]) => {
        setSummary(sumRes);
        setStates(stRes);
        setCameras(camRes);
        setCoverageGaps(gapRes);
      })
      .catch((err) => console.error("Error loading India ANPR network:", err))
      .finally(() => setLoading(false));
  }, []);

  // When State changes: load cities for state and filter cameras
  const handleStateChange = async (stateName) => {
    if (!stateName || stateName === "All") {
      setSelectedState(null);
      setSelectedCity(null);
      setCities([]);
      const cams = await networkService.getCamerasMap({ status: filterStatus, location_type: filterType, traffic_level: filterTraffic });
      setCameras(cams);
      return;
    }

    const stObj = states.find((s) => s.name === stateName);
    setSelectedState(stObj);
    setSelectedCity(null);

    if (stObj) {
      const cityList = await networkService.getStateCities(stObj.id);
      setCities(cityList);
      const cams = await networkService.getCamerasMap({ state: stObj.name, status: filterStatus, location_type: filterType, traffic_level: filterTraffic });
      setCameras(cams);
    }
  };

  // When City changes
  const handleCityChange = async (cityName) => {
    if (!cityName || cityName === "All") {
      setSelectedCity(null);
      const cams = await networkService.getCamerasMap({ state: selectedState?.name, status: filterStatus, location_type: filterType, traffic_level: filterTraffic });
      setCameras(cams);
      return;
    }

    const ctObj = cities.find((c) => c.name === cityName);
    setSelectedCity(ctObj);

    if (ctObj) {
      const cams = await networkService.getCamerasMap({ state: selectedState?.name, city: ctObj.name, status: filterStatus, location_type: filterType, traffic_level: filterTraffic });
      setCameras(cams);
    }
  };

  const applyFilters = async () => {
    const params = {
      state: selectedState?.name,
      city: selectedCity?.name,
      status: filterStatus,
      location_type: filterType,
      traffic_level: filterTraffic
    };
    const cams = await networkService.getCamerasMap(params);
    setCameras(cams);
  };

  useEffect(() => {
    applyFilters();
  }, [filterStatus, filterType, filterTraffic]);

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading National ANPR Network...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "calc(100vh - 95px)" }}>
      {/* Header & Breadcrumb */}
      <div className="card" style={{ padding: "12px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "#64748b", marginBottom: "4px" }}>
              <span
                onClick={() => { setSelectedState(null); setSelectedCity(null); handleStateChange("All"); }}
                style={{ cursor: "pointer", color: "#2563eb", fontWeight: 600 }}
              >
                India Network
              </span>
              {selectedState && (
                <>
                  <ChevronRight size={14} />
                  <span
                    onClick={() => { setSelectedCity(null); handleCityChange("All"); }}
                    style={{ cursor: "pointer", color: "#2563eb", fontWeight: 600 }}
                  >
                    {selectedState.name}
                  </span>
                </>
              )}
              {selectedCity && (
                <>
                  <ChevronRight size={14} />
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{selectedCity.name}</span>
                </>
              )}
            </div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>
              India-Wide Active ANPR Camera Network
            </h2>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "0.78rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981" }}></span>
              Active: <b>{summary?.active_anpr_cameras}</b>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#2563eb" }}></span>
              Proposed: <b>{summary?.proposed_cameras}</b>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#64748b" }}></span>
              Offline: <b>{summary?.offline_cameras}</b>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }}></span>
              Critical Traffic: <b>{summary?.critical_traffic_cameras}</b>
            </span>
          </div>
        </div>

        {/* Filter Control Bar */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr)) auto",
          gap: "10px",
          marginTop: "12px",
          paddingTop: "12px",
          borderTop: "1px solid #f1f5f9",
          alignItems: "center"
        }}>
          {/* State selector */}
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", color: "#64748b", fontWeight: 600, marginBottom: "2px" }}>
              State / UT
            </label>
            <select
              value={selectedState?.name || "All"}
              onChange={(e) => handleStateChange(e.target.value)}
              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.78rem" }}
            >
              <option value="All">All Indian States</option>
              {states.map((s) => (
                <option key={s.id} value={s.name}>{s.name} ({s.total_cameras})</option>
              ))}
            </select>
          </div>

          {/* City selector */}
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", color: "#64748b", fontWeight: 600, marginBottom: "2px" }}>
              City
            </label>
            <select
              value={selectedCity?.name || "All"}
              onChange={(e) => handleCityChange(e.target.value)}
              disabled={!selectedState}
              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.78rem" }}
            >
              <option value="All">All Cities</option>
              {cities.map((c) => (
                <option key={c.id} value={c.name}>{c.name} ({c.total_cameras})</option>
              ))}
            </select>
          </div>

          {/* Status selector */}
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", color: "#64748b", fontWeight: 600, marginBottom: "2px" }}>
              Camera Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.78rem" }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active ANPR</option>
              <option value="Proposed">Proposed</option>
              <option value="Offline">Offline</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          {/* Location Type */}
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", color: "#64748b", fontWeight: 600, marginBottom: "2px" }}>
              Location Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.78rem" }}
            >
              <option value="All">All Location Types</option>
              <option value="CITY_ENTRY">City Entry</option>
              <option value="CITY_EXIT">City Exit</option>
              <option value="MAJOR_JUNCTION">Major Junction</option>
              <option value="NATIONAL_HIGHWAY">National Highway</option>
              <option value="STATE_HIGHWAY">State Highway</option>
              <option value="RING_ROAD">Ring Road</option>
              <option value="TOLL_APPROACH">Toll Approach</option>
              <option value="TRAFFIC_BLACKSPOT">Accident Blackspot</option>
            </select>
          </div>

          {/* Traffic Density */}
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", color: "#64748b", fontWeight: 600, marginBottom: "2px" }}>
              Traffic Density
            </label>
            <select
              value={filterTraffic}
              onChange={(e) => setFilterTraffic(e.target.value)}
              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.78rem" }}
            >
              <option value="All">All Densities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Toggle Gaps */}
          <div style={{ display: "flex", alignItems: "flex-end", height: "100%" }}>
            <button
              onClick={() => setShowGaps(!showGaps)}
              style={{
                background: showGaps ? "#fee2e2" : "#ffffff",
                border: `1.5px solid ${showGaps ? "#ef4444" : "#cbd5e1"}`,
                color: showGaps ? "#b91c1c" : "#334155",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <Layers size={14} /> Coverage Gaps: {showGaps ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="card" style={{ padding: 0, flex: 1, overflow: "hidden", position: "relative" }}>
        <IndiaNetworkMap
          cameras={cameras}
          stateClusters={summary?.state_breakdown || states}
          cityMarkers={cities}
          coverageGaps={coverageGaps}
          selectedState={selectedState}
          selectedCity={selectedCity}
          showGaps={showGaps}
          onStateSelect={(st) => handleStateChange(st.name)}
          onCitySelect={(ct) => handleCityChange(ct.name)}
          height="100%"
        />

        {/* Floating Demo Notice */}
        <div style={{
          position: "absolute",
          bottom: "12px",
          left: "12px",
          background: "rgba(15, 23, 42, 0.85)",
          color: "#ffffff",
          padding: "6px 12px",
          borderRadius: "20px",
          fontSize: "0.72rem",
          fontWeight: 600,
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(255,255,255,0.15)",
          zIndex: 999
        }}>
          ???? TraffiTrace AI National Grid • Demo / Simulated Traffic Network
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Video, Search, Download, Filter, ChevronLeft, ChevronRight, Eye, ShieldCheck, ArrowUpRight } from "lucide-react";
import CameraStatusCard from "../components/cameras/CameraStatusCard";
import { networkService } from "../services/networkApi";

export default function ActiveANPRCameras() {
  const [cameras, setCameras] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [summary, setSummary] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      networkService.getCamerasMap({ limit: 500 }),
      networkService.getStates(),
      networkService.getIndiaSummary()
    ])
      .then(([camRes, stRes, sumRes]) => {
        setCameras(camRes);
        setStates(stRes);
        setSummary(sumRes);
      })
      .catch((err) => console.error("Error loading cameras:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleStateChange = async (s) => {
    setStateFilter(s);
    setCityFilter("All");
    setCurrentPage(1);

    if (s !== "All") {
      const stObj = states.find((x) => x.name === s);
      if (stObj) {
        const ctList = await networkService.getStateCities(stObj.id);
        setCities(ctList);
      }
    } else {
      setCities([]);
    }
  };

  // Filtered cameras calculation
  const filteredCameras = cameras.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.camera_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesState = stateFilter === "All" || c.state === stateFilter;
    const matchesCity = cityFilter === "All" || c.city === cityFilter;
    const matchesStatus = statusFilter === "All" || c.status === statusFilter;

    return matchesSearch && matchesState && matchesCity && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCameras.length / pageSize) || 1;
  const paginatedCameras = filteredCameras.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportCSV = () => {
    const headers = "Camera ID,Name,State,City,Zone,Road Type,Status,Traffic Level,Daily Volume\n";
    const rows = filteredCameras
      .map(
        (c) =>
          `"${c.camera_code}","${c.name}","${c.state}","${c.city}","${c.zone}","${c.road_type}","${c.status}","${c.traffic_level}",${c.estimated_daily_volume}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `traffitrace_anpr_cameras_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading ANPR Camera Registry...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Title Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>National ANPR Camera Infrastructure Directory</h2>
          <p style={{ fontSize: "0.82rem", color: "#64748b" }}>
            Comprehensive directory of all registered, active, proposed, and maintenance CCTV nodes across India
          </p>
        </div>

        <button onClick={exportCSV} className="btn-secondary" style={{ fontSize: "0.82rem" }}>
          <Download size={14} /> Export Camera Registry CSV
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <CameraStatusCard
          label="Total Registered ANPR Cameras"
          value={summary?.total_registered_cameras || cameras.length}
          subtext="Nationwide Surveillance Nodes"
          color="#0f172a"
          icon={Video}
        />
        <CameraStatusCard
          label="Active ANPR Cameras"
          value={summary?.active_anpr_cameras || 125}
          subtext="Online & Transmitting Feeds"
          color="#10b981"
          icon={Video}
        />
        <CameraStatusCard
          label="Proposed Cameras"
          value={summary?.proposed_cameras || 23}
          subtext="Placement Analysis Queue"
          color="#2563eb"
          icon={Video}
        />
        <CameraStatusCard
          label="Offline / Maintenance"
          value={(summary?.offline_cameras || 8) + (summary?.maintenance_cameras || 9)}
          subtext="Under Field Calibration"
          color="#f59e0b"
          icon={Video}
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: "16px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr", gap: "12px", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "10px", color: "#94a3b8" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by Camera ID, Landmark, City..."
              style={{
                width: "100%",
                padding: "8px 10px 8px 36px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem"
              }}
            />
          </div>

          <select
            value={stateFilter}
            onChange={(e) => handleStateChange(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
          >
            <option value="All">All States / UTs</option>
            {states.map((s) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>

          <select
            value={cityFilter}
            onChange={(e) => { setCityFilter(e.target.value); setCurrentPage(1); }}
            disabled={stateFilter === "All"}
            style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
          >
            <option value="All">All Cities</option>
            {cities.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Proposed">Proposed</option>
            <option value="Offline">Offline</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Cameras Table */}
      <div className="card">
        <div className="card-title">
          <span>Camera Nodes ({filteredCameras.length} matching)</span>
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
            Page {currentPage} of {totalPages}
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Camera ID</th>
                <th>State</th>
                <th>City</th>
                <th>Zone</th>
                <th>Location Landmark</th>
                <th>Road Type</th>
                <th>Status</th>
                <th>Traffic Density</th>
                <th>Daily Volume</th>
                <th>Placement Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCameras.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#2563eb", fontSize: "0.8rem" }}>
                      {c.camera_code}
                    </span>
                  </td>
                  <td>{c.state}</td>
                  <td><b>{c.city}</b></td>
                  <td>{c.zone || "Central Zone"}</td>
                  <td style={{ maxWidth: "200px" }}>{c.location_name || c.location}</td>
                  <td>
                    <span style={{ fontSize: "0.72rem", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                      {c.road_type}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      c.status === "Active" || c.status === "Online" ? "badge-online" :
                      c.status === "Proposed" ? "badge-low" :
                      c.status === "Offline" ? "badge-offline" : "badge-warning"
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      c.traffic_level === "Critical" ? "badge-critical" :
                      c.traffic_level === "High" ? "badge-high" : "badge-medium"
                    }`}>
                      {c.traffic_level}
                    </span>
                  </td>
                  <td>{(c.estimated_daily_volume || 25000).toLocaleString()} veh</td>
                  <td>
                    <span style={{ fontWeight: 700 }}>{c.placement_score}/100</span>
                  </td>
                  <td>
                    <Link
                      to={`/camera-details?code=${c.camera_code}`}
                      className="btn-secondary"
                      style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                    >
                      <Eye size={13} /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredCameras.length)} of {filteredCameras.length} nodes
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-secondary"
              style={{ padding: "6px 12px", fontSize: "0.75rem" }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary"
              style={{ padding: "6px 12px", fontSize: "0.75rem" }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

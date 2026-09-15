import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles, Filter, CheckCircle2, ArrowRight } from "lucide-react";
import { multiCameraSearchService } from "../services/api";

const DEMO_PLATES = [
  { plate: "TN31AB4589", label: "SIH Multi-Camera Flagship (Pondicherry)", note: "Exact at CAM01, CAM02, CAM04; Typo at CAM03" },
  { plate: "DL01C9876", label: "Security Watchlist Target (Delhi)", note: "Truck corridor cross-junction" },
  { plate: "KA05MJ4421", label: "Speed Violator (Bengaluru)", note: "Fast corridor movement" },
  { plate: "MH12DE5544", label: "Commercial Transport (Mumbai)", note: "City toll entry tracking" }
];

export default function PlateSearch() {
  const navigate = useNavigate();
  const [plateInput, setPlateInput] = useState("TN31AB4589");
  const [includeProbable, setIncludeProbable] = useState(true);
  const [searchScope, setSearchScope] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const cleanPlate = plateInput.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (!cleanPlate) {
      alert("Please enter a registration plate.");
      return;
    }
    navigate(`/vehicle-search/results?plate=${cleanPlate}&probable=${includeProbable ? "true" : "false"}&scope=${searchScope}`);
  };

  const handleQuickSelect = (plate) => {
    setPlateInput(plate);
    navigate(`/vehicle-search/results?plate=${plate}&probable=${includeProbable ? "true" : "false"}&scope=${searchScope}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px", margin: "0 auto" }}>
      {/* Search Hero Card */}
      <div className="card" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)", border: "1px solid #bae6fd", padding: "28px" }}>
        <div style={{ textAlign: "center", marginBottom: "22px" }}>
          <span className="badge badge-exact" style={{ marginBottom: "8px", display: "inline-flex" }}>
            SIH Problem Statement 26127 Prototype
          </span>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>
            Multi-Camera ANPR Vehicle Search Engine
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "6px" }}>
            Enter any vehicle registration number to search across all uploaded CCTV camera video feeds simultaneously. Automatically finds exact sightings and fuzzy OCR typo matches.
          </p>
        </div>

        <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Main Registration Plate Input Box */}
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "6px", display: "block" }}>
              ENTER NUMBER PLATE
            </label>
            <div style={{ position: "relative" }}>
              <Search size={20} style={{ position: "absolute", left: "14px", top: "14px", color: "#94a3b8" }} />
              <input
                type="text"
                value={plateInput}
                onChange={(e) => setPlateInput(e.target.value.toUpperCase())}
                placeholder="e.g. TN31AB4589 or tn 31 ab 4589"
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 46px",
                  borderRadius: "8px",
                  border: "2px solid #3b82f6",
                  fontSize: "1.2rem",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  color: "#0f172a",
                  outline: "none",
                  boxShadow: "0 2px 8px rgba(59,130,246,0.15)"
                }}
              />
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
              * Automatically normalizes spaces and dashes: "tn 31 ab 4589" → "TN31AB4589"
            </div>
          </div>

          {/* Search Configuration Filters */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            {/* Search Scope */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "6px", display: "block" }}>
                SEARCH SCOPE
              </label>
              <div style={{ display: "flex", gap: "12px", fontSize: "0.82rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="scope"
                    checked={searchScope === "ALL"}
                    onChange={() => setSearchScope("ALL")}
                  />
                  <b>All Uploaded Videos</b>
                </label>
              </div>
            </div>

            {/* Match Type */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "6px", display: "block" }}>
                MATCH TYPE
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={includeProbable}
                  onChange={(e) => setIncludeProbable(e.target.checked)}
                />
                <b>Exact + Probable (OCR Typos)</b>
              </label>
            </div>

            {/* Date Filter */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "6px", display: "block" }}>
                RECORDING DATE
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", background: "white" }}
              >
                <option value="ALL">All Dates</option>
                <option value="2026-09-09">2026-09-09 (Demo Date)</option>
              </select>
            </div>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ padding: "12px 24px", fontSize: "1rem", fontWeight: 700, justifyContent: "center" }}
          >
            <Search size={18} /> Search All Camera Videos
          </button>
        </form>
      </div>

      {/* Quick Demo Evaluation Targets */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <Sparkles size={16} color="#4f46e5" />
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>
            SIH 2026 Demo Test Targets (Click to Search Instantly)
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {DEMO_PLATES.map((item) => (
            <div
              key={item.plate}
              onClick={() => handleQuickSelect(item.plate)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                background: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                cursor: "pointer",
                transition: "background 0.15s, border-color 0.15s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#93c5fd"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span className="plate-badge" style={{ fontSize: "1rem", padding: "4px 10px" }}>
                  {item.plate}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a" }}>{item.label}</div>
                  <div style={{ fontSize: "0.74rem", color: "#64748b" }}>{item.note}</div>
                </div>
              </div>

              <span style={{ color: "#2563eb", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", fontWeight: 600 }}>
                Run Search <ArrowRight size={14} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Marker color definitions conforming to SIH guidelines
const STATUS_COLORS = {
  Active: "#10b981",       // Green
  Online: "#10b981",       // Green
  Offline: "#64748b",      // Grey
  Maintenance: "#f59e0b",  // Orange
  Warning: "#f59e0b",      // Orange
  Proposed: "#2563eb",     // Blue
  Critical: "#ef4444"      // Red
};

export default function IndiaNetworkMap({
  cameras = [],
  stateClusters = [],
  cityMarkers = [],
  coverageGaps = [],
  selectedState = null,
  selectedCity = null,
  showGaps = false,
  onStateSelect = null,
  onCitySelect = null,
  onCameraSelect = null,
  zoomLevel = 5,
  height = "100%"
}) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const layersRef = useRef({
    clusters: L.layerGroup(),
    cities: L.layerGroup(),
    cameras: L.layerGroup(),
    gaps: L.layerGroup()
  });

  // Initialize Leaflet Map centered on India [20.5937, 78.9629]
  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapRef.current, {
        center: [21.5, 78.9],
        zoom: zoomLevel,
        zoomControl: true,
        minZoom: 4,
        maxZoom: 18
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors | TraffiTrace AI National Grid",
        maxZoom: 19
      }).addTo(map);

      layersRef.current.clusters.addTo(map);
      layersRef.current.cities.addTo(map);
      layersRef.current.cameras.addTo(map);
      layersRef.current.gaps.addTo(map);

      // Listen to zoom changes to adapt cluster visualization
      map.on("zoomend", () => {
        const currentZoom = map.getZoom();
        // Dynamic zoom handling if needed
      });

      leafletMapRef.current = map;
    }
  }, []);

  // Update Markers based on Zoom & Drilldown State
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    layersRef.current.clusters.clearLayers();
    layersRef.current.cities.clearLayers();
    layersRef.current.cameras.clearLayers();
    layersRef.current.gaps.clearLayers();

    const currentZoom = map.getZoom();

    // 1. Zoomed out to India Level: Display State Clusters if not drilling down into a city
    if (!selectedCity && stateClusters && stateClusters.length > 0) {
      stateClusters.forEach((st) => {
        if (!st.latitude || !st.longitude) return;

        const clusterHtml = `
          <div style="
            background: linear-gradient(135deg, #0b1329 0%, #1e3a8a 100%);
            border: 2px solid #38bdf8;
            color: #ffffff;
            border-radius: 24px;
            padding: 4px 10px;
            font-size: 0.75rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 4px 12px rgba(11, 19, 41, 0.5);
            white-space: nowrap;
            cursor: pointer;
          ">
            <span style="width:8px; height:8px; border-radius:50%; background:#10b981;"></span>
            <span>${st.code || st.name}: <b>${st.total_cameras} Cams</b></span>
          </div>
        `;

        const icon = L.divIcon({
          className: "state-cluster-icon",
          html: clusterHtml,
          iconSize: [110, 30],
          iconAnchor: [55, 15]
        });

        const marker = L.marker([st.latitude, st.longitude], { icon });
        marker.bindPopup(`
          <div style="font-family:sans-serif; min-width:180px;">
            <div style="font-size:0.75rem; color:#64748b; font-weight:700;">STATE ANPR CLUSTER</div>
            <div style="font-size:1.05rem; font-weight:800; color:#0f172a;">${st.name}</div>
            <div style="margin: 6px 0; font-size:0.82rem;">
              Total Cameras: <b>${st.total_cameras}</b><br/>
              Active ANPR: <b style="color:#10b981;">${st.active_cameras}</b> | Proposed: <b style="color:#2563eb;">${st.proposed_cameras}</b>
            </div>
            <button id="btn-drill-${st.id}" style="
              width: 100%;
              background: #2563eb;
              color: white;
              border: none;
              padding: 6px;
              border-radius: 6px;
              font-size: 0.75rem;
              font-weight: 600;
              cursor: pointer;
              margin-top: 4px;
            ">
              Drill Down into State ?
            </button>
          </div>
        `);

        marker.on("popupopen", () => {
          const btn = document.getElementById(`btn-drill-${st.id}`);
          if (btn && onStateSelect) {
            btn.onclick = () => {
              onStateSelect(st);
              map.setView([st.latitude, st.longitude], 8);
            };
          }
        });

        layersRef.current.clusters.addLayer(marker);
      });
    }

    // 2. City Markers when State is Selected
    if (selectedState && cityMarkers && cityMarkers.length > 0 && !selectedCity) {
      cityMarkers.forEach((ct) => {
        const cityIcon = L.divIcon({
          className: "city-marker-icon",
          html: `
            <div style="
              background: #ffffff;
              border: 2px solid #2563eb;
              color: #0f172a;
              border-radius: 8px;
              padding: 4px 8px;
              font-size: 0.75rem;
              font-weight: 700;
              box-shadow: 0 2px 8px rgba(0,0,0,0.25);
              white-space: nowrap;
              cursor: pointer;
            ">
              ?? ${ct.name} (${ct.total_cameras || 0})
            </div>
          `,
          iconSize: [100, 28],
          iconAnchor: [50, 14]
        });

        const marker = L.marker([ct.latitude, ct.longitude], { icon: cityIcon });
        marker.on("click", () => {
          if (onCitySelect) onCitySelect(ct);
          map.setView([ct.latitude, ct.longitude], 12);
        });
        layersRef.current.cities.addLayer(marker);
      });
    }

    // 3. Individual ANPR Cameras (When City Selected or Zoom Level >= 9)
    if (cameras && cameras.length > 0) {
      cameras.forEach((cam) => {
        let pinColor = STATUS_COLORS[cam.status] || STATUS_COLORS.Active;
        if (cam.traffic_level === "Critical" && cam.status === "Active") {
          pinColor = STATUS_COLORS.Critical;
        }

        const camIcon = L.divIcon({
          className: "cam-marker-icon",
          html: `
            <div style="
              background-color: ${pinColor};
              border: 2px solid #ffffff;
              color: white;
              border-radius: 50%;
              width: 28px;
              height: 28px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 800;
              font-size: 0.7rem;
              box-shadow: 0 2px 8px rgba(0,0,0,0.35);
              cursor: pointer;
            ">
              ${cam.is_proposed ? "P" : "C"}
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([cam.latitude, cam.longitude], { icon: camIcon });
        marker.bindPopup(`
          <div style="font-family:sans-serif; min-width:240px; font-size:0.82rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <span style="font-family:monospace; font-weight:700; color:#2563eb;">${cam.camera_code}</span>
              <span style="background:${pinColor}20; color:${pinColor}; padding:2px 6px; border-radius:4px; font-size:0.7rem; font-weight:700;">
                ${cam.status}
              </span>
            </div>
            <div style="font-weight:700; font-size:0.95rem; color:#0f172a;">${cam.name}</div>
            <div style="color:#64748b; font-size:0.75rem; margin-bottom:6px;">
              ${cam.city}, ${cam.state} • ${cam.zone || "Central"}
            </div>
            
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:8px; margin-bottom:8px; line-height:1.4;">
              <div>Road: <b>${cam.road_name || cam.road_type}</b> (${cam.lanes_covered} lanes)</div>
              <div>Type: <b>${cam.location_type}</b></div>
              <div>Traffic Flow: <b style="color:${cam.traffic_level === 'Critical' ? '#ef4444' : '#0f172a'}">${cam.traffic_level}</b> (${(cam.estimated_daily_volume || 25000).toLocaleString()} veh/day)</div>
              <div>Placement Score: <b>${cam.placement_score}/100</b> (${cam.placement_priority})</div>
            </div>

            ${cam.placement_reason ? `<div style="font-size:0.72rem; color:#475569; margin-bottom:8px;"><i>Why here: ${cam.placement_reason}</i></div>` : ""}

            <div style="display:flex; gap:6px;">
              <a href="/search" style="flex:1; text-align:center; background:#2563eb; color:white; padding:5px; border-radius:4px; font-size:0.72rem; font-weight:600; text-decoration:none;">
                View Detections
              </a>
              <a href="/analytics" style="flex:1; text-align:center; background:#f1f5f9; color:#334155; padding:5px; border-radius:4px; font-size:0.72rem; font-weight:600; text-decoration:none;">
                Traffic Flow
              </a>
            </div>
          </div>
        `);

        if (onCameraSelect) {
          marker.on("click", () => onCameraSelect(cam));
        }

        layersRef.current.cameras.addLayer(marker);
      });
    }

    // 4. Coverage Gaps Layer (when enabled)
    if (showGaps && coverageGaps && coverageGaps.length > 0) {
      coverageGaps.forEach((gap) => {
        const circle = L.circle([gap.latitude, gap.longitude], {
          color: "#ef4444",
          fillColor: "#ef4444",
          fillOpacity: 0.25,
          radius: 650,
          dashArray: "6, 6"
        }).bindPopup(`
          <div style="font-family:sans-serif; min-width:180px;">
            <span style="background:#fee2e2; color:#b91c1c; padding:2px 6px; border-radius:4px; font-size:0.7rem; font-weight:700;">
              SURVEILLANCE COVERAGE GAP
            </span>
            <div style="font-weight:700; font-size:0.95rem; margin-top:4px;">${gap.location || gap.city}</div>
            <div style="font-size:0.78rem; color:#64748b;">${gap.road_type} • Score: ${gap.placement_score}</div>
            <div style="font-size:0.72rem; color:#475569; margin-top:4px;">Recommended priority ANPR camera point.</div>
          </div>
        `);
        layersRef.current.gaps.addLayer(circle);
      });
    }

    // Zoom focus adjustment
    if (selectedCity && selectedCity.latitude && selectedCity.longitude) {
      map.setView([selectedCity.latitude, selectedCity.longitude], 12);
    } else if (selectedState && selectedState.latitude && selectedState.longitude) {
      map.setView([selectedState.latitude, selectedState.longitude], 7);
    }
  }, [cameras, stateClusters, cityMarkers, coverageGaps, selectedState, selectedCity, showGaps]);

  return (
    <div style={{ width: "100%", height: height, position: "relative", borderRadius: "10px", overflow: "hidden" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

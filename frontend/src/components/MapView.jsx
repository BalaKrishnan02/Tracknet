import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix standard marker icon issue in Leaflet with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapView({
  center = [11.9425, 79.8250], // Default Pondicherry coordinate
  zoom = 13,
  cameras = [],
  trajectoryPoints = [],
  heatPoints = [],
  selectedCamera = null,
  onCameraClick = null,
  height = "100%"
}) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const layersRef = useRef({
    markers: L.layerGroup(),
    polyline: L.layerGroup(),
    heatCircles: L.layerGroup()
  });

  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      layersRef.current.markers.addTo(map);
      layersRef.current.polyline.addTo(map);
      layersRef.current.heatCircles.addTo(map);

      leafletMapRef.current = map;
    }

    return () => {
      // Cleanup on unmount
    };
  }, []);

  // Update markers and trajectory
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    layersRef.current.markers.clearLayers();
    layersRef.current.polyline.clearLayers();
    layersRef.current.heatCircles.clearLayers();

    // 1. Draw Heat circles if provided
    if (heatPoints && heatPoints.length > 0) {
      heatPoints.forEach((hp) => {
        const color = hp.congestion === "Critical" ? "#ef4444" :
                      hp.congestion === "High" ? "#f97316" :
                      hp.congestion === "Medium" ? "#eab308" : "#10b981";
        
        const circle = L.circle([hp.latitude, hp.longitude], {
          color: color,
          fillColor: color,
          fillOpacity: 0.35,
          radius: 400 + (hp.vehicle_count * 5)
        }).bindPopup(`
          <div style="font-family:sans-serif; min-width:140px;">
            <b style="font-size:0.95rem;">${hp.camera_name || hp.location}</b><br/>
            <span style="color:${color}; font-weight:700;">Congestion: ${hp.congestion}</span><br/>
            <span>Vehicle Count: <b>${hp.vehicle_count}</b></span>
          </div>
        `);
        layersRef.current.heatCircles.addLayer(circle);
      });
    }

    // 2. Draw Camera Markers
    if (cameras && cameras.length > 0) {
      cameras.forEach((cam) => {
        const isOnline = cam.status === "Online";
        const customIcon = L.divIcon({
          className: "custom-div-icon",
          html: `
            <div style="
              background-color: ${isOnline ? "#0f172a" : "#64748b"};
              border: 2px solid ${isOnline ? "#38bdf8" : "#94a3b8"};
              color: white;
              border-radius: 50%;
              width: 30px;
              height: 30px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: 0.72rem;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">
              ${cam.camera_code ? cam.camera_code.replace("CAM", "C") : "C"}
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker([cam.latitude, cam.longitude], { icon: customIcon });
        marker.bindPopup(`
          <div style="font-family:sans-serif; min-width:180px;">
            <div style="font-size:0.75rem; color:#64748b; font-weight:700;">${cam.camera_code}</div>
            <div style="font-size:0.95rem; font-weight:700; margin-bottom:4px;">${cam.name}</div>
            <div style="font-size:0.8rem; color:#475569; margin-bottom:6px;">${cam.location}</div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:0.75rem; padding:2px 6px; border-radius:4px; background:${isOnline ? "#ecfdf5" : "#f1f5f9"}; color:${isOnline ? "#047857" : "#64748b"}; font-weight:600;">
                ${cam.status}
              </span>
              <span style="font-size:0.75rem; color:#64748b;">${cam.vehicle_count_today || 0} vehicles</span>
            </div>
          </div>
        `);

        if (onCameraClick) {
          marker.on("click", () => onCameraClick(cam));
        }

        layersRef.current.markers.addLayer(marker);
      });
    }

    // 3. Draw Trajectory Polylines and Sequential Numbered Waypoints
    if (trajectoryPoints && trajectoryPoints.length > 0) {
      const latLngs = [];

      trajectoryPoints.forEach((pt, index) => {
        const latLng = [pt.latitude, pt.longitude];
        latLngs.push(latLng);

        const isProbable = pt.match_type === "Probable Match";
        const waypointIcon = L.divIcon({
          className: "trajectory-waypoint-icon",
          html: `
            <div style="
              background-color: ${isProbable ? "#f59e0b" : "#2563eb"};
              border: 3px solid #ffffff;
              color: white;
              border-radius: 50%;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 800;
              font-size: 0.85rem;
              box-shadow: 0 4px 12px rgba(37,99,235,0.45);
            ">
              ${pt.sequence_number || index + 1}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const timeFormatted = new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const marker = L.marker(latLng, { icon: waypointIcon });
        marker.bindPopup(`
          <div style="font-family:sans-serif; min-width:200px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <span style="font-weight:700; color:#2563eb;">Stop #${pt.sequence_number || index + 1}</span>
              <span style="font-size:0.75rem; font-family:monospace; color:#64748b;">${timeFormatted}</span>
            </div>
            <div style="font-weight:700; font-size:0.95rem;">${pt.camera_code} – ${pt.camera_name}</div>
            <div style="margin: 6px 0;">
              <span style="font-family:monospace; font-weight:700; background:#fef08a; color:#713f12; padding:2px 6px; border-radius:4px; border:1px solid #ca8a04;">
                ${pt.raw_ocr_text || pt.plate_number}
              </span>
              <span style="font-size:0.75rem; margin-left:6px; color:#64748b;">(${Math.round(pt.match_score * 100)}% match)</span>
            </div>
            <div style="font-size:0.8rem; color:#475569;">
              Speed: <b>${pt.estimated_speed} km/h</b> | Type: <b>${pt.vehicle_type} (${pt.vehicle_color})</b>
            </div>
          </div>
        `);
        layersRef.current.markers.addLayer(marker);
      });

      if (latLngs.length > 1) {
        // Draw polyline
        const polyline = L.polyline(latLngs, {
          color: "#2563eb",
          weight: 4,
          opacity: 0.85,
          dashArray: "8, 8",
          lineCap: "round",
          lineJoin: "round"
        });
        layersRef.current.polyline.addLayer(polyline);

        // Auto-fit bounds
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [50, 50] });
      } else if (latLngs.length === 1) {
        map.setView(latLngs[0], 14);
      }
    }
  }, [cameras, trajectoryPoints, heatPoints]);

  return (
    <div style={{ width: "100%", height: height, position: "relative", borderRadius: "10px", overflow: "hidden" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

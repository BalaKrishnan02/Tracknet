import { MOCK_DATA } from "./mockData.js";

export function handleMockRequest(url = "", method = "get", data = null, params = {}) {
  const cleanUrl = url.replace(/^[a-zA-Z]+:\/\/[^/]+/, "").replace(/^\/api/, "");
  const lowerMethod = (method || "get").toLowerCase();

  // 1. Health check
  if (cleanUrl === "/health" || cleanUrl.startsWith("/health")) {
    return {
      status: "ok",
      app: "TrackNet Cloud Grid Engine",
      version: "1.0.0",
      database: "online",
      database_type: "Active ANPR Node Network",
      active_cameras: MOCK_DATA.cameras.filter((c) => c.status === "Active" || c.status === "Online").length,
      total_cameras: MOCK_DATA.cameras.length,
      mode: "Cloud High-Availability"
    };
  }

  // 2. Auth login
  if (cleanUrl === "/auth/login" || cleanUrl.startsWith("/auth/login")) {
    let parsedData = data;
    if (typeof data === "string") {
      try { parsedData = JSON.parse(data); } catch (e) {}
    }
    const email = parsedData?.email || "admin@traffitrace.ai";
    const isOfficer = email.toLowerCase().includes("officer");
    const role = isOfficer ? "officer" : "admin";
    const name = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || (role === "admin" ? "Commander Admin" : "Traffic Officer");
    return {
      access_token: "tracknet_cloud_token_" + btoa(email + ":" + Date.now()),
      token_type: "bearer",
      user: {
        id: 1,
        email: email,
        name: name,
        role: role,
        badge_number: role === "admin" ? "TN-2026-HQ" : "TN-2026-PATROL",
        department: "National Traffic Surveillance Directorate"
      }
    };
  }

  // 3. Dashboard Summary
  if (cleanUrl === "/dashboard/summary") {
    const totalCameras = MOCK_DATA.cameras.length;
    const activeCams = MOCK_DATA.cameras.filter((c) => c.status === "Active" || c.status === "Online").length;
    const offlineCams = MOCK_DATA.cameras.filter((c) => c.status === "Offline").length;
    const maintenanceCams = MOCK_DATA.cameras.filter((c) => c.status === "Maintenance" || c.status === "Warning").length;
    const proposedCams = MOCK_DATA.cameras.filter((c) => c.status === "Proposed").length;
    const highTraffic = MOCK_DATA.cameras.filter((c) => c.traffic_level === "High").length;
    const critTraffic = MOCK_DATA.cameras.filter((c) => c.traffic_level === "Critical").length;

    const recentDets = MOCK_DATA.vehicle_detections.slice(0, 10).map((d) => {
      const cam = MOCK_DATA.cameras.find((c) => c.id === d.camera_id) || {};
      return {
        ...d,
        camera_name: cam.name || "Main Gateway ANPR",
        camera_location: cam.location || "City Junction",
        camera_city: cam.city || "Mumbai",
        camera_state: cam.state || "Maharashtra"
      };
    });

    return {
      total_registered_cameras: totalCameras,
      active_anpr_cameras: activeCams,
      offline_cameras: offlineCams,
      maintenance_cameras: maintenanceCams,
      proposed_cameras: proposedCams,
      states_covered: MOCK_DATA.states.length,
      cities_covered: MOCK_DATA.cities.length,
      high_traffic_cameras: highTraffic,
      critical_traffic_cameras: critTraffic,
      total_vehicles_today: 548 + MOCK_DATA.vehicle_detections.length,
      active_cameras: activeCams,
      total_cameras: totalCameras,
      total_alerts: MOCK_DATA.alerts.length,
      unread_alerts: MOCK_DATA.alerts.filter((a) => a.status === "Unreviewed").length,
      avg_traffic_level: "Medium",
      vehicles_per_hour: 48,
      most_congested_area: "Central Bus Terminus",
      camera_status_counts: {
        Active: activeCams,
        Offline: offlineCams,
        Maintenance: maintenanceCams,
        Proposed: proposedCams
      },
      recent_detections: recentDets,
      recent_alerts: MOCK_DATA.alerts,
      traffic_level_breakdown: {
        Low: MOCK_DATA.cameras.filter((c) => c.traffic_level === "Low").length,
        Medium: MOCK_DATA.cameras.filter((c) => c.traffic_level === "Medium").length,
        High: highTraffic,
        Critical: critTraffic
      }
    };
  }

  // 4. India Network Summary
  if (cleanUrl === "/network/india/summary") {
    const totalCameras = MOCK_DATA.cameras.length;
    const activeCams = MOCK_DATA.cameras.filter((c) => c.status === "Active" || c.status === "Online").length;
    const offlineCams = MOCK_DATA.cameras.filter((c) => c.status === "Offline").length;
    const maintenanceCams = MOCK_DATA.cameras.filter((c) => c.status === "Maintenance" || c.status === "Warning").length;
    const proposedCams = MOCK_DATA.cameras.filter((c) => c.status === "Proposed").length;

    const stateBreakdown = MOCK_DATA.states.map((s) => {
      const stateCams = MOCK_DATA.cameras.filter((c) => c.state === s.name);
      const act = stateCams.filter((c) => c.status === "Active" || c.status === "Online").length;
      const prop = stateCams.filter((c) => c.status === "Proposed").length;
      const off = stateCams.filter((c) => c.status === "Offline").length;
      const citiesInState = MOCK_DATA.cities.filter((ct) => ct.state_id === s.id).length;
      const covScore = stateCams.length > 0 ? Math.round((act / stateCams.length) * 1000) / 10 : 0;
      return {
        id: s.id,
        code: s.code,
        name: s.name,
        country: s.country,
        latitude: s.latitude,
        longitude: s.longitude,
        total_cities: citiesInState,
        total_cameras: stateCams.length,
        active_cameras: act,
        proposed_cameras: prop,
        offline_cameras: off,
        coverage_score: covScore
      };
    });

    return {
      total_registered_cameras: totalCameras,
      active_anpr_cameras: activeCams,
      offline_cameras: offlineCams,
      maintenance_cameras: maintenanceCams,
      proposed_cameras: proposedCams,
      states_covered: MOCK_DATA.states.length,
      cities_covered: MOCK_DATA.cities.length,
      high_traffic_cameras: MOCK_DATA.cameras.filter((c) => c.traffic_level === "High").length,
      critical_traffic_cameras: MOCK_DATA.cameras.filter((c) => c.traffic_level === "Critical").length,
      coverage_percentage: Math.round((activeCams / Math.max(1, totalCameras)) * 1000) / 10,
      state_breakdown: stateBreakdown
    };
  }

  // 5. States & Cities
  if (cleanUrl === "/network/states") {
    return MOCK_DATA.states.map((s) => {
      const stateCams = MOCK_DATA.cameras.filter((c) => c.state === s.name);
      const act = stateCams.filter((c) => c.status === "Active" || c.status === "Online").length;
      return {
        ...s,
        total_cameras: stateCams.length,
        active_cameras: act,
        total_cities: MOCK_DATA.cities.filter((ct) => ct.state_id === s.id).length
      };
    });
  }

  const stateCitiesMatch = cleanUrl.match(/^\/network\/states\/(\d+)\/cities/);
  if (stateCitiesMatch) {
    const stateId = parseInt(stateCitiesMatch[1], 10);
    return MOCK_DATA.cities.filter((c) => c.state_id === stateId);
  }

  const cityDetailMatch = cleanUrl.match(/^\/network\/cities\/(\d+)$/);
  if (cityDetailMatch) {
    const cityId = parseInt(cityDetailMatch[1], 10);
    return MOCK_DATA.cities.find((c) => c.id === cityId) || MOCK_DATA.cities[0];
  }

  const cityZonesMatch = cleanUrl.match(/^\/network\/cities\/(\d+)\/zones/);
  if (cityZonesMatch) {
    const cityId = parseInt(cityZonesMatch[1], 10);
    return MOCK_DATA.zones.filter((z) => z.city_id === cityId);
  }

  const cityCamerasMatch = cleanUrl.match(/^\/network\/cities\/(\d+)\/cameras/);
  if (cityCamerasMatch) {
    const cityId = parseInt(cityCamerasMatch[1], 10);
    const cityObj = MOCK_DATA.cities.find((c) => c.id === cityId);
    if (!cityObj) return [];
    return MOCK_DATA.cameras.filter((c) => c.city === cityObj.name);
  }

  // 6. Cameras Map / Active
  if (cleanUrl.startsWith("/network/cameras/map") || cleanUrl === "/network/cameras/active" || cleanUrl.startsWith("/network/cameras/active")) {
    return MOCK_DATA.cameras;
  }

  if (cleanUrl === "/network/cameras/offline") {
    return MOCK_DATA.cameras.filter((c) => c.status === "Offline");
  }

  if (cleanUrl === "/network/cameras/proposed") {
    return MOCK_DATA.cameras.filter((c) => c.status === "Proposed");
  }

  if (cleanUrl === "/network/coverage-gaps") {
    return [
      { id: 1, state: "Maharashtra", city: "Pune", zone: "Hinjewadi Phase 3", reason: "High tech-park traffic density with low ANPR sensor coverage", priority: "High", recommended_cameras: 4 },
      { id: 2, state: "Karnataka", city: "Bengaluru", zone: "Outer Ring Road - Bellandur", reason: "Heavy commercial freight bottleneck during night hours", priority: "Critical", recommended_cameras: 6 },
      { id: 3, state: "Delhi", city: "New Delhi", zone: "Dhaula Kuan Junction", reason: "Major tri-route intersection connecting NH48 and ring roads", priority: "High", recommended_cameras: 3 },
      { id: 4, state: "Tamil Nadu", city: "Chennai", zone: "OMR Sholinganallur", reason: "Key arterial corridor with elevated vehicle flow", priority: "Medium", recommended_cameras: 4 }
    ];
  }

  if (cleanUrl === "/network/traffic-hotspots") {
    return [
      { id: 1, name: "Silk Board Flyover", city: "Bengaluru", state: "Karnataka", traffic_level: "Critical", avg_speed_kmh: 12, vehicle_count_hour: 4200 },
      { id: 2, name: "Western Express Highway - Andheri", city: "Mumbai", state: "Maharashtra", traffic_level: "Critical", avg_speed_kmh: 15, vehicle_count_hour: 3850 },
      { id: 3, name: "ITO Intersection", city: "New Delhi", state: "Delhi", traffic_level: "High", avg_speed_kmh: 18, vehicle_count_hour: 3400 }
    ];
  }

  if (cleanUrl === "/network/cities/ranking") {
    return MOCK_DATA.cities.slice(0, 10).map((c, idx) => ({
      rank: idx + 1,
      city_name: c.name,
      state_name: MOCK_DATA.states.find((s) => s.id === c.state_id)?.name || "India",
      total_cameras: MOCK_DATA.cameras.filter((cam) => cam.city === c.name).length || 8,
      active_cameras: MOCK_DATA.cameras.filter((cam) => cam.city === c.name && (cam.status === "Active" || cam.status === "Online")).length || 6,
      coverage_score: 84.5 - idx * 3.2
    }));
  }

  // 7. General Cameras API
  if (cleanUrl === "/cameras" || cleanUrl.startsWith("/cameras?")) {
    return MOCK_DATA.cameras;
  }

  // 8. Vehicle Search & Trajectory
  const searchMatch = cleanUrl.match(/^\/vehicles\/search\/([^/?]+)/);
  if (searchMatch) {
    const term = decodeURIComponent(searchMatch[1]).toUpperCase().replace(/\s+/g, "");
    return MOCK_DATA.vehicle_detections
      .filter((d) => (d.plate_number || "").toUpperCase().replace(/\s+/g, "").includes(term))
      .slice(0, 30)
      .map((d) => {
        const cam = MOCK_DATA.cameras.find((c) => c.id === d.camera_id) || {};
        return {
          ...d,
          camera_name: cam.name || "City Gateway ANPR",
          camera_location: cam.location || "Central Highway",
          camera_city: cam.city || "Mumbai",
          camera_state: cam.state || "Maharashtra",
          latitude: cam.latitude || 19.076,
          longitude: cam.longitude || 72.8777
        };
      });
  }

  const trajMatch = cleanUrl.match(/^\/vehicles\/([^/?]+)\/trajectory/);
  if (trajMatch) {
    const plate = decodeURIComponent(trajMatch[1]).toUpperCase();
    const matches = MOCK_DATA.vehicle_detections
      .filter((d) => (d.plate_number || "").toUpperCase().includes(plate))
      .slice(0, 15);

    return {
      plate_number: plate,
      total_detections: matches.length,
      first_seen: matches[0]?.timestamp || new Date().toISOString(),
      last_seen: matches[matches.length - 1]?.timestamp || new Date().toISOString(),
      trajectory: matches.map((m, idx) => {
        const cam = MOCK_DATA.cameras.find((c) => c.id === m.camera_id) || {};
        return {
          id: m.id,
          sequence: idx + 1,
          camera_id: m.camera_id,
          camera_name: cam.name || `Camera Node ${idx + 1}`,
          location: cam.location || "Arterial Highway",
          city: cam.city || "Mumbai",
          state: cam.state || "Maharashtra",
          latitude: cam.latitude || 19.076 + idx * 0.02,
          longitude: cam.longitude || 72.8777 + idx * 0.02,
          timestamp: m.timestamp,
          speed: m.speed || 55,
          confidence: m.confidence || 0.94
        };
      })
    };
  }

  // 9. Detections Recent
  if (cleanUrl.startsWith("/detections/recent")) {
    return MOCK_DATA.vehicle_detections.slice(0, 20).map((d) => {
      const cam = MOCK_DATA.cameras.find((c) => c.id === d.camera_id) || {};
      return {
        ...d,
        camera_name: cam.name || "Highway ANPR",
        camera_location: cam.location || "City Entry Toll",
        camera_city: cam.city || "Mumbai"
      };
    });
  }

  // 10. Alerts & Watchlist
  if (cleanUrl === "/alerts" || cleanUrl.startsWith("/alerts?")) {
    return MOCK_DATA.alerts;
  }

  if (cleanUrl === "/watchlist" || cleanUrl.startsWith("/watchlist?")) {
    return MOCK_DATA.watchlist;
  }

  // 11. Analytics
  if (cleanUrl === "/analytics/traffic") {
    return {
      hourly_volumes: [
        { hour: "06:00", count: 420, avg_speed: 68 },
        { hour: "08:00", count: 1250, avg_speed: 34 },
        { hour: "10:00", count: 1480, avg_speed: 28 },
        { hour: "12:00", count: 980, avg_speed: 42 },
        { hour: "14:00", count: 1050, avg_speed: 40 },
        { hour: "16:00", count: 1390, avg_speed: 31 },
        { hour: "18:00", count: 1820, avg_speed: 22 },
        { hour: "20:00", count: 1450, avg_speed: 35 },
        { hour: "22:00", count: 760, avg_speed: 58 }
      ],
      vehicle_type_distribution: {
        Car: 58,
        Motorcycle: 22,
        SUV: 12,
        Truck: 5,
        Bus: 3
      },
      speed_compliance: {
        within_limit: 88.4,
        overspeeding: 11.6
      }
    };
  }

  if (cleanUrl === "/analytics/origin-destination") {
    return [
      { origin: "Mumbai Central", destination: "Bandra Kurla Complex", count: 340, avg_travel_time_mins: 28 },
      { origin: "Thane Toll Plaza", destination: "Navi Mumbai Vashi", count: 290, avg_travel_time_mins: 35 },
      { origin: "Delhi South Ext", destination: "Noida Sector 18", count: 410, avg_travel_time_mins: 22 },
      { origin: "Bengaluru Koramangala", destination: "Whitefield ITPL", count: 380, avg_travel_time_mins: 45 }
    ];
  }

  // 12. Videos & Multi-Camera Search
  if (cleanUrl === "/videos" || cleanUrl.startsWith("/videos?")) {
    return [
      { id: 1, filename: "camera_node_mumbai_toll_01.mp4", size: 14500000, status: "Analyzed", detections_count: 48, created_at: new Date(Date.now() - 3600000).toISOString() },
      { id: 2, filename: "camera_node_delhi_ring_02.mp4", size: 22100000, status: "Analyzed", detections_count: 72, created_at: new Date(Date.now() - 7200000).toISOString() }
    ];
  }

  if (cleanUrl.startsWith("/vehicle-search") || cleanUrl === "/video-search") {
    return {
      query_plate: params.plate_number || "ALL",
      total_matches: 12,
      matches: MOCK_DATA.vehicle_detections.slice(0, 8).map((d, i) => {
        const cam = MOCK_DATA.cameras.find((c) => c.id === d.camera_id) || {};
        return {
          id: d.id,
          camera_id: d.camera_id,
          camera_name: cam.name || `ANPR Junction ${i + 1}`,
          location: cam.location || "City Transit Ring",
          city: cam.city || "Mumbai",
          timestamp: d.timestamp,
          plate_number: d.plate_number,
          vehicle_type: d.vehicle_type || "Sedan",
          color: d.color || "White",
          confidence: d.confidence || 0.96,
          similarity_score: 95.4 - i * 2.1
        };
      })
    };
  }

  // Fallback default
  return { ok: true, message: "Handled by TrackNet Cloud Grid Engine" };
}

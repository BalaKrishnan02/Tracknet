import api from "./api";

export const networkService = {
  getIndiaSummary: () => api.get("/network/india/summary").then((r) => r.data),
  getStates: () => api.get("/network/states").then((r) => r.data),
  getStateDetail: (stateId) => api.get(`/network/states/${stateId}`).then((r) => r.data),
  getStateCities: (stateId) => api.get(`/network/states/${stateId}/cities`).then((r) => r.data),
  getCityDetail: (cityId) => api.get(`/network/cities/${cityId}`).then((r) => r.data),
  getCityZones: (cityId) => api.get(`/network/cities/${cityId}/zones`).then((r) => r.data),
  getCityCameras: (cityId) => api.get(`/network/cities/${cityId}/cameras`).then((r) => r.data),
  getCityCoverage: (cityId) => api.get(`/network/cities/${cityId}/coverage`).then((r) => r.data),
  getCamerasMap: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "" && val !== "All") {
        query.append(key, val);
      }
    });
    return api.get(`/network/cameras/map?${query.toString()}`).then((r) => r.data);
  },
  getActiveCameras: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/network/cameras/active?${query}`).then((r) => r.data);
  },
  getOfflineCameras: () => api.get("/network/cameras/offline").then((r) => r.data),
  getProposedCameras: () => api.get("/network/cameras/proposed").then((r) => r.data),
  getCoverageGaps: () => api.get("/network/coverage-gaps").then((r) => r.data),
  getTrafficHotspots: () => api.get("/network/traffic-hotspots").then((r) => r.data),
  getCityRankings: () => api.get("/network/cities/ranking").then((r) => r.data),
};

export const cameraPlanningService = {
  analyzeCity: (state, city, zone) =>
    api.post("/camera-placement/analyze", { state, city, zone }).then((r) => r.data),
  proposeCamera: (data) =>
    api.post("/camera-placement/propose", data).then((r) => r.data),
  activateCamera: (id) =>
    api.post(`/camera-placement/${id}/activate`).then((r) => r.data),
};

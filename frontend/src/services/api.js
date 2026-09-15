import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("traffitrace_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data.access_token) {
      localStorage.setItem("traffitrace_token", res.data.access_token);
      localStorage.setItem("traffitrace_user", JSON.stringify(res.data.user));
    }
    return res.data;
  },
  logout: () => {
    localStorage.removeItem("traffitrace_token");
    localStorage.removeItem("traffitrace_user");
  },
  getCurrentUser: () => {
    const user = localStorage.getItem("traffitrace_user");
    return user ? JSON.parse(user) : null;
  }
};

export const dashboardService = {
  getSummary: () => api.get("/dashboard/summary").then(r => r.data),
};

export const cameraService = {
  getAll: () => api.get("/cameras").then(r => r.data),
  create: (data) => api.post("/cameras", data).then(r => r.data),
  update: (id, data) => api.put(`/cameras/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/cameras/${id}`).then(r => r.data),
  processVideo: (cameraId) => {
    const fd = new FormData();
    fd.append("camera_id", cameraId);
    return api.post("/video/process", fd).then(r => r.data);
  }
};

export const vehicleService = {
  search: (plate) => api.get(`/vehicles/search/${encodeURIComponent(plate)}`).then(r => r.data),
  getTrajectory: (plate) => api.get(`/vehicles/${encodeURIComponent(plate)}/trajectory`).then(r => r.data),
  getRecentDetections: (limit = 20) => api.get(`/detections/recent?limit=${limit}`).then(r => r.data),
};

export const analyticsService = {
  getTraffic: () => api.get("/analytics/traffic").then(r => r.data),
  getODMatrix: () => api.get("/analytics/origin-destination").then(r => r.data),
};

export const alertService = {
  getAll: (status, priority) => {
    let url = "/alerts";
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (priority) params.append("priority", priority);
    if (params.toString()) url += `?${params.toString()}`;
    return api.get(url).then(r => r.data);
  },
  markReviewed: (id) => api.put(`/alerts/${id}/review`).then(r => r.data),
  delete: (id) => api.delete(`/alerts/${id}`).then(r => r.data),
};

export const watchlistService = {
  getAll: () => api.get("/watchlist").then(r => r.data),
  add: (data) => api.post("/watchlist", data).then(r => r.data),
  remove: (id) => api.delete(`/watchlist/${id}`).then(r => r.data),
};

export const videoService = {
  upload: (formData) => api.post("/videos/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }).then(r => r.data),
  getAll: () => api.get("/videos").then(r => r.data),
  getById: (id) => api.get(`/videos/${id}`).then(r => r.data),
  analyze: (id) => api.post(`/videos/${id}/analyze`).then(r => r.data),
  getStatus: (id) => api.get(`/videos/${id}/analysis-status`).then(r => r.data),
  getDetections: (id) => api.get(`/videos/${id}/detections`).then(r => r.data),
  delete: (id) => api.delete(`/videos/${id}`).then(r => r.data),
  seedDemoBundle: () => api.post("/videos/seed-demo-bundle").then(r => r.data),
};

export const multiCameraSearchService = {
  search: (data) => api.post("/vehicle-search", data).then(r => r.data),
  confirmMatch: (detectionId, decision, notes = "") => api.post("/vehicle-search/confirm-match", {
    detection_id: detectionId,
    decision,
    notes
  }).then(r => r.data),
  getDetectionDetails: (id) => api.get(`/vehicle-search/detection/${id}`).then(r => r.data),
};

export default api;

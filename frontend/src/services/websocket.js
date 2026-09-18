import { getApiBaseUrl } from "./api";

class LiveWebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = [];
    this.reconnectInterval = 3000;
  }

  connect() {
    let wsUrl = import.meta.env.VITE_WS_URL;
    if (!wsUrl) {
      const base = getApiBaseUrl().replace(/\/api\/?$/, "");
      wsUrl = base.replace(/^https:/, "wss:").replace(/^http:/, "ws:") + "/ws/live-detections";
    }
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("Connected to TrackNet Live WebSocket Feed:", wsUrl);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.listeners.forEach((listener) => listener(data));
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      this.ws.onclose = () => {
        console.log("WebSocket closed. Attempting reconnect in 3s...");
        setTimeout(() => this.connect(), this.reconnectInterval);
      };

      this.ws.onerror = (err) => {
        console.warn("WebSocket error:", err);
      };
    } catch (e) {
      console.error("Failed to establish WebSocket connection:", e);
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }
}

export const liveWs = new LiveWebSocketService();

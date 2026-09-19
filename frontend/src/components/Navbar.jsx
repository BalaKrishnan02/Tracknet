import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ShieldCheck, Activity, User, LogOut } from "lucide-react";
import { authService } from "../services/api";

export default function Navbar({ title, unreadAlerts = 0, onLogout }) {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const user = authService.getCurrentUser() || { name: "Commander Admin", role: "admin" };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    try {
      authService.logout();
      if (onLogout) onLogout();
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <h2 className="page-title">{title}</h2>
      </div>

      <div className="navbar-right">
        <div className="system-status-pill">
          <span className="status-dot-pulse"></span>
          AI Live Grid: Operational
        </div>

        <div style={{ fontSize: "0.82rem", color: "#64748b", fontFamily: "var(--font-mono)", fontWeight: 500 }}>
          {currentTime.toLocaleTimeString()} IST
        </div>

        <div style={{ position: "relative" }}>
          <button className="btn-icon" title="Alerts" onClick={() => navigate("/alerts")}>
            <Bell size={18} />
            {unreadAlerts > 0 && (
              <span style={{
                position: "absolute",
                top: "2px",
                right: "2px",
                background: "#ef4444",
                color: "white",
                borderRadius: "50%",
                fontSize: "0.65rem",
                width: "16px",
                height: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700
              }}>
                {unreadAlerts}
              </span>
            )}
          </button>
        </div>

        <div className="user-badge" style={{ paddingLeft: "8px", borderLeft: "1px solid var(--border-subtle)" }}>
          <div className="user-avatar">{user.name?.charAt(0) || "A"}</div>
          <div className="user-details">
            <div className="name">{user.name || "Administrator"}</div>
            <div className="role">{user.role || "admin"}</div>
          </div>
        </div>

        <button
          className="btn-icon"
          title="Logout"
          style={{ color: "#ef4444" }}
          onClick={handleLogout}
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}

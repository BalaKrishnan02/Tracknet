import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UploadCloud,
  PlayCircle,
  Video,
  Search,
  Layers,
  Clock,
  Route,
  BarChart3,
  AlertTriangle,
  Sliders,
  Settings as SettingsIcon,
  Radio,
  Globe2
} from "lucide-react";

export default function Sidebar() {
  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/videos/upload", label: "Video Upload", icon: UploadCloud },
    { to: "/videos/analysis", label: "Video Analysis", icon: PlayCircle },
    { to: "/active-cameras", label: "Active ANPR Cameras", icon: Video },
    { to: "/vehicle-search", label: "Plate Search", icon: Search },
    { to: "/vehicle-search/results", label: "Multi-Camera Search", icon: Layers },
    { to: "/vehicle-search/timeline", label: "Vehicle Timeline", icon: Clock },
    { to: "/vehicle-search/trajectory", label: "Trajectory Tracking", icon: Route },
    { to: "/analytics", label: "Traffic Analytics", icon: BarChart3 },
    { to: "/alerts", label: "Alerts", icon: AlertTriangle },
    { to: "/camera-management", label: "Camera Management", icon: Sliders },
    { to: "/india-network", label: "India ANPR Network", icon: Globe2 },
    { to: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-wrap">
          <img src="/logo.png" alt="TrackNet Logo" className="sidebar-logo-img" />
        </div>
        <div className="logo-text">
          <h1>TrackNet</h1>
          <span>AI Vehicle Tracking</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontSize: "0.72rem", color: "#64748b", textAlign: "center" }}>
          TrackNet Platform v1.2.0<br/>AI-Powered Multi-Camera ANPR Grid
        </div>
      </div>
    </aside>
  );
}

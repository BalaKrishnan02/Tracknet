import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from "recharts";
import { BarChart3, TrendingUp, Car, MapPin, Clock, ArrowRight } from "lucide-react";
import StatCard from "../components/StatCard";
import { analyticsService } from "../services/api";

const PIE_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function TrafficAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getTraffic()
      .then((res) => setData(res))
      .catch((err) => console.error("Error loading analytics:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Aggregating City Traffic Analytics...</div>;
  }

  // Format vehicle counts for pie chart
  const vehicleTypeData = Object.entries(data?.vehicle_counts_by_type || {}).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Header */}
      <div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>City-Wide Traffic Analytics & Flow Trends</h2>
        <p style={{ fontSize: "0.82rem", color: "#64748b" }}>
          Aggregated ANPR vehicle volumes, modal split, hourly distributions, and Origin-Destination flow matrices
        </p>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid">
        <StatCard label="Total Vehicle Volume" value={data?.total_vehicles_today?.toLocaleString() || "524"} icon={Car} color="#2563eb" />
        <StatCard label="Peak Traffic Window" value={data?.peak_traffic_hour || "09:00 AM"} icon={Clock} color="#ef4444" subtitle="Rush Hour Peak" />
        <StatCard label="Busiest Origin Node" value={data?.busiest_origin || "Bus Stand"} icon={MapPin} color="#f59e0b" subtitle="Major feeder hub" />
        <StatCard label="Busiest Corridor" value="Bus Stand ? Main Rd" icon={TrendingUp} color="#10b981" subtitle="198 vehicles/hr" />
      </div>

      {/* Chart Grid: Hourly Traffic Trend + Modal Split */}
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "20px" }}>
        {/* Hourly Trend (Area Chart) */}
        <div className="card">
          <div className="card-title">
            <span>Hourly City Traffic Volume (Cars vs Total)</span>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Today 07:00 - 19:00</span>
          </div>
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.hourly_trend || []}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCars" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="count" name="Total Vehicles" stroke="#2563eb" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
                <Area type="monotone" dataKey="cars" name="Cars" stroke="#10b981" fillOpacity={1} fill="url(#colorCars)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Modal Split (Pie Chart) */}
        <div className="card">
          <div className="card-title">
            <span>Vehicle Type Distribution</span>
          </div>
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {vehicleTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Origin - Destination Traffic Matrix Table */}
      <div className="card">
        <div className="card-title">
          <span>Origin-Destination (OD) Traffic Flow Matrix</span>
          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Multi-Camera Corridor Analysis</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Corridor Route (Origin ? Destination)</th>
                <th>Volume (Vehicles)</th>
                <th>Avg Transit Duration</th>
                <th>Congestion Density</th>
              </tr>
            </thead>
            <tbody>
              {(data?.od_matrix || []).map((od, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: "#0f172a" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {od.origin} <ArrowRight size={14} color="#2563eb" /> {od.destination}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontFamily: "var(--font-mono)" }}>{od.count}</span> vehicles
                  </td>
                  <td>{od.avg_duration_mins} mins</td>
                  <td>
                    <span className={`badge ${od.count > 130 ? "badge-critical" : (od.count > 80 ? "badge-medium" : "badge-low")}`}>
                      {od.count > 130 ? "High Congestion" : (od.count > 80 ? "Moderate Flow" : "Smooth Flow")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

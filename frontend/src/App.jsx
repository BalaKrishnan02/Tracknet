import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CameraMonitoring from "./pages/CameraMonitoring";
import VehicleSearch from "./pages/VehicleSearch";
import TrajectoryMap from "./pages/TrajectoryMap";
import TrafficAnalytics from "./pages/TrafficAnalytics";
import TrafficMap from "./pages/TrafficMap";
import Alerts from "./pages/Alerts";
import Watchlist from "./pages/Watchlist";
import CameraManagement from "./pages/CameraManagement";
import Settings from "./pages/Settings";

// New Module Pages
import IndiaANPRNetwork from "./pages/IndiaANPRNetwork";
import ActiveANPRCameras from "./pages/ActiveANPRCameras";
import CityCameraPlanning from "./pages/CityCameraPlanning";
import CameraCoverage from "./pages/CameraCoverage";
import CameraDetails from "./pages/CameraDetails";
// Multi-Camera Video Pipeline Pages
import VideoUpload from "./pages/VideoUpload";
import VideoAnalysis from "./pages/VideoAnalysis";
import VideoAnalysisDetails from "./pages/VideoAnalysisDetails";
import PlateSearch from "./pages/PlateSearch";
import MultiCameraResults from "./pages/MultiCameraResults";
import VehicleTimeline from "./pages/VehicleTimeline";
import VehicleTrajectory from "./pages/VehicleTrajectory";
import DetectionDetails from "./pages/DetectionDetails";


import { liveWs } from "./services/websocket";

function ProtectedLayout({ children, pageTitle, unreadAlerts }) {
  const isAuth = !!localStorage.getItem("traffitrace_token");
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar title={pageTitle} unreadAlerts={unreadAlerts} />
        <main className="page-body">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  const [unreadAlerts, setUnreadAlerts] = useState(1);

  useEffect(() => {
    // Connect WebSocket
    liveWs.connect();

    const unsubscribe = liveWs.subscribe((data) => {
      if (data.alert) {
        setUnreadAlerts((prev) => prev + 1);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        
        {/* Multi-Camera Video Ingestion & Analysis */}
        <Route path="/videos/upload" element={
          <ProtectedLayout pageTitle="CCTV Camera Video Ingestion Center" unreadAlerts={unreadAlerts}>
            <VideoUpload />
          </ProtectedLayout>
        } />
        <Route path="/videos/analysis" element={
          <ProtectedLayout pageTitle="CCTV Video AI Analysis Hub" unreadAlerts={unreadAlerts}>
            <VideoAnalysis />
          </ProtectedLayout>
        } />
        <Route path="/videos/:id/analysis" element={
          <ProtectedLayout pageTitle="CCTV Video Detection Inspection" unreadAlerts={unreadAlerts}>
            <VideoAnalysisDetails />
          </ProtectedLayout>
        } />

        {/* Multi-Camera Vehicle Search, Timeline, Trajectory */}
        <Route path="/vehicle-search" element={
          <ProtectedLayout pageTitle="Plate Number Search" unreadAlerts={unreadAlerts}>
            <PlateSearch />
          </ProtectedLayout>
        } />
        <Route path="/vehicle-search/results" element={
          <ProtectedLayout pageTitle="Multi-Camera Search Results" unreadAlerts={unreadAlerts}>
            <MultiCameraResults />
          </ProtectedLayout>
        } />
        <Route path="/vehicle-search/timeline" element={
          <ProtectedLayout pageTitle="Vehicle Multi-Camera Timeline" unreadAlerts={unreadAlerts}>
            <VehicleTimeline />
          </ProtectedLayout>
        } />
        <Route path="/vehicle-search/trajectory" element={
          <ProtectedLayout pageTitle="Vehicle Multi-Camera Trajectory Map" unreadAlerts={unreadAlerts}>
            <VehicleTrajectory />
          </ProtectedLayout>
        } />
        <Route path="/detections/:id" element={
          <ProtectedLayout pageTitle="ANPR Detection Details Inspection" unreadAlerts={unreadAlerts}>
            <DetectionDetails />
          </ProtectedLayout>
        } />

        <Route path="/" element={
          <ProtectedLayout pageTitle="Command Center Dashboard" unreadAlerts={unreadAlerts}>
            <Dashboard />
          </ProtectedLayout>
        } />

        <Route path="/india-network" element={
          <ProtectedLayout pageTitle="India-Wide Active ANPR Camera Network" unreadAlerts={unreadAlerts}>
            <IndiaANPRNetwork />
          </ProtectedLayout>
        } />

        <Route path="/active-cameras" element={
          <ProtectedLayout pageTitle="Active ANPR Cameras Directory" unreadAlerts={unreadAlerts}>
            <ActiveANPRCameras />
          </ProtectedLayout>
        } />

        <Route path="/city-planning" element={
          <ProtectedLayout pageTitle="City ANPR Camera Placement Analysis" unreadAlerts={unreadAlerts}>
            <CityCameraPlanning />
          </ProtectedLayout>
        } />

        <Route path="/coverage-analysis" element={
          <ProtectedLayout pageTitle="City Camera Coverage Analysis" unreadAlerts={unreadAlerts}>
            <CameraCoverage />
          </ProtectedLayout>
        } />

        <Route path="/camera-details" element={
          <ProtectedLayout pageTitle="ANPR Camera Node Telemetry" unreadAlerts={unreadAlerts}>
            <CameraDetails />
          </ProtectedLayout>
        } />

        <Route path="/cameras" element={
          <ProtectedLayout pageTitle="Live ANPR Camera Feeds" unreadAlerts={unreadAlerts}>
            <CameraMonitoring />
          </ProtectedLayout>
        } />

        <Route path="/search" element={
          <ProtectedLayout pageTitle="Vehicle Search & History" unreadAlerts={unreadAlerts}>
            <VehicleSearch />
          </ProtectedLayout>
        } />

        <Route path="/trajectory" element={
          <ProtectedLayout pageTitle="GIS Trajectory Tracking" unreadAlerts={unreadAlerts}>
            <TrajectoryMap />
          </ProtectedLayout>
        } />

        <Route path="/analytics" element={
          <ProtectedLayout pageTitle="Traffic Volume & Analytics" unreadAlerts={unreadAlerts}>
            <TrafficAnalytics />
          </ProtectedLayout>
        } />

        <Route path="/traffic-map" element={
          <ProtectedLayout pageTitle="City Traffic Congestion Heatmap" unreadAlerts={unreadAlerts}>
            <TrafficMap />
          </ProtectedLayout>
        } />

        <Route path="/alerts" element={
          <ProtectedLayout pageTitle="Watchlist & Traffic Alerts" unreadAlerts={unreadAlerts}>
            <Alerts />
          </ProtectedLayout>
        } />

        <Route path="/watchlist" element={
          <ProtectedLayout pageTitle="Authorized Watchlist" unreadAlerts={unreadAlerts}>
            <Watchlist />
          </ProtectedLayout>
        } />

        <Route path="/camera-management" element={
          <ProtectedLayout pageTitle="Camera Node Infrastructure" unreadAlerts={unreadAlerts}>
            <CameraManagement />
          </ProtectedLayout>
        } />

        <Route path="/settings" element={
          <ProtectedLayout pageTitle="System Settings & Privacy" unreadAlerts={unreadAlerts}>
            <Settings />
          </ProtectedLayout>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

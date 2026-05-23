import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

import Home from "./components/home";
import AuthPage from "./components/auth";
import Dashboard from "./components/dashboard";
import VideoMeet from "./components/videoMeet";
import History from "./components/history";

function App() {
  // Check for the token to protect the route
  const isAuthenticated = () => {
    return localStorage.getItem("isLoggedIn") === "true";
  };

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<AuthPage />} />

        {/* Guest route */}
        <Route
          path="/join-meeting/:myfirstmeetingroom678"
          element={<VideoMeet />}
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={isAuthenticated() ? <Dashboard /> : <Navigate to="/login" />}
        />

        <Route
          path="/history"
          element={isAuthenticated() ? <History /> : <Navigate to="/login" />}
        />

        <Route path="/meeting/:url" element={<VideoMeet />} />

        {/* Fallback for undefined routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;

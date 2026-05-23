import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../App.css";

const History = () => {
  const navigate = useNavigate();
  // For meeting details in the card
  const [meetings, setMeetings] = useState([]);
  const [username, setUsername] = useState("");
  // Total card details
  const [currentIndex, setCurrentIndex] = useState(0);
  // Waiting for server response
  const [loading, setLoading] = useState(true);

  //  Get the meeting details from DB
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/get_all_activity",
          { withCredentials: true },
        );
        setMeetings(response.data.meetings);
        setUsername(response.data.username);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch history:", err);
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Right arrow function
  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1 === meetings.length ? 0 : prev + 1));
  };

  // Left arrow function
  const prevCard = () => {
    setCurrentIndex((prev) => (prev === 0 ? meetings.length - 1 : prev - 1));
  };

  const handleLogOut = async () => {
    try {
      await axios.post(
        "http://localhost:3000/logout",
        {},
        { withCredentials: true },
      );
      localStorage.removeItem("isLoggedIn");
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="scenic-bg container-fluid p-0 vh-100">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark px-5 shadow">
        <a className="navbar-brand fw-bold" href="/dashboard">
          MeetME
        </a>
        <div className="ms-auto d-flex align-items-center">
          <ul className="navbar-nav me-3 flex-row">
            <li className="nav-item mx-2">
              <a
                className="nav-link"
                href="#"
                onClick={() => navigate("/dashboard")}
              >
                Join Meeting
              </a>
            </li>
            <li className="nav-item mx-2">
              <a className="nav-link active fw-bold" href="#">
                History
              </a>
            </li>
          </ul>
          <div className="dropdown">
            <button
              className="btn btn-light"
              type="button"
              onClick={handleLogOut}
            >
              👤
            </button>
          </div>
        </div>
      </nav>

      <div className="container h-75 d-flex flex-column justify-content-center align-items-center text-white">
        <h2 className="mb-4 fw-light">
          Past Meetings for <strong>{username}</strong>
        </h2>

        {loading ? (
          <div className="spinner-border text-light" role="status"></div>
        ) : meetings.length > 0 ? (
          <div className="d-flex align-items-center justify-content-center w-100">
            {/* Left arrow */}
            <button
              className="btn btn-outline-light rounded-circle me-4 p-3"
              onClick={prevCard}
            >
              &#10094;
            </button>

            {/* Meeting card */}
            <div
              className="card text-dark shadow-lg p-4 text-center border-0"
              style={{
                width: "400px",
                borderRadius: "20px",
                minHeight: "250px",
              }}
            >
              <div className="card-body d-flex flex-column justify-content-center">
                <h5 className="text-muted small text-uppercase mb-3">
                  Meeting Details
                </h5>
                <h3 className="fw-bold mb-2">
                  {meetings[currentIndex].meetingId}
                </h3>
                <p className="text-muted mb-0">
                  {/* Formatted date */}
                  {new Date(
                    meetings[currentIndex].createdAt,
                  ).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-muted small">
                  {new Date(
                    meetings[currentIndex].createdAt,
                  ).toLocaleTimeString()}
                </p>
                <div className="mt-3">
                  <span className="badge bg-primary rounded-pill px-3">
                    Session {currentIndex + 1} of {meetings.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Right arrow */}
            <button
              className="btn btn-outline-light rounded-circle ms-4 p-3"
              onClick={nextCard}
            >
              &#10095;
            </button>
          </div>
        ) : (
          <div className="glass-card p-4 text-center text-dark">
            <p className="mb-0">
              No meeting history found. Start a call to see it here!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;

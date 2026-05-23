import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import axios from "axios";

const Dashboard = () => {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");

  let handleJoinVideoCall = async (e) => {
    e.preventDefault();
    if (localStorage.getItem("isLoggedIn") === "true") {
      try {
        // withCredentials so the backend knows the user's identity
        await axios.post(
          "http://localhost:3000/add_to_activity",
          { meetingId: meetingCode },
          { withCredentials: true },
        );
      } catch (err) {
        console.error(
          "Failed to join meeting:",
          err.response?.data?.message || err.message,
        );
      }
    }

    navigate(`/meeting/${meetingCode}`);
  };

  const handleLogOut = async () => {
    try {
      await axios.post(
        "http://localhost:3000/logout",
        {},
        { withCredentials: true },
      );
      // Clear the flag for UI
      localStorage.removeItem("isLoggedIn");
      // Redirect to login
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="scenic-bg ontainer-fluid p-0">
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
                onClick={() => {
                  navigate("/history");
                }}
              >
                History
              </a>
            </li>
          </ul>

          {/* Profile icon for Logout */}
          <div className="dropdown">
            <button
              className="btn btn-light "
              type="button"
              onClick={handleLogOut}
            >
              <i className="bi bi-person-fill"></i> 👤
            </button>
          </div>
        </div>
      </nav>

      <div className="container pt-5 text-white">
        <h2 className="fw-light text-center pt-5">Hello, User!</h2>
        <h3 className="text-center">Ready to bridge the distance?</h3>
        {/* User input for meeting code */}
        <form
          className="d-flex align-items-end justify-content-center"
          onSubmit={handleJoinVideoCall}
        >
          <div className="form-group mx-sm-3 my-5 ">
            <label htmlFor="meeting-code" className="text-md text-light mb-2">
              Enter Your Meeting Code Here
            </label>
            <input
              type="text"
              className="form-control"
              id="meeting-code"
              placeholder="eg:myfirstmeeting6078"
              onChange={(e) => setMeetingCode(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary  my-5">
            Join
          </button>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;

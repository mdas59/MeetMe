import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="container-fluid p-0 overflow-y-hidden">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light px-4 py-4">
        <a className="navbar-brand fw-bold" href="/">
          MeetME
        </a>
        <div className="ms-auto">
          <button
            className="btn btn-outline-primary me-2"
            onClick={() => navigate("/login")}
          >
            Log In
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/meeting/meetingroom85")}
          >
            Join as Guest
          </button>
        </div>
      </nav>

      <div className=" mt-5 text-center">
        <div className="row">
          {/* Product tagline */}
          <div className="col text-center my-5 py-5">
            <h1 className="display-3 fw-bold">MeetME</h1>
            <p className="lead italic">"Dur hoke bhi paas lagte ho"</p>
          </div>
          {/* Visualiser */}
          <div className="col mb-4">
            <img
              src="https://illustrations.popsy.co/white/video-call.svg"
              alt="Video Call Illustration"
              className="hero-phone-img"
              style={{ width: "500px" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

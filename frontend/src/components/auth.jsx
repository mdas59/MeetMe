import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";
const AuthPage = () => {
  const navigate = useNavigate();
  // State to toggle between 'login' and 'signup'
  const [isLogin, setIsLogin] = useState(true);

  // State for form data
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
  });

  const [validated, setValidated] = useState(false);
  const [error, setError] = useState("");
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    const form = e.currentTarget;
    e.preventDefault();
    // Check if the form is valid according to HTML5 attributes
    if (form.checkValidity() === false) {
      setError("");
      e.stopPropagation();
    } else {
      try {
        let response;
        const config = { withCredentials: true }; //  for cookies
        if (isLogin) {
          response = await axios.post(
            "http://localhost:3000/login",
            formData,
            config,
          );
        } else {
          response = await axios.post(
            "http://localhost:3000/signup",
            formData,
            config,
          );
        }
        if (response.status === 201 || response.status === 200) {
          console.log("success", response.status);

          // We can't read httpOnly cookies via JS, we set a flag for the UI guard
          localStorage.setItem("isLoggedIn", "true");
          // Redirect the user to the dashboard
          navigate("/dashboard");
        }
      } catch (err) {
        const message =
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Something went wrong";
        setError(message);
        console.error("Login failed due to Auth Error:", message);
      }
    }
    setValidated(true);
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="scenic-bg container-fluid p-0">
      <div className="container-fluid auth-container">
        <div className="row w-100 g-0 align-items-center">
          {/*  Scenic View  */}
          <div className="col-md-6 d-none d-md-flex flex-column align-items-center justify-content-center text-white p-5">
            <h2 className="display-4 fw-bold text-shadow">
              Bridge the Distance
            </h2>
            <p className="lead text-center">
              Experience seamless connectivity with MeetME.
            </p>
          </div>

          {/* Auth Card */}
          <div className="col-md-6 py-3 d-flex align-items-center justify-content-center">
            <div
              className="glass-card w-100 mx-3"
              style={{ maxWidth: "450px" }}
            >
              <div className="text-center mb-4">
                <h3 className="fw-bold">
                  {isLogin ? "Welcome Back" : "Join MeetME"}
                </h3>
                <p className="text-muted small">
                  {isLogin
                    ? "Please enter your details to login"
                    : "Create an account to start meeting"}
                </p>
              </div>
              {error && (
                <div className="alert alert-danger py-2 px-3 mb-3 border-0 shadow-sm">
                  <strong className="small">Error: </strong>
                  <span className="small">{error}</span>
                </div>
              )}
              <form
                className={`needs-validation ${validated ? "was-validated" : ""}`}
                noValidate
                onSubmit={handleSubmit}
              >
                {!isLogin && (
                  <>
                    <div className="mb-3">
                      <label className="form-label small fw-bold">
                        Username
                      </label>
                      <input
                        type="text"
                        name="username"
                        className="form-control"
                        placeholder="JohnDoe"
                        onChange={handleChange}
                        required
                      />
                      <div className="invalid-feedback">
                        Please provide a unique username.
                      </div>
                      <div className="valid-feedback">Looks good!</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        name="phone"
                        className="form-control"
                        placeholder="+91..."
                        onChange={handleChange}
                        required
                      />
                      <div className="invalid-feedback">
                        Please provide a valid phone number.
                      </div>
                      <div className="valid-feedback">Looks good!</div>
                    </div>
                  </>
                )}

                <div className="mb-3">
                  <label className="form-label small fw-bold">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="name@example.com"
                    onChange={handleChange}
                    required
                  />
                  <div className="invalid-feedback">
                    Please provide a valid email
                  </div>
                  <div className="valid-feedback">Looks good!</div>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-bold">Password</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    placeholder="••••••••"
                    onChange={handleChange}
                    required
                    minLength="6"
                  />
                  <div className="invalid-feedback">
                    PPassword must be at least 6 characters.
                  </div>
                  <div className="valid-feedback">Looks good!</div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 fw-bold"
                >
                  {isLogin ? "Log In" : "Sign Up"}
                </button>
              </form>

              {/* Card Toggler */}
              <div className="text-center mt-4">
                <p className="small mb-0">
                  {isLogin ? "New to MeetME?" : "Already have an account?"}
                  <button
                    className="btn btn-link btn-sm fw-bold text-decoration-none"
                    onClick={() => setIsLogin(!isLogin)}
                  >
                    {isLogin ? "Create an account" : "Log in here"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

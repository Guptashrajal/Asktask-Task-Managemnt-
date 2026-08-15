import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";
import ThemeToggle from "../components/ThemeToggle.jsx";
import "./auth.css";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/auth/login", {
        email: form.email.trim(),
        password: form.password,
      });

      console.log("LOGIN RESPONSE:", response.data);

      const { token, user } = response.data || {};

      if (!token) {
        throw new Error("Login succeeded but no authentication token was returned.");
      }

      // Use ONE token name throughout the application.
      localStorage.setItem("smarttask_token", token);

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      // Remove the old token key if it exists.
      localStorage.removeItem("token");

      window.location.href = "/dashboard";
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to sign in. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-theme">
        <ThemeToggle />
      </div>

      <div className="auth-layout">
        <aside className="auth-visual">
          <div className="auth-brand">
            <div className="auth-logo" aria-hidden="true">AT</div>

            <div>
              <strong>AskTask</strong>
              <span>Task Management</span>
            </div>
          </div>

          <div className="auth-visual-copy">
            <span className="mini-label">SMART WORKSPACE</span>

            <h2>Get your day under control.</h2>

            <p>
              Organize tasks, stay ahead of deadlines, and keep your
              priorities clear from one focused workspace.
            </p>
          </div>

          <div className="auth-visual-foot">
            <span className="auth-pill">Tasks</span>
            <span className="auth-pill">Reminders</span>
            <span className="auth-pill">AI insights</span>
          </div>
        </aside>

        <main className="auth-panel">
          <div className="auth-card-modern">
            <div className="auth-icon">→</div>

            <h1>Welcome back</h1>

            <p className="subtitle">
              Sign in to continue to your AskTask workspace.
            </p>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >
              <label className="auth-field">
                <span>Email address</span>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loading}
                  required
                />
              </label>

              <label className="auth-field">
                <div className="auth-password-row">
                  <span>Password</span>

                  <Link
                    className="auth-link"
                    to="/forgot-password"
                  >
                    Forgot password?
                  </Link>
                </div>

                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />
              </label>

              <button
                className="auth-submit"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Signing in..."
                  : "Sign In"}
              </button>
            </form>

            <p className="auth-switch">
              Don't have an account?{" "}
              <Link to="/register">
                Create an account
              </Link>
            </p>

            <p className="auth-note">
              Your workspace is protected by secure
              token-based authentication.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";
import ThemeToggle from "../components/ThemeToggle.jsx";
import "./auth.css";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
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

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password
    ) {
      setError("Please complete all fields.");
      return;
    }

    if (form.password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/auth/register", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      console.log("REGISTER RESPONSE:", response.data);

      const { token, user } = response.data || {};

      if (!token) {
        throw new Error(
          "Registration succeeded but no authentication token was returned."
        );
      }

      // Use ONE token name throughout the application.
      localStorage.setItem(
        "smarttask_token",
        token
      );

      if (user) {
        localStorage.setItem(
          "user",
          JSON.stringify(user)
        );
      }

      // Remove the old token key if it exists.
      localStorage.removeItem("token");

      window.location.href = "/dashboard";
    } catch (err) {
      console.error("REGISTER ERROR:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to create your account. Please try again."
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
            <span className="mini-label">
              START ORGANIZING
            </span>

            <h2>
              Build a workspace that works for you.
            </h2>

            <p>
              Create your account and bring tasks,
              priorities, reminders, and progress
              together in one place.
            </p>
          </div>

          <div className="auth-visual-foot">
            <span className="auth-pill">Simple</span>
            <span className="auth-pill">Focused</span>
            <span className="auth-pill">Productive</span>
          </div>
        </aside>

        <main className="auth-panel">
          <div className="auth-card-modern">
            <div className="auth-icon">+</div>

            <h1>Create account</h1>

            <p className="subtitle">
              Start managing your tasks with AskTask.
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
                <span>Name</span>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  autoComplete="name"
                  disabled={loading}
                  required
                />
              </label>

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
                <span>Password</span>

                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  minLength={6}
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
                  ? "Creating account..."
                  : "Create Account"}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account?{" "}
              <Link to="/login">
                Sign in
              </Link>
            </p>

            <p className="auth-note">
              Create your AskTask workspace and
              start managing your work.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";
import ThemeToggle from "../components/ThemeToggle.jsx";
import "./auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post(
        "/auth/forgot-password",
        {
          email: email.trim(),
        }
      );

      setMessage(
        response.data?.message ||
          "If an account exists with that email, a password reset link has been sent."
      );
    } catch (err) {
      console.error(
        "FORGOT PASSWORD ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to process your request."
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
              ACCOUNT SECURITY
            </span>

            <h2>
              Get back into your workspace.
            </h2>

            <p>
              Reset your password securely and
              continue managing your tasks.
            </p>
          </div>

          <div className="auth-visual-foot">
            <span className="auth-pill">
              Secure
            </span>

            <span className="auth-pill">
              Private
            </span>

            <span className="auth-pill">
              AskTask
            </span>
          </div>
        </aside>

        <main className="auth-panel">
          <div className="auth-card-modern">
            <div className="auth-icon">
              🔑
            </div>

            <h1>
              Forgot your password?
            </h1>

            <p className="subtitle">
              Enter your email and we'll send
              you a secure password reset link.
            </p>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            {message && (
              <div className="auth-success">
                {message}
              </div>
            )}

            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >
              <label className="auth-field">
                <span>
                  Email address
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
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
                  ? "Sending..."
                  : "Send Reset Link"}
              </button>
            </form>

            <p className="auth-switch">
              Remember your password?{" "}
              <Link to="/login">
                Sign in
              </Link>
            </p>

            <p className="auth-note">
              Reset links expire after 15 minutes.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
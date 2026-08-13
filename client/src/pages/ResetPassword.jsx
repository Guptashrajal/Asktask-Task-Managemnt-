import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import API from "../api";
import ThemeToggle from "../components/ThemeToggle.jsx";
import "./auth.css";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!token || token === "undefined") {
      setError(
        "This password reset link is invalid."
      );
      return;
    }

    if (!password || !confirmPassword) {
      setError(
        "Please enter and confirm your new password."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await API.post(
        `/auth/reset-password/${encodeURIComponent(
          token
        )}`,
        {
          password,
        }
      );

      setMessage(
        response.data?.message ||
          "Your password has been changed successfully."
      );

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (err) {
      console.error(
        "RESET PASSWORD ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to reset your password."
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
            <div className="auth-logo">
              ✓
            </div>

            <div>
              <strong>
                SmartTask
              </strong>

              <span>
                Task Management
              </span>
            </div>
          </div>

          <div className="auth-visual-copy">
            <span className="mini-label">
              ACCOUNT SECURITY
            </span>

            <h2>
              Secure your SmartTask account.
            </h2>

            <p>
              Choose a new password and
              get back to your workspace.
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
              Protected
            </span>
          </div>
        </aside>

        <main className="auth-panel">
          <div className="auth-card-modern">
            <div className="auth-icon">
              🔑
            </div>

            <h1>
              Create a new password
            </h1>

            <p className="subtitle">
              Choose a new password for
              your SmartTask account.
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

            {!message && (
              <form
                className="auth-form"
                onSubmit={handleSubmit}
              >
                <label className="auth-field">
                  <span>
                    New password
                  </span>

                  <input
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    disabled={loading}
                    required
                  />
                </label>

                <label className="auth-field">
                  <span>
                    Confirm password
                  </span>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="Confirm new password"
                    autoComplete="new-password"
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
                    ? "Resetting..."
                    : "Reset Password"}
                </button>
              </form>
            )}

            <p className="auth-switch">
              <Link to="/login">
                Back to Sign In
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


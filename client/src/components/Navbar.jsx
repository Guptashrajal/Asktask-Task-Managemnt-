import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function Icon({ type }) {
  const paths = {
    dashboard: (
      <>
        <path d="M3 11.5L12 4l9 7.5" />
        <path d="M5.5 10.5V20h13v-9.5" />
        <path d="M9.5 20v-5h5v5" />
      </>
    ),

    tasks: (
      <path d="M5 12l4 4L19 6" />
    ),

    ai: (
      <path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z" />
    ),

    logout: (
      <>
        <path d="M10 5H5v14h5" />
        <path d="M14 8l4 4-4 4" />
        <path d="M9 12h9" />
      </>
    ),

    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="M4.93 4.93l1.41 1.41" />
        <path d="M17.66 17.66l1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="M4.93 19.07l1.41-1.41" />
        <path d="M17.66 6.34l1.41-1.41" />
      </>
    ),

    moon: (
      <path d="M20 15.5A8.5 8.5 0 018.5 4 8.5 8.5 0 1020 15.5z" />
    ),

    sparkle: (
      <path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z" />
    )
  };

  return (
    <svg
      className="nav-svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[type]}
    </svg>
  );
}

function cleanName(name) {
  if (!name) return "there";

  const cleaned = String(name)
    .replace(/\?+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "there";
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [dark, setDark] = useState(
    localStorage.getItem("smarttask_theme") === "dark"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);

    localStorage.setItem(
      "smarttask_theme",
      dark ? "dark" : "light"
    );
  }, [dark]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userName = cleanName(user?.name);

  return (
    <>
      <aside className="sidebar">

        <Link to="/dashboard" className="brand-block">
          <div className="brand-logo" aria-hidden="true">AT</div>

          <div>
            <div className="brand-name">
              AskTask
            </div>

            <div className="brand-subtitle">
              TASK MANAGEMENT
            </div>
          </div>
        </Link>

        <div className="sidebar-label">
          WORKSPACE
        </div>

        <nav className="sidebar-nav">

          <Link
            to="/dashboard"
            className={`sidebar-link ${
              location.pathname === "/dashboard"
                ? "active"
                : ""
            }`}
          >
            <Icon type="dashboard" />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/tasks"
            className={`sidebar-link ${
              location.pathname === "/tasks"
                ? "active"
                : ""
            }`}
          >
            <Icon type="tasks" />
            <span>My Tasks</span>
          </Link>

          <Link
            to="/ai-insights"
            className={`sidebar-link ${
              location.pathname === "/ai-insights"
                ? "active"
                : ""
            }`}
          >
            <Icon type="ai" />
            <span>AI Insights</span>
          </Link>

        </nav>

        <div className="sidebar-bottom">

          <div className="focus-card">
            <div className="focus-icon">
              <Icon type="sparkle" />
            </div>

            <div>
              <strong>
                Stay focused
              </strong>

              <span>
                Prioritize what matters most.
              </span>
            </div>
          </div>

          <button
            className="logout-link"
            onClick={handleLogout}
          >
            <Icon type="logout" />
            <span>Logout</span>
          </button>

        </div>

      </aside>

      <header className="topbar">

        <div className="topbar-spacer" />

        <button
          className="theme-toggle"
          onClick={() => setDark((value) => !value)}
        >
          <Icon
            type={dark ? "sun" : "moon"}
          />

          <span>
            {dark ? "Light" : "Dark"}
          </span>
        </button>

        <div className="topbar-divider" />

        <div className="user-workspace">

          <div className="user-avatar">
            {userName.charAt(0).toUpperCase()}
          </div>

          <div className="user-info">
            <strong>
              {userName}
            </strong>

            <span>
              Workspace
            </span>
          </div>

        </div>

      </header>
    </>
  );
}

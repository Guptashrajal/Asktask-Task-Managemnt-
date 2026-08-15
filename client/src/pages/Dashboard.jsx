import { useEffect, useMemo, useState } from "react";
import API from "../api";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { useAuth } from "../context/AuthContext";
import "./dashboard.css";

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "general",
  priority: "medium",
  status: "pending",
  dueDate: "",
  reminderAt: "",
};

export default function Dashboard() {
  const { user, logout, updateProfile } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [taskScope, setTaskScope] = useState("all");
  const [sortOrder, setSortOrder] = useState("due-asc");
  const [dueFilter, setDueFilter] = useState("all");

  const [error, setError] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [scheduleRange, setScheduleRange] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [now, setNow] = useState(Date.now());

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSummary, setAiSummary] = useState(null);

  // Close profile and notification popovers when clicking outside them.
  // Clicking inside either popup keeps it open.
  useEffect(() => {
    const handleOutsideClick = (event) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const clickedInsideProfile =
        target.closest(".st-profile-wrap");

      const clickedInsideNotifications =
        target.closest(".st-notification-popover") ||
        target.closest(".notification-btn");

      if (!clickedInsideProfile) {
        setProfileOpen(false);
      }

      if (!clickedInsideNotifications) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");

      // Load the complete task list once. Search and filters are handled
      // locally so the top search bar does not depend on a backend search
      // implementation.
      const response = await API.get("/tasks");
      const data = response.data?.tasks ?? response.data ?? [];

      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("LOAD TASKS ERROR:", err);
      setError(
        err.response?.data?.message ||
        "Unable to load tasks. Please check your connection."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const getStatus = (task) =>
    task.status || (task.completed ? "completed" : "pending");

  const isCompleted = (task) => getStatus(task) === "completed";

  const isOverdue = (task) =>
    !isCompleted(task) &&
    task.dueDate &&
    new Date(task.dueDate).getTime() < now;

  const isReminderDue = (task) =>
    !isCompleted(task) &&
    task.reminderAt &&
    new Date(task.reminderAt).getTime() <= now;

  const reminderTasks = useMemo(
    () =>
      tasks
        .filter((task) => isOverdue(task) || isReminderDue(task))
        .sort(
          (a, b) =>
            new Date(a.reminderAt || a.dueDate || 0) -
            new Date(b.reminderAt || b.dueDate || 0)
        ),
    [tasks, now]
  );

  const upcomingTasks = useMemo(
    () =>
      tasks
        .filter(
          (task) =>
            !isCompleted(task) &&
            task.reminderAt &&
            new Date(task.reminderAt).getTime() > now
        )
        .sort(
          (a, b) =>
            new Date(a.reminderAt) - new Date(b.reminderAt)
        ),
    [tasks, now]
  );

  useEffect(() => {
    const task = reminderTasks[0];
    if (
      !task ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    const key =
      `smarttask-notified-${task._id}-${task.reminderAt || task.dueDate}`;

    if (sessionStorage.getItem(key)) return;

    try {
      new Notification("AskTask", {
        body: isOverdue(task)
          ? `Overdue: ${task.title}`
          : `Reminder: ${task.title}`,
      });
      sessionStorage.setItem(key, "true");
    } catch {
      // Browser notifications unavailable.
    }
  }, [reminderTasks, now]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(isCompleted).length;
  const pendingTasks = totalTasks - completedTasks;
  const highPriorityTasks = tasks.filter(
    (task) => task.priority === "high"
  ).length;

  const taskCounts = useMemo(() => ({
    all: tasks.length,
    active: tasks.filter((task) => !isCompleted(task)).length,
    completed: tasks.filter(isCompleted).length,
    overdue: tasks.filter(isOverdue).length,
  }), [tasks, now]);

  const displayTasks = useMemo(() => {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + (7 - today.getDay()));
    weekEnd.setHours(23, 59, 59, 999);

    const query = search.trim().toLowerCase();

    let result = tasks.filter((task) => {
      if (query) {
        const searchableText = [
          task.title,
          task.description,
          task.category,
          task.priority,
          task.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(query)) return false;
      }

      if (priorityFilter && task.priority !== priorityFilter) return false;

      if (taskScope === "active" && isCompleted(task)) return false;
      if (taskScope === "completed" && !isCompleted(task)) return false;
      if (taskScope === "overdue" && !isOverdue(task)) return false;

      if (dueFilter === "today") {
        if (!task.dueDate) return false;
        const due = new Date(task.dueDate);
        due.setHours(0, 0, 0, 0);
        if (due.getTime() !== today.getTime()) return false;
      }

      if (dueFilter === "this-week") {
        if (!task.dueDate) return false;
        const due = new Date(task.dueDate);
        if (due < today || due > weekEnd) return false;
      }

      if (dueFilter === "no-date" && task.dueDate) return false;
      return true;
    });

    result.sort((a, b) => {
      if (sortOrder === "created-desc") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortOrder === "priority") {
        const rank = { high: 3, medium: 2, low: 1 };
        return (rank[b.priority] || 0) - (rank[a.priority] || 0);
      }
      if (sortOrder === "title") {
        return (a.title || "").localeCompare(b.title || "");
      }
      return new Date(a.dueDate || 8640000000000000) - new Date(b.dueDate || 8640000000000000);
    });

    return result;
  }, [tasks, search, priorityFilter, taskScope, dueFilter, sortOrder, now]);

  const startOfLocalDay = (value) => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const endOfLocalDay = (value) => {
    const date = new Date(value);
    date.setHours(23, 59, 59, 999);
    return date;
  };

  const parseDateInput = (value, endOfDay = false) => {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (endOfDay) date.setHours(23, 59, 59, 999);
    else date.setHours(0, 0, 0, 0);
    return date;
  };

  const scheduleWindow = useMemo(() => {
    const today = startOfLocalDay(now);

    if (scheduleRange === "tomorrow") {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { start: tomorrow, end: endOfLocalDay(tomorrow) };
    }

    if (scheduleRange === "this-week") {
      const weekStart = new Date(today);
      const day = weekStart.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      weekStart.setDate(weekStart.getDate() + mondayOffset);
      return {
        start: weekStart,
        end: (() => {
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          return endOfLocalDay(weekEnd);
        })(),
      };
    }

    if (scheduleRange === "custom") {
      const start = parseDateInput(customStart);
      const end = parseDateInput(customEnd, true);
      return start && end && start <= end ? { start, end } : null;
    }

    return { start: today, end: endOfLocalDay(today) };
  }, [scheduleRange, customStart, customEnd, now]);

  const scheduledTasks = useMemo(() => {
    if (!scheduleWindow) return [];

    return tasks
      .filter((task) => {
        if (!task.dueDate) return false;
        const due = new Date(task.dueDate);
        return due >= scheduleWindow.start && due <= scheduleWindow.end;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [tasks, scheduleWindow]);

  const scheduledTaskGroups = useMemo(() => {
    const groups = new Map();
    scheduledTasks.forEach((task) => {
      const key = startOfLocalDay(task.dueDate).toISOString().slice(0, 10);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(task);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [scheduledTasks]);

  const focusTasks = useMemo(
    () =>
      tasks
        .filter((task) => !isCompleted(task))
        .sort((a, b) => {
          const aScore =
            (isOverdue(a) ? 100 : 0) +
            (a.priority === "high" ? 30 : a.priority === "medium" ? 15 : 0);
          const bScore =
            (isOverdue(b) ? 100 : 0) +
            (b.priority === "high" ? 30 : b.priority === "medium" ? 15 : 0);

          if (bScore !== aScore) return bScore - aScore;
          return new Date(a.dueDate || 8640000000000000) -
            new Date(b.dueDate || 8640000000000000);
        })
        .slice(0, 4),
    [tasks, now]
  );

  const upcomingDueTasks = useMemo(
    () =>
      tasks
        .filter(
          (task) =>
            !isCompleted(task) &&
            task.dueDate &&
            new Date(task.dueDate).getTime() >= now
        )
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5),
    [tasks, now]
  );

  const openAiSummary = async () => {
    setActiveView("ai");
    if (!aiSummary && !aiLoading && tasks.length > 0) {
      await summarizeTasks();
    }
  };

  const openReferencedTask = async (taskId) => {
    if (!taskId) return;

    // The current task list can be filtered by search/priority, so the
    // AI-referenced task may not be present in the local `tasks` array.
    // Fetch the user's full task list as a safe fallback before opening it.
    let task = tasks.find((item) => String(item._id) === String(taskId));

    try {
      if (!task) {
        const response = await API.get("/tasks");
        const allTasks = response.data?.tasks ?? response.data ?? [];
        task = Array.isArray(allTasks)
          ? allTasks.find((item) => String(item._id) === String(taskId))
          : null;
      }
    } catch (err) {
      console.error("OPEN AI REFERENCED TASK ERROR:", err);
    }

    if (!task) {
      setError("That task could not be found. Please refresh your tasks and try again.");
      return;
    }

    setActiveView("tasks");
    openEditTask(task);
  };

  const openAddTask = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setModalOpen(true);
    setSidebarOpen(false);
  };

  const openEditTask = (task) => {
    setEditingId(task._id);
    setForm({
      title: task.title || "",
      description: task.description || "",
      category: task.category || "general",
      priority: task.priority || "medium",
      status: getStatus(task),
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 10)
        : "",
      reminderAt: task.reminderAt
        ? new Date(task.reminderAt).toISOString().slice(0, 16)
        : "",
    });
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Task title is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim() || "general",
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || null,
        reminderAt: form.reminderAt || null,
      };

      if (editingId) {
        await API.put(`/tasks/${editingId}`, payload);
      } else {
        await API.post("/tasks", payload);
      }

      closeModal();
      await loadTasks();
    } catch (err) {
      console.error("TASK SAVE ERROR:", err);
      setError(
        err.response?.data?.message ||
        "Unable to save task."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (task) => {
    try {
      setError("");

      await API.put(`/tasks/${task._id}`, {
        status: isCompleted(task) ? "pending" : "completed",
        completed: !isCompleted(task),
      });

      await loadTasks();
    } catch (err) {
      console.error("STATUS ERROR:", err);
      setError(
        err.response?.data?.message ||
        "Unable to update task."
      );
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;

    try {
      setError("");
      await API.delete(`/tasks/${taskId}`);
      await loadTasks();
    } catch (err) {
      console.error("DELETE ERROR:", err);
      setError(
        err.response?.data?.message ||
        "Unable to delete task."
      );
    }
  };

const summarizeTasks = async () => {
  try {
    setAiLoading(true);
    setAiError("");
    setAiSummary(null);

    const response = await API.post("/ai/summarize");

    console.log(
      "AI SUMMARY RESPONSE:",
      response.data
    );

    const summary =
      response?.data?.summary;

    if (
      !summary ||
      typeof summary !== "object"
    ) {
      throw new Error(
        "Invalid AI summary received from server."
      );
    }

    setAiSummary(summary);
  } catch (err) {
    console.error(
      "AI SUMMARY ERROR:",
      err
    );

    setAiSummary(null);

    setAiError(
      err.response?.data?.message ||
        err.message ||
        "Unable to summarize your tasks."
    );
  } finally {
    setAiLoading(false);
  }
};


  const formatDate = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString(undefined, {
      dateStyle: "medium",
    });
  };

  const formatDateTime = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };


  const initials = (user?.name || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="st-app">
      {sidebarOpen && (
        <button
          className="st-sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`st-sidebar ${sidebarOpen ? "open" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="st-sidebar-brand">
          <div className="st-logo" aria-hidden="true">AT</div>
          <div className="st-brand-copy">
            <strong>AskTask</strong>
            <span>Task Management</span>
          </div>
        </div>

        <nav className="st-sidebar-nav">
          <button
            className={activeView === "dashboard" ? "active" : ""}
            title="Dashboard"
            onClick={() => setActiveView("dashboard")}
          >
            <span className="st-nav-icon">&#8962;</span>
            <span className="st-nav-label">Dashboard</span>
          </button>

          <button
            className={activeView === "tasks" ? "active" : ""}
            title="Manage My Tasks"
            onClick={() => setActiveView("tasks")}
          >
            <span className="st-nav-icon">&#10003;</span>
            <span className="st-nav-label">Manage My Tasks</span>
            <b>{totalTasks}</b>
          </button>

          <button
            className={activeView === "schedule" ? "active" : ""}
            title="Schedule"
            onClick={() => setActiveView("schedule")}
          >
            <span className="st-nav-icon">&#9633;</span>
            <span className="st-nav-label">Schedule</span>
          </button>

          <button
            className={activeView === "ai" ? "active" : ""}
            title="AI Summary"
            onClick={openAiSummary}
          >
            <span className="st-nav-icon">&#10022;</span>
            <span className="st-nav-label">AI Summary</span>
          </button>
        </nav>
      </aside>

      <div className="st-main">
        <header className="st-topbar">
          <div className="st-topbar-left">
            <button
              className="st-mobile-menu"
              onClick={() => {
                if (window.innerWidth <= 820) {
                  setSidebarOpen(true);
                } else {
                  setSidebarCollapsed((value) => !value);
                }
              }}
              aria-label="Toggle navigation sidebar"
              title="Toggle sidebar"
            >
              &#9776;
            </button>

            <div className="st-search-wrap">
              <span aria-hidden="true">&#128269;</span>
              <input
                value={search}
                onChange={(event) => {
                  const value = event.target.value;
                  setSearch(value);

                  // The global search bar opens Manage My Tasks when the
                  // user starts searching, where the filtered results are
                  // displayed.
                  if (value.trim()) {
                    setActiveView("tasks");
                  }
                }}
                placeholder="Search tasks..."
                aria-label="Search tasks"
              />
            </div>
          </div>

          <div className="st-breadcrumb">
            <span>Workspace</span>
            <b>/</b>
            <strong>{activeView === "dashboard" ? "Dashboard" : activeView === "tasks" ? "Manage My Tasks" : activeView === "schedule" ? "Schedule" : "AI Summary"}</strong>
          </div>

          <div className="st-top-actions">
            <button
              className="st-icon-btn notification-btn"
              onClick={() => {
                setNotificationOpen((value) => !value);
                setProfileOpen(false);
              }}
              aria-label="Notifications"
            >
              &#128276;
              {reminderTasks.length > 0 && (
                <span className="st-badge">
                  {reminderTasks.length > 9
                    ? "9+"
                    : reminderTasks.length}
                </span>
              )}
            </button>

            <div className="st-profile-wrap">
              <button
                className="st-profile-trigger"
                onClick={() => {
                  setProfileOpen((value) => !value);
                  setNotificationOpen(false);
                }}
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
              >
                <span className="st-avatar">{initials}</span>
                <span className="st-profile-trigger-copy">
                  <strong>{user?.name || "User"}</strong>
                  <small>Profile</small>
                </span>
                <span className="st-profile-chevron">&#9662;</span>
              </button>

              {profileOpen && (
  <div
    className="st-profile-menu"
    onMouseDown={(event) => event.stopPropagation()}
  >
    <div className="st-profile-header">
      <div className="st-avatar">{initials}</div>

      <div>
        <strong>{user?.name || "User"}</strong>
        <span>{user?.email || "Signed in"}</span>
      </div>
    </div>

    {/* Profile */}
    <button
      type="button"
      className="st-profile-menu-item"
      onClick={() => {
        setProfileOpen(false);
        setProfileName(user?.name || "");
        setProfileError("");
        setProfileSuccess("");
        setProfilePanelOpen(true);
      }}
    >
      <span>&#9673;</span>
      <span>Profile</span>
    </button>

    {/* Appearance + Theme Toggle */}
    <div className="st-profile-divider" />

    <div
      className="st-profile-menu-item st-profile-appearance-row"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <span>&#9681;</span>

      <span className="st-profile-appearance-label">
        Appearance
      </span>

      <ThemeToggle />
    </div>

    {/* Logout */}
    <div className="st-profile-divider" />

    <button
      type="button"
      className="st-profile-menu-item logout-item"
      onClick={logout}
    >
      <span>&#10140;</span>
      <span>Logout</span>
    </button>
  </div>
              )}
            </div>
          </div>

          {notificationOpen && (
            <div className="st-notification-popover">
              <div className="st-popover-head">
                <div>
                  <strong>Notifications</strong>
                  <span>
                    {reminderTasks.length} requiring attention
                  </span>
                </div>
                <button
                  onClick={() => setNotificationOpen(false)}
                  aria-label="Close notifications"
                >
                  &times;
                </button>
              </div>

              {reminderTasks.length === 0 ? (
                <div className="st-empty-mini">
                  <span className="st-nav-icon">&#10003;</span>
                  <strong>You're all caught up</strong>
                  <p>No overdue reminders.</p>
                </div>
              ) : (
                <div className="st-notification-list">
                  {reminderTasks.map((task) => (
                    <button
                      key={task._id}
                      className="st-notification-item"
                      onClick={() => openEditTask(task)}
                    >
                      <span className={isOverdue(task) ? "red" : "amber"}>
                        {isOverdue(task) ? "!" : "🔔"}
                      </span>
                      <div>
                        <strong>{task.title}</strong>
                        <small>
                          {isOverdue(task)
                            ? `Overdue • ${formatDate(task.dueDate)}`
                            : `Reminder • ${formatDateTime(task.reminderAt)}`}
                        </small>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </header>

        <main className="st-content">
          {activeView === "dashboard" && (
            <>
              <section className="st-hero dashboard-hero">
                <div>
                  <span className="st-eyebrow">DASHBOARD</span>
                  <h1>Good to see you, <span>{user?.name || "there"}</span></h1>
                  <p>Stay organized, prioritize what matters, and keep moving forward.</p>
                </div>

                <button className="st-primary-btn" onClick={openAddTask}>
                  <span>+</span>
                  Add New Task
                </button>
              </section>

              {error && (
                <div className="st-error">
                  <strong>Something went wrong</strong>
                  <span>{error}</span>
                  <button onClick={() => setError("")} aria-label="Dismiss error">&times;</button>
                </div>
              )}

              <section className="st-stats">
                <div className="st-stat-card">
                  <div className="st-stat-icon blue">&#10003;</div>
                  <div><span>Total Tasks</span><strong>{totalTasks}</strong></div>
                </div>
                <div className="st-stat-card">
                  <div className="st-stat-icon amber">&#9679;</div>
                  <div><span>Pending</span><strong>{pendingTasks}</strong></div>
                </div>
                <div className="st-stat-card">
                  <div className="st-stat-icon green">&#10003;</div>
                  <div><span>Completed</span><strong>{completedTasks}</strong></div>
                </div>
                <div className="st-stat-card">
                  <div className="st-stat-icon red">!</div>
                  <div><span>High Priority</span><strong>{highPriorityTasks}</strong></div>
                </div>
              </section>

              <section className="st-dashboard-ai">
                <div className="st-ai-glow" />
                <div className="st-dashboard-ai-icon">&#10022;</div>
                <div className="st-dashboard-ai-copy">
                  <span className="st-eyebrow purple">AI TASK SNAPSHOT</span>
                  <h2>Your workload at a glance</h2>
                  <p>
                    {totalTasks === 0
                      ? "Create your first task and AskTask will help you understand what needs attention."
                      : `${pendingTasks} pending task${pendingTasks === 1 ? "" : "s"}, ${highPriorityTasks} high-priority, and ${reminderTasks.length} requiring attention.`}
                  </p>
                </div>
                <button
                  className="st-ai-btn"
                  onClick={openAiSummary}
                  disabled={tasks.length === 0}
                >
                  &#10022; View Full Analysis
                </button>
              </section>

              <section className="st-dashboard-grid">
                <div className="st-dashboard-panel">
                  <div className="st-section-head">
                    <div>
                      <span className="st-eyebrow">UP NEXT</span>
                      <h2>Upcoming Tasks</h2>
                    </div>
                    <button className="st-text-link" onClick={() => setActiveView("tasks")}>
                      View all
                    </button>
                  </div>

                  {upcomingDueTasks.length === 0 ? (
                    <div className="st-dashboard-empty">
                      <strong>No upcoming tasks</strong>
                      <p>Your schedule is clear for now.</p>
                    </div>
                  ) : (
                    <div className="st-dashboard-task-list">
                      {upcomingDueTasks.map((task) => (
                        <button
                          key={task._id}
                          className="st-dashboard-task"
                          onClick={() => {
                            setActiveView("tasks");
                            openEditTask(task);
                          }}
                        >
                          <span className="st-dashboard-check" />
                          <span className="st-dashboard-task-copy">
                            <strong>{task.title}</strong>
                            <small>{formatDate(task.dueDate)}</small>
                          </span>
                          <span className={`st-priority ${task.priority}`}>{task.priority}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="st-dashboard-panel focus-panel">
                  <div className="st-section-head">
                    <div>
                      <span className="st-eyebrow purple">PRIORITY</span>
                      <h2>Top Tasks to Focus On</h2>
                    </div>
                    <button className="st-text-link" onClick={() => setActiveView("tasks")}>
                      View all
                    </button>
                  </div>

                  {focusTasks.length === 0 ? (
                    <div className="st-dashboard-empty">
                      <strong>Nothing needs your focus</strong>
                      <p>Complete a task or add something new.</p>
                    </div>
                  ) : (
                    <div className="st-dashboard-task-list">
                      {focusTasks.map((task) => (
                        <button
                          key={task._id}
                          className="st-dashboard-task"
                          onClick={() => {
                            setActiveView("tasks");
                            openEditTask(task);
                          }}
                        >
                          <span className={`st-focus-dot ${isOverdue(task) ? "danger" : ""}`} />
                          <span className="st-dashboard-task-copy">
                            <strong>{task.title}</strong>
                            <small>
                              {isOverdue(task)
                                ? `Overdue • ${formatDate(task.dueDate)}`
                                : task.dueDate
                                  ? `Due ${formatDate(task.dueDate)}`
                                  : "No due date"}
                            </small>
                          </span>
                          <span className={`st-priority ${task.priority}`}>{task.priority}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {activeView === "tasks" && (
            <section className="st-task-section phase-view">
              <section className="st-task-hero">
                <div>
                  <span className="st-eyebrow">WORKSPACE</span>
                  <h1>Manage My Tasks</h1>
                  <p>Create, organize, prioritize, and complete your existing tasks from one place.</p>
                </div>
                <button className="st-primary-btn" onClick={openAddTask}>
                  <span>+</span> Add New Task
                </button>
              </section>

              {error && (
                <div className="st-error">
                  <strong>Something went wrong</strong>
                  <span>{error}</span>
                  <button onClick={() => setError("")} aria-label="Dismiss error">&times;</button>
                </div>
              )}

              <div className="st-task-summary-grid">
                <button className={`st-task-summary-card ${taskScope === "all" ? "active" : ""}`} onClick={() => { setTaskScope("all"); }}>
                  <span>All tasks</span><strong>{taskCounts.all}</strong>
                </button>
                <button className={`st-task-summary-card ${taskScope === "active" ? "active" : ""}`} onClick={() => { setTaskScope("active"); }}>
                  <span>Active</span><strong>{taskCounts.active}</strong>
                </button>
                <button className={`st-task-summary-card ${taskScope === "completed" ? "active" : ""}`} onClick={() => { setTaskScope("completed"); }}>
                  <span>Completed</span><strong>{taskCounts.completed}</strong>
                </button>
                <button className={`st-task-summary-card danger ${taskScope === "overdue" ? "active" : ""}`} onClick={() => { setTaskScope("overdue"); }}>
                  <span>Overdue</span><strong>{taskCounts.overdue}</strong>
                </button>
              </div>

              <div className="st-task-toolbar">
                <div className="st-filter-group">
                  <span>Filter</span>
                  <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} aria-label="Filter by priority">
                    <option value="">All priorities</option>
                    <option value="high">High priority</option>
                    <option value="medium">Medium priority</option>
                    <option value="low">Low priority</option>
                  </select>
                  <select value={dueFilter} onChange={(e) => setDueFilter(e.target.value)} aria-label="Filter by due date">
                    <option value="all">All due dates</option>
                    <option value="today">Due today</option>
                    <option value="this-week">Due this week</option>
                    <option value="no-date">No due date</option>
                  </select>
                </div>
                <div className="st-filter-group">
                  <span>Sort</span>
                  <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} aria-label="Sort tasks">
                    <option value="due-asc">Due date</option>
                    <option value="priority">Priority</option>
                    <option value="created-desc">Recently created</option>
                    <option value="title">Title</option>
                  </select>
                  <button className="st-clear-filters" onClick={() => { setSearch(""); setPriorityFilter(""); setTaskScope("all"); setDueFilter("all"); setSortOrder("due-asc"); }}>
                    Reset
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="st-empty"><div className="st-spinner" /><strong>Loading your tasks...</strong></div>
              ) : displayTasks.length === 0 ? (
                <div className="st-empty">
                  <div className="st-empty-icon">&#10003;</div>
                  <strong>No tasks match these filters</strong>
                  <p>Try changing the filters or create a new task.</p>
                  <button className="st-primary-btn" onClick={openAddTask}><span>+</span> Add New Task</button>
                </div>
              ) : (
                <div className="st-task-list">
                  {displayTasks.map((task) => {
                    const completed = isCompleted(task);
                    const overdue = isOverdue(task);
                    const reminderDue = isReminderDue(task);

                    return (
                      <article className={`st-task-card ${completed ? "completed" : ""} ${overdue ? "overdue" : ""}`} key={task._id}>
                        <div className="st-task-check">
                          <button onClick={() => toggleStatus(task)} className={completed ? "checked" : ""} aria-label={completed ? "Mark task pending" : "Complete task"}>
                            {completed ? "✓" : ""}
                          </button>
                        </div>
                        <div className="st-task-body">
                          <div className="st-task-title-line">
                            <h3>{task.title}</h3>
                            <span className={`st-priority ${task.priority}`}>{task.priority}</span>
                          </div>
                          {task.description && <p className="st-task-description">{task.description}</p>}
                          <div className="st-task-meta">
                            <span>&#128193; {task.category || "general"}</span>
                            <span>{completed ? "Completed" : "Pending"}</span>
                            {task.dueDate && <span className={overdue ? "meta-danger" : ""}>&#128197; {formatDate(task.dueDate)}{overdue ? " • Overdue" : ""}</span>}
                            {task.reminderAt && <span className={reminderDue ? "meta-danger" : ""}>&#128276; {formatDateTime(task.reminderAt)}{reminderDue ? " • Due" : ""}</span>}
                          </div>
                        </div>
                        <div className="st-task-actions">
                          <button onClick={() => openEditTask(task)}>Edit</button>
                          <button className="danger" onClick={() => deleteTask(task._id)}>Delete</button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {activeView === "schedule" && (
            <section className="phase-view schedule-view">
              <section className="st-task-hero schedule-hero">
                <div>
                  <span className="st-eyebrow">PLANNING</span>
                  <h1>Schedule</h1>
                  <p>Plan when your tasks need to happen and keep upcoming deadlines in view.</p>
                </div>
                <button className="st-primary-btn" onClick={openAddTask}>
                  <span>+</span> Add New Task
                </button>
              </section>

              <div className="schedule-tabs" role="tablist" aria-label="Schedule range">
                {[
                  ["today", "Today"],
                  ["tomorrow", "Tomorrow"],
                  ["this-week", "This Week"],
                  ["custom", "Custom"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={`schedule-tab ${scheduleRange === value ? "active" : ""}`}
                    onClick={() => setScheduleRange(value)}
                    role="tab"
                    aria-selected={scheduleRange === value}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {scheduleRange === "custom" && (
                <div className="schedule-custom-bar">
                  <label>
                    <span>From</span>
                    <input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} />
                  </label>
                  <span className="schedule-range-arrow">→</span>
                  <label>
                    <span>To</span>
                    <input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} min={customStart || undefined} />
                  </label>
                  {!scheduleWindow && (customStart || customEnd) && (
                    <span className="schedule-range-error">Select a valid start and end date.</span>
                  )}
                </div>
              )}

              <div className="schedule-overview">
                <div>
                  <span className="st-eyebrow">{scheduleRange === "today" ? "TODAY" : scheduleRange === "tomorrow" ? "TOMORROW" : scheduleRange === "this-week" ? "THIS WEEK" : "CUSTOM RANGE"}</span>
                  <h2>
                    {scheduleWindow
                      ? `${formatDate(scheduleWindow.start)}${scheduleRange === "this-week" || scheduleRange === "custom" ? ` – ${formatDate(scheduleWindow.end)}` : ""}`
                      : "Choose a date range"}
                  </h2>
                </div>
                <div className="schedule-count">
                  <strong>{scheduledTasks.length}</strong>
                  <span>{scheduledTasks.length === 1 ? "task scheduled" : "tasks scheduled"}</span>
                </div>
              </div>

              {!scheduleWindow ? (
                <div className="st-dashboard-panel phase-placeholder">
                  <div className="st-placeholder-icon">&#128197;</div>
                  <h2>Select a date range</h2>
                  <p>Choose both a start and end date to see scheduled tasks.</p>
                </div>
              ) : scheduledTaskGroups.length === 0 ? (
                <div className="st-dashboard-panel schedule-empty">
                  <div className="st-placeholder-icon">&#10003;</div>
                  <h2>No tasks scheduled</h2>
                  <p>There are no tasks with due dates in this range.</p>
                  <button className="st-primary-btn" onClick={openAddTask}><span>+</span> Add New Task</button>
                </div>
              ) : (
                <div className="schedule-timeline">
                  {scheduledTaskGroups.map(([dateKey, group]) => (
                    <section className="schedule-day" key={dateKey}>
                      <div className="schedule-day-head">
                        <div>
                          <span className="schedule-day-dot" />
                          <div>
                            <h3>{new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, { weekday: "long" })}</h3>
                            <span>{formatDate(`${dateKey}T00:00:00`)}</span>
                          </div>
                        </div>
                        <span className="schedule-day-count">{group.length} {group.length === 1 ? "task" : "tasks"}</span>
                      </div>

                      <div className="schedule-task-list">
                        {group.map((task) => {
                          const completed = isCompleted(task);
                          const overdue = isOverdue(task);
                          return (
                            <article className={`schedule-task-card ${completed ? "completed" : ""} ${overdue ? "overdue" : ""}`} key={task._id}>
                              <button
                                className={`schedule-check ${completed ? "checked" : ""}`}
                                onClick={() => toggleStatus(task)}
                                aria-label={completed ? "Mark task pending" : "Complete task"}
                              >
                                {completed ? "✓" : ""}
                              </button>
                              <div className="schedule-task-main">
                                <div className="schedule-task-title">
                                  <h4>{task.title}</h4>
                                  <span className={`st-priority ${task.priority}`}>{task.priority}</span>
                                </div>
                                <div className="schedule-task-meta">
                                  <span>{task.category || "general"}</span>
                                  <span>{completed ? "Completed" : overdue ? "Overdue" : "Pending"}</span>
                                  <span>{new Date(task.dueDate).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
                                </div>
                              </div>
                              <button className="schedule-open-btn" onClick={() => openEditTask(task)}>Open Task</button>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeView === "ai" && (
            <section className="phase-view">
              <div className="st-hero">
                <div>
                  <span className="st-eyebrow purple">AI ANALYSIS</span>
                  <h1>AI Summary</h1>
                  <p>Detailed analysis of your current task workload.</p>
                </div>
                <button className="st-ai-btn" onClick={summarizeTasks} disabled={aiLoading || tasks.length === 0}>
                  {aiLoading ? "Analyzing..." : "✦ Generate New Analysis"}
                </button>
              </div>

              {aiError && <div className="st-ai-error">{aiError}</div>}

              {!aiSummary && !aiLoading ? (
                <div className="st-dashboard-panel phase-placeholder">
                  <div className="st-placeholder-icon">&#10022;</div>
                  <h2>Ready to analyze your workload</h2>
                  <p>Generate an AI summary to see workload, priorities, focus areas, risks, and recommendations.</p>
                  <button className="st-ai-btn" onClick={summarizeTasks} disabled={tasks.length === 0}>
                    &#10022; Summarize My Tasks
                  </button>
                </div>
              ) : aiLoading ? (
                <div className="st-dashboard-panel phase-placeholder"><div className="st-spinner" /><strong>Analyzing your tasks...</strong></div>
              ) : (
                <>
                  <div className="st-ai-results detailed-ai-results">
                    {[
                      ["Overall Assessment", aiSummary?.headline],
                      ["Workload Overview", aiSummary?.overview],
                      ["Priority Analysis", aiSummary?.priorityAnalysis],
                      ["What To Focus On", aiSummary?.focus],
                      ["Risks & Deadlines", aiSummary?.risks],
                      ["Recommended Execution Order", aiSummary?.recommendation],
                    ].map(([label, value]) =>
                      typeof value === "string" && value.trim() ? (
                        <div className="st-ai-result" key={label}>
                          <span>{label}</span>
                          {label === "Overall Assessment" ? <h3>{value}</h3> : <p>{value}</p>}
                        </div>
                      ) : null
                    )}
                  </div>

                  {Array.isArray(aiSummary?.taskReferences) && aiSummary.taskReferences.length > 0 && (
                    <section className="st-dashboard-panel ai-task-links-panel">
                      <div className="st-section-head">
                        <div>
                          <span className="st-eyebrow purple">ACTIONABLE TASKS</span>
                          <h2>Tasks to Focus On</h2>
                        </div>
                        <button className="st-text-link" onClick={() => setActiveView("tasks")}>
                          Manage tasks
                        </button>
                      </div>

                      <div className="ai-task-reference-list">
                        {aiSummary.taskReferences.map((reference) => (
                          <article className="ai-task-reference" key={reference.taskId}>
                            <div className="ai-task-reference-main">
                              <div className="ai-task-reference-title">
                                <span className="st-focus-dot" />
                                <strong>{reference.title}</strong>
                              </div>
                              <p>{reference.reason}</p>
                            </div>
                            <button
                              className="ai-task-open-btn"
                              onClick={() => openReferencedTask(reference.taskId)}
                            >
                              Open Task
                            </button>
                          </article>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </section>
          )}
        </main>
      </div>

      {profilePanelOpen && (
        <div className="st-modal-backdrop" onMouseDown={() => setProfilePanelOpen(false)}>
          <div
            className="st-profile-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-panel-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="st-profile-panel-head">
              <div>
                <span className="st-eyebrow">ACCOUNT</span>
                <h2 id="profile-panel-title">Profile</h2>
                <p>Manage your AskTask account and appearance.</p>
              </div>
              <button
                className="st-modal-close"
                onClick={() => setProfilePanelOpen(false)}
                aria-label="Close profile"
              >
                &times;
              </button>
            </div>

            <div className="st-profile-card">
              <div className="st-avatar large">{initials}</div>
              <div>
                <strong>{user?.name || "User"}</strong>
                <span>{user?.email || "Signed in"}</span>
              </div>
            </div>

            {profileError && (
              <div className="st-profile-message error" role="alert">
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="st-profile-message success" role="status">
                {profileSuccess}
              </div>
            )}

            <form
              className="st-profile-fields"
              onSubmit={async (event) => {
                event.preventDefault();
                setProfileError("");
                setProfileSuccess("");

                const trimmedName = profileName.trim();
                if (trimmedName.length < 2) {
                  setProfileError("Name must contain at least 2 characters.");
                  return;
                }

                try {
                  setProfileSaving(true);
                  await updateProfile(trimmedName);
                  setProfileSuccess("Profile updated successfully.");
                } catch (err) {
                  setProfileError(
                    err.response?.data?.message ||
                    "Unable to update your profile. Please try again."
                  );
                } finally {
                  setProfileSaving(false);
                }
              }}
            >
              <label>
                <span>Name</span>
                <input
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  maxLength={80}
                  autoComplete="name"
                  disabled={profileSaving}
                />
              </label>
              <label>
                <span>Email</span>
                <input value={user?.email || ""} readOnly />
              </label>

              <div className="st-profile-save-row">
                <button
                  type="submit"
                  className="st-profile-save-btn"
                  disabled={profileSaving || profileName.trim() === (user?.name || "").trim()}
                >
                  {profileSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>

            <div className="st-profile-appearance">
              <div>
                <strong>Appearance</strong>
                <span>Choose your preferred theme.</span>
              </div>
              <ThemeToggle />
            </div>

            <div className="st-profile-panel-actions">
              <button className="st-cancel-btn" onClick={() => setProfilePanelOpen(false)}>
                Close
              </button>
              <button
                className="st-profile-logout-btn"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          className="st-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="st-modal">
            <div className="st-modal-head">
              <div>
                <span className="st-eyebrow">
                  {editingId ? "EDIT TASK" : "NEW TASK"}
                </span>
                <h2>{editingId ? "Edit Task" : "Create a new task"}</h2>
                <p>
                  {editingId
                    ? "Update the details and save your changes."
                    : "Add the details you need to stay on track."}
                </p>
              </div>

              <button
                className="st-modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                &times;
              </button>
            </div>

            {error && (
              <div className="st-error modal-error">
                <span>{error}</span>
              </div>
            )}

            <form className="st-form" onSubmit={handleSubmit}>
              <label>
                <span>Task title</span>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Finish project documentation"
                  required
                  disabled={saving}
                  autoFocus
                />
              </label>

              <label>
                <span>Description</span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Add useful context..."
                  rows="4"
                  disabled={saving}
                />
              </label>

              <div className="st-form-grid three">
                <label>
                  <span>Priority</span>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>

                <label>
                  <span>Status</span>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>

                <label>
                  <span>Category</span>
                  <input
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    placeholder="Development"
                    disabled={saving}
                  />
                </label>
              </div>

              <div className="st-form-grid two">
                <label>
                  <span>Due date</span>
                  <input
                    type="date"
                    name="dueDate"
                    value={form.dueDate}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </label>

                <label>
                  <span>Reminder</span>
                  <input
                    type="datetime-local"
                    name="reminderAt"
                    value={form.reminderAt}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </label>
              </div>

              <div className="st-modal-actions">
                <button
                  type="button"
                  className="st-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="st-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Save Changes"
                    : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

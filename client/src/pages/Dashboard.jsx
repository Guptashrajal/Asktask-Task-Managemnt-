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
  const { user, logout } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const [error, setError] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSummary, setAiSummary] = useState(null);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const response = await API.get("/tasks", { params });
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
  }, [search, statusFilter, priorityFilter]);

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
      new Notification("SmartTask", {
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

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setSidebarOpen(false);
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

      <aside className={`st-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="st-sidebar-brand">
          <div className="st-logo" aria-hidden="true">&#10003;</div>
          <div className="st-brand-copy">
            <strong>SmartTask</strong>
            <span>Task Management</span>
          </div>
        </div>

        <nav className="st-sidebar-nav">
          <button
            className="active"
            onClick={() => scrollToSection("overview")}
          >
            <span className="st-nav-icon">&#8962;</span>
            Dashboard
          </button>

          <button onClick={() => scrollToSection("tasks")}>
            <span className="st-nav-icon">&#10003;</span>
            My Tasks
            <b>{totalTasks}</b>
          </button>

          <button onClick={() => scrollToSection("reminders")}>
            <span className="st-nav-icon">&#128276;</span>
            Reminders
            {reminderTasks.length > 0 && (
              <b className="danger-count">{reminderTasks.length}</b>
            )}
          </button>

          <button onClick={() => scrollToSection("ai")}>
            <span className="st-nav-icon">&#10022;</span>
            AI Summary
          </button>
        </nav>

        <div className="st-sidebar-bottom">
          <button className="st-sidebar-add" onClick={openAddTask}>
            <span>+</span>
            New Task
          </button>

          <div className="st-user-mini">
            <div className="st-avatar">{initials}</div>
            <div>
              <strong>{user?.name || "User"}</strong>
              <span>{user?.email || "Signed in"}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="st-main">
        <header className="st-topbar">
          <button
            className="st-mobile-menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            &#9776;
          </button>

          <div className="st-breadcrumb">
            <span>Workspace</span>
            <b>/</b>
            <strong>Dashboard</strong>
          </div>

          <div className="st-top-actions">
            <button
              className="st-icon-btn notification-btn"
              onClick={() => setNotificationOpen((v) => !v)}
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

            <ThemeToggle />

            <button className="st-logout" onClick={logout}>
              Logout
            </button>
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
          <section id="overview" className="st-hero">
            <div>
              <span className="st-eyebrow">DASHBOARD</span>
              <h1>
                Good to see you,{" "}
                <span>{user?.name || "there"}</span>
              </h1>
              <p>
                Stay organized, prioritize what matters, and keep moving
                forward.
              </p>
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
              <button onClick={() => setError("")}>Ã—</button>
            </div>
          )}

          <section className="st-stats">
            <div className="st-stat-card">
              <div className="st-stat-icon blue">&#10003;</div>
              <div>
                <span>Total Tasks</span>
                <strong>{totalTasks}</strong>
              </div>
            </div>

            <div className="st-stat-card">
              <div className="st-stat-icon amber">&#128276;</div>
              <div>
                <span>Pending</span>
                <strong>{pendingTasks}</strong>
              </div>
            </div>

            <div className="st-stat-card">
              <div className="st-stat-icon green">&#10003;</div>
              <div>
                <span>Completed</span>
                <strong>{completedTasks}</strong>
              </div>
            </div>

            <div className="st-stat-card">
              <div className="st-stat-icon red">!</div>
              <div>
                <span>High Priority</span>
                <strong>{highPriorityTasks}</strong>
              </div>
            </div>
          </section>

          <section id="reminders" className="st-reminder-grid">
            <div className={`st-attention-card ${reminderTasks.length ? "has-alert" : ""}`}>
              <div className="st-section-icon">!</div>
              <div>
                <span>Needs Attention</span>
                <strong>{reminderTasks.length}</strong>
                <p>Overdue and due reminders</p>
              </div>
            </div>

            <div className="st-attention-card">
              <div className="st-section-icon">&#128276;</div>
              <div>
                <span>Upcoming Reminders</span>
                <strong>{upcomingTasks.length}</strong>
                <p>Scheduled for later</p>
              </div>
            </div>
          </section>

          <section id="ai" className="st-ai-card">
            <div className="st-ai-glow" />

            <div className="st-ai-copy">
              <span className="st-eyebrow purple">AI TASK ANALYSIS</span>
              <h2>Understand your workload</h2>
              <p>
                Analyze your existing tasks by priority, completion status,
                deadlines, reminders, and workload. This does not create new
                tasks.
              </p>
            </div>

            <button
              className="st-ai-btn"
              onClick={summarizeTasks}
              disabled={aiLoading || tasks.length === 0}
            >
              {aiLoading ? "Analyzing..." : "\u2726 Summarize My Tasks"}
            </button>

            {aiError && (
              <div className="st-ai-error">{aiError}</div>
            )}

{aiSummary && (
  <div className="st-ai-results">

    {typeof aiSummary.headline === "string" &&
      aiSummary.headline.trim() && (
        <div className="st-ai-result st-ai-headline">
          <span>Overall Assessment</span>

          <h3>
            {aiSummary.headline}
          </h3>
        </div>
      )}

    {typeof aiSummary.overview === "string" &&
      aiSummary.overview.trim() && (
        <div className="st-ai-result">
          <span>Workload Overview</span>

          <p>
            {aiSummary.overview}
          </p>
        </div>
      )}

    {typeof aiSummary.priorityAnalysis === "string" &&
      aiSummary.priorityAnalysis.trim() && (
        <div className="st-ai-result">
          <span>Priority Analysis</span>

          <p>
            {aiSummary.priorityAnalysis}
          </p>
        </div>
      )}

    {typeof aiSummary.focus === "string" &&
      aiSummary.focus.trim() && (
        <div className="st-ai-result">
          <span>What To Focus On</span>

          <p>
            {aiSummary.focus}
          </p>
        </div>
      )}

    {typeof aiSummary.risks === "string" &&
      aiSummary.risks.trim() && (
        <div className="st-ai-result">
          <span>Risks & Deadlines</span>

          <p>
            {aiSummary.risks}
          </p>
        </div>
      )}

    {typeof aiSummary.recommendation === "string" &&
      aiSummary.recommendation.trim() && (
        <div className="st-ai-result">
          <span>Recommended Execution Order</span>

          <p>
            {aiSummary.recommendation}
          </p>
        </div>
      )}

  </div>
            )}
          </section>

          <section id="tasks" className="st-task-section">
            <div className="st-section-head">
              <div>
                <span className="st-eyebrow">TASKS</span>
                <h2>My Tasks</h2>
              </div>

              <button className="st-secondary-add" onClick={openAddTask}>
                + Add Task
              </button>
            </div>

            <div className="st-filters">
              <div className="st-search">
                <span className="st-search-icon">&#128269;</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks..."
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {loading ? (
              <div className="st-empty">
                <div className="st-spinner" />
                <strong>Loading your tasks...</strong>
              </div>
            ) : tasks.length === 0 ? (
              <div className="st-empty">
                <div className="st-empty-icon">&#10003;</div>
                <strong>No tasks found</strong>
                <p>Create a task to get started.</p>
                <button className="st-primary-btn" onClick={openAddTask}>
                  + Create Task
                </button>
              </div>
            ) : (
              <div className="st-task-list">
                {tasks.map((task) => {
                  const completed = isCompleted(task);
                  const overdue = isOverdue(task);
                  const reminderDue = isReminderDue(task);

                  return (
                    <article
                      className={`st-task-card ${completed ? "completed" : ""} ${
                        overdue ? "overdue" : ""
                      }`}
                      key={task._id}
                    >
                      <div className="st-task-check">
                        <button
                          onClick={() => toggleStatus(task)}
                          className={completed ? "checked" : ""}
                          aria-label={
                            completed
                              ? "Mark task pending"
                              : "Complete task"
                          }
                        >
                          {completed ? "✓" : ""}
                        </button>
                      </div>

                      <div className="st-task-body">
                        <div className="st-task-title-line">
                          <h3>{task.title}</h3>
                          <span className={`st-priority ${task.priority}`}>
                            {task.priority}
                          </span>
                        </div>

                        {task.description && (
                          <p className="st-task-description">
                            {task.description}
                          </p>
                        )}

                        <div className="st-task-meta">
                          <span>&#128193; {task.category || "general"}</span>
                          <span>
                            {completed ? "Completed" : "Pending"}
                          </span>

                          {task.dueDate && (
                            <span className={overdue ? "meta-danger" : ""}>
                              &#128197; {formatDate(task.dueDate)}
                              {overdue ? " • Overdue" : ""}
                            </span>
                          )}

                          {task.reminderAt && (
                            <span className={reminderDue ? "meta-danger" : ""}>
                              &#128276; {formatDateTime(task.reminderAt)}
                              {reminderDue ? " • Due" : ""}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="st-task-actions">
                        <button onClick={() => openEditTask(task)}>
                          Edit
                        </button>
                        <button
                          className="danger"
                          onClick={() => deleteTask(task._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>

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

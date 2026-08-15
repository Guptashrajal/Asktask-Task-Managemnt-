const express = require("express");
const Task = require("../models/Task");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

/*
  POST /api/ai/summarize

  IMPORTANT:
  This endpoint ONLY analyzes existing tasks.
  It does NOT create, modify, delete, or suggest tasks.
*/

router.post("/summarize", async (req, res) => {
  try {
    const tasks = await Task.find({
      user: req.user.id,
    })
      .sort({
        priority: -1,
        dueDate: 1,
        createdAt: -1,
      })
      .lean();

    /*
      No tasks
    */
    if (tasks.length === 0) {
      return res.json({
        summary: {
          headline: "You have a clean slate.",
          overview:
            "There are no tasks to analyze yet. Add a few tasks and AskTask will analyze their priorities, deadlines, status, and reminders.",
          priorityAnalysis:
            "No priorities have been assigned because there are no tasks.",
          focus:
            "Create your first task and assign an appropriate priority.",
          risks:
            "There are currently no overdue or pending tasks.",
          recommendation:
            "Start with the most important outcome you want to achieve.",
          taskReferences: [],
        },
      });
    }

    const now = new Date();

    /*
      Convert MongoDB task objects into a small,
      predictable structure for Gemini.
    */
    const normalizedTasks = tasks.map((task) => {
      const completed =
        task.status === "completed" ||
        task.completed === true;

      const dueDate = task.dueDate
        ? new Date(task.dueDate)
        : null;

      const reminderAt = task.reminderAt
        ? new Date(task.reminderAt)
        : null;

      return {
        id: String(task._id),
        title: task.title || "",
        description: task.description || "",
        category: task.category || "general",

        priority: task.priority || "medium",

        status:
          task.status ||
          (completed ? "completed" : "pending"),

        dueDate: dueDate
          ? dueDate.toISOString()
          : null,

        reminderAt: reminderAt
          ? reminderAt.toISOString()
          : null,

        overdue:
          Boolean(dueDate) &&
          dueDate.getTime() < now.getTime() &&
          !completed,
      };
    });

    /*
      Gemini API key
    */
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error(
        "GEMINI_API_KEY is missing from server environment."
      );

      return res.status(503).json({
        message:
          "GEMINI_API_KEY is not configured on the server.",
      });
    }

    /*
      Use an environment variable if provided.

      Recommended:
      GEMINI_MODEL=gemini-3.6-flash

      Keeping it configurable means you won't need
      to edit this route every time you change models.
    */
    const model =
      process.env.GEMINI_MODEL ||
      "gemini-3.6-flash";

    /*
      VERY IMPORTANT:

      Gemini must return the six analysis fields plus taskReferences.

      This is an analysis of EXISTING tasks.
      It is NOT a task generator.
    */
    const prompt = `
You are the AskTask workload analyst.

Analyze ONLY the user's EXISTING tasks.

Do NOT create tasks.
Do NOT suggest new tasks.
Do NOT invent tasks.
Do NOT rewrite tasks.
Do NOT provide a task-generation plan.

Your job is to summarize the user's existing workload based on:

- priority
- status
- category
- due dates
- reminder times
- overdue state
- completed versus pending work
- workload distribution

Return ONLY valid JSON.

The JSON must contain these seven fields:

{
  "headline": "...",
  "overview": "...",
  "priorityAnalysis": "...",
  "focus": "...",
  "risks": "...",
  "recommendation": "...",
  "taskReferences": [
    {
      "taskId": "EXACT_EXISTING_TASK_ID",
      "reason": "Short reason this existing task needs attention."
    }
  ]
}

Rules:

headline:
Give one short conclusion about the workload.

overview:
Summarize the overall existing workload.

priorityAnalysis:
Analyze how low, medium, and high priority tasks are distributed.

focus:
Identify which EXISTING task or type of existing task deserves attention first.

risks:
Mention overdue tasks, approaching deadlines, reminders, excessive high-priority work, or other risks.
If there are no risks, explicitly say that.

recommendation:
Give a practical execution order using ONLY existing tasks.
Do not create or suggest new tasks.

taskReferences:
Return up to 4 of the most important EXISTING tasks to act on.
Use ONLY task IDs from the provided tasks.
If there are no useful task references, return an empty array.
Keep each reason short and actionable.

Do not output markdown.
Do not output headings outside the JSON.
Do not invent task IDs.
Do not output anything except the JSON object.

Current existing tasks:

${JSON.stringify(
  normalizedTasks,
  null,
  2
)}
`;

    /*
      Call Gemini
    */
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],

          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    const data = await response.json();

    /*
      Gemini API failure
    */
    if (!response.ok) {
      console.error(
        "Gemini API error:",
        JSON.stringify(data, null, 2)
      );

      return res.status(502).json({
        message:
          data?.error?.message ||
          "Gemini could not summarize the tasks.",
      });
    }

    /*
      Extract generated text
    */
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "";

    if (!text) {
      console.error(
        "Gemini returned no text:",
        JSON.stringify(data, null, 2)
      );

      return res.status(502).json({
        message:
          "Gemini returned an empty task summary.",
      });
    }

    /*
      Parse JSON
    */
    let summary;

    try {
      summary = JSON.parse(text);
    } catch (parseError) {
      console.error(
        "Gemini returned invalid JSON:",
        text
      );

      return res.status(502).json({
        message:
          "Gemini returned an invalid task summary.",
      });
    }

    /*
      Validate the six expected fields.

      This prevents the frontend from accidentally
      receiving an unexpected object structure.
    */
    const requiredFields = [
      "headline",
      "overview",
      "priorityAnalysis",
      "focus",
      "risks",
      "recommendation",
    ];

    const validSummary = {};

    for (const field of requiredFields) {
      const value = summary?.[field];

      validSummary[field] =
        typeof value === "string"
          ? value
          : value == null
          ? ""
          : String(value);
    }

    const taskIds = new Set(tasks.map((task) => String(task._id)));
    const taskById = new Map(
      tasks.map((task) => [String(task._id), task])
    );

    const aiTaskReferences = Array.isArray(summary?.taskReferences)
      ? summary.taskReferences
          .filter((item) => item && taskIds.has(String(item.taskId)))
          .slice(0, 4)
          .map((item) => ({
            taskId: String(item.taskId),
            title: taskById.get(String(item.taskId))?.title || "Task",
            reason:
              typeof item.reason === "string" && item.reason.trim()
                ? item.reason.trim()
                : "This task deserves attention based on your current workload.",
          }))
      : [];

    // Keep the task links reliable even if Gemini omits taskReferences.
    // These are selected only from the authenticated user's real tasks.
    if (aiTaskReferences.length === 0) {
      const fallbackTasks = [...tasks]
        .filter((task) => task.status !== "completed" && task.completed !== true)
        .sort((a, b) => {
          const priorityRank = { high: 0, medium: 1, low: 2 };
          const priorityDiff =
            (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1);
          if (priorityDiff !== 0) return priorityDiff;

          const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          return aDue - bDue;
        })
        .slice(0, 4);

      validSummary.taskReferences = fallbackTasks.map((task) => {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const overdue = dueDate && dueDate.getTime() < now.getTime();
        const priority = task.priority || "medium";

        let reason = `${priority.charAt(0).toUpperCase() + priority.slice(1)} priority task that deserves attention.`;
        if (overdue) reason = "This task is overdue and should be addressed first.";
        else if (priority === "high") reason = "High priority task that should be addressed soon.";
        else if (dueDate) reason = "Upcoming task selected based on priority and deadline.";

        return {
          taskId: String(task._id),
          title: task.title || "Task",
          reason,
        };
      });
    } else {
      validSummary.taskReferences = aiTaskReferences;
    }

    /*
      Send predictable response to frontend.
    */
    return res.json({
      summary: validSummary,
    });
  } catch (error) {
    console.error(
      "AI summarize error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to summarize your tasks.",
    });
  }
});

module.exports = router;
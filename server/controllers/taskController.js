const Task = require("../models/Task");


// ==================================================
// GET TASKS
// GET /api/tasks
// ==================================================

const getTasks = async (req, res) => {
  try {
    const {
      search = "",
      status = "",
      priority = "",
    } = req.query;

    const filter = {
      user: req.user.id,
    };

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (search.trim()) {
      filter.$or = [
        {
          title: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          description: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          category: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    const tasks = await Task.find(filter)
      .sort({
        createdAt: -1,
      });

    return res.json({
      tasks,
    });

  } catch (error) {
    console.error(
      "Get tasks error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to fetch tasks",
    });
  }
};


// ==================================================
// CREATE TASK
// POST /api/tasks
// ==================================================

const createTask = async (req, res) => {
  try {
    const {
      title,
      description = "",
      category = "general",
      priority = "medium",
      status = "pending",
      dueDate = null,
      reminderAt = null,
    } = req.body;

    if (
      !title ||
      !title.trim()
    ) {
      return res.status(400).json({
        message:
          "Task title is required",
      });
    }

    if (
      !["low", "medium", "high"]
        .includes(priority)
    ) {
      return res.status(400).json({
        message:
          "Invalid priority",
      });
    }

    if (
      !["pending", "completed"]
        .includes(status)
    ) {
      return res.status(400).json({
        message:
          "Invalid task status",
      });
    }

    let parsedDueDate = null;

    if (dueDate) {
      parsedDueDate =
        new Date(dueDate);

      if (
        Number.isNaN(
          parsedDueDate.getTime()
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid due date",
        });
      }
    }

    let parsedReminderAt = null;

    if (reminderAt) {
      parsedReminderAt =
        new Date(reminderAt);

      if (
        Number.isNaN(
          parsedReminderAt.getTime()
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid reminder date",
        });
      }
    }

    const task =
      await Task.create({
        title: title.trim(),

        description:
          description?.trim() || "",

        category:
          category?.trim() ||
          "general",

        priority,

        status,

        completed:
          status === "completed",

        dueDate:
          parsedDueDate,

        reminderAt:
          parsedReminderAt,

        user:
          req.user.id,
      });

    return res.status(201).json({
      task,
    });

  } catch (error) {
    console.error(
      "Create task error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to create task",
    });
  }
};


// ==================================================
// UPDATE TASK
// PUT /api/tasks/:id
// ==================================================

const updateTask = async (req, res) => {
  try {
    const allowedFields = [
      "title",
      "description",
      "category",
      "priority",
      "status",
      "completed",
      "dueDate",
      "reminderAt",
    ];

    const updates = {};

    for (
      const field of allowedFields
    ) {
      if (
        req.body[field] !==
        undefined
      ) {
        updates[field] =
          req.body[field];
      }
    }

    if (
      updates.title !==
      undefined
    ) {
      if (
        !String(
          updates.title
        ).trim()
      ) {
        return res.status(400).json({
          message:
            "Task title cannot be empty",
        });
      }

      updates.title =
        String(
          updates.title
        ).trim();
    }

    if (
      updates.category !==
      undefined
    ) {
      updates.category =
        String(
          updates.category
        ).trim() ||
        "general";
    }

    if (
      updates.priority !==
      undefined &&
      ![
        "low",
        "medium",
        "high",
      ].includes(
        updates.priority
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid priority",
      });
    }

    if (
      updates.status !==
      undefined
    ) {
      if (
        ![
          "pending",
          "completed",
        ].includes(
          updates.status
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid task status",
        });
      }

      updates.completed =
        updates.status ===
        "completed";
    }

    if (
      updates.completed !==
      undefined &&
      updates.status ===
        undefined
    ) {
      updates.status =
        updates.completed
          ? "completed"
          : "pending";
    }

    if (
      updates.dueDate !==
      undefined
    ) {
      if (
        !updates.dueDate
      ) {
        updates.dueDate = null;
      } else {
        const date =
          new Date(
            updates.dueDate
          );

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid due date",
          });
        }

        updates.dueDate =
          date;
      }
    }

    if (
      updates.reminderAt !==
      undefined
    ) {
      if (
        !updates.reminderAt
      ) {
        updates.reminderAt =
          null;
      } else {
        const reminderDate =
          new Date(
            updates.reminderAt
          );

        if (
          Number.isNaN(
            reminderDate.getTime()
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid reminder date",
          });
        }

        updates.reminderAt =
          reminderDate;
      }
    }

    const task =
      await Task.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user.id,
        },
        updates,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!task) {
      return res.status(404).json({
        message:
          "Task not found",
      });
    }

    return res.json({
      task,
    });

  } catch (error) {
    console.error(
      "Update task error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to update task",
    });
  }
};


// ==================================================
// DELETE TASK
// DELETE /api/tasks/:id
// ==================================================

const deleteTask = async (req, res) => {
  try {
    const task =
      await Task.findOneAndDelete({
        _id: req.params.id,
        user: req.user.id,
      });

    if (!task) {
      return res.status(404).json({
        message:
          "Task not found",
      });
    }

    return res.json({
      message:
        "Task deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete task error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to delete task",
    });
  }
};


module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};


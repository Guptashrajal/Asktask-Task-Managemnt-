const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();


// ==================================================
// CORS
// ==================================================

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests such as Postman/server-side requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error(
        "CORS blocked origin:",
        origin
      );

      return callback(
        new Error("Not allowed by CORS")
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);


// ==================================================
// BODY PARSER
// ==================================================

app.use(
  express.json({
    limit: "1mb",
  })
);


// ==================================================
// HEALTH CHECK
// ==================================================

app.get("/", (req, res) => {
  res.json({
    message: "SmartTask API is running",
    status: "success",
  });
});


// ==================================================
// DATABASE
// ==================================================

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error(
      "Database connection failed:",
      error.message
    );

    return res.status(500).json({
      message: "Database connection failed",
    });
  }
});


// ==================================================
// ROUTES
// ==================================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/tasks",
  taskRoutes
);

app.use(
  "/api/ai",
  aiRoutes
);


// ==================================================
// ERROR HANDLER
// ==================================================

app.use(
  (error, req, res, next) => {
    console.error(
      "Server error:",
      error
    );

    return res.status(500).json({
      message:
        error.message ||
        "Internal server error",
    });
  }
);


// ==================================================
// START SERVER
// ==================================================

async function startServer() {
  try {
    console.log(
      "Connecting to MongoDB..."
    );

    await connectDB();

    console.log(
      "MongoDB connection established."
    );

    const PORT =
      process.env.PORT || 5000;

    app.listen(
      PORT,
      () => {
        console.log("");
        console.log(
          "================================="
        );
        console.log(
          `SmartTask API running on http://localhost:${PORT}`
        );
        console.log(
          "================================="
        );
        console.log("");
        console.log(
          "Allowed frontend origins:"
        );
        console.log(
          allowedOrigins
        );
      }
    );
  } catch (error) {
    console.error(
      "Unable to start server:",
      error.message
    );

    process.exit(1);
  }
}


if (require.main === module) {
  startServer();
}


module.exports = app;
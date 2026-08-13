const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ==================================================
// REGISTER
// POST /api/auth/register
// ==================================================

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Authentication configuration error",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(201).json({
      message: "Account created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Server error during registration",
    });
  }
});


// ==================================================
// LOGIN
// POST /api/auth/login
// ==================================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.password) {
      return res.status(500).json({
        message: "This account cannot be authenticated",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Authentication configuration error",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Server error during login",
    });
  }
});


// ==================================================
// CURRENT USER
// GET /api/auth/me
// ==================================================

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "_id name email"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      message: "Unable to load current user",
    });
  }
});


// ==================================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// ==================================================

router.post("/forgot-password", async (req, res) => {
  const genericMessage =
    "If an account exists with that email, a password reset link has been sent.";

  try {
    const { email } = req.body;

    if (!email) {
      return res.json({
        message: genericMessage,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.json({
        message: genericMessage,
      });
    }

    // Remove previous reset tokens.
    await PasswordReset.deleteMany({
      userId: user._id,
    });

    // Create secure random token.
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Store only hashed token.
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // Token expires after 15 minutes.
    const expiresAt = new Date(
      Date.now() + 15 * 60 * 1000
    );

    await PasswordReset.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    const clientUrl =
      process.env.CLIENT_URL ||
      "http://localhost:5173";

    const resetUrl =
      `${clientUrl.replace(/\/$/, "")}/reset-password/${rawToken}`;

    console.log("");
    console.log("==========================================");
    console.log("PASSWORD RESET URL");
    console.log(resetUrl);
    console.log("==========================================");
    console.log("");

    // ==================================================
    // BREVO EMAIL
    // ==================================================

    if (!process.env.BREVO_API_KEY) {
      console.error("BREVO_API_KEY is not configured.");

      return res.status(500).json({
        message: "Email service is not configured.",
      });
    }

    if (!process.env.EMAIL_FROM) {
      console.error("EMAIL_FROM is not configured.");

      return res.status(500).json({
        message: "Email sender is not configured.",
      });
    }

    const brevoResponse = await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",

        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
        },

        body: JSON.stringify({
          sender: {
            name:
              process.env.EMAIL_FROM_NAME ||
              "SmartTask",
            email: process.env.EMAIL_FROM,
          },

          to: [
            {
              email: user.email,
              name: user.name,
            },
          ],

          subject: "Reset your SmartTask password",

          htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reset your SmartTask password</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f4f6fb;
    font-family:Arial,sans-serif;
  "
>
  <div
    style="
      max-width:600px;
      margin:40px auto;
      background:#ffffff;
      border-radius:16px;
      padding:40px;
    "
  >

    <h1 style="color:#171c32;">
      SmartTask
    </h1>

    <h2 style="color:#171c32;">
      Reset your password
    </h2>

    <p style="color:#5f667d;line-height:1.6;">
      Hi ${user.name || "there"},
    </p>

    <p style="color:#5f667d;line-height:1.6;">
      We received a request to reset the password
      for your SmartTask account.
    </p>

    <p style="color:#5f667d;line-height:1.6;">
      Click the button below to create a new password.
    </p>

    <div style="margin:30px 0;">

      <a
        href="${resetUrl}"
        style="
          display:inline-block;
          padding:14px 24px;
          background:#6257f5;
          color:#ffffff;
          text-decoration:none;
          border-radius:10px;
          font-weight:bold;
        "
      >
        Reset Password
      </a>

    </div>

    <p style="color:#777;font-size:14px;line-height:1.6;">
      This link will expire in 15 minutes.
    </p>

    <p style="color:#777;font-size:14px;line-height:1.6;">
      If you did not request a password reset,
      you can safely ignore this email.
    </p>

    <hr
      style="
        border:0;
        border-top:1px solid #eeeeee;
        margin:30px 0;
      "
    >

    <p style="color:#999;font-size:12px;">
      SmartTask Task Management
    </p>

  </div>
</body>
</html>
          `,
        }),
      }
    );

    const brevoData = await brevoResponse.json();

    if (!brevoResponse.ok) {
      console.error(
        "Brevo email error:",
        brevoData
      );

      return res.status(502).json({
        message: "Unable to send password reset email.",
      });
    }

    console.log(
      "Password reset email sent successfully to:",
      user.email
    );

    return res.json({
      message: genericMessage,
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      message: "Unable to process password reset request.",
    });
  }
});


// ==================================================
// DEVELOPMENT RESET TOKEN
// POST /api/auth/dev-reset-token
// ==================================================

router.post("/dev-reset-token", async (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(404).json({
      message: "Not found",
    });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        message: "No account found with this email",
      });
    }

    await PasswordReset.deleteMany({
      userId: user._id,
    });

    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + 15 * 60 * 1000
    );

    await PasswordReset.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    const clientUrl =
      process.env.CLIENT_URL ||
      "http://localhost:5173";

    const resetUrl =
      `${clientUrl.replace(/\/$/, "")}/reset-password/${rawToken}`;

    return res.json({
      message: "Development reset token created",
      resetUrl,
      expiresAt,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(
      "Development reset token error:",
      error
    );

    return res.status(500).json({
      message: "Unable to create development reset token",
    });
  }
});


// ==================================================
// RESET PASSWORD
// POST /api/auth/reset-password/:token
// ==================================================

router.post(
  "/reset-password/:token",
  async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;

      if (!token) {
        return res.status(400).json({
          message: "Invalid password reset link",
        });
      }

      if (!password) {
        return res.status(400).json({
          message: "New password is required",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          message:
            "Password must contain at least 6 characters",
        });
      }

      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const passwordReset =
        await PasswordReset.findOne({
          tokenHash,
          expiresAt: {
            $gt: new Date(),
          },
        });

      if (!passwordReset) {
        return res.status(400).json({
          message:
            "This password reset link is invalid or has expired",
        });
      }

      const user = await User.findById(
        passwordReset.userId
      );

      if (!user) {
        await PasswordReset.deleteOne({
          _id: passwordReset._id,
        });

        return res.status(400).json({
          message:
            "This password reset link is invalid",
        });
      }

      const hashedPassword = await bcrypt.hash(
        password,
        10
      );

      user.password = hashedPassword;

      await user.save();

      await PasswordReset.deleteOne({
        _id: passwordReset._id,
      });

      return res.json({
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      return res.status(500).json({
        message:
          "Server error while resetting password",
      });
    }
  }
);


module.exports = router;


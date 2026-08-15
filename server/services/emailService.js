const axios = require("axios");

const BREVO_URL =
  "https://api.brevo.com/v3/smtp/email";


function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


async function sendEmail({
  to,
  name,
  subject,
  html,
}) {
  if (!process.env.BREVO_API_KEY) {
    throw new Error(
      "BREVO_API_KEY is missing"
    );
  }

  if (!process.env.EMAIL_FROM) {
    throw new Error(
      "EMAIL_FROM is missing"
    );
  }

  const response =
    await axios.post(
      BREVO_URL,
      {
        sender: {
          name:
            process.env.EMAIL_FROM_NAME ||
            "AskTask",

          email:
            process.env.EMAIL_FROM,
        },

        to: [
          {
            email: to,
            name: name || "",
          },
        ],

        subject,

        htmlContent: html,
      },
      {
        headers: {
          accept:
            "application/json",

          "api-key":
            process.env.BREVO_API_KEY,

          "content-type":
            "application/json",
        },
      }
    );

  return response.data;
}


// ==================================================
// WELCOME EMAIL
// ==================================================

async function sendWelcomeEmail({
  email,
  name,
}) {
  const safeName =
    escapeHtml(name);

  return sendEmail({
    to: email,
    name,

    subject:
      "Welcome to AskTask 🎉",

    html: `
      <!DOCTYPE html>

      <html>
      <body style="
        margin:0;
        padding:0;
        background:#f6f8ff;
        font-family:Arial,sans-serif;
        color:#182036;
      ">

        <div style="
          max-width:600px;
          margin:40px auto;
          background:#ffffff;
          border-radius:18px;
          padding:40px;
        ">

          <h1 style="
            color:#5b6ff5;
          ">
            Welcome to AskTask!
          </h1>

          <p>
            Hi ${safeName},
          </p>

          <p>
            Your AskTask account has
            been created successfully.
          </p>

          <p>
            You can now organize your
            work, manage tasks and stay
            productive.
          </p>

          <a
            href="${process.env.CLIENT_URL}/dashboard"
            style="
              display:inline-block;
              padding:13px 22px;
              background:#5b6ff5;
              color:#ffffff;
              text-decoration:none;
              border-radius:10px;
              font-weight:bold;
            "
          >
            Open AskTask
          </a>

        </div>

      </body>
      </html>
    `,
  });
}


// ==================================================
// FIRST LOGIN WELCOME EMAIL
// ==================================================

async function sendFirstLoginEmail({
  email,
  name,
}) {
  const safeName =
    escapeHtml(name || "there");

  const clientUrl =
    (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

  return sendEmail({
    to: email,
    name,

    subject:
      "Welcome to AskTask — your first login",

    html: `
      <!DOCTYPE html>
      <html>
      <body style="
        margin:0;
        padding:0;
        background:#f8f7ff;
        font-family:Arial,sans-serif;
        color:#172033;
      ">
        <div style="
          max-width:600px;
          margin:40px auto;
          background:#ffffff;
          border:1px solid #e5e7eb;
          border-radius:18px;
          padding:40px;
        ">
          <div style="
            display:inline-block;
            padding:8px 12px;
            background:#ede9fe;
            color:#6d5dfc;
            border-radius:10px;
            font-weight:bold;
          ">
            AT &nbsp; AskTask
          </div>

          <h1 style="
            margin:28px 0 12px;
            color:#172033;
          ">
            Welcome to AskTask, ${safeName}.
          </h1>

          <p style="
            color:#64748b;
            line-height:1.7;
          ">
            You have successfully signed in to AskTask for the first time.
          </p>

          <p style="
            color:#64748b;
            line-height:1.7;
          ">
            AskTask helps you organize your tasks, keep track of deadlines,
            and use AI to understand what deserves your attention.
          </p>

          <div style="margin:30px 0;">
            <a
              href="${clientUrl}/dashboard"
              style="
                display:inline-block;
                padding:14px 24px;
                background:#2563eb;
                color:#ffffff;
                text-decoration:none;
                border-radius:10px;
                font-weight:bold;
              "
            >
              Open AskTask
            </a>
          </div>

          <div style="
            margin-top:28px;
            padding:18px;
            background:#f5f3ff;
            border-radius:12px;
            color:#4b5563;
            line-height:1.6;
          ">
            Start by creating a task, setting its deadline, and letting AskTask
            help you decide what to focus on next.
          </div>

          <p style="
            margin-top:30px;
            color:#94a3b8;
            font-size:12px;
          ">
            AskTask — Task Management
          </p>
        </div>
      </body>
      </html>
    `,
  });
}


// ==================================================
// PASSWORD RESET EMAIL
// ==================================================

async function sendPasswordResetEmail({
  email,
  name,
  token,
}) {
  const safeName =
    escapeHtml(name);

  const resetUrl =
    `${process.env.CLIENT_URL}/reset-password/${token}`;

  return sendEmail({
    to: email,
    name,

    subject:
      "Reset your AskTask password",

    html: `
      <!DOCTYPE html>

      <html>
      <body style="
        margin:0;
        padding:0;
        background:#f6f8ff;
        font-family:Arial,sans-serif;
        color:#182036;
      ">

        <div style="
          max-width:600px;
          margin:40px auto;
          background:#ffffff;
          border-radius:18px;
          padding:40px;
        ">

          <h1 style="
            color:#5b6ff5;
          ">
            Reset your password
          </h1>

          <p>
            Hi ${safeName},
          </p>

          <p>
            We received a request to
            reset your AskTask password.
          </p>

          <p>
            Click the button below to
            create a new password.
          </p>

          <a
            href="${resetUrl}"
            style="
              display:inline-block;
              padding:13px 22px;
              background:#5b6ff5;
              color:#ffffff;
              text-decoration:none;
              border-radius:10px;
              font-weight:bold;
            "
          >
            Reset Password
          </a>

          <p style="
            margin-top:28px;
            color:#6b7280;
          ">
            This link expires in 15 minutes.
          </p>

          <p style="
            color:#8a95ad;
            font-size:13px;
          ">
            If you did not request a
            password reset, you can safely
            ignore this email.
          </p>

        </div>

      </body>
      </html>
    `,
  });
}


// ==================================================
// PASSWORD CHANGED EMAIL
// ==================================================

async function sendPasswordChangedEmail({
  email,
  name,
}) {
  const safeName =
    escapeHtml(name);

  return sendEmail({
    to: email,
    name,

    subject:
      "Your AskTask password was changed",

    html: `
      <!DOCTYPE html>

      <html>
      <body style="
        margin:0;
        padding:0;
        background:#f6f8ff;
        font-family:Arial,sans-serif;
        color:#182036;
      ">

        <div style="
          max-width:600px;
          margin:40px auto;
          background:#ffffff;
          border-radius:18px;
          padding:40px;
        ">

          <h1 style="
            color:#5b6ff5;
          ">
            Password changed
          </h1>

          <p>
            Hi ${safeName},
          </p>

          <p>
            Your AskTask password was
            successfully changed.
          </p>

          <p>
            If you did not make this
            change, please secure your
            account immediately.
          </p>

          <a
            href="${process.env.CLIENT_URL}/login"
            style="
              display:inline-block;
              padding:13px 22px;
              background:#5b6ff5;
              color:#ffffff;
              text-decoration:none;
              border-radius:10px;
              font-weight:bold;
            "
          >
            Go to Login
          </a>

        </div>

      </body>
      </html>
    `,
  });
}


module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendFirstLoginEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
};
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
            "SmartTask",

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
      "Welcome to SmartTask 🎉",

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
            Welcome to SmartTask!
          </h1>

          <p>
            Hi ${safeName},
          </p>

          <p>
            Your SmartTask account has
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
            Open SmartTask
          </a>

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
      "Reset your SmartTask password",

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
            reset your SmartTask password.
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
      "Your SmartTask password was changed",

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
            Your SmartTask password was
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
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
};
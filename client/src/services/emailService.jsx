const BREVO_API_URL =
  "https://api.brevo.com/v3/smtp/email";

function getBrevoConfig() {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail =
    process.env.EMAIL_FROM;
  const senderName =
    process.env.EMAIL_FROM_NAME ||
    "SmartTask";

  if (!apiKey) {
    throw new Error(
      "BREVO_API_KEY is not configured."
    );
  }

  if (!senderEmail) {
    throw new Error(
      "EMAIL_FROM is not configured."
    );
  }

  return {
    apiKey,
    senderEmail,
    senderName,
  };
}

async function sendEmail({
  to,
  toName,
  subject,
  htmlContent,
  textContent,
  tags = [],
}) {
  const {
    apiKey,
    senderEmail,
    senderName,
  } = getBrevoConfig();

  const response = await fetch(
    BREVO_API_URL,
    {
      method: "POST",

      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },

      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },

        to: [
          {
            email: to,
            name: toName || undefined,
          },
        ],

        subject,

        htmlContent,

        textContent,

        tags,
      }),
    }
  );

  const data =
    await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error(
      "Brevo email error:",
      JSON.stringify(
        data,
        null,
        2
      )
    );

    throw new Error(
      data?.message ||
        "Brevo failed to send email."
    );
  }

  console.log(
    "Brevo email sent:",
    data?.messageId || "success"
  );

  return data;
}


/* ==================================================
   WELCOME EMAIL
   ================================================== */

async function sendWelcomeEmail(user) {
  return sendEmail({
    to: user.email,

    toName: user.name,

    subject:
      "Welcome to SmartTask",

    tags: [
      "smarttask",
      "welcome",
    ],

    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Welcome to SmartTask</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f5f7fb;
  font-family:Arial,Helvetica,sans-serif;
  color:#17203a;
">

  <div style="
    max-width:600px;
    margin:40px auto;
    background:#ffffff;
    border-radius:16px;
    padding:40px;
    box-shadow:0 8px 30px rgba(0,0,0,.08);
  ">

    <div style="
      width:46px;
      height:46px;
      border-radius:12px;
      background:#625bff;
      color:#ffffff;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:24px;
      font-weight:bold;
      margin-bottom:24px;
    ">
      ✓
    </div>

    <h1 style="
      margin:0 0 12px;
      font-size:28px;
    ">
      Welcome to SmartTask, ${escapeHtml(
        user.name
      )}!
    </h1>

    <p style="
      font-size:16px;
      line-height:1.6;
      color:#5f6980;
    ">
      Your SmartTask account has been created
      successfully.
    </p>

    <p style="
      font-size:16px;
      line-height:1.6;
      color:#5f6980;
    ">
      You can now organize your tasks,
      manage priorities, track deadlines,
      and use AI to understand your workload.
    </p>

    <div style="
      margin-top:30px;
      padding:18px;
      background:#f5f4ff;
      border-radius:12px;
    ">
      <strong>SmartTask</strong><br />
      Task Management
    </div>

  </div>

</body>
</html>
`,

    textContent:
      `Welcome to SmartTask, ${user.name}!

Your SmartTask account has been created successfully.

You can now organize tasks, manage priorities,
track deadlines, and analyze your workload.

SmartTask - Task Management`,
  });
}


/* ==================================================
   LOGIN NOTIFICATION
   ================================================== */

async function sendLoginNotification(user) {
  return sendEmail({
    to: user.email,

    toName: user.name,

    subject:
      "New login to your SmartTask account",

    tags: [
      "smarttask",
      "login",
    ],

    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>SmartTask Login</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f5f7fb;
  font-family:Arial,Helvetica,sans-serif;
  color:#17203a;
">

  <div style="
    max-width:600px;
    margin:40px auto;
    background:#ffffff;
    border-radius:16px;
    padding:40px;
    box-shadow:0 8px 30px rgba(0,0,0,.08);
  ">

    <h1 style="
      margin-top:0;
      font-size:26px;
    ">
      New SmartTask login
    </h1>

    <p style="
      font-size:16px;
      line-height:1.6;
      color:#5f6980;
    ">
      Hi ${escapeHtml(user.name)},
    </p>

    <p style="
      font-size:16px;
      line-height:1.6;
      color:#5f6980;
    ">
      Your SmartTask account was just signed in.
    </p>

    <div style="
      margin:25px 0;
      padding:18px;
      background:#f5f7fb;
      border-radius:12px;
    ">
      <strong>Email:</strong>
      ${escapeHtml(user.email)}
      <br />
      <strong>Time:</strong>
      ${new Date().toLocaleString()}
    </div>

    <p style="
      font-size:15px;
      line-height:1.6;
      color:#5f6980;
    ">
      If this was you, no action is required.
      If you do not recognize this login,
      use the password reset option in SmartTask
      immediately.
    </p>

  </div>

</body>
</html>
`,

    textContent:
      `New SmartTask login

Hi ${user.name},

Your SmartTask account was just signed in.

Email: ${user.email}
Time: ${new Date().toLocaleString()}

If this was you, no action is required.
If you do not recognize this login,
reset your SmartTask password immediately.`,
  });
}


/* ==================================================
   PASSWORD RESET EMAIL
   ================================================== */

async function sendPasswordResetEmail(
  user,
  resetUrl
) {
  return sendEmail({
    to: user.email,

    toName: user.name,

    subject:
      "Reset your SmartTask password",

    tags: [
      "smarttask",
      "password-reset",
    ],

    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Reset your SmartTask password</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f5f7fb;
  font-family:Arial,Helvetica,sans-serif;
  color:#17203a;
">

  <div style="
    max-width:600px;
    margin:40px auto;
    background:#ffffff;
    border-radius:16px;
    padding:40px;
    box-shadow:0 8px 30px rgba(0,0,0,.08);
  ">

    <div style="
      width:46px;
      height:46px;
      border-radius:12px;
      background:#625bff;
      color:#ffffff;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:24px;
      font-weight:bold;
      margin-bottom:24px;
    ">
      🔑
    </div>

    <h1 style="
      margin:0 0 12px;
      font-size:27px;
    ">
      Reset your password
    </h1>

    <p style="
      font-size:16px;
      line-height:1.6;
      color:#5f6980;
    ">
      Hi ${escapeHtml(user.name)},
    </p>

    <p style="
      font-size:16px;
      line-height:1.6;
      color:#5f6980;
    ">
      We received a request to reset the password
      for your SmartTask account.
    </p>

    <div style="
      margin:30px 0;
      text-align:center;
    ">

      <a
        href="${resetUrl}"
        style="
          display:inline-block;
          padding:14px 24px;
          background:#625bff;
          color:#ffffff;
          text-decoration:none;
          border-radius:10px;
          font-weight:bold;
        "
      >
        Reset Password
      </a>

    </div>

    <p style="
      font-size:14px;
      line-height:1.6;
      color:#7b849c;
    ">
      This password reset link expires in
      15 minutes and can only be used once.
    </p>

    <p style="
      font-size:14px;
      line-height:1.6;
      color:#7b849c;
    ">
      If you did not request this password reset,
      you can safely ignore this email.
    </p>

  </div>

</body>
</html>
`,

    textContent:
      `Reset your SmartTask password

Hi ${user.name},

We received a request to reset the password
for your SmartTask account.

Reset your password here:

${resetUrl}

This link expires in 15 minutes and can
only be used once.

If you did not request this password reset,
you can safely ignore this email.`,
  });
}


/* ==================================================
   HTML ESCAPING
   ================================================== */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


module.exports = {
  sendWelcomeEmail,
  sendLoginNotification,
  sendPasswordResetEmail,
};


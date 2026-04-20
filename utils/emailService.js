const nodemailer = require("nodemailer");

const isConfigured =
  process.env.EMAIL_USER &&
  process.env.EMAIL_USER !== "your-email@gmail.com" &&
  process.env.EMAIL_PASS &&
  process.env.EMAIL_PASS !== "your-16-char-app-password";

const transporter = isConfigured
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null;

function buildEmail(bodyHtml) {
  return `
    <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:12px;background:#f9f9f9;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#2c3e50;font-size:28px;font-weight:700;margin-bottom:8px;">LibroHub</h1>
        <p style="color:#7f8c8d;font-size:16px;">Library Management System</p>
      </div>
      <div style="background:#fff;padding:32px;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,.05);">
        ${bodyHtml}
      </div>
      <div style="text-align:center;margin-top:32px;">
        <p style="color:#95a5a6;font-size:12px;">&copy; ${new Date().getFullYear()} LibroHub. All rights reserved.</p>
      </div>
    </div>`;
}

/**
 * Sends a one-time sign-in verification code (for the Email/Phone direct method).
 */
async function sendVerificationEmail(to, code, role) {
  if (!transporter) {
    console.warn("[EMAIL] SMTP not configured — skipping OTP send.");
    return false;
  }
  const body = `
    <p style="color:#34495e;font-size:18px;margin-bottom:24px;">Hello!</p>
    <p style="color:#34495e;font-size:16px;line-height:1.6;margin-bottom:32px;">
      You requested a one-time sign-in code for LibroHub as a <strong>${role.toUpperCase()}</strong>.
    </p>
    <div style="background:linear-gradient(135deg,#3498db,#2980b9);color:#fff;padding:20px;border-radius:8px;text-align:center;font-size:32px;font-weight:700;letter-spacing:4px;margin-bottom:32px;">
      ${code}
    </div>
    <p style="color:#7f8c8d;font-size:14px;text-align:center;">
      This code expires in <strong>10 minutes</strong>. If you did not request this, please ignore.
    </p>`;
  const info = await transporter.sendMail({
    from: `"LibroHub Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🔐 Your LibroHub Sign-In Code",
    html: buildEmail(body),
  });
  console.log(`[SUCCESS] OTP email sent to ${to}: ${info.messageId}`);
  return true;
}

/**
 * Sends a welcome email with the user's permanent login verification code.
 * Sent after first-time registration.
 */
async function sendWelcomeEmail(to, name, verificationCode, role) {
  if (!transporter) {
    console.warn("[EMAIL] SMTP not configured — skipping welcome email.");
    return false;
  }
  const body = `
    <p style="color:#34495e;font-size:18px;margin-bottom:16px;">Welcome, <strong>${name}</strong>! 🎉</p>
    <p style="color:#34495e;font-size:16px;line-height:1.6;margin-bottom:24px;">
      Your LibroHub <strong>${role.toUpperCase()}</strong> account has been created successfully.
      Save the code below — you will need it whenever you sign in <em>manually</em> with email and password.
    </p>
    <p style="color:#7f8c8d;font-size:13px;margin-bottom:8px;text-align:center;text-transform:uppercase;letter-spacing:1px;">Your Login Verification Code</p>
    <div style="background:linear-gradient(135deg,#6a11cb,#2575fc);color:#fff;padding:20px;border-radius:8px;text-align:center;font-size:20px;font-weight:700;letter-spacing:3px;margin-bottom:24px;word-break:break-all;">
      ${verificationCode}
    </div>
    <p style="color:#7f8c8d;font-size:13px;line-height:1.6;text-align:center;">
      Keep this code somewhere safe. You will enter it along with your email<br>and password when using the manual login form.
    </p>`;
  const info = await transporter.sendMail({
    from: `"LibroHub" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🎉 Welcome to LibroHub – Your Verification Code",
    html: buildEmail(body),
  });
  console.log(`[SUCCESS] Welcome email sent to ${to}: ${info.messageId}`);
  return true;
}

module.exports = { sendVerificationEmail, sendWelcomeEmail };

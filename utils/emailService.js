const nodemailer = require("nodemailer");

// Create the transporter only if credentials are changed from placeholders
const isConfigured = 
  process.env.EMAIL_USER && 
  process.env.EMAIL_USER !== "your-email@gmail.com" &&
  process.env.EMAIL_PASS &&
  process.env.EMAIL_PASS !== "your-16-char-app-password";

const transporter = isConfigured ? nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
}) : null;

/**
 * Sends a verification code to the user's email.
 * @param {string} to - Recipient email address
 * @param {string} code - The generated verification code
 * @param {string} role - The user's role (admin/user)
 */
async function sendVerificationEmail(to, code, role) {
  const mailOptions = {
    from: `"LibroHub Support" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: "🔐 Your LibroHub Verification Code",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2c3e50; font-size: 28px; font-weight: 700; margin-bottom: 8px;">LibroHub</h1>
          <p style="color: #7f8c8d; font-size: 16px;">Library Management System</p>
        </div>
        <div style="background-color: #ffffff; padding: 32px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <p style="color: #34495e; font-size: 18px; margin-bottom: 24px;">Hello!</p>
          <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
            You have requested a verification code to register as a <strong>${role.toUpperCase()}</strong> in the LibroHub system.
          </p>
          <div style="background: linear-gradient(135deg, #3498db, #2980b9); color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: 700; letter-spacing: 4px; margin-bottom: 32px;">
            ${code}
          </div>
          <p style="color: #7f8c8d; font-size: 14px; line-height: 1.6; text-align: center;">
            This code will expire in <strong>10 minutes</strong>.<br>
            If you did not request this code, please ignore this email.
          </p>
        </div>
        <div style="text-align: center; margin-top: 32px;">
          <p style="color: #95a5a6; font-size: 12px;">
            © ${new Date().getFullYear()} LibroHub. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SUCCESS] Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[ERROR] Failed to send email to ${to}:`, error.message);
    throw error;
  }
}

module.exports = { sendVerificationEmail };

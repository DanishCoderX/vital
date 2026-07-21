const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("[emailService] GMAIL_USER / GMAIL_APP_PASSWORD not set — emails will be logged instead of sent");
    return null;
  }
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
  return transporter;
}

/** Sends a password reset code by email. Falls back to console logging if email isn't configured, so local dev still works. */
async function sendResetCodeEmail(toEmail, code) {
  const t = getTransporter();

  if (!t) {
    console.log(`[emailService] (email not configured) Password reset code for ${toEmail}: ${code}`);
    return;
  }

  await t.sendMail({
    from: `Vital <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Your Vital password reset code",
    text: `Your password reset code is ${code}. It expires in 15 minutes. If you didn't request this, you can safely ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
        <h2 style="color: #2E9CCA;">Reset your Vital password</h2>
        <p>Use this code to reset your password. It expires in 15 minutes.</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 4px; color: #1F2A2E;">${code}</p>
        <p style="color: #6B7A7E; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendResetCodeEmail };
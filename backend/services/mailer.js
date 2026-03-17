const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER || 'a.ramu8688@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || '';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = Number(process.env.EMAIL_PORT || 465);
const EMAIL_SECURE = process.env.EMAIL_SECURE !== 'false';

let transporter;
if (EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_SECURE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
}

async function sendEmail(to, subject, text, html) {
  if (!transporter) {
    // If no SMTP credentials provided, fallback to console logging.
    // eslint-disable-next-line no-console
    console.log(`[MAIL MOCK] to=${to} subject=${subject} text=${text}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: EMAIL_USER,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[MAIL ERROR] Failed sending email', err);
    // fallback log link for development
    // no throw to avoid operation breakage
    // eslint-disable-next-line no-console
    console.log(`[MAIL FALLBACK] to=${to} subject=${subject} text=${text}`);
  }
}

async function sendVerificationEmail(email, verifyUrl) {
  const subject = 'Verify your email';
  const text = `Please verify your email by clicking this link: ${verifyUrl}`;
  const html = `<p>Please verify your email by clicking <a href="${verifyUrl}">this link</a>.</p>`;
  await sendEmail(email, subject, text, html);
}

async function sendPasswordResetEmail(email, resetUrl) {
  const subject = 'Reset your password';
  const text = `Reset your password by clicking this link: ${resetUrl}`;
  const html = `<p>Reset your password by clicking <a href="${resetUrl}">this link</a>.</p>`;
  await sendEmail(email, subject, text, html);
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };

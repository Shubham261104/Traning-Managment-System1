const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, text }) => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    return await transporter.sendMail({
      from: `"SkillBridge" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    });
  } else {
    // If SMTP is not verified/configured, simulate emailing by printing to consoles
    console.log('\n==================================================');
    console.log(`📧 EMAIL SIMULATION (SMTP not configured in backend/.env)`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    ${text || html.replace(/<[^>]*>/g, '')}`);
    console.log('==================================================\n');
    return { messageId: 'simulated-id' };
  }
};

module.exports = { sendEmail };

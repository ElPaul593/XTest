const nodemailer = require('nodemailer');

function createTransport() {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const port = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587);
  const secure = String(process.env.EMAIL_SECURE || '').toLowerCase() === 'true' || port === 465;

  if (!host || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Faltan variables SMTP: EMAIL_HOST, EMAIL_USER o EMAIL_PASS');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
}

exports.sendCode = async (email, code) => {
  const transporter = createTransport();
  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Código para recuperar tu cuenta',
    text: `Tu código de recuperación es ${code}. Expira en 10 minutos y solo puede utilizarse una vez.`,
    html: `<p>Tu código de recuperación es:</p><p><strong>${code}</strong></p><p>Expira en 10 minutos y solo puede utilizarse una vez.</p>`
  });
};

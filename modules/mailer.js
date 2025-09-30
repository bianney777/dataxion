// modules/mailer.js
// Módulo simple para envío (o simulación) de email de verificación.
// Si no se configuran variables SMTP, usa un transporte "stream" que solo imprime el contenido en consola.

const nodemailer = require('nodemailer');

function buildTransport(){
  if(process.env.SMTP_HOST){
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: !!process.env.SMTP_SECURE, // true para 465
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
    });
  }
  // Fallback: imprime el correo en consola, sin envío real
  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true
  });
}

const transport = buildTransport();

async function sendVerificationEmail(to, token, baseUrl){
  const verifyLink = `${baseUrl.replace(/\/$/,'')}/auth/verify?token=${token}`;
  const html = `<p>Hola,</p>
  <p>Gracias por registrarte en <strong>DataXion</strong>. Haz clic en el siguiente enlace para activar tu cuenta:</p>
  <p><a href="${verifyLink}" target="_blank">Verificar cuenta</a></p>
  <p>Si no fuiste tú, ignora este mensaje.</p>`;
  const info = await transport.sendMail({
    from: process.env.MAIL_FROM || 'no-reply@dataxion.local',
    to,
    subject: 'Verifica tu cuenta - DataXion',
    html,
    text: `Visita esta URL para verificar tu cuenta: ${verifyLink}`
  });
  if(info.message){
    console.log('[mailer] Email simulado (no SMTP configurado) =>');
    console.log(info.message.toString());
  } else {
    console.log('[mailer] Email de verificación enviado a', to);
  }
}

module.exports = { sendVerificationEmail };
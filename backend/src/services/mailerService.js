const axios = require('axios');
const AppError = require('../utils/AppError');
const { EXTERNAL_API_URL, DEFAULT_REQUEST_TIMEOUT_MS } = require('../config/externalApis');

/**
 * PATRÓN DE DISEÑO: Adapter / Gateway de servicio externo
 *
 * Este backend NO envía correo por SMTP. El envío lo realiza la API consumidora
 * (la misma que resuelve asientos y pricing), que es quien tiene configuradas las
 * credenciales del proveedor de correo. Aquí solo se construye el mensaje y se
 * delega el envío por HTTP.
 *
 * Ventajas de centralizar el envío en la API consumidora:
 *  - las credenciales de correo no viven en este servicio ni en su .env;
 *  - un único lugar que mantener si cambia el proveedor (SMTP, Resend, SES…);
 *  - el backend sigue siendo desplegable sin variables SMTP.
 *
 * Contrato esperado por la API consumidora:
 *   POST {MAIL_API_URL}{MAIL_API_PATH}
 *   body: { to, subject, html, text, from, appName, meta, attachments? }
 *   200/201 => { ok: true, id?: string }
 *
 * `attachments` es opcional y cada elemento tiene la forma
 * `{ filename, contentType, contentBase64 }`. Se usa base64 porque el adjunto
 * viaja dentro de un cuerpo JSON (lo necesita el PDF del boleto).
 */

// La URL del servicio de correo puede apuntar a otro host que el de asientos;
// si no se define, se reutiliza la API consumidora ya configurada.
const MAIL_API_URL = process.env.MAIL_API_URL || EXTERNAL_API_URL;
const MAIL_API_PATH = process.env.MAIL_API_PATH || '/api/mail/send';
const MAIL_API_KEY = process.env.MAIL_API_KEY || '';

// El envío de correo tolera más latencia que una consulta de asientos.
const MAIL_TIMEOUT_MS = Number(process.env.MAIL_API_TIMEOUT_MS || 15000);

const APP_NAME = process.env.APP_NAME || 'CulturalTrip';
const MAIL_FROM = process.env.MAIL_FROM || process.env.EMAIL_FROM || null;

function buildUrl() {
  const base = String(MAIL_API_URL || '').replace(/\/+$/, '');
  const path = String(MAIL_API_PATH || '').startsWith('/')
    ? MAIL_API_PATH
    : `/${MAIL_API_PATH}`;
  return `${base}${path}`;
}

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (MAIL_API_KEY) {
    headers['x-api-key'] = MAIL_API_KEY;
  }
  return headers;
}

/**
 * Envía un correo a través de la API consumidora.
 *
 * @param {object} mensaje
 * @param {string} mensaje.to      Destinatario.
 * @param {string} mensaje.subject Asunto.
 * @param {string} mensaje.html    Cuerpo HTML.
 * @param {string} [mensaje.text]  Alternativa en texto plano.
 * @param {object} [mensaje.meta]  Datos de trazabilidad (tipo de correo, usuario…).
 * @param {Array}  [mensaje.attachments] Adjuntos `{ filename, contentType, contentBase64 }`.
 * @returns {Promise<{ok: boolean, id?: string, error?: string}>}
 *   Nunca lanza por un fallo de red: devuelve `ok: false` para que el flujo que
 *   lo invoca decida si eso debe romper la petición del usuario o no.
 */
exports.enviarCorreo = async ({ to, subject, html, text, meta = {}, attachments = [] }) => {
  if (!to) {
    throw new AppError('Falta el destinatario del correo', 400);
  }
  if (!MAIL_API_URL) {
    throw new AppError('MAIL_API_URL/EXTERNAL_API_URL no está configurado en el servidor', 500);
  }

  const url = buildUrl();
  const payload = {
    to,
    subject,
    html,
    text: text || null,
    from: MAIL_FROM,
    appName: APP_NAME,
    meta
  };

  // Solo se incluye la clave si hay adjuntos, para no mandar un array vacío a
  // una API que quizá no contemple el campo.
  if (Array.isArray(attachments) && attachments.length > 0) {
    payload.attachments = attachments;
  }

  try {
    const response = await axios.post(url, payload, {
      headers: buildHeaders(),
      timeout: MAIL_TIMEOUT_MS
    });

    const data = response?.data || {};
    // Se acepta tanto { ok: true } como un 2xx sin cuerpo.
    const ok = data.ok !== false;

    if (!ok) {
      console.error('[mailerService] La API de correo rechazó el envío:', data);
      return { ok: false, error: data.error || 'La API de correo rechazó el envío' };
    }

    return { ok: true, id: data.id || data.messageId || null };
  } catch (error) {
    // Un fallo de la API de correo no debe filtrar al cliente si un email existe
    // o no, ni tumbar el flujo de reseteo. Se registra y se informa al llamador.
    const detalle = error?.response?.data || error.message;
    console.error(`[mailerService] Error enviando correo a ${to} vía ${url}:`, detalle);
    return { ok: false, error: typeof detalle === 'string' ? detalle : 'Servicio de correo no disponible' };
  }
};

/**
 * Plantilla del correo de recuperación de contraseña.
 * Mantiene la identidad visual del proyecto (negro + amarillo) y es intencionadamente
 * sobria: muchos clientes de correo descartan CSS avanzado, así que todo va inline.
 */
exports.construirCorreoResetPassword = ({ nombre, resetUrl, minutosValidez }) => {
  const saludo = nombre ? `Hola ${nombre},` : 'Hola,';

  const html = `
<!doctype html>
<html lang="es">
  <head><meta charset="utf-8" /></head>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:32px;">
            <tr>
              <td style="color:#ffd700;font-size:22px;font-weight:700;padding-bottom:8px;">${APP_NAME}</td>
            </tr>
            <tr>
              <td style="color:#ffffff;font-size:18px;font-weight:600;padding-bottom:16px;">Restablecer tu contraseña</td>
            </tr>
            <tr>
              <td style="color:#cfcfcf;font-size:14px;line-height:22px;padding-bottom:24px;">
                ${saludo}<br /><br />
                Recibimos una solicitud para restablecer la contraseña de tu cuenta.
                Pulsa el botón para elegir una nueva. El enlace caduca en
                <strong style="color:#ffffff;">${minutosValidez} minutos</strong> y solo puede usarse una vez.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <a href="${resetUrl}"
                   style="display:inline-block;background:#ffd700;color:#0a0a0a;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:6px;">
                  Restablecer contraseña
                </a>
              </td>
            </tr>
            <tr>
              <td style="color:#8a8a8a;font-size:12px;line-height:20px;border-top:1px solid #2a2a2a;padding-top:16px;">
                Si el botón no funciona, copia este enlace en tu navegador:<br />
                <span style="color:#ffd700;word-break:break-all;">${resetUrl}</span><br /><br />
                Si no solicitaste este cambio, puedes ignorar este correo: tu contraseña actual seguirá siendo válida.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  const text = [
    saludo,
    '',
    'Recibimos una solicitud para restablecer la contraseña de tu cuenta.',
    `Abre este enlace para elegir una nueva (caduca en ${minutosValidez} minutos y solo puede usarse una vez):`,
    resetUrl,
    '',
    'Si no solicitaste este cambio, ignora este correo: tu contraseña actual seguirá siendo válida.',
    '',
    APP_NAME
  ].join('\n');

  return {
    subject: `${APP_NAME} · Restablecer tu contraseña`,
    html,
    text
  };
};

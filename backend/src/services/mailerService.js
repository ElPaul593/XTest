const fs = require('fs');
const path = require('path');
const axios = require('axios');
const nodemailer = require('nodemailer');
const AppError = require('../utils/AppError');
const { EXTERNAL_API_URL } = require('../config/externalApis');

/**
 * Envío de correo con CADENA DE TRANSPORTES.
 *
 * ## Por qué hay más de un transporte
 *
 * La versión anterior delegaba el envío EXCLUSIVAMENTE en la API consumidora
 * (`POST /api/mail/send`). Ese endpoint todavía no existe allí, así que cada
 * intento devolvía 404 y el correo no salía nunca: la recuperación de contraseña
 * respondía 502 y el boleto no llegaba. Hacer depender toda la mensajería de un
 * servicio que aún no estaba construido dejó la función inservible.
 *
 * Ahora se prueban, en orden, hasta que uno acepta el mensaje:
 *
 *   1. **API consumidora** (si responde). Es el destino preferido: centraliza las
 *      credenciales fuera de este backend.
 *   2. **SMTP directo** con nodemailer, si hay `EMAIL_HOST`/`EMAIL_USER`/`EMAIL_PASS`.
 *      Es lo que hace falta en producción mientras la API no tenga el endpoint.
 *   3. **Archivo en disco** (solo fuera de producción). Escribe el correo en
 *      `tmp/correos/` y lo registra en consola. Permite recorrer el flujo completo
 *      —registro, verificación, reseteo— sin ningún proveedor configurado.
 *
 * El transporte 3 NUNCA actúa en producción: allí, si 1 y 2 fallan, el envío
 * devuelve `ok: false` y quien llama decide. Dar por bueno un correo que solo se
 * guardó en disco sería peor que fallar.
 *
 * Contrato de la API consumidora (transporte 1):
 *   POST {MAIL_API_URL}{MAIL_API_PATH}
 *   body: { to, subject, html, text, from, appName, meta, attachments? }
 *   200/201 => { ok: true, id?: string }
 *
 * `attachments` es opcional, con la forma `{ filename, contentType, contentBase64 }`.
 * Se usa base64 porque el adjunto viaja dentro de un cuerpo JSON (lo necesita el
 * PDF del boleto).
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

const EN_PRODUCCION = process.env.NODE_ENV === 'production';

// Permite desactivar el intento contra la API consumidora mientras no tenga el
// endpoint, y ahorrarse así 15 s de espera en cada envío.
const MAIL_API_HABILITADA = String(process.env.MAIL_API_ENABLED || 'true').toLowerCase() !== 'false';

/** Carpeta donde el transporte de desarrollo deja los correos. */
const CARPETA_CORREOS = path.join(process.cwd(), 'tmp', 'correos');

// ---------------------------------------------------------------------------
// Transporte 1 · API consumidora
// ---------------------------------------------------------------------------
async function enviarPorApi(payload) {
  if (!MAIL_API_HABILITADA) return { ok: false, motivo: 'MAIL_API_ENABLED=false' };
  if (!MAIL_API_URL) return { ok: false, motivo: 'MAIL_API_URL sin configurar' };

  const url = buildUrl();

  try {
    const response = await axios.post(url, payload, {
      headers: buildHeaders(),
      timeout: MAIL_TIMEOUT_MS
    });

    const data = response?.data || {};
    if (data.ok === false) {
      return { ok: false, motivo: data.error || 'la API de correo rechazó el envío' };
    }

    return { ok: true, id: data.id || data.messageId || null, via: 'api-consumidora' };
  } catch (error) {
    const detalle = error?.response?.status
      ? `HTTP ${error.response.status}`
      : (error.code || error.message);
    return { ok: false, motivo: `${url} → ${detalle}` };
  }
}

// ---------------------------------------------------------------------------
// Transporte 2 · SMTP directo
// ---------------------------------------------------------------------------
let transporteSmtp = null;

function getTransporteSmtp() {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  if (!transporteSmtp) {
    const port = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587);
    transporteSmtp = nodemailer.createTransport({
      host,
      port,
      // El 465 es TLS implícito; el 587 usa STARTTLS, que nodemailer negocia solo.
      secure: String(process.env.EMAIL_SECURE || '').toLowerCase() === 'true' || port === 465,
      auth: { user, pass }
    });
  }

  return transporteSmtp;
}

async function enviarPorSmtp({ to, subject, html, text, from, attachments }) {
  const transporte = getTransporteSmtp();
  if (!transporte) {
    return { ok: false, motivo: 'faltan EMAIL_HOST / EMAIL_USER / EMAIL_PASS' };
  }

  try {
    const info = await transporte.sendMail({
      from: from || process.env.EMAIL_USER,
      to,
      subject,
      text: text || undefined,
      html,
      // nodemailer espera un Buffer; la API HTTP esperaba base64.
      attachments: (attachments || []).map((a) => ({
        filename: a.filename,
        contentType: a.contentType,
        content: Buffer.from(a.contentBase64, 'base64')
      }))
    });

    return { ok: true, id: info.messageId, via: 'smtp' };
  } catch (error) {
    return { ok: false, motivo: `SMTP → ${error.message}` };
  }
}

// ---------------------------------------------------------------------------
// Transporte 3 · Archivo en disco (solo desarrollo)
// ---------------------------------------------------------------------------
async function enviarADisco({ to, subject, html, meta }) {
  if (EN_PRODUCCION) {
    return { ok: false, motivo: 'el volcado a disco está deshabilitado en producción' };
  }

  try {
    fs.mkdirSync(CARPETA_CORREOS, { recursive: true });

    const sello = new Date().toISOString().replace(/[:.]/g, '-');
    const etiqueta = (meta?.tipo || 'correo').replace(/[^a-z0-9-]/gi, '');
    const archivo = path.join(CARPETA_CORREOS, `${sello}_${etiqueta}.html`);

    fs.writeFileSync(archivo, html, 'utf8');

    // Los enlaces (verificación, reseteo) se imprimen aparte: es lo que hace
    // falta para seguir el flujo desde la terminal sin abrir el archivo.
    const enlaces = [...String(html).matchAll(/https?:\/\/[^\s"'<>]+/g)]
      .map((m) => m[0])
      .filter((u) => u.includes('/api/auth/'));

    console.log('\n📧 [mailerService] Correo NO enviado a un proveedor real (modo desarrollo)');
    console.log(`   Para:    ${to}`);
    console.log(`   Asunto:  ${subject}`);
    console.log(`   Archivo: ${archivo}`);
    enlaces.forEach((u) => console.log(`   Enlace:  ${u}`));
    console.log('');

    return { ok: true, id: `local-${sello}`, via: 'archivo-local', archivo };
  } catch (error) {
    return { ok: false, motivo: `disco → ${error.message}` };
  }
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

  /**
   * En los tests NO se envía correo de verdad.
   *
   * Ahora que hay credenciales SMTP reales en `.env`, cada `npm test` intentaría
   * mandar un correo por cada usuario que registran las pruebas de integración
   * (media docena larga). Eso llena el buzón de rebotes de direcciones
   * `@example.com` y puede hacer que Gmail limite la cuenta por envíos masivos.
   *
   * Jest define `NODE_ENV=test` automáticamente. Las pruebas que sí necesitan
   * comprobar el contenido del correo sustituyen este módulo con `jest.mock`
   * (ver `passwordReset.test.js`), así que no pierden cobertura.
   */
  if (process.env.NODE_ENV === 'test') {
    return { ok: true, id: `test-${Date.now()}`, via: 'test-noop' };
  }

  // Cadena de transportes: se prueba cada uno y el primero que acepta, gana.
  const intentos = [];

  const transportes = [
    { nombre: 'api-consumidora', fn: () => enviarPorApi(payload) },
    { nombre: 'smtp', fn: () => enviarPorSmtp({ ...payload, attachments }) },
    { nombre: 'archivo-local', fn: () => enviarADisco(payload) }
  ];

  for (const transporte of transportes) {
    const resultado = await transporte.fn();

    if (resultado.ok) {
      // Si hizo falta recurrir a un transporte posterior, se deja constancia de
      // por qué fallaron los anteriores: ese rastro es justamente lo que faltó
      // cuando el 404 de la API pasó inadvertido.
      if (intentos.length > 0) {
        console.warn(
          `[mailerService] Correo entregado vía ${resultado.via}. Descartados: ` +
          intentos.map((i) => `${i.nombre} (${i.motivo})`).join('; ')
        );
      }
      return { ok: true, id: resultado.id, via: resultado.via };
    }

    intentos.push({ nombre: transporte.nombre, motivo: resultado.motivo });
  }

  const resumen = intentos.map((i) => `${i.nombre}: ${i.motivo}`).join(' | ');
  console.error(`[mailerService] No se pudo enviar el correo a ${to}. ${resumen}`);

  return { ok: false, error: 'Ningún transporte de correo disponible', detalle: resumen };
};

/**
 * Diagnóstico: qué transportes de correo están disponibles ahora mismo.
 * Existe porque el fallo original —la API devolvía 404 en cada envío— no tenía
 * forma de verse sin provocar un envío real.
 */
exports.diagnostico = async () => {
  const smtpConfigurado = Boolean(getTransporteSmtp());
  const prueba = await enviarPorApi({ to: '__diagnostico__', subject: '__diagnostico__', html: '' });

  /**
   * «Disponible» significa que el endpoint existe y contesta.
   *
   * Un rechazo de validación (400/422) cuenta como disponible: el endpoint está
   * ahí. Un 404, una conexión rechazada o el transporte apagado, no. Sin este
   * último caso el diagnóstico decía «disponible» con `MAIL_API_ENABLED=false`,
   * que es justo lo contrario de lo que pasa.
   */
  const apiNoAlcanzable =
    !MAIL_API_HABILITADA ||
    !MAIL_API_URL ||
    /HTTP 404|HTTP 5\d\d|ECONNREFUSED|ENOTFOUND|ECONNABORTED|ETIMEDOUT/.test(prueba.motivo || '');

  return {
    apiConsumidora: {
      url: MAIL_API_URL ? buildUrl() : null,
      habilitada: MAIL_API_HABILITADA,
      disponible: prueba.ok || !apiNoAlcanzable,
      motivo: prueba.ok ? null : prueba.motivo
    },
    smtp: {
      configurado: smtpConfigurado,
      host: process.env.EMAIL_HOST || process.env.SMTP_HOST || null
    },
    archivoLocal: {
      disponible: !EN_PRODUCCION,
      carpeta: EN_PRODUCCION ? null : CARPETA_CORREOS
    },
    entorno: process.env.NODE_ENV || 'development'
  };
};

/**
 * Plantilla del correo de verificación de la dirección.
 * Misma identidad visual que el resto (negro + amarillo), con todo el CSS inline
 * porque muchos clientes de correo descartan las hojas de estilo.
 */
exports.construirCorreoVerificacion = ({ nombre, verifyUrl, horasValidez }) => {
  const saludo = nombre ? `Hola ${nombre},` : 'Hola,';

  const html = `
<!doctype html>
<html lang="es">
  <head><meta charset="utf-8" /></head>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:32px;">
          <tr><td style="color:#ffd700;font-size:22px;font-weight:700;padding-bottom:8px;">${APP_NAME}</td></tr>
          <tr><td style="color:#ffffff;font-size:18px;font-weight:600;padding-bottom:16px;">Confirma tu correo electrónico</td></tr>
          <tr><td style="color:#cfcfcf;font-size:14px;line-height:22px;padding-bottom:24px;">
            ${saludo}<br /><br />
            Gracias por registrarte. Confirma que esta dirección es tuya para que podamos
            enviarte tus boletos y permitirte recuperar la contraseña si la olvidas.
            El enlace caduca en <strong style="color:#ffffff;">${horasValidez} horas</strong>.
          </td></tr>
          <tr><td align="center" style="padding-bottom:24px;">
            <a href="${verifyUrl}" style="display:inline-block;background:#ffd700;color:#0a0a0a;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:6px;">
              Confirmar mi correo
            </a>
          </td></tr>
          <tr><td style="color:#8a8a8a;font-size:12px;line-height:20px;border-top:1px solid #2a2a2a;padding-top:16px;">
            Si el botón no funciona, copia este enlace en tu navegador:<br />
            <span style="color:#ffd700;word-break:break-all;">${verifyUrl}</span><br /><br />
            Si no te registraste en ${APP_NAME}, ignora este correo.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`.trim();

  const text = [
    saludo,
    '',
    `Confirma tu correo electrónico para terminar de activar tu cuenta en ${APP_NAME}.`,
    `El enlace caduca en ${horasValidez} horas:`,
    verifyUrl,
    '',
    `Si no te registraste en ${APP_NAME}, ignora este correo.`
  ].join('\n');

  return { subject: `${APP_NAME} · Confirma tu correo electrónico`, html, text };
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

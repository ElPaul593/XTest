const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const ReservaRepo = require('../repositories/reservaRepo');
const AppError = require('../utils/AppError');
const MailerService = require('./mailerService');

const SYSTEM_NAME = process.env.APP_NAME || 'Mundo Marino';

function getSeats(reserva) {
  if (Array.isArray(reserva.seatNumbers) && reserva.seatNumbers.length > 0) {
    return reserva.seatNumbers;
  }
  if (reserva.seatNumber) {
    return [reserva.seatNumber];
  }
  return [];
}

function getTotal(reserva) {
  return reserva?.pricing?.total ?? reserva?.precio?.totalPagar ?? reserva?.ruta?.price ?? null;
}

function buildPayload(reserva) {
  const origen = reserva?.ruta?.from || '';
  const destino = reserva?.ruta?.to || '';
  const asientos = getSeats(reserva);
  const total = getTotal(reserva);

  return {
    boleto: String(reserva._id || reserva.id),
    ruta: `${origen} -> ${destino}`,
    asientos,
    fecha: reserva.fecha || null,
    estado: reserva.status,
    total
  };
}

/**
 * #14BUG CORREGIDO: el envío de boletos ya no depende de SMTP local.
 *
 * Antes este archivo creaba su propio transporte de `nodemailer` y exigía
 * `EMAIL_HOST`, `EMAIL_USER` y `EMAIL_PASS`. Ninguna de las tres existía en
 * `.env` ni en `.env.example`, así que el transporte lanzaba siempre "Faltan
 * variables SMTP", el `catch` lo capturaba y devolvía `{ ok: false }`.
 *
 * Lo grave era que el fallo era SILENCIOSO para el usuario: la reserva se
 * confirmaba, el PDF y el QR se generaban (gastando CPU) y nadie recibía nada.
 *
 * Ahora el envío se delega en la API consumidora, igual que el correo de
 * recuperación de contraseña (`services/mailerService.js`). El backend no habla
 * SMTP en ningún punto, y el PDF viaja como adjunto en base64.
 */

/** Cuerpo del correo del boleto, con la identidad visual del proyecto. */
function construirCuerpo({ payload, asientos }) {
  const totalTexto = payload.total != null ? `$${Number(payload.total).toFixed(2)}` : '—';

  const html = `
<!doctype html>
<html lang="es">
  <head><meta charset="utf-8" /></head>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:32px;">
          <tr><td style="color:#ffd700;font-size:22px;font-weight:700;padding-bottom:8px;">${SYSTEM_NAME}</td></tr>
          <tr><td style="color:#ffffff;font-size:18px;font-weight:600;padding-bottom:16px;">Tu boleto electrónico</td></tr>
          <tr><td style="color:#cfcfcf;font-size:14px;line-height:24px;padding-bottom:24px;">
            Adjuntamos tu boleto en PDF con el código QR que debes presentar al abordar.
          </td></tr>
          <tr><td style="padding-bottom:24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="color:#cfcfcf;font-size:14px;line-height:26px;">
              <tr><td style="color:#8a8a8a;">Ruta</td><td style="color:#ffffff;text-align:right;">${payload.ruta}</td></tr>
              <tr><td style="color:#8a8a8a;">Fecha</td><td style="color:#ffffff;text-align:right;">${payload.fecha || '—'}</td></tr>
              <tr><td style="color:#8a8a8a;">Asientos</td><td style="color:#ffffff;text-align:right;">${asientos}</td></tr>
              <tr><td style="color:#8a8a8a;">Estado</td><td style="color:#ffffff;text-align:right;">${payload.estado || '—'}</td></tr>
              <tr><td style="color:#8a8a8a;">Total</td><td style="color:#ffd700;text-align:right;font-weight:700;">${totalTexto}</td></tr>
            </table>
          </td></tr>
          <tr><td style="color:#8a8a8a;font-size:12px;line-height:20px;border-top:1px solid #2a2a2a;padding-top:16px;">
            Boleto nº ${payload.boleto}. Este mensaje se generó automáticamente.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`.trim();

  const text = [
    `${SYSTEM_NAME} — Tu boleto electrónico`,
    '',
    `Ruta: ${payload.ruta}`,
    `Fecha: ${payload.fecha || '—'}`,
    `Asientos: ${asientos}`,
    `Estado: ${payload.estado || '—'}`,
    `Total: ${totalTexto}`,
    '',
    'Adjuntamos el boleto en PDF con el código QR que debes presentar al abordar.',
    `Boleto nº ${payload.boleto}.`
  ].join('\n');

  return { html, text };
}

function renderPdfBuffer({ reserva, payload, qrBuffer }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(22).fillColor('#0f172a').text(SYSTEM_NAME, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(14).fillColor('#334155').text('Boleto electrónico', { align: 'center' });
    doc.moveDown(1.2);

    doc.fontSize(16).fillColor('#111827').text('Detalles de la reserva');
    doc.moveDown(0.5);

    const origen = reserva?.ruta?.from || '—';
    const destino = reserva?.ruta?.to || '—';
    const asientos = Array.isArray(payload.asientos) && payload.asientos.length > 0
      ? payload.asientos.join(', ')
      : '—';

    doc.fontSize(11).fillColor('#111827');
    doc.text(`Ruta: ${origen} -> ${destino}`);
    doc.text(`Fecha: ${payload.fecha || '—'}`);
    doc.text(`Asientos: ${asientos}`);
    doc.text(`Estado: ${payload.estado || '—'}`);
    const totalText = payload.total != null ? `$${Number(payload.total).toFixed(2)}` : '—';
    doc.text(`Total: ${totalText}`);
    doc.moveDown(1.2);

    doc.fontSize(16).fillColor('#111827').text('Código QR');
    doc.moveDown(0.5);
    doc.image(qrBuffer, {
      fit: [220, 220],
      align: 'center',
      valign: 'center'
    });
    doc.moveDown(1);

    doc.fontSize(10).fillColor('#475569').text(
      'Presenta este código QR al abordar. Este documento fue generado automáticamente.',
      { align: 'center' }
    );

    doc.end();
  });
}

exports.enviarBoletoPorCorreo = async (reservaId) => {
  const reserva = await ReservaRepo.findById(reservaId);

  if (!reserva) {
    throw new AppError('Reserva no encontrada', 404);
  }

  const reservaObj = reserva.toObject ? reserva.toObject() : reserva;
  const emailDestino = reservaObj?.user?.email;

  if (!emailDestino) {
    console.error(`[boletoEmailService] La reserva ${reservaId} no tiene un email de usuario asociado.`);
    return {
      ok: false,
      reservaId: String(reservaId),
      reason: 'USER_WITHOUT_EMAIL'
    };
  }

  const payload = buildPayload(reservaObj);
  const qrBuffer = await QRCode.toBuffer(JSON.stringify(payload), {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 320
  });
  const pdfBuffer = await renderPdfBuffer({ reserva: reservaObj, payload, qrBuffer });

  const asientos = Array.isArray(payload.asientos) && payload.asientos.length > 0
    ? payload.asientos.join(', ')
    : '—';
  const { html, text } = construirCuerpo({ payload, asientos });

  // El envío lo hace la API consumidora. `enviarCorreo` no lanza ante un fallo de
  // red: devuelve { ok: false }, así que no hace falta try/catch alrededor.
  const envio = await MailerService.enviarCorreo({
    to: emailDestino,
    subject: `${SYSTEM_NAME} - Tu boleto electrónico`,
    html,
    text,
    meta: { tipo: 'boleto', reservaId: String(reservaId) },
    attachments: [
      {
        filename: `boleto-${payload.boleto}.pdf`,
        contentType: 'application/pdf',
        // base64 porque el adjunto viaja dentro de un cuerpo JSON por HTTP.
        contentBase64: pdfBuffer.toString('base64')
      }
    ]
  });

  if (!envio.ok) {
    console.error(`[boletoEmailService] No se pudo enviar el boleto ${reservaId} a ${emailDestino}: ${envio.error}`);
    return {
      ok: false,
      reservaId: String(reservaId),
      to: emailDestino,
      error: envio.error
    };
  }

  return {
    ok: true,
    reservaId: String(reservaId),
    to: emailDestino,
    messageId: envio.id,
    payload
  };
};
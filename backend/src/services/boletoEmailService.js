const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const ReservaRepo = require('../repositories/reservaRepo');
const AppError = require('../utils/AppError');

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

function createTransport() {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const port = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587);
  const secure = String(process.env.EMAIL_SECURE || '').toLowerCase() === 'true' || port === 465;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    throw new Error('Faltan variables SMTP: EMAIL_HOST, EMAIL_USER o EMAIL_PASS');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
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

  try {
    const transporter = createTransport();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: emailDestino,
      subject: `${SYSTEM_NAME} - Tu boleto electrónico`,
      text: `Adjuntamos tu boleto electrónico para la ruta ${payload.ruta}.`,
      attachments: [
        {
          filename: `boleto-${payload.boleto}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    return {
      ok: true,
      reservaId: String(reservaId),
      to: emailDestino,
      messageId: info.messageId,
      payload
    };
  } catch (error) {
    console.error(`[boletoEmailService] Error enviando boleto ${reservaId} a ${emailDestino}:`, error);
    return {
      ok: false,
      reservaId: String(reservaId),
      to: emailDestino,
      error: error.message
    };
  }
};
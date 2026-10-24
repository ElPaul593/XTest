#!/usr/bin/env node
/**
 * Comprueba el envío de correo sin tocar la base de datos ni registrar usuarios.
 *
 *   node scripts/probar-correo.js tucorreo@gmail.com
 *
 * Dice qué transporte se usó. Si sale "archivo-local", el correo NO salió a
 * internet: faltan las credenciales SMTP en `.env`.
 *
 * Existe porque la única forma de probar el envío era registrar un usuario de
 * verdad, lo que ensucia la base con cuentas de prueba.
 */

require('dotenv').config();

const MailerService = require('../src/services/mailerService');

const destino = process.argv[2];

if (!destino) {
  console.error('\nUso: node scripts/probar-correo.js <correo-destino>\n');
  process.exit(1);
}

(async () => {
  console.log('\n── Diagnóstico de transportes ──────────────────────────────');
  const diag = await MailerService.diagnostico();

  console.log(`  API consumidora : ${diag.apiConsumidora.disponible ? 'disponible' : 'NO'}` +
    (diag.apiConsumidora.motivo ? `  (${diag.apiConsumidora.motivo})` : ''));
  console.log(`  SMTP            : ${diag.smtp.configurado ? `configurado (${diag.smtp.host})` : 'NO configurado'}`);
  console.log(`  Archivo local   : ${diag.archivoLocal.disponible ? diag.archivoLocal.carpeta : 'deshabilitado (producción)'}`);
  console.log(`  Entorno         : ${diag.entorno}`);

  console.log('\n── Enviando correo de prueba ───────────────────────────────');
  console.log(`  Destino: ${destino}`);

  const resultado = await MailerService.enviarCorreo({
    to: destino,
    subject: `${process.env.APP_NAME || 'CulturalTrip'} · Correo de prueba`,
    html: '<h2 style="color:#ffd700;background:#0a0a0a;padding:16px">Funciona</h2>' +
          '<p>Si lees esto en tu bandeja de entrada, el envío por SMTP está operativo.</p>',
    text: 'Funciona. Si lees esto en tu bandeja de entrada, el envío por SMTP está operativo.',
    meta: { tipo: 'prueba' }
  });

  console.log('');

  if (!resultado.ok) {
    console.error(`  ✖ No se pudo enviar: ${resultado.detalle || resultado.error}\n`);
    process.exit(1);
  }

  if (resultado.via === 'archivo-local') {
    console.warn('  ⚠ Entregado como ARCHIVO LOCAL: el correo NO salió a internet.');
    console.warn('    Rellena EMAIL_HOST, EMAIL_USER y EMAIL_PASS en backend/.env');
    console.warn('    para que llegue de verdad a una bandeja de entrada.\n');
    process.exit(0);
  }

  console.log(`  ✓ Enviado vía ${resultado.via}. Revisa la bandeja de ${destino}`);
  console.log('    (mira también la carpeta de spam la primera vez).\n');
})().catch((err) => {
  console.error('\n  ✖ Error inesperado:', err.message, '\n');
  process.exit(1);
});

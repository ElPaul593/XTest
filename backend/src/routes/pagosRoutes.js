const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken, requireAdminAccess } = require('../middleware/auth');
const PagoService = require('../services/pagoService');

const router = express.Router();

router.get('/configuracion', asyncHandler(async (req, res) => {
  res.json(await PagoService.configuracion());
}));

router.post('/crear-orden', authenticateToken, asyncHandler(async (req, res) => {
  const { holdIds } = req.body;
  if (!Array.isArray(holdIds) || holdIds.length === 0) {
    return res.status(400).json({ ok: false, error: 'Selecciona al menos un asiento' });
  }

  const orden = await PagoService.crearOrden({ user: req.user, holdIds, origin: req.headers.origin });
  return res.status(201).json(orden);
}));

router.post('/capturar-orden', authenticateToken, asyncHandler(async (req, res) => {
  res.json(await PagoService.capturarOrden({ user: req.user, orderId: req.body.orderId }));
}));

router.use('/admin', authenticateToken, requireAdminAccess);

router.get('/admin/resumen', asyncHandler(async (req, res) => {
  res.json(await PagoService.resumenFinanciero());
}));

router.get('/admin/pendientes', asyncHandler(async (req, res) => {
  res.json(await PagoService.listarPendientes());
}));

router.post('/admin/:orderId/aprobar', asyncHandler(async (req, res) => {
  res.json(await PagoService.aprobar(req.params.orderId));
}));

router.post('/admin/:orderId/rechazar', asyncHandler(async (req, res) => {
  res.json(await PagoService.rechazar(req.params.orderId, req.body.motivo || 'Rechazado por el administrador'));
}));

module.exports = router;

const express = require('express');
const router = express.Router();
const recomendacionController = require('../controllers/recomendacionController');
const { authenticateToken } = require('../middleware/auth');

// Endpoint principal: Ver Recomendados (personalizado por provincia)
router.get('/ver-recomendados', authenticateToken, recomendacionController.verRecomendados);

// Endpoint para obtener recomendaciones guardadas (del usuario, para una ruta)
router.get('/guardados', authenticateToken, recomendacionController.getRecomendadosGuardados);

/**
 * Caché agregada de recomendaciones por provincia de origen y ciudad de destino.
 * #12BUG CORREGIDO: la función del core existía y no tenía ruta que llegara a ella.
 */
router.get(
  '/guardados-por-provincia',
  authenticateToken,
  recomendacionController.getRecomendadosPorProvinciaYDestino
);

// Endpoint original (mantener compatibilidad)
router.get('/', recomendacionController.getRecomendados);

module.exports = router;


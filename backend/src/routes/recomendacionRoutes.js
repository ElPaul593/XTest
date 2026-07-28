const express = require('express');
const router = express.Router();
const recomendacionController = require('../controllers/recomendacionController');
const { authenticateToken } = require('../middleware/auth');

// Endpoint principal: Ver Recomendados (personalizado por provincia)
router.get('/ver-recomendados', authenticateToken, recomendacionController.verRecomendados);

// Endpoint para obtener recomendaciones guardadas
router.get('/guardados', authenticateToken, recomendacionController.getRecomendadosGuardados);

// Endpoint original (mantener compatibilidad)
router.get('/', recomendacionController.getRecomendados);

module.exports = router;


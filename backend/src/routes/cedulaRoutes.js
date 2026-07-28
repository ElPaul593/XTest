const express = require('express');
const router = express.Router();
const cedulaController = require('../controllers/cedulaController');

router.post('/validar', cedulaController.validar);

module.exports = router;


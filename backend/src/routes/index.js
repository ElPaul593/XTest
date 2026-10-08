const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const rutaRoutes = require('./rutaRoutes');
const lugarTuristicoRoutes = require('./lugarTuristicoRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/rutas', rutaRoutes);
router.use('/lugares-turisticos', lugarTuristicoRoutes);

module.exports = router;
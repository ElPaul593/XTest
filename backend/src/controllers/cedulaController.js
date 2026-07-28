const CedulaService = require('../services/cedulaService');

exports.validar = async (req, res) => {
  try {
    const { cedula } = req.body;

    if (!cedula) {
      return res.status(400).json({ 
        error: 'La cédula es requerida',
        cedula: null,
        valida: false
      });
    }

    const resultado = CedulaService.validar(cedula);
    
    if (resultado.valida) {
      return res.status(200).json(resultado);
    } else {
      return res.status(400).json(resultado);
    }
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al validar la cédula',
      mensaje: err.message 
    });
  }
};

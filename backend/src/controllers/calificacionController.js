const CalificacionService = require('../services/calificacionService');
const Calificacion = require('../models/calificacionModel');

/**
 * PATRÓN DE DISEÑO: Service Layer Pattern (Controlador)
 * Controlador que maneja requests HTTP para calificaciones.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: manejar HTTP requests/responses para calificaciones.
 * Incluye lógica de autorización (verificar propiedad o rol admin).
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de la abstracción CalificacionService.
 * 
 * NOTA: Este controlador tiene lógica de autorización que podría extraerse
 * a un middleware reutilizable siguiendo mejor el principio SRP.
 */

exports.getAll = async (req, res) => {
  try {
    const { tipo, referencia, usuario } = req.query;
    let calificaciones;
    
    if (tipo && referencia) {
      calificaciones = await CalificacionService.getByTipoYReferencia(tipo, referencia);
    } else if (usuario) {
      calificaciones = await CalificacionService.getByUsuario(usuario);
    } else {
      calificaciones = await CalificacionService.getAll();
    }
    
    res.json(calificaciones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const calificacion = await CalificacionService.getById(req.params.id);
    res.json(calificacion);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const data = { 
      ...req.body, 
      usuario: req.user.id 
    };

    const calificacion = await CalificacionService.create(data);
    res.status(201).json(calificacion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Método dedicado a actualizar calificaciones con validación de autorización.
 * Verifica que el usuario sea propietario o tenga rol admin.
 */
exports.update = async (req, res) => {
  try {
    const calificacion = await Calificacion.findById(req.params.id);

    if (!calificacion) {
      return res.status(404).json({ error: 'Calificación no encontrada' });
    }

    // Lógica de autorización: verificar propiedad o rol admin
    if (req.user.role !== "ADMIN" && calificacion.usuario.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'No puedes editar calificaciones de otros usuarios.' });
    }

    const updated = await Calificacion.findByIdAndUpdate(req.params.id, req.body, { new: true });

    res.json(updated);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Método dedicado a eliminar calificaciones con validación de autorización.
 * Verifica que el usuario sea propietario o tenga rol admin.
 */
exports.delete = async (req, res) => {
  try {
    const calificacion = await Calificacion.findById(req.params.id);

    if (!calificacion) {
      return res.status(404).json({ error: 'Calificación no encontrada' });
    }

    // Lógica de autorización: verificar propiedad o rol admin
    if (req.user.role !== "ADMIN" && calificacion.usuario.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'No puedes eliminar calificaciones de otros usuarios.' });
    }

    await Calificacion.findByIdAndDelete(req.params.id);

    res.json({ message: 'Calificación eliminada correctamente.' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

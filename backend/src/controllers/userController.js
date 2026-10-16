const UserService = require('../services/userService');

/**
 * PATRÓN DE DISEÑO: Service Layer Pattern (Controlador)
 * Maneja HTTP y delega la lógica a UserService.
 */

exports.getAll = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    // Retrocompatible: sin page/limit devuelve un array; con ellos, { data, pagination }.
    const result = await UserService.getAll({ page, limit, search });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const user = await UserService.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'La cédula o pasaporte ya está registrada' });
    }
    if (err.message?.toLowerCase().includes('cédula') || err.message?.toLowerCase().includes('cedula') ||
        err.message?.toLowerCase().includes('pasaporte') || err.message?.toLowerCase().includes('teléfono')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(400).json({ error: err.message || 'Error al crear el usuario' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const user = await UserService.getById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Actualización administrativa: permite cambiar el rol.
exports.update = async (req, res) => {
  try {
    const updated = await UserService.update(req.params.id, req.body, { allowRole: true });
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'Dato duplicado' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID inválido' });
    }
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
};

// Auto-edición de perfil (/me): NUNCA permite cambiar el rol.
exports.updateMe = async (req, res) => {
  try {
    const updated = await UserService.update(req.user.id.toString(), req.body, { allowRole: false });
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID inválido' });
    }
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
};

exports.remove = async (req, res) => {
  try {
    const result = await UserService.remove(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (result.blocked) {
      return res.json({
        message: 'La cuenta fue bloqueada porque tiene registros o historial asociado. Sus datos se conservaron.',
        blocked: true
      });
    }
    res.json({ message: 'Usuario eliminado exitosamente', deleted: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.restore = async (req, res) => {
  try {
    const result = await UserService.restore(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'La cuenta no existe o no está bloqueada' });
    }
    res.json({
      message: 'Cuenta restaurada exitosamente. Sus datos e historial fueron conservados.',
      restored: true,
      user: result.user
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'No se pudo restaurar la cuenta' });
  }
};

exports.removeMe = async (req, res) => {
  try {
    const result = await UserService.remove(req.user.id.toString());
    if (!result) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    if (result.blocked) {
      return res.json({
        message: 'La cuenta fue bloqueada porque tiene registros o historial asociado. Sus datos se conservaron.',
        blocked: true
      });
    }
    res.json({ message: 'Cuenta eliminada exitosamente', deleted: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

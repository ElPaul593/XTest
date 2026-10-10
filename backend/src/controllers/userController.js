const UserService = require('../services/userService');

/**
 * PATRÓN DE DISEÑO: Service Layer Pattern (Controlador)
 * Maneja HTTP y delega la lógica a UserService.
 */

exports.getAll = async (req, res) => {
  try {
    const { page, limit, search, estado } = req.query;
    // Retrocompatible: sin page/limit devuelve un array; con ellos, { data, pagination }.
    // `estado` es opcional: sin él se listan todas las cuentas (activas, bloqueadas y de baja).
    const result = await UserService.getAll({ page, limit, search, estado });
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

/**
 * DELETE /api/users/:id — baja de cuenta.
 *
 * Mantiene el verbo y la ruta DELETE (el frontend y Postman ya los usan), pero la
 * semántica es baja lógica: la cuenta pasa a estado ELIMINADO y el documento se
 * conserva para no romper el histórico de reservas y boletos.
 */
exports.remove = async (req, res) => {
  try {
    const result = await UserService.softDelete(req.params.id, {
      motivo: req.body?.motivo || null,
      actorId: req.user?._id || null
    });

    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Cuenta dada de baja correctamente',
      estado: result.estado,
      data: result
    });
  } catch (err) {
    const status = err.statusCode || 400;
    res.status(status).json({ error: err.message });
  }
};

/**
 * DELETE /api/users/me — el usuario da de baja su propia cuenta.
 *
 * #17BUG (documentado y corregido con esta ruta) — Antes el frontend
 * (`services/users.js` → `deleteCurrentUser`) resolvía la baja propia pidiendo
 * `/users/me` para sacar el `_id` y llamando después a `DELETE /api/users/:id`.
 * Pero esa ruta está protegida con `requireAdminAccess`, así que para un usuario
 * con rol USER devolvía siempre 403 "Acceso administrativo requerido": el botón
 * "Eliminar Cuenta" del perfil NUNCA funcionó para un usuario normal (solo un
 * administrador podía darse de baja a sí mismo). Además gastaba dos peticiones
 * para algo que el token ya identifica.
 */
exports.removeMe = async (req, res) => {
  try {
    const result = await UserService.softDelete(req.user._id.toString(), {
      motivo: 'Baja solicitada por el titular desde su perfil',
      actorId: req.user._id
    });

    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Tu cuenta ha sido dada de baja. Tu historial de reservas se conserva.',
      estado: result.estado
    });
  } catch (err) {
    const status = err.statusCode || 400;
    res.status(status).json({ error: err.message });
  }
};

/**
 * PATCH /api/users/:id/estado — bloquear, reactivar o dar de baja una cuenta (Admin).
 * Sustituye al borrado físico como herramienta de moderación.
 */
exports.cambiarEstado = async (req, res) => {
  try {
    const { estado, motivo } = req.body;

    const updated = await UserService.cambiarEstado(req.params.id, estado, {
      motivo: motivo || null,
      actorId: req.user?._id || null
    });

    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: `Cuenta actualizada a estado ${updated.estado}`,
      data: updated
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const status = err.statusCode || 400;
    res.status(status).json({ error: err.message });
  }
};

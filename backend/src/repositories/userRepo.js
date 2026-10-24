const User = require('../models/userModel');

/**
 * PATRÓN DE DISEÑO: Repository Pattern
 * Este repositorio encapsula toda la lógica de acceso a datos para usuarios.
 * Proporciona una interfaz abstracta para operaciones CRUD, separando la lógica
 * de persistencia de la lógica de negocio.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: acceso y manipulación de datos de usuarios en la base de datos.
 * No contiene lógica de negocio, solo operaciones de persistencia.
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de la abstracción del modelo User, no de implementaciones concretas.
 * Los servicios dependen de este repositorio (abstracción), no directamente del modelo.
 */
const selectNoPassword = '-password';


exports.findAll = async ({ page, limit, search, estado } = {}) => {
  const query = {};
  if (search) {
    const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(safe, 'i');
    query.$or = [{ nombre: rx }, { apellido: rx }, { cedula: rx }, { pasaporte: rx }];
  }

  // Filtro por estado de cuenta. 'ACTIVO' incluye los documentos sin el campo,
  // que son los usuarios registrados antes de existir la baja lógica.
  if (estado) {
    const estadoUpper = String(estado).toUpperCase();
    query.estado = estadoUpper === 'ACTIVO'
      ? { $in: ['ACTIVO', null] }
      : estadoUpper;
  }

  // Retrocompatibilidad: sin page/limit devuelve un array con todos los usuarios.
  if (!page && !limit) {
    return User.find(query).select(selectNoPassword).sort({ createdAt: -1 }).lean();
  }

  const p = Math.max(parseInt(page) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
  const skip = (p - 1) * l;

  const [data, total] = await Promise.all([
    User.find(query).select(selectNoPassword).sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
    User.countDocuments(query)
  ]);

  return {
    data,
    pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) }
  };
};


/*
 * #2BUG y #3BUG — CORREGIDOS: se eliminaron `create()` y `findByCedula()`.
 *
 * Ninguno de los dos se invocaba. `create()` además era peligroso: insertaba un
 * usuario sin validar la cédula ni hashear la contraseña, saltándose
 * `AuthService.createUserAccount`, que es la única puerta de creación de usuarios.
 * Las búsquedas por cédula viven en `AuthService` (login y alta).
 */

// PATRÓN REPOSITORY: Método findById - encapsula la búsqueda por ID
//Read by id
exports.findById = async (id) => {
  return User.findById(id).select(selectNoPassword).lean();
}

// PATRÓN REPOSITORY: Método updateById - encapsula la actualización de entidades
//Update
exports.updateById = async (id, data) => {
  return User.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true, select: '-password' }
  ).lean();
};




/**
 * Baja lógica: cambia el estado de la cuenta sin borrar el documento.
 *
 * #16BUG (documentado, ya corregido aquí) — Antes este repositorio exponía
 * `deleteById` con `User.findByIdAndDelete`, un borrado FÍSICO. Al desaparecer el
 * documento, las reservas, boletos y calificaciones que lo referencian quedaban
 * con un `user` apuntando a un ObjectId inexistente: los `populate('user')`
 * devolvían `null`, el panel de estadísticas contaba mal y se perdía para siempre
 * el histórico de quién viajó. Se sustituye por baja lógica (ver utils/estadoCuenta.js).
 *
 * @param {string} id
 * @param {object} cambio
 * @param {'ACTIVO'|'BLOQUEADO'|'ELIMINADO'} cambio.estado
 * @param {string|null} [cambio.motivo]
 * @param {string|null} [cambio.actorId] - Usuario que ejecuta el cambio (auditoría).
 */
exports.updateEstadoById = async (id, { estado, motivo = null, actorId = null }) => {
  return User.findByIdAndUpdate(
    id,
    {
      $set: {
        estado,
        estadoMotivo: motivo,
        estadoCambiadoEn: new Date(),
        estadoCambiadoPor: actorId || null
      }
    },
    { new: true, runValidators: true, select: '-password' }
  ).lean();
};

// Recuento de cuentas por estado, para el panel administrativo.
exports.countByEstado = async () => {
  const filas = await User.aggregate([
    { $group: { _id: { $ifNull: ['$estado', 'ACTIVO'] }, total: { $sum: 1 } } }
  ]);

  return filas.reduce((acc, fila) => {
    acc[fila._id] = fila.total;
    return acc;
  }, { ACTIVO: 0, BLOQUEADO: 0, ELIMINADO: 0 });
};

/*
 * Eliminados tras la fusión con la rama remota: `markAsDeleted` y `restore`
 * escribían `isDeleted`, un campo que ya no existe en el modelo, y nadie los
 * llamaba. La baja y la reactivación van por `updateEstadoById`.
 */

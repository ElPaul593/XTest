const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { buildEstadoError, getEstado } = require('../utils/estadoCuenta');

/**
 * PATRÓN DE DISEÑO: Middleware Pattern
 * Este módulo implementa el patrón de middleware para Express.
 * Los middlewares son funciones que se ejecutan en la cadena de request/response.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Cada middleware tiene una responsabilidad única:
 * - authenticateToken: autenticación de tokens y verificación del estado de la cuenta
 * - requireAdminAccess: verificación de rol admin
 * - authorizeRole: autorización genérica por rol
 * - authorizeOwnerOrAdmin: autorización por propiedad o rol
 */

/**
 * PATRÓN MIDDLEWARE: Autenticación de tokens JWT
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: verificar y validar tokens JWT en requests.
 */
exports.authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    if (user.isDeleted) {
      return res.status(403).json({ error: 'Esta cuenta está bloqueada' });
    }

    // El estado de la cuenta se revisa en CADA petición, no solo en el login: los
    // JWT viven 8 horas, así que si solo se comprobara al entrar, una cuenta
    // bloqueada seguiría operando durante el resto de la vida de su token.
    const estadoError = buildEstadoError(user);
    if (estadoError) {
      return res.status(estadoError.statusCode).json({
        error: estadoError.message,
        estado: getEstado(user)
      });
    }

    // Normalizar role a minúsculas para comparaciones consistentes
    if (user && user.role) user.role = String(user.role).toLowerCase();
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

/**
 * PATRÓN MIDDLEWARE: Verificación de acceso administrativo
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: verificar que el usuario tenga rol de administrador.
 */
exports.requireAdminAccess = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Usuario no autenticado' });
  const role = req.user.role ? String(req.user.role).toLowerCase() : '';
  if (role !== 'admin') return res.status(403).json({ error: 'Acceso administrativo requerido' });
  next();
};

/*
 * #10BUG — CORREGIDO: se eliminó `requireDashboardAccess`.
 *
 * Tenía dos problemas: no estaba montado en ninguna ruta, y su nombre mentía.
 * Decía "verificar acceso al dashboard por cédula/pasaporte o rol admin", pero su
 * cuerpo era idéntico a `requireAdminAccess` (exigía rol admin y nada más). Si
 * alguien lo hubiera montado confiando en el nombre, habría dejado el dashboard de
 * usuario accesible solo a administradores.
 *
 * El acceso al dashboard de usuario se controla en el frontend
 * (`components/RouteGuards.jsx` → `ProtectedRoute`). Para exigir rol admin en el
 * backend se usa `requireAdminAccess`; para otros roles, `authorizeRole`.
 */

/**
 * PATRÓN DE DISEÑO: Factory Pattern
 * Esta función es una factory que retorna un middleware configurado.
 * Permite crear middlewares de autorización reutilizables con diferentes roles.
 * 
 * PRINCIPIO SOLID: Open/Closed Principle (OCP)
 * Extensible sin modificación: se puede crear nuevos middlewares con diferentes
 * roles sin modificar esta función.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: crear middlewares de autorización por rol.
 */
exports.authorizeRole = (requiredRole) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Usuario no autenticado' });
  const role = req.user.role ? String(req.user.role).toLowerCase() : '';
  if (Array.isArray(requiredRole)) {
    const allowed = requiredRole.map(r => String(r).toLowerCase());
    if (!allowed.includes(role)) return res.status(403).json({ error: 'Permisos insuficientes' });
    return next();
  }
  if (role !== String(requiredRole).toLowerCase()) return res.status(403).json({ error: 'Permisos insuficientes' });
  next();
};

/**
 * PATRÓN DE DISEÑO: Factory Pattern
 * Factory function que retorna un middleware de autorización configurable.
 * Verifica si el usuario es propietario del recurso o tiene rol admin.
 * 
 * PRINCIPIO SOLID: Open/Closed Principle (OCP)
 * Extensible sin modificación: permite crear middlewares para diferentes modelos
 * y campos de propietario sin modificar esta función.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: crear middlewares de autorización por propiedad o rol.
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Recibe el modelo como parámetro (abstracción), no depende de implementaciones concretas.
 */
exports.authorizeOwnerOrAdmin = (Model, ownerField = 'user') => {
  return async (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Usuario no autenticado' });
      const role = req.user.role ? String(req.user.role).toLowerCase() : '';
      if (role === 'admin') return next();
      const id = req.params.id;
      const resource = await Model.findById(id).lean();
      if (!resource) return res.status(404).json({ error: 'Recurso no encontrado' });
      const ownerId = resource[ownerField] ? String(resource[ownerField]) : null;
      if (!ownerId) return res.status(403).json({ error: 'No es posible verificar propietario' });
      if (ownerId !== String(req.user._id)) return res.status(403).json({ error: 'Permisos insuficientes' });
      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};

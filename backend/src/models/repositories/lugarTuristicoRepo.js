/**
 * ============================================================================
 * #1BUG — CARPETA DUPLICADA Y MUERTA: nada de este archivo se ejecuta.
 * ============================================================================
 *
 * Toda la carpeta `src/models/repositories/` es una copia obsoleta de
 * `src/repositories/`. Los 7 archivos que contiene (boletoRepo, calificacionRepo,
 * hotelRepo, lugarTuristicoRepo, reservaRepo, rutaRepo, userRepo) tienen CERO
 * importaciones en todo el proyecto: ningún servicio, controlador, script ni test
 * hace `require('../models/repositories/...')`. Los servicios importan siempre
 * desde `src/repositories/`.
 *
 * Verificado: `grep -rn "models/repositories" src scripts` no devuelve ninguna
 * sentencia `require`.
 *
 * Por qué importa (no es solo ruido):
 *  - Son ~660 líneas que aparentan ser la capa de persistencia real. Al abrir el
 *    proyecto no hay forma de saber cuál de las dos carpetas está viva, y
 *    `ARCHITECTURE.md` solo menciona `src/repositories/`.
 *  - La copia está DESFASADA respecto a la viva, así que editar aquí por error no
 *    produce ningún efecto y la corrección se pierde. Diferencias detectadas:
 *      · todas las rutas de `require` son distintas (`../userModel` en vez de
 *        `../models/userModel`), que es lo único que hace que esta copia siquiera
 *        se resuelva si alguien la importara;
 *      · `userRepo` de aquí no tiene la paginación ni el filtro por estado de
 *        cuenta que sí tiene el vivo;
 *      · `calificacionRepo` de aquí no tiene `findByTipoYReferenciaIn`, el método
 *        que usa el motor de recomendaciones para evitar el problema N+1.
 *  - Duplica la definición de los repositorios, de modo que cualquier búsqueda por
 *    nombre de método devuelve dos resultados y obliga a desambiguar a mano.
 *
 * NO se corrige aquí por indicación expresa: solo se documenta.
 * La carpeta viva y mantenida es `backend/src/repositories/`.
 * ============================================================================
 */

const LugarTuristico = require('../lugarTuristicoModel');

/**
 * PATRÓN DE DISEÑO: Repository Pattern
 * Repositorio que encapsula el acceso a datos de lugares turísticos.
 * Proporciona búsquedas especializadas con normalización y regex.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: acceso a datos de lugares turísticos.
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de la abstracción del modelo LugarTuristico.
 */

exports.findAll = async (filters = {}) => {
  return LugarTuristico.find(filters).sort({ createdAt: -1 }).lean();
};

/**
 * PATRÓN REPOSITORY: Método especializado de búsqueda
 * Encapsula la lógica compleja de búsqueda por ciudad con normalización,
 * escape de caracteres especiales y búsqueda case-insensitive.
 */
exports.findByCiudad = async (ciudad) => {
  // Búsqueda case-insensitive y que ignore espacios al inicio/final
  const ciudadNormalizada = ciudad ? ciudad.trim() : '';
  if (!ciudadNormalizada) {
    return [];
  }
  
  // Escapar caracteres especiales para regex
  const ciudadEscapada = ciudadNormalizada.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Usar expresión regular para búsqueda case-insensitive
  const lugares = await LugarTuristico.find({ 
    ciudad: { $regex: new RegExp(`^${ciudadEscapada}$`, 'i') }
  }).sort({ createdAt: -1 }).lean();
  
  console.log(`Buscando lugares para ciudad: "${ciudadNormalizada}", encontrados: ${lugares.length}`);
  
  return lugares;
};

exports.findById = async (id) => {
  return LugarTuristico.findById(id).lean();
};

exports.create = async (data) => {
  const lugar = new LugarTuristico(data);
  return lugar.save();
};

exports.updateById = async (id, data) => {
  return LugarTuristico.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).lean();
};

exports.deleteById = async (id) => {
  return LugarTuristico.findByIdAndDelete(id).lean();
};


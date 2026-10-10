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

const Ruta = require('../rutaModel');

/**
 * PATRÓN DE DISEÑO: Repository Pattern
 * Repositorio que encapsula el acceso a datos de rutas.
 * Proporciona métodos específicos de búsqueda (por origen, destino).
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: acceso a datos de rutas con búsquedas especializadas.
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de la abstracción del modelo Ruta.
 */

exports.findAll = async () => Ruta.find().lean();

/**
 * PATRÓN REPOSITORY: Método especializado de búsqueda
 * Encapsula la lógica de búsqueda por destino con normalización y regex.
 */
exports.findByDestino = async (ciudadDestino) => {
  const ciudadNormalizada = ciudadDestino ? ciudadDestino.trim() : '';
  if (!ciudadNormalizada) {
    return [];
  }
  
  // Búsqueda case-insensitive
  const ciudadEscapada = ciudadNormalizada.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Ruta.find({ 
    to: { $regex: new RegExp(`^${ciudadEscapada}$`, 'i') }
  }).lean();
};

/**
 * PATRÓN REPOSITORY: Método especializado de búsqueda
 * Encapsula la lógica de búsqueda por origen con normalización y regex.
 */
exports.findByOrigen = async (ciudadOrigen) => {
  const ciudadNormalizada = ciudadOrigen ? ciudadOrigen.trim() : '';
  if (!ciudadNormalizada) {
    return [];
  }
  
  // Búsqueda case-insensitive
  const ciudadEscapada = ciudadNormalizada.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Ruta.find({ 
    from: { $regex: new RegExp(`^${ciudadEscapada}$`, 'i') }
  }).lean();
};

exports.findById = async (id) => Ruta.findById(id).lean();

exports.create = async (data) => {
  const r = new Ruta(data);
  return r.save();
};

exports.deleteById = async (id) => Ruta.findByIdAndDelete(id).lean();

# Fusión de `main_paul` local con `origin/main_paul`

Documento de la reconciliación entre las dos ramas. Resume qué decisión se tomó,
por qué, y qué tiene que revisar el otro desarrollador antes de seguir trabajando.

- **Commit de fusión:** `17ee106`
- **Base común:** `85cda92`
- **Estado:** hecho en local. **No se ha subido nada**: el `push` lo haces tú.
- **Verificación:** 64/64 tests (9 suites), lint limpio, frontend compila.

---

## 1. El problema

Las dos ramas implementaron **el mismo requisito de forma incompatible**: dar de
baja una cuenta sin perder sus datos.

| | Rama local | Rama remota (`origin/main_paul`) |
|---|---|---|
| Campo | `estado`: `ACTIVO` / `BLOQUEADO` / `ELIMINADO` | `isDeleted` (booleano) + `deletedAt` + `deletionReason` |
| Borrado físico | Nunca | Sí, para cuentas **sin** historial |
| Bloqueo temporal | Sí, distinto de la baja | No se puede expresar |
| Motivo visible al usuario | `estadoMotivo` | `deletionReason` |
| Auditoría | `estadoCambiadoEn`, `estadoCambiadoPor` | `deletedAt` |

Divergencia: 2 commits a cada lado, **16 archivos tocados por ambos**, de los
cuales **9 con conflicto real**.

Fusionar sin decidir habría dejado el modelo con `estado` **y** `isDeleted` a la
vez: dos fuentes de verdad para lo mismo, que es la receta para que una cuenta
aparezca activa en una pantalla y dada de baja en otra.

---

## 2. La decisión y por qué

**Gana `estado`.** Dos razones concretas:

1. **El borrado físico incumple el requisito del proyecto.** La baja tiene que ser
   retrospectiva. Borrar las cuentas «sin historial» parece inofensivo, pero deja
   de serlo en cuanto esa cuenta aparece en un informe, una auditoría o una
   referencia creada más tarde. Con `estado` el documento no se borra nunca.

2. **`isDeleted` no distingue bloquear de dar de baja.** Son situaciones distintas
   para el usuario: una la resuelve el administrador, la otra la provocó él mismo.
   Un booleano no puede expresar esa diferencia, y el requisito la pedía
   explícitamente.

**No se descartó nada del trabajo remoto.** Todo lo aportado por la otra rama se
conservó, adaptado donde hacía falta.

---

## 3. Qué se conservó de la rama remota

| Aporte | Qué se hizo |
|---|---|
| Flujo de recuperación por código de 6 dígitos (`accountRecoveryModel.js`, `accountRecoveryEmailService.js`, `AccountRecovery.jsx`, rutas `/api/auth/recovery/*`) | **Conservado entero.** Solo se cambiaron las dos consultas que filtraban por `isDeleted` para que usen `estado`. |
| `userController.restore` + ruta `POST /api/users/:id/restore` | **Conservados**, con la misma ruta y la misma forma de respuesta. Por dentro ahora es un alias de `cambiarEstado(id, 'ACTIVO')`, para no tener dos maneras de hacer lo mismo. |
| `restoreUser()` en `frontend/src/services/users.js` | Conservado. |
| Esquemas `recoveryRequest` y `recoveryConfirm` | Conservados tal cual. |
| Tests `rutaService`, `cedulaValidator`, `rutaSchemas` | Conservados sin tocar. No se solapaban con nada. |
| Tests `userDeletion`, `accountRecovery` | **Adaptados** (ver punto 5). |
| Pantalla de recuperación | Se le añadió un enlace **«Recuperar mi cuenta»** en el login: sin él la página existía pero no se podía llegar a ella desde ninguna parte. |

---

## 4. Traducción entre los dos modelos

Si vuelves a ver código que usa el modelo antiguo, esta es la equivalencia:

| Antes (`isDeleted`) | Ahora (`estado`) |
|---|---|
| `isDeleted: false` | `estado: 'ACTIVO'` |
| `isDeleted: true` | `estado: 'ELIMINADO'` (baja) o `'BLOQUEADO'` (bloqueo administrativo) |
| `deletionReason` | `estadoMotivo` |
| `deletedAt` | `estadoCambiadoEn` (+ `estadoCambiadoPor`, que antes no existía) |
| `UserService.remove(id)` | `UserService.softDelete(id, { motivo, actorId })` |
| `UserService.restore(id)` | `UserService.cambiarEstado(id, 'ACTIVO')` |

La fuente única de verdad es **`backend/src/utils/estadoCuenta.js`**. Si necesitas
preguntar por el estado de una cuenta, usa `getEstado(user)` y no leas
`user.estado` directamente: los usuarios creados antes de la migración no tienen
el campo y hay que tratarlos como activos.

---

## 5. Tests adaptados

### `userDeletion.test.js` — reescrito

Probaba el diseño contrario, así que no podía quedarse como estaba. Se conservó
la **intención** de cada prueba y se añadió una cuarta:

| Prueba original | Equivalente ahora |
|---|---|
| «elimina físicamente una cuenta sin historial» | «la marca `ELIMINADO` y **no** borra el documento» |
| «bloquea y conserva una cuenta con reservas» | igual, comprobando además que `populate('user')` sigue resolviendo |
| «restaura una cuenta bloqueada» | igual, con `cambiarEstado(..., 'ACTIVO')` |
| — | **nueva:** «bloquear es distinto de dar de baja» |

La comprobación del `populate` es deliberada: es exactamente lo que rompía el
borrado físico y lo que ninguna prueba cubría antes.

### `accountRecovery.test.js` — adaptado

Dos cambios mínimos: el usuario de prueba se bloquea con
`{ estado: 'BLOQUEADO' }` en vez de `{ isDeleted: true }`, y la aserción final
comprueba `estado === 'ACTIVO'`.

---

## 6. Archivos en conflicto y cómo se resolvió cada uno

| Archivo | Resolución |
|---|---|
| `backend/src/models/userModel.js` | Local. Se descartan `isDeleted`/`deletedAt`/`deletionReason`. |
| `backend/src/controllers/authController.js` | **Ambos.** Se mantienen los handlers de recuperación remotos junto al resto. |
| `backend/src/controllers/userController.js` | Local + se reescribe `restore` como alias de `cambiarEstado`. |
| `backend/src/services/userService.js` | Local. |
| `backend/src/validations/schemas.js` | **Ambos.** Los esquemas de recuperación son puramente aditivos. |
| `frontend/src/components/LoginForm.jsx` | Local + enlace «Recuperar mi cuenta». |
| `frontend/src/pages/Profile.jsx` | Local (usa ventanas emergentes en vez de `alert`). |
| `frontend/src/pages/admin/AdminUsers.jsx` | Local (botones de bloquear/reactivar con motivo). |
| `frontend/src/services/users.js` | Local. |

Además se eliminó un `require('crypto')` **duplicado** en `authService.js`: ambas
ramas lo añadieron por su cuenta y el merge dejó las dos líneas, lo que rompía el
arranque con `Identifier 'crypto' has already been declared`.

---

## 7. Qué revisar antes de seguir

1. **Habladlo con quien hizo la rama remota.** Su diseño no se descartó por ser
   peor en general, sino porque el borrado físico choca con un requisito explícito
   del proyecto. Conviene que lo sepa antes de que vuelva a tocar esos archivos.
2. **El `hasHistory` que escribió no se portó.** Comprobaba si el usuario tenía
   reservas, calificaciones, recomendaciones o holds para decidir entre borrar y
   bloquear. Con `estado` esa decisión ya no existe, pero la consulta es útil si
   algún día queréis mostrar en el panel «esta cuenta tiene N registros
   asociados». Está en el historial, en `5a615e9`.
3. **Hay dos caminos de recuperación conviviendo**, y es intencionado:
   - «¿Olvidaste tu contraseña?» → envía un **enlace** por correo. Para cuentas
     activas.
   - «Recuperar mi cuenta» → envía un **código de 6 dígitos**. Para cuentas
     bloqueadas o dadas de baja.

   Si os parece redundante, el momento de unificarlos es ahora, antes de que haya
   usuarios reales usando ambos.
4. **`accountRecoveryEmailService.js` usa `nodemailer` directamente**, mientras que
   el resto del correo pasa por `mailerService.js`, que tiene cadena de
   transportes y funciona sin SMTP en desarrollo. Conviene migrarlo para que el
   correo de recuperación también salga por el mismo sitio.

---

## 8. Cómo subirlo

La fusión está hecha y commiteada en local. Para publicarla:

```bash
cd XTest
git log --oneline -3        # comprueba que 17ee106 es el commit de fusión
npm test --prefix backend   # 64/64
git push origin main_paul
```

Si prefieres revisar antes el resultado de la fusión:

```bash
git show 17ee106 --stat
git diff origin/main_paul HEAD -- backend/src/models/userModel.js
```

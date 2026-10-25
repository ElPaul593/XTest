# Catálogo de fallas documentadas (`#NBUG`)

> **Estado actualizado.** Este catálogo se escribió cuando las fallas solo se
> documentaban. Después se corrigieron muchas; el comentario de cada una en el código
> dice «CORREGIDO» cuando aplica.
>
> | Estado | Marcas |
> |---|---|
> | Corregidas | `#2`–`#17`, `#35` |
> | Corregidas en el rediseño | `#32` (diálogos por debajo de la barra) en «Mis reservas» |
> | Diagnóstico corregido | `#27`: el archivo **no** estaba muerto |
> | Pendientes de borrado (bloqueado por permisos) | `#1`, `#18`–`#20`, `#26`, `#30`, `#31` |
> | Pendientes | `#21`–`#25`, `#28`, `#29`, `#33`, `#34` |
>
> El registro completo de cambios está en [[CAMBIOS|CAMBIOS.md]].

Índice de las fallas detectadas en el proyecto. Cada entrada está marcada **en el
código** con un comentario `#NBUG` que explica el problema, su consecuencia real y
cómo se verificó.

**Las fallas están documentadas, no corregidas.** Las dos únicas excepciones
(`#16BUG` y `#17BUG`) se corrigieron porque formaban parte del cambio solicitado
en el manejo de cuentas; sus comentarios lo indican explícitamente.

Para localizar una marca:

```bash
# Todas las marcas con su ubicación
grep -rn "#[0-9]\+BUG" backend/src frontend/src frontend/out.js

# Una en concreto
grep -rn "#11BUG" backend/src
```

---

## Resumen

| Tipo | Nº | Marcas |
|------|----|--------|
| Código muerto (métodos, funciones y constantes sin uso) | 16 | `#2`–`#10`, `#21`–`#25`, `#28`, `#29` |
| Archivos y carpetas huérfanos | 8 | `#1`, `#18`–`#20`, `#26`, `#27`, `#30`, `#31` |
| Tablas y datos que no cumplen función | 2 | `#11`, `#12` |
| Funcionalidad rota o inoperativa | 4 | `#13`, `#14`, `#16`, `#17` |
| Problemas de interfaz (ventanas emergentes, estilos) | 3 | `#32`–`#34` |
| Configuración y seguridad | 2 | `#15`, `#35` |
| **Total** | **35** | |

---

## Backend

### Código muerto

| Nº | Ubicación | Falla |
|----|-----------|-------|
| `#1BUG` | `backend/src/models/repositories/` (7 archivos) | Carpeta duplicada completa. Copia obsoleta de `src/repositories/` con **cero** importaciones en todo el proyecto. ~660 líneas que aparentan ser la capa de persistencia real. La copia está desfasada: a su `userRepo` le falta la paginación y a su `calificacionRepo` el método `findByTipoYReferenciaIn` que evita el problema N+1. |
| `#2BUG` | `repositories/userRepo.js` | `create()` nunca se invoca. Toda la creación de usuarios pasa por `AuthService.createUserAccount`. Además crearía usuarios **sin** validar cédula ni hashear la contraseña. |
| `#3BUG` | `repositories/userRepo.js` | `findByCedula()` nunca se invoca. `AuthService` consulta el modelo directamente, saltándose el repositorio y contradiciendo la regla de arquitectura documentada. |
| `#4BUG` | `repositories/calificacionRepo.js` | `findByTipoYReferenciaConNacionalidad()` muerto. Resto de una versión anterior que ponderaba por nacionalidad; el algoritmo actual agrupa por provincia. |
| `#5BUG` | `repositories/calificacionRepo.js` | `findCalificacionesMesActual()` muerto. **Con consecuencia visible:** el frontend espera el campo `calificacionesMesActual` y `recommendationCore` lo devuelve siempre como literal `0`. La consulta que daría el dato real existe y nadie la conecta. |
| `#6BUG` | `repositories/calificacionRepo.js` | `findByTipoYReferenciaYProvincia()` muerto. `recommendationCore` reimplementa ese filtrado en memoria, trayendo de MongoDB calificaciones que luego descarta. |
| `#7BUG` | `repositories/hotelRepo.js` | `findByGooglePlaceId()` muerto; `bulkUpsertGoogleHotels` resuelve la deduplicación por su cuenta. |
| `#8BUG` | `repositories/hotelRepo.js` | `upsertByGooglePlaceId()` muerto; sustituido por la versión en lote. |
| `#9BUG` | `repositories/rutaRepo.js` | `findByOrigen()` muerto. Su pareja `findByDestino` sí se usa; la búsqueda por origen se resolvió comparando en memoria. |
| `#10BUG` | `middleware/auth.js` | `requireDashboardAccess` no está montado en ninguna ruta **y su nombre miente**: documenta "acceso por cédula/pasaporte o rol admin" pero el cuerpo es idéntico a `requireAdminAccess`. Montarlo confiando en el nombre dejaría el dashboard de usuario accesible solo a administradores. |

### Tablas que no cumplen función

| Nº | Ubicación | Falla |
|----|-----------|-------|
| `#11BUG` | `models/lugaresRecomendadosModel.js` | **Colección de solo escritura.** `recommendationCore` escribe en ella en cada petición de recomendaciones (un `findOne` + un `create`/`update` por lugar), pero la respuesta se recalcula desde cero y **nunca lee lo persistido**. Coste: `2·N` consultas extra por petición, crecimiento indefinido de la colección y 5 índices mantenidos para datos que nadie consulta. |
| `#12BUG` | `core/recommendationCore.js` | `getRecomendadosPorProvinciaYDestino()` es inalcanzable: el servicio la reexporta, pero ningún controlador la llama y ninguna ruta la expone. Dos capas de envoltorio para una función sin entrada por HTTP. |

### Funcionalidad rota

| Nº | Ubicación | Falla |
|----|-----------|-------|
| `#13BUG` | `validations/schemas.js` | El esquema del registro **público** acepta `role: ADMIN`, pero `AuthService.register` lo sobrescribe siempre con `USER`. No es una vulnerabilidad, pero el Swagger de la ruta documenta un campo que no hace nada. |
| `#14BUG` | `services/boletoEmailService.js` | **El envío de boletos por correo nunca funciona.** Exige `EMAIL_HOST`, `EMAIL_USER` y `EMAIL_PASS`, que no existen en `.env` ni en `.env.example`. El fallo es silencioso: la reserva se confirma, el PDF y el QR se generan (gastando CPU) y nadie recibe nada; el error solo queda en `console.error`. |
| `#16BUG` | `repositories/userRepo.js` | *(Corregido)* El borrado de usuarios era **físico** (`findByIdAndDelete`). Al desaparecer el documento, las reservas, boletos y calificaciones quedaban apuntando a un `ObjectId` inexistente: los `populate('user')` devolvían `null`, las estadísticas contaban mal y se perdía el histórico de quién viajó. |
| `#17BUG` | `controllers/userController.js` | *(Corregido)* El botón "Eliminar Cuenta" del perfil **nunca funcionó para un usuario normal**. El frontend llamaba a `DELETE /api/users/:id`, protegida con `requireAdminAccess`, así que devolvía 403 a todo rol `USER`. Solo un administrador podía darse de baja a sí mismo. |

### Configuración y seguridad

| Nº | Ubicación | Falla |
|----|-----------|-------|
| `#15BUG` | `app.js` | Las dos defensas de la sección están anuladas: `contentSecurityPolicy: false` desactiva la CSP en todo el servicio, y `origin: true` junto a `credentials: true` refleja como permitido cualquier origen. El impacto hoy es limitado porque el token viaja en la cabecera `Authorization` y no en cookies, pero con una cookie de sesión se convertiría en un CSRF directo. |
| `#35BUG` | `models/userModel.js` | `cedula`, `pasaporte` y `email` declaran su índice **dos veces** (`unique: true` en el campo y de nuevo con `schema.index()`). Mongoose lo avisa en cada arranque y en cada ejecución de los tests, tapando mensajes útiles, y deja la definición de los índices en dos sitios. |

---

## Frontend

### Archivos huérfanos

| Nº | Ubicación | Falla |
|----|-----------|-------|
| `#18BUG` | `services/seats.js` | Ninguna pantalla lo importa. Además usa un prefijo (`/seat/...`) distinto del resto de la aplicación: es una tercera forma de hablar con la misma API externa. |
| `#19BUG` | `services/asientosService.js` | 245 líneas que nunca se ejecutan. Crea su **propia** instancia de axios, por lo que queda fuera de los interceptores: no añadiría el token ni cerraría sesión ante un 401. Depende de `VITE_SEAT_API_URL`, variable no declarada en ningún `.env`. |
| `#20BUG` | `services/lugaresTuristicosAdmin.js` | Huérfano. La vista que debería consumirlo (`admin/AdminLugares.jsx`) importa de `services/lugaresTuristicos.js`. Dos servicios atacan los mismos endpoints con distinto manejo de errores. |
| `#26BUG` | `constants/provincias.js` | Archivo entero sin uso. La tabla de las 24 provincias está duplicada aquí y en `backend/src/utils/provinciaUtils.js`, que es la que sí se ejecuta. |
| `#27BUG` | `constants/codigosTelefonicos.js` | ⚠️ **Diagnóstico corregido: el archivo NO está muerto.** `RegisterForm.jsx` usa `getCodigoTelefonico()`. La afirmación original ("nada de aquí se importa") era falsa: salió de un barrido símbolo a símbolo del que se extrajo una conclusión sobre el archivo completo sin comprobar el tercer export. Sin uso real solo está `getPaisFromCodigo`; `CODIGOS_TELEFONICOS` lo consumen las funciones del propio archivo. |
| `#30BUG` | `frontend/out.js` | Artefacto de compilación de 1,2 MB (27 970 líneas de bundle minificado) **versionado**: `.gitignore` solo excluye `dist/`. Viaja en cada clon, ensucia los diffs y contiene una copia congelada del código antiguo que contamina las búsquedas por nombre de función. |
| `#31BUG` | `frontend/public/` y `frontend/src/assets/` | El mismo GeoJSON de provincias (655 KB) existe dos veces, idéntico byte a byte. Solo se usa el de `public/`. Riesgo: corregir la geometría en la copia equivocada no cambia nada y es difícil de diagnosticar porque ambos archivos se llaman igual. *(La anotación está en `components/EcuadorMapSelector.jsx` porque JSON no admite comentarios.)* |

### Código muerto

| Nº | Ubicación | Falla |
|----|-----------|-------|
| `#21BUG` | `services/session.js` | Módulo pensado como "manejo centralizado de la sesión" que nadie usa como tal: `getToken`, `getRole`, `getUserId` y `clearSession` no se importan desde fuera. `clearSession` **duplica** a `logout()` de `services/auth.js`, que es la que sí se llama. La clave `'token'` acaba escrita literalmente en media docena de archivos, justo lo que este módulo existía para evitar. |
| `#22BUG` | `services/users.js` | `getAuthToken`/`getAuthHeaders` son redundantes: el interceptor de `api.js` ya añade `Authorization` a todas las peticiones. Nueve llamadas pasan un objeto de cabeceras cuyo efecto neto es nulo, y hacen creer que las demás funciones van sin token. |
| `#23BUG` | `services/users.js` | `getUserById()` sin uso: el panel admin edita en la propia fila de la tabla. |
| `#24BUG` | `services/calificaciones.js` | `updateCalificacion` y `deleteCalificacion` sin uso: **el usuario puede crear una calificación pero no editarla ni borrarla**, porque ninguna vista ofrece el botón. El backend sí tiene el soporte completo y protegido con `authorizeOwnerOrAdmin`. |
| `#25BUG` | `services/hoteles.js` | `getHotelById()` sin uso: no existe vista de detalle de hotel. |
| `#28BUG` | `constants/boletos.js` | `BOLETOS_SAMPLE` sin uso. Datos de maqueta previos al backend, con fechas ya pasadas que pueden confundirse con datos reales. |
| `#29BUG` | `constants/calificaciones.js` | `CALIFICACION_MINIMA` y `CALIFICACION_MAXIMA` sin uso. El rango 1–5 acaba repetido en tres sitios que deberían leerlo de aquí. |

### Interfaz

| Nº | Ubicación | Falla |
|----|-----------|-------|
| `#32BUG` | `styles/pages/destino.css` | **Las ventanas emergentes quedan por debajo del header.** `.modal-overlay` declara `z-index: 1000`, el mismo valor que `.navbar` (que es `position: fixed`). Al empatar, gana el orden del documento: la barra atraviesa el diálogo y sigue siendo pulsable con el modal abierto, de modo que el usuario puede navegar fuera y dejarlo huérfano. |
| `#34BUG` | `styles/pages/destino.css` | Un archivo de estilos **de una pantalla** define selectores genéricos (`.modal-overlay`, `.modal-content`, `.modal-actions`, `.form-group`) que se aplican a todo el proyecto. `Dashboard`, `SeatBooking` y `admin/AdminLugares` dependen sin saberlo del CSS de la página de destinos: si se eliminara, tres pantallas ajenas perderían su maquetación. |
| `#33BUG` | 9 archivos (ver abajo) | Avisos con `alert()` y `window.confirm()` nativos. Tres problemas: bloquean el hilo principal (en las pantallas de asientos eso **congela el contador del hold**), el navegador los pinta con su propio estilo y antepone el dominio, y no admiten formato, así que los `\n` se ven distinto en cada navegador. |

Archivos con `#33BUG`: `components/BusSeatSelector.jsx`, `pages/Boletos.jsx`,
`pages/Destino.jsx`, `pages/Recomendados.jsx`, `pages/SeatBooking.jsx`,
`pages/Agente.jsx`, `pages/admin/AdminBoletos.jsx`, `pages/admin/AdminRutas.jsx`,
`pages/admin/AdminLugares.jsx`.

Sustitución ya disponible y aplicada en `LoginForm`, `Profile`, `Dashboard` y
`admin/AdminUsers`: `components/Popup.jsx` (`AlertPopup`, `ConfirmPopup`) con el
hook `hooks/useFeedback.js`.

---

## Cómo se verificó cada falla

Las marcas de código muerto se comprobaron buscando referencias al identificador
en todo el proyecto y descartando su propia definición:

```bash
# Backend: exports sin ninguna referencia externa
cd backend/src
for f in $(find repositories services utils core -name "*.js"); do
  grep -oP '^exports\.\K\w+' "$f" | while read fn; do
    n=$(grep -rn "\.$fn\b" --include="*.js" . | grep -v "^./$f" | wc -l)
    [ "$n" -eq 0 ] && echo "SIN USO: $f -> $fn"
  done
done

# Frontend: exports sin ninguna importación
cd frontend/src
for f in $(find services constants -name "*.js"); do
  grep -oP '^export (async )?function \K\w+|^export const \K\w+' "$f" | while read fn; do
    n=$(grep -rn "\b$fn\b" --include="*.js" --include="*.jsx" . | grep -v "^./$f:" | wc -l)
    [ "$n" -eq 0 ] && echo "SIN USO: $f -> $fn"
  done
done
```

La duplicación de `#1BUG` y `#31BUG` se confirmó con `diff --strip-trailing-cr` y
`cmp` respectivamente. El aviso de `#35BUG` lo emite Mongoose en la salida de
`npm test`.

---
*Copia de `XTest/BUGS.md`. El original es la versión que manda: si cambia, vuelve a generar el vault.*

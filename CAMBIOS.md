# Registro de cambios — rama `Criollo`

Cambios realizados sobre el proyecto CulturalTrip (backend Express + frontend React).
El documento va de lo más reciente a lo más antiguo. Cada apartado dice **qué** se
cambió, **por qué** y **cómo se comprobó**.

**Estado al cerrar este registro**

| Comprobación | Resultado |
|---|---|
| Tests del backend | 69 / 69 (9 suites) |
| Lint del backend | limpio |
| Build del frontend | correcto |
| Errores de JavaScript en navegador | ninguno (8 pantallas recorridas con sesión de usuario y de admin) |

Los cambios de este bloque **no están commiteados**: quedan en el árbol de trabajo para
que los revises antes del `git add`.

---

## 1. Rediseño completo del frontend

### Qué se hizo

Nueva identidad visual: glassmorphism sobre negro, acento amarillo, bordes muy
redondeados y tipografía **Plus Jakarta Sans**. Se conservan las clases de botón de
Bootstrap (`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`) y se añaden
`.btn-sm`, `.btn-lg` y `.btn-full`.

| Archivo | Cambio |
|---|---|
| `src/styles/theme/app.css` | **Nuevo.** Capa de tema completa (≈ 1 000 líneas). Se importa la última y restiliza todas las pantallas reutilizando las clases que ya usaban. |
| `src/components/Navbar.jsx` | Reescrito: barra flotante de cristal, enlaces en «píldora», menú móvil desplegable, se opaca al hacer scroll. |
| `src/pages/Demo.jsx` | Portada reescrita: hero, ventajas, rutas reales, cómo funciona y llamada final. |
| `src/App.jsx` | Contenedor de la app, rutas solo para visitantes y ruta comodín. |
| `index.html` | Idioma, título, `theme-color`, descripción y carga de la fuente. |
| `src/pages/Dashboard.jsx` | Banner y ventana de «Reserva rápida» pasados al sistema de diseño. |
| `src/pages/AccountRecovery.jsx` | Pantalla de recuperar cuenta rehecha (ver §3). |

### Por qué se hizo sobre la capa visual y no reescribiendo cada pantalla

Hay unas 20 pantallas con lógica propia (reservas, asientos, mapas, QR, pagos). Reescribir
su JSX una a una ponía en riesgo funcionalidad que ya funciona. En su lugar, el tema
redefine el aspecto de las clases que todas comparten (`dashboard-section`, `info-item`,
`users-table`, `*-header`, `.input`…). Resultado: todas cambian de aspecto sin tocar su
lógica. Solo se reescribieron las piezas estructurales: navegación, portada y accesos.

### Defectos de diseño encontrados y corregidos al verificarlo

Se verificó con capturas reales (Chrome headless + Puppeteer), no solo con el build.

| Pantalla | Defecto | Causa |
|---|---|---|
| Comprar boletos | El precio era un recuadro amarillo **sin texto visible** | `boletos.css` pinta `.precio` con fondo amarillo y el tema le ponía texto amarillo |
| Comprar boletos | Botón «Ver recomendados» morado | `#667eea` en `boletos.css` |
| Mis reservas | Banner verde turquesa | Degradado `#11998e → #38ef7d` escrito en línea en el JSX |
| Mis reservas | Botones azul y verde en cada reserva | Estilos en línea |
| Reserva rápida / selector de asientos | Diálogos con fondo blanco **por debajo de la barra superior** | `zIndex: 1000` en línea, el mismo que la barra (`#32BUG`) |
| Reserva de asientos | Página entera con degradado morado; mapa del bus en blanco | `SeatBooking.css` y `BusSeatSelector.css` |
| Recomendados | Tarjetas moradas | `recomendados.css` |
| Panel admin | Formulario de alta en una columna larguísima | Fila `flex` con campos al 100 % |
| Portada | En pantallas altas el hero ocupaba todo y ocultaba el resto | `min-height: 100vh` sin tope |
| Login | Aparecía «o · Cargando acceso con Google…» y luego desaparecía (salto) | El separador se pintaba antes de saber si Google estaba configurado |
| Login | Contraseña autocompletada en azul claro | Estilo de autocompletado de Chrome |

Los colores de estado del mapa de asientos (verde libre, amarillo tuyo, naranja de otro,
gris ocupado) **se conservan**: significan algo. Solo se adaptaron al fondo oscuro.

### Imagen de fondo preparada

No hace falta tocar ningún componente para ponerla. En `src/styles/base/variables.css`:

```css
--app-bg-image: url('/fondo.jpg');      /* hoy: none */
--app-bg-overlay: rgba(10, 10, 10, 0.82);
```

El velo va delante de la imagen en la misma propiedad, para que el texto blanco siga
siendo legible. El archivo va en `frontend/public/`.

---

## 2. Los usuarios con sesión ya no ven la portada

### El problema

Con la sesión iniciada se podía volver a la portada pública (desde «Inicio» o escribiendo
la URL) y ver «Reserva tu viaje» con **rutas de ejemplo inventadas**: tres rutas fijas
de `constants/demo.js` con precios que no existían ($12.50, $15.00…).

### Qué se cambió

- Nuevo guardia **`PublicOnlyRoute`** (`components/RouteGuards.jsx`). Envuelve la portada,
  el login, el registro y las dos pantallas de recuperación. Con sesión, redirige a la
  pantalla de inicio de cada rol:

  | Rol | Destino |
  |---|---|
  | `admin` | `/admin` |
  | `agente` | `/agente` |
  | `user` | `/dashboard` |

- El enlace «Inicio» desaparece de la barra para quien tiene sesión; el logotipo lleva a
  su pantalla de inicio.
- La portada pasa de `/demo` a `/`. `/demo` redirige a `/` para no romper enlaces viejos.
- Cualquier URL inexistente lleva a la pantalla de inicio del rol, o a la portada sin sesión.
- **Las rutas de la portada son reales**: se piden a `GET /api/rutas` (endpoint público).
  Si no hay rutas o el backend no responde, la sección no se muestra.

### Verificado

```
usuario en /        → /dashboard
admin   en /login   → /admin
```

`constants/demo.js` queda sin uso tras este cambio.

---

## 3. Recuperación de acceso

### «¿Olvidaste tu contraseña o tu correo?»

El formulario exigía el correo, así que **justo quien lo había olvidado se quedaba sin
salida**. Ahora un único campo acepta correo, cédula o pasaporte y deduce cuál es:

| Lo que se escribe | Se interpreta como |
|---|---|
| contiene `@` | correo |
| solo dígitos | cédula |
| cualquier otra cosa | pasaporte |

Con cédula o pasaporte, el enlace se envía al correo guardado y la respuesta dice **a
cuál**, enmascarado (`pa***********@g****.com`).

> **Compromiso consciente.** Devolver la pista solo cuando la cuenta existe permite
> deducir que una cédula está registrada. Se acepta porque sin ella la función no cumple
> su propósito. Para neutralidad total, basta con no devolver `destinoEnmascarado` en
> `authController.forgotPassword`.

Archivos: `validations/schemas.js`, `services/authService.js`,
`controllers/authController.js`, `frontend/src/services/auth.js`,
`frontend/src/components/LoginForm.jsx`. **5 tests nuevos** en `passwordReset.test.js`.

### Pantalla «Recuperar cuenta»

| Antes | Ahora |
|---|---|
| Campos con el estilo blanco del navegador (faltaba la clase `input`) | Campos de cristal |
| «Cédula» repetido tres veces (etiqueta, selector y campo) | «Tipo de documento» + «Número de cédula/pasaporte» |
| Enlace morado | Enlace en el color de acento (regla global de enlaces que faltaba) |
| Sin indicación del paso | Indicador de 3 pasos |
| Código en un campo normal | Dígitos grandes y espaciados |
| Sin forma de volver al paso 1 | Botón «Volver atrás» |

---

## 4. Inicio de sesión con Google

El botón no aparecía. Fueron **cuatro causas** encadenadas:

1. **Nombre de variable.** El `.env` tenía `AUTGOOGLE` y `KEYGOOGLE`; el código lee
   `GOOGLE_CLIENT_ID`. Se renombraron.
2. **Backend con valores viejos.** El proceso en marcha se había iniciado antes del cambio.
3. **Bucle en el componente.** `onError` llegaba como función en línea y estaba en las
   dependencias del efecto: se reejecutaba en cada render y el botón podía no terminar de
   cargarse. Ahora ambos callbacks van en `ref`.
4. **Puerto.** Google Cloud Console autoriza `http://localhost:3001` y el frontend corría en
   3000; al pulsar el botón habría dado `origin_mismatch`. El frontend pasa a **3001**
   (`vite.config.js` y script `start`).

---

## 5. Revisión del último merge (`17ee106`)

### Qué traía

El merge unió dos implementaciones **incompatibles** del mismo requisito (dar de baja sin
perder datos):

| | Rama local | Rama remota |
|---|---|---|
| Modelo | `estado`: ACTIVO / BLOQUEADO / ELIMINADO | `isDeleted` + `deletedAt` + `deletionReason` |
| Borrado físico | nunca | sí, si la cuenta no tenía historial |

Se unificó en `estado`. Detalle completo en [FUSION-RAMAS.md](FUSION-RAMAS.md).

Además, `origin/main` tiene 5 commits que no están en esta rama (CI de septiembre y un
arreglo del job de publicación de imágenes). **Se fusionan sin conflictos**; no se han
traído porque no se pidió.

### Lo que el merge rompió sin avisar

Git solo marca como conflicto los trozos que ambas ramas tocaron **en las mismas líneas**.
Los cambios de la rama remota en otras zonas de los mismos archivos se fusionaron
automáticamente, y varios dependían de `isDeleted`, un campo que ya no existe. Se
localizaron comparando línea a línea lo que añadió la rama remota con lo que quedó.

| # | Archivo | Problema | Impacto |
|---|---|---|---|
| 1 | `frontend/src/pages/admin/AdminUsers.jsx` | Se coló la celda de estado remota, que leía `u.isDeleted` | Mostraba **«Activa» en todas las cuentas, incluidas las bloqueadas**, y la fila tenía 10 celdas para 9 columnas: «Rol» y «Estado» salían cruzados |
| 2 | `backend/src/services/authService.js` | Comprobación de `isDeleted` en el login, **antes** de validar la contraseña | Reabría la fuga que el diseño evita: averiguar si una cédula tiene la cuenta bloqueada sin conocer la contraseña |
| 3 | `backend/src/middleware/auth.js` | Segunda comprobación de bloqueo con `isDeleted` | Dos fuentes de verdad para lo mismo |
| 4 | `backend/src/repositories/userRepo.js` | `markAsDeleted` y `restore` escribían `isDeleted` | Código muerto que crearía un estado inconsistente si alguien lo usara |
| 5 | `backend/src/models/accountRecoveryModel.js` | Índice de `expiresAt` declarado dos veces (normal + TTL) | Solo se crea uno; en Atlas **no existe el TTL**, así que los códigos caducados nunca se borran |

Todos corregidos. Antes de corregir se comprobó en la base de datos que **ninguna cuenta**
tiene `isDeleted: true`, así que no hace falta migrar datos.

Sobre el punto 5: Mongoose crea el índice TTL al arrancar el backend con el modelo
corregido. Se aplicará en el próximo `npm run dev`.

### Lo que no se perdió

Toda la funcionalidad de la rama remota tiene equivalente: restaurar cuentas, el flujo de
recuperación por código, sus tests. Lo único que había quedado sin entrada era la ruta
`/recuperar-contrasena`; sigue existiendo y la cubre también «¿Olvidaste tu contraseña o
tu correo?».

---

## 6. Trabajo anterior en esta misma línea

Resumen de lo hecho antes de este bloque (ya commiteado o documentado aparte).

| Área | Cambio | Referencia |
|---|---|---|
| Catálogo de fallas | 35 marcas `#NBUG` en el código | [BUGS.md](BUGS.md) |
| Cuentas | Baja lógica con `estado` en lugar de borrado físico | `utils/estadoCuenta.js` |
| Correo | Cadena de transportes: API consumidora → SMTP → archivo local en desarrollo | `services/mailerService.js` |
| Correo | Verificación de la dirección al registrarse | `utils/verificacionEmail.js` |
| Correo | Validador del modelo corregido (aceptaba `gmail..com` y `doble@@arroba.com`) | `models/userModel.js` |
| Contraseña | Recuperación por enlace con token hasheado y de un solo uso | `services/authService.js` |
| Google | Inicio de sesión con `id_token` verificado en el servidor | `services/googleAuthService.js` |
| Asientos | Corregidas las rutas a la API externa: todas daban 404 y siempre se usaba el respaldo local | `config/externalApis.js` |
| Asientos | Cambio de asiento: primero se crea la reserva nueva y después se cancela la antigua | `pages/Dashboard.jsx` |
| Ventanas emergentes | `Popup`, `AlertPopup`, `ConfirmPopup` con portal por encima de la barra | `components/Popup.jsx` |
| Ramas | Fusión de `main_paul` local con la remota | [FUSION-RAMAS.md](FUSION-RAMAS.md) |

---

## 7. Pendiente

| Tarea | Motivo |
|---|---|
| Rotar credenciales expuestas (secreto de Google, contraseña de aplicación de Gmail, usuario `admin:admin` de MongoDB, `JWT_SECRET=miclavesecreta`) | Su contenido salió del equipo al compartirse el `.env` |
| Borrar 8 archivos y carpetas muertos (`#1`, `#18`–`#20`, `#26`, `#27`, `#30`, `#31`) | El sistema de permisos bloqueó los borrados |
| Pasar las 9 pantallas que aún usan `alert()` nativo a `Popup` | `#33BUG` |
| Definir `CORS_ORIGINS` al desplegar | Mientras no esté, se acepta cualquier origen (con aviso en consola) |
| Endpoint `/api/mail/send` en la API consumidora | Mientras no exista, el correo sale por SMTP (`MAIL_API_ENABLED=false`) |
| Actualizar [BUGS.md](BUGS.md) | Varias marcas ya están corregidas; ver la nota al inicio de ese archivo |

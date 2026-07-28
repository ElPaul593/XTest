# BusReservation - Backend (Express + MongoDB)

Estructura inicial siguiendo MVC y principios de Clean Code.

- Node >= 18
- MongoDB

Comandos:

- Instalar dependencias:

  npm install

- Copiar variables de entorno:

  copy .env.example .env

- Ejecutar en desarrollo:

  npm run dev

Siguientes pasos:
- Implementar validaciones y DTOs
- Añadir tests
- Dockerizar

Autenticación (registro / login)

Endpoints:
- POST /api/auth/register  { cedula, nombre, apellido, telefono, password }
- POST /api/auth/login     { cedula, password }

Variables de entorno:
- JWT_SECRET: secreto para firmar tokens JWT

Recuerda ejecutar `npm install` después de actualizar `package.json` para instalar `bcrypt` y `jsonwebtoken`.

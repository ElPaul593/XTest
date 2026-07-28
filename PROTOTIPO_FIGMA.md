# 🎨 Guía: Prototipo en Figma a partir de tu Frontend (CulturalTrip / BusReserva)

> Esta guía te permite tener un prototipo en Figma **idéntico a tu carpeta `frontend/`**, sin pagar
> nada y sin depender del límite de la automatización (ese límite solo aplica a mí, no a ti
> editando en Figma a mano).

---

## 📌 Lo que ya está hecho (base lista para usar)

Archivo de Figma ya creado: **https://www.figma.com/design/uzU382uUbo6lbt4rp7aJLp**

Ya contiene:
- **Tokens de color** (tu tema oscuro + dorado, sacados de `frontend/src/styles/base/variables.css`)
- **Estilos de texto** (escala tipográfica Inter 12/14/16/20/24)
- **2 componentes Navbar** (invitado y usuario autenticado), iguales a `Navbar.jsx`
- **Pantalla Demo/Home** (hero + features; falta Rutas Populares y CTA)

---

## 🚀 Ruta RÁPIDA (recomendada): importar tu app real a Figma con un plugin

Como tu frontend **ya está programado**, no hace falta redibujar nada. Un plugin convierte cada
pantalla de tu app en **capas editables de Figma**, calcadas a tu CSS.

### Paso 1 — Levanta tu frontend
```bash
cd frontend
npm install      # solo la primera vez
npm run dev      # abre http://localhost:5173
```
> Si alguna pantalla necesita backend (login, datos), levántalo también:
> `cd backend && npm install && npm run dev` (revisa el puerto en `backend/`).
> Para pantallas que piden login, primero inicia sesión en el navegador así el plugin captura la
> vista autenticada.

### Paso 2 — Instala el plugin en Figma
En Figma: **menú → Plugins → Browse plugins in Community** y busca uno de estos (gratis):
- **html.to.design** (el más fiel; importa una URL como capas editables) ← recomendado
- **Builder.io / Figma to HTML** (alternativa)

### Paso 3 — Importa cada ruta de tu app
Con el plugin abierto, pega cada URL local y dale *Import*. Tu app tiene estas rutas
(de `frontend/src/App.jsx`):

| # | Pantalla | URL para importar |
|---|----------|-------------------|
| 1 | Demo / Home | `http://localhost:5173/demo` |
| 2 | Login | `http://localhost:5173/login` |
| 3 | Register | `http://localhost:5173/register` |
| 4 | Dashboard / Mis Reservas | `http://localhost:5173/dashboard` |
| 5 | Boletos | `http://localhost:5173/boletos` |
| 6 | Rutas | `http://localhost:5173/rutas` |
| 7 | Lugares Turísticos | `http://localhost:5173/lugares-turisticos` |
| 8 | Selección de Asientos | `http://localhost:5173/seat-booking` |
| 9 | Profile | `http://localhost:5173/profile` |
| 10 | Destino | `http://localhost:5173/destino` |
| 11 | Recomendados | `http://localhost:5173/recomendados` |
| 12 | Admin | `http://localhost:5173/admin` |
| 13 | Agente (verificación QR) | `http://localhost:5173/agente` |
| 14 | Validar Cédula | `http://localhost:5173/validar-cedula` |

> Consejo: importa cada pantalla a un *Frame* aparte y nómbralos `01 · Demo`, `02 · Login`, etc.

### Paso 4 — Conéctalas como PROTOTIPO navegable
1. Selecciona todas las pantallas y acomódalas en fila.
2. Ve a la pestaña **Prototype** (arriba a la derecha).
3. Arrastra desde un botón (p. ej. "Iniciar Sesión") hasta la pantalla destino (Login).
   - Trigger: **On click** → Action: **Navigate to** → la pantalla destino.
4. Flujo sugerido para la demo:
   `Demo → Login → Dashboard → Rutas → Selección de Asientos → Boletos`
   y desde el navbar a `Lugares Turísticos`, `Mi Perfil`, etc.
5. Pulsa **▶ Present** (arriba a la derecha) para presentarlo.

---

## 🛠️ Ruta MANUAL (si prefieres dibujarlas tú en Figma)

Usa estos valores exactos para que quede igual a tu código.

### Colores (de `variables.css`)
| Token | Hex | Uso |
|-------|-----|-----|
| bg | `#0a0a0a` | Fondo general |
| surface | `#1a1a1a` | Tarjetas / secciones |
| surface-light | `#151515` | Tarjetas internas |
| text | `#ffffff` | Texto principal |
| text-muted | `#cfcfcf` | Texto secundario |
| accent | `#ffd700` | Dorado (marca, precios, links activos) |
| accent-hover | `#e6c200` | Hover dorado |
| error | `#ff4444` | Errores |
| success | `#28a745` | Éxito |
| border | `#2a2a2a` | Bordes |

### Tipografía (Inter)
| Estilo | Tamaño / Interlineado | Peso |
|--------|----------------------|------|
| Display | 34 / 40 | Bold |
| H1 | 24 / 30 | Bold |
| H2 | 20 / 26 | Bold |
| H3 | 16 / 22 | Semi Bold |
| Body | 14 / 20 | Regular |
| Small | 12 / 16 | Regular |

### Medidas clave
- Ancho de pantalla (frame): **1440 px** (desktop)
- Navbar: alto **70 px**, fijo arriba, fondo `#0a0a0a`, borde inferior `#2a2a2a`
- Contenedor de contenido: máx **1200 px** centrado (≈120 px de margen a cada lado en 1440)
- Radios: sm `6px`, md `8px`, lg `12px`
- Espaciados: xs 4 · sm 8 · md 12 · lg 16 · xl 24

### Navbar (logo + menú)
- Logo: `🚌 BusReserva` (Bold 20, blanco)
- Menú invitado: `Inicio` · botón `Iniciar Sesión` (borde) · botón `Registrarse` (dorado)
- Menú usuario: `Inicio · Dashboard · Boletos · Rutas · Lugares Turísticos · Mis Reservas · Mi Perfil`
  + botón `Cerrar Sesión`. Link activo en dorado con subrayado.

> Para el contenido exacto de cada pantalla, abre el `.jsx` correspondiente en
> `frontend/src/pages/` — ahí están todos los textos, tarjetas y secciones.

---

## 🎬 Plan de respaldo (lo más rápido de todo)

Si el tiempo apremia, tu app **ya funciona**. Para la presentación puedes:
1. Levantar la app (`npm run dev`).
2. Grabar la pantalla recorriendo el flujo (Windows: `Win + G` o `Win + Alt + R`).
3. Presentar ese video como "prototipo funcional".

Es 100% válido como demostración y no depende de Figma.

---

## ❓ ¿Por qué se cortó la automatización?
Tu cuenta de Figma está en plan **Starter (gratis)**, que permite solo **6 llamadas/mes** al
servidor MCP que yo uso para escribir en Figma automáticamente. Ese cupo se agotó construyendo la
base. **Tú editando a mano en Figma no tienes ese límite.** Si en el futuro quieres que yo termine
las pantallas de forma automática, habría que subir la cuenta a **Figma Professional con asiento
Full** (200 llamadas/día).

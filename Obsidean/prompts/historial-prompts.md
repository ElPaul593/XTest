---
tags: [prompts, historial, registro]
proyecto: CulturalTrip / BusReservation
tipo: registro-prompts
actualizado: 2026-09-22
---

# Historial de Prompts

Registro de prompts clave utilizados durante el desarrollo y diseño del proyecto de tesis. Cada entrada documenta el prompt, su contexto, la herramienta/modelo usado y el resultado obtenido, para mantener trazabilidad entre decisiones técnicas y la interacción con asistentes de IA.

> Este archivo se actualiza de forma incremental. Agregar una nueva entrada al final de la sección **2. Registro** usando la plantilla de la sección **1**.

---

## 1. Plantilla para nuevas entradas

```markdown
### [YYYY-MM-DD] Título corto del prompt

- **Herramienta/Modelo:** (ej. Claude Sonnet 5, ChatGPT, Copilot)
- **Contexto:** Qué problema o tarea motivó el prompt.
- **Área afectada:** (ej. backend/services/hotelService, frontend/pages/Admin)
- **Prompt utilizado:**
  > Texto exacto o resumido del prompt.
- **Resultado/Decisión:** Qué se implementó o decidió a partir de la respuesta.
- **Commit(s) relacionado(s):** hash corto y mensaje (si aplica).
- **Notas:** Aprendizajes, limitaciones o seguimientos pendientes.
```

---

## 2. Registro

### [2026-09-22] Documentación de arquitectura para Obsidian

- **Herramienta/Modelo:** Claude Sonnet 5 (Claude Code)
- **Contexto:** Se necesitaba estructurar la documentación técnica del proyecto de tesis bajo una convención compatible con un Vault de Obsidian (`/contextos`, `/wiki`, `/prompts`) para facilitar la consulta y el mantenimiento de la documentación a lo largo del desarrollo.
- **Área afectada:** Documentación general del monorepo (`backend/` + `frontend/`).
- **Prompt utilizado:**
  > "Actúa como un Ingeniero de Software Senior y Arquitecto de Sistemas. Necesito documentar y estructurar la arquitectura de mi aplicación de tesis para integrarla con un Vault de Obsidian existente [...]"
- **Resultado/Decisión:** Se generaron los archivos `contextos/01-arquitectura-general.md`, `contextos/02-servicios-consumidos.md`, `wiki/glosario-tecnologico.md` y este registro (`prompts/historial-prompts.md`), basados en la inspección real del código (`package.json`, `src/config/externalApis.js`, `src/services/*`, `src/routes/index.js`).
- **Commit(s) relacionado(s):** _(pendiente al momento de commitear esta documentación)_
- **Notas:** La documentación se basa en el estado del repositorio al 2026-09-22 (rama `mainPablo`). Debe revisarse y actualizarse si cambian las capas, servicios externos o el stack tecnológico.

---

### [Fecha no registrada] Mejoras en el consumo de la API de Hoteles

- **Herramienta/Modelo:** No especificado.
- **Contexto:** Optimización del consumo de la API de hoteles (Google Places) para mejorar resultados y rendimiento.
- **Área afectada:** `backend/src/services/hotelService.js`, `backend/src/services/googlePlacesService.js`.
- **Prompt utilizado:** _(no registrado en el historial original — completar retroactivamente si se dispone del prompt exacto)_.
- **Resultado/Decisión:** Ver commit `6f48374` — "Se realizaron mejoras en el consumo de la API de Hoteles."
- **Commit(s) relacionado(s):** `6f48374`
- **Notas:** Entrada reconstruida a partir del historial de Git; se recomienda documentar los prompts en el momento en que se generan, no de forma retroactiva.

---

### [Fecha no registrada] Corrección de rutas hacia Cuenca y otras ciudades

- **Herramienta/Modelo:** No especificado.
- **Contexto:** Bug donde las rutas hacia Cuenca y otras ciudades no resolvían correctamente los resultados de la API externa de lugares/hoteles.
- **Área afectada:** `backend/src/services/googlePlacesService.js`, `backend/src/utils/provinciaUtils.js`.
- **Prompt utilizado:** _(no registrado — completar si se recupera el prompt original)_.
- **Resultado/Decisión:** Fix aplicado concatenando la búsqueda con la API KEY y aplicando `trim()` al nombre del país ("Ecuador") para evitar errores de coincidencia en la consulta a Google Places.
- **Commit(s) relacionado(s):** `924b7bf`
- **Notas:** Sirve como ejemplo de por qué la normalización de strings (trim, casing) es crítica al construir queries hacia APIs externas de geolocalización.

---

### [Fecha no registrada] Ajustes en validación de lugares ecuatorianos

- **Herramienta/Modelo:** No especificado.
- **Contexto:** Optimización de consultas relacionadas con la asociación de lugares turísticos/hoteles a ciudades y provincias ecuatorianas.
- **Área afectada:** `backend/src/utils/provinciaUtils.js`, servicios de recomendación.
- **Prompt utilizado:** _(no registrado)_.
- **Resultado/Decisión:** Ajustes en las consultas; queda pendiente validación exhaustiva de lugares ecuatorianos (marcado como TODO en el commit).
- **Commit(s) relacionado(s):** `19f3ea5`
- **Notas:** TODO abierto — validación de lugares ecuatorianos. Revisar estado actual antes de asumir que está resuelto.

---

## Referencias cruzadas
- [[01-arquitectura-general]]
- [[02-servicios-consumidos]]
- [[glosario-tecnologico]]

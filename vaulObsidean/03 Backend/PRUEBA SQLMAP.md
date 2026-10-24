# PRUEBA SQLMAP

Informe de la prueba de inyección SQL ejecutada con **sqlmap 1.10.9** sobre el
endpoint de login del backend (prueba de seguridad autorizada, contra la propia
aplicación en `localhost`).

- **Fecha:** 2026-09-23
- **Herramienta:** sqlmap 1.10.9 (`pip install sqlmap`)
- **Duración:** ~19 min (21:16 – 21:35)

---

## 1. Petición original proporcionada

```http
POST /login HTTP/1.1
Host: localhost:8080
Content-Type: application/x-www-form-urlencoded
Cookie: JSESSIONID=abc123

username=admin&password=test
```

> ⚠️ Esta petición **no corresponde a esta aplicación**. Apunta al puerto `8080`
> con body `x-www-form-urlencoded` y cookie `JSESSIONID` (patrón de Spring/Java).
> El backend real es Node/Express, escucha en el puerto **5000** y su login es
> `POST /api/auth/login` con body **JSON** (`cedula`/`pasaporte` + `password`).
> Al lanzar sqlmap contra `localhost:8080` el resultado fue
> `[CRITICAL] unable to connect to the target URL` (no había nada escuchando).

## 2. Petición realmente probada (endpoint real)

```http
POST /api/auth/login HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{"cedula":"1712345678","password":"test123"}
```

## 3. Comando ejecutado

```bash
sqlmap -r req.txt --batch --level=3 --risk=2 --ignore-code=401 --flush-session
```

- `-r req.txt` — carga la petición HTTP desde archivo
- `--batch` — responde automáticamente a los prompts
- `--level=3 --risk=2` — amplía el conjunto de payloads y parámetros probados
- `--ignore-code=401` — necesario porque el login devuelve `401` con credenciales
  inválidas; sin esto sqlmap se detenía al primer 401
- `--flush-session` — ignora resultados cacheados de corridas previas

## 4. Parámetros analizados

| Parámetro | Ubicación | ¿Inyectable? |
|-----------|-----------|--------------|
| `cedula` | JSON body | ❌ No |
| `password` | JSON body | ❌ No |
| `User-Agent` | Cabecera HTTP | ❌ No |
| `Referer` | Cabecera HTTP | ❌ No |

Técnicas probadas en cada parámetro: boolean-based blind, error-based,
inline queries, stacked queries, time-based blind y UNION query, para MySQL,
PostgreSQL, MSSQL, Oracle, SQLite, DB2, Firebird, H2, ClickHouse, etc.

## 5. Resultado

```
[CRITICAL] all tested parameters do not appear to be injectable.
HTTP error codes detected during run: 401 (Unauthorized) - 5895 times
```

**No se detectó ninguna vulnerabilidad de inyección SQL.** Todos los parámetros
respondieron de forma estable con `401` ante los payloads maliciosos, sin
comportamiento diferencial que indique inyección.

## 6. Interpretación

Este resultado es el esperado por dos motivos:

1. **La aplicación usa MongoDB con Mongoose**, no una base de datos SQL. sqlmap
   busca inyección **SQL**, que no aplica a este stack. La superficie de riesgo
   real aquí sería **NoSQL injection** (operadores como `$ne`, `$gt`, `$where`),
   que sqlmap **no** prueba.
2. La entrada se valida con **Joi** (`authSchemas.login`) antes de llegar a la
   capa de datos, lo que restringe tipos y formatos.

## 7. Recomendaciones

- Para este stack, complementar con una prueba de **NoSQL injection** (p. ej.
  `NoSQLMap`, o payloads manuales tipo `{"cedula":{"$ne":null},"password":{"$ne":null}}`)
  para confirmar que Mongoose/validación bloquea operadores en los campos.
- Verificar que las consultas usen siempre valores tipados (no construir filtros
  a partir de objetos crudos del `req.body`).
- Mantener la validación Joi en todos los endpoints que reciben entrada.

---

### Notas de la corrida
- El primer intento contra `localhost:8080` falló por conexión (objetivo inexistente).
- El segundo intento contra el endpoint real devolvía `401` y sqlmap se detenía;
  se resolvió con `--ignore-code=401`.
- Corrida final completada con código de salida `0`.

---
*Copia de `XTest/backend/PRUEBA SQLMAP.md`. El original es la versión que manda: si cambia, vuelve a generar el vault.*

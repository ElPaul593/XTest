# Cultural Trip — Métricas de calidad y seguridad (XTest)

## Alcance de la integración

Este cambio incorpora un workflow **Quality and Security - XTest** que se ejecuta junto al CI/CD existente y **no altera el despliegue a Render**.

- Backend: ESLint y pruebas Jest con cobertura LCOV, mediante el script existente `npm run test:coverage`.
- SonarQube Cloud: análisis estático de `backend/src` y `frontend/src`; cobertura importada solo del backend porque el frontend no tiene todavía Vitest/React Testing Library configurados.
- Seguridad: `npm audit` para los dos paquetes, con informes JSON. Inicialmente los hallazgos se reportan sin bloquear despliegues mientras se analiza su severidad y ruta de actualización.
- CodeQL: análisis de seguridad de JavaScript, publicando hallazgos en GitHub Code Security (requiere las funciones disponibles en el repositorio y permisos de GitHub).
- Evidencias: pestaña Actions, resultados de jobs, cobertura LCOV y JSON de auditoría.

**No confundir:** un job verde sin credenciales de Sonar **no** significa que se ejecutó el análisis de SonarQube. El workflow lo advierte expresamente en su Summary. El estado de Sonar se confirma en el dashboard de SonarQube Cloud.

## Pasos de conexión (única intervención del propietario)

1. Ir a https://sonarcloud.io/ e iniciar sesión con GitHub.
2. Importar el repositorio exacto **ElPaul593/XTest**. Seleccionar Free y, si se ofrece, el análisis por GitHub Actions/CI.
3. Copiar la clave de proyecto (`projectKey`) y la organización (`organization`) **exactamente** como aparezcan en SonarQube Cloud.
4. Crear token de análisis en SonarQube Cloud mediante el flujo de generación de token que muestra el proyecto.
5. En GitHub → **ElPaul593/XTest → Settings → Secrets and variables → Actions**:
   - **Secrets** → New repository secret: `SONAR_TOKEN` = token SonarQube (no pegarlo en commits ni chats).
   - **Variables** → New repository variable: `SONAR_PROJECT_KEY` = clave exacta del proyecto.
   - **Variables** → New repository variable: `SONAR_ORGANIZATION` = clave exacta de la organización.
6. Ir a GitHub → Actions → **Quality and Security - XTest** → Run workflow (una vez integrado a `main`), o revisar el run generado por el PR. En PR desde forks sin acceso a secretos, el escaneo puede omitirse.
7. Confirmar en SonarQube Cloud el reporte y resultado del Quality Gate. Si falla por problemas reales, registrar los hallazgos y corregirlos; no falsear resultados.

## Interpretación de resultados para sustentación

| Indicador | Fuente | Qué significa |
|---|---|---|
| Vulnerabilidades / mantenibilidad / duplicación | SonarQube Cloud | Análisis estático; hallazgos que deben revisarse |
| Quality Gate | SonarQube Cloud | Cumplimiento de condiciones configuradas |
| Cobertura backend | Jest LCOV importado por Sonar | Porcentaje de código del backend ejecutado por pruebas Jest |
| Cobertura frontend | No configurada todavía | No afirmar cobertura total si solo está medida la del backend |
| Dependencias vulnerables | Archivos npm-audit.json | Posibles riesgos, revisar falsos positivos y actualizaciones |
| Hallazgos de seguridad | CodeQL | Patrones de riesgo, pendientes de triaje |
| Pruebas de navegador | Playwright E2E | Valida la interacción; los mocks no prueban persistencia ni backend |

### Política inicial recomendada

Priorizar **código nuevo** (quality gate sobre nuevas vulnerabilidades y problemas de mantenibilidad) antes de imponer umbrales globales que hagan fallar todos los PR por deuda histórica. No configurar artificialmente un Quality Gate que siempre pase.

La auditoría `npm audit` queda en modo informativo para establecer la línea base. Posteriormente se puede cambiar el paso a bloqueo para vulnerabilidades altas/críticas tras corregir lo identificable.

## Observaciones técnicas

- Este cambio NO crea el proyecto Sonar ni conoce tus credenciales; la conexión de cuenta debe hacerla el propietario.
- No se modifica el workflow original `ci-cd.yml`, de modo que las validaciones y despliegue actuales permanecen independientes.
- La rama de revisión debe ser examinada con CI antes del merge a `main`.
- No guardar en el repositorio reportes generados ni tokens secretos.

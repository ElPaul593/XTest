# Cultural Trip — Métricas de calidad y seguridad (XTest)

## Alcance de la integración

El workflow **CI/CD CulturalTrip** incorpora el Quality Gate de SonarQube al job de backend. El despliegue a Render depende de los jobs de backend y frontend, por lo que un error de lint, tests, configuración de Sonar o Quality Gate impide el despliegue.

- Backend: ESLint y pruebas Jest con cobertura LCOV, mediante `npm run test:coverage`.
- SonarQube Cloud: análisis estático de `backend/src` y `frontend/src`; cobertura importada solo del backend porque el frontend no tiene todavía Vitest/React Testing Library configurados.
- Seguridad: `npm audit` para ambos paquetes, con informes JSON. Se mantiene informativo y no bloquea el pipeline.
- CodeQL: análisis de seguridad de JavaScript, publicando hallazgos en GitHub Code Security (requiere las funciones disponibles en el repositorio y permisos de GitHub).
- Evidencias: pestaña Actions, resultado del job de backend, cobertura LCOV y JSON de auditoría.

**Importante:** si falta el secreto o alguna variable de Sonar, el job de backend falla; no se considera un análisis aprobado. El resultado del Quality Gate también se confirma en el dashboard de SonarQube Cloud.

## Pasos de conexión (única intervención del propietario)

1. Ir a https://sonarcloud.io/ e iniciar sesión con GitHub.
2. Importar el repositorio exacto **ElPaul593/XTest**. Seleccionar Free y, si se ofrece, el análisis por GitHub Actions/CI.
3. Copiar la clave de proyecto (`projectKey`) y la organización (`organization`) **exactamente** como aparezcan en SonarQube Cloud.
4. Crear token de análisis en SonarQube Cloud mediante el flujo de generación de token que muestra el proyecto.
5. En GitHub → **ElPaul593/XTest → Settings → Secrets and variables → Actions**:
   - **Secrets** → New repository secret: `SONAR_TOKEN` = token SonarQube (no pegarlo en commits ni chats).
   - **Variables** → New repository variable: `SONAR_PROJECT_KEY` = clave exacta del proyecto.
   - **Variables** → New repository variable: `SONAR_ORGANIZATION` = clave exacta de la organización.
6. Abrir un PR hacia `main`, `main_paul` o `master`, o revisar el run de CI/CD después de integrar los cambios.
7. Confirmar que el job **Backend lint, tests and SonarQube quality gate** ejecutó el análisis y terminó aprobado. Si el Quality Gate falla, revisar los hallazgos en SonarQube Cloud y corregirlos; no falsear resultados.
8. En GitHub → Settings → Rules → Rulesets (o Branch protection rules), requerir el check **Backend lint, tests and SonarQube quality gate** para la rama protegida. Esto evita integrar PRs con ese check fallido.

## Qué evalúa SonarQube en este proyecto

El archivo `sonar-project.properties` limita el análisis a `backend/src` y `frontend/src`. Reconoce como pruebas `backend/src/__tests__` e importa la cobertura Jest del backend desde `backend/coverage/lcov.info`; no se ha configurado cobertura del frontend.

El análisis estático puede reportar:

| Área | Ejemplo de lo que podría detectar |
|---|---|
| Fiabilidad (*bugs*) | Acceso a una propiedad que podría ser `null`/`undefined`, o una condición que produce un resultado incorrecto. |
| Mantenibilidad (*code smells*) | Código duplicado, una función excesivamente compleja o código que dificulta cambios futuros. |
| Seguridad (*vulnerabilities*) | Un flujo de datos controlados por una petición que llega sin validación a una operación sensible, como una consulta SQL vulnerable a inyección o una salida HTML vulnerable a XSS. |
| Seguridad (*hotspots*) | Uso de una función sensible que necesita revisión contextual. Por ejemplo, revisar si una cookie sensible necesita la bandera `HttpOnly` o si una configuración criptográfica es adecuada. Un hotspot requiere revisión humana; no significa automáticamente que exista una vulnerabilidad explotable. |
| Cobertura y duplicación | Porcentaje del código nuevo cubierto por pruebas y proporción de líneas duplicadas. Son métricas calculadas; SonarQube no ejecuta las pruebas por sí mismo. |

Estos son ejemplos de patrones que el analizador puede señalar, no hallazgos confirmados en el código actual. La detección depende de las reglas activas y de los patrones que Sonar pueda reconocer. SonarQube hace análisis estático; no reemplaza Jest, pruebas E2E, auditorías de dependencias ni una prueba de penetración.

### Qué hace fallar el Quality Gate

En este repositorio, `-Dsonar.qualitygate.wait=true` le indica al workflow que espere el resultado del Quality Gate y falle si SonarCloud lo marca como fallido. **No configura por sí solo los umbrales.** `sonar-project.properties` tampoco contiene umbrales numéricos: el Quality Gate y el perfil de reglas se consultan en SonarCloud, en la configuración del proyecto.

Si el proyecto tiene asignado el Quality Gate recomendado **Sonar way** (el predeterminado, salvo que se haya cambiado), sus condiciones estándar para código nuevo son: rating A de fiabilidad, seguridad y mantenibilidad; revisión del 100 % de los nuevos hotspots; cobertura de código nuevo de al menos 80 %; y duplicación de código nuevo no mayor a 3 %. En análisis de PR se aplican las condiciones de código nuevo. Confirma en SonarCloud que el proyecto usa ese gate antes de presentar esos umbrales como los que efectivamente bloquean este pipeline.

SonarQube Cloud puede ignorar las condiciones de cobertura y duplicación cuando el cambio tiene menos de 20 líneas, según el ajuste del factor de tolerancia de la organización/proyecto.

Referencias: [Quality gates](https://docs.sonarsource.com/sonarqube-cloud/standards/managing-quality-gates/introduction-to-quality-gates.md), [reglas de seguridad](https://docs.sonarsource.com/sonarqube-cloud/standards/managing-rules/security-related-rules.md) y [security hotspots](https://docs.sonarsource.com/sonarqube-cloud/standards/managing-rules/security-hotspots.md).

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

La auditoría `npm audit` queda en modo informativo para establecer la línea base, según lo acordado. El Quality Gate de Sonar sí bloquea el job de backend y, por dependencia, el despliegue.

## Observaciones técnicas

- Este cambio NO crea el proyecto Sonar ni conoce tus credenciales; la conexión de cuenta debe hacerla el propietario.
- El token se guarda en GitHub Actions Secrets; nunca se coloca en archivos del repositorio. El workflow lo expone solo al paso que valida la configuración y al análisis de Sonar.
- El check requerido en las reglas de rama bloquea la integración del PR. Además, el job de despliegue depende del job de backend, así que un análisis fallido también impide el despliegue.
- No guardar en el repositorio reportes generados ni tokens secretos.

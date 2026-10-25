/**
 * Crea XTest/vaulObsidean con una copia organizada de todos los .md del repositorio.
 *
 * - Copia, no mueve: los README y documentos de la raíz tienen que seguir donde
 *   están (GitHub los muestra ahí y se enlazan entre sí).
 * - Renombra los que chocan de nombre (hay tres README.md).
 * - Convierte los enlaces markdown entre documentos a [[wikilinks]], porque al
 *   cambiar de carpeta las rutas relativas dejarían de resolver.
 */
const fs = require('fs');
const path = require('path');

// Ruta del repositorio deducida de la ubicación del script (XTest/scripts/), para
// que funcione en cualquier equipo y no solo en el que se escribió.
const REPO = path.resolve(__dirname, '..');
const VAULT = path.join(REPO, 'vaulObsidean');

// origen relativo al repo -> [carpeta en el vault, nombre de nota sin .md]
const MAPA = {
  'README.md': ['01 Proyecto', 'README'],
  'ARCHITECTURE.md': ['01 Proyecto', 'ARCHITECTURE'],
  'DEPLOYMENT.md': ['01 Proyecto', 'DEPLOYMENT'],
  'PROTOTIPO_FIGMA.md': ['01 Proyecto', 'PROTOTIPO_FIGMA'],
  'CAMBIOS.md': ['02 Cambios', 'CAMBIOS'],
  'FUSION-RAMAS.md': ['02 Cambios', 'FUSION-RAMAS'],
  'BUGS.md': ['02 Cambios', 'BUGS'],
  'backend/README.md': ['03 Backend', 'README backend'],
  'backend/PRUEBA SQLMAP.md': ['03 Backend', 'PRUEBA SQLMAP'],
  'frontend/README.md': ['04 Frontend', 'README frontend'],
  'Obsidean/contextos/01-arquitectura-general.md': ['05 Contexto', '01-arquitectura-general'],
  'Obsidean/contextos/02-servicios-consumidos.md': ['05 Contexto', '02-servicios-consumidos'],
  'Obsidean/wiki/glosario-tecnologico.md': ['05 Contexto', 'glosario-tecnologico'],
  'Obsidean/prompts/historial-prompts.md': ['05 Contexto', 'historial-prompts']
};

// Nombre de archivo original -> nota del vault, para reescribir enlaces.
const POR_ARCHIVO = {};
for (const [orig, [, nota]] of Object.entries(MAPA)) {
  POR_ARCHIVO[path.basename(orig)] = POR_ARCHIVO[path.basename(orig)] || nota;
}

/** [texto](ruta/ARCHIVO.md#ancla) -> [[nota#ancla|texto]] si el destino está en el vault. */
function aWikilinks(md) {
  return md.replace(/\[([^\]]+)\]\(([^)\s]+?\.md)(#[^)]*)?\)/g, (todo, texto, ruta, ancla) => {
    const nota = POR_ARCHIVO[path.basename(decodeURIComponent(ruta))];
    if (!nota) return todo;
    const destino = nota + (ancla || '');
    return texto === nota ? `[[${destino}]]` : `[[${destino}|${texto}]]`;
  });
}

fs.mkdirSync(VAULT, { recursive: true });

const copiados = [];
for (const [orig, [carpeta, nota]] of Object.entries(MAPA)) {
  const src = path.join(REPO, orig);
  if (!fs.existsSync(src)) { console.log('NO EXISTE:', orig); continue; }
  const dir = path.join(VAULT, carpeta);
  fs.mkdirSync(dir, { recursive: true });

  let contenido = fs.readFileSync(src, 'utf8');
  contenido = aWikilinks(contenido);

  // Pie con el origen: el vault es una COPIA y conviene saber qué archivo manda.
  contenido = contenido.replace(/\s*$/, '') +
    `\n\n---\n*Copia de \`XTest/${orig}\`. El original es la versión que manda: si cambia, vuelve a generar el vault.*\n`;

  fs.writeFileSync(path.join(dir, nota + '.md'), contenido, 'utf8');
  copiados.push([carpeta, nota, orig]);
}

// Nota índice (MOC) del vault.
const grupos = {};
for (const [carpeta, nota, orig] of copiados) (grupos[carpeta] = grupos[carpeta] || []).push([nota, orig]);

const DESCRIPCION = {
  '01 Proyecto': 'Visión general, arquitectura, despliegue y prototipo.',
  '02 Cambios': 'Qué se ha cambiado, la fusión de ramas y el catálogo de fallas.',
  '03 Backend': 'API Express + MongoDB.',
  '04 Frontend': 'SPA React + Vite.',
  '05 Contexto': 'Contexto técnico, servicios consumidos, glosario e historial de prompts.'
};

let indice = `---
tags: [indice, moc]
proyecto: CulturalTrip / BusReservation
---

# CulturalTrip · Vault de documentación

Punto de entrada. Reúne en un solo lugar los ${copiados.length} documentos markdown del
repositorio \`XTest\`, organizados por tema.

> Las notas son **copias**. Los originales siguen en su sitio del repositorio y son los
> que mandan. Para regenerar este vault tras cambiar alguno, ejecuta desde la raíz
> de XTest: \`node scripts/generar-vault-obsidian.js\`

## Por dónde empezar

- [[README]] — qué es el proyecto y cómo arrancarlo.
- [[CAMBIOS]] — registro de todo lo cambiado recientemente.
- [[01-arquitectura-general]] — capas del backend y estructura del frontend.

`;

for (const carpeta of Object.keys(grupos).sort()) {
  indice += `## ${carpeta}\n\n${DESCRIPCION[carpeta] || ''}\n\n`;
  for (const [nota, orig] of grupos[carpeta]) indice += `- [[${nota}]] — \`${orig}\`\n`;
  indice += '\n';
}

fs.writeFileSync(path.join(VAULT, '00 Inicio.md'), indice, 'utf8');

console.log(`Vault creado en ${VAULT}`);
console.log(`  notas copiadas: ${copiados.length} + índice`);
for (const c of Object.keys(grupos).sort()) console.log(`  ${c}: ${grupos[c].length}`);

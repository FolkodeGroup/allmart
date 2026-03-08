// Script para asignar puntajes a issues que no tienen PUNTAJE en el body
// Modifica el body de cada issue via GitHub API sumandole la linea PUNTAJE: N
const fetch = require('node-fetch');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'FolkodeGroup';
const REPO = 'allmart';
const headers = {
  Authorization: 'token ' + TOKEN,
  Accept: 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
};

// Mapa de issue → puntaje a asignar según tabla de PUNTAJES.md
// (Media = 30-40, Alta = 60-80, Muy alta = 100-200)
const ISSUES_PUNTAJES = {
  // ── agustin-ovejero ──────────────────────────────────────────────────────────
  194: 80,   // Refactorización de Sidebar: Colapsable y Responsive  → Alta
  195: 40,   // Sidebar: Indicadores de Estado Activo y Hover Modernos → Media

  // ── FedericoPaal (Dashboard widgets) ─────────────────────────────────────────
  204: 60,   // Widget de Ventas Semanales (Gráfico de líneas)        → Alta
  205: 40,   // Tarjetas de Métricas de Alto Impacto (x4 KPIs)        → Media
  206: 60,   // Gráfico de Distribución por Categorías (pie/donut)    → Alta
  207: 40,   // Widget de "Pedidos Recientes" (tabla últimos 5)        → Media
  208: 40,   // Alerta de Stock Crítico (Filtro Rápido)                → Media
  209: 80,   // Mapa de Calor de Ventas (días/horas)                  → Alta (viz compleja)
  210: 40,   // Widget de Objetivos Mensuales (barra de progreso)      → Media
  211: 40,   // Tarjeta de "Mejores Clientes" (top 5)                  → Media
  212: 60,   // Gráfico de Barras — Top 10 Productos más Vendidos      → Alta
  213: 80,   // Filtro Global de Fecha para todo el Dashboard          → Alta (state global)

  // ── CelinaJP (imágenes y favicon) ────────────────────────────────────────────
  224: 10,   // Descargar imágenes de productos desde Canva            → Muy baja
  225: 10,   // Subir imágenes a carpeta compartida en Google Drive    → Muy baja
  226: 10,   // Clasificar imágenes por categoría de producto          → Muy baja
  227: 20,   // Documentar estructura y nombres de imágenes            → Baja
  228: 20,   // Procesar y exportar el logo en formatos web            → Baja
  229: 20,   // Generar favicon en todos los tamaños requeridos        → Baja
  230: 20,   // Documentar proceso de generación de favicon            → Baja
  231: 30,   // Optimizar imágenes para web (peso/calidad)             → Media baja
  232: 30,   // Crear README visual de recursos gráficos               → Media baja
  233: 30,   // Verificar visualización de imágenes en frontend        → Media baja
};

// Los mismos patrones que usa sumar_puntajes.cjs + detección del formato propio
function extractScore(body) {
  let match = body && body.match(/PUNTAJE\s*[:：]\s*(\d+)/i);
  if (match) return parseInt(match[1], 10);
  match = body && body.match(/\*\*PUNTAJE:\*\*\s*\n\s*(\d+)/i);
  if (match) return parseInt(match[1], 10);
  return 0;
}

// Detecta si ya existe cualquier línea que empiece con algo relacionado a puntaje (para no duplicar)
function hasAnyScoreLine(body) {
  return /PUNTAJE\s*[:：]/i.test(body || '');
}

async function updateIssue(number, score) {
  // 1. Fetch current body
  const getRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/issues/${number}`,
    { headers }
  );
  if (!getRes.ok) throw new Error(`Failed to GET issue #${number}: ${getRes.status}`);
  const issue = await getRes.json();

  let currentBody = issue.body || '';
  const currentScore = extractScore(currentBody);

  if (currentScore > 0) {
    console.log(`⏭️  Issue #${number} ya tiene PUNTAJE: ${currentScore} — saltando`);
    return false;
  }

  // Si hay un intento previo con formato incorrecto (**PUNTAJE:** N), lo removemos primero
  if (hasAnyScoreLine(currentBody)) {
    // Quitar la línea con **PUNTAJE:** y el separador --- previo
    currentBody = currentBody.replace(/\n{0,2}---\n\*\*PUNTAJE:\*\*\s+\d+/, '').trimEnd();
    console.log(`🔧  Issue #${number}: removiendo formato incorrecto previo`);
  }

  // 2. Append puntaje al final del body con formato correcto (compatible con extractScore)
  const newBody = currentBody.trimEnd() + `\n\n---\n\nPUNTAJE: ${score}`;

  // 3. PATCH el issue
  const patchRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/issues/${number}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ body: newBody }),
    }
  );

  if (!patchRes.ok) {
    const txt = await patchRes.text();
    throw new Error(`Failed to PATCH issue #${number}: ${patchRes.status} — ${txt}`);
  }

  console.log(`✅  Issue #${number}: PUNTAJE asignado → ${score} pts`);
  return true;
}

// Pequeña pausa para no saturar la API
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log('🚀  Asignando puntajes a issues sin PUNTAJE tag...\n');

  const entries = Object.entries(ISSUES_PUNTAJES);
  let updated = 0;
  let skipped = 0;

  for (const [numStr, score] of entries) {
    const num = parseInt(numStr, 10);
    const wasUpdated = await updateIssue(num, score);
    if (wasUpdated) updated++;
    else skipped++;
    await sleep(150); // respetar rate limit
  }

  console.log(`\n📊  Resumen:`);
  console.log(`   Actualizados: ${updated}`);
  console.log(`   Saltados (ya tenían puntaje): ${skipped}`);
  console.log('\n👉  Ejecutá ahora: node scripts/sumar_puntajes.cjs');
})();

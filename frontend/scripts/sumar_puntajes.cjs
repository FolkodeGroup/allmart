// Script para sumar puntajes de issues cerrados + actividades de gestión
// y actualizar SCORES.md.
//
// Fuentes de puntaje:
//   1. Issues cerrados en GitHub con "PUNTAJE: N" en el cuerpo
//   2. MANAGEMENT_LOG.md (generado automáticamente por el workflow puntajes_gestion.yml)
//
// Requiere: Node.js y un token de GitHub con permisos de repo (GITHUB_TOKEN)
//   Crea frontend/.env con:  GITHUB_TOKEN=ghp_...

const fs = require('fs');
const path = require('path');

// ── Compatibilidad con node-fetch v2 (CommonJS) y v3+ (ESM) ──────────────────
let fetchFn;
try {
  fetchFn = require('node-fetch'); // node-fetch v2
  if (fetchFn.default) fetchFn = fetchFn.default;
} catch {
  throw new Error('Instala node-fetch: npm install node-fetch@2');
}

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const OWNER = 'FolkodeGroup';
const REPO = 'allmart';
// dgimenezdeveloper y folkodegroup representan la misma persona
const ALIAS_MAP = { folkodegroup: 'dgimenezdeveloper' };
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('❌  Debes definir GITHUB_TOKEN en frontend/.env');
  process.exit(1);
}

const headers = {
  Authorization: `token ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeDev(login) {
  return ALIAS_MAP[login?.toLowerCase()] ?? login;
}

function extractScore(body) {
  if (!body) return 0;
  // Regex mejorada: busca "PUNTAJE" seguido de ":" o "：" y captura el número
  // Ignora negritas (**), espacios extras y saltos de línea
  const regexes = [
    /PUNTAJE\s*[:：]\s*(\d+)/i,
    /\*\*PUNTAJE\s*[:：]\*\*\s*(\d+)/i,
    /PUNTAJE\s*[:：]\s*\n\s*(\d+)/i
  ];

  for (const regex of regexes) {
    const match = body.match(regex);
    if (match) return parseInt(match[1], 10);
  }
  return 0;
}

async function fetchIssues(page = 1, acc = []) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/issues?state=closed&per_page=100&page=${page}`;
  const res = await fetchFn(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  if (data.length === 0) return acc;
  return fetchIssues(page + 1, acc.concat(data));
}

/**
 * Lee MANAGEMENT_LOG.md desde la raíz del repo y devuelve las entradas
 * como array de { dev, score, actividad, referencia, fecha }.
 */
function readManagementLog() {
  const logPath = path.resolve(__dirname, '../../MANAGEMENT_LOG.md');
  if (!fs.existsSync(logPath)) {
    console.log('ℹ️  MANAGEMENT_LOG.md no encontrado — se omiten actividades de gestión');
    return [];
  }
  const lines = fs.readFileSync(logPath, 'utf8').split('\n');
  const entries = [];
  for (const line of lines) {
    // Saltar encabezados y separadores de tabla markdown
    if (!line.startsWith('|') || line.startsWith('|---') || line.includes('Dev | Puntaje')) continue;
    const cols = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length < 5) continue;
    const [dev, scoreStr, actividad, referencia, fecha] = cols;
    const score = parseInt(scoreStr, 10);
    if (!dev || isNaN(score) || score <= 0) continue;
    entries.push({ dev: normalizeDev(dev), score, actividad, referencia, fecha });
  }
  console.log(`📋 MANAGEMENT_LOG.md: ${entries.length} entradas de gestión leídas`);
  return entries;
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  // 1. Issues cerrados
  const issues = await fetchIssues();
  console.log(`🔍 Issues cerrados encontrados: ${issues.length}`);

  const scores = {};
  const details = [];

  for (const issue of issues) {
    if (issue.pull_request) continue;
    const score = extractScore(issue.body || '');
    if (score > 0 && issue.assignees?.length > 0) {
      for (const user of issue.assignees) {
        const dev = normalizeDev(user.login);
        scores[dev] = (scores[dev] || 0) + score;
        details.push({
          dev,
          score,
          tipo: 'Issue',
          title: issue.title,
          closed_at: issue.closed_at ? issue.closed_at.split('T')[0] : '',
        });
      }
    }
  }

  // 2. Actividades de gestión desde MANAGEMENT_LOG.md
  const mgmtEntries = readManagementLog();
  for (const entry of mgmtEntries) {
    scores[entry.dev] = (scores[entry.dev] || 0) + entry.score;
    details.push({
      dev: entry.dev,
      score: entry.score,
      tipo: 'Gestión',
      title: `${entry.actividad} — ${entry.referencia}`,
      closed_at: entry.fecha,
    });
  }

  // Ordenar detalle: más reciente primero, luego por dev
  details.sort((a, b) => (b.closed_at || '').localeCompare(a.closed_at || '') || a.dev.localeCompare(b.dev));

  // 3. Tabla resumen (ordenada por puntaje desc)
  const sortedDevs = Object.entries(scores).sort(([, a], [, b]) => b - a);
  let table = '| Dev | Puntaje acumulado |\n|-----|-------------------|\n';
  for (const [dev, score] of sortedDevs) {
    table += `| ${dev} | ${score} |\n`;
  }

  // 4. Detalle unificado
  let detailTable = '\n\n## Detalle por actividad\n';
  detailTable += '| Dev | Puntaje | Tipo | Título / Actividad | Fecha |\n';
  detailTable += '|-----|---------|------|--------------------|-------|\n';
  for (const d of details) {
    detailTable += `| ${d.dev} | ${d.score} | ${d.tipo} | ${d.title.replace(/\|/g, ' ')} | ${d.closed_at} |\n`;
  }

  const scoresPath = path.resolve(__dirname, '../SCORES.md');
  fs.writeFileSync(scoresPath, table + detailTable);
  console.log(`✅ SCORES.md actualizado (${details.length} entradas, ${sortedDevs.length} devs)`);
})();

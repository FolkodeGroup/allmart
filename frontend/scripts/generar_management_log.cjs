// Script retroactivo: genera MANAGEMENT_LOG.md con todo el historial de actividades
// de gestión desde el inicio del repositorio.
//
// Actividades que captura:
//   - PRs abiertos por dgimenezdeveloper/folkodegroup
//   - PRs mergeados por dgimenezdeveloper/folkodegroup
//   - Reviews de PRs (aprobaciones, cambios solicitados, comentarios)
//   - Milestones creados por dgimenezdeveloper/folkodegroup
//   - Milestones cerrados (si el creador es dgimenezdeveloper/folkodegroup)
//   - Issues creados por dgimenezdeveloper/folkodegroup
//   - Issues etiquetados por dgimenezdeveloper/folkodegroup
//   - Issues asignados por dgimenezdeveloper/folkodegroup
//
// Uso:
//   cd frontend
//   node scripts/generar_management_log.cjs
//
// Requiere GITHUB_TOKEN en frontend/.env

const fs = require('fs');
const path = require('path');

let fetchFn;
try {
  fetchFn = require('node-fetch');
  if (fetchFn.default) fetchFn = fetchFn.default;
} catch {
  throw new Error('Instala node-fetch: npm install node-fetch@2');
}

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const OWNER = 'FolkodeGroup';
const REPO = 'allmart';
// Ambos alias se acreditan al mismo dev
const TRACKED_USERS = new Set(['dgimenezdeveloper', 'folkodegroup']);
const ALIAS_MAP = { folkodegroup: 'dgimenezdeveloper' };
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('❌  Define GITHUB_TOKEN en frontend/.env');
  process.exit(1);
}

const headers = {
  Authorization: `token ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
};

function normalizeDev(login) {
  if (!login) return null;
  const l = login.toLowerCase();
  return ALIAS_MAP[l] ?? login;
}

function isTracked(login) {
  return login && TRACKED_USERS.has(login.toLowerCase());
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiGet(url) {
  const res = await fetchFn(url, { headers });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub API ${res.status} — ${url}\n${txt}`);
  }
  return res.json();
}

async function fetchAllPages(endpoint, acc = []) {
  const sep = endpoint.includes('?') ? '&' : '?';
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/${endpoint}${sep}per_page=100`;
  await rateLimitPause();
  const data = await apiGet(url);
  if (!Array.isArray(data) || data.length === 0) return acc;
  // Si hay exactamente 100 resultados puede haber más páginas
  if (data.length === 100) {
    const sep2 = url.includes('?') ? '&' : '?';
    return fetchAllPagesRec(url + sep2 + 'page=2', acc.concat(data));
  }
  return acc.concat(data);
}

async function fetchAllPagesRec(baseUrl, acc = [], page = 2) {
  // Usamos un lookbehind para no confundir "per_page=100" con el param "page"
  const url = baseUrl.replace(/([?&])page=\d+/, `$1page=${page}`);
  await rateLimitPause();
  const data = await apiGet(url);
  if (!Array.isArray(data) || data.length === 0) return acc;
  const next = acc.concat(data);
  if (data.length === 100) return fetchAllPagesRec(url, next, page + 1);
  return next;
}

// Pequeña pausa para no saturar la API de GitHub
let lastCall = 0;
async function rateLimitPause() {
  const now = Date.now();
  const elapsed = now - lastCall;
  if (elapsed < 80) await new Promise(r => setTimeout(r, 80 - elapsed));
  lastCall = Date.now();
}

function toDate(isoStr) {
  return isoStr ? isoStr.split('T')[0] : '';
}

// ── Recolectores ──────────────────────────────────────────────────────────────

async function collectPRs(entries) {
  console.log('🔍  Cargando Pull Requests...');
  const prs = await fetchAllPages('pulls?state=all');
  console.log(`    ${prs.length} PRs encontrados`);

  for (const pr of prs) {
    // PR abierto
    if (isTracked(pr.user?.login)) {
      entries.push({
        dev: normalizeDev(pr.user.login),
        score: 5,
        actividad: 'Apertura de PR',
        referencia: `PR #${pr.number}: ${pr.title}`,
        fecha: toDate(pr.created_at),
      });
    }
    // PR mergeado
    if (pr.merged_at && isTracked(pr.merged_by?.login)) {
      entries.push({
        dev: normalizeDev(pr.merged_by.login),
        score: 15,
        actividad: 'Merge de PR',
        referencia: `PR #${pr.number}: ${pr.title}`,
        fecha: toDate(pr.merged_at),
      });
    }
  }

  // Reviews de cada PR
  console.log('🔍  Cargando reviews de PRs...');
  for (const pr of prs) {
    await rateLimitPause();
    let reviews;
    try {
      reviews = await apiGet(
        `https://api.github.com/repos/${OWNER}/${REPO}/pulls/${pr.number}/reviews`
      );
    } catch {
      continue;
    }
    if (!Array.isArray(reviews)) continue;

    for (const review of reviews) {
      if (!isTracked(review.user?.login)) continue;
      const state = review.state?.toLowerCase();
      let score = 0;
      let actividad = '';
      if (state === 'approved') { score = 15; actividad = 'Revisión de PR — Aprobación'; }
      else if (state === 'changes_requested') { score = 10; actividad = 'Revisión de PR — Solicitud de cambios'; }
      else if (state === 'commented') { score = 5; actividad = 'Revisión de PR — Comentario de revisión'; }
      if (score > 0) {
        entries.push({
          dev: normalizeDev(review.user.login),
          score,
          actividad,
          referencia: `PR #${pr.number}: ${pr.title}`,
          fecha: toDate(review.submitted_at),
        });
      }
    }
  }
}

async function collectMilestones(entries) {
  console.log('🔍  Cargando Milestones...');
  const milestones = await fetchAllPages('milestones?state=all');
  console.log(`    ${milestones.length} milestones encontrados`);

  for (const ms of milestones) {
    if (!isTracked(ms.creator?.login)) continue;

    // Creación
    entries.push({
      dev: normalizeDev(ms.creator.login),
      score: 5,
      actividad: 'Creación de milestone',
      referencia: `Milestone: ${ms.title}`,
      fecha: toDate(ms.created_at),
    });

    // Cierre
    if (ms.state === 'closed' && ms.closed_at) {
      entries.push({
        dev: normalizeDev(ms.creator.login),
        score: 15,
        actividad: 'Cierre de milestone',
        referencia: `Milestone: ${ms.title}`,
        fecha: toDate(ms.closed_at),
      });
    }
  }
}

async function collectIssueEvents(entries) {
  console.log('🔍  Cargando issues creados...');
  const issues = await fetchAllPages('issues?state=all&filter=all');
  console.log(`    ${issues.length} issues encontrados`);

  // Issues creados
  for (const issue of issues) {
    if (issue.pull_request) continue; // saltar PRs que aparecen en /issues
    if (!isTracked(issue.user?.login)) continue;
    entries.push({
      dev: normalizeDev(issue.user.login),
      score: 3,
      actividad: 'Creación de issue',
      referencia: `Issue #${issue.number}: ${issue.title}`,
      fecha: toDate(issue.created_at),
    });
  }

  // Eventos de etiquetado y asignación
  console.log('🔍  Cargando eventos de issues (etiquetas & asignaciones)...');
  const events = await fetchAllPages('issues/events');
  console.log(`    ${events.length} eventos de issues encontrados`);

  for (const event of events) {
    if (!isTracked(event.actor?.login)) continue;
    const dev = normalizeDev(event.actor.login);
    const issueRef = event.issue
      ? `Issue #${event.issue.number}: ${event.issue.title}`
      : `Issue evento #${event.id}`;
    const fecha = toDate(event.created_at);

    if (event.event === 'labeled') {
      entries.push({
        dev,
        score: 2,
        actividad: `Etiquetado de issue (${event.label?.name || ''})`,
        referencia: issueRef,
        fecha,
      });
    } else if (event.event === 'assigned') {
      entries.push({
        dev,
        score: 3,
        actividad: `Asignación de issue a ${event.assignee?.login || ''}`,
        referencia: issueRef,
        fecha,
      });
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  const entries = [];

  await collectPRs(entries);
  await collectMilestones(entries);
  await collectIssueEvents(entries);

  // Ordenar por fecha ascendente
  entries.sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));

  // Calcular totales por dev (para el resumen en consola)
  const totals = {};
  for (const e of entries) {
    totals[e.dev] = (totals[e.dev] || 0) + e.score;
  }

  // Construir contenido del log
  const cabecera = `# Log de actividades de gestión

Este archivo es generado y actualizado automáticamente por:
- **GitHub Actions** (\`puntajes_gestion.yml\`) — actividades nuevas en tiempo real.
- **Script retroactivo** (\`frontend/scripts/generar_management_log.cjs\`) — historial completo desde el inicio del repositorio.

> No editar manualmente. Cualquier cambio puede ser sobreescrito por los workflows automáticos.

## Actividades

| Dev | Puntaje | Actividad | Referencia | Fecha |
|-----|---------|-----------|------------|-------|
`;

  const filas = entries
    .map(e => `| ${e.dev} | ${e.score} | ${e.actividad} | ${(e.referencia || '').replace(/\|/g, ' ')} | ${e.fecha} |`)
    .join('\n');

  const logPath = path.resolve(__dirname, '../../MANAGEMENT_LOG.md');
  fs.writeFileSync(logPath, cabecera + filas + '\n');

  console.log('\n✅  MANAGEMENT_LOG.md generado');
  console.log(`   Total entradas: ${entries.length}`);
  console.log('\n📊  Puntajes de gestión por dev:');
  for (const [dev, pts] of Object.entries(totals).sort(([, a], [, b]) => b - a)) {
    console.log(`   ${dev}: ${pts} pts`);
  }
  console.log('\n👉  Ejecutá ahora: node scripts/sumar_puntajes.cjs');
  console.log('    para consolidar todo en SCORES.md\n');
})();

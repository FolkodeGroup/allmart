// Script de diagnóstico: genera un reporte de issues cerrados sin PUNTAJE tag
// Salida: JSON en stdout (para ser consumido por el workflow) + resumen en stderr
//
// Uso: node scripts/check_missing_puntajes.cjs
// Requiere GITHUB_TOKEN en env

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
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const MGMT_USERS = new Set(['dgimenezdeveloper', 'folkodegroup']);

if (!GITHUB_TOKEN) {
  console.error('❌  GITHUB_TOKEN no definido');
  process.exit(1);
}

const headers = {
  Authorization: `token ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
};

// Los mismos patrones que usa sumar_puntajes.cjs
function extractScore(body) {
  let match = body && body.match(/PUNTAJE\s*[:：]\s*(\d+)/i);
  if (match) return parseInt(match[1], 10);
  match = body && body.match(/\*\*PUNTAJE:\*\*\s*\n\s*(\d+)/i);
  if (match) return parseInt(match[1], 10);
  return 0;
}

(async () => {
  let allIssues = [];
  for (let page = 1; ; page++) {
    const res = await fetchFn(
      `https://api.github.com/repos/${OWNER}/${REPO}/issues?state=closed&per_page=100&page=${page}`,
      { headers }
    );
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    allIssues = allIssues.concat(data);
    if (data.length < 100) break;
  }

  // Filtra issues reales (no PRs), con assignees que NO son el gestor,
  // y que no tienen PUNTAJE en el body
  const missing = allIssues
    .filter(issue => {
      if (issue.pull_request) return false;
      const assignees = (issue.assignees || []).map(a => a.login.toLowerCase());
      if (assignees.length === 0) return false;
      // Excluir issues solo asignados al gestor (sus puntos vienen del management log)
      const hasNonMgmt = assignees.some(a => !MGMT_USERS.has(a));
      if (!hasNonMgmt) return false;
      return extractScore(issue.body || '') === 0;
    })
    .map(issue => ({
      number: issue.number,
      title: issue.title,
      assignees: (issue.assignees || []).map(a => a.login),
      closed_at: (issue.closed_at || '').split('T')[0],
      url: issue.html_url,
    }));

  // Escribir el resultado en GITHUB_OUTPUT si está disponible (paso de Actions)
  const outputFile = process.env.GITHUB_OUTPUT;
  const hasMissing = missing.length > 0;
  
  if (outputFile) {
    fs.appendFileSync(outputFile, `has_missing=${hasMissing}\n`);
    fs.appendFileSync(outputFile, `missing_count=${missing.length}\n`);
  }

  // Output legible para el PR body (Markdown)
  if (hasMissing) {
    console.error(`\n⚠️  ATENCIÓN: ${missing.length} issue(s) cerrado(s) sin PUNTAJE asignado:\n`);
    let mdTable =
      '## ⚠️ Issues cerrados sin puntaje asignado\n\n' +
      'Los siguientes issues fueron cerrados pero **no tienen `PUNTAJE:` en su descripción**.\n' +
      'Sus puntos NO fueron contabilizados. Por favor, editá el body de cada issue y agregá:\n' +
      '```\nPUNTAJE: <valor>\n```\nLuego volvé a correr el workflow o ejecutá `node frontend/scripts/sumar_puntajes.cjs`.\n\n' +
      '| # | Asignado a | Título | Fecha cierre |\n' +
      '|---|------------|--------|--------------|\n';

    for (const issue of missing) {
      const assignees = issue.assignees.join(', ');
      console.error(`  #${issue.number} [${assignees}] ${issue.title} (${issue.closed_at})`);
      mdTable += `| [#${issue.number}](${issue.url}) | ${assignees} | ${issue.title} | ${issue.closed_at} |\n`;
    }

    // Guardar el reporte en un archivo temporal para que el workflow lo incluya en el PR
    const reportPath = path.resolve(__dirname, '../../.missing_puntajes_report.md');
    fs.writeFileSync(reportPath, mdTable);
    console.error(`\n📄  Reporte guardado en .missing_puntajes_report.md`);
  } else {
    console.error('\n✅  Todos los issues cerrados tienen PUNTAJE asignado.');
    const reportPath = path.resolve(__dirname, '../../.missing_puntajes_report.md');
    fs.writeFileSync(reportPath, '## ✅ Todos los issues cerrados tienen puntaje asignado.\n');
  }

  process.exit(0);
})();

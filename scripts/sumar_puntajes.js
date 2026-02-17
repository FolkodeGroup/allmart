// Script para sumar puntajes de issues cerrados y actualizar SCORES.md
// Requiere: Node.js y un token de GitHub con permisos de repo (GITHUB_TOKEN)

const fs = require('fs');
const fetch = require('node-fetch');

const OWNER = 'FolkodeGroup'; // Cambia por tu organización/usuario
const REPO = 'allmart'; // Cambia por tu repo
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('Debes definir la variable de entorno GITHUB_TOKEN');
  process.exit(1);
}

const headers = {
  'Authorization': `token ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
};

async function fetchIssues(page = 1, issues = []) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/issues?state=closed&per_page=100&page=${page}`;
  const res = await fetch(url, { headers });
  const data = await res.json();
  if (data.length === 0) return issues;
  return fetchIssues(page + 1, issues.concat(data));
}

function extractScore(body) {
  const match = body && body.match(/PUNTAJE\s*[:：]\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}

(async () => {
  const issues = await fetchIssues();
  const scores = {};
  const details = [];
  for (const issue of issues) {
    if (issue.pull_request) continue; // Saltar PRs
    const score = extractScore(issue.body || '');
    if (score > 0 && issue.assignees && issue.assignees.length > 0) {
      for (const user of issue.assignees) {
        scores[user.login] = (scores[user.login] || 0) + score;
        details.push({
          dev: user.login,
          score,
          title: issue.title,
          closed_at: issue.closed_at ? issue.closed_at.split('T')[0] : ''
        });
      }
    }
  }
  // Crear tabla resumen
  let table = '| Dev | Puntaje acumulado |\n|-----|-------------------|\n';
  for (const [dev, score] of Object.entries(scores)) {
    table += `| ${dev} | ${score} |\n`;
  }
  // Detalle por issue
  let detailTable = '\n\n## Detalle por issue\n';
  detailTable += '| Dev | Puntaje | Título del Issue | Fecha de cierre |\n';
  detailTable += '|-----|---------|------------------|-----------------|\n';
  for (const d of details) {
    detailTable += `| ${d.dev} | ${d.score} | ${d.title.replace(/\|/g, ' ')} | ${d.closed_at} |\n`;
  }
  fs.writeFileSync('SCORES.md', table + detailTable);
  console.log('SCORES.md actualizado');
})();

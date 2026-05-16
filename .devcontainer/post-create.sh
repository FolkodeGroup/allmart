#!/usr/bin/env bash
set -euo pipefail

# Ruta del repo detectada a partir de este script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

install_dir() {
  local dir="$1"
  if [[ ! -f "$dir/package.json" ]]; then
    echo "[devcontainer] Omitiendo $dir (no hay package.json)"
    return
  fi

  echo "[devcontainer] Instalando dependencias en $dir"
  pushd "$dir" >/dev/null

  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi

  popd >/dev/null
}

# Instala dependencias del monorepo (raiz + backend + frontend)
install_dir "$REPO_ROOT"
install_dir "$REPO_ROOT/backend"
install_dir "$REPO_ROOT/frontend"

echo "[devcontainer] Dependencias listas en raiz, backend y frontend"

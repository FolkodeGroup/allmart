#!/bin/bash
# Script para iniciar el frontend
echo "Iniciando frontend..."
cd "$(dirname "$0")/frontend" || exit 1
npm run dev

#!/bin/bash
# Script para iniciar el backend
echo "Iniciando backend..."
cd "$(dirname "$0")/backend" || exit 1
npm run dev

#!/usr/bin/env bash
# Gera o ZIP da extensão do SEI para enviar à Chrome Web Store: dist-extensao/fluxos-sei-<versão>.zip
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build:sei -w addin
versao=$(node -p "require('./extensao-sei/manifest.json').version")
mkdir -p dist-extensao
saida="dist-extensao/fluxos-sei-$versao.zip"
rm -f "$saida"
python tools/zipar_extensao.py "$saida"
echo "Gerado: $saida"

"""ZIP de verdade (deflate), com manifest.json na raiz e caminhos com barra normal."""
import sys
import zipfile
from pathlib import Path

raiz = Path(__file__).resolve().parent.parent / "extensao-sei"
itens = ["manifest.json", "ponte.js", "fluxo-sei.js", "icons", "editor"]

with zipfile.ZipFile(sys.argv[1], "w", zipfile.ZIP_DEFLATED) as z:
    for nome in itens:
        caminho = raiz / nome
        arquivos = [caminho] if caminho.is_file() else sorted(p for p in caminho.rglob("*") if p.is_file())
        for a in arquivos:
            z.write(a, a.relative_to(raiz).as_posix())

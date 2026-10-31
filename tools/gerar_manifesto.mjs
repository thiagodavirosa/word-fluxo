// Gera o manifesto para um endereço de publicação: node tools/gerar_manifesto.mjs https://usuario.github.io/repo saida.xml
import fs from "node:fs";

const [base, saida = "addin/dist/manifest.xml"] = process.argv.slice(2);
if (!base) {
  console.error("Uso: node tools/gerar_manifesto.mjs <https://endereco-de-publicacao> [saida.xml]");
  process.exit(1);
}
const url = base.replace(/\/+$/, "");
const xml = fs.readFileSync("addin/manifest.xml", "utf8").replaceAll("https://localhost:3100", url);
fs.writeFileSync(saida, xml);
console.log(`Manifesto gravado em ${saida} apontando para ${url}`);

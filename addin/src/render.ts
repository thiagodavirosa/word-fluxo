import type { Fonte } from "./fonte";

const escapar = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Renderizador provisório (caixas e setas, tema Técnico). O motor completo vem na Fase 2. */
export function renderSvg(fonte: Fonte): string {
  const { largura, altura } = fonte.tela;
  const porId = new Map(fonte.elementos.map((e) => [e.id, e]));

  const setas = fonte.conectores
    .map((c) => {
      const a = porId.get(c.de);
      const b = porId.get(c.para);
      if (!a || !b) return "";
      const y = a.y + a.h / 2;
      return `<path d="M${a.x + a.w} ${y}H${b.x}" marker-end="url(#seta)"/>`;
    })
    .join("");

  const caixas = fonte.elementos
    .map(
      (e) =>
        `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"/>` +
        `<text x="${e.x + e.w / 2}" y="${e.y + e.h / 2 + 4}" text-anchor="middle" font-weight="600" fill="#1d2a33">${escapar(e.texto)}</text>`,
    )
    .join("");

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" font-size="13" viewBox="0 0 ${largura} ${altura}" width="${largura}" height="${altura}">` +
    `<defs><marker id="seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#8a949c"/></marker></defs>` +
    `<rect width="${largura}" height="${altura}" fill="#ffffff"/>` +
    `<text x="24" y="34" font-size="15" font-weight="600" fill="#1d2a33">${escapar(fonte.titulo)}</text>` +
    `<g fill="none" stroke="#8a949c" stroke-width="1.25">${setas}</g>${caixas}</svg>`
  );
}

/** SVG -> PNG em base64 (sem prefixo data:), com resolução escala× a de exibição. */
export async function svgParaPng(svg: string, largura: number, altura: number, escala = 2): Promise<string> {
  const img = new Image();
  const carregada = new Promise<void>((ok, erro) => {
    img.onload = () => ok();
    img.onerror = () => erro(new Error("Falha ao rasterizar o SVG"));
  });
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  await carregada;

  const canvas = document.createElement("canvas");
  canvas.width = largura * escala;
  canvas.height = altura * escala;
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png").split(",")[1];
}

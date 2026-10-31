import type { Diagrama, Elemento } from "./esquema";
import { pontosDoConector, type Ponto } from "./rotas";
import { temas, tecnico, type Tema } from "./tema";

const num = (n: number) => String(+n.toFixed(2));
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const linhasDe = (s?: string) => (s ? s.split("\n") : []);

interface Linha {
  t: string;
  tam: number;
  negrito: boolean;
  cor: string;
}

interface Pintura {
  fill: string;
  fillOp?: number;
  stroke: string;
  strokeW: number;
  strokeOp?: number;
  dash?: string;
  texto: string;
  sub: string;
}

type Alinh = "inicio" | "meio" | "fim";
const ancora = (a: Alinh = "meio") => ({ inicio: "start", meio: "middle", fim: "end" })[a];

const corDoFundo = (fundo: string | undefined, t: Tema, padrao: "none" | "grupo" = "none") =>
  ({ nenhum: "none", branco: t.fundo, grupo: t.fundoGrupo })[fundo ?? padrao] ?? "none";

function pintura(e: { estilo?: string; cor?: string; fundo?: string }, t: Tema): Pintura {
  const fundo = corDoFundo(e.fundo, t);
  switch (e.estilo) {
    case "destaque": {
      const cor = e.cor ?? t.destaque;
      return { fill: cor, fillOp: 0.12, stroke: cor, strokeW: t.espDestaque, texto: t.texto, sub: t.texto };
    }
    case "secundario":
      return { fill: fundo, stroke: t.linha, strokeW: t.espLinha, dash: t.tracejado, texto: t.textoSec, sub: t.textoSec };
    case "atenuado":
      return { fill: fundo, stroke: t.linha, strokeW: t.espLinha, strokeOp: 0.5, texto: t.textoSec, sub: t.textoSec };
    default:
      return { fill: fundo, stroke: e.cor ?? t.linha, strokeW: t.espLinha, texto: t.texto, sub: t.textoSec };
  }
}

function attrsPintura(p: Pintura): string {
  return (
    `fill="${p.fill}"` +
    (p.fillOp !== undefined ? ` fill-opacity="${p.fillOp}"` : "") +
    ` stroke="${p.stroke}" stroke-width="${num(p.strokeW)}"` +
    (p.strokeOp !== undefined ? ` stroke-opacity="${p.strokeOp}"` : "") +
    (p.dash ? ` stroke-dasharray="${p.dash}"` : "")
  );
}

function textoSvg(x: number, y: number, s: string, tam: number, cor: string, negrito: boolean, a: Alinh): string {
  return (
    `<text x="${num(x)}" y="${num(y)}"` +
    (a !== "inicio" ? ` text-anchor="${ancora(a)}"` : "") +
    ` font-size="${num(tam)}"` +
    (negrito ? ` font-weight="600"` : "") +
    ` fill="${cor}">${esc(s)}</text>`
  );
}

/** Bloco de linhas centrado verticalmente em `cy` (a linha de base fica ~4 px abaixo do centro da linha). */
function blocoCentrado(linhas: Linha[], cx: number, cy: number, passo: number, a: Alinh = "meio"): string {
  const y0 = cy - ((linhas.length - 1) * passo) / 2 + 4;
  return linhas.map((l, i) => textoSvg(cx, y0 + i * passo, l.t, l.tam, l.cor, l.negrito, a)).join("");
}

function rotulos(
  e: { texto: string; subtitulo?: string; negrito?: boolean; tamanho?: number; espacamento?: number },
  p: Pintura,
  t: Tema,
  base: number,
): { linhas: Linha[]; passo: number } {
  const tam = e.tamanho ?? base;
  const titulo = linhasDe(e.texto).map((s) => ({ t: s, tam, negrito: !!(e.negrito ?? e.subtitulo), cor: p.texto }));
  const sub = linhasDe(e.subtitulo).map((s) => ({ t: s, tam: t.tamSub, negrito: false, cor: p.sub }));
  return { linhas: [...titulo, ...sub], passo: e.espacamento ?? (e.subtitulo ? 17 : 15) };
}

function renderElemento(e: Elemento, d: Diagrama, t: Tema): string {
  const base = d.tela.fonteBase ?? t.tamRotulo;
  switch (e.forma) {
    case "caixa":
    case "nota": {
      const p = pintura(e.forma === "nota" ? { ...e, estilo: e.estilo ?? "secundario" } : e, t);
      const { linhas, passo } = rotulos(e, p, t, base);
      return (
        `<rect x="${num(e.x)}" y="${num(e.y)}" width="${num(e.w)}" height="${num(e.h)}" rx="${"raio" in e && e.raio !== undefined ? e.raio : t.raio}" ${attrsPintura(p)}/>` +
        blocoCentrado(linhas, e.x + e.w / 2, e.y + e.h / 2, passo)
      );
    }
    case "decisao": {
      const p = pintura(e, t);
      const { linhas, passo } = rotulos(e, p, t, base);
      const pts = [
        [e.x, e.y + e.h / 2],
        [e.x + e.w / 2, e.y],
        [e.x + e.w, e.y + e.h / 2],
        [e.x + e.w / 2, e.y + e.h],
      ];
      return (
        `<polygon points="${pts.map(([x, y]) => `${num(x)},${num(y)}`).join(" ")}" ${attrsPintura(p)}/>` +
        blocoCentrado(linhas, e.x + e.w / 2, e.y + e.h / 2, passo)
      );
    }
    case "marcador": {
      const cor = e.cor ?? t.destaque;
      const linhas = linhasDe(e.texto).map((s) => ({ t: s, tam: 10, negrito: true, cor: t.textoInverso }));
      return `<circle cx="${num(e.x)}" cy="${num(e.y)}" r="${e.raio ?? 11}" fill="${cor}"/>` + blocoCentrado(linhas, e.x, e.y, 15);
    }
    case "grupo": {
      const a = e.alinhamento ?? "inicio";
      const x = a === "fim" ? e.x + e.w - 16 : e.x + 16;
      return (
        `<rect x="${num(e.x)}" y="${num(e.y)}" width="${num(e.w)}" height="${num(e.h)}" rx="${t.raio}" fill="${corDoFundo(e.fundo, t, "grupo")}" stroke="${e.cor ?? t.linha}" stroke-width="${t.espLinha}"/>` +
        linhasDe(e.texto).map((s, i) => textoSvg(x, e.y + 24 + i * 15, s, base, t.texto, true, a)).join("")
      );
    }
    case "raia": {
      const esp = e.espessura ?? 1;
      const linhas = linhasDe(e.texto).map((s) => ({ t: s, tam: 12, negrito: true, cor: t.texto }));
      return (
        `<rect x="${num(e.x)}" y="${num(e.y)}" width="${num(e.w)}" height="${num(e.h)}" fill="${t.fundoGrupo}" stroke="${e.cor ?? t.linha}" stroke-width="${num(esp)}"/>` +
        blocoCentrado(linhas, e.x + 12, e.y + e.h / 2, 15, "inicio")
      );
    }
    case "barra": {
      const cor = e.estilo === "destaque" ? (e.cor ?? t.destaque) : (e.cor ?? t.linha);
      const op = e.estilo === "destaque" ? 0.85 : 0.55;
      return `<rect x="${num(e.x)}" y="${num(e.y)}" width="${num(e.w)}" height="${num(e.h)}" rx="3" fill="${cor}" fill-opacity="${op}"/>`;
    }
    case "retangulo":
      return (
        `<rect x="${num(e.x)}" y="${num(e.y)}" width="${num(e.w)}" height="${num(e.h)}" fill="${e.preenchimento ?? t.fundoGrupo}"` +
        (e.borda ? ` stroke="${e.cor ?? t.linha}" stroke-width="${t.espLinha}"` : "") +
        `/>`
      );
    case "texto": {
      const cor = e.estilo === "secundario" ? t.textoSec : (e.cor ?? t.texto);
      return linhasDe(e.texto)
        .map((s, i) => textoSvg(e.x, e.y + i * (e.espacamento ?? 15), s, e.tamanho ?? base, cor, !!e.negrito, e.alinhamento ?? "inicio"))
        .join("");
    }
    case "linha":
      return (
        `<path d="${caminho([[e.x1, e.y1], [e.x2, e.y2]])}" stroke="${e.cor ?? t.linha}" stroke-width="${num(e.espessura ?? t.espLinha)}"` +
        (e.opacidade !== undefined ? ` stroke-opacity="${e.opacidade}"` : "") +
        ` fill="none"/>`
      );
  }
}

/** Polilinha com H/V quando o trecho é ortogonal, como nos SVGs de referência. */
export function caminho(pts: Ponto[]): string {
  return pts
    .map(([x, y], i) => {
      if (i === 0) return `M${num(x)} ${num(y)}`;
      const [px, py] = pts[i - 1];
      if (y === py) return `H${num(x)}`;
      if (x === px) return `V${num(y)}`;
      return `L${num(x)} ${num(y)}`;
    })
    .join("");
}

function renderConector(d: Diagrama, c: Diagrama["conectores"][number], t: Tema): string {
  const pts = pontosDoConector(d, c);
  if (pts.length < 2) return "";
  const base = d.tela.fonteBase ?? t.tamRotulo;
  const marcadores =
    (c.seta === "inicio" || c.seta === "ambas" ? ` marker-start="url(#seta)"` : "") +
    (c.seta === "fim" || c.seta === "ambas" ? ` marker-end="url(#seta)"` : "");
  const tracejado = c.estilo === "tracejado" ? ` stroke-dasharray="${t.tracejado}"` : "";
  let svg = `<path d="${caminho(pts)}" fill="none" stroke="${t.linha}" stroke-width="${t.espLinha}"${tracejado}${marcadores}/>`;

  if (c.rotulo) {
    const r = c.rotulo;
    const meio = pts[Math.floor((pts.length - 1) / 2)];
    const prox = pts[Math.floor((pts.length - 1) / 2) + 1];
    const x = r.x ?? (meio[0] + prox[0]) / 2;
    const y = r.y ?? (meio[1] + prox[1]) / 2 - 6;
    svg += linhasDe(r.texto)
      .map((s, i) => textoSvg(x, y + i * (r.espacamento ?? 14), s, r.tamanho ?? (base === t.tamRotulo ? t.tamSub : base), t.textoSec, false, r.alinhamento ?? "meio"))
      .join("");
  }
  return svg;
}

/** JSON do diagrama -> SVG autônomo. Os elementos saem na ordem do array (grupos antes dos filhos). */
export function renderSvg(d: Diagrama, tema?: Tema): string {
  const t = tema ?? temas[d.tema ?? ""] ?? tecnico;
  const { largura, altura } = d.tela;
  const base = d.tela.fonteBase ?? t.tamRotulo;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" font-family="${t.fonte}" viewBox="0 0 ${largura} ${altura}" width="${largura}" height="${altura}" font-size="${base}">` +
    `<defs><marker id="seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${t.linha}"/></marker></defs>` +
    `<rect width="${largura}" height="${altura}" fill="${t.fundo}" data-fundo="1"/>` +
    textoSvg(24, 34, d.titulo, t.tamTitulo, t.texto, true, "inicio") +
    d.elementos.map((e) => renderElemento(e, d, t)).join("") +
    d.conectores.map((c) => renderConector(d, c, t)).join("") +
    `</svg>`
  );
}

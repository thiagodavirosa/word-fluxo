import type { Diagrama, Elemento, LinhaTexto } from "./esquema";
import { controlesDaCurva, pontosDoConector, type Ponto } from "./rotas";
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
  /** Distância da linha anterior; sem valor usa o passo do bloco. */
  dy?: number;
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

type Ajustes = { contorno?: string; preenchimento?: string; corTexto?: string; espessura?: number; traco?: string };

const TRACOS: Record<string, string | undefined> = { continuo: undefined, pontilhado: "2 3" };

function pintura(e: { estilo?: string; cor?: string; fundo?: string } & Ajustes, t: Tema): Pintura {
  const p = pinturaBase(e, t);
  if (e.preenchimento) {
    p.fill = e.preenchimento;
    p.fillOp = undefined;
  }
  if (e.contorno) p.stroke = e.contorno;
  if (e.espessura) p.strokeW = e.espessura;
  if (e.traco) p.dash = e.traco === "tracejado" ? t.tracejado : TRACOS[e.traco];
  if (e.corTexto) {
    p.texto = e.corTexto;
    p.sub = e.corTexto;
  }
  return p;
}

function pinturaBase(e: { estilo?: string; cor?: string; fundo?: string }, t: Tema): Pintura {
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
  const gaps = linhas.map((l, i) => (i === 0 ? 0 : (l.dy ?? passo)));
  const total = gaps.reduce((x, y) => x + y, 0);
  let y = cy - total / 2 + 4;
  return linhas.map((l, i) => textoSvg(cx, (y += gaps[i]), l.t, l.tam, l.cor, l.negrito, a)).join("");
}

/** Ponto de ancoragem do texto de uma caixa conforme o alinhamento (margem de 16 px, como nos grupos). */
function posTexto(e: { x: number; y: number; w: number; h: number; alinhamento?: Alinh; ajusteY?: number }): [number, number] {
  const x = e.alinhamento === "inicio" ? e.x + 16 : e.alinhamento === "fim" ? e.x + e.w - 16 : e.x + e.w / 2;
  return [x, e.y + e.h / 2 + (e.ajusteY ?? 0)];
}

function rotulos(
  e: { texto: string; subtitulo?: string; negrito?: boolean; tamanho?: number; espacamento?: number; espacamentoSub?: number; linhas?: LinhaTexto[] },
  p: Pintura,
  t: Tema,
  base: number,
): { linhas: Linha[]; passo: number } {
  if (e.linhas?.length) {
    const ls = e.linhas.map((l, i) => ({
      t: l.texto,
      tam: l.tamanho ?? (l.secundario ? t.tamSub : base),
      negrito: !!l.negrito,
      cor: l.cor ?? (l.secundario ? p.sub : p.texto),
      dy: i > 0 ? (l.dy ?? 15) : undefined,
    }));
    return { linhas: ls, passo: 15 };
  }
  const tam = e.tamanho ?? base;
  const titulo = linhasDe(e.texto).map((s) => ({ t: s, tam, negrito: !!(e.negrito ?? e.subtitulo), cor: p.texto }));
  const sub = linhasDe(e.subtitulo).map((s, i) => ({ t: s, tam: t.tamSub, negrito: false, cor: p.sub, dy: i > 0 ? e.espacamentoSub : undefined }));
  return { linhas: [...titulo, ...sub], passo: e.espacamento ?? (e.subtitulo ? 17 : 15) };
}

function tracoAttr(traco: string | undefined, t: Tema): string {
  const v = traco === "tracejado" ? t.tracejado : traco ? TRACOS[traco] : undefined;
  return v ? ` stroke-dasharray="${v}"` : "";
}

/** Aplica fonte e itálico próprios do elemento, se houver, sem alterar o desenho padrão. */
function renderElemento(e: Elemento, d: Diagrama, t: Tema): string {
  const svg = renderElementoBase(e, d, t);
  const fam = e.fonte ? ` font-family="${esc(e.fonte)}"` : "";
  const it = e.italico ? ` font-style="italic"` : "";
  return fam || it ? `<g${fam}${it}>${svg}</g>` : svg;
}

function renderElementoBase(e: Elemento, d: Diagrama, t: Tema): string {
  const base = d.tela.fonteBase ?? t.tamRotulo;
  switch (e.forma) {
    case "caixa":
    case "nota": {
      const p = pintura(e.forma === "nota" ? { ...e, estilo: e.estilo ?? "secundario" } : e, t);
      const { linhas, passo } = rotulos(e, p, t, base);
      return (
        `<rect x="${num(e.x)}" y="${num(e.y)}" width="${num(e.w)}" height="${num(e.h)}" rx="${"raio" in e && e.raio !== undefined ? e.raio : t.raio}" ${attrsPintura(p)}/>` +
        blocoCentrado(linhas, ...posTexto(e), passo, "alinhamento" in e && e.alinhamento ? e.alinhamento : "meio")
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
        blocoCentrado(linhas, e.x + e.w / 2, e.y + e.h / 2 + (e.ajusteY ?? 0), passo)
      );
    }
    case "marcador": {
      const cor = e.cor ?? t.destaque;
      const linhas = linhasDe(e.texto).map((s) => ({ t: s, tam: 10, negrito: true, cor: e.corTexto ?? t.textoInverso }));
      return `<circle cx="${num(e.x)}" cy="${num(e.y)}" r="${e.raio ?? 11}" fill="${e.preenchimento ?? cor}"${e.contorno ? ` stroke="${e.contorno}" stroke-width="${num(e.espessura ?? 1.5)}"` : ""}/>` + blocoCentrado(linhas, e.x, e.y, 15);
    }
    case "grupo": {
      const a = e.alinhamento ?? "inicio";
      const x = a === "fim" ? e.x + e.w - 16 : e.x + 16;
      return (
        `<rect x="${num(e.x)}" y="${num(e.y)}" width="${num(e.w)}" height="${num(e.h)}" rx="${t.raio}" fill="${e.preenchimento ?? corDoFundo(e.fundo, t, "grupo")}" stroke="${e.contorno ?? e.cor ?? t.linha}" stroke-width="${num(e.espessura ?? t.espLinha)}"${tracoAttr(e.traco, t)}/>` +
        linhasDe(e.texto).map((s, i) => textoSvg(x, e.y + 24 + i * 15, s, base, e.corTexto ?? t.texto, true, a)).join("")
      );
    }
    case "raia": {
      const esp = e.espessura ?? 1;
      const linhas = linhasDe(e.texto).map((s) => ({ t: s, tam: 12, negrito: true, cor: e.corTexto ?? t.texto }));
      return (
        `<rect x="${num(e.x)}" y="${num(e.y)}" width="${num(e.w)}" height="${num(e.h)}" fill="${e.preenchimento ?? t.fundoGrupo}" stroke="${e.contorno ?? e.cor ?? t.linha}" stroke-width="${num(esp)}"${tracoAttr(e.traco, t)}/>` +
        blocoCentrado(linhas, e.x + 12, e.y + e.h / 2, 15, "inicio")
      );
    }
    case "barra": {
      const cor = e.preenchimento ?? (e.estilo === "destaque" ? (e.cor ?? t.destaque) : (e.cor ?? t.linha));
      const op = e.estilo === "destaque" ? 0.85 : 0.55;
      return `<rect x="${num(e.x)}" y="${num(e.y)}" width="${num(e.w)}" height="${num(e.h)}" rx="3" fill="${cor}" fill-opacity="${op}"/>`;
    }
    case "retangulo":
      return (
        `<rect x="${num(e.x)}" y="${num(e.y)}" width="${num(e.w)}" height="${num(e.h)}" fill="${e.preenchimento ?? t.fundoGrupo}"` +
        (e.borda || e.contorno ? ` stroke="${e.contorno ?? e.cor ?? t.linha}" stroke-width="${num(e.espessura ?? t.espLinha)}"${tracoAttr(e.traco, t)}` : "") +
        `/>`
      );
    case "texto": {
      const cor = e.corTexto ?? (e.estilo === "secundario" ? t.textoSec : (e.cor ?? t.texto));
      return linhasDe(e.texto)
        .map((s, i) => textoSvg(e.x, e.y + i * (e.espacamento ?? 15), s, e.tamanho ?? base, cor, !!e.negrito, e.alinhamento ?? "inicio"))
        .join("");
    }
    case "linha":
      return (
        `<path d="${caminho([[e.x1, e.y1], [e.x2, e.y2]])}" stroke="${e.contorno ?? e.cor ?? t.linha}" stroke-width="${num(e.espessura ?? t.espLinha)}"${tracoAttr(e.traco, t)}` +
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

/** Caminho SVG de um conector (polilinha ortogonal/reta ou curva). */
export function caminhoDoConector(d: Diagrama, c: Diagrama["conectores"][number]): string {
  const pts = pontosDoConector(d, c);
  const ctl = controlesDaCurva(d, c);
  if (!ctl || pts.length !== 2) return caminho(pts);
  return `M${num(pts[0][0])} ${num(pts[0][1])}C${num(ctl[0][0])} ${num(ctl[0][1])} ${num(ctl[1][0])} ${num(ctl[1][1])} ${num(pts[1][0])} ${num(pts[1][1])}`;
}

const idSeta = (cor?: string) => (cor ? `seta-${cor.slice(1).toLowerCase()}` : "seta");

function renderConector(d: Diagrama, c: Diagrama["conectores"][number], t: Tema): string {
  const pts = pontosDoConector(d, c);
  if (pts.length < 2) return "";
  const base = d.tela.fonteBase ?? t.tamRotulo;
  const marcadores =
    (c.seta === "inicio" || c.seta === "ambas" ? ` marker-start="url(#seta)"` : "") +
    (c.seta === "fim" || c.seta === "ambas" ? ` marker-end="url(#seta)"` : "");
  const traco = c.traco ?? (c.estilo === "tracejado" ? "tracejado" : "continuo");
  const marcadorDe = (s: string) => s.replaceAll('url(#seta)', `url(#${idSeta(c.cor)})`);
  let svg = `<path d="${caminhoDoConector(d, c)}" fill="none" stroke="${c.cor ?? t.linha}" stroke-width="${num(c.espessura ?? t.espLinha)}"${tracoAttr(traco, t)}${marcadorDe(marcadores)}/>`;

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

/** Ordem de desenho: elementos na ordem do array, com cada conector logo após o elemento indicado em `depois`. */
export function camadas(d: Diagrama): (Diagrama["elementos"][number] | Diagrama["conectores"][number])[] {
  const ids = new Set(d.elementos.map((e) => e.id));
  const apos = (id: string) => d.conectores.filter((c) => c.depois === id);
  return [
    ...d.conectores.filter((c) => c.depois === ""),
    ...d.elementos.flatMap((e) => [e, ...apos(e.id)]),
    ...d.conectores.filter((c) => c.depois !== "" && (c.depois === undefined || !ids.has(c.depois))),
  ];
}

/** JSON do diagrama -> SVG autônomo. Os elementos saem na ordem do array (grupos antes dos filhos). */
export function renderSvg(d: Diagrama, tema?: Tema): string {
  const t = tema ?? temas[d.tema ?? ""] ?? tecnico;
  const { largura, altura } = d.tela;
  const base = d.tela.fonteBase ?? t.tamRotulo;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" font-family="${t.fonte}" viewBox="0 0 ${largura} ${altura}" width="${largura}" height="${altura}" font-size="${base}">` +
    `<defs>${[undefined, ...new Set(d.conectores.map((c) => c.cor).filter(Boolean))]
      .map((cor) => `<marker id="${idSeta(cor)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${cor ?? t.linha}"/></marker>`)
      .join("")}</defs>` +
    `<rect width="${largura}" height="${altura}" fill="${t.fundo}" data-fundo="1"/>` +
    textoSvg(24, 34, d.titulo, t.tamTitulo, t.texto, true, "inicio") +
    camadas(d)
      .map((i) => ("forma" in i ? renderElemento(i, d, t) : renderConector(d, i, t)))
      .join("") +
    `</svg>`
  );
}

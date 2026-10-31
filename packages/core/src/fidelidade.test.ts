import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DOMParser } from "@xmldom/xmldom";
import { renderSvg, validar } from "./index";

/**
 * Fidelidade estrutural: extrai as primitivas desenhadas (retângulos, polígonos, caminhos e linhas de texto,
 * com atributos herdados resolvidos) do SVG de referência e do SVG renderizado e exige correspondência 1:1
 * dentro de uma tolerância de posição.
 */
interface Prim {
  tipo: "rect" | "poly" | "path" | "text" | "circle";
  geo: number[];
  attrs: Record<string, string>;
  rotulo: string;
}

const HERDADOS = ["fill", "stroke", "stroke-width", "font-size", "text-anchor", "font-weight"];
const padrao: Record<string, string> = { "text-anchor": "start", "font-weight": "normal" };

function herdar(el: Element, nome: string): string | undefined {
  for (let n: Node | null = el; n && n.nodeType === 1; n = n.parentNode) {
    const v = (n as Element).getAttribute(nome);
    if (v) return v;
  }
  return undefined;
}

const numeros = (s: string) => (s.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);

function caminhoParaPontos(d: string): number[] {
  const pts: number[] = [];
  let x = 0;
  let y = 0;
  for (const [, cmd, a, b] of d.matchAll(/([MHVL])\s*(-?[\d.]+)(?:[ ,]+(-?[\d.]+))?/g)) {
    if (cmd === "H") x = +a;
    else if (cmd === "V") y = +a;
    else [x, y] = [+a, +b];
    pts.push(x, y);
  }
  return pts;
}

function extrair(svg: string, ignorarFundo: boolean): Prim[] {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  const raiz = doc.documentElement as unknown as Element;
  const largura = numeros(raiz.getAttribute("viewBox")!)[2];
  const prims: Prim[] = [];

  const atributos = (el: Element, nomes: string[]) => {
    const r: Record<string, string> = {};
    for (const n of nomes) r[n] = (herdar(el, n) ?? padrao[n] ?? "").toLowerCase();
    return r;
  };

  const trechos: Trecho[] = [];
  const visitar = (el: Element) => {
    if (el.nodeName === "defs") return;
    const nome = el.nodeName;
    if (nome === "rect") {
      const g = ["x", "y", "width", "height"].map((a) => +(el.getAttribute(a) ?? 0));
      if (ignorarFundo && g[2] === largura && g[0] === 0 && g[1] === 0) return;
      const a = atributos(el, ["fill", "stroke", "stroke-width"]);
      a["fill-opacity"] = el.getAttribute("fill-opacity") ?? "1";
      a.stroke = a.stroke || "none";
      prims.push({ tipo: "rect", geo: g, attrs: a, rotulo: "rect " + g.join(",") });
    } else if (nome === "circle") {
      const g = ["cx", "cy", "r"].map((a) => +(el.getAttribute(a) ?? 0));
      prims.push({ tipo: "circle", geo: g, attrs: atributos(el, ["fill"]), rotulo: "circle " + g.join(",") });
    } else if (nome === "polygon") {
      prims.push({ tipo: "poly", geo: numeros(el.getAttribute("points")!), attrs: atributos(el, ["fill", "stroke", "stroke-width"]), rotulo: "polygon" });
    } else if (nome === "path" && el.parentNode && (el.parentNode as Element).nodeName !== "marker") {
      const a = atributos(el, ["stroke", "stroke-width"]);
      a["marker-start"] = el.getAttribute("marker-start") ? "sim" : "";
      a["marker-end"] = el.getAttribute("marker-end") ? "sim" : "";
      const geo = caminhoParaPontos(el.getAttribute("d")!);
      for (let i = 0; i + 3 < geo.length; i += 2) {
        trechos.push({ g: [geo[i], geo[i + 1], geo[i + 2], geo[i + 3]], a: { ...a, "marker-start": i === 0 ? a["marker-start"] : "", "marker-end": i + 4 >= geo.length ? a["marker-end"] : "" } });
      }
    } else if (nome === "text") {
      const a = atributos(el, ["fill", "font-size", "text-anchor", "font-weight"]);
      const x0 = +(el.getAttribute("x") ?? 0);
      const y0 = +(el.getAttribute("y") ?? 0);
      const spans = Array.from(el.childNodes).filter((n) => n.nodeName === "tspan") as unknown as Element[];
      if (spans.length === 0) {
        prims.push({ tipo: "text", geo: [x0, y0], attrs: { ...a, texto: el.textContent!.trim() }, rotulo: `"${el.textContent}"` });
      } else {
        let y = y0;
        for (const s of spans) {
          y = s.getAttribute("y") ? +s.getAttribute("y")! : y + +(s.getAttribute("dy") ?? 0);
          const x = +(s.getAttribute("x") ?? x0);
          prims.push({ tipo: "text", geo: [x, y], attrs: { ...a, texto: s.textContent!.trim() }, rotulo: `"${s.textContent}"` });
        }
      }
      return;
    }
    for (const filho of Array.from(el.childNodes)) if (filho.nodeType === 1) visitar(filho as Element);
  };
  visitar(raiz);
  return [...prims, ...unirTrechos(trechos)];
}

interface Trecho {
  g: number[];
  a: Record<string, string>;
}

/**
 * Conectores ortogonais que compartilham um tronco (barramento) são desenhados como vários caminhos
 * sobrepostos. Para comparar o que aparece, cada caminho vira trechos retos; trechos sem seta sobre a
 * mesma reta são fundidos e trechos idênticos são contados uma vez.
 */
function unirTrechos(ts: Trecho[]): Prim[] {
  const chave = (t: Trecho) => JSON.stringify(t.a);
  const saida: Trecho[] = [];
  for (const t of ts) {
    const [x1, y1, x2, y2] = t.g;
    const norm: Trecho = x1 > x2 || (x1 === x2 && y1 > y2) ? { g: [x2, y2, x1, y1], a: { ...t.a, "marker-start": t.a["marker-end"], "marker-end": t.a["marker-start"] } } : t;
    const marcado = norm.a["marker-start"] || norm.a["marker-end"];
    const vizinho = saida.find((o) => {
      if (chave(o) !== chave(norm) || (o.a["marker-start"] || o.a["marker-end"]) !== marcado) return false;
      const [a1, b1, a2, b2] = o.g;
      const [c1, d1, c2, d2] = norm.g;
      if (marcado) return a1 === c1 && b1 === d1 && a2 === c2 && b2 === d2;
      const horiz = b1 === b2 && d1 === d2 && b1 === d1;
      const vert = a1 === a2 && c1 === c2 && a1 === c1;
      return (horiz && c1 <= a2 && a1 <= c2) || (vert && d1 <= b2 && b1 <= d2);
    });
    if (!vizinho) saida.push({ g: [...norm.g], a: norm.a });
    else if (!marcado) {
      vizinho.g = [Math.min(vizinho.g[0], norm.g[0]), Math.min(vizinho.g[1], norm.g[1]), Math.max(vizinho.g[2], norm.g[2]), Math.max(vizinho.g[3], norm.g[3])];
    }
  }
  return saida.map((t) => ({ tipo: "path" as const, geo: t.g, attrs: t.a, rotulo: "trecho " + t.g.join(",") }));
}

function igual(a: Prim, b: Prim): boolean {
  if (a.tipo !== b.tipo || a.geo.length !== b.geo.length) return false;
  const tol = a.tipo === "text" ? [1, 2.5] : [0.6];
  if (a.geo.some((v, i) => Math.abs(v - b.geo[i]) > tol[i % tol.length])) return false;
  return Object.keys(a.attrs).every((k) => {
    const va = a.attrs[k];
    const vb = b.attrs[k];
    const na = Number(va);
    return !Number.isNaN(na) && va !== "" ? Math.abs(na - Number(vb)) < 0.01 : va === vb;
  });
}

function comparar(ref: Prim[], mine: Prim[]) {
  const livres = [...mine];
  const faltando: string[] = [];
  for (const r of ref) {
    const i = livres.findIndex((m) => igual(r, m));
    if (i < 0) faltando.push(`${r.rotulo} ${JSON.stringify(r.attrs)}`);
    else livres.splice(i, 1);
  }
  return { faltando, sobrando: livres.map((m) => `${m.rotulo} ${JSON.stringify(m.attrs)}`) };
}

const MODELOS = Array.from({ length: 17 }, (_, i) => String(i + 1).padStart(2, "0"));

describe("fidelidade aos exemplos do item 5", () => {
  for (const n of MODELOS) {
    it(`EX-${n} é reproduzido a partir do JSON`, () => {
      const json = JSON.parse(readFileSync(new URL(`../modelos/ex-${n}.json`, import.meta.url), "utf8"));
      const ref = readFileSync(new URL(`../../../docs/exemplos/EX-${n}.svg`, import.meta.url), "utf8");
      const resultado = comparar(extrair(ref, false), extrair(renderSvg(validar(json)), true));
      expect(resultado).toEqual({ faltando: [], sobrando: [] });
    });
  }
});

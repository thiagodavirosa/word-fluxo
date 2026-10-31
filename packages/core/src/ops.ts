import dagre from "@dagrejs/dagre";
import type { Conector, Diagrama, Elemento } from "./esquema";
import { limites, type Caixa, type Ponto } from "./rotas";

/** Operações puras sobre o diagrama, usadas pelo editor (cada uma devolve um novo diagrama). */

export type Forma = Elemento["forma"];

const FORMAS_COM_CAIXA: Forma[] = ["caixa", "decisao", "grupo", "raia", "nota", "barra", "retangulo"];
export const temCaixa = (e: Elemento): e is Extract<Elemento, { w: number; h: number }> => FORMAS_COM_CAIXA.includes(e.forma);

export function proximoId(d: Diagrama, prefixo: string): string {
  const usados = new Set([...d.elementos.map((e) => e.id), ...d.conectores.map((c) => c.id)]);
  let n = 1;
  while (usados.has(`${prefixo}${n}`)) n++;
  return `${prefixo}${n}`;
}

function deslocar(e: Elemento, dx: number, dy: number): Elemento {
  if (e.forma === "linha") return { ...e, x1: e.x1 + dx, y1: e.y1 + dy, x2: e.x2 + dx, y2: e.y2 + dy };
  return { ...e, x: e.x + dx, y: e.y + dy } as Elemento;
}

const dentro = (a: Caixa, b: Caixa) => a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;

/** Ids que se movem junto: os próprios, mais o conteúdo de grupos e raias movidos. */
export function comConteudo(d: Diagrama, ids: string[]): Set<string> {
  const mover = new Set(ids);
  for (const id of ids) {
    const e = d.elementos.find((x) => x.id === id);
    if (e && (e.forma === "grupo" || e.forma === "raia")) {
      const caixa = limites(e);
      for (const f of d.elementos) if (f.id !== id && dentro(limites(f), caixa)) mover.add(f.id);
      e.forma === "grupo" && e.filhos?.forEach((f) => mover.add(f));
    }
  }
  return mover;
}

/** Move elementos. Conectores com rota manual acompanham se os dois extremos se movem; se só um se move, voltam à rota automática. */
export function mover(d: Diagrama, ids: string[], dx: number, dy: number): Diagrama {
  const alvo = comConteudo(d, ids);
  const moveu = (id?: string) => (id ? alvo.has(id) : null);
  return {
    ...d,
    elementos: d.elementos.map((e) => (alvo.has(e.id) ? deslocar(e, dx, dy) : e)),
    conectores: d.conectores.map((c) => {
      if (!c.pontos) return c;
      const [a, b] = [moveu(c.de), moveu(c.para)];
      if (a === null && b === null) return c;
      if (a && b) return { ...c, pontos: c.pontos.map(([x, y]) => [x + dx, y + dy] as Ponto) };
      if ((a ?? b) && (c.de && c.para)) return { ...c, pontos: undefined };
      return c;
    }),
  };
}

/** Desloca somente os pontos de um conector com rota manual. */
export function moverConector(d: Diagrama, id: string, dx: number, dy: number): Diagrama {
  return {
    ...d,
    conectores: d.conectores.map((c) =>
      c.id === id && c.pontos ? { ...c, pontos: c.pontos.map(([x, y]) => [x + dx, y + dy] as Ponto) } : c,
    ),
  };
}

const TAMANHO_MINIMO = 16;

export function redimensionar(d: Diagrama, id: string, caixa: Caixa): Diagrama {
  const w = Math.max(TAMANHO_MINIMO, caixa.w);
  const h = Math.max(TAMANHO_MINIMO, caixa.h);
  return {
    ...d,
    elementos: d.elementos.map((e) => (e.id === id && temCaixa(e) ? { ...e, x: caixa.x, y: caixa.y, w, h } : e)),
    conectores: d.conectores.map((c) => (c.de === id || c.para === id ? { ...c, pontos: c.pontos && c.de && c.para ? undefined : c.pontos } : c)),
  };
}

export function atualizarElemento(d: Diagrama, id: string, mudancas: Partial<Elemento>): Diagrama {
  return { ...d, elementos: d.elementos.map((e) => (e.id === id ? ({ ...e, ...mudancas } as Elemento) : e)) };
}

export function atualizarConector(d: Diagrama, id: string, mudancas: Partial<Conector>): Diagrama {
  return { ...d, conectores: d.conectores.map((c) => (c.id === id ? { ...c, ...mudancas } : c)) };
}

const PADROES: Record<Forma, (id: string, x: number, y: number) => Elemento> = {
  caixa: (id, x, y) => ({ id, forma: "caixa", x, y, w: 150, h: 48, texto: "Nova etapa" }),
  decisao: (id, x, y) => ({ id, forma: "decisao", x, y, w: 110, h: 70, texto: "Decisão?" }),
  grupo: (id, x, y) => ({ id, forma: "grupo", x, y, w: 300, h: 160, texto: "Grupo" }),
  raia: (id, x, y) => ({ id, forma: "raia", x, y, w: 600, h: 90, texto: "Raia" }),
  marcador: (id, x, y) => ({ id, forma: "marcador", x, y, texto: "E1" }),
  nota: (id, x, y) => ({ id, forma: "nota", x, y, w: 150, h: 40, texto: "Nota" }),
  barra: (id, x, y) => ({ id, forma: "barra", x, y, w: 120, h: 16 }),
  retangulo: (id, x, y) => ({ id, forma: "retangulo", x, y, w: 120, h: 60 }),
  texto: (id, x, y) => ({ id, forma: "texto", x, y, texto: "Texto" }),
  linha: (id, x, y) => ({ id, forma: "linha", x1: x, y1: y, x2: x + 120, y2: y }),
};

export function adicionar(d: Diagrama, forma: Forma, x: number, y: number): { diagrama: Diagrama; id: string } {
  const id = proximoId(d, forma[0] + (forma === "retangulo" ? "t" : ""));
  return { diagrama: { ...d, elementos: [...d.elementos, PADROES[forma](id, x, y)] }, id };
}

export function remover(d: Diagrama, ids: string[], conectores: string[] = []): Diagrama {
  const alvo = new Set(ids);
  return {
    ...d,
    elementos: d.elementos.filter((e) => !alvo.has(e.id)),
    conectores: d.conectores.filter((c) => !conectores.includes(c.id) && !(c.de && alvo.has(c.de)) && !(c.para && alvo.has(c.para))),
  };
}

/** Duplica elementos (e os conectores entre eles) deslocados de 16 px. */
export function duplicar(d: Diagrama, ids: string[]): { diagrama: Diagrama; ids: string[] } {
  const novos = new Map<string, string>();
  let atual = d;
  for (const e of d.elementos.filter((x) => ids.includes(x.id))) {
    const id = proximoId(atual, e.forma[0] + "c");
    atual = { ...atual, elementos: [...atual.elementos, deslocar({ ...e, id }, 16, 16)] };
    novos.set(e.id, id);
  }
  for (const c of d.conectores) {
    if (!c.de || !c.para || !novos.has(c.de) || !novos.has(c.para)) continue;
    const id = proximoId(atual, "k");
    const pontos = c.pontos?.map(([x, y]) => [x + 16, y + 16] as Ponto);
    atual = { ...atual, conectores: [...atual.conectores, { ...c, id, de: novos.get(c.de), para: novos.get(c.para), pontos }] };
  }
  return { diagrama: atual, ids: [...novos.values()] };
}

export function conectar(d: Diagrama, de: string, para: string): { diagrama: Diagrama; id: string } {
  const id = proximoId(d, "k");
  return { diagrama: { ...d, conectores: [...d.conectores, { id, de, para, seta: "fim", estilo: "normal" }] }, id };
}

/** Inverte o sentido do conector (a seta passa a apontar para o outro elemento). */
export function inverterConector(d: Diagrama, id: string): Diagrama {
  return {
    ...d,
    conectores: d.conectores.map((c) =>
      c.id === id
        ? { ...c, de: c.para, para: c.de, ladoDe: c.ladoPara, ladoPara: c.ladoDe, pontos: c.pontos && [...c.pontos].reverse(), seta: c.seta === "fim" ? "inicio" : c.seta === "inicio" ? "fim" : c.seta }
        : c,
    ),
  };
}

/** Ordem de empilhamento: último do array fica por cima. */
export function reordenar(d: Diagrama, id: string, para: "frente" | "tras"): Diagrama {
  const e = d.elementos.find((x) => x.id === id);
  if (!e) return d;
  const resto = d.elementos.filter((x) => x.id !== id);
  return { ...d, elementos: para === "frente" ? [...resto, e] : [e, ...resto] };
}

export function conteudo(d: Diagrama): Caixa {
  const caixas = [...d.elementos.map(limites), ...d.conectores.flatMap((c) => (c.pontos ?? []).map(([x, y]) => ({ x, y, w: 0, h: 0 })))];
  if (caixas.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
  const x1 = Math.min(...caixas.map((c) => c.x));
  const y1 = Math.min(...caixas.map((c) => c.y));
  return { x: x1, y: y1, w: Math.max(...caixas.map((c) => c.x + c.w)) - x1, h: Math.max(...caixas.map((c) => c.y + c.h)) - y1 };
}

/** Ajusta a tela ao conteúdo, com margem de 24 px e título. */
export function ajustarTela(d: Diagrama): Diagrama {
  const c = conteudo(d);
  return { ...d, tela: { ...d.tela, largura: Math.max(200, Math.ceil(c.x + c.w + 24)), altura: Math.max(100, Math.ceil(c.y + c.h + 24)) } };
}

const NOS = new Set<Forma>(["caixa", "decisao", "marcador", "nota"]);

/**
 * Organização automática em camadas (RF-14) dos elementos ligados por conectores.
 * Grupos, raias e textos soltos não se movem; conectores entre os nós voltam à rota automática.
 */
export function organizar(d: Diagrama, direcao: "horizontal" | "vertical"): Diagrama {
  const nos = d.elementos.filter((e) => NOS.has(e.forma));
  const ids = new Set(nos.map((e) => e.id));
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direcao === "horizontal" ? "LR" : "TB", nodesep: 40, ranksep: 64, marginx: 24, marginy: 56 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const e of nos) {
    const c = limites(e);
    g.setNode(e.id, { width: c.w, height: c.h });
  }
  for (const c of d.conectores) if (c.de && c.para && ids.has(c.de) && ids.has(c.para)) g.setEdge(c.de, c.para);
  dagre.layout(g);

  const centros = new Map(nos.map((e) => [e.id, g.node(e.id)]));
  const elementos = d.elementos.map((e) => {
    const n = centros.get(e.id);
    if (!n) return e;
    const c = limites(e);
    return deslocar(e, n.x - c.w / 2 - c.x, n.y - c.h / 2 - c.y);
  });
  const conectores = d.conectores.map((c) => (c.de && c.para && ids.has(c.de) && ids.has(c.para) ? { ...c, pontos: undefined } : c));
  return ajustarTela({ ...d, elementos, conectores });
}

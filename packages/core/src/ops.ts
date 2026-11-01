import dagre from "@dagrejs/dagre";
import type { Conector, Diagrama, Elemento, EstiloNomeado } from "./esquema";
import { limites, type Caixa, type Ponto } from "./rotas";
import { camadas, elementoEfetivo } from "./render";
import { FIGURAS, PADROES_FIGURA, ehFigura } from "./figuras";

/** Operações puras sobre o diagrama, usadas pelo editor (cada uma devolve um novo diagrama). */

export type Forma = Elemento["forma"];

const FORMAS_COM_CAIXA: Forma[] = [...FIGURAS, "caixa", "decisao", "grupo", "raia", "nota", "barra", "retangulo"];
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

/** Ids que se movem junto: os próprios, mais o conteúdo de grupos e raias e os textos soltos dentro de caixas. */
export function comConteudo(d: Diagrama, ids: string[]): Set<string> {
  const mover = new Set(ids);
  for (const id of ids) {
    const e = d.elementos.find((x) => x.id === id);
    if (e && (e.forma === "grupo" || e.forma === "raia")) {
      const caixa = limites(e);
      for (const f of d.elementos) if (f.id !== id && dentro(limites(f), caixa)) mover.add(f.id);
      e.forma === "grupo" && e.filhos?.forEach((f) => mover.add(f));
    } else if (e && (e.forma === "caixa" || e.forma === "decisao" || e.forma === "nota")) {
      // Textos soltos que estão dentro da caixa (rótulos de modelos importados) acompanham o movimento.
      const caixa = limites(e);
      for (const f of d.elementos) if (f.forma === "texto" && dentro(limites(f), caixa)) mover.add(f.id);
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

/** Desloca o texto de um conector (dx/dy relativos à posição automática, ou x/y se o rótulo já os fixa). */
export function moverRotulo(d: Diagrama, id: string, dx: number, dy: number): Diagrama {
  return {
    ...d,
    conectores: d.conectores.map((c) => {
      if (c.id !== id || !c.rotulo) return c;
      const r = c.rotulo;
      return { ...c, rotulo: { ...r, dx: (r.dx ?? 0) + dx, dy: (r.dy ?? 0) + dy } };
    }),
  };
}

/** Devolve o texto do conector à posição automática. */
export function reiniciarRotulo(d: Diagrama, id: string): Diagrama {
  return {
    ...d,
    conectores: d.conectores.map((c) => {
      if (c.id !== id || !c.rotulo) return c;
      const { x: _x, y: _y, dx: _dx, dy: _dy, ...resto } = c.rotulo;
      return { ...c, rotulo: resto };
    }),
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
  ...(Object.fromEntries(
    FIGURAS.map((f) => [f, (id: string, x: number, y: number) => ({ id, forma: f, x, y, w: PADROES_FIGURA[f].w, h: PADROES_FIGURA[f].h, texto: PADROES_FIGURA[f].texto })]),
  ) as Record<(typeof FIGURAS)[number], (id: string, x: number, y: number) => Elemento>),
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

/** Ordem de empilhamento: o último do array fica por cima. A ordem relativa dos selecionados é preservada. */
export type ModoOrdem = "frente" | "tras" | "avancar" | "recuar";

export function reordenar(d: Diagrama, ids: string[], modo: ModoOrdem): Diagrama {
  const sel = new Set(ids);
  const arr = [...d.elementos];
  // Cada conector passa a apontar para o último elemento não movido que o precedia, para que
  // "frente"/"trás" valham também em relação aos conectores.
  const seq = camadas(d);
  let ultimo = "";
  const ancora = new Map<string, string>();
  for (const i of seq) {
    if ("forma" in i) {
      if (!sel.has(i.id)) ultimo = i.id;
    } else ancora.set(i.id, ultimo);
  }
  if (modo === "frente") arr.splice(0, arr.length, ...arr.filter((e) => !sel.has(e.id)), ...arr.filter((e) => sel.has(e.id)));
  else if (modo === "tras") arr.splice(0, arr.length, ...arr.filter((e) => sel.has(e.id)), ...arr.filter((e) => !sel.has(e.id)));
  else if (modo === "avancar") {
    for (let i = arr.length - 2; i >= 0; i--) if (sel.has(arr[i].id) && !sel.has(arr[i + 1].id)) [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
  } else {
    for (let i = 1; i < arr.length; i++) if (sel.has(arr[i].id) && !sel.has(arr[i - 1].id)) [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
  }
  return { ...d, elementos: arr, conectores: d.conectores.map((c) => ({ ...c, depois: ancora.get(c.id) })) };
}

/** Muda a camada de um conector: frente/trás (de tudo) ou um elemento acima/abaixo. */
export function reordenarConector(d: Diagrama, id: string, modo: ModoOrdem): Diagrama {
  const c = d.conectores.find((k) => k.id === id);
  if (!c) return d;
  const ids = d.elementos.map((e) => e.id);
  const pos = c.depois === undefined || !ids.includes(c.depois) ? ids.length - 1 : ids.indexOf(c.depois === "" ? "" : c.depois);
  const alvo = modo === "frente" ? ids.length - 1 : modo === "tras" ? -1 : modo === "avancar" ? Math.min(ids.length - 1, pos + 1) : Math.max(-1, pos - 1);
  const depois = modo === "frente" ? undefined : alvo < 0 ? "" : ids[alvo];
  return { ...d, conectores: d.conectores.map((k) => (k.id === id ? { ...k, depois } : k)) };
}

export type ModoAlinhar = "esquerda" | "centro" | "direita" | "topo" | "meio" | "base";

/** Aplica um deslocamento individual a cada elemento (sem arrastar o conteúdo de grupos); conectores ligados voltam à rota automática. */
function deslocarCada(d: Diagrama, deltas: Map<string, [number, number]>): Diagrama {
  return {
    ...d,
    elementos: d.elementos.map((e) => {
      const dl = deltas.get(e.id);
      return dl && (dl[0] !== 0 || dl[1] !== 0) ? deslocar(e, dl[0], dl[1]) : e;
    }),
    conectores: d.conectores.map((c) => {
      const tocou = (c.de && deltas.has(c.de)) || (c.para && deltas.has(c.para));
      return tocou && c.de && c.para && c.pontos ? { ...c, pontos: undefined } : c;
    }),
  };
}

/** Alinha os elementos entre si pelo lado, centro ou meio do conjunto (RF-15). */
export function alinhar(d: Diagrama, ids: string[], modo: ModoAlinhar): Diagrama {
  const alvo = d.elementos.filter((e) => ids.includes(e.id));
  if (alvo.length < 2) return d;
  const caixas = alvo.map((e) => ({ id: e.id, c: limites(e) }));
  const x1 = Math.min(...caixas.map(({ c }) => c.x));
  const x2 = Math.max(...caixas.map(({ c }) => c.x + c.w));
  const y1 = Math.min(...caixas.map(({ c }) => c.y));
  const y2 = Math.max(...caixas.map(({ c }) => c.y + c.h));
  const deltas = new Map<string, [number, number]>();
  for (const { id, c } of caixas) {
    deltas.set(
      id,
      {
        esquerda: [x1 - c.x, 0],
        direita: [x2 - (c.x + c.w), 0],
        centro: [(x1 + x2) / 2 - (c.x + c.w / 2), 0],
        topo: [0, y1 - c.y],
        base: [0, y2 - (c.y + c.h)],
        meio: [0, (y1 + y2) / 2 - (c.y + c.h / 2)],
      }[modo] as [number, number],
    );
  }
  return deslocarCada(d, deltas);
}

/** Distribui três ou mais elementos com espaços iguais entre eles, mantendo os dois extremos. */
export function distribuir(d: Diagrama, ids: string[], eixo: "horizontal" | "vertical"): Diagrama {
  const h = eixo === "horizontal";
  const alvo = d.elementos
    .filter((e) => ids.includes(e.id))
    .map((e) => ({ id: e.id, c: limites(e) }))
    .sort((a, b) => (h ? a.c.x - b.c.x : a.c.y - b.c.y));
  if (alvo.length < 3) return d;
  const tam = (c: Caixa) => (h ? c.w : c.h);
  const ini = (c: Caixa) => (h ? c.x : c.y);
  const ultimo = alvo[alvo.length - 1].c;
  const livre = ini(ultimo) + tam(ultimo) - ini(alvo[0].c) - alvo.reduce((t, { c }) => t + tam(c), 0);
  const passo = livre / (alvo.length - 1);
  const deltas = new Map<string, [number, number]>();
  let cursor = ini(alvo[0].c);
  for (const { id, c } of alvo) {
    deltas.set(id, h ? [cursor - c.x, 0] : [0, cursor - c.y]);
    cursor += tam(c) + passo;
  }
  return deslocarCada(d, deltas);
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
  const k = d.tela.escala ?? 1;
  return { ...d, tela: { ...d.tela, largura: Math.max(200, Math.ceil((c.x + c.w + 24) * k)), altura: Math.max(100, Math.ceil((c.y + c.h + 24) * k)) } };
}

export type ModoTamanho = "escalar" | "manter";

/**
 * Muda o tamanho da tela. "escalar" amplia ou reduz todo o desenho (formas, textos, linhas) junto,
 * pelo menor dos fatores de largura e altura, para a proporção das formas não deformar; "manter" só muda a tela.
 */
export function redimensionarTela(d: Diagrama, largura: number, altura: number, modo: ModoTamanho): Diagrama {
  const L = Math.max(1, Math.round(largura));
  const A = Math.max(1, Math.round(altura));
  if (modo === "manter") return { ...d, tela: { ...d.tela, largura: L, altura: A } };
  const fator = Math.min(L / d.tela.largura, A / d.tela.altura);
  const escala = +((d.tela.escala ?? 1) * fator).toFixed(4);
  return { ...d, tela: { ...d.tela, largura: L, altura: A, escala: Math.abs(escala - 1) < 0.0001 ? undefined : escala } };
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

/** Campos de aparência que "copiar estilo" leva de um elemento a outros. */
export const CAMPOS_ESTILO = ["estilo", "cor", "contorno", "preenchimento", "corTexto", "espessura", "traco", "fonte", "italico", "fundo", "raio", "tamanho", "negrito", "estiloNome"] as const;
export type EstiloCopiado = Partial<Record<(typeof CAMPOS_ESTILO)[number], unknown>>;

export function estiloDe(e: Elemento): EstiloCopiado {
  const origem = e as unknown as Record<string, unknown>;
  return Object.fromEntries(CAMPOS_ESTILO.filter((k) => origem[k] !== undefined).map((k) => [k, origem[k]]));
}

/** Aplica um estilo copiado; os campos que o estilo não tem são limpos, para o resultado ser idêntico ao original. */
export function aplicarEstilo(d: Diagrama, ids: string[], estilo: EstiloCopiado): Diagrama {
  const alvo = new Set(ids);
  return {
    ...d,
    elementos: d.elementos.map((e) => {
      if (!alvo.has(e.id)) return e;
      const novo = { ...(e as unknown as Record<string, unknown>) };
      for (const k of CAMPOS_ESTILO) {
        if (k in estilo) novo[k] = estilo[k];
        else delete novo[k];
      }
      return novo as unknown as Elemento;
    }),
  };
}

/** Remove todos os ajustes de aparência: o elemento volta ao estilo e ao tema. */
export function limparEstilo(d: Diagrama, ids: string[]): Diagrama {
  return aplicarEstilo(d, ids, {});
}

/** Cria ou atualiza um estilo nomeado do diagrama. */
export function definirEstilo(d: Diagrama, nome: string, def: EstiloNomeado): Diagrama {
  return { ...d, estilos: { ...d.estilos, [nome]: def } };
}

/** Aplica o estilo nomeado: os ajustes próprios dos elementos são limpos para o estilo valer por inteiro. */
export function aplicarEstiloNomeado(d: Diagrama, ids: string[], nome: string): Diagrama {
  const limpo = aplicarEstilo(d, ids, {});
  const alvo = new Set(ids);
  return { ...limpo, elementos: limpo.elementos.map((e) => (alvo.has(e.id) ? ({ ...e, estiloNome: nome } as Elemento) : e)) };
}

/** Tira o nome do estilo dos elementos, mantendo a aparência que ele dava. */
export function desvincularEstilo(d: Diagrama, ids: string[]): Diagrama {
  const alvo = new Set(ids);
  return {
    ...d,
    elementos: d.elementos.map((e) => {
      if (!alvo.has(e.id) || !e.estiloNome) return e;
      const { estiloNome, ...resto } = elementoEfetivo(e, d) as Elemento & { estiloNome?: string };
      void estiloNome;
      return resto as Elemento;
    }),
  };
}

/** Remove o estilo do diagrama; quem o usava mantém a aparência (fica desvinculado). */
export function removerEstilo(d: Diagrama, nome: string): Diagrama {
  const usados = d.elementos.filter((e) => e.estiloNome === nome).map((e) => e.id);
  const sem = desvincularEstilo(d, usados);
  const { [nome]: _removido, ...resto } = sem.estilos ?? {};
  return { ...sem, estilos: Object.keys(resto).length ? resto : undefined };
}

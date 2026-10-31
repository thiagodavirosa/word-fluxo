import type { Diagrama, Elemento, Lado } from "./esquema";
import { ancora, limites, pontosDoConector, type Caixa, type LadoFixo, type Ponto } from "./rotas";

export type Extremidade = "de" | "para";

const LIGAVEIS: Elemento["forma"][] = ["caixa", "decisao", "marcador", "nota", "grupo", "raia", "retangulo", "barra"];
const LADOS: LadoFixo[] = ["cima", "baixo", "esquerda", "direita"];

export interface EstadoConector {
  id: string;
  de: boolean;
  para: boolean;
}

const existe = (d: Diagrama, id?: string) => !!id && d.elementos.some((e) => e.id === id);

/** Conectores com alguma ponta que não está presa a um elemento (mesmo que pareça estar no desenho). */
export function desconectados(d: Diagrama): EstadoConector[] {
  return d.conectores
    .map((c) => ({ id: c.id, de: existe(d, c.de), para: existe(d, c.para) }))
    .filter((e) => !e.de || !e.para);
}

export function ladoMaisProximo(c: Caixa, p: Ponto): LadoFixo {
  const dist: Record<LadoFixo, number> = {
    esquerda: Math.abs(p[0] - c.x),
    direita: Math.abs(p[0] - (c.x + c.w)),
    cima: Math.abs(p[1] - c.y),
    baixo: Math.abs(p[1] - (c.y + c.h)),
  };
  return LADOS.reduce((a, b) => (dist[b] < dist[a] ? b : a));
}

/** Elemento ligável sob o ponto (o menor, para preferir a caixa ao grupo que a contém). */
export function elementoNoPonto(d: Diagrama, x: number, y: number, folga = 6, ignorar: string[] = []): Elemento | undefined {
  return d.elementos
    .filter((e) => LIGAVEIS.includes(e.forma) && !ignorar.includes(e.id))
    .map((e) => ({ e, c: limites(e) }))
    .filter(({ c }) => x >= c.x - folga && x <= c.x + c.w + folga && y >= c.y - folga && y <= c.y + c.h + folga)
    .sort((a, b) => a.c.w * a.c.h - b.c.w * b.c.h)[0]?.e;
}

/** Prende uma ponta do conector a um elemento, no lado mais próximo do ponto (ou no lado dado). */
export function ligarExtremidade(d: Diagrama, id: string, ponta: Extremidade, elId: string, ponto?: Ponto, ladoFixo?: Lado): Diagrama {
  const el = d.elementos.find((e) => e.id === elId);
  const c = d.conectores.find((k) => k.id === id);
  if (!el || !c) return d;
  const caixa = limites(el);
  const pts = pontosDoConector(d, c);
  const ref: Ponto = ponto ?? (ponta === "de" ? pts[0] : pts[pts.length - 1]) ?? [caixa.x, caixa.y];
  const l: Lado = ladoFixo ?? ladoMaisProximo(caixa, ref);
  const novo = { ...c, [ponta]: elId, [ponta === "de" ? "ladoDe" : "ladoPara"]: l };
  const ligadoNosDois = existe(d, novo.de) && existe(d, novo.para);
  let pontos = novo.pontos;
  if (ligadoNosDois) pontos = undefined;
  else if (pontos && l !== "auto") {
    const ac = ancora(caixa, l);
    pontos = ponta === "de" ? [ac, ...pontos.slice(1)] : [...pontos.slice(0, -1), ac];
  }
  return { ...d, conectores: d.conectores.map((k) => (k.id === id ? { ...novo, pontos } : k)) };
}

/** Solta uma ponta e a leva ao ponto dado; o conector passa a ter rota manual. */
export function moverExtremidade(d: Diagrama, id: string, ponta: Extremidade, x: number, y: number): Diagrama {
  const c = d.conectores.find((k) => k.id === id);
  if (!c) return d;
  const antes = pontosDoConector(d, c);
  const pts = antes.map((p) => [...p] as Ponto);
  if (pts.length < 2) return d;
  const k = ponta === "de" ? 0 : pts.length - 1;
  const v = ponta === "de" ? 1 : pts.length - 2;
  pts[k] = [x, y];
  // Mantém os ângulos retos: o ponto vizinho acompanha no eixo que compartilhava com a ponta.
  if (pts.length > 2) {
    if (antes[v][0] === antes[k][0]) pts[v] = [x, pts[v][1]];
    else if (antes[v][1] === antes[k][1]) pts[v] = [pts[v][0], y];
  }
  const solto = { ...c, [ponta]: undefined, [ponta === "de" ? "ladoDe" : "ladoPara"]: undefined, pontos: pts };
  return { ...d, conectores: d.conectores.map((q) => (q.id === id ? solto : q)) };
}

/** Religa pontas soltas que estão encostadas (até `tol` px) em algum elemento. Sem `id`, trata todos. */
export function ligarPorProximidade(d: Diagrama, id?: string, tol = 10): { diagrama: Diagrama; ligadas: number } {
  let atual = d;
  let ligadas = 0;
  for (const c of d.conectores) {
    if (id && c.id !== id) continue;
    for (const ponta of ["de", "para"] as Extremidade[]) {
      const cc = atual.conectores.find((k) => k.id === c.id)!;
      if (existe(atual, cc[ponta])) continue;
      const pts = pontosDoConector(atual, cc);
      const p = ponta === "de" ? pts[0] : pts[pts.length - 1];
      if (!p) continue;
      const outro = ponta === "de" ? cc.para : cc.de;
      const el = elementoNoPonto(atual, p[0], p[1], tol, outro ? [outro] : []);
      if (!el) continue;
      atual = ligarExtremidade(atual, c.id, ponta, el.id, p);
      ligadas++;
    }
  }
  return { diagrama: atual, ligadas };
}

/** Arrasta um trecho interno de uma rota em ângulos retos, perpendicularmente a ele. */
export function moverSegmento(d: Diagrama, id: string, i: number, dx: number, dy: number): Diagrama {
  const c = d.conectores.find((k) => k.id === id);
  if (!c) return d;
  const pts = pontosDoConector(d, c).map((p) => [...p] as Ponto);
  if (i < 1 || i + 1 > pts.length - 2) return d;
  if (pts[i][1] === pts[i + 1][1]) {
    pts[i][1] += dy;
    pts[i + 1][1] += dy;
  } else {
    pts[i][0] += dx;
    pts[i + 1][0] += dx;
  }
  return { ...d, conectores: d.conectores.map((k) => (k.id === id ? { ...k, pontos: pts } : k)) };
}

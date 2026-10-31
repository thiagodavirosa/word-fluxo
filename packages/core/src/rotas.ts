import type { Diagrama, Elemento } from "./esquema";

export type Ponto = [number, number];
export interface Caixa {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Retângulo envolvente de um elemento com geometria própria (usado pelo roteamento dos conectores). */
export function limites(e: Elemento): Caixa | null {
  switch (e.forma) {
    case "marcador": {
      const r = e.raio ?? 11;
      return { x: e.x - r, y: e.y - r, w: 2 * r, h: 2 * r };
    }
    case "texto":
      return null;
    case "linha":
      return { x: Math.min(e.x1, e.x2), y: Math.min(e.y1, e.y2), w: Math.abs(e.x2 - e.x1), h: Math.abs(e.y2 - e.y1) };
    default:
      return { x: e.x, y: e.y, w: e.w, h: e.h };
  }
}

/**
 * Rota automática entre duas caixas: lado de saída e de chegada pela direção dominante,
 * com um cotovelo no meio quando os centros não estão alinhados (RF-13).
 */
export function rotaAuto(a: Caixa, b: Caixa): Ponto[] {
  const ca: Ponto = [a.x + a.w / 2, a.y + a.h / 2];
  const cb: Ponto = [b.x + b.w / 2, b.y + b.h / 2];
  const dx = cb[0] - ca[0];
  const dy = cb[1] - ca[1];

  if (Math.abs(dx) >= Math.abs(dy)) {
    const p1: Ponto = [dx >= 0 ? a.x + a.w : a.x, ca[1]];
    const p2: Ponto = [dx >= 0 ? b.x : b.x + b.w, cb[1]];
    if (p1[1] === p2[1]) return [p1, p2];
    const mx = (p1[0] + p2[0]) / 2;
    return [p1, [mx, p1[1]], [mx, p2[1]], p2];
  }
  const p1: Ponto = [ca[0], dy >= 0 ? a.y + a.h : a.y];
  const p2: Ponto = [cb[0], dy >= 0 ? b.y : b.y + b.h];
  if (p1[0] === p2[0]) return [p1, p2];
  const my = (p1[1] + p2[1]) / 2;
  return [p1, [p1[0], my], [p2[0], my], p2];
}

export function pontosDoConector(d: Diagrama, c: Diagrama["conectores"][number]): Ponto[] {
  if (c.pontos) return c.pontos as Ponto[];
  const a = d.elementos.find((e) => e.id === c.de);
  const b = d.elementos.find((e) => e.id === c.para);
  const la = a && limites(a);
  const lb = b && limites(b);
  return la && lb ? rotaAuto(la, lb) : [];
}

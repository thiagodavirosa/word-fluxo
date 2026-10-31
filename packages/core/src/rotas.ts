import type { Diagrama, Elemento, Lado } from "./esquema";
import { estimarLargura } from "./medidas";

export type Ponto = [number, number];
export interface Caixa {
  x: number;
  y: number;
  w: number;
  h: number;
}
export type LadoFixo = Exclude<Lado, "auto">;

/** Retângulo envolvente de um elemento (roteamento, seleção e movimento). Texto livre usa uma estimativa. */
export function limites(e: Elemento): Caixa {
  switch (e.forma) {
    case "marcador": {
      const r = e.raio ?? 11;
      return { x: e.x - r, y: e.y - r, w: 2 * r, h: 2 * r };
    }
    case "texto": {
      const tam = e.tamanho ?? 13;
      const linhas = e.texto.split("\n");
      const w = Math.max(...linhas.map((l) => estimarLargura(l, tam, !!e.negrito)), 8);
      const x = e.alinhamento === "meio" ? e.x - w / 2 : e.alinhamento === "fim" ? e.x - w : e.x;
      return { x, y: e.y - tam, w, h: tam * 1.3 + (linhas.length - 1) * (e.espacamento ?? 15) };
    }
    case "linha":
      return { x: Math.min(e.x1, e.x2), y: Math.min(e.y1, e.y2), w: Math.abs(e.x2 - e.x1), h: Math.abs(e.y2 - e.y1) };
    default:
      return { x: e.x, y: e.y, w: e.w, h: e.h };
  }
}

export const ancora = (c: Caixa, lado: LadoFixo): Ponto =>
  ({
    cima: [c.x + c.w / 2, c.y],
    baixo: [c.x + c.w / 2, c.y + c.h],
    esquerda: [c.x, c.y + c.h / 2],
    direita: [c.x + c.w, c.y + c.h / 2],
  })[lado] as Ponto;

export const saida: Record<LadoFixo, Ponto> = { cima: [0, -1], baixo: [0, 1], esquerda: [-1, 0], direita: [1, 0] };
const horizontal = (l: LadoFixo) => l === "esquerda" || l === "direita";

/** Lados escolhidos quando o autor não fixa nenhum: direção dominante entre os centros. */
export function ladosAuto(a: Caixa, b: Caixa): [LadoFixo, LadoFixo] {
  const dx = b.x + b.w / 2 - (a.x + a.w / 2);
  const dy = b.y + b.h / 2 - (a.y + a.h / 2);
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? ["direita", "esquerda"] : ["esquerda", "direita"];
  return dy >= 0 ? ["baixo", "cima"] : ["cima", "baixo"];
}

/** Remove pontos repetidos e intermediários colineares. */
function simplificar(pts: Ponto[]): Ponto[] {
  const sem = pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
  return sem.filter((p, i) => {
    if (i === 0 || i === sem.length - 1) return true;
    const [a, c] = [sem[i - 1], sem[i + 1]];
    return !((a[0] === p[0] && p[0] === c[0]) || (a[1] === p[1] && p[1] === c[1]));
  });
}

/**
 * Rota ortogonal entre duas caixas (RF-13). Sem lados fixos reproduz o roteamento padrão;
 * com lados fixos sai perpendicular ao lado escolhido, com um pequeno trecho reto de saída quando necessário.
 */
export function rotaAuto(a: Caixa, b: Caixa, ladoA: Lado = "auto", ladoB: Lado = "auto"): Ponto[] {
  const [autoA, autoB] = ladosAuto(a, b);
  const la: LadoFixo = ladoA === "auto" ? autoA : ladoA;
  const lb: LadoFixo = ladoB === "auto" ? autoB : ladoB;
  const p1 = ancora(a, la);
  const p2 = ancora(b, lb);
  const d1 = saida[la];
  const d2 = saida[lb];

  // Lados de frente um para o outro: sem trechos de saída.
  const emFrente = d1[0] === -d2[0] && d1[1] === -d2[1] && (p2[0] - p1[0]) * d1[0] + (p2[1] - p1[1]) * d1[1] > 0;
  const trecho = emFrente ? 0 : 20;
  const s1: Ponto = [p1[0] + d1[0] * trecho, p1[1] + d1[1] * trecho];
  const s2: Ponto = [p2[0] + d2[0] * trecho, p2[1] + d2[1] * trecho];

  let meio: Ponto[];
  if (horizontal(la) && horizontal(lb)) {
    const mx = (s1[0] + s2[0]) / 2;
    meio = [[mx, s1[1]], [mx, s2[1]]];
  } else if (!horizontal(la) && !horizontal(lb)) {
    const my = (s1[1] + s2[1]) / 2;
    meio = [[s1[0], my], [s2[0], my]];
  } else {
    meio = [horizontal(la) ? [s2[0], s1[1]] : [s1[0], s2[1]]];
  }
  return simplificar([p1, s1, ...meio, s2, p2]);
}

/** Extremos e pontos de controle da curva entre duas caixas (Bézier cúbica saindo perpendicular aos lados). */
export function rotaCurva(a: Caixa, b: Caixa, ladoA: Lado = "auto", ladoB: Lado = "auto"): [Ponto, Ponto, Ponto, Ponto] {
  const [autoA, autoB] = ladosAuto(a, b);
  const la: LadoFixo = ladoA === "auto" ? autoA : ladoA;
  const lb: LadoFixo = ladoB === "auto" ? autoB : ladoB;
  const p1 = ancora(a, la);
  const p2 = ancora(b, lb);
  const k = Math.max(30, Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 2);
  return [p1, [p1[0] + saida[la][0] * k, p1[1] + saida[la][1] * k], [p2[0] + saida[lb][0] * k, p2[1] + saida[lb][1] * k], p2];
}

export function pontosDoConector(d: Diagrama, c: Diagrama["conectores"][number]): Ponto[] {
  if (c.pontos) return c.pontos as Ponto[];
  const a = d.elementos.find((e) => e.id === c.de);
  const b = d.elementos.find((e) => e.id === c.para);
  if (!a || !b) return [];
  if (c.rota === "reta" || c.rota === "curva") {
    const [p1, , , p2] = rotaCurva(limites(a), limites(b), c.ladoDe, c.ladoPara);
    return [p1, p2];
  }
  return rotaAuto(limites(a), limites(b), c.ladoDe, c.ladoPara);
}

/** Controles da Bézier quando o conector é curvo e está ligado nos dois lados (senão, null). */
export function controlesDaCurva(d: Diagrama, c: Diagrama["conectores"][number]): [Ponto, Ponto] | null {
  if (c.rota !== "curva" || c.pontos) return null;
  const a = d.elementos.find((e) => e.id === c.de);
  const b = d.elementos.find((e) => e.id === c.para);
  if (!a || !b) return null;
  const [, c1, c2] = rotaCurva(limites(a), limites(b), c.ladoDe, c.ladoPara);
  return [c1, c2];
}

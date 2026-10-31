/**
 * Formas geométricas e de fluxograma (conjunto inspirado nas formas do Miro): cada uma ocupa um retângulo
 * x/y/w/h, aceita texto e os mesmos ajustes de aparência da caixa.
 */
export const FIGURAS = [
  "terminador",
  "documento",
  "dados",
  "cilindro",
  "predefinido",
  "elipse",
  "triangulo",
  "hexagono",
  "octogono",
  "pentagono",
  "trapezio",
  "estrela",
  "cruz",
  "nuvem",
  "seta",
  "setaEsquerda",
  "setaDupla",
  "chaveEsquerda",
  "chaveDireita",
  "balao",
] as const;
export type Figura = (typeof FIGURAS)[number];

export const ehFigura = (forma: string): forma is Figura => (FIGURAS as readonly string[]).includes(forma);

/** Nome, tamanho e texto iniciais de cada figura. */
export const PADROES_FIGURA: Record<Figura, { nome: string; w: number; h: number; texto: string; vazada?: boolean }> = {
  terminador: { nome: "Terminador", w: 130, h: 44, texto: "Início" },
  documento: { nome: "Documento", w: 130, h: 64, texto: "Documento" },
  dados: { nome: "Dados", w: 140, h: 52, texto: "Dados" },
  cilindro: { nome: "Repositório", w: 100, h: 80, texto: "Base" },
  predefinido: { nome: "Processo definido", w: 150, h: 52, texto: "Subprocesso" },
  elipse: { nome: "Elipse", w: 130, h: 70, texto: "" },
  triangulo: { nome: "Triângulo", w: 100, h: 90, texto: "" },
  hexagono: { nome: "Hexágono", w: 130, h: 70, texto: "Preparação" },
  octogono: { nome: "Octógono", w: 100, h: 100, texto: "Pare" },
  pentagono: { nome: "Pentágono", w: 110, h: 100, texto: "" },
  trapezio: { nome: "Trapézio", w: 140, h: 60, texto: "Manual" },
  estrela: { nome: "Estrela", w: 100, h: 96, texto: "" },
  cruz: { nome: "Cruz", w: 90, h: 90, texto: "" },
  nuvem: { nome: "Nuvem", w: 150, h: 90, texto: "Externo" },
  seta: { nome: "Seta à direita", w: 150, h: 60, texto: "" },
  setaEsquerda: { nome: "Seta à esquerda", w: 150, h: 60, texto: "" },
  setaDupla: { nome: "Seta dupla", w: 170, h: 60, texto: "" },
  chaveEsquerda: { nome: "Chave esquerda", w: 28, h: 140, texto: "", vazada: true },
  chaveDireita: { nome: "Chave direita", w: 28, h: 140, texto: "", vazada: true },
  balao: { nome: "Balão", w: 160, h: 60, texto: "Comentário" },
};

type Pt = [number, number];
const poligono = (pts: Pt[]) => pts.map(([x, y]) => `${+x.toFixed(2)},${+y.toFixed(2)}`).join(" ");
const n = (v: number) => +v.toFixed(2);

function estrela(x: number, y: number, w: number, h: number): Pt[] {
  const cx = x + w / 2;
  const cy = y + h * 0.54;
  const pts: Pt[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 0.5 : 0.21;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push([cx + Math.cos(a) * r * w * 1.0, cy + Math.sin(a) * r * h * 1.0 * (i % 2 === 0 ? 0.96 : 1)]);
  }
  return pts;
}

/** Deslocamento vertical do texto dentro da figura (o centro visual do triângulo e do pentágono é mais baixo). */
export function ajusteTextoFigura(f: Figura, h: number): number {
  return f === "triangulo" ? h * 0.16 : f === "pentagono" ? h * 0.06 : f === "documento" ? -h * 0.06 : 0;
}

/** Marcação SVG do contorno da figura; `attrs` traz fill/stroke já montados pelo renderizador. */
export function desenharFigura(f: Figura, x: number, y: number, w: number, h: number, attrs: string, raioPadrao: number): string {
  const L = x + w;
  const B = y + h;
  switch (f) {
    case "terminador":
      return `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(h / 2)}" ${attrs}/>`;
    case "elipse":
      return `<ellipse cx="${n(x + w / 2)}" cy="${n(y + h / 2)}" rx="${n(w / 2)}" ry="${n(h / 2)}" ${attrs}/>`;
    case "dados":
      return `<polygon points="${poligono([[x + w * 0.18, y], [L, y], [L - w * 0.18, B], [x, B]])}" ${attrs}/>`;
    case "trapezio":
      return `<polygon points="${poligono([[x + w * 0.18, y], [L - w * 0.18, y], [L, B], [x, B]])}" ${attrs}/>`;
    case "triangulo":
      return `<polygon points="${poligono([[x + w / 2, y], [L, B], [x, B]])}" ${attrs}/>`;
    case "hexagono":
      return `<polygon points="${poligono([[x + w * 0.22, y], [L - w * 0.22, y], [L, y + h / 2], [L - w * 0.22, B], [x + w * 0.22, B], [x, y + h / 2]])}" ${attrs}/>`;
    case "octogono": {
      const c = Math.min(w, h) * 0.29;
      return `<polygon points="${poligono([[x + c, y], [L - c, y], [L, y + c], [L, B - c], [L - c, B], [x + c, B], [x, B - c], [x, y + c]])}" ${attrs}/>`;
    }
    case "pentagono":
      return `<polygon points="${poligono([[x + w / 2, y], [L, y + h * 0.38], [L - w * 0.18, B], [x + w * 0.18, B], [x, y + h * 0.38]])}" ${attrs}/>`;
    case "estrela":
      return `<polygon points="${poligono(estrela(x, y, w, h))}" ${attrs}/>`;
    case "cruz": {
      const a = Math.min(w, h) / 3;
      const cx = x + w / 2;
      const cy = y + h / 2;
      return `<polygon points="${poligono([[cx - a / 2, y], [cx + a / 2, y], [cx + a / 2, cy - a / 2], [L, cy - a / 2], [L, cy + a / 2], [cx + a / 2, cy + a / 2], [cx + a / 2, B], [cx - a / 2, B], [cx - a / 2, cy + a / 2], [x, cy + a / 2], [x, cy - a / 2], [cx - a / 2, cy - a / 2]])}" ${attrs}/>`;
    }
    case "cilindro": {
      const ry = Math.min(h * 0.16, 22);
      const rx = w / 2;
      return (
        `<path d="M${n(x)} ${n(y + ry)}A${n(rx)} ${n(ry)} 0 0 1 ${n(L)} ${n(y + ry)}V${n(B - ry)}A${n(rx)} ${n(ry)} 0 0 1 ${n(x)} ${n(B - ry)}Z" ${attrs}/>` +
        `<path d="M${n(x)} ${n(y + ry)}A${n(rx)} ${n(ry)} 0 0 0 ${n(L)} ${n(y + ry)}" ${attrs.replace(/fill="[^"]*"/, 'fill="none"').replace(/ fill-opacity="[^"]*"/, "")}/>`
      );
    }
    case "predefinido": {
      const d = Math.min(w * 0.1, 14);
      return (
        `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" ${attrs}/>` +
        `<path d="M${n(x + d)} ${n(y)}V${n(B)}M${n(L - d)} ${n(y)}V${n(B)}" ${attrs.replace(/fill="[^"]*"/, 'fill="none"').replace(/ fill-opacity="[^"]*"/, "")}/>`
      );
    }
    case "documento": {
      const o = Math.min(h * 0.14, 12);
      return `<path d="M${n(x)} ${n(y)}H${n(L)}V${n(B - o)}C${n(x + w * 0.75)} ${n(B - o * 2.2)} ${n(x + w * 0.6)} ${n(B + o * 0.2)} ${n(x + w / 2)} ${n(B - o)}S${n(x + w * 0.2)} ${n(B - o * 2)} ${n(x)} ${n(B - o)}Z" ${attrs}/>`;
    }
    case "nuvem": {
      // Nuvem desenhada numa grade 100x60 e escalada; a espessura da linha não escala.
      const d = "M25 50C10 50 2 40 6 30C0 20 10 8 24 12C28 2 46 -2 54 8C62 -2 82 2 84 16C98 14 104 32 94 38C100 50 88 58 76 52C68 60 50 60 44 52C38 58 30 56 25 50Z";
      return `<path d="${d}" transform="translate(${n(x)} ${n(y + h * 0.02)}) scale(${n(w / 100)} ${n((h * 0.96) / 60)})" vector-effect="non-scaling-stroke" ${attrs}/>`;
    }
    case "seta":
      return `<polygon points="${poligono([[x, y + h * 0.26], [x + w * 0.62, y + h * 0.26], [x + w * 0.62, y], [L, y + h / 2], [x + w * 0.62, B], [x + w * 0.62, B - h * 0.26], [x, B - h * 0.26]])}" ${attrs}/>`;
    case "setaEsquerda":
      return `<polygon points="${poligono([[L, y + h * 0.26], [x + w * 0.38, y + h * 0.26], [x + w * 0.38, y], [x, y + h / 2], [x + w * 0.38, B], [x + w * 0.38, B - h * 0.26], [L, B - h * 0.26]])}" ${attrs}/>`;
    case "setaDupla":
      return `<polygon points="${poligono([[x, y + h / 2], [x + w * 0.22, y], [x + w * 0.22, y + h * 0.26], [L - w * 0.22, y + h * 0.26], [L - w * 0.22, y], [L, y + h / 2], [L - w * 0.22, B], [L - w * 0.22, B - h * 0.26], [x + w * 0.22, B - h * 0.26], [x + w * 0.22, B]])}" ${attrs}/>`;
    case "chaveEsquerda":
    case "chaveDireita": {
      const dir = f === "chaveDireita";
      const px = (t: number) => n(dir ? x + w * t : L - w * t);
      const d =
        `M${px(0)} ${n(y)}Q${px(0.5)} ${n(y)} ${px(0.5)} ${n(y + h * 0.15)}V${n(y + h * 0.4)}Q${px(0.5)} ${n(y + h * 0.5)} ${px(1)} ${n(y + h * 0.5)}` +
        `Q${px(0.5)} ${n(y + h * 0.5)} ${px(0.5)} ${n(y + h * 0.6)}V${n(y + h * 0.85)}Q${px(0.5)} ${n(B)} ${px(0)} ${n(B)}`;
      return `<path d="${d}" ${attrs.replace(/fill="[^"]*"/, 'fill="none"').replace(/ fill-opacity="[^"]*"/, "")}/>`;
    }
    case "balao": {
      const cauda = Math.min(h * 0.4, 22);
      return `<path d="M${n(x)} ${n(y)}H${n(L)}V${n(B)}H${n(x + w * 0.42)}L${n(x + w * 0.26)} ${n(B + cauda)}L${n(x + w * 0.22)} ${n(B)}H${n(x)}Z" ${attrs}/>`;
    }
  }
  void raioPadrao;
}

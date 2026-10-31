/** Tema "Técnico" (item 7.4 dos requisitos). Todo o visual vem daqui, para trocar o tema do documento de uma vez. */
export interface Tema {
  nome: string;
  fonte: string;
  linha: string;
  destaque: string;
  texto: string;
  textoSec: string;
  textoInverso: string;
  fundoGrupo: string;
  fundo: string;
  espLinha: number;
  espDestaque: number;
  raio: number;
  raioPequeno: number;
  tamTitulo: number;
  tamRotulo: number;
  tamSub: number;
  tracejado: string;
}

export const tecnico: Tema = {
  nome: "tecnico",
  fonte: "Arial, Helvetica, sans-serif",
  linha: "#8a949c",
  destaque: "#2f6fdc",
  texto: "#1d2a33",
  textoSec: "#56636d",
  textoInverso: "white",
  fundoGrupo: "#f1f0ec",
  fundo: "#ffffff",
  espLinha: 1.25,
  espDestaque: 2,
  raio: 8,
  raioPequeno: 6,
  tamTitulo: 15,
  tamRotulo: 13,
  tamSub: 11.5,
  tracejado: "4 3",
};

/** Tema para impressão em preto e branco (RF-52): sem azul, destaque por traço escuro e fundo cinza claro. */
export const monocromatico: Tema = {
  ...tecnico,
  nome: "monocromatico",
  linha: "#5f6368",
  destaque: "#1a1a1a",
  texto: "#000000",
  textoSec: "#3c4043",
  fundoGrupo: "#ececec",
};

export const temas: Record<string, Tema> = { tecnico, monocromatico };
export const NOMES_TEMAS: [string, string][] = [
  ["tecnico", "Técnico (padrão)"],
  ["monocromatico", "Monocromático (impressão)"],
];

/** Tema "Técnico" (item 7.4 dos requisitos). Todo o visual vem daqui, para trocar o tema do documento de uma vez. */
export interface Tema {
  nome: string;
  fonte: string;
  linha: string;
  destaque: string;
  texto: string;
  textoSec: string;
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

export const temas: Record<string, Tema> = { tecnico };

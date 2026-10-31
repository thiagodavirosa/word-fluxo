import type { Diagrama, Elemento } from "./esquema";

/** Largura aproximada de texto Arial (sem medir fontes): suficiente para avisar de estouro e quebrar linhas. */
export function estimarLargura(texto: string, tamanho: number, negrito = false): number {
  return texto.length * tamanho * (negrito ? 0.56 : 0.5);
}

/** Quebra o texto em linhas que caibam em `larguraMax` (RF-20). Preserva quebras existentes. */
export function quebrarLinhas(texto: string, larguraMax: number, tamanho: number, negrito = false): string {
  return texto
    .split("\n")
    .flatMap((paragrafo) => {
      const saida: string[] = [];
      let atual = "";
      for (const palavra of paragrafo.split(/\s+/).filter(Boolean)) {
        const tentativa = atual ? `${atual} ${palavra}` : palavra;
        if (atual && estimarLargura(tentativa, tamanho, negrito) > larguraMax) {
          saida.push(atual);
          atual = palavra;
        } else atual = tentativa;
      }
      saida.push(atual);
      return saida;
    })
    .join("\n");
}

export interface Aviso {
  id: string;
  mensagem: string;
}

function areaUtil(e: Elemento): { w: number; h: number; tam: number; negrito: boolean } | null {
  if (e.forma === "caixa") return { w: e.w - 16, h: e.h - 8, tam: e.tamanho ?? 13, negrito: !!(e.negrito ?? e.subtitulo) };
  if (e.forma === "nota") return { w: e.w - 16, h: e.h - 8, tam: 13, negrito: false };
  if (e.forma === "decisao") return { w: e.w * 0.6, h: e.h * 0.7, tam: e.tamanho ?? 13, negrito: false };
  return null;
}

/** Textos que não cabem na caixa (RF-20). */
export function avisosDeTexto(d: Diagrama): Aviso[] {
  const base = d.tela.fonteBase ?? 13;
  const avisos: Aviso[] = [];
  for (const e of d.elementos) {
    const area = areaUtil(e);
    if (!area || !("texto" in e) || !e.texto) continue;
    const tam = ("tamanho" in e && e.tamanho) || base;
    const linhas = e.texto.split("\n");
    const sub = e.forma === "caixa" && e.subtitulo ? e.subtitulo.split("\n").length : 0;
    const larguraMax = Math.max(...linhas.map((l) => estimarLargura(l, tam, area.negrito)));
    if (larguraMax > area.w) avisos.push({ id: e.id, mensagem: `Texto mais largo que a caixa (${Math.round(larguraMax)} > ${Math.round(area.w)})` });
    else if ((linhas.length + sub) * 15 > area.h + 8) avisos.push({ id: e.id, mensagem: "Texto mais alto que a caixa" });
  }
  return avisos;
}
